import { SegmentedChoice, SettingBlock, SettingsGroup } from "@/shared/ui";
import { setThemePreference, useThemePreference, type ThemePreference } from "@/shared/lib/themePreference";
import { t } from "@/shared/i18n";

const THEMES = [
  { value: "system", icon: "monitor", label: "settings.appearance.system" },
  { value: "light", icon: "sun", label: "settings.appearance.light" },
  { value: "dark", icon: "moon", label: "settings.appearance.dark" },
] as const;

/** Группа «Оформление»: тема применяется сразу и живёт на устройстве. */
export function AppearanceSettings() {
  const preference = useThemePreference();
  const label = t("settings.appearance.theme");

  return (
    <SettingsGroup title={t("settings.appearance.title")}>
      <SettingBlock label={label} hint={t("settings.appearance.themeHint")} hintId="settings-theme-hint">
        <SegmentedChoice<ThemePreference>
          size="compact"
          accessibilityLabel={label}
          describedById="settings-theme-hint"
          value={preference}
          onChange={setThemePreference}
          options={THEMES.map((o) => ({ value: o.value, icon: o.icon, label: t(o.label) }))}
        />
      </SettingBlock>
    </SettingsGroup>
  );
}
