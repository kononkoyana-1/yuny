import { z } from "zod";

/**
 * CEFR band, mirroring the `public.cefr_level` enum.
 *
 * Deliberately NOT per skill. `skill_states.level` (0–1) stays the precise,
 * fine-grained measure that picks the focus skill; a band answers three
 * whole-learner questions instead — which difficulty to test at, which
 * content to draw on, and whether the learner needs foundations before the
 * goal is reachable (docs/onboarding-v2.md §3.1).
 */
export const CefrLevelSchema = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
export type CefrLevel = z.infer<typeof CefrLevelSchema>;

/** Ordered lowest to highest, for stepping the adaptive ladder. */
export const CEFR_ORDER: readonly CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** One band up or down, clamped at the ends. */
export function stepCefr(level: CefrLevel, by: number): CefrLevel {
  const at = CEFR_ORDER.indexOf(level);
  return CEFR_ORDER[Math.min(CEFR_ORDER.length - 1, Math.max(0, at + by))];
}
