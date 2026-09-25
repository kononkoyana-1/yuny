/**
 * The six-step memory-stage scale (#65, `colors.{light,dark}.stage*` in
 * `shared/config/tokens.ts`), shared by `StageDot`, `StageBar`,
 * `StageLegend` and `WordTile`.
 *
 * The stage always arrives as one of these codes from the server (TZ §3):
 * clients never compute it. The Russian label is i18n's job
 * (`learn.stage.*`, `today-session.design.md` §8) — these primitives stay
 * i18n-free and take a caller-supplied `accessibilityLabel` instead.
 */
export type Stage = "new" | "meeting" | "recognize" | "recall" | "use" | "stable";

export const STAGE_ORDER: readonly Stage[] = [
  "new",
  "meeting",
  "recognize",
  "recall",
  "use",
  "stable",
];

/** Steps 1–3 need `stageEdge`'s border — their fill is close to `background`. */
export const STAGE_NEEDS_EDGE: ReadonlySet<Stage> = new Set(["new", "meeting", "recognize"]);

/** Steps 5–6 use `onStageDeep` text; steps 1–4 use `onStageLight`. */
export const STAGE_IS_DEEP: ReadonlySet<Stage> = new Set(["use", "stable"]);

export const STAGE_FILL_CLASS: Record<Stage, string> = {
  new: "bg-stage-new dark:bg-stage-new-dark",
  meeting: "bg-stage-meeting dark:bg-stage-meeting-dark",
  recognize: "bg-stage-recognize dark:bg-stage-recognize-dark",
  recall: "bg-stage-recall dark:bg-stage-recall-dark",
  use: "bg-stage-use dark:bg-stage-use-dark",
  stable: "bg-stage-stable dark:bg-stage-stable-dark",
};

export const STAGE_ON_CLASS: Record<Stage, string> = {
  new: "text-on-stage-light dark:text-on-stage-light-dark",
  meeting: "text-on-stage-light dark:text-on-stage-light-dark",
  recognize: "text-on-stage-light dark:text-on-stage-light-dark",
  recall: "text-on-stage-light dark:text-on-stage-light-dark",
  use: "text-on-stage-deep dark:text-on-stage-deep-dark",
  stable: "text-on-stage-deep dark:text-on-stage-deep-dark",
};
