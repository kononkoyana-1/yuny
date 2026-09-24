import type { LearningSettings, SessionMinutes } from "@yuny/shared";
import {
  ErrorState,
  LoadingState,
  SaveStatus,
  SegmentedChoice,
  SettingBlock,
  SettingsGroup,
  type SaveStatusState,
} from "@/shared/ui";
import { useLearningSettings, useSettingField } from "@/shared/api";
import { t } from "@/shared/i18n";

const MINUTES: readonly SessionMinutes[] = [5, 10, 15];
const NEW_WORDS = [0, 5, 8, 12] as const;
const INTENSITY = [
  { value: 0.85, label: "settings.review.intensityGentle" },
  { value: 0.9, label: "settings.review.intensityNormal" },
  { value: 0.93, label: "settings.review.intensityIntense" },
] as const;

/**
 * Какой вариант выбран. `retention` хранится как `real`, поэтому сравнение с
 * допуском; значение не из вариантов (БД допускает шире) — ничего не выбрано,
 * и экран его сам не переписывает (settings.design.md §3.4).
 */
export function matchOption<T extends number>(value: number, options: readonly T[]): T | null {
  return options.find((o) => Math.abs(o - value) < 0.005) ?? null;
}

function Status({
  state,
  onRetry,
  setting,
}: {
  state: SaveStatusState;
  onRetry: () => void;
  setting: string;
}) {
  if (state === "error") return null;
  return (
    <SaveStatus
      state={state}
      layout="inline"
      message={t(state === "saving" ? "settings.save.saving" : "settings.save.saved")}
      onRetry={onRetry}
      retryA11yLabel={t("settings.save.retryA11y", { setting })}
    />
  );
}

function ErrorLine({ state, onRetry, setting }: { state: SaveStatusState; onRetry: () => void; setting: string }) {
  if (state !== "error") return null;
  return (
    <SaveStatus
      state="error"
      layout="block"
      message={t("settings.save.error")}
      retryLabel={t("settings.save.retry")}
      retryA11yLabel={t("settings.save.retryA11y", { setting })}
      onRetry={onRetry}
    />
  );
}

/** Группа «Повторения»: время, потолок новых слов, интенсивность. Сохраняется сразу. */
export function ReviewSettings() {
  const settings = useLearningSettings();

  return (
    <SettingsGroup title={t("settings.review.title")}>
      {settings.isPending ? (
        <LoadingState message={t("settings.review.loading")} className="p-md" />
      ) : settings.isError || !settings.data ? (
        <ErrorState
          title={t("settings.review.error")}
          detail={t("settings.common.errorDetail")}
          onRetry={() => void settings.refetch()}
          retryLabel={t("settings.common.retry")}
          className="p-md"
        />
      ) : (
        // Три блока — прямые дети группы, иначе SettingsGroup не поставит
        // разделители между ними (settings.review.md m1).
        [
          <MinutesBlock key="minutes" data={settings.data} />,
          <NewWordsBlock key="new" data={settings.data} />,
          <IntensityBlock key="intensity" data={settings.data} />,
        ]
      )}
    </SettingsGroup>
  );
}

function MinutesBlock({ data }: { data: LearningSettings }) {
  const field = useSettingField("session_minutes");
  const label = t("settings.review.minutes");
  return (
    <SettingBlock
      label={label}
      hint={t("settings.review.minutesHint")}
      hintId="settings-minutes-hint"
      status={<Status state={field.state} onRetry={field.retry} setting={label} />}
      footer={<ErrorLine state={field.state} onRetry={field.retry} setting={label} />}
    >
      <SegmentedChoice
        size="compact"
        accessibilityLabel={label}
        describedById="settings-minutes-hint"
        value={String(matchOption(data.session_minutes, MINUTES) ?? "") || null}
        onChange={(v) => void field.save(Number(v) as SessionMinutes)}
        options={MINUTES.map((m) => ({
          value: String(m),
          label: t("settings.review.minutesOption", { count: m }),
          accessibilityLabel: t("settings.review.minutesA11y", { count: m }),
        }))}
      />
    </SettingBlock>
  );
}

function NewWordsBlock({ data }: { data: LearningSettings }) {
  const field = useSettingField("max_new");
  const label = t("settings.review.newWords");
  return (
    <SettingBlock
      label={label}
      hint={t(data.max_new === 0 ? "settings.review.newHintZero" : "settings.review.newHint")}
      hintId="settings-new-hint"
      status={<Status state={field.state} onRetry={field.retry} setting={label} />}
      footer={<ErrorLine state={field.state} onRetry={field.retry} setting={label} />}
    >
      <SegmentedChoice
        size="compact"
        accessibilityLabel={label}
        describedById="settings-new-hint"
        value={matchOption(data.max_new, NEW_WORDS) === null ? null : String(data.max_new)}
        onChange={(v) => void field.save(Number(v))}
        options={NEW_WORDS.map((n) => ({
          value: String(n),
          label: String(n),
          accessibilityLabel: t("settings.review.newA11y", { count: n }),
        }))}
      />
    </SettingBlock>
  );
}

function IntensityBlock({ data }: { data: LearningSettings }) {
  const field = useSettingField("retention");
  const label = t("settings.review.intensity");
  const hit = matchOption(data.retention, INTENSITY.map((o) => o.value));
  return (
    <SettingBlock
      label={label}
      hint={t("settings.review.intensityHint")}
      hintId="settings-intensity-hint"
      status={<Status state={field.state} onRetry={field.retry} setting={label} />}
      footer={<ErrorLine state={field.state} onRetry={field.retry} setting={label} />}
    >
      <SegmentedChoice
        size="compact"
        accessibilityLabel={label}
        describedById="settings-intensity-hint"
        value={hit === null ? null : String(hit)}
        onChange={(v) => void field.save(Number(v))}
        options={INTENSITY.map((o) => ({ value: String(o.value), label: t(o.label) }))}
      />
    </SettingBlock>
  );
}
