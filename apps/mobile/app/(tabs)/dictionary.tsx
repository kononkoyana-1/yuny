import { View } from "react-native";
import { EmptyState } from "@/shared/ui";

/**
 * Экран 04 — Словарь (TZ.md §11). Поиск по иероглифу, пиньиню и русскому
 * переводу одним полем плюс свой словарь с папками. Данные приезжают в
 * фазе 1, экран — в фазе 6.
 */
export default function DictionaryTab() {
  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <EmptyState className="flex-1" message="Словарь появится здесь" />
    </View>
  );
}
