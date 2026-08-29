import { Image, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import type { Mission } from "@yuny/shared";
import {
  Card,
  EmptyState,
  ErrorState,
  Icon,
  LoadingState,
  ProgressBar,
  Text,
} from "@/shared/ui";
import { useActiveGoal, useMission, useProfile, useRecommendation, useRoadmap } from "@/shared/api";
import { RoadmapStepper } from "@/features/home/RoadmapStepper";
import { WhyThisDisclosure } from "@/features/home/WhyThisDisclosure";
import { useTheme } from "@/shared/lib/useTheme";
import { gradients } from "@/shared/config/tokens";
import { linearGradient } from "@/shared/platform/gradient";

/**
 * Screen 09 — Home (TZ.md §8 row 09), laid out to `assets/image/design.png`:
 * greeting, the mission in progress, the next lesson inside it, and the route
 * to the goal.
 *
 * The reference shows "CURRENT MISSION" and "Next up" as two things, and they
 * map onto the data exactly: the card is the mission (title plus how far
 * through it the learner is), and "Next up" is the first task in that mission
 * that is not yet done. One extra `useMission` call serves both.
 *
 * Progress is `completed / total` over task statuses the BACKEND set. The
 * client aggregates them for display; it does not decide any of them, so
 * TZ.md §3 Rule 1 holds. Nothing here invents a percentage.
 *
 * `(tabs)/_layout.tsx` already redirects a goalless user into `(onboarding)`
 * before this mounts, so the `!goal` branch is a defensive fallback for a
 * transient query state rather than the expected path.
 */

/** Task type → what the learner sees. Keys match `MissionTask["type"]`. */
const TASK_LABEL: Record<string, string> = {
  vocabulary_choice: "Vocabulary",
  vocabulary_recall: "Vocabulary",
  listening_comprehension: "Listening",
  reading_comprehension: "Reading",
  speaking_prompt: "Speaking",
  writing_prompt: "Writing",
  grammar_choice: "Grammar",
  dialogue_response: "Speaking",
};

function nextPendingTask(mission: Mission | undefined) {
  return mission?.tasks.find((task) => task.status !== "completed");
}

export default function Home() {
  const router = useRouter();
  const { colors } = useTheme();

  const {
    data: goal,
    isPending: isGoalPending,
    isError: isGoalError,
    refetch: refetchGoal,
  } = useActiveGoal();
  const { data: profile } = useProfile();
  const {
    data: recommendation,
    isPending: isRecommendationPending,
    isError: isRecommendationError,
    refetch: refetchRecommendation,
  } = useRecommendation(goal?.id);
  const { data: mission } = useMission(recommendation?.mission_id);
  const { data: roadmap } = useRoadmap(goal?.id);

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

  const totalTasks = mission?.tasks.length ?? 0;
  const doneTasks = mission?.tasks.filter((task) => task.status === "completed").length ?? 0;
  const progress = totalTasks > 0 ? doneTasks / totalTasks : 0;
  const upcoming = nextPendingTask(mission);
  const [from, to] = gradients.primary;

  /**
   * What the next lesson is called. Tasks carry a type but no title, so the
   * name is derived from the skill it exercises — true to what the lesson is,
   * and different from the mission's own title, which the card above already
   * shows.
   */
  const lessonTitle = upcoming
    ? `${TASK_LABEL[upcoming.type] ?? "Practice"} practice`
    : "Review what you've learned";

  return (
    <ScrollView
      // `gap-md` between sections, not `gap-lg`: with 24px here plus each
      // section's own internal spacing the page drifted apart and pushed the
      // roadmap past the fold. The reference is denser than that.
      contentContainerClassName="gap-md px-lg pb-xl pt-xxl"
      className="flex-1 bg-background dark:bg-background-dark"
    >
      {/* Greeting. The bell is a real control, not decoration: it opens
          Profile, where notification settings live (TZ.md §8 row 12). It uses
          the plain glyph — the badged one exists in the icon set and goes in
          the moment there is an unread count to justify it. */}
      <View className="flex-row items-start justify-between">
        <View className="flex-1 gap-[2px]">
          <Text variant="title">Hi{profile ? `, ${profile.display_name.split(" ")[0]}` : ""}!</Text>
          <Text variant="body" tone="muted">
            Keep going, you&apos;re doing great!
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          onPress={() => router.push("/profile")}
          className="h-[44px] w-[44px] items-center justify-center rounded-pill bg-surface shadow-md shadow-shadow/10 dark:border dark:border-border-dark dark:bg-surface-dark dark:shadow-none"
        >
          <Icon name="bell" size={20} color={colors.text} />
        </Pressable>
      </View>

      {/* Current mission */}
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
        <>
          {/*
            The hero card is deliberately compact — a label, a title, a
            progress row, nothing else. Its earlier version carried the
            "Why this?" disclosure too, which stretched it to ~215px and left
            the mascot floating in empty white. The reference card is about
            130px, and that density is what makes the figure read as part of
            the card rather than as clip-art dropped onto it.

            The mascot is bottom-right and CLIPPED on purpose: it overflows the
            card's right edge, so the card looks like a window onto a bigger
            figure. The text column is capped so nothing ever runs under it.
          */}
          <Card className="gap-sm overflow-hidden pb-md">
            {/* Size and position go in `style`, not `className`: NativeWind
                did not apply the width/height utilities to `Image` here, and
                an unsized absolutely-positioned image expands to fill its
                parent — the mascot swallowed the whole card. */}
            <Image
              source={require("@/assets/mascot/neutral.png")}
              style={{
                position: "absolute",
                right: -18,
                bottom: -14,
                width: 150,
                height: 150,
              }}
              resizeMode="contain"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />

            <View className="w-[60%] gap-[2px]">
              <Text variant="caption" tone="muted" className="uppercase tracking-wide">
                Current mission
              </Text>
              <Text variant="heading">{recommendation.mission_title}</Text>
            </View>

            {totalTasks > 0 ? (
              <View className="w-[60%] gap-[6px]">
                <View className="flex-row items-center gap-sm">
                  <View className="flex-1">
                    <ProgressBar
                      progress={progress}
                      accessibilityLabel={`${doneTasks} of ${totalTasks} lessons done`}
                    />
                  </View>
                  <Text variant="caption" className="font-bold">
                    {Math.round(progress * 100)}%
                  </Text>
                </View>
                <Text variant="caption" tone="muted">
                  Lesson {Math.min(doneTasks + 1, totalTasks)} of {totalTasks}
                  {upcoming ? ` · ${TASK_LABEL[upcoming.type] ?? "Practice"}` : ""}
                </Text>
              </View>
            ) : null}
          </Card>

          {/* Next up — the first task of that mission that is not done yet.
              This row IS the screen's primary action, matching the reference,
              which carries no separate button. TZ.md §8 row 09 names the CTA
              "[Start Mission]"; keeping both a button and this card would put
              two primary actions on Home, which §10 rules out outright. The
              accessible name spells the action out, so nothing is lost to a
              screen reader by the label living on the row. */}
          <View className="gap-sm">
            <Text variant="body" className="font-bold">
              Next up
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Start ${lessonTitle}`}
              onPress={() =>
                router.push({
                  pathname: "/mission/[id]",
                  params: { id: recommendation.mission_id },
                })
              }
              className="flex-row items-center gap-md rounded-card bg-surface p-sm shadow-md shadow-shadow/10 dark:border dark:border-border-dark dark:bg-surface-dark dark:shadow-none"
            >
              <View className="h-[52px] w-[52px] items-center justify-center rounded-md bg-primary-soft dark:bg-primary-soft-dark">
                <Icon name="library" size={26} color={colors.primary} />
              </View>
              {/*
                The lesson, not the mission again. Both cards used to print
                `mission_title`, so the screen said the same sentence twice in
                a row and read like a bug. The eyebrow places the lesson inside
                the mission; the title names what this particular lesson does.
              */}
              <View className="flex-1 gap-[2px]">
                <Text variant="caption" tone="muted">
                  Lesson {Math.min(doneTasks + 1, Math.max(totalTasks, 1))}
                  {totalTasks > 0 ? ` of ${totalTasks}` : ""}
                </Text>
                <Text variant="body" className="font-bold">
                  {lessonTitle}
                </Text>
                <Text variant="caption" tone="muted">
                  ~{recommendation.estimated_minutes} min
                </Text>
              </View>
              <View
                className="h-[44px] w-[44px] items-center justify-center rounded-pill"
                style={linearGradient(from, to)}
              >
                <Text variant="heading" tone="inverse">
                  →
                </Text>
              </View>
            </Pressable>

            {/* "Why this?" belongs to the recommendation, so it sits under the
                thing it explains rather than inside the hero card, where it
                competed with the mascot for the same corner. TZ.md §8 row 09
                still gets its disclosure; it just stopped inflating the card. */}
            <WhyThisDisclosure reason={recommendation.reason} />
          </View>
        </>
      )}

      {/* The route. Absent until the backend builds one — "no map yet" is the
          normal early state, so nothing is drawn rather than an empty frame. */}
      {roadmap ? (
        <View className="gap-sm">
          <Text variant="caption" tone="muted" className="uppercase tracking-wide">
            Your roadmap
          </Text>
          <RoadmapStepper roadmap={roadmap} />
        </View>
      ) : null}
    </ScrollView>
  );
}
