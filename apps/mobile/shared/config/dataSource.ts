/**
 * Which repository implementation the app runs on (TZ.md §6 "Mock-first").
 * Exported from one place so the auth gate and the repository selector can
 * never disagree about it.
 */
export const DATA_SOURCE =
  process.env.EXPO_PUBLIC_DATA_SOURCE === "supabase" ? "supabase" : "mock";

/**
 * Mock data belongs to nobody, so it needs no sign-in. Against the real
 * backend every row is owned by `auth.uid()` and the app is unusable signed
 * out — hence the hard gate in `app/_layout.tsx`.
 */
export const REQUIRES_AUTH = DATA_SOURCE === "supabase";
