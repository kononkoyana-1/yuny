/**
 * Разбор материала в модуль (TZ.md §7): один вызов Gemini на модуль, строгая
 * JSON-схема, затем сверка слов со словарём БКРС и списком HSK.
 *
 * Зовут отсюда две функции: `module-create` — сразу после загрузки, и
 * `module-parse` — повторно, если прошлый разбор упал не по вине материала.
 *
 * Два исхода неудачи устроены по-разному (см. миграцию `modules`):
 *   * материал не учебный или слишком длинный — модуль удаляется вместе с
 *     файлами, в базе не остаётся ни строки (TZ.md §6);
 *   * упал сам разбор — модуль остаётся в статусе `failed` с файлами, и его
 *     можно разобрать заново без повторной загрузки.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.112.4";
import { type AiPart, aiJson, aiUploadFile, HandlerError, objectSchema } from "./shared.ts";
import { docxText, LIMITS, materialKind, pdfPageCount, splitInline } from "./materials.ts";
import { batchWords } from "./lessons.ts";

const BUCKET = "materials";

/**
 * Потолки на выдачу Gemini. В схеме они записаны как maxItems, но шлюз его
 * отбрасывает (см. GEMINI_SCHEMA_KEYS в shared.ts), так что держит их код.
 */
export const MAX_WORDS = 200;
const MAX_GRAMMAR = 20;
const MAX_TITLE = 40;

// ------------------------------------------------------------------ схема

/** Ответ разбора — ровно TZ.md §7. */
export interface ParsedMaterial {
  is_language_material: boolean;
  title: string;
  topic: string;
  context: string;
  vocabulary: { word: string; reading: string; meaning_ru: string; sense_hint: string }[];
  grammar: { point: string; explanation: string; examples: string[] }[];
}

const PARSE_SCHEMA = objectSchema(
  {
    is_language_material: {
      type: "boolean",
      description: "true, только если это материал для изучения китайского языка",
    },
    // Длину названия держат промпт и shortTitle().
    title: { type: "string" },
    topic: { type: "string" },
    context: { type: "string" },
    vocabulary: {
      type: "array",
      maxItems: MAX_WORDS,
      items: objectSchema(
        {
          word: { type: "string" },
          reading: { type: "string" },
          meaning_ru: { type: "string" },
          sense_hint: { type: "string" },
        },
        ["word", "reading", "meaning_ru", "sense_hint"],
      ),
    },
    grammar: {
      type: "array",
      maxItems: MAX_GRAMMAR,
      items: objectSchema(
        {
          point: { type: "string" },
          explanation: { type: "string" },
          examples: { type: "array", items: { type: "string" } },
        },
        ["point", "explanation", "examples"],
      ),
    },
  },
  ["is_language_material", "title", "topic", "context", "vocabulary", "grammar"],
);

const SYSTEM = `Ты разбираешь учебный материал по китайскому языку для ученика, чей родной язык — русский. Материал принёс сам ученик: страница учебника, распечатка с урока, конспект или домашнее задание. Несколько файлов — это части одного материала, в том порядке, в каком они даны.

Правила разбора:

1. is_language_material — true, только если это действительно материал для изучения китайского языка. Фото чего угодно другого, пустой лист, нечитаемый снимок, текст не про китайский язык — false. При false остальные поля оставь пустыми: пустые строки и пустые списки.

2. title — короткое название материала по-русски, до ${MAX_TITLE} символов. Оно подписывает модуль на главном экране: «Урок 5. В магазине», «Числа и счёт», «Домашнее задание: 把».

3. topic — тема урока, если она видна в материале. Не видна — пустая строка, не придумывай.

4. context — два-три предложения по-русски: о чём материал и чему он учит.

5. vocabulary — слова из ЗАДАНИЙ материала, а не из всего текста подряд. Если в материале есть список новых слов, упражнения, вопросы — слова берутся оттуда. Служебные слова и то, что ученик уровня этого материала заведомо знает, не нужны. Каждое слово один раз.
   - word — слово иероглифами, как в материале;
   - reading — пиньинь с тонами;
   - meaning_ru — значение по-русски ИМЕННО в том смысле, в каком слово употреблено в материале;
   - sense_hint — обязательно: короткая фраза по-русски о том, как слово употреблено в материале. По ней из словаря будут выбирать правильное значение, поэтому она должна отличать это употребление от других значений слова.

6. grammar — грамматика урока, только если она в материале действительно есть: правило, конструкция, упражнение на неё. Нет грамматики — пустой список, это нормальный результат, выдумывать нечего. Для каждого пункта: point — название конструкции, explanation — объяснение по-русски, examples — примеры из материала.`;

