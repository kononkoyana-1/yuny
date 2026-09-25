import { View } from "react-native";
import type { FolderMode, FolderStudyPlan } from "@yuny/shared";
import { Button, Card, Chip, Icon, StudyButton, Text, type IconName } from "@/shared/ui";
import { useFolderPlan } from "@/shared/api";
import { useTheme } from "@/shared/lib/useTheme";
import { t } from "@/shared/i18n";

type Offer = NonNullable<FolderStudyPlan["primary"]>;

const MODE_ICON: Record<FolderMode, IconName> = { review: "review", new: "sparkle", practice: "practice" };

function title(o: Offer): string {
  if (o.mode === "review") return t("learn.folder.mode.review", { count: o.count ?? 0 });
  if (o.mode === "new") return t("learn.folder.mode.new", { count: o.count ?? 0, total: o.total_new ?? 0 });
  return t("learn.folder.mode.practice");
}

function chipLabel(o: Offer): string {
  return o.mode === "review" ? t("learn.folder.chip.review", { count: o.count ?? 0 }) : t(`learn.folder.chip.${o.mode}`);
}

/**
 * «Учить папку» (folder-study.design.md §3): главная кнопка с режимом, что
 * предложить ещё, заметка о практике и нагрузка на завтра. Что предлагать —
 * решает сервер (`folder_preview`).
 */
export function FolderStudyBlock({ folderId, onStart }: { folderId: string; onStart: (mode: FolderMode) => void }) {
  const { colors } = useTheme();
  const plan = useFolderPlan(folderId);

  if (!plan.data) {
    if (plan.isError) {
      return (
        <Card className="gap-sm">
          <Text variant="body">{t("learn.folder.error")}</Text>
          <View className="flex-row">
            <Button label={t("learn.folder.retry")} variant="ghost" onPress={() => void plan.refetch()} />
          </View>
        </Card>
      );
    }
    return (
      <View
        accessible
        accessibilityLabel={t("learn.folder.loadingA11y")}
        className="h-study-button rounded-hero bg-surface-alt dark:bg-surface-alt-dark"
      />
    );
  }

  const { primary, alternatives, practice_note: practiceNote, load_warning: loadWarning } = plan.data;

  return (
    <View className="gap-sm">
      {primary ? (
        <StudyButton
          icon={MODE_ICON[primary.mode]}
          title={title(primary)}
          subtitle={t(`learn.folder.sub.${primary.mode}`, { minutes: primary.minutes })}
          onPress={() => onStart(primary.mode)}
        />
      ) : (
        <Card className="flex-row items-center gap-sm">
          <View
            aria-hidden
            className="h-8 w-8 items-center justify-center rounded-pill bg-success-soft dark:bg-success-soft-dark"
          >
            <Icon name="check" size={18} color={colors.success} />
          </View>
          <Text variant="body" className="flex-1">
            {t("learn.folder.nothing")}
          </Text>
        </Card>
      )}

      {practiceNote ? (
        <Text variant="body" tone="muted">
          {t("learn.folder.practiceNote")}
        </Text>
      ) : null}

      {loadWarning && primary?.mode === "new" ? (
        <View className="rounded-md bg-attention-soft px-md py-sm dark:bg-attention-soft-dark">
          <Text variant="body" tone="attentionInk">
            {t("learn.folder.loadWarning", { count: loadWarning.tomorrow_tasks })}
          </Text>
        </View>
      ) : null}

      {alternatives.length > 0 ? (
        <View accessibilityLabel={t("learn.folder.altA11y")} className="flex-row flex-wrap items-center gap-sm">
          <Text variant="caption" tone="muted">
            {t("learn.folder.or")}
          </Text>
          {alternatives.map((o) => (
            <Chip key={o.mode} icon={MODE_ICON[o.mode]} label={chipLabel(o)} onPress={() => onStart(o.mode)} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
