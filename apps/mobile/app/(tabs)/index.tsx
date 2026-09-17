import { View } from "react-native";
import { useRouter } from "expo-router";
import { EmptyState } from "@/shared/ui";

/**
 * Экран 01 — Главная (TZ.md §11). Модули кружками, у каждого кольцо
 * прогресса; тап открывает окно с числом заданий. Ничего этого ещё нет:
 * модули появляются в фазе 4, а пока экран честно пуст и ведёт туда, где
 * начинается работа — на загрузку материала.
 */
export default function HomeTab() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <EmptyState
        className="flex-1"
        message="Загрузите свой материал — и по нему появятся задания"
        actionLabel="Загрузить"
        onAction={() => router.push("/upload")}
      />
    </View>
  );
}
