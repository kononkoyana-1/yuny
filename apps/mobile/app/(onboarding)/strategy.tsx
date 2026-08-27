import { View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { Button, ErrorState, LoadingState, Text } from "@/shared/ui";
import { useAssessmentResult } from "@/shared/api";
import { useOnboardingStore } from "@/features/onboarding/store";

/**
 * Screen 08 — Learning Strategy (TZ.md §8 row 08), the last onboarding
 * screen. Copy and the ordered `focus_areas` list match `docs/MVP Product
 * Specification.md` §11's worked example exactly. `focus_areas` comes from
 * the same `AssessmentResult` screen 07 already fetched (same query key —
 * this screen doesn't re-request anything). "Start Learning" is the true
 * exit from onboarding, so it replaces history instead of pushing.
 */
export default function LearningStrategy() {
  const router = useRouter();
  const jobId = useOnboardingStore((state) => state.assessmentJobId);
  const reset = useOnboardingStore((state) => state.reset);

  const { data, isPending, isError, refetch } = useAssessmentResult(jobId ?? undefined);

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
      <View className="gap-lg">
        <Text variant="title">Your learning path</Text>

        <View className="gap-sm">
          {data.focus_areas.map((area, index) => (
            <View key={area} className="flex-row items-start gap-sm">
              <Text variant="heading" tone="muted">
                {index + 1}.
              </Text>
              <Text variant="body" className="flex-1">
                {area}
              </Text>
            </View>
          ))}
        </View>

        <Text variant="body" tone="muted">
          This isn&apos;t a fixed course. Your plan will adapt as you learn.
        </Text>
      </View>

      <Button
        label="Start Learning"
        variant="primary"
        onPress={() => {
          reset();
          router.replace("/");
        }}
      />
    </View>
  );
}
