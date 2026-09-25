/**
 * Сборщик сессии (#63): «Сегодня» и учёба по папке — одна логика на два
 * входа (daily-and-folder-study.md, разделы 2, 3, 6; vocabulary-engine.md,
 * раздел 3). Чистая функция: что спросить и в каком порядке. Варианты
 * ответа и билеты собирает `session-build`.
 *
 * Пока нет предложений (#64), навык «Использую» и форматы C* не выдаются —
 * навык откроется, а спрашивать его начнём, когда появятся контексты.
 */
import { DAY_MS, type ExerciseCode, MODEL, type Skill } from "./config.ts";
import { intervalDays, retrievabilityAt } from "./memory.ts";
import type { StoredPair, StoredSkill } from "./submit.ts";

export interface PlanLexeme {
  id: string;
  headword: string;
  reading: string | null;
  goal: "full" | "read_only";
  hskLevel: number | null;
  /** Папки, где лежит слово, и когда его туда положили впервые. */
  folderIds: string[];
  addedAt: Date;
}

export interface PlanPair extends StoredPair {
  confusions: number;
  lastConfusedAt: Date | null;
}

export type FolderMode = "review" | "new" | "practice";

export interface PlanInput {
  now: Date;
  /** Начало дня по часам пользователя. */
  dayStart: Date;
  mode: "today" | "folder";
  folderId?: string;
  /** Для папки — какой режим; не задан — подбирается по состоянию папки. */
  folderMode?: FolderMode;
  minutes: number;
  /** Заданий в минуту по журналу пользователя; нет данных — 4. */
  pace: number;
  maxNew: number;
  retention: number;
  /** Слова, лежащие хотя бы в одной папке. */
  lexemes: PlanLexeme[];
  states: Record<string, Partial<Record<Skill, StoredSkill>>>;
  pairs: PlanPair[];
  /** `${lexemeId}:${skill}` и id пар, которые уже спрашивали сегодня. */
  reviewedToday: Set<string>;
  seed: number;
}

export type PlanTask =
  | { kind: "intro"; lexemeId: string; code: "intro" }
  | {
    kind: "review";
    lexemeId: string;
    skill: Skill;
    code: ExerciseCode;
    /** Новое слово раунда: первый круг — дистракторы не из этого раунда. */
    round?: 1 | 2;
  }
  | { kind: "pair_card"; pairId: string; code: "pair_card" }
  | { kind: "pair"; pairId: string; lexemeId: string | null; code: "X1" };

export type PlanReason = "debt" | "quota_spent" | "no_new_words" | null;

export interface SessionPlan {
  mode: "today" | "folder";
  folderMode: FolderMode | null;
  tasks: PlanTask[];
  /** Размеры порций по порядку; сумма — число заданий. */
  portions: number[];
  stats: {
    /** Сколько заданий в бюджете минут. */
    budget: number;
    /** Сколько пора повторить сейчас (навыки + пары), включая не вошедшее. */
    dueNow: number;
    newQuota: number;
    newTaken: number;
    /** Почему новых нет. */
    reason: PlanReason;
    /** Сколько заданий будет завтра с учётом новых слов этой сессии. */
    dueTomorrow: number;
  };
}

export const ROUND_SIZE = 7;
/** Уже знакомые слова из других папок в раунд — для перемешивания. */
export const ROUND_MIXINS = 3;
/** Сколько заданий в первую неделю стоит новое слово (для квоты). */
export const NEW_WORD_COST = 6;
/** Из одной папки не больше стольких новых в день, если есть другие. */
export const PER_FOLDER_NEW = 3;
const PAIR_BLOCK = ["pair_card", "X1", "X1", "X1"] as const;

const EASY: Record<Exclude<Skill, "use">, ExerciseCode> = { read: "R1", pinyin: "P1", write: "W1" };
const HARD: Record<Exclude<Skill, "use">, ExerciseCode> = { read: "R2", pinyin: "P2", write: "W2" };
/** Во сколько раз трудный формат снижает шанс успеха против лёгкого. */
const HARD_EASE = 0.85;

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------------------ бюджет

/** Заданий в сессии: минуты × темп, темп зажат в разумные рамки. */
export function sessionBudget(minutes: number, pace: number): number {
  return Math.round(minutes * Math.min(6, Math.max(3, pace || 4)));
}

