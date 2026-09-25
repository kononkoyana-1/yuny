import { useEffect, useRef, type ReactNode } from "react";
import { View } from "react-native";
import type { Exercise } from "@yuny/shared";
import { Chip, Text } from "@/shared/ui";
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
  children?: ReactNode;
}

/**
 * Верх задания (exercise.design.md §3.1): метка формата, «Ещё раз» у
 * повтора после ошибки и «сцена» — объект задания. При новом задании фокус
 * — на заголовок сцены (§7).
 */
export function Scene({ task, eyebrow, accessibilityLabel, autoFocus = true, eyebrowTone = "muted", children }: SceneProps) {
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
        {task.is_retry ? <Chip size="micro" variant="attention" label={t("learn.ex.retry")} /> : null}
      </View>
      {children}
    </View>
  );
}