// ---------------------------------------------------------- чистые функции

const HANZI = /[一-鿿]/;

export interface VocabularyRow {
  position: number;
  word: string;
  reading: string | null;
  meaning_ru: string;
  sense_hint: string;
}

/**
 * Слова из ответа Gemini к виду для базы. Модель следует схеме, но не
 * обещает, что в `word` окажутся иероглифы и что слово не повторится, —
 * а у таблицы ключ `(module_id, word)`, и повтор уронил бы всю запись.
 */
export function normalizeVocabulary(raw: ParsedMaterial["vocabulary"]): VocabularyRow[] {
  const seen = new Set<string>();
  const rows: VocabularyRow[] = [];
  for (const item of raw) {
    if (rows.length === MAX_WORDS) break;
    const word = item.word.trim();
    const meaning = item.meaning_ru.trim();
    if (!HANZI.test(word) || !meaning || seen.has(word)) continue;
    seen.add(word);
    rows.push({
      position: rows.length + 1,
      word,
      reading: item.reading.trim() || null,
      meaning_ru: meaning,
      // sense_hint обязателен (TZ.md §7). Если модель его пропустила,
      // значение из материала — лучшая подсказка, какая у нас есть.
      sense_hint: item.sense_hint.trim() || meaning,
    });
  }
  return rows;
}

/** Пиньинь без тонов — то же правило, что у `public.dict_pinyin_plain`. */
export function pinyinPlain(reading: string): string {
  return reading.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z]/g, "")
    .toLowerCase();
}

export interface DictionaryCandidate {
  id: number;
  headword: string;
  reading: string | null;
}