/**
 * Квота новых слов на сегодня: свободное от завтрашних повторений место,
 * поделённое на цену слова в первую неделю, не больше потолка, минус уже
 * начатые сегодня (папка тратит ту же квоту).
 */
export function intakeQuota(o: { budget: number; dueTomorrow: number; maxNew: number; startedToday: number }): number {
  const free = o.budget - o.dueTomorrow;
  const quota = Math.min(o.maxNew, Math.max(0, Math.floor(free / NEW_WORD_COST)));
  return Math.max(0, quota - o.startedToday);
}

/**
 * Формат по «желательной трудности»: свежий навык — лёгкий; S ≥ 7 — трудный;
 * между ними трудный, если ожидаемый успех в нём не ниже 0.8.
 */
export function chooseFormat(skill: Exclude<Skill, "use">, state: StoredSkill | null, now: Date): ExerciseCode {
  if (!state || state.reps < 2) return EASY[skill];
  if (state.stability >= 7) return HARD[skill];
  return retrievabilityAt(state, now) * HARD_EASE >= 0.8 ? HARD[skill] : EASY[skill];
}

const involves = (p: StoredPair, id: string) => p.lexemeA === id || p.lexemeB === id;

/** Пара ждёт контрастной карточки: путали ≥ 2 раз за 30 дней, а карточки не было. */
function needsCard(p: PlanPair, now: Date): boolean {
  return p.status === "pending" && p.confusions >= MODEL.pair.threshold && !!p.lastConfusedAt &&
    now.getTime() - p.lastConfusedAt.getTime() <= MODEL.pair.windowDays * DAY_MS;
}

function pairDue(p: PlanPair, now: Date, retention: number): boolean {
  if (!p.memory || (p.status !== "active" && p.status !== "watch")) return false;
  return retrievabilityAt(p.memory, now) < retention;
}

function skillsOf(l: PlanLexeme): Exclude<Skill, "use">[] {
  return l.goal === "read_only" ? ["read", "pinyin"] : ["read", "pinyin", "write"];
}

/** Сколько заданий будет завтра: навыки и пары, у которых к концу завтра R упадёт ниже цели. */
export function forecastDue(input: Pick<PlanInput, "lexemes" | "states" | "pairs" | "retention">, at: Date): number {
  let n = 0;
  for (const l of input.lexemes) {
    for (const [skill, st] of Object.entries(input.states[l.id] ?? {})) {
      if (skill === "use" || !st) continue;
      if (retrievabilityAt(st, at) < input.retention) n++;
    }
  }
  for (const p of input.pairs) if (pairDue(p, at, input.retention)) n++;
  return n;
}

/** Сколько заданий стоит новое слово завтра: оба стартовых навыка (≈ 1,7 на слово в первые дни). */
export function newWordTomorrow(retention: number): number {
  // Первое верное вспоминание даёт S ≈ 2.5 × 0.5 = 1.25 дня — к завтра навык
  // уже просится. Считаем чтение и пиньинь, если завтра их срок.
  const s = 2.5 * 0.5;
  return intervalDays(s, retention) <= 1.5 ? 2 : 1;
}

// ------------------------------------------------------------ перемешивание

export interface Slot {
  key: string;
  task: PlanTask;
  lexemeId: string | null;
  /** Желаемое место: меньше — раньше. */
  rank: number;
  /** Не раньше, чем через `gap` заданий после другого слота (вспоминание после знакомства). */
  after?: { key: string; gap: number };
  /** Блок пары идёт целиком. */
  block?: PlanTask[];
}

/**
 * Порядок: по желаемому месту, но одно слово — не чаще раза в 4 задания,
 * подряд не больше двух одинаковых форматов, вспоминание нового слова — не
 * раньше чем через 3 задания после знакомства (сразу после показа ответ
 * берётся из рабочей памяти и ничего не доказывает). Когда правила не
 * выполнить, ослабляются сначала формат, потом расстояние — задержка
 * после знакомства остаётся.
 */
const BALANCE = 1.5;
const SAME_CODE = 3;
const WORD_BALANCE = 4;
/** Срочность важна, но грубо: главное — самые срочные в первой порции. */
const RANK_WEIGHT = 0.3;

