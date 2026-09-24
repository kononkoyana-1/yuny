/**
 * Что меняет один ответ (#61): навык и перенос, пары путаницы, стадия слова.
 * Чистая функция — чтение из базы и запись делает `review-submit`, здесь
 * только решение. Модель — docs/learning/vocabulary-engine.md, разделы 4–5.
 */
import { MODEL, type Rating, type Skill } from "./config.ts";
import type { Classified, WordKey } from "./classify.ts";
import {
  formatWeight,
  gradeRating,
  implicitReview,
  initialDifficulty,
  type MemoryState,
  retrievabilityAt,
  review,
  type Stage,
  wordStage,
} from "./memory.ts";
import { canonicalPair, cappedDue, needsIntervention, type PairState, reviewPair, startPair } from "./pair.ts";
import { parsePinyin } from "./pinyin.ts";
import type { Ticket } from "./ticket.ts";

/** Строка `skill_states`. */
export interface StoredSkill extends MemoryState {
  contextsPassed: number;
  unlockedAt: Date;
}

/** Строка `confusion_pairs`. */
export interface StoredPair extends PairState {
  id: string;
  a: WordKey;
  b: WordKey;
  lexemeA: string | null;
  lexemeB: string | null;
}

export interface SubmitLexeme {
  id: string;
  headword: string;
  reading: string | null;
  goal: "full" | "read_only";
  hskLevel: number | null;
}

export interface SubmitInput {
  now: Date;
  ticket: Ticket;
  classified: Classified;
  /** Слово задания; `null` — лексемы нет (удалили) или задание только на пару. */
  lexeme: SubmitLexeme | null;
  skills: Partial<Record<Skill, StoredSkill>>;
  /** Пары со словом задания (любого статуса) и пара из билета. */
  pairs: StoredPair[];
  /** Когда за окно уже путали слово задания с `classified.partner` — без этого ответа. */
  partnerConfusions: Date[];
  /** Лексема партнёра, если слово есть в словаре. */
  partnerLexemeId: string | null;
  retention: number;
}

/** `repsBefore: null` — строки не было; иначе запись только если `reps` не изменился. */
export interface SkillWrite {
  skill: Skill;
  repsBefore: number | null;
  state: StoredSkill;
}

/** `id: null` — новая пара; `state: null` — статус и память не трогаем, только счётчики. */
export interface PairWrite {
  id: string | null;
  a: WordKey;
  b: WordKey;
  lexemeA: string | null;
  lexemeB: string | null;
  incAB: number;
  incBA: number;
  confusedAt: Date | null;
  state: PairState | null;
}

export interface SubmitPlan {
  rating: Rating | null;
  /** Навык, который обновил ответ (для журнала); у пары и знакомства — `null`. */
  skill: Skill | null;
  before: { r: number; s: number; d: number } | null;
  after: { s: number; d: number } | null;
  skillWrites: SkillWrite[];
  pairWrites: PairWrite[];
  /** Пара события в журнале: уже известная по id или одна из `pairWrites`. */
  eventPairId: string | null;
  eventPairWrite: number | null;
  /** Пора контрастная карточка — индекс в `pairWrites`. */
  interventionWrite: number | null;
  stage: Stage | null;
}

const CONFUSIONS = new Set(["confusion", "form_similar", "homophone"]);

const sameWord = (a: WordKey, b: WordKey) => a.headword === b.headword && (a.reading ?? "") === (b.reading ?? "");

const involves = (p: StoredPair, lexemeId: string) => p.lexemeA === lexemeId || p.lexemeB === lexemeId;

