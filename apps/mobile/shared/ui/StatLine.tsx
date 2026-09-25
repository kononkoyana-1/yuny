import type { ReactNode } from "react";
import { View } from "react-native";
import { useTheme } from "@/shared/lib/useTheme";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

export interface StatLineProps {
  icon: IconName;
  label: string;
  /** Right-aligned value — plain text, or a `HanziText variant="inline"` for "买 / 卖". */
  value: ReactNode;
  /** Secondary line under the value, e.g. `из «Покупки»`. */
  detail?: string;
  className?: string;
}

/**
 * DS7 (today-session.design.md §9): a composition row inside `HeroCard` —
 * "↻ Повторить … 26", "✦ Новые слова … 5 из «Покупки»". Always on
 * `gradients.hero`, so the tones (`heroInk`/`heroInkMuted`) aren't a prop —
 * every other surface this could sit on isn't in scope for #65.
 */
export function StatLine({ icon, label, value, detail, className = "" }: StatLineProps) {
  const { colors } = useTheme();

  return (
    <View className={`flex-row items-center justify-between gap-sm ${className}`}>
      <View className="flex-1 flex-row items-center gap-sm">
        <Icon name={icon} size={18} color={colors.heroInk} />
        <Text variant="body" tone="heroInk">
          {label}
        </Text>
      </View>
      <View className="items-end">
        <Text variant="body" tone="heroInk" className="font-semibold tabular-nums">
          {value}
        </Text>
        {detail ? (
          <Text variant="caption" tone="heroInkMuted">
            {detail}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
