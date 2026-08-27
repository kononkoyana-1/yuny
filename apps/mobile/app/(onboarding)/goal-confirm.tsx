import { ScrollView, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { Button, Card, ErrorState, LoadingState, Text } from "@/shared/ui";
import { useConfirmGoal } from "@/shared/api";
import { useOnboardingStore } from "@/features/onboarding/store";

/**
 * Screen 05 — Goal Confirmation (TZ.md §8 row 05). Read-only recap of Goal /
 * Deadline / Available Time / Outcomes (MVP Spec §8) — corrections happen by
 * going back to screen 04, not here. Confirming sets the goal `status:
 * "active"` (`useConfirmGoal` already invalidates `activeGoal`, so Home
 * reflects it without a manual refresh) and is the "point of no return" for
 * this draft, so the next step replaces this screen in history instead of
 * stacking on top of it.
 */
export default function GoalConfirm() {
  const router = useRouter();
  const targetLanguage = useOnboardingStore((state) => state.targetLanguage);
  const rawInput = useOnboardingStore((state) => state.rawInput);
  const deadline = useOnboardingStore((state) => state.deadline);
  const dailyMinutes = useOnboardingStore((state) => state.dailyMinutes);
  const title = useOnboardingStore((state) => state.title);
  const outcomes = useOnboardingStore((state) => state.outcomes);
  const setGoalId = useOnboardingStore((state) => state.setGoalId);

  const confirmGoal = useConfirmGoal();

  if (!targetLanguage || !dailyMinutes || outcomes.length === 0) {
    return <Redirect href="/goal-setup" />;
  }

  if (confirmGoal.isPending || confirmGoal.isSuccess) {
    // isSuccess avoids flashing this screen again for a frame between the
    // mutation resolving and `onSuccess`'s `router.replace` landing.
    return <LoadingState message="Setting up your goal…" className="flex-1" />;
  }

  if (confirmGoal.isError) {
    return (
      <ErrorState onRetry={() => confirmGoal.reset()} className="flex-1 justify-center" />
    );
  }

  function handleConfirm() {
    if (!targetLanguage || !dailyMinutes) return;
    confirmGoal.mutate(
      {
        raw_input: rawInput,
        target_language: targetLanguage,
        deadline,
        daily_minutes: dailyMinutes,
        title,
        outcomes,
      },
      {
        onSuccess: (goal) => {
          setGoalId(goal.id);
          router.replace("/assessment");
        },
      },
    );
  }

  return (
    <ScrollView
      contentContainerClassName="gap-lg bg-background px-lg py-xl dark:bg-background-dark"
      className="flex-1 bg-background dark:bg-background-dark"
    >
      <Text variant="title">This is what I want to achieve.</Text>

      <Card className="gap-sm">
        <Text variant="heading">{title}</Text>
        <Text variant="body" tone="muted">
          Deadline: {deadline}
        </Text>
        <Text variant="body" tone="muted">
          {dailyMinutes} minutes a day
        </Text>
      </Card>

      <View className="gap-sm">
        <Text variant="caption" tone="muted">
          Language outcomes
        </Text>
        {outcomes.map((outcome, index) => (
          <Card key={`${outcome.position}-${index}`} className="gap-xs">
            <Text variant="body" className="font-semibold">
              {outcome.label}
            </Text>
            <Text variant="body" tone="muted">
              {outcome.description}
            </Text>
          </Card>
        ))}
      </View>

      <View className="gap-sm">
        <Button label="Looks right" variant="primary" onPress={handleConfirm} />
        <Button label="Edit" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}
