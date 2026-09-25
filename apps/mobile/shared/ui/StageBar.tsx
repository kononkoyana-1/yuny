import { View } from "react-native";
import { STAGE_FILL_CLASS, STAGE_ORDER, type Stage } from "./stage";

export type StageBarSize = "default" | "mini";

export interface StageBarProps {
  /** Word count per stage. Segments render in `STAGE_ORDER`, per §3.2. */
  counts: Record<Stage, number>;
  size?: StageBarSize;
  className?: string;
}

/**
 * DS-M1 (folder-map.design.md §8): the folder header's stage distribution
 * bar (`default`, `sizing.stageBar`) and `FolderCard`'s summary strip
 * (`mini`, `sizing.stageBarMini`). Always `aria-hidden` — its
 * `accessibilityLabel` is applied by the caller wrapping it (per the spec's
 * own "accessibilityLabel снаружи"), since only the caller knows the full
 * spoken breakdown ("26 Узнаю, 12 Вспоминаю…").
 */
export function StageBar({ counts, size = "default", className = "" }: StageBarProps) {
  const total = STAGE_ORDER.reduce((sum, stage) => sum + counts[stage], 0);
  const heightClass = size === "mini" ? "h-stage-bar-mini" : "h-stage-bar";

  return (
    <View
      aria-hidden
      className={`flex-row overflow-hidden rounded-pill bg-background dark:bg-background-dark ${heightClass} ${className}`}
    >
      {STAGE_ORDER.map((stage) => {
        const count = counts[stage];
        if (total <= 0 || count <= 0) return null;
        return (
          <View
            key={stage}
            style={{ width: `${(count / total) * 100}%` }}
            className={`${STAGE_FILL_CLASS[stage]} ${size === "mini" ? "" : "border-r border-r-background dark:border-r-background-dark"}`}
          />
        );
      })}
    </View>
  );
}
