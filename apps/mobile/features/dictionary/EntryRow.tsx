import { forwardRef, useState } from "react";
import { Pressable, View } from "react-native";
import type { SavedEntry } from "@yuny/shared";
import { Chip, Text } from "@/shared/ui";
import { t } from "@/shared/i18n";
import { entrySummary } from "./article";

/**
 * Что строке нужно от слова. У слова из папки без статьи `senses` и `compact`
 * пусты; `hsk_level` есть у строки выдачи словаря.
 */
export type EntryRowWord = Pick<SavedEntry, "headword" | "reading" | "senses" | "compact"> & {
  hsk_level?: number | null;
};

export interface EntryRowProps {
  word: EntryRowWord;
  onPress: () => void;
  /** Слово уже лежит в какой-то из папок своего словаря. */
  saved?: boolean;
  /** Свой перевод слова из файла — показывается вместо значений статьи. */
  translation?: string | null;
}

/**
 * Строка выдачи словаря: слово, чтение, уровень HSK (#80, решение владельца
 * от 2026-09-25 — прежний запрет TZ.md §19 снят) и первые значения. Полная
 * статья открывается по нажатию.
 */
export const EntryRow = forwardRef<View, EntryRowProps>(function EntryRow(
  { word, onPress, saved = false, translation = null },
  ref,
) {
  const [pressed, setPressed] = useState(false);
  const summary = translation ?? entrySummary(word);
  const savedLabel = saved ? t("dictionary.entry.saved") : null;
  const hsk = word.hsk_level ?? null;

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={[
        word.headword,
        word.reading,
        hsk ? t("dictionary.article.hskA11y", { level: hsk }) : null,
        summary || t("dictionary.article.noRussian"),
        savedLabel,
      ]
        .filter(Boolean)
        .join(". ")}
      accessibilityHint={t("dictionary.entry.a11yHint")}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      className={`min-h-tap gap-xs rounded-md px-md py-sm ${
        pressed ? "bg-surface-alt dark:bg-surface-alt-dark" : "bg-surface dark:bg-surface-dark"
      }`}
    >
      <View className="flex-row flex-wrap items-baseline gap-x-sm">
        <Text variant="title">{word.headword}</Text>
        {word.reading ? (
          <Text variant="body" tone="muted">
            {word.reading}
          </Text>
        ) : null}
        {hsk ? <Chip size="micro" label={t("dictionary.article.hsk", { level: hsk })} className="self-center" /> : null}
      </View>
      {savedLabel ? (
        <Text variant="caption" tone="brand">
          {savedLabel}
        </Text>
      ) : null}
      {summary ? (
        <Text variant="body" numberOfLines={2}>
          {summary}
        </Text>
      ) : (
        <Text variant="caption" tone="muted">
          {t("dictionary.article.noRussian")}
        </Text>
      )}
    </Pressable>
  );
});
