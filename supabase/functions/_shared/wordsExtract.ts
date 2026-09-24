/**
 * Слова из загруженного файла — для своего словаря, без модуля и заданий.
 * Один вызов Gemini на загрузку, затем сверка каждого слова со словарём БКРС.
 *
 * Перевод слова берётся так:
 *   * в файле рядом со словом написан перевод — он и есть перевод (`file`),
 *     а словарь нужен, чтобы найти статью слова;
 *   * в файле только иероглифы — перевод предлагает словарь (`dictionary`);
 *   * слова нет в словаре — перевод из файла, а если и там нет, то тот, что
 *     дала модель (`ai`).
 *
 * Файлы после разбора не нужны: слова уходят клиенту в результате задачи, а
 * в базе ничего не ссылается на Storage. Поэтому файлы удаляются, когда
 * разбор удался или материал отвергнут; остаются, только если упал сам
 * разбор — тогда тот же `words-extract` можно позвать ещё раз без повторной
 * загрузки.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.112.4";
import { aiJson, objectSchema } from "./shared.ts";
import { type StoredFile } from "./materials.ts";
import {
  type DictionaryCandidate,
  materialParts,
  pickEntry,
  RejectedMaterial,
  shortTitle,
} from "./moduleParse.ts";
import { BUCKET } from "./uploadedFiles.ts";

/** Потолок слов с одной загрузки. Держит код: шлюз отбрасывает maxItems. */
export const MAX_EXTRACTED = 200;
/** Столько значений словаря склеивается в предложенный перевод. */
const DICTIONARY_SENSES = 3;
/** Столько символов перевода храним — как `check` у `user_dictionary_items.translation`. */
export const MAX_TRANSLATION = 300;

export interface ParsedWords {
  is_language_material: boolean;
  title: string;
  words: { word: string; reading: string; translation_in_file: string; meaning_ru: string }[];
}

const WORDS_SCHEMA = objectSchema(
  {
    is_language_material: {
      type: "boolean",
      description: "true, только если в файле есть китайские слова для изучения",
    },
    title: { type: "string" },
    words: {
      type: "array",
      maxItems: MAX_EXTRACTED,
      items: objectSchema(
        {
          word: { type: "string" },
          reading: { type: "string" },
          translation_in_file: { type: "string" },
          meaning_ru: { type: "string" },
        },
        ["word", "reading", "translation_in_file", "meaning_ru"],
      ),
    },
  },
  ["is_language_material", "title", "words"],
);

const SYSTEM = `Ты выписываешь китайские слова из файла, который принёс ученик, чей родной язык — русский: список слов, словарик урока, карточки, страница учебника, конспект. Ученик сохранит эти слова в свой словарь.

Правила:
1. is_language_material — true, только если в файле есть китайские слова. Фото чего угодно другого, пустой лист, нечитаемый снимок — false, и тогда остальные поля пустые.
2. title — короткое название по-русски, до 40 символов: чем этот файл был. «Урок 5. В магазине», «Слова к диктанту», «Числа». Станет названием папки, если ученик не придумает своё.
3. words — все слова и устойчивые выражения, которые файл даёт для запоминания. Если в файле есть список или таблица слов — берутся слова оттуда, все. Если это связный текст без списка — слова, ради которых этот текст стоит читать; служебные слова (的, 了, 是, 我) не нужны. Каждое слово один раз, в порядке файла.
   - word — слово иероглифами, как в файле;
   - reading — пиньинь с тонами: из файла, если он там есть, иначе твой;
   - translation_in_file — перевод НА РУССКИЙ, который написан в САМОМ ФАЙЛЕ рядом с этим словом, слово в слово. Если в файле перевода нет — пустая строка. Перевод на другой язык (английский и любой другой) — не то, что нужно: тоже пустая строка. Знак вопроса, прочерк, многоточие, пустая клетка или непонятные символы вместо перевода — это не перевод: тоже пустая строка. Не переводи сам в это поле;
   - meaning_ru — короткий перевод на русский в том смысле, в каком слово стоит в файле. Всегда по-русски, даже если в файле перевод на английском, — английский можно использовать, чтобы понять, какой смысл имеется в виду.`;

// ---------------------------------------------------------- чистые функции

const HANZI = /[一-鿿]/;

export interface WordRow {
  word: string;
  reading: string | null;
  fileTranslation: string | null;
  aiMeaning: string | null;
}