export function interleave(slots: Slot[]): PlanTask[] {
  const out: PlanTask[] = [];
  const placedAt = new Map<string, number>();
  const lastAt = new Map<string, number>();
  const rest = [...slots].sort((x, y) => x.rank - y.rank);
  while (rest.length) {
    const pos = out.length;
    const ready = rest.filter((s) =>
      !s.after || (placedAt.has(s.after.key) && pos - placedAt.get(s.after.key)! >= s.after.gap)
    );
    const spaced = (s: Slot) => !s.lexemeId || !lastAt.has(s.lexemeId) || pos - lastAt.get(s.lexemeId)! > 3;
    const repeats = (s: Slot) => pos >= 2 && out[pos - 1].code === s.task.code && out[pos - 2].code === s.task.code;
    const good = ready.filter((s) => spaced(s) && !repeats(s));
    // Срочность — по месту, но формат, которого осталось больше, и смена
    // формата получают поблажку: иначе в конце остаются одинаковые подряд.
    const left = new Map<string, number>();
    const perWord = new Map<string, number>();
    for (const s of rest) {
      left.set(s.task.code, (left.get(s.task.code) ?? 0) + 1);
      if (s.lexemeId) perWord.set(s.lexemeId, (perWord.get(s.lexemeId) ?? 0) + 1);
    }
    // Слово, у которого заданий осталось больше, — раньше: иначе его задания
    // сбиваются в хвост ближе, чем через 3 других.
    const score = (s: Slot) =>
      RANK_WEIGHT * s.rank - BALANCE * (left.get(s.task.code) ?? 0) -
      WORD_BALANCE * (s.lexemeId ? perWord.get(s.lexemeId)! : 0) +
      (pos > 0 && s.task.code === out[pos - 1].code ? SAME_CODE : 0);
    const alt = good.length ? good.reduce((a, b) => (score(b) < score(a) ? b : a)) : undefined;
    const pick = alt ?? good[0] ?? ready.find(spaced) ?? ready[0] ??
      // Остались только ждущие задержки — ставим ближайшее по зависимости.
      rest.find((s) => s.after && placedAt.has(s.after.key)) ?? rest[0];
    rest.splice(rest.indexOf(pick), 1);
    for (const t of pick.block ?? [pick.task]) out.push(t);
    placedAt.set(pick.key, out.length - 1);
    if (pick.lexemeId) lastAt.set(pick.lexemeId, out.length - 1);
  }
  return out;
}

/** Порции по 8–10 заданий, без огрызка в конце. */
export function portions(n: number): number[] {
  if (n <= 0) return [];
  const k = Math.ceil(n / 10);
  const base = Math.floor(n / k);
  return Array.from({ length: k }, (_, i) => base + (i < n % k ? 1 : 0));
}

// ------------------------------------------------------------------ сборка

interface Due {
  lexemeId: string;
  skill: Exclude<Skill, "use">;
  priority: number;
}

export function dueSkills(input: PlanInput, onlyFolder: string | null): Due[] {
  const out: Due[] = [];
  const activeFor = (id: string) => input.pairs.some((p) => p.status === "active" && involves(p, id));
  for (const l of input.lexemes) {
    if (onlyFolder && !l.folderIds.includes(onlyFolder)) continue;
    for (const skill of skillsOf(l)) {
      const st = input.states[l.id]?.[skill];
      if (!st || input.reviewedToday.has(`${l.id}:${skill}`)) continue;
      const r = retrievabilityAt(st, input.now);
      if (r >= input.retention) continue;
      const recentLapse = st.lapses > 0 && !!st.lastReview && input.now.getTime() - st.lastReview.getTime() < 7 * DAY_MS;
      out.push({
        lexemeId: l.id,
        skill,
        priority: (input.retention - r) + (recentLapse ? 0.15 : 0) + (activeFor(l.id) ? 0.2 : 0),
      });
    }
  }
  return out.sort((a, b) => b.priority - a.priority);
}

/** Новые слова по очереди: недавно добавленные раньше, при равенстве — меньший HSK. */
export function newQueue(input: Pick<PlanInput, "lexemes" | "states">, onlyFolder: string | null): PlanLexeme[] {
  return input.lexemes
    .filter((l) => !input.states[l.id]?.read && (!onlyFolder || l.folderIds.includes(onlyFolder)))
    .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime() || (a.hskLevel ?? 9) - (b.hskLevel ?? 9));
}

