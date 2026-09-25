import { useEffect, useRef } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, HanziText, Icon, Mascot, Text } from "@/shared/ui";
import { useTheme } from "@/shared/lib/useTheme";
import { focusRef } from "@/shared/platform/focusRef";
import { useKeyboardShortcuts } from "@/shared/platform/keyboardShortcuts";
import { t } from "@/shared/i18n";
import type { RoundSummary } from "./session/summary";

export interface RoundSummaryScreenProps {
  summary: RoundSummary;
  /** Название папки; `null` — раунд «Ещё 7 новых» после «Сегодня». */
  folderName: string | null;
  loadWarning: number | null;
  /** «Ещё N слов» — есть ли ещё новые в папке; `null` — нет или ещё не пересчитали. */
  more: { count: number; tomorrowDelta: number | null } | null;
  onMore: () => void;
  onDone: () => void;
}

/**
 * Итог раунда знакомства (folder-study.design.md §5). «Готово» — primary:
 * семь слов — граница рабочей памяти, следующий раунд — выбор с ценой на завтра.
 */
export function RoundSummaryScreen({ summary, folderName, loadWarning, more, onMore, onDone }: RoundSummaryScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const headerRef = useRef<View>(null);
  const count = summary.learned.length;

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
      contentContainerClassName="w-full max-w-reading-column gap-lg self-center px-lg py-xl"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <Mascot stage={1} mood={count > 0 ? "celebrating" : "neutral"} size="small" showStage={false} decorative className="self-center" />
      <View ref={headerRef} accessible accessibilityRole="header" className="outline-none" {...({ tabIndex: -1 } as object)}>
        <Text variant="display" className="text-center">
          {folderName
            ? t("learn.round.title", { count, folder: folderName })
            : t("learn.round.titleNoFolder", { count })}
        </Text>
      </View>

      {count > 0 ? (
        <View
          accessible
          accessibilityLabel={t("learn.round.wordsA11y", { list: summary.learned.map((w) => w.headword).join(", ") })}
          className="flex-row flex-wrap justify-center gap-sm"
        >
          {summary.learned.map((w) => (
            <View
              key={`${w.headword}|${w.reading ?? ""}`}
              className="min-h-tap min-w-tap items-center justify-center rounded-tile border border-stage-edge bg-stage-meeting px-md py-sm dark:border-stage-edge-dark dark:bg-stage-meeting-dark"
            >
              <HanziText variant="sentence">{w.headword}</HanziText>
            </View>
          ))}
        </View>
      ) : null}

      {summary.known.length > 0 ? (
        <Text variant="body" tone="muted" className="text-center">
          {t("learn.round.known", { words: summary.known.map((w) => w.headword).join(", ") })}
        </Text>
      ) : null}

      {count > 0 ? (
        <View className="flex-row items-center justify-center gap-sm">
          <Icon name="review" size={18} color={colors.primary} />
          <Text variant="body">{t("learn.round.tomorrow")}</Text>
        </View>
      ) : null}

      {loadWarning !== null ? (
        <View className="rounded-md bg-attention-soft px-md py-sm dark:bg-attention-soft-dark">
          <Text variant="body" tone="attentionInk">
            {t("learn.folder.loadWarning", { count: loadWarning })}
          </Text>
        </View>
      ) : null}

      <View className="gap-sm">
        <Button label={t("learn.round.done")} onPress={onDone} />
        {more && more.count > 0 ? (
          <>
            <Button
              label={t("learn.round.more", { count: more.count })}
              variant="secondary"
              accessibilityHint={more.tomorrowDelta ? t("learn.round.moreCost", { count: more.tomorrowDelta }) : undefined}
              onPress={onMore}
            />
            {more.tomorrowDelta ? (
              <Text variant="caption" tone="muted" className="text-center" aria-hidden>
                {t("learn.round.moreCost", { count: more.tomorrowDelta })}
              </Text>
            ) : null}
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}
