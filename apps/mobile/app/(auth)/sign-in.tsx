import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { t } from "@/shared/i18n";
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
            {t("auth.signIn.title")}
          </Text>
          <Text variant="body" tone="muted" className="text-center">
            {t("auth.signIn.subtitle")}
          </Text>
        </View>

        {error ? <FeedbackBanner tone="encouraging" message={error} /> : null}

        <View className="gap-sm">
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder={t("auth.email")}
            accessibilityLabel={t("auth.email")}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder={t("auth.password")}
            accessibilityLabel={t("auth.password")}
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            secureTextEntry
          />
        </View>

        <Button
          label={t("auth.signIn.submit")}
          variant="primary"
          disabled={!canSubmit || pending !== null}
          loading={pending === "email"}
          onPress={() => run("email", () => signInWithEmail({ email: email.trim(), password }))}
        />

        {GOOGLE_SIGN_IN_AVAILABLE || APPLE_SIGN_IN_AVAILABLE ? (
          <View className="gap-sm">
            <Text variant="caption" tone="muted" className="text-center">
              {t("auth.or")}
            </Text>
            {GOOGLE_SIGN_IN_AVAILABLE ? (
              <Button
                label={t("auth.signIn.google")}
                variant="secondary"
                disabled={pending !== null}
                loading={pending === "google"}
                onPress={() => run("google", signInWithGoogle)}
              />
            ) : null}
            {APPLE_SIGN_IN_AVAILABLE ? (
              <Button
                label={t("auth.signIn.apple")}
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
          accessibilityLabel={t("auth.signIn.toSignUpA11y")}
          onPress={() => router.push("/sign-up")}
          className="min-h-[44px] items-center justify-center"
        >
          <Text variant="body" className="text-primary dark:text-primary-dark">
            {t("auth.signIn.toSignUp")}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
