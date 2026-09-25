import { useEffect, useRef } from "react";
import { View } from "react-native";
import { AnswerTray, AudioButton, Button, HanziText, Icon, Text } from "@/shared/ui";
import { correctAnswerText, trayOutcome } from "@/shared/lib/studyVerdict";
import { useTheme } from "@/shared/lib/useTheme";
import { motion } from "@/shared/config/tokens";
import { focusRef } from "@/shared/platform/focusRef";
import { t } from "@/shared/i18n";
import type { Answered } from "../session/useStudySession";
import { checkFailed } from "../session/queue";

/**
 * Лоток ответа (exercise.design.md §3.3): «Верно» / «Почти» / мягкий разбор
 * ошибки — тёплый янтарный фон и прямой ответ, без красного. Итог сразу по
 * ключу; разбор и партнёр путаницы — когда придёт ответ сервера. Проваленная
 * проверка «Уже знаю» — «Тогда запомним» и само слово.
 */
export function Feedback({ answered, onNext }: { answered: Answered; onNext: () => void }) {
  const { colors } = useTheme();
  const nextRef = useRef<View>(null);
  // Тот же Enter, что отправил ответ, отпускается уже на «Дальше» (фокус
  // переехал сюда) и нажал бы её — лоток не успел бы показаться. Первые
  // `motion.base` мс нажатие не считается; заодно это защита от двойного тапа.
  const shownAt = useRef(Number.POSITIVE_INFINITY);
  // Проверка «Уже знаю» не пройдена — не ошибка, а «Тогда запомним» (folder-study.design.md §4).
  const thenRemember = checkFailed(answered);
  const outcome = thenRemember ? "partial" : trayOutcome(answered.local, answered.result);
  const lexeme = answered.task.lexeme;
  const result = answered.result;

  useEffect(() => {
    shownAt.current = Date.now();
    focusRef(nextRef);
  }, []);

  function handleNext() {
    if (Date.now() - shownAt.current >= motion.base) onNext();
  }

  if (!outcome) return null;

  const title = thenRemember ? (
    <Text variant="heading" tone="attentionInk">
      {t("learn.round.thenRemember")}
    </Text>
  ) : outcome === "correct" ? (
      <View className="flex-row items-center gap-sm">
        <Icon name="check" size={20} color={colors.successInk} />
        <Text variant="heading" tone="successInk">
          {t("learn.ex.tray.correct")}
        </Text>
      </View>
    ) : outcome === "partial" ? (
      <Text variant="heading" tone="attentionInk">
        {t("learn.ex.tray.partial")}
      </Text>
    ) : result?.partner ? (
      <Text variant="heading" tone="attentionInk">
        {t("learn.ex.tray.partner", {
          word: result.partner.headword,
          reading: result.partner.reading ?? "",
          meaning: result.partner.meaning ?? "",
        })}
      </Text>
    ) : (
      <Text variant="heading" tone="attentionInk">
        {t("learn.ex.tray.answer", { answer: correctAnswerText(answered.task, result) ?? "" })}
      </Text>
    );

  const lines = result?.explanation ?? [];

  return (
    <AnswerTray outcome={outcome} title={title}>
      {(outcome === "correct" || thenRemember) && lexeme ? (
        <View className="flex-row flex-wrap items-baseline gap-sm">
          <HanziText variant="inline">{lexeme.headword}</HanziText>
          <Text variant="body">{[lexeme.reading, lexeme.translation].filter(Boolean).join(" · ")}</Text>
          <AudioButton text={lexeme.headword} />
        </View>
      ) : null}
      {outcome !== "correct"
        ? lines.map((line, i) => (
            <Text key={i} variant="body">
              {line}
            </Text>
          ))
        : null}
      {answered.failed ? (
        <Text variant="caption" tone="muted">
          {t("learn.ex.submitError")}
        </Text>
      ) : null}
      <Button ref={nextRef} label={t("learn.ex.next")} onPress={handleNext} className="mt-sm" />
    </AnswerTray>
  );
}
