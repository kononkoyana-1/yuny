import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Card, ErrorState, LoadingState, Mascot, Text } from "@/shared/ui";
import { useMission } from "@/shared/api";

/**
 * Screen 13 — Mission Overview (TZ.md §8 row 13). Title · Why this matters ·
 * Estimated time · Task count · [Start Mission] (TZ.md §10 "Universal
 * screen rules": one primary action, context, exit).
 *
 * If the mission is already `completed` (the learner finished it earlier,
 * possibly before an app restart), this routes straight to the Result
 * instead of offering to redo it — Result rebuilds itself from persisted
 * `activities`/`evidence` rows either way, so this is a UX shortcut, not
 * where the persistence guarantee lives.
 */
export default function MissionOverview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: mission, isPending, isError, refetch } = useMission(id);

  if (isPending) {
    return <LoadingState message="Loading your mission…" className="flex-1 justify-center" />;
  }

  if (isError || !mission) {
    return <ErrorState onRetry={() => refetch()} className="flex-1 justify-center" />;
  }

  const isCompleted = mission.status === "completed";

  return (
    <View className="flex-1 items-center justify-center gap-lg bg-background px-lg dark:bg-background-dark">
      <Mascot stage={1} mood="neutral" size="large" />

      <View className="items-center gap-xs">
        <Text variant="title" className="text-center">
          {mission.title}
        </Text>
        <Text variant="body" tone="muted" className="text-center">
          {mission.purpose}
        </Text>
      </View>

      <Card className="w-full gap-sm">
        <Text variant="caption" tone="muted" className="uppercase tracking-wide">
          Why this?
        </Text>
        <Text variant="body">{mission.why}</Text>
      </Card>

      <View className="flex-row gap-lg">
        <Text variant="body" tone="muted">
          ~{mission.estimated_minutes} min
        </Text>
        <Text variant="body" tone="muted">
          {mission.tasks.length} tasks
        </Text>
      </View>

      <Button
        label={isCompleted ? "See Result" : "Start Mission"}
        variant="primary"
        className="w-full"
        onPress={() =>
          isCompleted
            ? router.replace({ pathname: "/mission/[id]/result", params: { id: mission.id } })
            : router.push({ pathname: "/mission/[id]/play", params: { id: mission.id } })
        }
      />
      <Button label="Back to Home" variant="ghost" onPress={() => router.replace("/")} />
    </View>
  );
}
