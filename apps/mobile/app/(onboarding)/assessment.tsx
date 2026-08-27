import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { Button, ErrorState, LoadingState, Text } from "@/shared/ui";
import {
  useCompleteAssessment,
  useNextAssessmentQuestion,
  useSubmitAssessmentAnswer,
} from "@/shared/api";
import { useOnboardingStore } from "@/features/onboarding/store";

/**
 * Screen 06 — Initial Assessment (TZ.md §8 row 06). No "Continue" button —
 * the primary action is per-question submit. Length isn't fixed upfront
 * (mirrors the real `assessment-next` contract: goal_id + previous answers
 * → next question | done) — the UI finds out it's finished the same way the
 * real backend would tell it, by getting `null` back, and then kicks off
 * `assessment_evaluate` itself (screen 07 shows that job's loading state).
 */
export default function Assessment() {
  const router = useRouter();
  const goalId = useOnboardingStore((state) => state.goalId);
  const answeredIds = useOnboardingStore((state) => state.answeredIds);
  const assessmentJobId = useOnboardingStore((state) => state.assessmentJobId);
  const recordAnswer = useOnboardingStore((state) => state.recordAnswer);
  const setAssessmentJobId = useOnboardingStore((state) => state.setAssessmentJobId);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const nextQuestion = useNextAssessmentQuestion(goalId ?? undefined, answeredIds);
  const submitAnswer = useSubmitAssessmentAnswer(goalId ?? undefined);
  const completeAssessment = useCompleteAssessment();

  const isDone = nextQuestion.data === null && !nextQuestion.isPending;

  // Not the "useEffect + fetch" pattern TZ.md §17 forbids (that rule targets
  // fetching data manually instead of via TanStack Query — the actual fetch
  // above already goes through `useNextAssessmentQuestion`). This effect only
  // reacts to that query's already-fetched `data` becoming `null`, which is
  // the TanStack Query v5-idiomatic replacement for the `onSuccess` callback
  // `useQuery` had in v4 (removed in v5 — only `useMutation` still has it,
  // which is why `goal-setup.tsx`'s `analyze()` call is a button handler,
  // not an effect: that one really is a user-triggered write, not a reaction
  // to a query result).
  useEffect(() => {
    if (isDone && goalId && completeAssessment.isIdle) {
      completeAssessment.mutate(goalId, {
        onSuccess: (jobRef) => {
          setAssessmentJobId(jobRef.job_id);
          router.replace("/assessment-result");
        },
      });
    }
  }, [isDone, goalId, completeAssessment, router, setAssessmentJobId]);

  if (!goalId) {
    return <Redirect href="/goal-confirm" />;
  }

  if (assessmentJobId) {
    return <Redirect href="/assessment-result" />;
  }

  if (nextQuestion.isError || completeAssessment.isError || submitAnswer.isError) {
    return (
      <ErrorState
        onRetry={() => {
          nextQuestion.refetch();
          completeAssessment.reset();
          submitAnswer.reset();
        }}
        className="flex-1 justify-center"
      />
    );
  }

  if (nextQuestion.isPending || isDone) {
    return <LoadingState message={isDone ? "Checking your answers…" : "Loading next question…"} className="flex-1" />;
  }

  const question = nextQuestion.data;
  if (!question) {
    return <LoadingState message="Loading next question…" className="flex-1" />;
  }

  function handleSubmit() {
    if (selectedIndex === null || !goalId || !question) return;
    const answer = { question_id: question.id, selected_index: selectedIndex };
    submitAnswer.mutate(answer, {
      onSuccess: () => {
        recordAnswer(answer);
        setSelectedIndex(null);
      },
    });
  }

  return (
    <View className="flex-1 justify-between gap-lg bg-background px-lg py-xl dark:bg-background-dark">
      <View className="gap-lg">
        <Text variant="title">Let&apos;s see where you are now.</Text>
        <Text variant="heading">{question.prompt}</Text>

        <View className="gap-sm">
          {question.options.map((option, index) => {
            const isSelected = selectedIndex === index;
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityLabel={option}
                accessibilityState={{ selected: isSelected }}
                onPress={() => setSelectedIndex(index)}
                className={`min-h-[44px] justify-center rounded-md border px-md py-sm ${
                  isSelected
                    ? "border-primary bg-primary-soft dark:border-primary-dark dark:bg-primary-soft-dark"
                    : "border-border bg-surface dark:border-border-dark dark:bg-surface-dark"
                }`}
              >
                <Text variant="body">{option}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Button
        label="Submit"
        variant="primary"
        disabled={selectedIndex === null}
        loading={submitAnswer.isPending}
        onPress={handleSubmit}
      />
    </View>
  );
}
