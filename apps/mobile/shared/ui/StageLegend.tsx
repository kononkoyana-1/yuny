import { View } from "react-native";
import { StageDot } from "./StageDot";
import { Text } from "./Text";
import type { Stage } from "./stage";

export interface StageLegendItem {
  stage: Stage;
  /** Already-localized "{{stage}} {{count}}", e.g. "Узнаю 12" (`learn.map.legendItem`). */
  label: string;
}

export interface StageLegendProps {
  items: readonly StageLegendItem[];
  className?: string;
}

/**
 * DS-M2 (folder-map.design.md §8): the stage key under `StageBar` —
 * `StageDot` + label, wraps onto a new line rather than scrolling
 * horizontally.
 */
export function StageLegend({ items, className = "" }: StageLegendProps) {
  return (
    <View className={`flex-row flex-wrap items-center gap-md ${className}`}>
      {items.map((item) => (
        <View key={item.stage} className="flex-row items-center gap-xs">
          <StageDot stage={item.stage} />
          <Text variant="caption" tone="muted">
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
