import { View } from "react-native";
import { Button, EmptyState, Text } from "@/shared/ui";
import { REQUIRES_AUTH } from "@/shared/config/dataSource";
import { signOut } from "@/shared/lib/auth";
import { useProfile } from "@/shared/api";

/**
 * Screen 12 — Profile (TZ.md §8). The rest of the content (languages,
 * preferences, notifications, privacy, subscription, help, mascot stage) is
 * Phase 8; what exists now is the account itself, because the app is behind
 * a sign-in and a learner needs a way back out of it. Signing out clears the
 * session and the gate in `app/_layout.tsx` returns them to screen 00.
 */
export default function ProfileTab() {
  const { data: profile } = useProfile();

  return (
    <View className="flex-1 justify-between bg-background px-lg py-xl dark:bg-background-dark">
      <View className="flex-1 items-center justify-center gap-md">
        {profile ? (
          <View className="items-center gap-xs">
            <Text variant="title">{profile.display_name}</Text>
            <Text variant="caption" tone="muted">
              Learning in {profile.ui_language.toUpperCase()}
            </Text>
          </View>
        ) : null}
        <EmptyState message="Your languages and preferences will live here." />
      </View>

      {REQUIRES_AUTH ? (
        <Button label="Sign out" variant="ghost" onPress={() => void signOut()} />
      ) : null}
    </View>
  );
}
