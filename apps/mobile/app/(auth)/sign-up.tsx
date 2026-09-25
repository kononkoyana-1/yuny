import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { t } from "@/shared/i18n";
import { Button, FeedbackBanner, Input, Text } from "@/shared/ui";
import { authErrorCopy } from "@/features/auth/errorCopy";
import { signUpWithEmail } from "@/shared/lib/auth";

/** Supabase rejects anything shorter; say so before the round trip. */
const MIN_PASSWORD_LENGTH = 8;

/**
 * Screen 00b — Create account. `display_name` is sent as user metadata and
 * read by the `handle_new_user` trigger to seed `profiles`, so the learner
 * never has to type it twice.
 */
export default function SignUp() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    displayName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= MIN_PASSWORD_LENGTH;

  async function submit() {
    setError(null);
    setPending(true);
    try {
      const signedIn = await signUpWithEmail(
        { email: email.trim(), password },
        displayName.trim(),
      );
      // With email confirmation on, there is no session yet — the gate stays
      // put, so this screen has to route to the explanation itself.
      if (!signedIn) router.replace("/check-email");
    } catch (failure) {
      setError(authErrorCopy(failure));
    } finally {
      setPending(false);
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
        <View className="gap-sm">
          <Text variant="title">{t("auth.signUp.title")}</Text>
          <Text variant="body" tone="muted">
            {t("auth.signUp.subtitle")}
          </Text>
        </View>

        {error ? <FeedbackBanner tone="encouraging" message={error} /> : null}

        <View className="gap-sm">
          <Input
            value={displayName}
            onChangeText={setDisplayName}
            placeholder={t("auth.signUp.name")}
            accessibilityLabel={t("auth.signUp.name")}
            autoComplete="name"
            textContentType="name"
          />
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
            placeholder={t("auth.signUp.password", { count: MIN_PASSWORD_LENGTH })}
            accessibilityLabel={t("auth.password")}
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            secureTextEntry
          />
        </View>

        <Button
          label={t("auth.signUp.submit")}
          variant="primary"
          disabled={!canSubmit || pending}
          loading={pending}
          onPress={submit}
        />

        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t("auth.signUp.toSignInA11y")}
          onPress={() => router.back()}
          className="min-h-tap items-center justify-center"
        >
          <Text variant="body" tone="brand">
            {t("auth.signUp.toSignIn")}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
