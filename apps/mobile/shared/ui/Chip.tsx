import type { Ref } from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "@/shared/lib/useTheme";
import { Icon, type IconName } from "./Icon";
import { Text, type TextTone } from "./Text";
import { FOCUS_RING_CLASS, HERO_FOCUS_RING_CLASS } from "./focusRing";

export type ChipVariant = "onHero" | "neutral" | "pair" | "attention";
export type ChipSize = "default" | "micro";

const CONTAINER_CLASS: Record<ChipVariant, string> = {
  // 16% alpha of `heroInk` — the pill sits on `gradients.hero`.
  onHero: "bg-hero-ink/[0.16] dark:bg-hero-ink-dark/[0.16]",
  neutral: "bg-surface-alt dark:bg-surface-alt-dark",
  pair: "bg-pair-soft dark:bg-pair-soft-dark",
  attention: "bg-attention-soft dark:bg-attention-soft-dark",
};

const LABEL_TONE: Record<ChipVariant, TextTone> = {
  onHero: "heroInk",
  neutral: "muted",
  pair: "pairInk",
  attention: "attentionInk",
};

const ICON_COLOR_KEY: Record<ChipVariant, "heroInk" | "textMuted" | "pairInk" | "attentionInk"> = {
  onHero: "heroInk",
  neutral: "textMuted",
  pair: "pairInk",
  attention: "attentionInk",
};

interface ChipBaseProps {
  label: string;
  variant?: ChipVariant;
  size?: ChipSize;
  /** Trailing glyph (e.g. `chevronDown` on the budget chip). Decorative — the label already carries the meaning. */
  icon?: IconName;
  className?: string;
}

export type ChipProps =
  | (ChipBaseProps & {
      /** Interactive chip — `sizing.tapTarget` floor applies. */
      onPress: () => void;
      accessibilityLabel?: string;
      /** For returning focus here (e.g. after a sheet this chip opened closes). */
      ref?: Ref<View>;
    })
  | (ChipBaseProps & {
      /** Decorative/label chip (DS-M5's `micro` use) — no tap target floor, not focusable. */
      onPress?: undefined;
    });

/**
 * DS3 (today-session.design.md §9) + DS-M5 (folder-map.design.md §8): a
 * pill, either a button (`BudgetChip`, "Ещё раз") or a plain label (a
 * confusion-pair marker, the retry badge). `size="micro"` drops the tap
 * target and is never given an `onPress`.
 */
export function Chip({
  label,
  variant = "neutral",
  size = "default",
  icon,
  className = "",
  onPress,
  ...props
}: ChipProps) {
  const { colors } = useTheme();
  const sizeClass = size === "micro" ? "px-xs py-[2px]" : "min-h-tap px-md py-xs";

  const content = (
    <>
      <Text variant="caption" tone={LABEL_TONE[variant]} className="font-medium">
        {label}
      </Text>
      {icon ? <Icon name={icon} size={size === "micro" ? 12 : 16} color={colors[ICON_COLOR_KEY[variant]]} /> : null}
    </>
  );

  const containerClass = `flex-row items-center justify-center gap-xs rounded-pill ${sizeClass} ${CONTAINER_CLASS[variant]} ${
    variant === "onHero" ? HERO_FOCUS_RING_CLASS : FOCUS_RING_CLASS
  } ${className}`;

  if (onPress) {
    const accessibilityLabel = "accessibilityLabel" in props ? props.accessibilityLabel : undefined;
    const ref = "ref" in props ? props.ref : undefined;
    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        onPress={onPress}
        className={containerClass}
      >
        {content}
      </Pressable>
    );
  }

  return <View className={containerClass}>{content}</View>;
}
