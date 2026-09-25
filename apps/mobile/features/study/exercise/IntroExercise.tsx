import { useEffect } from "react";
import { View } from "react-native";
import type { CharNote } from "@yuny/shared";
import { AudioButton, Button, Card, Chip, HanziText, StrokeOrder, Text } from "@/shared/ui";
import { t } from "@/shared/i18n";
import { speak } from "@/shared/platform/speech";
import { charNoteView } from "./charNote";
import { ReportExample } from "./ReportExample";
import type { ExerciseProps } from "./types";
import { Scene } from "./Scene";

/**
 * Знакомство со словом (exercise.design.md §4.1): не оценивается. В
 * «Сегодня» — «Понятно», в раунде папки — «Запомню» / «Уже знаю»; после
 * проваленной проверки «Уже знаю» — одна «Запомню».
 */
export function IntroExercise({ task, onAnswer, progressLabel }: ExerciseProps) {
  const lexeme = task.lexeme;
  const intro = task.intro;
  const example = intro?.example ?? null;
  const headword = lexeme?.headword ?? "";

  // Новое слово звучит само, как только появилось (решение владельца): до
  // карточки было нажатие, так что браузер звук разрешит. Нет голоса — тишина.
  useEffect(() => {
    if (headword) speak(headword);
  }, [task.task_id, headword]);

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

      {/* Звук и порядок черт — вне сцены: у сцены одна подпись для диктора. */}
      {lexeme ? <StrokeOrder text={lexeme.headword} leading={<AudioButton text={lexeme.headword} />} centered /> : null}

      {example ? (
        <Card className="gap-xs bg-surface-alt shadow-none dark:bg-surface-alt-dark">
          <View className="flex-row items-start gap-sm">
            <HanziText variant="sentence" className="flex-1">
              {example.zh}
            </HanziText>
            <AudioButton text={example.zh} />
          </View>
          <Text variant="caption" tone="muted">
            {example.pinyin}
          </Text>
          <Text variant="body">{example.ru}</Text>
          <ReportExample taskId={task.task_id} />
        </Card>
      ) : null}

      {intro?.char_notes.length ? (
        <View className="gap-md">
          {intro.char_notes.map((note) => (
            <CharNoteRow key={note.char} note={note} />
          ))}
        </View>
      ) : null}

      <View className="gap-sm">
        {intro?.actions === "know_or_remember" ? (
          <>
            <Button label={t("learn.ex.intro.remember")} onPress={() => onAnswer({ choice: "remember" })} />
            <Button label={t("learn.ex.intro.know")} variant="secondary" onPress={() => onAnswer({ choice: "know" })} />
          </>
        ) : intro?.actions === "remember" ? (
          // Проверка «Уже знаю» не пройдена — «Тогда запомним», вторая кнопка не нужна.
          <Button label={t("learn.ex.intro.remember")} onPress={() => onAnswer({ choice: "remember" })} />
        ) : (
          <Button label={t("learn.ex.intro.ok")} onPress={() => onAnswer({ choice: "ok" })} />
        )}
      </View>
    </View>
  );
}

/**
 * Строка знака (#88): знак, чтение в этом слове, значение из статьи знака;
 * ниже — «новый знак» или слова пользователя с этим знаком и их пиньинь.
 * Для диктора — одна фраза, части строки ему не видны.
 */
function CharNoteRow({ note }: { note: CharNote }) {
  const v = charNoteView(note);
  return (
    <View accessible accessibilityLabel={v.a11y} className="flex-row gap-md">
      <HanziText variant="sentence">{v.char}</HanziText>
      <View className="flex-1 gap-xs pt-xs">
        <View className="flex-row flex-wrap items-baseline gap-x-sm">
          {v.reading ? (
            <Text variant="body" tone="brand" className="font-bold">
              {v.reading}
            </Text>
          ) : null}
          {v.meaning ? <Text variant="body">{`— ${v.meaning}`}</Text> : null}
        </View>
        {v.known.length > 0 ? (
          <View className="gap-xs">
            <Text variant="caption" tone="muted">
              {t("learn.ex.intro.charKnownIn")}
            </Text>
            <View className="flex-row flex-wrap items-baseline gap-x-sm">
              {v.known.map((w, i) => (
                <View key={w.headword} className="flex-row items-baseline gap-xs">
                  <HanziText variant="inline">{w.headword}</HanziText>
                  {w.reading ? <Text variant="body">{w.reading}</Text> : null}
                  {i < v.known.length - 1 ? (
                    <Text variant="body" tone="muted">
                      ·
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View className="flex-row">
            <Chip size="micro" label={t("learn.ex.intro.charNewChip")} />
          </View>
        )}
      </View>
    </View>
  );
}
