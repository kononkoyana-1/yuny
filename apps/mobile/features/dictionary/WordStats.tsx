import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import type { WordTotals } from "@yuny/shared";
import { Card, FOCUS_RING_CLASS, Icon, ProgressBar, Text } from "@/shared/ui";
import { useTheme } from "@/shared/lib/useTheme";
import { t } from "@/shared/i18n";
import { totalsEtaText } from "@/features/study/queueText";

/**
 * Сводка над списками (#85): сколько слов во всех папках, сколько изучено,
 * сколько осталось, и сколько дней впереди при темпе из настроек — рядом
 * ссылка туда, где этот темп меняют.
 */
export function WordStats({ total, perDay }: { total: WordTotals; perDay: number | null }) {
  const router = useRouter();
  const { colors } = useTheme();
  if (total.words <= 0) return null;

  return (
    <Card className="gap-md">
      <View
        accessible
        accessibilityLabel={t("learn.queue.stats.a11y", { words: total.words, learned: total.learned, left: total.queued })}
        className="gap-sm"
      >
        <Text variant="eyebrow" tone="muted" className="uppercase">
          {t("learn.queue.stats.title")}
        </Text>
        <View className="flex-row">
          <Stat value={total.words} label={t("learn.queue.stats.words")} />
          <Stat value={total.learned} label={t("learn.queue.stats.learned")} />
          <Stat value={total.queued} label={t("learn.queue.stats.left")} />
        </View>
        <ProgressBar progress={total.learned / total.words} />
      </View>
      <Text variant="body" tone="muted">
        {totalsEtaText(total, perDay)}
      </Text>
      <Pressable
        accessibilityRole="link"
        accessibilityHint={t("learn.queue.stats.settingsHint")}
        onPress={() => router.push("/settings")}
        className={`min-h-tap flex-row items-center gap-xs self-start rounded-sm ${FOCUS_RING_CLASS}`}
      >
        <Text variant="heading" tone="brand">
          {t("learn.queue.stats.settings")}
        </Text>
        <Icon name="arrowRight" size={18} color={colors.primary} />
      </Pressable>
    </Card>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View className="flex-1 gap-xs">
      <Text variant="title">{String(value)}</Text>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </View>
  );
}
