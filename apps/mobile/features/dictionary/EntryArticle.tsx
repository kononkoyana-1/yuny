import { View } from "react-native";
import type { SavedEntry } from "@yuny/shared";
import { Text } from "@/shared/ui";
import { spacing } from "@/shared/config/tokens";
import { articleNests } from "./article";

/**
 * Словарная статья БКРС целиком (TZ.md §11 экран 04): гнёзда с римской
 * цифрой и заголовком (часть речи, чтение), под ними нумерованные значения.
 * Уровень HSK сюда не выводится (TZ.md §4).
 */
export function EntryArticle({ entry }: { entry: SavedEntry }) {
  const nests = articleNests(entry.senses);

  return (
    <View className="gap-lg">
      {nests.map((nest, index) => (
        <View key={`${nest.nest ?? "flat"}-${index}`} className="gap-sm">
          {nest.nest !== null || nest.heading !== null ? (
            <Text variant="heading">
              {[nest.nest, nest.heading].filter(Boolean).join(" ")}
            </Text>
          ) : null}
          {nest.senses.map((sense, senseIndex) => (
            <View key={senseIndex} className="flex-row gap-sm">
              {sense.num !== null ? (
                <Text variant="body" tone="muted" style={{ minWidth: spacing.lg }}>
                  {`${sense.num})`}
                </Text>
              ) : null}
              <Text variant="body" className="flex-1">
                {sense.gloss}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
