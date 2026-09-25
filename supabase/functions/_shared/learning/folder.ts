/**
 * Что предложить на экране папки (#69, folder-study.design.md §1, §3): главный
 * режим, остальные, заметка о практике и нагрузка на завтра. Считается теми
 * же функциями, что и само занятие, — числа на кнопке совпадают с сессией.
 */
import { buildSession, dueSkills, type FolderMode, newQueue, newWordTomorrow, type PlanInput, ROUND_SIZE, sessionBudget } from "./session.ts";
import { estimateMinutes } from "./today.ts";

export interface FolderModeOffer {
  mode: FolderMode;
  /** review — сколько слов пора повторить (не навыков); new — слов в раунде; practice — `null`. */
  count: number | null;
  /** new — сколько новых слов в папке всего. */
  totalNew: number | null;
  minutes: number;
}

export interface FolderPlan {
  primary: FolderModeOffer | null;
  alternatives: FolderModeOffer[];
  /** Повторять нечего, новых нет — только практика: «эти слова пока держатся». */
  practiceNote: boolean;
  /** Раунд новых сделает завтрашний день тяжелее бюджета — показать до старта. */
  loadWarning: { tomorrowTasks: number } | null;
}

type Input = Omit<PlanInput, "mode" | "folderId" | "folderMode" | "minutes">;

export function folderPlan(input: Input, folderId: string, minutes: number): FolderPlan {
  const base: PlanInput = { ...input, mode: "folder", folderId, minutes };
  // Слов, а не навыков: у слова пора бывает и «Читаю», и «Пиньинь» — на кнопке
  // «Повторить · 65» при 50 словах в папке читалось как ошибка.
  const due = new Set(dueSkills(base, folderId).map((d) => d.lexemeId)).size;
  const queue = newQueue(base, folderId).length;
  const practiceable = input.lexemes.some((l) => l.folderIds.includes(folderId) && input.states[l.id]?.read);

  const offer = (mode: FolderMode): FolderModeOffer => {
    const plan = buildSession({ ...base, folderMode: mode });
    return {
      mode,
      count: mode === "review" ? due : mode === "new" ? Math.min(ROUND_SIZE, queue) : null,
      totalNew: mode === "new" ? queue : null,
      minutes: Math.max(1, estimateMinutes(plan.tasks.length, input.pace)),
    };
  };

  const available: FolderMode[] = [
    ...(due > 0 ? ["review" as const] : []),
    ...(queue > 0 ? ["new" as const] : []),
    ...(practiceable ? ["practice" as const] : []),
  ];
  const offers = available.map(offer);
  // Порядок режимов — как у сборщика: сначала долг, потом новое, потом практика.
  const primary = offers[0] ?? null;

  let loadWarning: FolderPlan["loadWarning"] = null;
  if (queue > 0) {
    const round = buildSession({ ...base, folderMode: "new" });
    if (round.stats.dueTomorrow > sessionBudget(minutes, input.pace)) {
      loadWarning = { tomorrowTasks: round.stats.dueTomorrow };
    }
  }

  return {
    primary,
    alternatives: offers.slice(1),
    practiceNote: primary?.mode === "practice",
    loadWarning,
  };
}

/** «Ещё 7 новых слов» после «Сегодня»: сколько слов и сколько заданий прибавится завтра. */
export function extraNewOffer(input: Input, minutes: number): { count: number; tomorrowDelta: number; folderId: string } | null {
  const base: PlanInput = { ...input, mode: "today", minutes };
  const queue = newQueue(base, null);
  const first = queue[0];
  if (!first) return null;
  const folderId = first.folderIds[0]!;
  const count = Math.min(ROUND_SIZE, newQueue(base, folderId).length);
  return { count, tomorrowDelta: count * newWordTomorrow(input.retention), folderId };
}
