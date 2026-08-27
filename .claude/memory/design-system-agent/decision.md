# Decision Memory — design-system-agent

Local technical decisions this agent made and why. Distinct from the
project's numbered Product Decisions in TZ.md/PRD — those are Knowledge, not
Memory (AGENT_FRAMEWORK.md §2).

## Phase 0

- `scripts/slice-mascot.mjs` lives at the repo root (not inside
  `apps/mobile`) because it is a build-time authoring tool, not app runtime
  code — mirrors where `sharp` was installed (root devDependency).
- `WHITE_THRESHOLD = 240` and `CHANNEL_SPREAD_MAX = 18` in the slicing script
  were chosen empirically against this specific mascot sheet. If a future
  mascot sheet has a non-white or textured background, these constants will
  need retuning — they are not universal.
- Per-stage mascot art does not exist yet (only 4 moods). `Mascot.tsx`
  represents `stage` as a 5-dot progress indicator rather than a distinct
  sprite per stage, specifically so that swapping in real per-stage art (or a
  Rive state machine, per `TZ.md §11`) later does not require changing the
  component's public props (`stage`, `mood`, `size`, `growthProgress`) —
  only its internal rendering.
- `darkMode: "media"` (not `"class"`) in `tailwind.config.js` — the app
  follows system appearance automatically; no manual light/dark toggle exists
  yet. If Settings (Phase 8) needs a manual override, that's a NativeWind
  `colorScheme.set()` call plus switching the config, not a decision to make
  now.

## Phase 1 — mascot animation richness

- No blinking shipped in this pass. The scaleY-squash trick (the standard
  cheap fix for flat-sprite blinking) would squash the whole character, not
  just the eyes, given how much of the frame the face occupies on this
  specific mascot art — confirmed by actually reading all four sprite PNGs,
  not assumed. Real blinking is deferred until either (a) a per-mood
  eyes-closed sprite variant exists (an asset-pipeline / `slice-mascot.mjs`
  extension, if a new source sheet with that pose ever arrives), or (b) the
  project moves to a Rive/Lottie state machine as `TZ.md §11` already
  anticipates. Revisit if a future task adds new mascot art — check for an
  eyes-closed pose before reaching for a transform trick again.
- The new idle breathing pulse (`breathe` shared value) is composed with the
  existing stage-pop `scale` shared value by multiplication
  (`scale.value * breathe.value`) inside one `useAnimatedStyle`, not as a
  second independent `scale` transform entry — React Native transforms don't
  merge across multiple same-key entries, so two separate `scale` transforms
  would just have the second silently win. Any future third scale-affecting
  animation on the mascot should compose the same way (multiply into one
  shared value pair), not add a third raw transform entry.
- Sparkle-burst particles are each their own tiny component (`Sparkle`) that
  calls `useAnimatedStyle` once, rather than that hook being called inside
  `.map()` in `Mascot` itself — `eslint-plugin-react-hooks` flags hooks
  called inside loops/callbacks regardless of whether the loop bound is
  actually a fixed constant, so this shape is required to keep `pnpm lint`
  clean, not just a style preference.
- The sparkle burst's start and stop logic live in one `useEffect`, not two.
  A `useRef` (`isBursting`), not the `burstActive` React state, is what the
  effect reads to decide whether to cancel a still-running burst. Tried a
  separate stop-effect first; it was rejected by two `eslint-plugin-react-hooks`
  rules (`react-hooks/immutability`, `react-hooks/set-state-in-effect`) because
  it depended on `burstActive` in its own dependency array while also calling
  `setBurstActive` — an effect must not read and write the same state in its
  own dependency array, even when (as here) the actual runtime behavior is
  correct. Precedent for any future stateful-Reanimated-flag pattern in this
  file: keep such flags as refs for the "should I act" read; reserve the
  paired `useState` purely for triggering a re-render (e.g. conditional JSX),
  never for effect-dependency logic.