/** Не вводить в один день слово и его известную пару путаницы. */
function pickNew(input: PlanInput, queue: PlanLexeme[], count: number, perFolder: number): PlanLexeme[] {
  const taken: PlanLexeme[] = [];
  const perFolderCount = new Map<string, number>();
  const multiFolder = new Set(queue.flatMap((l) => l.folderIds)).size > 1;
  for (const l of queue) {
    if (taken.length >= count) break;
    const folder = l.folderIds[0];
    if (multiFolder && (perFolderCount.get(folder) ?? 0) >= perFolder) continue;
    const clash = taken.some((t) =>
      input.pairs.some((p) => involves(p, t.id) && involves(p, l.id))
    );
    if (clash) continue;
    taken.push(l);
    perFolderCount.set(folder, (perFolderCount.get(folder) ?? 0) + 1);
  }
  // Правило «≤ 3 из папки» не должно оставлять квоту пустой.
  if (taken.length < count) {
    for (const l of queue) if (taken.length < count && !taken.includes(l)) taken.push(l);
  }
  return taken;
}

function startedToday(input: PlanInput): number {
  return input.lexemes.filter((l) => {
    const read = input.states[l.id]?.read;
    return !!read && read.unlockedAt.getTime() >= input.dayStart.getTime();
  }).length;
}

/**
 * Задания нового слова: знакомство, лёгкие вспоминания значения и чтения,
 * в раунде папки — ещё трудное вспоминание значения на втором круге.
 */
function newWordSlots(l: PlanLexeme, rank: number, withHard: boolean, spread: number): Slot[] {
  const intro = `intro:${l.id}`;
  const slots: Slot[] = [
    { key: intro, task: { kind: "intro", lexemeId: l.id, code: "intro" }, lexemeId: l.id, rank },
    {
      key: `R1:${l.id}`,
      task: { kind: "review", lexemeId: l.id, skill: "read", code: "R1", round: 1 },
      lexemeId: l.id,
      rank: rank + 3,
      after: { key: intro, gap: 3 },
    },
    {
      key: `P1:${l.id}`,
      task: { kind: "review", lexemeId: l.id, skill: "pinyin", code: "P1", round: 1 },
      lexemeId: l.id,
      rank: rank + spread,
      after: { key: `R1:${l.id}`, gap: 2 },
    },
  ];
  if (withHard) {
    slots.push({
      key: `R2:${l.id}`,
      task: { kind: "review", lexemeId: l.id, skill: "read", code: "R2", round: 2 },
      lexemeId: l.id,
      rank: rank + 2 * spread,
      after: { key: `P1:${l.id}`, gap: 3 },
    });
  }
  return slots;
}

function pairSlots(input: PlanInput, budget: number): { slots: Slot[]; cost: number; due: number } {
  const slots: Slot[] = [];
  let cost = 0;
  let due = 0;
  for (const p of input.pairs) {
    if (input.reviewedToday.has(p.id)) continue;
    const card = needsCard(p, input.now);
    const isDue = pairDue(p, input.now, input.retention);
    if (!card && !isDue) continue;
    due++;
    const tasks: PlanTask[] = card
      ? PAIR_BLOCK.map((code) =>
        code === "pair_card"
          ? { kind: "pair_card", pairId: p.id, code }
          : { kind: "pair", pairId: p.id, lexemeId: p.lexemeA, code }
      )
      : [{ kind: "pair", pairId: p.id, lexemeId: p.lexemeA, code: "X1" }];
    if (cost + tasks.length > budget) continue;
    cost += tasks.length;
    slots.push({ key: `pair:${p.id}`, task: tasks[0], lexemeId: null, rank: -1, block: tasks });
  }
  return { slots, cost, due };
}

