import { useEffect } from "react";
import { ScrollView, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import {
  Button,
  ErrorState,
  Input,
  LoadingState,
  Mascot,
  SkillPill,
  Text,
  TextArea,
} from "@/shared/ui";
import { useGoalAnalysis } from "@/shared/api";
import { useOnboardingStore, type DraftOutcome } from "@/features/onboarding/store";

/**
 * Screen 04 — Goal Analysis (TZ.md §8 row 04). Shows how the system
 * interpreted the goal and lets the user correct it before confirming
 * (MVP Spec §7). `title`/`outcomes` are seeded into the onboarding store
 * once per `analysisJobId` (`analysisSeeded` guard) so edits survive
 * re-renders and back/forward navigation without being clobbered by a
 * stale re-seed.
 */
export default function GoalAnalysis() {
  const router = useRouter();
  const jobId = useOnboardingStore((state) => state.analysisJobId);
  const analysisSeeded = useOnboardingStore((state) => state.analysisSeeded);
  const title = useOnboardingStore((state) => state.title);
  const outcomes = useOnboardingStore((state) => state.outcomes);
  const seedAnalysis = useOnboardingStore((state) => state.seedAnalysis);
  const setTitle = useOnboardingStore((state) => state.setTitle);
  const setOutcome = useOnboardingStore((state) => state.setOutcome);

  const { data, isPending, isError, refetch } = useGoalAnalysis(jobId ?? undefined);

  // Reacts to the query's own `data`, not a fetch of its own (TZ.md §17
  // "Никаких useEffect + fetch" targets the latter) — TanStack Query v5
  // dropped `useQuery`'s `onSuccess` callback, so this is its replacement.
  useEffect(() => {
    if (data && !analysisSeeded) {
      seedAnalysis(data.title, data.outcomes);
    }
  }, [data, analysisSeeded, seedAnalysis]);

  if (!jobId) {
    return <Redirect href="/goal-setup" />;
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} className="flex-1 justify-center" />;
  }

  if (isPending || !analysisSeeded || !data) {
    return <LoadingState message="Analyzing your goal…" className="flex-1" />;
  }

  return (
    <ScrollView
      contentContainerClassName="gap-lg bg-background px-lg py-xl dark:bg-background-dark"
      className="flex-1 bg-background dark:bg-background-dark"
    >
      <Mascot stage={1} mood="thinking" size="small" />

      <View className="gap-xs">
        <Text variant="caption" tone="muted">
          Your goal
        </Text>
        <Input value={title} onChangeText={setTitle} accessibilityLabel="Your goal" />
      </View>

      {data.target_situations.length > 0 ? (
        <View className="gap-xs">
          <Text variant="caption" tone="muted">
            Where this comes up
          </Text>
          {data.target_situations.map((situation) => (
            <Text key={situation} variant="body">
              • {situation}
            </Text>
          ))}
        </View>
      ) : null}

      {data.required_skills.length > 0 ? (
        <View className="gap-xs">
          <Text variant="caption" tone="muted">
            Skills this will build
          </Text>
          <View className="flex-row flex-wrap gap-xs">
            {data.required_skills.map((skill) => (
              <SkillPill key={skill} skill={skill} />
            ))}
          </View>
        </View>
      ) : null}

      <View className="gap-md">
        <Text variant="caption" tone="muted">
          Language outcomes
        </Text>
        {outcomes.map((outcome, index) => (
          <View key={`${outcome.position}-${index}`} className="gap-xs">
            <Input
              value={outcome.label}
              onChangeText={(value) => setOutcome(index, { label: value })}
              accessibilityLabel={`Outcome ${index + 1} label`}
            />
            <TextArea
              value={outcome.description}
              onChangeText={(value) => setOutcome(index, { description: value })}
              accessibilityLabel={`Outcome ${index + 1} description`}
            />
          </View>
        ))}
      </View>

      <Button
        label="Continue"
        variant="primary"
        disabled={!isDraftValid(title, outcomes)}
        onPress={() => router.push("/goal-confirm")}
      />
    </ScrollView>
  );
}

/** Corrections are free text (MVP Spec §7) but can't be blanked out entirely. */
function isDraftValid(title: string, outcomes: DraftOutcome[]): boolean {
  return (
    title.trim().length > 0 &&
    outcomes.every((outcome) => outcome.label.trim().length > 0 && outcome.description.trim().length > 0)
  );
}
