import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { Button, ErrorState, Input, LoadingState, Text, TextArea } from "@/shared/ui";
import { useAnalyzeGoal } from "@/shared/api";
import { useOnboardingStore } from "@/features/onboarding/store";
import { euroToIso, formatEuroDateInput } from "@/shared/lib/euroDate";
import { PROVISIONAL_DAILY_MINUTES } from "@/features/onboarding/dailyMinutes";
import type { DeclaredLevel } from "@/shared/repositories";

/**
 * "I'm not sure" comes first deliberately. Most people arriving here cannot
 * place themselves on a CEFR scale, and making them guess before the test
 * only biases the starting band. The assessment treats it as A2 and widens
 * its search (docs/onboarding-v2.md §4.1).
 */
const LEVEL_OPTIONS: { value: DeclaredLevel; label: string; hint: string }[] = [
  { value: "unknown", label: "I'm not sure", hint: "We'll work it out in the check" },
  { value: "A1", label: "A1 — Beginner", hint: "A few words and set phrases" },
  { value: "A2", label: "A2 — Elementary", hint: "Simple everyday exchanges" },
  { value: "B1", label: "B1 — Intermediate", hint: "Can handle most familiar situations" },
  { value: "B2", label: "B2 — Upper intermediate", hint: "Comfortable in longer discussion" },
  { value: "C1", label: "C1 — Advanced", hint: "Fluent and flexible, including nuance" },
];

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
  // Held as the learner typed it (dd.mm.yyyy); converted once, on submit.
  const [deadlineText, setDeadlineText] = useState("");
  const [declaredLevel, setDeclaredLevel] = useState<DeclaredLevel | null>(null);
  const deadlineIso = euroToIso(deadlineText);

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

  const isValid = rawInput.trim().length > 0 && deadlineIso !== null && declaredLevel !== null;

  function handleContinue() {
    if (!isValid || !targetLanguage || !declaredLevel || !deadlineIso) return;
    analyzeGoal.mutate(
      {
        raw_input: rawInput,
        target_language: targetLanguage,
        deadline: deadlineIso,
        // The learner picks their real study time on screen 08, once they
        // know their level — choosing it before the assessment is choosing
        // blind. The goal still needs a value at creation (the column is NOT
        // NULL), so it starts at the middle option and screen 08 commits the
        // chosen one before Home is ever reached.
        daily_minutes: PROVISIONAL_DAILY_MINUTES,
        declared_level: declaredLevel,
      },
      {
        onSuccess: (jobRef) => {
          setGoalSetup({
            rawInput,
            deadline: deadlineIso,
            dailyMinutes: PROVISIONAL_DAILY_MINUTES,
            declaredLevel,
          });
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
          value={deadlineText}
          onChangeText={(next) => setDeadlineText(formatEuroDateInput(next))}
          placeholder="31.12.2026"
          keyboardType="number-pad"
          accessibilityLabel="Deadline"
          accessibilityHint="Day, month, year"
        />
      </View>

      <View className="gap-xs">
        <Text variant="caption" tone="muted">
          Your level in this language
        </Text>
        <View className="gap-sm">
          {LEVEL_OPTIONS.map((option) => {
            const isSelected = declaredLevel === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityHint={option.hint}
                accessibilityState={{ selected: isSelected }}
                onPress={() => setDeclaredLevel(option.value)}
                className={`min-h-[44px] justify-center rounded-md border px-md py-sm ${
                  isSelected
                    ? "border-primary bg-primary-soft dark:border-primary-dark dark:bg-primary-soft-dark"
                    : "border-border bg-surface dark:border-border-dark dark:bg-surface-dark"
                }`}
              >
                <Text
                  variant="body"
                  className={isSelected ? "font-semibold text-primary dark:text-primary-dark" : ""}
                >
                  {option.label}
                </Text>
                <Text variant="caption" tone="muted">
                  {option.hint}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Button label="Continue" variant="primary" disabled={!isValid} onPress={handleContinue} />
    </ScrollView>
  );
}
