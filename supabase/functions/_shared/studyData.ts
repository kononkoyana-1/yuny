/**
 * Чтение учебного состояния для `session-build` и `review-submit` (#61, #63):
 * слова в папках, память, пары, кандидаты в варианты, выпуск билетов.
 * Решения — в `_shared/learning/` (чистые функции), здесь только база.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.112.4";
import {
  type Built,
  type Candidate,
  type CharEntry,
  type ExerciseBody,
  type PlanLexeme,
  type PlanPair,
  type Skill,
  type StoredSkill,
  signTicket,
  type StudyWord,
  TICKET_TTL_MS,
} from "./learning/mod.ts";

// deno-lint-ignore no-explicit-any
export type Row = Record<string, any>;

export function must<T>(res: { data: T; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data;
}

const toDate = (v: string | null) => (v ? new Date(v) : null);

export function toSkill(r: Row): StoredSkill {
  return {
    stability: r.stability,
    difficulty: r.difficulty,
    lastReview: toDate(r.last_review),
    due: new Date(r.due),
    reps: r.reps,
    lapses: r.lapses,
    contextsPassed: r.contexts_passed,
    unlockedAt: new Date(r.unlocked_at),
  };
}

export function toPair(r: Row): PlanPair {
  return {
    id: r.id,
    a: { headword: r.headword_a, reading: r.reading_a },
    b: { headword: r.headword_b, reading: r.reading_b },
    lexemeA: r.lexeme_a,
    lexemeB: r.lexeme_b,
    status: r.status,
    resolveStreak: r.resolve_streak,
    memory: r.stability == null ? null : {
      stability: r.stability,
      difficulty: r.difficulty,
      lastReview: toDate(r.last_review),
      due: new Date(r.due),
      reps: 0,
      lapses: 0,
    },
    confusions: (r.count_ab ?? 0) + (r.count_ba ?? 0),
    lastConfusedAt: toDate(r.last_confused_at),
  };
}

export function secret(): string {
  const s = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!s) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return s;
}

/** Первое русское значение из короткого списка статьи. */
export function russianGloss(compact: string[] | null | undefined): string | null {
  return (compact ?? []).find((c) => /[А-Яа-яЁё]/.test(c)) ?? null;
}

export interface StudyLexeme extends PlanLexeme {
  translation: string | null;
}

/** Слова, лежащие хотя бы в одной папке, с их папками и переводом. */
export async function loadLexemes(admin: SupabaseClient, userId: string): Promise<StudyLexeme[]> {
  const rows = must(
    await admin.from("learning_lexemes")
      .select(
        "id, headword, reading, goal, translation, created_at, dictionary_entries(hsk_level, compact), user_dictionary_items(folder_id, created_at)",
      )
      .eq("user_id", userId)
      .limit(20_000),
  ) as Row[];
  return rows
    .filter((r) => (r.user_dictionary_items ?? []).length > 0)
    .map((r) => {
      const items = [...r.user_dictionary_items].sort((a: Row, b: Row) => a.created_at.localeCompare(b.created_at));
      return {
        id: r.id,
        headword: r.headword,
        reading: r.reading,
        goal: r.goal,
        hskLevel: r.dictionary_entries?.hsk_level ?? null,
        translation: r.translation ?? russianGloss(r.dictionary_entries?.compact),
        folderIds: items.map((i: Row) => i.folder_id),
        addedAt: new Date(items[0].created_at),
      };
    });
}

export async function loadStates(
  admin: SupabaseClient,
  userId: string,
): Promise<Record<string, Partial<Record<Skill, StoredSkill>>>> {
  const rows = must(await admin.from("skill_states").select("*").eq("user_id", userId).limit(50_000)) as Row[];
  const out: Record<string, Partial<Record<Skill, StoredSkill>>> = {};
  for (const r of rows) (out[r.lexeme_id] ??= {})[r.skill as Skill] = toSkill(r);
  return out;
}

export async function loadPairs(admin: SupabaseClient, userId: string): Promise<PlanPair[]> {
  const rows = must(
    await admin.from("confusion_pairs").select("*").eq("user_id", userId).neq("status", "resolved"),
  ) as Row[];
  return rows.map(toPair);
}

/** Кандидаты в варианты для слова (`learning_distractor_pool`). */
export async function loadPool(
  admin: SupabaseClient,
  userId: string,
  word: { headword: string; reading: string | null },
  hsk: number | null,
): Promise<Candidate[]> {
  const rows = must(
    await admin.rpc("learning_distractor_pool", {
      p_user: userId,
      p_headword: word.headword,
      p_reading: word.reading,
      p_hsk: hsk,
      p_limit: 12,
    }),
  ) as Row[];
  return rows.map((r) => ({ headword: r.headword, reading: r.reading, gloss: r.gloss, source: r.source }));
}

/** Статьи словаря на отдельные знаки — для заметок о знаках в знакомстве (#88). */
export async function loadCharEntries(admin: SupabaseClient, headwords: string[]): Promise<CharEntry[]> {
  const chars = [...new Set(headwords.flatMap((h) => [...h]))].filter((c) => /\p{Script=Han}/u.test(c));
  if (!chars.length) return [];
  const rows = must(
    await admin.from("dictionary_entries").select("headword, reading, compact, senses").in("headword", chars),
  ) as Row[];
  return rows.map((r) => ({ headword: r.headword, reading: r.reading, compact: r.compact ?? [], senses: r.senses ?? [] }));
}

/** Слова пользователя (в папках), где есть знаки этого слова: «уже есть в ваших словах». */
export async function loadWordsWithChars(
  admin: SupabaseClient,
  userId: string,
  headword: string,
): Promise<{ headword: string; reading: string | null }[]> {
  const chars = [...new Set(headword)].filter((c) => /\p{Script=Han}/u.test(c));
  if (!chars.length) return [];
  const rows = must(
    await admin.from("learning_lexemes").select("headword, reading, user_dictionary_items!inner(id)")
      .eq("user_id", userId).or(chars.map((c) => `headword.like.*${c}*`).join(",")).limit(200),
  ) as Row[];
  return rows.map((r) => ({ headword: r.headword, reading: r.reading }));
}

/** Слово для задания. */
export function studyWord(l: StudyLexeme): StudyWord {
  return { lexemeId: l.id, headword: l.headword, reading: l.reading, translation: l.translation };
}

/** Задание для клиента: тело + подписанный билет в `task_id`. */
export async function issue(
  built: Built,
  userId: string,
  sessionId: string,
  portion: number,
): Promise<ExerciseBody & { task_id: string; portion: number }> {
  const token = await signTicket(
    { v: 1, uid: userId, session_id: sessionId, exp: Date.now() + TICKET_TTL_MS, ...built.ticket },
    secret(),
  );
  return { task_id: token, portion, ...built.body };
}
