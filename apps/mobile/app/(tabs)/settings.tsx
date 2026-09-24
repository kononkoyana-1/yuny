import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Text } from "@/shared/ui";
import { breakpoints } from "@/shared/config/tokens";
import { REQUIRES_AUTH } from "@/shared/config/dataSource";
import { t } from "@/shared/i18n";
import { ProfileCard } from "@/features/settings/ProfileCard";
import { ReviewSettings } from "@/features/settings/ReviewSettings";
import { AppearanceSettings } from "@/features/settings/AppearanceSettings";
import { AboutSettings } from "@/features/settings/AboutSettings";
import { AccountSettings } from "@/features/settings/AccountSettings";

/**
 * Экран 05 — Настройки (#40, docs/design/specs/settings.design.md). Одна
 * колонка по центру на любой ширине, порядок групп — он же порядок Tab:
 * профиль, повторения, оформление, о приложении, аккаунт. Группы грузятся и
 * падают независимо; оформление, источники и выход работают без сети.
 */
export default function SettingsTab() {
  // Ширина — по контейнеру, не по useWindowDimensions (#56).
  const [isWide, setIsWide] = useState(false);

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-background-dark"
      onLayout={(e) => setIsWide(e.nativeEvent.layout.width >= breakpoints.wide)}
    >
      <View
        className={`w-full max-w-settings-column self-center gap-xl ${
          isWide ? "px-xl pt-xxl pb-xxl" : "px-md pt-lg pb-xxl"
        }`}
      >
        <Text variant="display" accessibilityRole="header" aria-level={1}>
          {t("settings.title")}
        </Text>
        <ProfileCard isWide={isWide} />
        <ReviewSettings />
        <AppearanceSettings />
        <AboutSettings />
        {REQUIRES_AUTH ? <AccountSettings /> : null}
      </View>
    </ScrollView>
  );
}
