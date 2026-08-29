import { View } from "react-native";
import type { CefrLevel } from "@yuny/shared";
import { Card, Text } from "@/shared/ui";

const ORDER: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

/**
 * Screen 07's level verdict: what the learner said about themselves against
 * what the assessment measured (docs/onboarding-v2.md §4.2).
 *
 * Three outcomes, and the copy for each is written to TZ.md §14's tone rule —
 * warm, concrete, no scores. A learner who overestimated is not told they were
 * wrong; they are told where the work starts. No percentages appear anywhere,
 * because a placement band is not a grade.
 */
export interface LevelVerdictProps {
  declared: CefrLevel | null;
  assessed: CefrLevel | null;
  /** The band the goal itself needs, from `goal-analyze`. */
  required: CefrLevel | null;
}

type Outcome = "confirmed" | "adjusted" | "foundations";

function classify(declared: CefrLevel | null, assessed: CefrLevel | null, required: CefrLevel | null): Outcome {
  if (!assessed) return "confirmed";
  if (required && ORDER.indexOf(required) - ORDER.indexOf(assessed) >= 2) return "foundations";
  if (declared && declared !== assessed) return "adjusted";
  return "confirmed";
}

const COPY: Record<Outcome, { title: string; body: (a: string, r: string) => string }> = {
  confirmed: {
    title: "You placed yourself well",
    body: (a) => `We'll start at ${a}, which is where your answers put you.`,
  },
  adjusted: {
    title: "We've set your starting point",
    body: (a) => `Your answers place you at ${a}. That's where your plan begins.`,
  },
  foundations: {
    title: "We'll build the foundations first",
    body: (a, r) =>
      `Your goal needs ${r}, and you're starting from ${a}. Your plan opens with the groundwork ` +
      `that gets you there rather than skipping ahead.`,
  },
};

export function LevelVerdict({ declared, assessed, required }: LevelVerdictProps) {
  // Nothing measured means nothing to report. Saying so is better than
  // showing a band the assessment never established.
  if (!assessed) return null;

  const outcome = classify(declared, assessed, required);
  const copy = COPY[outcome];

  return (
    <Card className="w-full gap-xs" accessibilityRole="summary">
      <Text variant="caption" tone="muted">
        Your starting level
      </Text>
      <View className="flex-row items-baseline gap-sm">
        <Text variant="title">{assessed}</Text>
        {declared && declared !== assessed ? (
          <Text variant="caption" tone="muted">
            you estimated {declared}
          </Text>
        ) : null}
      </View>
      <Text variant="heading">{copy.title}</Text>
      <Text variant="body" tone="muted">
        {copy.body(assessed, required ?? "")}
      </Text>
    </Card>
  );
}
