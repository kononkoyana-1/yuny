import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Text } from "@/shared/ui";
import { useReducedMotion } from "@/shared/lib/useReducedMotion";

export interface WhyThisDisclosureProps {
  /** `recommendations.reason` — backend copy, never reworded on-device (TZ.md §14). */
  reason: string;
  className?: string;
}

/**
 * "Why this?" progressive disclosure (TZ.md §16 level 2: "Почему →
 * раскрывается по тапу"). Collapsed by default — the reason only mounts
 * once the user taps to expand, which is what keeps this "available, not
 * imposed" rather than one more paragraph competing with the primary CTA.
 *
 * The reveal fades in on open (skipped entirely under `useReducedMotion`,
 * same contract `Mascot` follows) rather than animating height, since RN
 * has no free auto-height transition without measuring the content first —
 * a fade is the "subtle, meaningful, performant" bar TZ.md §11 sets for
 * mascot motion, applied here too.
 */
export function WhyThisDisclosure({ reason, className = "" }: WhyThisDisclosureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!isOpen) return;
    if (reducedMotion) {
      opacity.value = 1;
      return;
    }
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: 220 });
  }, [isOpen, reducedMotion, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View className={className}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Why this mission?"
        accessibilityState={{ expanded: isOpen }}
        onPress={() => setIsOpen((prev) => !prev)}
        className="min-h-[44px] flex-row items-center gap-xs"
      >
        <Text variant="body" className="font-semibold text-primary dark:text-primary-dark">
          Why this?
        </Text>
        <Text variant="body" tone="muted">
          {isOpen ? "−" : "+"}
        </Text>
      </Pressable>

      {isOpen ? (
        <Animated.View style={animatedStyle} className="mt-xs">
          <Text variant="body" tone="muted">
            {reason}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}
