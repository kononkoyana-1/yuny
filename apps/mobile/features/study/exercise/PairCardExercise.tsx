import { View } from "react-native";
import { Button, Chip, HanziText, Text } from "@/shared/ui";
import { t } from "@/shared/i18n";
import type { ExerciseProps } from "./types";
import { Scene } from "./Scene";

type Side = NonNullable<ExerciseProps["task"]["pair"]>["a"];

/**
 * «Разберём пару» (exercise.design.md §4.9): два слова рядом и чем они
 * различаются. Не оценивается; задания на различение идут следом.
 */
export function PairCardExercise({ task, onAnswer, progressLabel }: ExerciseProps) {
  const pair = task.pair;
  if (!pair) return null;

  return (
    <View className="gap-lg">
      <Scene
        task={task}
        eyebrow={t("learn.ex.pair.eyebrow")}
        eyebrowTone="pairInk"
        accessibilityLabel={`${progressLabel}. ${t("learn.ex.pair.eyebrow")}: ${pair.a.headword}, ${pair.b.headword}`}
      >
        <View className="flex-row items-center gap-sm">
          <PairColumn side={pair.a} />
          <Text variant="title" tone="muted" aria-hidden>
            ≠
          </Text>
          <PairColumn side={pair.b} />
        </View>
      </Scene>

      {pair.difference || pair.mnemonic ? (
        <View className="gap-xs rounded-hero bg-pair-soft p-lg dark:bg-pair-soft-dark">
          {pair.difference ? (
            <HanziText variant="sentence" tone="pairInk">
              {pair.difference}
            </HanziText>
          ) : null}
          {pair.mnemonic ? <Text variant="body">{pair.mnemonic}</Text> : null}
        </View>
      ) : null}

      {pair.collocations ? <HanziText variant="sentence">{pair.collocations.join(" · ")}</HanziText> : null}

      <Button label={t("learn.ex.pair.go")} onPress={() => onAnswer({ choice: "ok" })} />
    </View>
  );
}

function PairColumn({ side }: { side: Side }) {
  return (
    <View
      accessible
      accessibilityLabel={[side.headword, side.reading, side.tone_label, side.meaning].filter(Boolean).join(", ")}
      className="flex-1 items-center gap-xs rounded-tile border border-border bg-surface p-md dark:border-border-dark dark:bg-surface-dark"
    >
      <HanziText variant="hero">{side.headword}</HanziText>
      <View className="flex-row flex-wrap items-center justify-center gap-xs">
        {side.reading ? (
          <Text variant="title" tone="muted">
            {side.reading}
          </Text>
        ) : null}
        {side.tone_label ? <Chip size="micro" label={side.tone_label} /> : null}
      </View>
      {side.meaning ? (
        <Text variant="heading" className="text-center">
          {side.meaning}
        </Text>
      ) : null}
    </View>
  );
}
