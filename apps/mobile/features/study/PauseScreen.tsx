import { useEffect, useRef } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Card, PortionDots, Text } from "@/shared/ui";
import { focusRef } from "@/shared/platform/focusRef";
import { useKeyboardShortcuts } from "@/shared/platform/keyboardShortcuts";
import { t } from "@/shared/i18n";
import type { PortionSummary } from "./session/summary";
import { StageUpRow } from "./StageUpRow";

export interface PauseScreenProps {
  /** Номер закончившейся порции, с 1. */
  portion: number;
  portions: number;
  summary: PortionSummary;
  onNext: () => void;
  onStop: () => void;
}

/**
 * Пауза между порциями (today-session.design.md §3.9): итог порции, «Дальше»
 * или «Хватит». Enter — «Дальше»; Escape здесь ничего не делает: выход только
 * явной «Хватит».
 */
export function PauseScreen({ portion, portions, summary, onNext, onStop }: PauseScreenProps) {
  const insets = useSafeAreaInsets();
  const headerRef = useRef<View>(null);

  useEffect(() => {
    focusRef(headerRef);
  }, [portion]);

  useKeyboardShortcuts((event) => {
    if (event.key === "Enter" && !event.composing && !event.inTextField) {
      event.preventDefault();
      onNext();
    }
  });

  return (
    <View
      className="flex-1 items-center justify-center bg-background px-lg dark:bg-background-dark"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="w-full max-w-reading-column gap-lg">
        <PortionDots index={portion} count={portions} className="self-center" />
        <View
          ref={headerRef}
          accessible
          accessibilityRole="header"
          className="items-center gap-xs outline-none"
          {...({ tabIndex: -1 } as object)}
        >
          <Text variant="eyebrow" tone="muted" className="uppercase">
            {t("learn.pause.eyebrow", { index: portion, count: portions })}
          </Text>
          {summary.answered > 0 ? (
            <Text variant="display" className="text-center">
              {t("learn.pause.recalled", { recalled: summary.recalled, answered: summary.answered })}
            </Text>
          ) : null}
        </View>

        {summary.stageUps.length > 0 ? (
          <Card className="gap-xs">
            {summary.stageUps.map((up) => (
              <StageUpRow key={`${up.headword}|${up.reading ?? ""}`} up={up} />
            ))}
          </Card>
        ) : null}

        <View className="gap-sm">
          <Button label={t("learn.pause.next")} onPress={onNext} />
          <Button label={t("learn.pause.stop")} variant="ghost" onPress={onStop} />
        </View>
      </View>
    </View>
  );
}
