# Episodic Memory — design-system-agent

One entry per completed task: what was done, what was learned, in the form
"did X, hit Y, resolved by Z". Populated only via the Reflect step
(AGENT_FRAMEWORK.md §6) after a real task — not pre-filled.

## Phase 0 — mascot slicing + token extraction (2026-08-26)

Sliced `assets/image/mascot.png` (2x2 sheet, 1254x1254, quadrants 627x627)
into four mood sprites (`neutral`, `thinking`, `celebrating`, `resting`) with
`scripts/slice-mascot.mjs`. No PIL/ImageMagick available in the environment —
used `sharp` instead (had to install it as a root devDependency; environment
had no image tooling preinstalled at all).

Background removal: a global brightness threshold would have eaten into the
character's cream-colored fur (also very light). Used flood-fill starting
from the four image borders instead — only pixels *connected* to the border
and close to white become transparent, so isolated light regions inside the
character (fur highlights, the yellow star, light paw pads) survive untouched
because they aren't contiguously connected to the border region. Verified two
ways: alpha-channel sampling (`corner alpha=0`, `center alpha=255`) and
visual inspection of all four output PNGs via the Read tool — the alpha check
alone would not have caught a bad crop, only the visual check confirmed no
white halo or bitten edge.

Derived the entire color palette (`primary`, `accent`, `background`, etc. in
both `tailwind.config.js` and `tokens.ts`) from actual pixel values sampled
out of the mascot artwork (purple ears/hoodie ~`#7B6BD6`, yellow star
`#FFD764`, warm cream background `#FAF7F2`) rather than picking colors from
imagination. This is the standard to hold future palette changes to.

Deliberately did not add `react-native-svg` for a circular growth-progress
ring around the mascot — used a row of five dot indicators (stage) plus a
plain percentage `Text` (growthProgress) instead, to avoid a new native
dependency before there was a second real need for SVG rendering.

## Phase 1 — mascot animation richness pass (2026-08-27)

Extended `Mascot.tsx`'s existing Reanimated animation (idle float, mood
cross-fade, stage-change pop) with three more layers, per direct user request
("make the character's animation richer"), while keeping the component's
public props (`stage`, `mood`, `size`, `growthProgress`) completely
unchanged — no consuming screen needed edits.

Added a subtle idle "breathing" scale pulse (1.0→1.015→1.0, same 1500ms/ease
family as the existing float) composed onto the animated style by
*multiplying* it with the existing stage-pop `scale` shared value
(`scale.value * breathe.value`) rather than adding a second competing
transform — the two never fight because they're the same transform property
combined arithmetically before being handed to the worklet.

Added a 5-particle sparkle burst that fires only on the mood transition
*into* `"celebrating"` (tracked via a `useRef` holding the previous mood,
compared each effect run — not on mount, not on other transitions). Built
each particle as its own small `Sparkle` subcomponent rather than calling
`useAnimatedStyle` inside a `.map()` — the latter would violate the rules of
hooks (variable-looking hook-call site inside a loop) even though the
particle count is a fixed constant; eslint's `react-hooks` rule can't
statically verify that stability, so it would have failed `pnpm lint`. Used
`accent` (`#FFD764`) for the particle color — confirmed via `tokens.ts` and
`tailwind.config.js` that `accent` has no `-dark` variant because the value
is identical in both color schemes, so a plain `bg-accent` class (no
`dark:` variant) is correct, not an oversight.

Investigated blinking (the hardest of the three asks) by actually reading
all four sprite PNGs with the Read tool first, per this agent's own
Phase 0 standard of visual verification over assumption. The character's
face/eyes occupy most of the vertical frame in every mood, and the whole
sprite is a single flat layer (no separate eye layer) rendered at a small
`SIZE_PX` (64–220px). A scaleY-squash "blink" trick — the standard cheap
technique for flat sprites — would visibly squash the *entire* body (ears,
cheeks, paws, hoodie, book) into a thin horizontal sliver, reading as "the
character got squashed," not "the character blinked." Decided not to ship
it: a correctly-scoped "not now, here's why" beats a broken-looking
animation. Real blinking needs either a separate eyes-closed sprite variant
per mood (an asset-pipeline task, this agent's actual domain) or a future
Rive/Lottie state machine (explicitly deferred per `TZ.md §11` and Phase 0's
decision memory) — not a transform trick on the existing flat PNGs.

Could not visually confirm the animations actually play correctly at
runtime — no simulator/browser access in this environment. Verified only via
`pnpm typecheck`, `pnpm lint`, and `expo export --platform web` (which
bundled every route that renders `Mascot`, including `assessment-result`,
`goal-analysis`, and `welcome`, without error). A human visual check on a
real device/simulator remains the outstanding verification step — flagged
explicitly in the handoff rather than implied as done.

Ran the `code-review` skill against the diff (medium effort) as its own
background agent, per this agent's own Validation §4 step. It took ~11
minutes and found one real bug after verification (not a false positive):
the sparkle-burst effect had a start-gate but no stop-gate — if `mood` left
`"celebrating"` before the 700ms burst finished, or if reduced-motion turned
on mid-burst, the animation kept running instead of stopping, unlike every
other animation in the file (float/breathe/opacity/scale), which all
freshly check `reducedMotion`. Fixed by merging the start and stop logic
into one effect, using a `useRef` (`isBursting`) instead of the `burstActive`
React state to decide whether to cancel — deliberately, because a first
attempt at a *separate* stop-effect (depending on `[mood, reducedMotion,
burstActive, burstProgress]` and calling `setBurstActive` inside) tripped
two new-to-this-repo ESLint rules from `eslint-plugin-react-hooks`
(`react-hooks/immutability`, `react-hooks/set-state-in-effect`) that the
original single start-effect — doing the visually-similar
`burstProgress.value = 0` mutation and a synchronous `setBurstActive(true)`
— did not trip. The distinguishing factor: the flagged effect depended on
`burstActive` (the very state it set) — an effect reading and writing the
same state is the specific cascading-render footgun these rules target.
Solution was to keep the effect's dependency array free of any state it
also writes, and use a plain ref for internal "is this still running"
bookkeeping instead. Lesson for future Reanimated + React-state-flag
patterns in this file: never put the flag's own state variable in the
triggering effect's dependency array if that effect also sets it — use a
ref for the read side instead.

Also observed a transient, unrelated `pnpm typecheck` failure in
`app/(tabs)/index.tsx` (`"/mission/[id]"` not assignable to the generated
route-type union) partway through this task, while `frontend-builder` was
concurrently editing that file and adding `app/mission/[id].tsx` in
parallel. Did not touch it — out of this agent's boundaries (screens/routing
is `frontend-builder`'s domain) — and it was gone on the next typecheck run
(Expo Router's generated route types apparently caught up, plausibly
prompted by an intervening `expo export`). Noting here only so a future
agent doesn't mistake a concurrent-edit artifact for something `Mascot.tsx`
caused.
