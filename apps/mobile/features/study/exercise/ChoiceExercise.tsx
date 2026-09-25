import { View } from "react-native";
import type { Exercise, StudyOption } from "@yuny/shared";
import { HanziText, KeyHint, OptionTile, Text, type OptionTileState } from "@/shared/ui";
import { t } from "@/shared/i18n";
import type { ExerciseProps } from "./types";
import { Scene } from "./Scene";

type ChoiceCode = "R1" | "P1" | "W1" | "W2" | "C1";

const EYEBROW: Record<ChoiceCode, string> = {
  R1: "learn.ex.r1.eyebrow",
  P1: "learn.ex.p1.eyebrow",
  W1: "learn.ex.w.eyebrow",
  W2: "learn.ex.w.eyebrow",
  C1: "learn.ex.c1.eyebrow",
};

/** Выбранный вариант, верный (сервер важнее ключа) и состояние каждого (§3.2). */
export function optionStates(task: Exercise, answered: ExerciseProps["answered"]): Map<string, OptionTileState> {
  const states = new Map<string, OptionTileState>();
  const chosen = answered && "option_id" in answered.given ? answered.given.option_id : null;
  const right = answered ? (answered.result?.correct.option_id ?? task.key?.option_id ?? null) : null;
  for (const o of task.options ?? []) {
    if (!answered) states.set(o.id, "idle");
    else if (o.id === right) states.set(o.id, "correct");
    else if (o.id === chosen) states.set(o.id, "wrongSelected");
    else states.set(o.id, "dimmed");
  }
  return states;
}

/**
 * R1, P1, W1, W2, C1 (exercise.design.md §4.2, §4.4, §4.6, §4.7): сцена и
 * варианты. Ответ — сам выбор. Сетки: R1 — колонка, P1 и C1 — 2 × 2,
 * W1/W2 — 3 × 2 квадратов.
 */
export function ChoiceExercise({ task, answered, onAnswer, wide, progressLabel }: ExerciseProps) {
  const code = task.code as ChoiceCode;
  const options = task.options ?? [];
  const states = optionStates(task, answered);
  const lexeme = task.lexeme;
  const prompt = code === "W1" || code === "W2" ? (lexeme?.translation ?? "") : (lexeme?.headword ?? "");

  return (
    <View className="gap-xl">
      <Scene task={task} eyebrow={t(EYEBROW[code])} accessibilityLabel={`${progressLabel}. ${t(EYEBROW[code])} ${prompt}`}>
        <ChoiceScene task={task} code={code} filled={answered ? chosenText(task, answered) : null} />
      </Scene>

      <View className={code === "R1" ? "gap-sm" : "flex-row flex-wrap justify-center gap-sm"}>
        {options.map((option, i) => {
          const state = states.get(option.id) ?? "idle";
          const suffix =
            state === "correct" ? `, ${t("learn.ex.option.correct")}` : state === "wrongSelected" ? `, ${t("learn.ex.option.yours")}` : "";
          const tile = (
            <OptionTile
              key={option.id}
              layout={code === "W1" || code === "W2" ? "square" : "row"}
              state={state}
              disabled={answered !== null}
              corner={wide && code === "R1" ? <KeyHint keyLabel={String(i + 1)} /> : undefined}
              onPress={() => onAnswer({ option_id: option.id })}
              accessibilityLabel={`${t("learn.ex.option.a11y", { index: i + 1, count: options.length, text: option.a11y || option.text })}${suffix}`}
            >
              <OptionLabel option={option} />
            </OptionTile>
          );
          // 2 × 2: по две плитки в ряд на любой ширине.
          return code === "P1" || code === "C1" ? (
            <View key={option.id} className="basis-[48%] grow">
              {tile}
            </View>
          ) : (
            tile
          );
        })}
      </View>
    </View>
  );
}

function chosenText(task: Exercise, answered: NonNullable<ExerciseProps["answered"]>): string | null {
  if (!("option_id" in answered.given)) return null;
  const id = answered.given.option_id;
  return task.options?.find((o) => o.id === id)?.text ?? null;
}

function OptionLabel({ option }: { option: StudyOption }) {
  if (option.kind === "hanzi") {
    return (
      <HanziText variant={[...option.text].length >= 3 ? "sentence" : "option"} className="text-center">
        {option.text}
      </HanziText>
    );
  }
  if (option.kind === "pinyin") return <Text variant="title">{option.text}</Text>;
  return (
    <Text variant="body" className="flex-1 font-semibold">
      {option.text}
    </Text>
  );
}

function ChoiceScene({ task, code, filled }: { task: Exercise; code: ChoiceCode; filled: string | null }) {
  const lexeme = task.lexeme;
  if (code === "C1") return <SentenceWithBlank task={task} filled={filled} />;
  if (code === "W1" || code === "W2") {
    return (
      <View className="items-center gap-xs py-lg">
        <Text variant="display" className="text-center">
          {lexeme?.translation ?? ""}
        </Text>
        {code === "W1" && lexeme?.reading ? (
          <Text variant="title" tone="muted">
            {lexeme.reading}
          </Text>
        ) : null}
      </View>
    );
  }
  return (
    <View className="items-center py-xl">
      <HanziText variant="hero">{lexeme?.headword ?? ""}</HanziText>
    </View>
  );
}

/** C1: предложение с пропуском; после выбора слово встаёт в пропуск (§4.7). */
function SentenceWithBlank({ task, filled }: { task: Exercise; filled: string | null }) {
  const sentence = task.sentence;
  if (!sentence) return null;
  const blankAt = sentence.blank_index;
  const spoken = sentence.tokens
    .map((token, i) => (i === blankAt ? t("learn.ex.c1.blankA11y") : token))
    .join(", ");

  return (
    <View
      accessible
      accessibilityLabel={`${spoken}. ${sentence.ru}`}
      className="gap-sm rounded-tile bg-surface-alt p-lg dark:bg-surface-alt-dark"
    >
      <View className="flex-row flex-wrap items-end">
        {sentence.tokens.map((token, i) =>
          i === blankAt ? (
            <View
              key={i}
              className="mx-xs min-w-tap items-center rounded-sm border-b-2 border-dashed border-primary bg-primary-soft px-xs dark:border-primary-dark dark:bg-primary-soft-dark"
            >
              <HanziText variant="sentence">{filled ?? " "}</HanziText>
            </View>
          ) : (
            <HanziText key={i} variant="sentence">
              {token}
            </HanziText>
          ),
        )}
      </View>
      <Text variant="body" tone="muted">
        {sentence.ru}
      </Text>
    </View>
  );
}
