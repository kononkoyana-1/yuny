import { useState } from "react";
import { View } from "react-native";
import { Button, HanziText, PhraseTile, Text } from "@/shared/ui";
import { useKeyboardShortcuts } from "@/shared/platform/keyboardShortcuts";
import { t } from "@/shared/i18n";
import type { ExerciseProps } from "./types";
import { Scene } from "./Scene";
import { voiceText } from "./voice";

/**
 * C2 (exercise.design.md §4.8): собрать фразу из плиток. Нажатие в банке
 * ставит плитку в конец ответа, в ответе — возвращает её на место; в банке
 * остаётся «тень», чтобы он не прыгал. Backspace возвращает последнюю.
 */
export function TilesExercise({ task, answered, onAnswer, progressLabel }: ExerciseProps) {
  const tiles = task.tiles ?? [];
  const [picked, setPicked] = useState<string[]>([]);
  const text = new Map(tiles.map((tile) => [tile.id, tile.text]));
  const words = picked.map((id) => text.get(id) ?? "");

  useKeyboardShortcuts((event) => {
    if (event.key !== "Backspace" || event.inTextField || answered || picked.length === 0) return;
    event.preventDefault();
    setPicked((p) => p.slice(0, -1));
  });

  const lineTone =
    answered?.local === "correct" || answered?.result?.outcome === "correct"
      ? "bg-success-soft dark:bg-success-soft-dark"
      : answered
        ? "bg-attention-soft dark:bg-attention-soft-dark"
        : "bg-surface dark:bg-surface-dark";
  const rightTokens = answered?.result?.correct.tokens ?? task.key?.tokens;

  return (
    <View className="gap-lg">
      <Scene
        task={task}
        eyebrow={t("learn.ex.c2.eyebrow")}
        accessibilityLabel={`${progressLabel}. ${task.sentence?.ru ?? ""}`}
        voice={voiceText(task, answered !== null)}
      >
        <Text variant="title">{task.sentence?.ru ?? ""}</Text>
      </Scene>

      <View
        accessible
        accessibilityLabel={t("learn.ex.c2.answerA11y", { words: words.join(" ") })}
        className={`min-h-option-min-height flex-row flex-wrap gap-sm rounded-tile border-b-2 border-primary p-sm dark:border-primary-dark ${lineTone}`}
      >
        {picked.map((id) => (
          <PhraseTile
            key={id}
            text={text.get(id) ?? ""}
            onPress={answered ? undefined : () => setPicked((p) => p.filter((x) => x !== id))}
            accessibilityLabel={t("learn.ex.c2.remove", { word: text.get(id) ?? "" })}
          />
        ))}
      </View>

      {answered && answered.local !== "correct" && answered.result?.outcome !== "correct" && rightTokens ? (
        <HanziText variant="sentence" tone="successInk">
          {rightTokens.join("")}
        </HanziText>
      ) : null}

      <View className="flex-row flex-wrap gap-sm rounded-tile bg-surface-alt p-sm dark:bg-surface-alt-dark">
        {tiles.map((tile) =>
          picked.includes(tile.id) ? (
            <PhraseTile key={tile.id} text={tile.text} placeholder accessibilityLabel="" />
          ) : (
            <PhraseTile
              key={tile.id}
              text={tile.text}
              onPress={answered ? undefined : () => setPicked((p) => [...p, tile.id])}
              accessibilityLabel={t("learn.ex.c2.add", { word: tile.text })}
            />
          ),
        )}
      </View>

      {answered ? null : (
        <View className="gap-sm">
          <Button
            label={t("learn.ex.check")}
            disabled={picked.length === 0}
            onPress={() => onAnswer({ tile_ids: picked })}
          />
          <Button label={t("learn.ex.c2.blank")} variant="ghost" onPress={() => onAnswer({ blank: true })} />
        </View>
      )}
    </View>
  );
}
