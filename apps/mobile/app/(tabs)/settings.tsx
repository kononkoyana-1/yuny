import { useState } from "react";
import { View } from "react-native";
import { Button, EmptyState, Text } from "@/shared/ui";
import { REQUIRES_AUTH } from "@/shared/config/dataSource";
import { signOut } from "@/shared/lib/auth";
import { useProfile } from "@/shared/api";
import { t } from "@/shared/i18n";

/**
 * Экран 05 — Настройки (TZ.md §11). Уровень HSK и прогресс по уровням, тема,
 * удаление аккаунта — всё это фаза 7. Сейчас здесь только сам аккаунт:
 * приложение живёт за входом, и выйти из него должно быть откуда.
 */
export default function SettingsTab() {
  const { data: profile } = useProfile();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    setSignOutError(false);
    try {
      // Дальше экран сменит AuthGate: сессии нет — экран входа.
      await signOut();
    } catch {
      setSignOutError(true);
      setSigningOut(false);
    }
  }

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
        <View className="gap-sm">
          {signOutError ? (
            <Text variant="caption" tone="muted" className="text-center" accessibilityLiveRegion="polite">
              {t("settings.signOutFailed")}
            </Text>
          ) : null}
          <Button
            label={t("settings.signOut")}
            variant="secondary"
            loading={signingOut}
            onPress={() => void handleSignOut()}
          />
        </View>
      ) : null}
    </View>
  );
}
