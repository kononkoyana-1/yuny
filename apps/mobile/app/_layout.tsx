import "@/shared/config/global.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ErrorState } from "@/shared/ui";
import { queryClient } from "@/shared/api/queryClient";

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }} />
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
