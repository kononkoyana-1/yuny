import { useEffect, useRef, type ReactNode } from "react";
import { View } from "react-native";
import type { Exercise } from "@yuny/shared";
import { AudioButton, Chip, Text } from "@/shared/ui";
import { focusRef } from "@/shared/platform/focusRef";
import { t } from "@/shared/i18n";

export interface SceneProps {
  task: Exercise;
  eyebrow: string;
  /** Для диктора: «Задание 7 из 10. Что значит 买?» */
  accessibilityLabel: string;
  /** P2 ставит фокус в поле сам. */
  autoFocus?: boolean;
  eyebrowTone?: "muted" | "brand" | "pairInk";
  /** Что озвучить кнопкой «Послушать» в шапке (`voiceText`); `null` — кнопки нет. */
  voice?: string | null;
  children?: ReactNode;
}

/**
 * Верх задания (exercise.design.md §3.1): метка формата, «Ещё раз» у
 * повтора после ошибки или «Проверка» после «Уже знаю» (folder-study.design.md
 * §4) и «сцена» — объект задания. При новом задании фокус
 * — на заголовок сцены (§7).
 */
export function Scene({
  task,
  eyebrow,
  accessibilityLabel,
  autoFocus = true,
  eyebrowTone = "muted",
  voice = null,
  children,
}: SceneProps) {
  const headerRef = useRef<View>(null);

  useEffect(() => {
    if (autoFocus) focusRef(headerRef);
  }, [task.task_id, autoFocus]);

  return (
    <View className="gap-lg">
      <View className="flex-row items-center justify-between gap-sm">
        <View
          ref={headerRef}
          accessible
          accessibilityRole="header"
          accessibilityLabel={accessibilityLabel}
          {...({ tabIndex: -1 } as object)}
          // Цель программного фокуса, не элемент управления: без кольца.
          className="outline-none"
        >
          <Text variant="eyebrow" tone={eyebrowTone} className="uppercase">
            {eyebrow}
          </Text>
        </View>
        <View className="flex-row items-center gap-xs">
          {task.is_check ? (
            <Chip size="micro" label={t("learn.round.check")} />
          ) : task.is_retry ? (
            <Chip size="micro" variant="attention" label={t("learn.ex.retry")} />
          ) : null}
          {voice ? <AudioButton text={voice} /> : null}
        </View>
      </View>
      {children}
    </View>
  );
}
