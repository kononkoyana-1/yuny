import { useEffect, useRef, useState } from "react";
import { View, type TextInput } from "react-native";
import { Button, HanziText, Input, Text } from "@/shared/ui";
import { hasHanzi, pinyinWithMarks } from "@/shared/lib/dictionaryText";
import { t } from "@/shared/i18n";
import type { ExerciseProps } from "./types";
import { Scene } from "./Scene";
import { voiceText } from "./voice";

/**
 * P2 (exercise.design.md §4.5): набрать пиньинь. Предпросмотр `mai3 → mǎi`
 * — только отображение, проверяет ключ и сервер. Enter во время IME-набора
 * не отправляет (#41) — это держит `Input.onSubmitSafe`.
 */
export function PinyinExercise({ task, answered, onAnswer, progressLabel }: ExerciseProps) {
  const lexeme = task.lexeme;
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);
  const preview = pinyinWithMarks(text.trim());

  useEffect(() => {
    inputRef.current?.focus();
  }, [task.task_id]);

  function check() {
    if (text.trim() !== "" && !answered) onAnswer({ text: text.trim() });
  }

  return (
    <View className="gap-xl">
      <Scene
        task={task}
        eyebrow={t("learn.ex.p2.eyebrow")}
        accessibilityLabel={progressLabel}
        autoFocus={false}
        voice={voiceText(task, answered !== null)}
      >
        <View className="items-center py-lg">
          <HanziText variant="hero">{lexeme?.headword ?? ""}</HanziText>
        </View>
      </Scene>

      <View className="gap-xs">
        <Input
          ref={inputRef}
          value={text}
          onChangeText={setText}
          editable={!answered}
          onSubmitSafe={check}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          inputMode="text"
          enterKeyHint="done"
          accessibilityLabel={t("learn.ex.p2.a11y", { word: lexeme?.headword ?? "" })}
          className="rounded-tile text-center text-title"
          {...({ lang: "zh-Latn-pinyin" } as object)}
        />
        {preview !== "" && preview !== text.trim() ? (
          <Text variant="caption" tone="muted" className="text-center">
            {`→ ${preview}`}
          </Text>
        ) : null}
        {hasHanzi(text) ? (
          <Text variant="caption" tone="attentionInk" className="text-center">
            {t("learn.ex.p2.ime")}
          </Text>
        ) : (
          <Text variant="caption" tone="muted" className="text-center">
            {t("learn.ex.p2.hint")}
          </Text>
        )}
        {answered && answered.local !== "correct" && lexeme?.reading ? (
          <Text variant="title" tone="successInk" className="text-center">
            {lexeme.reading}
          </Text>
        ) : null}
      </View>

      {answered ? null : (
        <View className="gap-sm">
          <Button label={t("learn.ex.check")} disabled={text.trim() === ""} onPress={check} />
          <Button label={t("learn.ex.p2.blank")} variant="ghost" onPress={() => onAnswer({ blank: true })} />
        </View>
      )}
    </View>
  );
}
