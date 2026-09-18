import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Button, FeedbackBanner, Input, Mascot, Text } from "@/shared/ui";
import { authErrorCopy } from "@/features/auth/errorCopy";
import {
  APPLE_SIGN_IN_AVAILABLE,
  GOOGLE_SIGN_IN_AVAILABLE,
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
} from "@/shared/lib/auth";

/**
 * Screen 00a — Sign in. One primary action (Sign in), the providers as
 * equal-weight secondary options, and a single exit to Create account
 * (TZ.md §10 "Универсальные правила экрана").
 *
 * The gate in `app/_layout.tsx` redirects away as soon as a session appears,
 * so nothing here navigates on success.
 */
export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<"email" | "google" | "apple" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  async function run(kind: "email" | "google" | "apple", action: () => Promise<void>) {
    setError(null);
    setPending(kind);
    try {
      await action();
    } catch (failure) {
      setError(authErrorCopy(failure));
    } finally {
      setPending(null);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background dark:bg-background-dark"
    >
      <ScrollView
        contentContainerClassName="grow justify-center gap-lg px-lg py-xl"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center gap-sm">
          <Mascot decorative stage={1} mood="neutral" size="medium" />
          <Text variant="title" className="text-center">
            Welcome back.
          </Text>
          <Text variant="body" tone="muted" className="text-center">
            Sign in to pick up where you left off.
          </Text>
        </View>

        {error ? <FeedbackBanner tone="encouraging" message={error} /> : null}

        <View className="gap-sm">
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            accessibilityLabel="Email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            accessibilityLabel="Password"
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            secureTextEntry
          />
        </View>

        <Button
          label="Sign in"
          variant="primary"
          disabled={!canSubmit || pending !== null}
          loading={pending === "email"}
          onPress={() => run("email", () => signInWithEmail({ email: email.trim(), password }))}
        />

        {GOOGLE_SIGN_IN_AVAILABLE || APPLE_SIGN_IN_AVAILABLE ? (
          <View className="gap-sm">
            <Text variant="caption" tone="muted" className="text-center">
              or
            </Text>
            {GOOGLE_SIGN_IN_AVAILABLE ? (
              <Button
                label="Continue with Google"
                variant="secondary"
                disabled={pending !== null}
                loading={pending === "google"}
                onPress={() => run("google", signInWithGoogle)}
              />
            ) : null}
            {APPLE_SIGN_IN_AVAILABLE ? (
              <Button
                label="Continue with Apple"
                variant="secondary"
                disabled={pending !== null}
                loading={pending === "apple"}
                onPress={() => run("apple", signInWithApple)}
              />
            ) : null}
          </View>
        ) : null}

        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Create an account"
          onPress={() => router.push("/sign-up")}
          className="min-h-[44px] items-center justify-center"
        >
          <Text variant="body" className="text-primary dark:text-primary-dark">
            New here? Create an account
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
