import type { SessionPreview } from "@yuny/shared";
import { t } from "@/shared/i18n";

export type TodayPlan = SessionPreview["plans"][number];

/** План под запомненный бюджет; сервер всегда присылает все три. */
export function currentPlan(today: SessionPreview): TodayPlan | undefined {
  return today.plans.find((p) => p.minutes === today.budget_minutes);
}

/** «из «Покупки»» / «из «Покупки» и ещё 2». */
export function newSourceText(plan: TodayPlan): string | undefined {
  const [first, ...rest] = plan.new_sources;
  if (!first) return undefined;
  return rest.length === 0
    ? t("learn.today.newFrom", { folder: first.folder_name })
    : t("learn.today.newFromMore", { folder: first.folder_name, count: rest.length });
}

/** Подпись под парой: «и ещё N», когда пар несколько. */
export function pairMoreText(plan: TodayPlan): string | undefined {
  return plan.pairs.length > 1 ? t("learn.today.pairMore", { count: plan.pairs.length - 1 }) : undefined;
}

/** Строки состава одной фразой для диктора (today-session.design.md §7). */
export function compositionA11y(plan: TodayPlan, debt: boolean): string {
  const parts = [`${t("learn.today.review")}: ${plan.due}.`];
  if (!debt && plan.new > 0) {
    const from = newSourceText(plan);
    parts.push(`${t("learn.today.new")}: ${plan.new}${from ? `, ${from}` : ""}.`);
  }
  const pair = plan.pairs[0];
  if (pair) {
    const more = pairMoreText(plan);
    parts.push(`${t("learn.today.pair")}: ${t("learn.today.pairA11y", pair)}${more ? `, ${more}` : ""}.`);
  }
  return parts.join(" ");
}

/** «Сейчас вы вспомните ~212 из 347 слов · Завтра ~30»; без выученных слов — только прогноз. */
export function footerText(today: SessionPreview, plan: TodayPlan): string {
  const { recalled, total } = today.recall_now;
  return total > 0
    ? t("learn.today.footer", { recalled, total, tomorrow: plan.due_tomorrow })
    : t("learn.today.footerTomorrow", { tomorrow: plan.due_tomorrow });
}

/** Строка под «Готово на сегодня». */
export function doneDetailText(today: SessionPreview, plan: TodayPlan): string {
  const { recalled, total } = today.recall_now;
  return total > 0
    ? t("learn.today.doneDetail", { tomorrow: plan.due_tomorrow, recalled, total })
    : t("learn.today.doneDetailTomorrow", { tomorrow: plan.due_tomorrow });
}
