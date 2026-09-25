import { useRef, useState, type RefObject } from "react";
import { View } from "react-native";
import type { SessionMinutes, SessionPreview } from "@yuny/shared";
import { Button, FeedbackBanner, Mascot, SegmentedChoice, Sheet, Text } from "@/shared/ui";
import { t } from "@/shared/i18n";

const MINUTES: readonly SessionMinutes[] = [5, 10, 15];

export type BudgetSheetMode = "daily" | "change";

export interface BudgetSheetProps {
  /** `daily` — утреннее «Повторим?», `change` — из чипа бюджета: без старта сессии. */
  mode: BudgetSheetMode | null;
  today: SessionPreview;
  /** `daily`: «Начать» — сохранить минуты и начать. Бросает — показываем ошибку, окно остаётся. */
  onStart: (minutes: SessionMinutes) => Promise<void>;
  /** `change`: «Готово» — сохранить минуты. */
  onSave: (minutes: SessionMinutes) => Promise<void>;
  /** «Позже» / «Отмена» / Escape / затемнение. */
  onClose: () => void;
  returnFocusRef?: RefObject<View | null>;
}

/**
 * Окно «Повторим?» (today-session.design.md §3.7): 5 / 10 / 15 минут, строка
 * состава и кнопка меняются сразу из `plans` — без сети.
 */
export function BudgetSheet({ mode, ...props }: BudgetSheetProps) {
  return (
    <Sheet
      visible={mode !== null}
      onClose={props.onClose}
      accessibilityLabel={mode === "change" ? t("learn.prompt.changeTitle") : t("learn.prompt.title")}
      returnFocusRef={props.returnFocusRef}
    >
      {/* Ключ — режим и бюджет: выбор при каждом открытии начинается с запомненного. */}
      {mode ? <BudgetSheetBody key={`${mode}:${props.today.budget_minutes}`} mode={mode} {...props} /> : null}
    </Sheet>
  );
}

function BudgetSheetBody({ mode, today, onStart, onSave, onClose }: Omit<BudgetSheetProps, "mode"> & { mode: BudgetSheetMode }) {
  const [minutes, setMinutes] = useState<SessionMinutes>(today.budget_minutes);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const primaryRef = useRef<View>(null);
  const plan = today.plans.find((p) => p.minutes === minutes);
  const daily = mode === "daily";

  async function confirm() {
    setBusy(true);
    setFailed(false);
    try {
      await (daily ? onStart(minutes) : onSave(minutes));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="gap-lg">
      {daily ? <Mascot stage={1} mood="neutral" size="small" showStage={false} decorative className="self-center" /> : null}
      <View className="gap-xs">
        <Text variant="title" accessibilityRole="header">
          {daily ? t("learn.prompt.title") : t("learn.prompt.changeTitle")}
        </Text>
        {plan ? (
          <Text variant="body" tone="muted">
            {plan.new > 0 && today.reason !== "debt"
              ? t("learn.prompt.line", { review: plan.due, new: plan.new })
              : t("learn.prompt.lineNoNew", { review: plan.due })}
          </Text>
        ) : null}
      </View>

      <SegmentedChoice
        size="large"
        value={String(minutes)}
        onChange={(value) => setMinutes(Number(value) as SessionMinutes)}
        accessibilityLabel={t("learn.prompt.groupA11y")}
        options={MINUTES.map((m) => ({
          value: String(m),
          label: t("learn.prompt.option", { count: m }),
          accessibilityLabel: t("learn.prompt.optionA11y", { count: m }),
        }))}
      />

      <View className="gap-sm">
        <Button
          ref={primaryRef}
          label={daily ? t("learn.prompt.start", { count: minutes }) : t("learn.prompt.save")}
          loading={busy}
          onPress={() => void confirm()}
        />
        <Button label={daily ? t("learn.prompt.later") : t("learn.prompt.cancel")} variant="ghost" onPress={onClose} />
      </View>

      {failed ? <FeedbackBanner tone="encouraging" message={t("learn.prompt.startError")} /> : null}
    </View>
  );
}