export function planSubmit(input: SubmitInput): SubmitPlan {
  const { now, ticket, classified, lexeme } = input;
  const grade = classified.grade;
  const code = ticket.exercise;
  const isPairTask = code === "X1" || code === "X2" || code === "X3";
  const weight = code === "intro" ? 0 : formatWeight(code);

  const skills: Partial<Record<Skill, StoredSkill>> = { ...input.skills };
  const skillWrites = new Map<Skill, SkillWrite>();
  const put = (skill: Skill, state: StoredSkill) => {
    const prev = input.skills[skill];
    skillWrites.set(skill, { skill, repsBefore: prev ? prev.reps : null, state });
    skills[skill] = state;
  };

  const pairs = new Map(input.pairs.map((p) => [p.id, { ...p }]));
  const pairWrites: PairWrite[] = [];
  const writePair = (p: StoredPair, state: PairState) => {
    pairs.set(p.id, { ...p, ...state });
    return pairWrites.push({
      id: p.id,
      a: p.a,
      b: p.b,
      lexemeA: p.lexemeA,
      lexemeB: p.lexemeB,
      incAB: 0,
      incBA: 0,
      confusedAt: null,
      state,
    }) - 1;
  };

  // ------------------------------------------------------------ навык
  let skill: Skill | null = null;
  let before: SubmitPlan["before"] = null;
  let after: SubmitPlan["after"] = null;

  if (grade && lexeme && !isPairTask && code !== "intro") {
    skill = MODEL.formatSkill[code];
    const prev = input.skills[skill] ?? null;
    const hasConfusable = input.pairs.some((p) => p.status !== "resolved" && involves(p, lexeme.id));
    const next = review(prev, grade, {
      now,
      weight,
      retention: input.retention,
      initialDifficulty: prev?.difficulty ?? initialDifficulty(skill, {
        hskLevel: lexeme.hskLevel,
        strokes: null,
        hasConfusable,
        syllables: (lexeme.reading && parsePinyin(lexeme.reading)?.length) || [...lexeme.headword].length,
      }),
    });
    const usedInContext = skill === "use" && grade.kind === "success";
    put(skill, {
      ...next,
      contextsPassed: (prev?.contextsPassed ?? 0) + (usedInContext ? 1 : 0),
      unlockedAt: prev?.unlockedAt ?? now,
    });
    before = prev ? { r: retrievabilityAt(prev, now), s: prev.stability, d: prev.difficulty } : null;
    after = { s: next.stability, d: next.difficulty };

    // Успех в предложении — ещё и слабое повторение «Читаю» и «Пиньинь».
    if (usedInContext) {
      for (const k of ["read", "pinyin"] as const) {
        const p = input.skills[k];
        const n = p ? implicitReview(p, now, input.retention) : null;
        if (p && n) put(k, { ...n, contextsPassed: p.contextsPassed, unlockedAt: p.unlockedAt });
      }
    }
  }

  // ------------------------------------------------------------ пары
  let eventPairId: string | null = null;
  let eventPairWrite: number | null = null;
  let interventionWrite: number | null = null;

  if (isPairTask && ticket.pair_id) {
    // Задание на пару. Пока пара `pending`, идёт блок различения — его итог
    // считает `pairStart`; здесь только журнал.
    eventPairId = ticket.pair_id;
    const p = pairs.get(ticket.pair_id);
    if (p && grade && p.memory && p.status !== "pending") {
      writePair(p, reviewPair(p, classified.outcome === "ok", weight, now));
    }
  }

  const partner = classified.partner;
  if (!isPairTask && lexeme && partner && CONFUSIONS.has(classified.outcome) && !sameWord(partner, ticket.target)) {
    const [a, b] = canonicalPair(ticket.target, partner);
    const targetIsA = sameWord(a, ticket.target);
    const existing = [...pairs.values()].find((p) => sameWord(p.a, a) && sameWord(p.b, b)) ?? null;
    // Пара уже в расписании (или решена) — это её провал: интервалы снова держит она.
    const state = existing?.memory && existing.status !== "pending"
      ? reviewPair(existing, false, weight, now)
      : null;
    if (existing && state) pairs.set(existing.id, { ...existing, ...state });
    eventPairWrite = pairWrites.push({
      id: existing?.id ?? null,
      a,
      b,
      lexemeA: existing?.lexemeA ?? (targetIsA ? lexeme.id : input.partnerLexemeId),
      lexemeB: existing?.lexemeB ?? (targetIsA ? input.partnerLexemeId : lexeme.id),
      // count_ab — «вместо A ответили B».
      incAB: targetIsA ? 1 : 0,
      incBA: targetIsA ? 0 : 1,
      confusedAt: now,
      state,
    }) - 1;
    if ((!existing || existing.status === "pending") && needsIntervention([...input.partnerConfusions, now], now)) {
      interventionWrite = eventPairWrite;
    }
  }

  // Пара проверена внутри обычного задания: партнёр был среди вариантов, выбран верный.
  if (!isPairTask && lexeme && grade && classified.outcome === "ok" && ticket.options) {
    for (const p of [...pairs.values()]) {
      if (!p.memory || (p.status !== "active" && p.status !== "watch")) continue;
      const other = sameWord(p.a, ticket.target) ? p.b : sameWord(p.b, ticket.target) ? p.a : null;
      if (other && ticket.options.some((o) => sameWord(o, other))) {
        writePair(p, reviewPair(p, true, weight, now));
      }
    }
  }

  // Пока пара `active` и слабая, интервалы её слов не растут дальше её срока.
  if (lexeme) {
    const own = [...pairs.values()].filter((p) => involves(p, lexeme.id));
    for (const w of skillWrites.values()) {
      for (const p of own) w.state = { ...w.state, due: cappedDue(w.state.due, p) };
      skills[w.skill] = w.state;
    }
  }

  const stage = lexeme
    ? wordStage(skills, {
      now,
      goal: lexeme.goal,
      activePair: [...pairs.values()].some((p) => p.status === "active" && involves(p, lexeme.id)),
    })
    : null;

  return {
    rating: grade ? gradeRating(grade) : null,
    skill,
    before,
    after,
    skillWrites: [...skillWrites.values()],
    pairWrites,
    eventPairId,
    eventPairWrite,
    interventionWrite,
    stage,
  };
}

/**
 * Итог блока различения после контрастной карточки: пара уходит в
 * расписание. Считает по ответам на задания пары в этой сессии, которые уже
 * в журнале, — клиенту на слово не верим. Пара уже не `pending` — ничего.
 */
export function planPairStart(pair: StoredPair, answers: { ok: boolean }[], now: Date): PairWrite | null {
  if (pair.status !== "pending" || answers.length === 0) return null;
  return {
    id: pair.id,
    a: pair.a,
    b: pair.b,
    lexemeA: pair.lexemeA,
    lexemeB: pair.lexemeB,
    incAB: 0,
    incBA: 0,
    confusedAt: null,
    state: startPair(answers.filter((x) => x.ok).length, answers.length, now),
  };
}
