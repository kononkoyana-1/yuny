import { Stack } from "expo-router";

/**
 * Screen 00 — Authentication. Yuny is unusable signed out, so this stack
 * sits outside `(onboarding)` and `(tabs)` and is the only thing reachable
 * without a session (gate in `app/_layout.tsx`). No tab bar, same as
 * onboarding (TZ.md §7).
 */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
