import { View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { Button, Card, ErrorState, LoadingState, Mascot, Text } from "@/shared/ui";
import { useAssessmentResult, useGoalAnalysis } from "@/shared/api";
import { useOnboardingStore } from "@/features/onboarding/store";
import { capitalize } from "@/shared/lib/capitalize";
import { LevelVerdict } from "@/features/onboarding/LevelVerdict";

/**
 * Screen 07 — Assessment Result (TZ.md §8 row 07). "Stronger / Needs Work /
 * Priority" — copy structure straight from `docs/MVP Product
 * Specification.md` §10. All three fields (plus `learning_state`) are
 * backend-owned data (TZ.md §3 Rule 1 — skill priority is never client-
 * derived); this screen only renders `AssessmentResult`, never computes it.
 */
export default function AssessmentResult() {
  const router = useRouter();
  const jobId = useOnboardingStore((state) => state.assessmentJobId);
  const analysisJobId = useOnboardingStore((state) => state.analysisJobId);

  const { data, isPending, isError, refetch } = useAssessmentResult(jobId ?? undefined);
  // Already cached from screen 04 — same query key, no second request. Needed
  // for the "foundations first" verdict, which compares the measured band
  // against what the goal demands.
  const { data: analysis } = useGoalAnalysis(analysisJobId ?? undefined);

  if (!jobId) {
    return <Redirect href="/assessment" />;
  }

  if (isPending) {
    return <LoadingState message="Checking your answers…" className="flex-1" />;
  }

  if (isError || !data) {
    return <ErrorState onRetry={() => refetch()} className="flex-1 justify-center" />;
  }

  return (
    <View className="flex-1 justify-between gap-lg bg-background px-lg py-xl dark:bg-background-dark">
      <View className="items-center gap-lg">
        <Mascot stage={1} mood="neutral" size="medium" />
        <Text variant="title" className="text-center">
          Here&apos;s where you are now.
        </Text>

        <View className="w-full gap-sm">
          <LevelVerdict
            declared={data.declared_cefr}
            assessed={data.assessed_cefr}
            required={analysis?.required_cefr ?? null}
          />
          <Card className="gap-xs">
            <Text variant="caption" tone="muted">
              Stronger
            </Text>
            <Text variant="heading">{capitalize(data.stronger_skill)}</Text>
          </Card>
          <Card className="gap-xs">
            <Text variant="caption" tone="muted">
              Needs Work
            </Text>
            <Text variant="heading">{capitalize(data.needs_work_skill)}</Text>
          </Card>
          <Card className="gap-xs">
            <Text variant="caption" tone="muted">
              Priority
            </Text>
            <Text variant="heading">{data.priority_label}</Text>
          </Card>
        </View>
      </View>

      <Button label="Continue" variant="primary" onPress={() => router.push("/strategy")} />
    </View>
  );
}