/** Пиньинь с тонами, но без пробелов и апострофов: «hàn zì» = «hànzì». */
function pinyinToned(reading: string): string {
  return reading.normalize("NFC").toLowerCase().replace(/[\s'’·-]/g, "");
}

/**
 * Какая статья словаря — то самое слово из материала. У многих знаков
 * несколько статей с разными чтениями (行 — xíng и háng), и выбирать надо по
 * чтению, которое дал разбор.
 *
 * Сначала сравниваем с тонами: без них dá и dà — одно и то же, и 打 уехало бы
 * в статью 大. Без тонов — только если с тонами не нашлось (разбор иногда
 * отдаёт чтение без них). Не нашлось никак — первая статья: лучше слово со
 * словарём, чем без него.
 */
export function pickEntry(
  candidates: DictionaryCandidate[],
  reading: string | null,
): DictionaryCandidate | null {
  if (candidates.length === 0) return null;
  if (reading) {
    for (const normalize of [pinyinToned, pinyinPlain]) {
      const wanted = normalize(reading);
      const match = candidates.find((c) =>
        c.reading !== null && c.reading.split(/[,;]/).some((r) => normalize(r) === wanted)
      );
      if (match) return match;
    }
  }
  return candidates[0];
}

/** Название для кружка: обрезаем по границе слова, а не посреди него. */
export function shortTitle(title: string): string {
  const clean = title.trim().replace(/\s+/g, " ");
  if (clean.length <= MAX_TITLE) return clean;
  const cut = clean.slice(0, MAX_TITLE);
  const space = cut.lastIndexOf(" ");
  return (space > MAX_TITLE / 2 ? cut.slice(0, space) : cut).trimEnd() + "…";
}

// ------------------------------------------------------------------ разбор

export interface MaterialRow {
  storage_path: string;
  filename: string;
  mime_type: string;
  position: number;
}

/** Материал не годится для модуля — удаляем модуль и файлы, повторять нечего. */
export class RejectedMaterial extends HandlerError {
  constructor(code: string) {
    super(code, 422);
  }
}

export async function parseModule(
  admin: SupabaseClient,
  userId: string,
  moduleId: string,
): Promise<{ module_id: string; vocabulary_count: number; grammar_count: number }> {
  const { data: materials, error } = await admin
    .from("module_materials")
    .select("storage_path, filename, mime_type, position")
    .eq("module_id", moduleId)
    .eq("user_id", userId)
    .order("position");
  if (error || !materials || materials.length === 0) {
    throw new HandlerError("module_not_found", 404);
  }

  try {
    const parts = await materialParts(admin, materials as MaterialRow[]);
    const parsed = await aiJson<ParsedMaterial>({
      name: "parse_material",
      description: "Разбери учебный материал по китайскому языку в слова и грамматику",
      schema: PARSE_SCHEMA,
      system: SYSTEM,
      prompt: parts,
      maxTokens: 16000,
    });

    const vocabulary = normalizeVocabulary(parsed.vocabulary ?? []);
    // Слов нет — значит, и заданий не из чего делать: для модуля это тот же
    // неучебный материал, что и явное `false`.
    if (!parsed.is_language_material || vocabulary.length === 0) {
      throw new RejectedMaterial("not_language_material");
    }

    const linked = await linkDictionary(admin, vocabulary);
    const grammar = (parsed.grammar ?? [])
      .filter((g) => g.point.trim() && g.explanation.trim())
      .slice(0, MAX_GRAMMAR)
      .map((g, i) => ({
        module_id: moduleId,
        user_id: userId,
        position: i + 1,
        point: g.point.trim(),
        explanation: g.explanation.trim(),
        examples: (g.examples ?? []).map((e) => e.trim()).filter(Boolean),
      }));

    // Повторный разбор начинает с чистого листа: прошлая попытка могла успеть
    // записать часть слов или уроков, прежде чем упасть.
    await admin.from("lessons").delete().eq("module_id", moduleId);
    await admin.from("module_vocabulary").delete().eq("module_id", moduleId);
    await admin.from("module_grammar").delete().eq("module_id", moduleId);

    const { data: inserted, error: vocabError } = await admin
      .from("module_vocabulary")
      .insert(linked.map((row) => ({ ...row, module_id: moduleId, user_id: userId })))
      .select("id, position");
    if (vocabError || !inserted) throw vocabError ?? new HandlerError("internal_error", 500);
    if (grammar.length > 0) {
      const { error: grammarError } = await admin.from("module_grammar").insert(grammar);
      if (grammarError) throw grammarError;
    }

    // Уроки первого комплекта — пачками слов в порядке материала. Задания к
    // ним делает `lesson-generate`, до тех пор урок в статусе `pending`.
    const ordered = [...inserted].sort((a, b) => a.position - b.position).map((v) => v.id);
    const { error: lessonsError } = await admin.from("lessons").insert(
      batchWords(ordered).map((ids, index) => ({
        module_id: moduleId,
        user_id: userId,
        generation: 1,
        position: index + 1,
        vocabulary_ids: ids,
      })),
    );
    if (lessonsError) throw lessonsError;

    const { error: moduleError } = await admin
      .from("modules")
      .update({
        status: "ready",
        title: shortTitle(parsed.title) || "Материал",
        topic: parsed.topic.trim() || null,
        context: parsed.context.trim() || null,
        error_code: null,
      })
      .eq("id", moduleId);
    if (moduleError) throw moduleError;

    return { module_id: moduleId, vocabulary_count: linked.length, grammar_count: grammar.length };
  } catch (error) {
    if (error instanceof RejectedMaterial) {
      await discardModule(admin, moduleId, materials as MaterialRow[]);
      throw error;
    }
    const code = error instanceof HandlerError ? error.code : "internal_error";
    await admin.from("modules").update({ status: "failed", error_code: code }).eq("id", moduleId);
    throw error;
  }
}

/** Файлы материала — в части запроса к Gemini, в порядке частей материала. */
export async function materialParts(admin: SupabaseClient, materials: MaterialRow[]): Promise<AiPart[]> {
  const files: { row: MaterialRow; bytes: Uint8Array<ArrayBuffer> }[] = [];
  const texts = new Map<number, string>();

  for (const row of materials) {
    const { data, error } = await admin.storage.from(BUCKET).download(row.storage_path);
    if (error || !data) throw new HandlerError("file_missing", 404);
    const bytes = new Uint8Array(await data.arrayBuffer());
    const kind = materialKind(row.mime_type);

    if (kind === "pdf" && pdfPageCount(bytes) > LIMITS.pdfMaxPages) {
      throw new RejectedMaterial("pdf_too_many_pages");
    }
    if (kind === "docx") {
      const text = docxText(bytes);
      // DOCX, который не открылся, — не повод гонять Gemini вхолостую.
      if (!text) throw new RejectedMaterial("not_language_material");
      texts.set(row.position, text);
      continue;
    }
    files.push({ row, bytes });
  }

  const { upload } = splitInline(files);
  const uploaded = new Map<number, AiPart>();
  for (const file of upload) {
    uploaded.set(
      file.row.position,
      await aiUploadFile(file.bytes, file.row.mime_type, file.row.filename),
    );
  }

  const parts: AiPart[] = [];
  for (const row of materials) {
    parts.push({ text: `Часть ${row.position} из ${materials.length}: «${row.filename}».` });
    const text = texts.get(row.position);
    if (text !== undefined) {
      parts.push({ text });
      continue;
    }
    const file = files.find((f) => f.row.position === row.position)!;
    parts.push(
      uploaded.get(row.position) ??
        { inlineData: { mimeType: row.mime_type, data: toBase64(file.bytes) } },
    );
  }
  return parts;
}

/** `dictionary_entry_id` и `hsk_level` для слов — одним запросом на каждую таблицу. */
async function linkDictionary(admin: SupabaseClient, rows: VocabularyRow[]) {
  const words = rows.map((r) => r.word);

  const [{ data: entries }, { data: hsk }] = await Promise.all([
    admin.from("dictionary_entries").select("id, headword, reading").in("headword", words),
    admin.from("hsk_words").select("word, level").in("word", words),
  ]);

  const byWord = new Map<string, DictionaryCandidate[]>();
  for (const entry of (entries ?? []) as DictionaryCandidate[]) {
    const list = byWord.get(entry.headword) ?? [];
    list.push(entry);
    byWord.set(entry.headword, list);
  }
  // Девять слов HSK входят в два уровня — берём меньший, как и словарь.
  const levels = new Map<string, number>();
  for (const { word, level } of (hsk ?? []) as { word: string; level: number }[]) {
    levels.set(word, Math.min(levels.get(word) ?? level, level));
  }

  return rows.map((row) => ({
    ...row,
    dictionary_entry_id: pickEntry(byWord.get(row.word) ?? [], row.reading)?.id ?? null,
    hsk_level: levels.get(row.word) ?? null,
  }));
}

/** Модуль и его файлы — целиком, чтобы после неучебного материала не осталось мусора. */
async function discardModule(admin: SupabaseClient, moduleId: string, materials: MaterialRow[]) {
  await admin.storage.from(BUCKET).remove(materials.map((m) => m.storage_path));
  await admin.from("modules").delete().eq("id", moduleId);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