export function buildSession(input: PlanInput): SessionPlan {
  const rand = rng(input.seed);
  const budget = sessionBudget(input.minutes, input.pace);
  const tomorrow = new Date(input.dayStart.getTime() + 2 * DAY_MS);
  const dueTomorrowBase = forecastDue(input, tomorrow);
  const started = startedToday(input);
  const quota = intakeQuota({ budget, dueTomorrow: dueTomorrowBase, maxNew: input.maxNew, startedToday: started });

  const reviewSlot = (d: Due, rank: number): Slot => {
    const st = input.states[d.lexemeId]?.[d.skill] ?? null;
    return {
      key: `${d.lexemeId}:${d.skill}`,
      task: { kind: "review", lexemeId: d.lexemeId, skill: d.skill, code: chooseFormat(d.skill, st, input.now) },
      lexemeId: d.lexemeId,
      rank,
    };
  };

  const finish = (
    slots: Slot[],
    folderMode: FolderMode | null,
    dueNow: number,
    newTaken: PlanLexeme[],
    reason: PlanReason,
    newQuota: number,
  ): SessionPlan => {
    const tasks = interleave(slots);
    return {
      mode: input.mode,
      folderMode,
      tasks,
      portions: portions(tasks.length),
      stats: {
        budget,
        dueNow,
        newQuota,
        newTaken: newTaken.length,
        reason,
        dueTomorrow: dueTomorrowBase + newTaken.length * newWordTomorrow(input.retention),
      },
    };
  };

  // ------------------------------------------------------------ «Сегодня»
  if (input.mode === "today") {
    const pairs = pairSlots(input, budget);
    const due = dueSkills(input, null);
    const room = budget - pairs.cost;
    const reviews = due.slice(0, Math.max(0, room)).map((d, i) => reviewSlot(d, i));
    const left = room - reviews.length;
    const dueNow = due.length + pairs.due;

    let reason: PlanReason = null;
    let fresh: PlanLexeme[] = [];
    const queue = newQueue(input, null);
    if (!queue.length) reason = "no_new_words";
    else if (dueNow > budget) reason = "debt";
    else if (quota === 0) reason = started > 0 ? "quota_spent" : "debt";
    else {
      // Новое слово стоит 3 задания в сессии: знакомство и два вспоминания.
      fresh = pickNew(input, queue, Math.min(quota, Math.floor(left / 3)), PER_FOLDER_NEW);
    }

    // Новые — вразбивку по первой половине: повторения важнее, а
    // вспоминанию нужны другие задания вокруг.
    const slots: Slot[] = [...pairs.slots, ...reviews];
    const span = Math.max(reviews.length, fresh.length * 3);
    fresh.forEach((l, i) => {
      slots.push(...newWordSlots(l, 1 + Math.floor((i * span) / (2 * Math.max(1, fresh.length))), false, 5));
    });
    return finish(slots, null, dueNow, fresh, reason, quota);
  }

  // --------------------------------------------------------------- папка
  const folder = input.folderId!;
  const due = dueSkills(input, folder);
  const queue = newQueue(input, folder);
  const folderMode: FolderMode = input.folderMode ?? (due.length ? "review" : queue.length ? "new" : "practice");

  if (folderMode === "review") {
    const slots = due.slice(0, budget).map((d, i) => reviewSlot(d, i));
    return finish(slots, folderMode, due.length, [], null, quota);
  }

  if (folderMode === "new") {
    // Раунд: 7 слов сверх квоты можно — решает пользователь, прогноз в ответе.
    const words = pickNew(input, queue, ROUND_SIZE, ROUND_SIZE);
    const slots: Slot[] = [];
    // Круги: все знакомства, затем лёгкие вспоминания, затем трудные.
    const spread = words.length + 2;
    words.forEach((l, i) => slots.push(...newWordSlots(l, i, true, spread)));
    // 2–3 знакомых слова из других папок — для перемешивания.
    const others = dueSkills(input, null).filter((d) => !words.some((w) => w.id === d.lexemeId));
    const mix = others.length ? others : input.lexemes
      .filter((l) => !l.folderIds.includes(folder) && input.states[l.id]?.read)
      .map((l) => ({ lexemeId: l.id, skill: "read" as const, priority: rand() }));
    for (const d of mix.slice(0, ROUND_MIXINS)) {
      slots.push(reviewSlot(d, Math.floor(rand() * Math.max(1, words.length * 3))));
    }
    return finish(slots, folderMode, due.length, words, words.length ? null : "no_new_words", quota);
  }

  // Практика: всё свежее. Досрочный верный ответ интервал почти не растит
  // (прирост ∝ e^(1−R) − 1), поэтому трудные форматы по словам папки безвредны.
  const practice = input.lexemes
    .filter((l) => l.folderIds.includes(folder) && input.states[l.id]?.read)
    .flatMap((l) => skillsOf(l).filter((s) => input.states[l.id]?.[s]).map((skill) => ({ l, skill })))
    .sort(() => rand() - 0.5)
    .slice(0, budget)
    .map(({ l, skill }, i): Slot => ({
      key: `${l.id}:${skill}`,
      task: { kind: "review", lexemeId: l.id, skill, code: HARD[skill] },
      lexemeId: l.id,
      rank: i,
    }));
  return finish(practice, folderMode, 0, [], null, quota);
}
