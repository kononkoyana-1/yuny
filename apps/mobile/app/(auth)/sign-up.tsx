import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
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
          <Text variant="title">Create your account</Text>
          <Text variant="body" tone="muted">
            Your goal, your progress, and your mascot stay tied to it.
          </Text>
        </View>

        {error ? <FeedbackBanner tone="encouraging" message={error} /> : null}

        <View className="gap-sm">
          <Input
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            accessibilityLabel="Your name"
            autoComplete="name"
            textContentType="name"
          />
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
            placeholder={`Password (${MIN_PASSWORD_LENGTH}+ characters)`}
            accessibilityLabel="Password"
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            secureTextEntry
          />
        </View>

        <Button
          label="Create account"
          variant="primary"
          disabled={!canSubmit || pending}
          loading={pending}
          onPress={submit}
        />

        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Back to sign in"
          onPress={() => router.back()}
          className="min-h-[44px] items-center justify-center"
        >
          <Text variant="body" className="text-primary dark:text-primary-dark">
            Already have an account? Sign in
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
