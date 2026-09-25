import { View } from "react-native";
import { STAGE_FILL_CLASS, STAGE_ORDER, type Stage } from "./stage";

export type StageBarSize = "default" | "mini";

/** folder-map.design.md §3.2: самое прочное слева — папка «заполняется» слева направо. */
const BAR_ORDER: readonly Stage[] = [...STAGE_ORDER].reverse();

/**
 * «Новое» в полоске: заливка стадии `new` — цвет карточки, и на карточке папки
 * эта часть сливалась с фоном — полоска казалась короче соседних. В полоске
 * «новое» — цвет рамок: виден и на карточке, и на фоне экрана.
 */
const NEW_SEGMENT_CLASS = "bg-border dark:bg-border-dark";

export interface StageBarProps {
  /** Word count per stage. Segments render from the most solid (`stable`) to `new`, per §3.2. */
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
      {BAR_ORDER.map((stage) => {
        const count = counts[stage];
        if (total <= 0 || count <= 0) return null;
        return (
          <View
            key={stage}
            style={{ width: `${(count / total) * 100}%` }}
            className={`${stage === "new" ? NEW_SEGMENT_CLASS : STAGE_FILL_CLASS[stage]} ${size === "mini" ? "" : "border-r border-r-background dark:border-r-background-dark"}`}
          />
        );
      })}
    </View>
  );
}
