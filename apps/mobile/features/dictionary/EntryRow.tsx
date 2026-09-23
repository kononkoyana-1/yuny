import { forwardRef, useState } from "react";
import { Pressable, View } from "react-native";
import type { DictionaryEntry } from "@yuny/shared";
import { Text } from "@/shared/ui";
import { t } from "@/shared/i18n";
import { entrySummary } from "./article";

export interface EntryRowProps {
  entry: DictionaryEntry;
  onPress: (entry: DictionaryEntry) => void;
}

/**
 * Строка выдачи словаря: слово, чтение и первые значения. Полная статья
 * открывается по нажатию. Уровень HSK не показывается нигде на экране
 * словаря (TZ.md §4), хотя в ответе он есть.
 */
export const EntryRow = forwardRef<View, EntryRowProps>(function EntryRow({ entry, onPress }, ref) {
  const [pressed, setPressed] = useState(false);
  const summary = entrySummary(entry);

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={[entry.headword, entry.reading, summary].filter(Boolean).join(". ")}
      accessibilityHint={t("dictionary.entry.a11yHint")}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={() => onPress(entry)}
      className={`min-h-[44px] gap-xs rounded-md px-md py-sm ${
        pressed ? "bg-surface-alt dark:bg-surface-alt-dark" : "bg-surface dark:bg-surface-dark"
      }`}
    >
      <View className="flex-row flex-wrap items-baseline gap-x-sm">
        <Text variant="title">{entry.headword}</Text>
        {entry.reading ? (
          <Text variant="body" tone="muted">
            {entry.reading}
          </Text>
        ) : null}
      </View>
      {summary ? (
        <Text variant="body" numberOfLines={2}>
          {summary}
        </Text>
      ) : null}
    </Pressable>
  );
});
