import { Stack } from "expo-router";

/**
 * Screens 01-08 (TZ.md §8, §19 Phase 3). A plain Stack with no explicit
 * `Stack.Screen` children — same auto-discovery pattern as the root
 * `app/_layout.tsx` — so each file in this folder registers itself. Living
 * as a sibling of `(tabs)`, not nested inside it, is what keeps the tab bar
 * out of onboarding entirely (TZ.md §7 "во время onboarding основная
 * навигация скрыта") without any extra hiding logic here.
 */
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
