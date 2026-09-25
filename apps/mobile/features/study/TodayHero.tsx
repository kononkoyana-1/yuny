import type { Ref } from "react";
import { View } from "react-native";
import type { SessionPreview } from "@yuny/shared";
import { Button, Card, Chip, CountUp, HanziText, HeroCard, Icon, StatLine, Text } from "@/shared/ui";
import { useTheme } from "@/shared/lib/useTheme";
import { t } from "@/shared/i18n";
import {
  compositionA11y,
  currentPlan,
  doneDetailText,
  footerText,
  newSourceText,
  pairMoreText,
} from "./todayText";

export interface TodayHeroProps {
  /** `undefined` — ещё грузится (сразу после входа). */
  today: SessionPreview | undefined;
  isError: boolean;
  onRetry: () => void;
  onStart: () => void;
  /** Окно выбора минут (#68). Не передан — чипа бюджета нет. */
  onChangeBudget?: () => void;
  budgetChipRef?: Ref<View>;
  /** «Можно поучить папку →» — к заголовку «Мой словарь». */
  onToFolders: () => void;
  className?: string;
}

/**
 * Карточка «Сегодня» наверху «Словаря» (#66, today-session.design.md §3.3–3.6, §5).
 * Всё, что на ней написано, считает сервер (`session-build` preview); здесь
 * только вывод. `no_words` — карточки нет, пустой «Мой словарь» сам зовёт
 * создать папку.
 */
export function TodayHero({ today, isError, onRetry, className = "", ...actions }: TodayHeroProps) {
  if (!today) {
    if (isError) return <TodayError onRetry={onRetry} className={className} />;
    return <TodayLoading className={className} />;
  }
  if (today.state === "no_words") return null;
  if (today.state === "done" || today.state === "nothing_due") {
    return <TodayDone today={today} onToFolders={actions.onToFolders} className={className} />;
  }
  return <TodayReady today={today} className={className} {...actions} />;
}

function TodayReady({
  today,
  onStart,
  onChangeBudget,
  budgetChipRef,
  className,
}: Omit<TodayHeroProps, "today" | "isError" | "onRetry" | "onToFolders"> & { today: SessionPreview }) {
  const plan = currentPlan(today);
  if (!plan) return null;
  const debt = today.reason === "debt";
  const minutes = t("learn.today.minutesA11y", { count: plan.est_minutes });
  const pair = plan.pairs[0];

  return (
    <HeroCard className={`gap-md ${className}`}>
      <View className="flex-row items-center justify-between gap-sm">
        <Text variant="eyebrow" tone="heroInkMuted" accessibilityRole="header" className="uppercase">
          {t("learn.today.eyebrow")}
        </Text>
        {onChangeBudget ? (
          <Chip
            ref={budgetChipRef}
            variant="onHero"
            icon="chevronDown"
            label={t("learn.today.budgetChip", { count: today.budget_minutes })}
            accessibilityLabel={t("learn.today.budgetChipA11y", { count: today.budget_minutes })}
            onPress={onChangeBudget}
          />
        ) : null}
      </View>

      <View accessible accessibilityLabel={t("learn.today.countA11y", { count: plan.total, minutes })}>
        <CountUp value={plan.total} tone="heroInk" />
        <Text variant="body" tone="heroInkMuted">
          {`${t("learn.today.tasks", { count: plan.total })} · ${t("learn.today.minutes", { count: plan.est_minutes })}`}
        </Text>
      </View>

      <View aria-hidden className="h-px bg-hero-ink/20 dark:bg-hero-ink-dark/20" />

      <View accessible accessibilityLabel={compositionA11y(plan, debt)} className="gap-sm">
        <StatLine icon="review" label={t("learn.today.review")} value={String(plan.due)} />
        {!debt && plan.new > 0 ? (
          <StatLine icon="sparkle" label={t("learn.today.new")} value={String(plan.new)} detail={newSourceText(plan)} />
        ) : null}
        {pair ? (
          <StatLine
            icon="pair"
            label={t("learn.today.pair")}
            value={
              <HanziText variant="inline" tone="heroInk">
                {`${pair.a} / ${pair.b}`}
              </HanziText>
            }
            detail={pairMoreText(plan)}
          />
        ) : null}
      </View>

      {debt ? (
        <View className="rounded-md bg-attention-soft px-md py-sm dark:bg-attention-soft-dark">
          <Text variant="body" tone="attentionInk">
            {t("learn.today.debt", { count: today.due_now })}
          </Text>
        </View>
      ) : null}

      <Button
        variant="hero"
        label={t("learn.today.start")}
        accessibilityHint={t("learn.today.startHint")}
        onPress={onStart}
      />

      <Text variant="caption" tone="heroInkMuted">
        {footerText(today, plan)}
      </Text>
    </HeroCard>
  );
}

function TodayDone({
  today,
  onToFolders,
  className,
}: {
  today: SessionPreview;
  onToFolders: () => void;
  className: string;
}) {
  const { colors } = useTheme();
  const plan = currentPlan(today);
  const done = today.state === "done";

  return (
    <Card className={`gap-sm rounded-hero border border-border p-lg shadow-none dark:border-border-dark ${className}`}>
      <Text variant="eyebrow" tone="muted" accessibilityRole="header" className="uppercase">
        {t("learn.today.eyebrow")}
      </Text>
      <View className="flex-row items-center gap-sm">
        <View
          aria-hidden
          className="h-8 w-8 items-center justify-center rounded-pill bg-success-soft dark:bg-success-soft-dark"
        >
          <Icon name="check" size={18} color={colors.success} />
        </View>
        <Text variant="title" className="flex-1">
          {done ? t("learn.today.done") : t("learn.today.nothingDue")}
        </Text>
      </View>
      <Text variant="body" tone="muted">
        {done && plan ? doneDetailText(today, plan) : t("learn.today.nothingDueDetail")}
      </Text>
      <View className="flex-row">
        <Button variant="ghost" label={t("learn.today.toFolders")} onPress={onToFolders} />
      </View>
    </Card>
  );
}

/** Та же высота, что у героя: словарь под ним не прыгает, когда план приходит. */
function TodayLoading({ className }: { className: string }) {
  return (
    <HeroCard className={`gap-md ${className}`}>
      <View aria-hidden className="h-4 w-20 rounded-sm bg-hero-ink/[0.12]" />
      <View aria-hidden className="h-[60px] w-24 rounded-md bg-hero-ink/[0.12]" />
      <View aria-hidden className="h-4 w-40 rounded-sm bg-hero-ink/[0.12]" />
      <Text variant="caption" tone="heroInkMuted" accessibilityLiveRegion="polite">
        {t("learn.today.loading")}
      </Text>
    </HeroCard>
  );
}

function TodayError({ onRetry, className }: { onRetry: () => void; className: string }) {
  return (
    <Card className={`gap-md rounded-hero border border-border p-lg shadow-none dark:border-border-dark ${className}`}>
      <Text variant="body">{t("learn.today.error")}</Text>
      <View className="flex-row">
        <Button variant="secondary" label={t("learn.today.retry")} onPress={onRetry} />
      </View>
    </Card>
  );
}
