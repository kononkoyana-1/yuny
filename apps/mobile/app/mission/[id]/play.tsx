import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, ErrorState, FeedbackBanner, LoadingState, ProgressBar, Text } from "@/shared/ui";
import { useMission, useSubmitTask } from "@/shared/api";
import { TASK_RENDERERS } from "@/features/mission/taskRenderers";
import type { TaskResponseInput } from "@/shared/repositories";

/**
 * The one reusable Task Screen (TZ.md §9's ActivityShell, scaled to this
 * phase's two task types). Owns progress, the Submit button, submission,
 * and the transition into feedback — the renderer in `TASK_RENDERERS` owns
 * only its input widget (TZ.md §9 "Разделение ответственности").
 *
 * A flat `{ index, draft, result }` state, not a library state machine —
 * TZ.md §9 explicitly asks for exactly this ("Плоский reducer... Никаких
 * XState").
 */
export default function MissionPlay() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: mission, isPending, isError, refetch } = useMission(id);
  const submitTask = useSubmitTask(id);

  /**
   * `null` until the learner moves: where a mission *starts* is a question
   * about the mission, not about this component, so it is answered from the
   * loaded tasks below rather than guessed at mount. Once they press Continue
   * this holds their actual position.
   */
  const [index, setIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<TaskResponseInput | null>(null);

  if (isPending) {
    return <LoadingState message="Loading your mission…" className="flex-1 justify-center" />;
  }
  if (isError || !mission) {
    return <ErrorState onRetry={() => refetch()} className="flex-1 justify-center" />;
  }

  /**
   * Resume where the learner stopped. `activity-submit` marks each activity
   * `completed`, so the first task that is not completed is the one they owe.
   * Restarting from zero was survivable at four tasks; at fifteen to twenty it
   * means a learner who closes the app mid-session comes back to answers they
   * have already given, and the submitted ones are already graded — they would
   * be re-answering for nothing.
   */
  const firstUnfinished = mission.tasks.findIndex((candidate) => candidate.status !== "completed");
  const position = index ?? (firstUnfinished === -1 ? mission.tasks.length : firstUnfinished);

  const task = mission.tasks[position];
  if (!task) {
    // All tasks already completed (e.g. the learner navigated back in here
    // after finishing) — there is nowhere useful to go but the result.
    router.replace({ pathname: "/mission/[id]/result", params: { id: mission.id } });
    return <LoadingState message="Loading your result…" className="flex-1 justify-center" />;
  }

  const Renderer = TASK_RENDERERS[task.type];
  const result = submitTask.data;
  const showingFeedback = Boolean(result) && !submitTask.isPending;

  // Captured as locals (rather than read from `mission` inside the closure
  // below) so the narrowing from the early-return above still applies —
  // TypeScript doesn't carry it into a nested `function` declaration.
  const totalTasks = mission.tasks.length;
  const missionId = mission.id;

  function handleContinue() {
    const wasLast = position === totalTasks - 1;
    submitTask.reset();
    setDraft(null);
    if (wasLast) {
      router.replace({ pathname: "/mission/[id]/result", params: { id: missionId } });
    } else {
      setIndex(position + 1);
    }
  }

  return (
    <ScrollView
      contentContainerClassName="grow gap-lg bg-background px-lg py-xl dark:bg-background-dark"
      className="flex-1 bg-background dark:bg-background-dark"
    >
      <View className="gap-xs">
        <Text variant="caption" tone="muted">
          Task {position + 1} of {mission.tasks.length}
        </Text>
        <ProgressBar
          progress={(position + (showingFeedback ? 1 : 0)) / mission.tasks.length}
          accessibilityLabel={`Task ${position + 1} of ${mission.tasks.length}`}
        />
      </View>

      <Renderer task={task} value={draft} onChange={setDraft} disabled={showingFeedback} />

      {submitTask.isError ? (
        <FeedbackBanner tone="encouraging" message="Something went wrong. Try submitting again." />
      ) : null}

      {showingFeedback && result ? (
        <View className="gap-md">
          <FeedbackBanner
            tone={result.evidence.strength === "strong" ? "positive" : "encouraging"}
            message={result.feedback.went_well}
          />
          <Text variant="body" tone="muted">
            {result.feedback.improve}
          </Text>
          <Button label="Continue" variant="primary" onPress={handleContinue} />
        </View>
      ) : (
        <Button
          label="Submit"
          variant="primary"
          disabled={!draft}
          loading={submitTask.isPending}
          onPress={() => draft && submitTask.mutate({ activityId: task.id, response: draft })}
        />
      )}
    </ScrollView>
  );
}
