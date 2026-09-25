import { View } from "react-native";
import { Button, Card, Chip, HanziText, Text } from "@/shared/ui";
import { t } from "@/shared/i18n";
import type { ExerciseProps } from "./types";
import { Scene } from "./Scene";

/**
 * Знакомство со словом (exercise.design.md §4.1): не оценивается. В
 * «Сегодня» — «Понятно», в раунде папки — «Запомню» / «Уже знаю».
 */
export function IntroExercise({ task, onAnswer, progressLabel }: ExerciseProps) {
  const lexeme = task.lexeme;
  const intro = task.intro;
  const example = intro?.example ?? null;

  return (
    <View className="gap-xl">
      <Scene
        task={task}
        eyebrow={t("learn.ex.intro.eyebrow")}
        eyebrowTone="brand"
        accessibilityLabel={`${progressLabel}. ${t("learn.ex.intro.eyebrow")}: ${lexeme?.headword ?? ""}, ${lexeme?.reading ?? ""}, ${lexeme?.translation ?? ""}`}
      >
        <View className="items-center gap-sm">
          <HanziText variant="hero">{lexeme?.headword ?? ""}</HanziText>
          <View className="flex-row items-center gap-sm">
            {lexeme?.reading ? (
              <Text variant="title" tone="muted">
                {lexeme.reading}
              </Text>
            ) : null}
            {lexeme?.tone_label ? <Chip size="micro" label={lexeme.tone_label} /> : null}
          </View>
          {lexeme?.translation ? (
            <Text variant="title" className="text-center">
              {lexeme.translation}
            </Text>
          ) : null}
        </View>
      </Scene>

      {example ? (
        <Card className="gap-xs bg-surface-alt shadow-none dark:bg-surface-alt-dark">
          <HanziText variant="sentence">{example.zh}</HanziText>
          <Text variant="caption" tone="muted">
            {example.pinyin}
          </Text>
          <Text variant="body">{example.ru}</Text>
        </Card>
      ) : null}

      {intro?.char_notes.length ? (
        <View className="gap-xs">
          {intro.char_notes.map((note) =>
            note.known_in.length > 0 ? (
              <Text key={note.char} variant="body">
                {t("learn.ex.intro.charKnown", { char: note.char, words: note.known_in.join(" · ") })}
              </Text>
            ) : (
              <View key={note.char} className="flex-row flex-wrap items-center gap-sm">
                <Chip size="micro" label={t("learn.ex.intro.charNewChip")} />
                <Text variant="body">{t("learn.ex.intro.charNew", { char: note.char })}</Text>
              </View>
            ),
          )}
        </View>
      ) : null}

      <View className="gap-sm">
        {intro?.actions === "know_or_remember" ? (
          <>
            <Button label={t("learn.ex.intro.remember")} onPress={() => onAnswer({ choice: "remember" })} />
            <Button label={t("learn.ex.intro.know")} variant="secondary" onPress={() => onAnswer({ choice: "know" })} />
          </>
        ) : (
          <Button label={t("learn.ex.intro.ok")} onPress={() => onAnswer({ choice: "ok" })} />
        )}
      </View>
    </View>
  );
}
