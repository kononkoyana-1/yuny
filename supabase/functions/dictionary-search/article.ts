/**
 * `dictionary-search`, `action: "article"` — всё, что статье в листе нужно
 * сверх самой выдачи (словарь 2.0, #75): статья по заголовку и чтению, уровень
 * HSK (#80), состав слова (#79) и, у знака, слова с ним (#84). Отдельный
 * запрос при открытии статьи, а не поле каждой строки выдачи: статьи знаков и
 * слова пользователя на 20 строк выдачи стоили бы дороже самой выдачи.
 *
 * Решения — в `_shared/dictionaryArticle.ts` (тесты); здесь только база.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.112.4";
import { HandlerError, optionalString, requireString } from "../_shared/shared.ts";
import {
  CHAR_WORDS_LIMIT,
  charWords,
  composition,
  hskLevelOf,
  type OwnWordRow,
} from "../_shared/dictionaryArticle.ts";
import { loadCharEntries, loadPairs, must, type Row, russianGloss, toSkill } from "../_shared/studyData.ts";
import { type Skill, stageOf, type StoredSkill } from "../_shared/learning/mod.ts";

const HAN = /\p{Script=Han}/u;
/** Заголовки словаря — до четырёх знаков; длиннее запрос не нужен. */
const MAX_HEADWORD = 16;

interface EntryRow {
  id: number;
  headword: string;
  reading: string | null;
  senses: unknown;
  compact: string[] | null;
  hsk_level: number | null;
}

/** Статья с этим чтением; нет такой — первая по уровню HSK (у слова из папки чтение могло быть собрано). */
async function loadEntry(admin: SupabaseClient, headword: string, reading: string | null): Promise<EntryRow | null> {
  const rows = must(
    await admin.from("dictionary_entries").select("id, headword, reading, senses, compact, hsk_level")
      .eq("headword", headword).order("hsk_level", { ascending: true, nullsFirst: false }).order("id").limit(10),
  ) as EntryRow[];
  return rows.find((r) => (r.reading ?? null) === reading) ?? rows[0] ?? null;
}

async function hskListLevels(admin: SupabaseClient, headword: string): Promise<number[]> {
  const rows = must(await admin.from("hsk_words").select("level").eq("word", headword)) as Row[];
  return rows.map((r) => Number(r.level));
}

/**
 * Слова пользователя (в папках) со знаком и их стадии — сначала в графе (#84).
 * Стадия — как на карте папки (`stageOf`), по навыкам только этих слов.
 */
async function ownWordsWith(admin: SupabaseClient, userId: string, char: string): Promise<OwnWordRow[]> {
  const rows = must(
    await admin.from("learning_lexemes")
      .select("id, headword, reading, goal, translation, dictionary_entries(hsk_level, compact), user_dictionary_items!inner(id)")
      .eq("user_id", userId).like("headword", `%${char}%`).limit(200),
  ) as Row[];
  const words = rows.filter((r) => r.headword !== char && [...(r.headword as string)].length <= 4);
  if (!words.length) return [];
  const [stateRows, pairs] = await Promise.all([
    admin.from("skill_states").select("*").eq("user_id", userId).in("lexeme_id", words.map((w) => w.id)),
    loadPairs(admin, userId),
  ]);
  const states: Record<string, Partial<Record<Skill, StoredSkill>>> = {};
  for (const r of must(stateRows) as Row[]) (states[r.lexeme_id] ??= {})[r.skill as Skill] = toSkill(r);
  const now = new Date();
  return words.map((w) => ({
    headword: w.headword,
    reading: w.reading,
    gloss: w.translation ?? russianGloss(w.dictionary_entries?.compact),
    hsk_level: w.dictionary_entries?.hsk_level ?? null,
    stage: stageOf({ states, pairs, now }, {
      id: w.id,
      headword: w.headword,
      reading: w.reading,
      goal: w.goal,
      hskLevel: null,
      folderIds: [],
      addedAt: now,
    }),
  }));
}

export async function article(admin: SupabaseClient, userId: string, body: Record<string, unknown>) {
  const headword = requireString(body, "headword");
  if (headword.length > MAX_HEADWORD) throw new HandlerError("invalid_request", 400);
  const reading = optionalString(body, "reading");

  const entry = await loadEntry(admin, headword, reading);
  const wordReading = reading ?? entry?.reading ?? null;
  const chars = [...headword].filter((c) => HAN.test(c));
  const single = chars.length === 1 && [...headword].length === 1;

  const [levels, charEntries, own, dict] = await Promise.all([
    entry?.hsk_level ? Promise.resolve([]) : hskListLevels(admin, headword),
    chars.length >= 2 ? loadCharEntries(admin, [headword]) : Promise.resolve([]),
    single ? ownWordsWith(admin, userId, headword) : Promise.resolve([]),
    single
      ? admin.rpc("dictionary_char_words", { p_char: headword, p_limit: CHAR_WORDS_LIMIT }).then((res) => {
        // Нет функции или индекса (миграция ещё не прошла) — статья без графа, а не ошибка.
        if (res.error) console.warn("char_words_failed", res.error.message);
        return (res.data ?? []) as Row[];
      })
      : Promise.resolve([]),
  ]);

  return {
    headword,
    reading: wordReading,
    entry: entry
      ? {
        id: entry.id,
        headword: entry.headword,
        reading: entry.reading,
        senses: entry.senses ?? [],
        compact: entry.compact ?? [],
      }
      : null,
    hsk_level: hskLevelOf(entry?.hsk_level, levels),
    composition: composition(headword, wordReading, charEntries),
    char_words: single
      ? charWords(
        headword,
        own,
        dict.map((r) => ({ headword: r.headword, reading: r.reading, gloss: r.gloss, hsk_level: r.hsk_level })),
      )
      : null,
  };
}
