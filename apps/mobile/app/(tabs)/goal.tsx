import { View } from "react-native";
import { EmptyState } from "@/shared/ui";

/**
 * Screen 10 — Goal (TZ.md §8). Real content (Deadline, Readiness, Language
 * Outcomes, Current priorities) needs an active Goal, which onboarding
 * (Phase 3) hasn't created yet. Copy is verbatim TZ.md §10 "Empty".
 */
export default function GoalTab() {
  return (
    <View className="flex-1 items-center justify-center bg-background px-lg dark:bg-background-dark">
      <EmptyState message="Create your first language goal" />
    </View>
  );
}
