# Decision Memory — frontend-builder

Local technical decisions this agent made and why. Distinct from the
project's numbered Product Decisions in TZ.md/PRD — those are Knowledge, not
Memory (AGENT_FRAMEWORK.md §2).

## Phase 0

- Pinned `typescript@~6.0.3`, `tailwindcss@3.4.19`, `eslint@9.39.5` instead of
  each package's npm `latest` tag. See episodic.md for the compatibility
  reasoning behind each.
- Removed `newArchEnabled` from `app.json` (invalid field on SDK 57 schema)
  and added `react-native-worklets@0.10.1` (pinned to the version listed in
  `expo/bundledNativeModules.json`, not `latest`) plus its babel plugin.
- Added `react-native-css-interop` as a direct dependency of `apps/mobile`
  purely to satisfy Metro's resolution under pnpm's strict isolation — this
  is a workaround, not a real runtime dependency of the app's own code. Worth
  re-checking whether a future NativeWind release removes the need for this.
- Root `app/index.tsx` is a Phase-0 smoke-test screen (renders the Mascot +
  a status message), not one of the 19 real screens from `TZ.md §8`. It
  should be replaced by real onboarding/tab routing in Phase 2–3, not kept.
- Deleted the Expo template's placeholder `LICENSE` file (attributed to
  650 Industries/Expo, not this project) rather than leaving it — flagged to
  the user as an open licensing decision instead of silently keeping it.
