import { View } from "react-native";
import { EmptyState } from "@/shared/ui";

/**
 * Screen 12 — Profile (TZ.md §8). Real content (account, languages,
 * preferences, notifications, privacy, subscription, help, mascot stage)
 * is Phase 8. TZ.md §10 doesn't specify empty-state copy for this screen
 * (only Goal/Library/Progress/No Mission), so this placeholder names the
 * screen's future content list without inventing a CTA that has nowhere
 * to go yet.
 */
export default function ProfileTab() {
  return (
    <View className="flex-1 items-center justify-center bg-background px-lg dark:bg-background-dark">
      <EmptyState message="Your account, languages, and preferences will live here." />
    </View>
  );
}
