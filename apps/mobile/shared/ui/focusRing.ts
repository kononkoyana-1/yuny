/**
 * DS12 (today-session.design.md §9): one focus-ring style shared by every
 * #65 interactive primitive — `sizing.focusRingWidth` (3px), offset 2px
 * (V.7's own description of the token, not a separate one), colour
 * `focusRing` outside a `HeroCard`.
 *
 * `:focus-visible` only — a mouse click must not show the ring, per TZ §13
 * and the existing convention in `Input.tsx` (which suppresses the
 * browser's own outline and draws its own visible state instead). Native
 * ignores `outline*`/`focus-visible:`; this is a web-only ring, matching
 * how `Input.tsx` already reasons about focus.
 */
export const FOCUS_RING_CLASS =
  "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-focus-ring dark:focus-visible:outline-focus-ring-dark";

/** Same ring, `heroInk`-coloured — for focusable children of a `HeroCard` (V.6, §6). */
export const HERO_FOCUS_RING_CLASS =
  "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-hero-ink";
