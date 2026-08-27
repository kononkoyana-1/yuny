import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { Button, ErrorState, Input, LoadingState, Text, TextArea } from "@/shared/ui";
import { useAnalyzeGoal } from "@/shared/api";
import { useOnboardingStore } from "@/features/onboarding/store";

const DEADLINE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDeadline(value: string): boolean {
  return DEADLINE_PATTERN.test(value) && !Number.isNaN(Date.parse(value));
}

/**
 * Screen 03 — Goal Setup (TZ.md §8 row 03). Free text + Deadline + Available
 * Time, "не длинный questionnaire" (MVP Spec §6). Submitting kicks off the
 * `goal_analyze` job right here (a button press, not a mount-triggered
 * effect — TZ.md §17 "Никаких useEffect + fetch") and shows the job's
 * loading state before navigating, since the next screen needs the
 * resolved `job_id` to know what to fetch.
 */
export default function GoalSetup() {
  const router = useRouter();
  const targetLanguage = useOnboardingStore((state) => state.targetLanguage);
  const setGoalSetup = useOnboardingStore((state) => state.setGoalSetup);
  const setAnalysisJobId = useOnboardingStore((state) => state.setAnalysisJobId);

  const [rawInput, setRawInput] = useState("");
  const [deadline, setDeadline] = useState("");
  const [minutesText, setMinutesText] = useState("");

  const analyzeGoal = useAnalyzeGoal();

  if (!targetLanguage) {
    return <Redirect href="/language" />;
  }

  if (analyzeGoal.isPending || analyzeGoal.isSuccess) {
    // isSuccess stays true through the single render between the mutation
    // resolving and `onSuccess`'s `router.push` actually landing — without
    // it this screen would flash its form again for a frame mid-navigation.
    return <LoadingState message="Analyzing your goal…" className="flex-1" />;
  }

  if (analyzeGoal.isError) {
    return (
      <ErrorState
        onRetry={() => analyzeGoal.reset()}
        className="flex-1 justify-center"
      />
    );
  }

  const dailyMinutes = Number.parseInt(minutesText, 10);
  const isValid =
    rawInput.trim().length > 0 && isValidDeadline(deadline) && Number.isInteger(dailyMinutes) && dailyMinutes > 0;

  function handleContinue() {
    if (!isValid || !targetLanguage) return;
    analyzeGoal.mutate(
      { raw_input: rawInput, target_language: targetLanguage, deadline, daily_minutes: dailyMinutes },
      {
        onSuccess: (jobRef) => {
          setGoalSetup({ rawInput, deadline, dailyMinutes });
          setAnalysisJobId(jobRef.job_id);
          router.push("/goal-analysis");
        },
      },
    );
  }

  return (
    <ScrollView
      contentContainerClassName="gap-lg bg-background px-lg py-xl dark:bg-background-dark"
      className="flex-1 bg-background dark:bg-background-dark"
    >
      <Text variant="title">What do you want to achieve?</Text>

      <View className="gap-xs">
        <Text variant="caption" tone="muted">
          Your goal
        </Text>
        <TextArea
          value={rawInput}
          onChangeText={setRawInput}
          placeholder="e.g. I want to get a job in Germany."
          accessibilityLabel="Your goal"
        />
      </View>

      <View className="gap-xs">
        <Text variant="caption" tone="muted">
          Deadline
        </Text>
        <Input
          value={deadline}
          onChangeText={setDeadline}
          placeholder="YYYY-MM-DD"
          accessibilityLabel="Deadline"
        />
      </View>

      <View className="gap-xs">
        <Text variant="caption" tone="muted">
          Available time (minutes per day)
        </Text>
        <Input
          value={minutesText}
          onChangeText={setMinutesText}
          placeholder="e.g. 25"
          keyboardType="number-pad"
          accessibilityLabel="Available time in minutes per day"
        />
      </View>

      <Button label="Continue" variant="primary" disabled={!isValid} onPress={handleContinue} />
    </ScrollView>
  );
}
