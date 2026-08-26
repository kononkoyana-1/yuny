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
