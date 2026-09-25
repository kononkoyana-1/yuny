import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Exercise } from "@yuny/shared";
import { IconButton, StudyProgress, Text } from "@/shared/ui";
import { breakpoints, spacing } from "@/shared/config/tokens";
import { useKeyboardShortcuts } from "@/shared/platform/keyboardShortcuts";
import { t } from "@/shared/i18n";
import type { useStudySession } from "../session/useStudySession";
import { advancesImmediately } from "../session/queue";
import type { RoundProgress } from "../session/summary";
import type { ExerciseProps } from "./types";
import { ChoiceExercise } from "./ChoiceExercise";
import { Feedback } from "./Feedback";
import { IntroExercise } from "./IntroExercise";
import { PairCardExercise } from "./PairCardExercise";
import { PinyinExercise } from "./PinyinExercise";
import { RecallExercise } from "./RecallExercise";
import { RoundCounter } from "./RoundCounter";
import { TilesExercise } from "./TilesExercise";

const CHOICE_CODES = new Set<Exercise["code"]>(["R1", "P1", "W1", "W2", "C1"]);

export interface ExerciseShellProps {
  session: ReturnType<typeof useStudySession>;
  onClose: () => void;
  /** Раунд знакомства: в шапке «3 из 7 слов» вместо «7 / 10». */
  round?: RoundProgress | null;
}

/**
 * Оболочка задания (exercise.design.md §3): на весь экран, без таб-бара.
 * Шапка — крестик, прогресс, счётчик; колонка `sizing.exerciseColumn`;
 * лоток ответа снизу. Выход в любой момент без потерь: каждый ответ уже в
 * очереди отправки (§3.4). Клавиши — §7.
 */
export function ExerciseShell({ session, onClose, round = null }: ExerciseShellProps) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const [trayHeight, setTrayHeight] = useState(0);
  // R2: показан ли ответ. Сбрасывается при смене задания (ключ — task_id).
  const [revealedFor, setRevealedFor] = useState<string | null>(null);
  const { current, answered, done, total, answer, next } = session;
  const wide = width >= breakpoints.wide;
  const progressLabel = t("learn.ex.progressA11y", { done: done + 1, total });

  const task = current;
  const revealed = task !== null && revealedFor === task.task_id;
  const showTray = answered !== null && !advancesImmediately(answered.task, answered.given);

  useKeyboardShortcuts((event) => {
    if (!task || event.composing) return;
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "Enter") {
      if (event.inTextField) return;
      event.preventDefault();
      if (showTray) next();
      else if (answered) return;
      else if (task.code === "intro") answer({ choice: task.intro?.actions === "ok" ? "ok" : "remember" });
      else if (task.code === "pair_card") answer({ choice: "ok" });
      else if (task.code === "R2" && !revealed) setRevealedFor(task.task_id);
      return;
    }
    if (event.inTextField || answered) return;
    if (task.code === "R2" && revealed) {
      if (event.key === "1" || event.key === "ArrowLeft") answer({ self: "forgot" });
      if (event.key === "2" || event.key === "ArrowRight") answer({ self: "recalled" });
      return;
    }
    if (CHOICE_CODES.has(task.code) && /^[1-6]$/.test(event.key)) {
      const option = task.options?.[Number(event.key) - 1];
      if (option) {
        event.preventDefault();
        answer({ option_id: option.id });
      }
    }
  });

  if (!task) return null;
  const props: ExerciseProps = { task, answered, onAnswer: answer, wide, progressLabel };

  return (
    <View
      className="flex-1 bg-background dark:bg-background-dark"
      style={{ paddingTop: insets.top }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <View className="w-full max-w-exercise-column flex-row items-center gap-md self-center px-lg py-md">
        <IconButton icon="close" accessibilityLabel={t("learn.ex.close")} onPress={onClose} />
        <StudyProgress done={done} total={total} accessibilityLabel={progressLabel} className="flex-1" />
        {round ? (
          <RoundCounter learned={round.learned} total={round.total} />
        ) : (
          <Text variant="caption" tone="muted" className="tabular-nums" aria-hidden>
            {t("learn.ex.progress", { done: Math.min(done + 1, total), total })}
          </Text>
        )}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="w-full max-w-exercise-column self-center px-lg pt-md"
        contentContainerStyle={{ paddingBottom: (showTray ? trayHeight : 0) + insets.bottom + spacing.xl }}
        keyboardShouldPersistTaps="handled"
      >
        <View key={task.task_id}>
          {task.code === "intro" ? <IntroExercise {...props} /> : null}
          {CHOICE_CODES.has(task.code) ? <ChoiceExercise {...props} /> : null}
          {task.code === "R2" ? (
            <RecallExercise {...props} revealed={revealed} onReveal={() => setRevealedFor(task.task_id)} />
          ) : null}
          {task.code === "P2" ? <PinyinExercise {...props} /> : null}
          {task.code === "C2" ? <TilesExercise {...props} /> : null}
          {task.code === "pair_card" ? <PairCardExercise {...props} /> : null}
        </View>
      </ScrollView>

      {showTray && answered ? (
        <View
          className="absolute bottom-0 w-full max-w-exercise-column self-center"
          style={{ paddingBottom: insets.bottom }}
          onLayout={(event) => setTrayHeight(event.nativeEvent.layout.height)}
        >
          <Feedback key={answered.task.task_id} answered={answered} onNext={next} />
        </View>
      ) : null}
    </View>
  );
}
