import Constants from "expo-constants";
import { Linking, Platform } from "react-native";
import { SettingsGroup, SettingsRow } from "@/shared/ui";
import { t } from "@/shared/i18n";
import { DATA_SOURCES } from "./dataSources";

/** Группа «О приложении»: источники данных (их требуют лицензии) и версия. */
export function AboutSettings() {
  const version = Constants.expoConfig?.version;

  return (
    <SettingsGroup
      title={t("settings.about.title")}
      lead={t("settings.about.sourcesLead")}
      footer={version ? t("settings.about.version", { version }) : undefined}
    >
      {DATA_SOURCES.map((source) => {
        const title = t(`settings.about.source.${source.id}.title`);
        const detail = t(`settings.about.source.${source.id}.detail`);
        return (
          <SettingsRow
            key={source.id}
            role={source.url ? "link" : "text"}
            title={title}
            detail={detail}
            trailing={source.url ? "external" : "none"}
            href={source.url}
            accessibilityLabel={source.url ? t("settings.about.sourceA11y", { title, detail }) : undefined}
            onPress={
              source.url && Platform.OS !== "web" ? () => void Linking.openURL(source.url as string) : undefined
            }
          />
        );
      })}
    </SettingsGroup>
  );
}
