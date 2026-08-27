import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, ErrorState, LoadingState, Mascot, ProgressBar, Text } from "@/shared/ui";
import { useMissionResult } from "@/shared/api";

/**
 * Screen 15 — Mission Result. Reads `MissionRepository.getMissionResult()`,
 * which is computed fresh from persisted `activities`/`evidence` rows every
 * time (TZ.md §3 Rule 1 — never client-tallied) — so this shows the same
 * thing whether the learner just finished the mission or reopened the app
 * after restarting it.
 *
 * Feedback stays deliberately simple (this phase's product decision): a
 * ratio-based strength/improvement line, not a generated write-up.
 */
export default function MissionResult() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: result, isPending, isError, refetch } = useMissionResult(id);

  if (isPending) {
    return <LoadingState message="Adding up your results…" className="flex-1 justify-center" />;
  }
  if (isError || !result) {
    return <ErrorState onRetry={() => refetch()} className="flex-1 justify-center" />;
  }

  const ratio = result.total_tasks > 0 ? result.correct_tasks / result.total_tasks : 0;
  const strengthLine =
    ratio >= 0.8
      ? "You got most of these right — this vocabulary is sticking."
      : ratio >= 0.4
        ? "You're recognising some of these words already."
        : "You worked through every task, which is where recognition starts.";
  const improveLine =
    ratio >= 0.8
      ? "Keep using these words out loud so they stay automatic."
      : "Go back over the ones you missed and say them out loud once each.";

  return (
    <View className="flex-1 items-center justify-center gap-lg bg-background px-lg dark:bg-background-dark">
      <Mascot stage={1} mood={ratio >= 0.6 ? "celebrating" : "neutral"} size="large" />

      <View className="items-center gap-xs">
        <Text variant="title">Mission complete</Text>
        <Text variant="body" tone="muted">
          {result.title}
        </Text>
      </View>

      <View className="w-full gap-xs">
        <Text variant="heading" className="text-center">
          {result.correct_tasks} / {result.total_tasks} correct
        </Text>
        <ProgressBar progress={ratio} accessibilityLabel="Mission score" />
      </View>

      <View className="w-full gap-sm">
        <Text variant="body">{strengthLine}</Text>
        <Text variant="body" tone="muted">
          {improveLine}
        </Text>
      </View>

      <Button label="Back to Home" variant="primary" className="w-full" onPress={() => router.replace("/")} />
    </View>
  );
}
