import { View } from "react-native";
import { STAGE_FILL_CLASS, STAGE_NEEDS_EDGE, type Stage } from "./stage";

export interface StageDotProps {
  stage: Stage;
  /** Diameter in px. */
  size?: number;
  className?: string;
}

/**
 * DS6 (today-session.design.md §9): a stage-coloured circle — `StageUpRow`'s
 * "было / стало" pair, `StageLegend`'s key. Always decorative: the meaning
 * (which stage) is carried by the caller's own text, never by colour alone
 * (V.1 п.2/п.4).
 */
export function StageDot({ stage, size = 12, className = "" }: StageDotProps) {
  return (
    <View
      aria-hidden
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className={`${STAGE_FILL_CLASS[stage]} ${
        STAGE_NEEDS_EDGE.has(stage) ? "border border-stage-edge dark:border-stage-edge-dark" : ""
      } ${className}`}
    />
  );
}
