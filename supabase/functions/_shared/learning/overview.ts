/**
 * Сводки для экранов (#70, folder-map.design.md §1): стадии слов папки,
 * «пора освежить», метки пар, прогресс слова. Считает сервер — клиент только
 * выводит (TZ.md §3, правило 1).
 */
import { DAY_MS, MODEL, type Skill } from "./config.ts";
import { retrievabilityAt, type Stage, wordStage } from "./memory.ts";
import { dueSkills, type PlanInput, type PlanLexeme, type PlanPair } from "./session.ts";
import type { StoredSkill } from "./submit.ts";

export type SkillLevel = "not_started" | "fresh" | "holding" | "stable";

/** Навык «держится» от 3 дней стабильности, «устойчиво» — от 21. */
const HOLDING_S = 3;
const STABLE_S = 21;

export function skillLevel(st: StoredSkill | undefined, now: Date): SkillLevel {
  if (!st?.lastReview) return "not_started";
  if (retrievabilityAt(st, now) < MODEL.stageMinRetrievability) return "fresh";
  if (st.stability >= STABLE_S) return "stable";
  if (st.stability >= HOLDING_S) return "holding";
  return "fresh";
}

const STAGES: Stage[] = ["new", "meeting", "recognize", "recall", "use", "stable"];
const emptyCounts = (): Record<Stage, number> => Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<Stage, number>;

const involves = (p: PlanPair, id: string) => p.lexemeA === id || p.lexemeB === id;

export function stageOf(input: Pick<PlanInput, "states" | "pairs" | "now">, l: PlanLexeme): Stage {
  return wordStage(input.states[l.id] ?? {}, {
    now: input.now,
    goal: l.goal,
    activePair: input.pairs.some((p) => p.status === "active" && involves(p, l.id)),
  });
}

export interface WordOnMap {
  headword: string;
  reading: string | null;
  stage: Stage;
  due: boolean;
  /** Незакрытая пара путаницы — знак партнёра для метки на плитке. */
  pairPartner: string | null;
}

export interface FolderOverview {
  wordCount: number;
  dueCount: number;
  stageCounts: Record<Stage, number>;
  words: WordOnMap[];
}

type OverviewInput = Pick<PlanInput, "lexemes" | "states" | "pairs" | "now" | "retention" | "reviewedToday"> &
  Omit<PlanInput, "mode" | "minutes">;

/** Карта папки: стадия, «пора освежить» и пара у каждого слова, итоги по стадиям. */
export function folderOverview(input: OverviewInput, folderId: string): FolderOverview {
  const base: PlanInput = { ...input, mode: "folder", folderId, minutes: 10 };
  const dueIds = new Set(dueSkills(base, folderId).map((d) => d.lexemeId));
  const stageCounts = emptyCounts();
  const words: WordOnMap[] = [];
  for (const l of input.lexemes) {
    if (!l.folderIds.includes(folderId)) continue;
    const stage = stageOf(input, l);
    stageCounts[stage]++;
    const pair = input.pairs.find((p) => p.status !== "resolved" && involves(p, l.id));
    const partner = pair ? (pair.lexemeA === l.id ? pair.b : pair.a).headword : null;
    words.push({ headword: l.headword, reading: l.reading, stage, due: dueIds.has(l.id), pairPartner: partner });
  }
  return { wordCount: words.length, dueCount: words.filter((w) => w.due).length, stageCounts, words };
}

export interface ConfusionView {
  partner: string;
  partnerReading: string | null;
  status: "active" | "watch" | "resolved";
  resolvedOn: string | null;
}

export interface WordProgress {
  stage: Stage;
  skills: Record<Skill, SkillLevel>;
  /** Через сколько дней ближайшее повторение: 0 — сегодня; `null` — ещё не учили. */
  nextReviewDays: number | null;
  confusions: ConfusionView[];
}

/** Карточка слова: стадия, 4 навыка, ближайшее повторение, пары (включая решённые). */
export function wordProgress(
  input: Pick<PlanInput, "states" | "pairs" | "now">,
  l: PlanLexeme,
  allPairs: (PlanPair & { resolvedAt: Date | null })[],
): WordProgress {
  const states = input.states[l.id] ?? {};
  const skills = {
    read: skillLevel(states.read, input.now),
    pinyin: skillLevel(states.pinyin, input.now),
    write: skillLevel(states.write, input.now),
    use: skillLevel(states.use, input.now),
  };
  const dues = Object.values(states).filter((s) => s?.lastReview && s.due).map((s) => s!.due!.getTime());
  const nextReviewDays = dues.length
    ? Math.max(0, Math.ceil((Math.min(...dues) - input.now.getTime()) / DAY_MS))
    : null;
  const confusions = allPairs
    .filter((p) => p.status !== "pending" && involves(p, l.id))
    .map((p) => {
      const partner = p.lexemeA === l.id ? p.b : p.a;
      return {
        partner: partner.headword,
        partnerReading: partner.reading,
        status: p.status as ConfusionView["status"],
        resolvedOn: p.status === "resolved" && p.resolvedAt ? p.resolvedAt.toISOString().slice(0, 10) : null,
      };
    });
  return { stage: stageOf(input, l), skills, nextReviewDays, confusions };
}
