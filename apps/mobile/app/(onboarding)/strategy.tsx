import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import type { RoadmapModule } from "@yuny/shared";
import { Button, ErrorState, LoadingState, Text } from "@/shared/ui";
import {
  useAssessmentResult,
  useGenerateMission,
  useRoadmap,
  useSetDailyMinutes,
} from "@/shared/api";
import { useOnboardingStore } from "@/features/onboarding/store";
import {
  DAILY_MINUTES_OPTIONS,
  lessonsPerDay,
  type DailyMinutes,
} from "@/features/onboarding/dailyMinutes";

/**
 * Screen 08 — Learning Strategy (TZ.md §8 row 08), the last onboarding screen.
 *
 * Shows the real route when the backend built one: `assessment-complete`
 * constructs `roadmap_modules` inside the same job this screen is already
 * waiting on (docs/onboarding-v2.md §6), so the map is there by the time the
 * verdict is. Modules are rendered, never tapped — TZ.md §7 rejects a lesson
 * catalogue, and a module that can be started from here is that catalogue
 * (`MVP-3.01`). The one action on this screen stays "Start Learning".
 *
 * Falls back to the ordered `focus_areas` list from `docs/MVP Product
 * Specification.md` §11 when there is no route yet — which is the honest state
 * while the content pipeline has no reviewed material at the learner's bands,
 * not an error.
 *
 * The daily-time question lives here rather than on screen 03, where it used
 * to sit: asked before the assessment it is a guess, asked here it is a
 * decision made against a known level and a visible plan. Each option shows
 * what it buys in lessons, so the number is concrete rather than abstract.
 *
 * "Start Learning" commits both the time and the first mission before it lets
 * the learner through — landing on Home with neither would show a plan the
 * system cannot act on.
 */
/**
 * Status is shown as a position in a route, never as a percentage: MVP Spec
 * §40.3 and TZ.md §20 both rule out a numerical score as the headline measure
 * of where a learner stands.
 */
const MODULE_STATUS_LABEL: Record<RoadmapModule["status"], string> = {
  in_progress: "You start here",
  available: "Next",
  locked: "Later",
  completed: "Done",
};

function ModuleRow({ module }: { module: RoadmapModule }) {
  const isCurrent = module.status === "in_progress";
  return (
    <View
      className={`gap-xs rounded-md border p-md ${
        isCurrent
          ? "border-primary bg-primary-soft dark:border-primary-dark dark:bg-primary-soft-dark"
          : "border-border bg-surface dark:border-border-dark dark:bg-surface-dark"
      }`}
    >
      <View className="flex-row items-center justify-between gap-sm">
        <Text variant="caption" tone={isCurrent ? "brand" : "muted"}>
          {MODULE_STATUS_LABEL[module.status]}
        </Text>
        <Text variant="caption" tone="muted">
          {module.target_cefr}
        </Text>
      </View>
      <Text variant="heading">{module.title}</Text>
      <Text variant="body" tone="muted">
        {module.why}
      </Text>
    </View>
  );
}

export default function LearningStrategy() {
  const router = useRouter();
  const jobId = useOnboardingStore((state) => state.assessmentJobId);
  const goalId = useOnboardingStore((state) => state.goalId);
  const reset = useOnboardingStore((state) => state.reset);

  const [minutes, setMinutes] = useState<DailyMinutes | null>(null);

  const { data, isPending, isError, refetch } = useAssessmentResult(jobId ?? undefined);
  // Resolving to null is the normal early state, so this never gates the
  // screen on its own — the route is shown if it exists and skipped if not.
  const { data: roadmap } = useRoadmap(goalId ?? undefined);
  const setDailyMinutes = useSetDailyMinutes();
  const generateMission = useGenerateMission();

  if (!jobId) {
    return <Redirect href="/assessment" />;
  }

  if (isPending) {
    return <LoadingState message="Checking your answers…" className="flex-1" />;
  }

  if (isError || !data) {
    return <ErrorState onRetry={() => refetch()} className="flex-1 justify-center" />;
  }

  if (setDailyMinutes.isPending || generateMission.isPending) {
    return (
      <LoadingState message="Building your first mission…" className="flex-1 justify-center" />
    );
  }

  if (setDailyMinutes.isError || generateMission.isError) {
    return (
      <ErrorState
        message="Couldn't set up your plan."
        onRetry={() => {
          setDailyMinutes.reset();
          generateMission.reset();
        }}
        className="flex-1 justify-center"
      />
    );
  }

  const canStart = minutes !== null && goalId !== null;

  function handleStart() {
    if (!goalId || minutes === null) return;
    setDailyMinutes.mutate(
      { goalId, dailyMinutes: minutes },
      {
        onSuccess: () => {
          generateMission.mutate(goalId, {
            onSuccess: () => {
              reset();
              router.replace("/");
            },
          });
        },
      },
    );
  }

  return (
    <ScrollView
      contentContainerClassName="gap-lg bg-background px-lg py-xl dark:bg-background-dark"
      className="flex-1 bg-background dark:bg-background-dark"
    >
      <Text variant="title">Your learning path</Text>

      {roadmap && roadmap.modules.length > 0 ? (
        <View className="gap-sm">
          {roadmap.modules.map((module) => (
            <ModuleRow key={module.id} module={module} />
          ))}
        </View>
      ) : (
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
      )}

      <Text variant="body" tone="muted">
        This isn&apos;t a fixed course. Your plan will adapt as you learn.
      </Text>

      <View className="gap-xs">
        <Text variant="caption" tone="muted">
          How much time can you give it a day?
        </Text>
        <View className="flex-row flex-wrap gap-sm">
          {DAILY_MINUTES_OPTIONS.map((option) => {
            const isSelected = minutes === option;
            const lessons = lessonsPerDay(option);
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityLabel={`${option} minutes a day`}
                accessibilityHint={`${lessons} ${lessons === 1 ? "lesson" : "lessons"}`}
                accessibilityState={{ selected: isSelected }}
                onPress={() => setMinutes(option)}
                className={`min-h-[44px] min-w-[88px] items-center justify-center rounded-md border px-md py-sm ${
                  isSelected
                    ? "border-primary bg-primary-soft dark:border-primary-dark dark:bg-primary-soft-dark"
                    : "border-border bg-surface dark:border-border-dark dark:bg-surface-dark"
                }`}
              >
                <Text
                  variant="body"
                  className={isSelected ? "font-semibold text-primary dark:text-primary-dark" : ""}
                >
                  {option} min
                </Text>
                <Text variant="caption" tone="muted">
                  {lessons} {lessons === 1 ? "lesson" : "lessons"}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text variant="caption" tone="muted">
          Lessons are 5–7 minutes each. You don&apos;t have to do them back to back.
        </Text>
      </View>

      <Button
        label="Start Learning"
        variant="primary"
        disabled={!canStart}
        onPress={handleStart}
      />
    </ScrollView>
  );
}
