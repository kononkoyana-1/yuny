import { useEffect, useRef } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Card, HanziText, Icon, Mascot, Sparkles, Text } from "@/shared/ui";
import { useTheme } from "@/shared/lib/useTheme";
import { focusRef } from "@/shared/platform/focusRef";
import { useKeyboardShortcuts } from "@/shared/platform/keyboardShortcuts";
import { t } from "@/shared/i18n";
import type { DaySummary } from "./session/summary";
import { StageUpRow } from "./StageUpRow";

/** Столько переходов стадий показываем; остальные — «… и ещё N». */
const SHOWN_ADVANCED = 5;

export interface DaySummaryScreenProps {
  summary: DaySummary;
  /** Прогноз на завтра из пересчитанной карточки «Сегодня»; `null` — ещё считается. */
  tomorrow: number | null;
  onDone: () => void;
  /** Заголовок вместо «Готово на сегодня» — итог повторения или практики папки. */
  title?: string;
  /** «Ещё N новых слов» с ценой на завтра; `null` — кнопки нет. */
  extraNew?: { count: number; tomorrowDelta: number; onPress: () => void } | null;
}

/**
 * Итог дня (today-session.design.md §3.10): что продвинулось, какие пары
 * теперь различаете, прогноз на завтра. Праздник — только за настоящий
 * результат: блёстки и радостный маскот, если что-то продвинулось или пара решена.
 */
export function DaySummaryScreen({ summary, tomorrow, onDone, title, extraNew = null }: DaySummaryScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const headerRef = useRef<View>(null);
  const advanced = summary.advanced;
  const celebrate = advanced.length > 0 || summary.pairsResolved.length > 0;

  useEffect(() => {
    focusRef(headerRef);
  }, []);

  useKeyboardShortcuts((event) => {
    if (event.key === "Enter" && !event.composing && !event.inTextField) {
      event.preventDefault();
      onDone();
    }
  });

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-background-dark"
      contentContainerClassName="w-full max-w-reading-column items-stretch gap-lg self-center px-lg py-xl"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="items-center">
        <Mascot stage={1} mood={celebrate ? "celebrating" : "neutral"} size="medium" showStage={false} decorative />
        {celebrate ? <Sparkles /> : null}
      </View>
      <View
        ref={headerRef}
        accessible
        accessibilityRole="header"
        className="outline-none"
        {...({ tabIndex: -1 } as object)}
      >
        <Text variant="display" className="text-center">
          {title ?? t("learn.day.title")}
        </Text>
      </View>

      {advanced.length > 0 ? (
        <Card className="gap-xs">
          <Text variant="heading">{t("learn.day.advanced", { count: advanced.length })}</Text>
          {advanced.slice(0, SHOWN_ADVANCED).map((up) => (
            <StageUpRow key={`${up.headword}|${up.reading ?? ""}`} up={up} />
          ))}
          {advanced.length > SHOWN_ADVANCED ? (
            <Text variant="caption" tone="muted">
              {t("learn.day.more", { count: advanced.length - SHOWN_ADVANCED })}
            </Text>
          ) : null}
        </Card>
      ) : null}

      {summary.pairsResolved.map((pair) => (
        <View
          key={`${pair.a}|${pair.b}`}
          className="flex-row items-center gap-sm rounded-tile bg-pair-soft px-md py-sm dark:bg-pair-soft-dark"
        >
          <Icon name="pair" size={18} color={colors.pairInk} />
          <HanziText variant="inline" tone="pairInk" className="flex-1">
            {t("learn.day.pairResolved", pair)}
          </HanziText>
        </View>
      ))}

      {tomorrow !== null ? (
        <Text variant="body" tone="muted" className="text-center">
          {t("learn.day.tomorrow", { count: tomorrow })}
        </Text>
      ) : null}

      <View className="gap-sm">
        <Button label={t("learn.day.done")} onPress={onDone} />
        {extraNew && extraNew.count > 0 ? (
          <>
            <Button
              label={t("learn.day.extraNew", { count: extraNew.count })}
              variant="secondary"
              accessibilityHint={t("learn.day.extraNewCost", { count: extraNew.tomorrowDelta })}
              onPress={extraNew.onPress}
            />
            <Text variant="caption" tone="muted" className="text-center" aria-hidden>
              {t("learn.day.extraNewCost", { count: extraNew.tomorrowDelta })}
            </Text>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}
