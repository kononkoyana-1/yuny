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
    >
      <View style={{ flex: 1, height }}>
        <Pressable
          accessible={false}
          onPress={onClose}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <Animated.View
            style={[
              { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
              scrimStyle,
            ]}
            className="bg-scrim dark:bg-scrim-dark"
          />
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
          <Animated.View
            ref={panelRef}
            {...sheetPanelA11yProps(accessibilityLabel)}
            style={[
              panelStyle,
              {
                width: "100%",
                maxWidth: isWide ? sizing.sheetMaxWidth : undefined,
                maxHeight: height - insets.top - insets.bottom,
              },
            ]}
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
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}
