import "@/shared/config/global.css";
import { t } from "@/shared/i18n";

import { useEffect, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import {
  NotoSansSC_400Regular,
  NotoSansSC_500Medium,
  NotoSansSC_700Bold,
} from "@expo-google-fonts/noto-sans-sc";
import { StatusBar } from "expo-status-bar";
import { ErrorState, LoadingState } from "@/shared/ui";
import { queryClient } from "@/shared/api/queryClient";
import { useAuthStatus } from "@/features/auth/useAuthStatus";
import { useTheme } from "@/shared/lib/useTheme";
import { initTheme } from "@/shared/lib/themePreference";

// Тема из настроек (#40) — до первой отрисовки, чтобы не мигнуть не той темой.
initTheme();

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
        message={t("auth.loading")}
        className="flex-1 bg-background dark:bg-background-dark"
      />
    );
  }

  return children;
}

export default function RootLayout() {
  const { colors } = useTheme();

  /**
   * Every weight is loaded before anything renders. Showing the app first
   * would paint one frame in the system face and then reflow once Inter /
   * Noto Sans SC arrive — the metrics differ enough that headings and
   * hanzi visibly jump. `LoadingState` needs no font of its own, so the
   * wait is silent.
   *
   * #65 V.2/V.7 (DS13): Inter replaces Plus Jakarta Sans (`fontFamily.ui`
   * in shared/config/tokens.ts — see there for why). Only the weights V.7
   * lists are loaded, to keep the web bundle from carrying faces nothing
   * uses: Inter 400/500/600/700/800, Noto Sans SC 400/500/700
   * (`fontFamily.hanzi`, for `HanziText`).
   */
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    NotoSansSC_400Regular,
    NotoSansSC_500Medium,
    NotoSansSC_700Bold,
  });

  // A failed font load must not strand the user on a blank screen: the app
  // still works in the fallback face, so carry on and let Sentry have the
  // error rather than blocking the whole session on typography.
  if (!fontsLoaded && !fontError) {
    return (
      <SafeAreaProvider>
        <LoadingState
          message={t("auth.loading")}
          className="flex-1 bg-background dark:bg-background-dark"
        />
      </SafeAreaProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <AuthGate>
          {/*
            `contentStyle` paints the navigator's own screen container. Without
            it React Navigation falls back to its DefaultTheme grey
            (rgb(242,242,242)), which shows through wherever a screen does not
            paint to the edge — under the tab bar and behind loading states —
            and reads as a dirty cream stripe against the lavender background.
          */}
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          />
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
        title="Что-то пошло не так"
        detail="Ваш прогресс сохранён."
        onRetry={retry}
        retryLabel="Повторить"
        onContinueAnyway={() => router.replace("/")}
        continueLabel="На главную"
        className="flex-1 justify-center bg-background dark:bg-background-dark"
      />
    </SafeAreaProvider>
  );
}
