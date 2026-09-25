import { useState } from "react";
import { View } from "react-native";
import { Button, HanziText, OptionTile, Text } from "@/shared/ui";
import { t } from "@/shared/i18n";
import type { ExerciseProps } from "./types";
import { Scene } from "./Scene";

/**
 * R2 (exercise.design.md §4.3): вспомнить → «Показать ответ» → оценить себя
 * двумя равными вариантами. Акцента на «Вспомнил» нет: самооценка и так
 * завышена (§2). Лотка нет — сразу следующее задание.
 */
export function RecallExercise({ task, onAnswer, progressLabel, revealed, onReveal }: ExerciseProps & {
  revealed: boolean;
  onReveal: () => void;
}) {
  const lexeme = task.lexeme;
  const [chosen, setChosen] = useState<"recalled" | "forgot" | null>(null);

  function rate(self: "recalled" | "forgot") {
    setChosen(self);
    onAnswer({ self });
  }

  return (
    <View className="gap-xl">
      <Scene
        task={task}
        eyebrow={t("learn.ex.r2.eyebrow")}
        accessibilityLabel={`${progressLabel}. ${t("learn.ex.r2.eyebrow")}: ${lexeme?.headword ?? ""}`}
      >
        <View className="items-center gap-lg py-lg">
          <HanziText variant="hero">{lexeme?.headword ?? ""}</HanziText>
          {revealed ? (
            <View
              accessibilityLiveRegion="polite"
              accessibilityLabel={`${lexeme?.translation ?? ""}, ${lexeme?.reading ?? ""}`}
              className="w-full items-center gap-xs rounded-tile border border-border bg-surface p-lg dark:border-border-dark dark:bg-surface-dark"
            >
              <Text variant="title" className="text-center">
                {lexeme?.translation ?? ""}
              </Text>
              {lexeme?.reading ? (
                <Text variant="title" tone="muted">
                  {lexeme.reading}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </Scene>

      {revealed ? (
        <View className="flex-row gap-sm">
          <View className="flex-1">
            <OptionTile
              state={chosen === "forgot" ? "wrongSelected" : "idle"}
              disabled={chosen !== null}
              onPress={() => rate("forgot")}
              accessibilityLabel={t("learn.ex.r2.forgot")}
            >
              <Text variant="body" className="flex-1 text-center font-semibold">
                {t("learn.ex.r2.forgot")}
              </Text>
            </OptionTile>
          </View>
          <View className="flex-1">
            <OptionTile
              state={chosen === "recalled" ? "correct" : "idle"}
              disabled={chosen !== null}
              onPress={() => rate("recalled")}
              accessibilityLabel={t("learn.ex.r2.recalled")}
            >
              <Text variant="body" className="flex-1 text-center font-semibold">
                {t("learn.ex.r2.recalled")}
              </Text>
            </OptionTile>
          </View>
        </View>
      ) : (
        <Button label={t("learn.ex.r2.show")} onPress={onReveal} />
      )}
    </View>
  );
}
