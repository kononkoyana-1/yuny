import { Stack } from "expo-router";

/**
 * Первый запуск (TZ.md §11). A plain Stack with no explicit
 * `Stack.Screen` children — same auto-discovery pattern as the root
 * `app/_layout.tsx` — so each file in this folder registers itself. Living
 * as a sibling of `(tabs)`, not nested inside it, is what keeps the tab bar
 * out of the first-run flow entirely, without any extra hiding logic here.
 */
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
