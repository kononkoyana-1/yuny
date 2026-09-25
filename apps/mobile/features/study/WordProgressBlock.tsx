import { View } from "react-native";
import { Button, Icon, SkillMeter, StageDot, Text } from "@/shared/ui";
import { useWordProgress } from "@/shared/api";
import { useTheme } from "@/shared/lib/useTheme";
import { t } from "@/shared/i18n";

const SKILLS = ["read", "pinyin", "write", "use"] as const;

/** «30 сентября» — дата, с которой пара различается. */
function formatDay(iso: string): string {
  return new Intl.DateTimeFormat("ru", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

/**
 * Прогресс слова в начале карточки (folder-map.design.md §3.5): стадия,
 * 4 навыка, ближайшее повторение, пары путаницы. Всё — с сервера; одна
 * память на слово, где бы его ни открыли.
 */
export function WordProgressBlock({ word }: { word: { headword: string; reading: string | null } }) {
  const { colors } = useTheme();
  const progress = useWordProgress(word);

  if (progress.isError && !progress.data) {
    return (
      <View className="gap-xs">
        <Text variant="body" tone="muted">
          {t("learn.word.progressError")}
        </Text>
        <View className="flex-row">
          <Button label={t("learn.word.retry")} variant="ghost" onPress={() => void progress.refetch()} />
        </View>
      </View>
    );
  }
  if (!progress.data) {
    return (
      <View aria-hidden className="gap-sm">
        <View className="h-4 w-32 rounded-sm bg-surface-alt dark:bg-surface-alt-dark" />
        <View className="h-10 rounded-md bg-surface-alt dark:bg-surface-alt-dark" />
      </View>
    );
  }
  const p = progress.data;
  if (!p.found) return null;

  if (p.stage === "new") {
    return (
      <Text variant="body" tone="muted">
        {t("learn.word.notStarted")}
      </Text>
    );
  }

  const next = p.next_review_days;
  return (
    <View className="gap-md">
      <View className="flex-row items-center gap-xs self-start rounded-pill bg-surface-alt px-sm py-xs dark:bg-surface-alt-dark">
        <StageDot stage={p.stage} />
        <Text variant="caption">{t(`learn.stage.${p.stage}`)}</Text>
      </View>

      <View className="flex-row flex-wrap gap-sm">
        {SKILLS.map((skill) => (
          <SkillMeter
            key={skill}
            label={t(`learn.word.skill.${skill}`)}
            level={p.skills[skill]}
            levelLabel={t(`learn.word.level.${p.skills[skill]}`)}
            className="min-w-[45%] flex-1"
          />
        ))}
      </View>

      {next !== null ? (
        <View className="flex-row items-center gap-sm">
          <Icon name="review" size={16} color={colors.textMuted} />
          <Text variant="body" tone="muted">
            {next === 0
              ? t("learn.word.next.today")
              : next === 1
                ? t("learn.word.next.tomorrow")
                : t("learn.word.next.in", { count: next })}
          </Text>
        </View>
      ) : null}

      {p.confusions.map((c) => (
        <View
          key={`${c.partner}|${c.partner_reading ?? ""}`}
          className="flex-row items-center gap-sm rounded-tile bg-pair-soft px-md py-sm dark:bg-pair-soft-dark"
        >
          <Icon name="pair" size={16} color={colors.pairInk} />
          <Text variant="body" tone="pairInk" className="flex-1">
            {c.status === "resolved" && c.resolved_on
              ? t("learn.word.confusion.resolved", { partner: c.partner, date: formatDay(c.resolved_on) })
              : t(`learn.word.confusion.${c.status === "resolved" ? "watch" : c.status}`, {
                partner: c.partner,
                reading: c.partner_reading ?? "",
              })}
          </Text>
        </View>
      ))}
    </View>
  );
}
