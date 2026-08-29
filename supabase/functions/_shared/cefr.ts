/**
 * CEFR bands, mirroring `public.cefr_level` and `@yuny/shared`'s schema.
 *
 * Duplicated rather than imported because `packages/shared` may not import
 * Deno and Edge Functions may not import Expo (TZ.md §4) — the two sides
 * share the contract, not the module. Keep the order identical to the enum.
 */
export const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CefrLevel = (typeof CEFR_ORDER)[number];

export function isCefrLevel(value: unknown): value is CefrLevel {
  return typeof value === "string" && (CEFR_ORDER as readonly string[]).includes(value);
}

/**
 * "I'm not sure" on screen 03 starts the ladder at A2 rather than refusing
 * to start: A2 sits low enough that a real beginner is not buried, and the
 * phase-1 blocks below and above widen the search from there
 * (docs/onboarding-v2.md §4.1).
 */
export const UNKNOWN_LEVEL_START: CefrLevel = "A2";

export function declaredToBand(declared: unknown): CefrLevel {
  return isCefrLevel(declared) ? declared : UNKNOWN_LEVEL_START;
}