/** Ответ модели к списку: только слова с иероглифами, без повторов, не длиннее потолка. */
export function normalizeWords(raw: ParsedWords["words"]): WordRow[] {
  const seen = new Set<string>();
  const rows: WordRow[] = [];
  for (const item of raw) {
    if (rows.length === MAX_EXTRACTED) break;
    const word = item.word.trim();
    if (!HANZI.test(word) || word.length > 64 || seen.has(word)) continue;
    seen.add(word);
    rows.push({
      word,
      reading: item.reading.trim() || null,
      fileTranslation: translationText(item.translation_in_file),
      aiMeaning: translationText(item.meaning_ru),
    });
  }
  return rows;
}

/**
 * Перевод — это текст по-русски. Ученик учит китайский через русский, и
 * перевод на другой язык ему не подходит: учебник может быть китайско-
 * английским (баг с живого сайта), и тогда рядом со словом стоит английский.
 * Такое поле считается пустым, как и «?», «—», «…», «___» на месте перевода
 * (ученик его не знал или не дописал): перевод на русский предлагает
 * словарь, а для слова не из БКРС — модель. Модели это сказано в промпте, но
 * держит правило код — модель может переписать с листа как есть.
 */
const RUSSIAN_LETTER = /\p{Script=Cyrillic}/u;

export function translationText(text: string): string | null {
  const clean = clip(text);
  return clean !== null && RUSSIAN_LETTER.test(clean) ? clean : null;
}

function clip(text: string): string | null {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return null;
  return clean.length <= MAX_TRANSLATION ? clean : clean.slice(0, MAX_TRANSLATION - 1).trimEnd() + "…";
}

export type TranslationSource = "file" | "dictionary" | "ai";

export interface EntryForWord extends DictionaryCandidate {
  compact: string[];
}

export interface ExtractedWord {
  word: string;
  reading: string | null;
  translation: string;
  source: TranslationSource;
  entry_id: number | null;
}

/**
 * Одно слово к ответу: статья по чтению (`pickEntry`), перевод по правилу из
 * шапки файла. Слово, у которого не нашлось ни статьи, ни перевода, — не
 * слово для словаря: `null`.
 */
export function resolveWord(row: WordRow, candidates: EntryForWord[]): ExtractedWord | null {
  const entry = pickEntry(candidates, row.reading) as EntryForWord | null;
  // Только значения по-русски: в БКРС бывают китайские и английские («说；可以说。»).
  const russianSenses = entry ? entry.compact.filter((c) => RUSSIAN_LETTER.test(c)) : [];
  const dictionaryTranslation = russianSenses.length > 0
    ? clip(russianSenses.slice(0, DICTIONARY_SENSES).join("; "))
    : null;

  const [translation, source]: [string | null, TranslationSource] = row.fileTranslation
    ? [row.fileTranslation, "file"]
    : dictionaryTranslation
    ? [dictionaryTranslation, "dictionary"]
    : [row.aiMeaning, "ai"];
  if (!translation) return null;

  return {
    word: row.word,
    // Чтение словаря точнее того, что прочла модель; своё — если статьи нет.
    reading: entry?.reading ?? row.reading,
    translation,
    source,
    entry_id: entry?.id ?? null,
  };
}

// ------------------------------------------------------------------ разбор

export async function extractWords(
  admin: SupabaseClient,
  files: StoredFile[],
): Promise<{ title: string; words: ExtractedWord[] }> {
  const remove = () => admin.storage.from(BUCKET).remove(files.map((f) => f.path));

  try {
    const parts = await materialParts(
      admin,
      files.map((f, i) => ({
        storage_path: f.path,
        filename: f.filename,
        mime_type: f.mimeType,
        position: i + 1,
      })),
    );
    const parsed = await aiJson<ParsedWords>({
      name: "extract_words",
      description: "Выпиши китайские слова из файла с переводами",
      schema: WORDS_SCHEMA,
      system: SYSTEM,
      prompt: parts,
      maxTokens: 16000,
    });

    const rows = normalizeWords(parsed.words ?? []);
    if (!parsed.is_language_material || rows.length === 0) {
      throw new RejectedMaterial("not_language_material");
    }

    const { data: entries } = await admin
      .from("dictionary_entries")
      .select("id, headword, reading, compact")
      .in("headword", rows.map((r) => r.word));
    const byWord = new Map<string, EntryForWord[]>();
    for (const entry of (entries ?? []) as EntryForWord[]) {
      const list = byWord.get(entry.headword) ?? [];
      list.push(entry);
      byWord.set(entry.headword, list);
    }

    const words = rows
      .map((row) => resolveWord(row, byWord.get(row.word) ?? []))
      .filter((w): w is ExtractedWord => w !== null);
    if (words.length === 0) throw new RejectedMaterial("not_language_material");

    await remove();
    return { title: shortTitle(parsed.title) || "Новые слова", words };
  } catch (error) {
    if (error instanceof RejectedMaterial) await remove();
    throw error;
  }
}
