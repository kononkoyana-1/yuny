import { View } from "react-native";
import { Button, EmptyState, Text } from "@/shared/ui";
import { REQUIRES_AUTH } from "@/shared/config/dataSource";
import { signOut } from "@/shared/lib/auth";
import { useProfile } from "@/shared/api";

/**
 * Экран 05 — Настройки (TZ.md §11). Уровень HSK и прогресс по уровням, тема,
 * удаление аккаунта — всё это фаза 7. Сейчас здесь только сам аккаунт:
 * приложение живёт за входом, и выйти из него должно быть откуда.
 */
export default function SettingsTab() {
  const { data: profile } = useProfile();

  return (
    <View className="flex-1 justify-between bg-background px-lg py-xl dark:bg-background-dark">
      <View className="flex-1 items-center justify-center gap-md">
        {profile ? (
          <View className="items-center gap-xs">
            <Text variant="title">{profile.display_name}</Text>
          </View>
        ) : null}
        <EmptyState message="Уровень, темы и прогресс будут здесь" />
      </View>

      {REQUIRES_AUTH ? (
        <Button label="Выйти" variant="ghost" onPress={() => void signOut()} />
      ) : null}
    </View>
  );
}
