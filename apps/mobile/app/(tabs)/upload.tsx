import { View } from "react-native";
import { EmptyState } from "@/shared/ui";

/**
 * Экран 02 — Загрузка (TZ.md §11). До трёх файлов за раз, лимиты из §6,
 * дальше разбор в Gemini и сборка модуля. Реализуется в фазе 2.
 */
export default function UploadTab() {
  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <EmptyState className="flex-1" message="Загрузка материалов появится здесь" />
    </View>
  );
}
