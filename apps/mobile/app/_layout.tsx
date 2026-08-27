import "@/shared/config/global.css";

import { useEffect, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ErrorState, LoadingState } from "@/shared/ui";
import { queryClient } from "@/shared/api/queryClient";
import { useAuthStatus } from "@/features/auth/useAuthStatus";

/**
 * Auth gate. Against the real backend every row is owned by `auth.uid()`, so
 * there is nothing to show signed out — the whole app lives behind this.
 * On mock data `useAuthStatus()` reports `signed_in` immediately and the
 * `(auth)` stack is never reachable.
 */
function AuthGate({ children }: { children: ReactNode }) {
  const status = useAuthStatus();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    const inAuthFlow = segments[0] === "(auth)";

    if (status === "signed_out" && !inAuthFlow) {
      router.replace("/sign-in");
    } else if (status === "signed_in" && inAuthFlow) {
      router.replace("/");
    }
  }, [status, segments, router]);

  // Restoring a persisted session is fast but not instant; showing the app
  // first would flash the wrong screen (TZ.md §10 — explain, don't spin).
  if (status === "loading") {
    return (
      <LoadingState
        message="Getting things ready…"
        className="flex-1 bg-background dark:bg-background-dark"
      />
    );
  }

  return children;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }} />
        </AuthGate>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

/**
 * Screen 19 — Error / Recovery (TZ.md §8 row 19, §10 "Error"). expo-router
 * renders this in place of any route that throws during render: any route
 * module (including a `_layout.tsx`) may export a component named
 * `ErrorBoundary` with this exact `{ error, retry }` signature — confirmed
 * against expo-router's own convention in
 * `expo-router/build/views/ErrorBoundary.js` and the fast-refresh support
 * comment in `expo-router/build/fast-refresh.js`. Rooting it here makes it
 * the catch-all for every screen in the app, not just an unused component.
 */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  const router = useRouter();

  return (
    <SafeAreaProvider>
      <ErrorState
        onRetry={retry}
        onContinueAnyway={() => router.replace("/")}
        className="flex-1 justify-center bg-background dark:bg-background-dark"
      />
    </SafeAreaProvider>
  );
}
