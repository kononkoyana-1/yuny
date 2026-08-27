import { View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Mascot, Text } from "@/shared/ui";

/**
 * Screen 00c — shown only when Supabase requires an emailed confirmation
 * before issuing a session. Explains what happened and offers the one way
 * forward (TZ.md §10: context + primary action + exit).
 */
export default function CheckEmail() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center gap-lg bg-background px-lg dark:bg-background-dark">
      <Mascot stage={1} mood="resting" size="large" />

      <View className="gap-sm">
        <Text variant="title" className="text-center">
          Check your email
        </Text>
        <Text variant="body" tone="muted" className="text-center">
          We sent you a link to confirm your address. Open it, then come back
          and sign in.
        </Text>
      </View>

      <Button
        label="Back to sign in"
        variant="primary"
        className="w-full"
        onPress={() => router.replace("/sign-in")}
      />
    </View>
  );
}
