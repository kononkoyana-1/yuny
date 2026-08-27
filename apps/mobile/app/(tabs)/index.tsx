import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Card, EmptyState, ErrorState, LoadingState, Mascot, Text } from "@/shared/ui";
import { useActiveGoal, useRecommendation } from "@/shared/api";
import { formatDaysLeft } from "@/shared/lib/daysUntil";
import { WhyThisDisclosure } from "@/features/home/WhyThisDisclosure";

/**
 * Screen 09 — Home (TZ.md §8 row 09, §19 Phase 4). The main app entry point
 * (TZ.md §7 "Home — главный экран и главный entry point"): Mascot, Active
 * Goal + Deadline + Readiness, Today's Mission, "Why this?", and the single
 * primary CTA ([Start Mission]).
 *
 * `(tabs)/_layout.tsx` already redirects a goalless user into `(onboarding)`
 * before this ever mounts (TZ.md §7 "во время onboarding основная
 * навигация скрыта"), so the `!goal` branch below is a defensive fallback
 * for a transient query state, not the expected path.
 *
 * Mascot props are hardcoded-plausible (`stage={1}`, `mood="neutral"`), not
 * backend-driven — there is no `mascot_states` repository yet (see this
 * screen's task handoff, "Open Questions"). `MascotStateSchema` already
 * exists in `@yuny/shared` but nothing populates or reads it; wiring that
 * up is out of scope here (TZ.md §3 Rule 1 — mascot mood/stage is backend-
 * owned, not something to fake more elaborately than a static placeholder).
 */
export default function Home() {
  const router = useRouter();
  const {
    data: goal,
    isPending: isGoalPending,
    isError: isGoalError,
    refetch: refetchGoal,
  } = useActiveGoal();
  const {
    data: recommendation,
    isPending: isRecommendationPending,
    isError: isRecommendationError,
    refetch: refetchRecommendation,
  } = useRecommendation(goal?.id);

  if (isGoalPending) {
    return <LoadingState message="Loading your goal…" className="flex-1 justify-center" />;
  }

  if (isGoalError) {
    return <ErrorState onRetry={() => refetchGoal()} className="flex-1 justify-center" />;
  }

  if (!goal) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-lg dark:bg-background-dark">
        <EmptyState
          message="What do you want to achieve?"
          actionLabel="Create Goal"
          onAction={() => router.push("/welcome")}
        />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerClassName="gap-lg bg-background px-lg py-xl dark:bg-background-dark"
      className="flex-1 bg-background dark:bg-background-dark"
    >
      {/* Hero — Mascot + Goal + Deadline + Readiness (MVP Spec "Home — Mascot"/"Home — Goal": large, central, not overloaded with technical indicators). */}
      <View className="items-center gap-md rounded-xl bg-primary-soft p-xl dark:bg-primary-soft-dark">
        <Mascot stage={1} mood="neutral" size="large" />

        <View className="items-center gap-xs">
          <Text variant="caption" tone="muted" className="uppercase tracking-wide">
            Your Goal
          </Text>
          <Text variant="title" className="text-center">
            {goal.title}
          </Text>
          <Text variant="body" tone="muted">
            {formatDaysLeft(goal.deadline)}
          </Text>
        </View>

        {goal.readiness_label ? (
          <View
            accessibilityRole="text"
            className="rounded-pill bg-accent-soft px-md py-xs dark:bg-accent-soft-dark"
          >
            <Text variant="body" className="font-semibold">
              {goal.readiness_label}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Today's Mission — the one primary CTA on this screen (MVP Spec "Home — Recommendation": "one best next action"). */}
      {isRecommendationPending ? (
        <Card className="items-center gap-sm py-lg">
          <Text variant="body" tone="muted">
            Finding your next best step…
          </Text>
        </Card>
      ) : isRecommendationError ? (
        <Card>
          <ErrorState
            message="Couldn't load your next mission."
            onRetry={() => refetchRecommendation()}
          />
        </Card>
      ) : !recommendation ? (
        <Card className="items-center gap-sm py-lg">
          <Text variant="body" tone="muted" className="text-center">
            Let&apos;s figure out what would help you most.
          </Text>
        </Card>
      ) : (
        <Card className="gap-md border border-primary dark:border-primary-dark">
          <Text variant="caption" tone="muted">
            Today&apos;s Mission
          </Text>
          <Text variant="heading">{recommendation.mission_title}</Text>
          <Text variant="caption" tone="muted">
            ~{recommendation.estimated_minutes} min
          </Text>

          <WhyThisDisclosure reason={recommendation.reason} />

          <Button
            label="Start Mission"
            variant="primary"
            onPress={() =>
              router.push({
                pathname: "/mission/[id]",
                params: { id: recommendation.mission_id },
              })
            }
          />
        </Card>
      )}
    </ScrollView>
  );
}
