import { View } from "react-native";
import { Text } from "./Text";

export type SkillLevel = "not_started" | "fresh" | "holding" | "stable";

const FILLED_PIPS: Record<SkillLevel, number> = {
  not_started: 0,
  fresh: 1,
  holding: 2,
  stable: 3,
};

export interface SkillMeterProps {
  /** e.g. "Читаю" (`learn.word.skill.read`). */
  label: string;
  level: SkillLevel;
  /** e.g. "держится" (`learn.word.level.holding`) — the meter's own state word, next to `label`. */
  levelLabel: string;
  className?: string;
}

/**
 * DS-M4 (folder-map.design.md §8): a word-card skill row (`WordSheet` §3.5)
 * — a label, 3 pips, and the level spelled out in words rather than left to
 * the pip count alone (V.1 п.2/п.4: colour/fill is never the only carrier
 * of meaning).
 */
export function SkillMeter({ label, level, levelLabel, className = "" }: SkillMeterProps) {
  const filled = FILLED_PIPS[level];

  return (
    <View className={`gap-xs ${className}`}>
      <View className="flex-row items-center justify-between">
        <Text variant="caption" tone="muted">
          {label}
        </Text>
        <Text variant="caption" tone="muted">
          {levelLabel}
        </Text>
      </View>
      <View aria-hidden className="flex-row gap-xs">
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            className={`h-skill-pip flex-1 rounded-pill ${
              i < filled ? "bg-primary dark:bg-primary-dark" : "bg-surface-alt dark:bg-surface-alt-dark"
            }`}
          />
        ))}
      </View>
    </View>
  );
}
