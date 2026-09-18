import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { Modal, Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useReducedMotion } from "@/shared/lib/useReducedMotion";
import { breakpoints, sizing, spacing } from "@/shared/config/tokens";
import {
  attachEscapeListener,
  focusSheetPanel,
  returnFocusTo,
  sheetPanelA11yProps,
} from "@/shared/platform/sheetA11y";

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  /** The dialog's accessible name — home.design.md passes the module's `title`. */
  accessibilityLabel: string;
  children: ReactNode;
  /** Focus returns here (native a11y focus / web `.focus()`) when the sheet closes. */
  returnFocusRef?: RefObject<View | null>;
  className?: string;
}

/**
 * A modal panel (home.design.md §Composition, new primitives): pinned to the
 * bottom and full-width below `breakpoints.wide`, centred with a capped
 * width at and above it.
 *
 * Built on RN's `Modal` — `react-native-web` supports it, so no new
 * dependency. The scrim, focus handling, and Escape/back-button close all
 * live here; `ModuleCircle`'s content is the only thing a caller supplies.
 */
export function Sheet({
  visible,
  onClose,
  accessibilityLabel,
  children,
  returnFocusRef,
  className = "",
}: SheetProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const isWide = width >= breakpoints.wide;

  const panelRef = useRef<View>(null);
  const scrimOpacity = useSharedValue(0);
  const panelProgress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      if (reducedMotion) {
        scrimOpacity.value = 1;
        panelProgress.value = 1;
      } else {
        scrimOpacity.value = withTiming(1, { duration: 200 });
        panelProgress.value = withTiming(1, { duration: 240 });
      }
      // Wait one tick so the panel has mounted before assistive tech is
      // told to focus it.
      const id = setTimeout(() => focusSheetPanel(panelRef), 0);
      return () => clearTimeout(id);
    }

    if (reducedMotion) {
      scrimOpacity.value = 0;
      panelProgress.value = 0;
    } else {
      scrimOpacity.value = withTiming(0, { duration: 150 });
      panelProgress.value = withTiming(0, { duration: 150 });
    }
    returnFocusTo(returnFocusRef);
    return undefined;
  }, [visible, reducedMotion, scrimOpacity, panelProgress, returnFocusRef]);

  useEffect(() => {
    if (!visible) return undefined;
    return attachEscapeListener(onClose);
  }, [visible, onClose]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrimOpacity.value }));
  const panelStyle = useAnimatedStyle(() =>
    isWide
      ? { opacity: panelProgress.value }
      : { transform: [{ translateY: (1 - panelProgress.value) * 48 }] },
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      // Names the *outer* dialog — react-native-web's own `ModalContent`
      // already sets `role="dialog"`/`aria-modal` on this element (see
      // `node_modules/react-native-web/dist/exports/Modal/ModalContent.js`),
      // unnamed. `sheetA11y.web.ts`'s panel used to set a second, nested
      // `role="dialog"` to supply that name — two dialog roles, one with no
      // name, is an invalid ARIA tree. Naming this one and dropping the
      // inner role (kept as a plain focus target) leaves exactly one.
      accessibilityLabel={accessibilityLabel}
    >
      <View style={{ flex: 1, height }}>
        <Pressable
          accessible={false}
          onPress={onClose}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          {/*
           * `Animated.View` carries only the animated `style` here.
           * NativeWind does not apply `className` to Reanimated's
           * components (same defect already documented in `Mascot.tsx` and
           * `LoadingState.tsx`) — classes placed directly on it are silently
           * dropped, which is why the scrim previously rendered with no
           * background at all. The colour classes live on a plain `View`
           * nested inside instead.
           */}
          <Animated.View
            style={[
              { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
              scrimStyle,
            ]}
          >
            <View className="flex-1 bg-scrim dark:bg-scrim-dark" />
          </Animated.View>
        </Pressable>

        <View
          pointerEvents="box-none"
          style={{
            flex: 1,
            justifyContent: isWide ? "center" : "flex-end",
            alignItems: isWide ? "center" : "stretch",
            padding: isWide ? spacing.lg : 0,
          }}
        >
          {/* Same split as the scrim above: this carries only the animated
           * transform/opacity plus the non-class sizing (width/maxWidth/
           * maxHeight can't be expressed as static classes since they're
           * computed from window dimensions). The panel's own visual
           * classes (background, padding, radius, border) live on the
           * plain `View` nested inside, which is also where the a11y props
           * and `panelRef` sit — that's the element assistive tech should
           * actually see as the panel. */}
          <Animated.View
            style={[
              panelStyle,
              {
                width: "100%",
                maxWidth: isWide ? sizing.sheetMaxWidth : undefined,
                maxHeight: height - insets.top - insets.bottom,
              },
            ]}
          >
            <View
              ref={panelRef}
              {...sheetPanelA11yProps(accessibilityLabel)}
              // The panel keeps its content height and shrinks only when the
              // outer `Animated.View` hits its `maxHeight`, so the
              // `ScrollView` below gets a bounded height to scroll against
              // (home.review.md B2, round 2). `minHeight: 0` lets a flex
              // child shrink below its content size on the web.
              //
              // `flexShrink`, not `flex: 1`: `flex: 1` means a flex basis of
              // 0, and Yoga on iOS/Android takes that literally — under a
              // parent with no set height the panel would collapse to
              // nothing and the sheet would open empty. The web resolves
              // the same basis against the content, which is why `flex: 1`
              // looked fine in the browser (home.review.md, round 3).
              style={{ flexShrink: 1, minHeight: 0 }}
              className={`bg-surface px-lg pt-lg dark:border-t dark:border-border-dark dark:bg-surface-dark ${
                isWide ? "rounded-xl" : "rounded-t-xl"
              } ${className}`}
            >
              <ScrollView
                style={{ flexGrow: 0 }}
                contentContainerStyle={{ paddingBottom: spacing.lg + insets.bottom }}
              >
                {children}
              </ScrollView>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}
