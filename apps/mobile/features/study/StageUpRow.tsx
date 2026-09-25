import { View } from "react-native";
import { HanziText, Icon, StageDot, Text } from "@/shared/ui";
import { useTheme } from "@/shared/lib/useTheme";
import { t } from "@/shared/i18n";
import type { StageUp } from "./session/summary";

/**
 * Слово продвинулось по стадиям (today-session.design.md §3.9): знак, точка
 * «было», стрелка, точка «стало». Для диктора — одна фраза.
 */
export function StageUpRow({ up }: { up: StageUp }) {
  const { colors } = useTheme();
  const from = t(`learn.stage.${up.from}`);
  const to = t(`learn.stage.${up.to}`);

  return (
    <View
      accessible
      accessibilityLabel={t("learn.stageUp.a11y", { word: up.headword, reading: up.reading ?? "", from, to })}
      className="flex-row flex-wrap items-center gap-sm py-xs"
    >
      <HanziText variant="inline" className="min-w-tap">
        {up.headword}
      </HanziText>
      <View className="flex-row items-center gap-xs">
        <StageDot stage={up.from} />
        <Text variant="caption" tone="muted">
          {from}
        </Text>
      </View>
      <Icon name="arrowRight" size={14} color={colors.textMuted} />
      <View className="flex-row items-center gap-xs">
        <StageDot stage={up.to} />
        <Text variant="caption">{to}</Text>
      </View>
    </View>
  );
}
