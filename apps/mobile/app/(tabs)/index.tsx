import { View } from "react-native";
import { useRouter } from "expo-router";
import { EmptyState } from "@/shared/ui";

/**
 * Screen 09 — Home (TZ.md §8). The real dashboard (Mascot, Active Goal,
 * Today's Mission, "Why this?") is Phase 4 — there is no active Goal yet
 * because onboarding (Phase 3) doesn't exist. This is the "No Goal" empty
 * state (`docs/MVP Product Specification.md` §28), which Home maps onto
 * (TZ.md §8 "Куда делись экраны" — promt.md's "Empty Goal" → screen 09).
 *
 * The CTA routes to the Goal tab (which repeats the same nudge) rather than
 * an onboarding route, since `(onboarding)` doesn't exist yet (Phase 3).
 */
export default function Home() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-background px-lg dark:bg-background-dark">
      <EmptyState
        message="What do you want to achieve?"
        actionLabel="Create Goal"
        onAction={() => router.push("/goal")}
      />
    </View>
  );
}
