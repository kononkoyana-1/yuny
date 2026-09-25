import {
  DictionaryArticleRequestSchema,
  DictionaryArticleSchema,
  DictionarySearchRequestSchema,
  DictionarySearchResponseSchema,
  PhraseTranslationSchema,
  type PhraseWord,
  type DictionaryEntry,
  type DictionaryQueryKind,
} from "@yuny/shared";
import { BackendError } from "@/shared/lib/backendError";
import { pinyinPlain, queryKind, readingsPlain } from "@/shared/lib/dictionaryText";
import type { DictionaryRepository } from "../dictionary.repository";
import { delay } from "./delay";
import { mockDictionary } from "./dictionary.fixtures";
import { wordFacts } from "./study.overview.mock";
import { mockUserDictionaryRepository } from "./userDictionary.repository.mock";

/**
 * Переключатель ошибки поиска, по образцу `EXPO_PUBLIC_MOCK_MODULES_EMPTY`:
 * без него состояние ошибки экрана словаря в моке не увидеть.
 */
const MOCK_DICTIONARY_ERROR = process.env.EXPO_PUBLIC_MOCK_DICTIONARY_ERROR === "true";

const DEFAULT_LIMIT = 20;

/**
 * Лестница рангов `public.dictionary_search`, упрощённая: 0 — точное
 * совпадение, 1 — префикс, 2 — попадание в перевод.
 */
function rankOf(entry: Omit<DictionaryEntry, "rank">, query: string, kind: DictionaryQueryKind) {
  if (kind === "hanzi") {
    if (entry.headword === query) return 0;
    return entry.headword.startsWith(query) ? 1 : null;
  }
  if (kind === "pinyin") {
    const needle = pinyinPlain(query);
    const readings = readingsPlain(entry.reading);
    if (readings.includes(needle)) return 0;
    return readings.some((r) => r.startsWith(needle)) ? 1 : null;
  }
  const needle = query.trim().toLocaleLowerCase("ru");
  return entry.senses.some((s) => s.gloss.toLocaleLowerCase("ru").includes(needle)) ? 2 : null;
}

const HAN = /\p{Script=Han}/u;

/** Переводы фраз для mock-режима; остальные — заглушкой. */
const MOCK_PHRASES: Record<string, string> = {
  "我想买咖啡。": "Хочу купить кофе.",
  "我想买咖啡": "Хочу купить кофе",
  "这个多少钱": "Сколько это стоит?",
};
const VOWEL = "aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ";
/** Слог пиньиня: согласные, гласные, конечные n / ng / r, если за ними не гласная. */
const SYLLABLE = new RegExp(`[^${VOWEL}\\s']*[${VOWEL}]+(?:ng|n(?![${VOWEL}])|r(?![${VOWEL}]))?`, "gi");

/** Упрощённый разбор чтения слова по слогам — сервер делает это строже (`parsePinyin`). */
function syllables(reading: string | null): string[] {
  const first = (reading ?? "").split(/[,;]/)[0] ?? "";
  return first.match(SYLLABLE)?.map((x) => x.toLowerCase()) ?? [];
}

/** Как `shortGloss` на сервере: первый пункт, не больше двух вариантов, без скобок. */
function shortGloss(gloss: string | undefined): string | null {
  if (!gloss) return null;
  const first = gloss.split(";")[0]!.replace(/\([^()]*\)/g, " ").replace(/\s+/g, " ").trim();
  return first.split(/\s*,\s*/).slice(0, 2).join(", ") || null;
}

function charPosition(headword: string, char: string) {
  const chars = [...headword];
  return chars[0] === char ? "start" : chars.at(-1) === char ? "end" : "middle";
}

export const mockDictionaryRepository: DictionaryRepository = {
  async search(req) {
    const { query, limit = DEFAULT_LIMIT, offset = 0 } = DictionarySearchRequestSchema.parse(req);
    await delay(undefined, 350);
    if (MOCK_DICTIONARY_ERROR) throw new BackendError("dictionary_unavailable");

    const kind = queryKind(query);
    const ranked = mockDictionary
      .map((entry) => ({ ...entry, rank: rankOf(entry, query, kind) }))
      .filter((entry): entry is DictionaryEntry => entry.rank !== null)
      .sort((a, b) => a.rank - b.rank || a.headword.length - b.headword.length);

    return DictionarySearchResponseSchema.parse({
      query,
      kind,
      limit,
      offset,
      has_more: ranked.length > offset + limit,
      items: ranked.slice(offset, offset + limit),
    });
  },
  async article(req) {
    const { headword, reading } = DictionaryArticleRequestSchema.parse(req);
    await delay(undefined, 250);
    if (MOCK_DICTIONARY_ERROR) throw new BackendError("dictionary_unavailable");

    const entry =
      mockDictionary.find((e) => e.headword === headword && e.reading === reading) ??
      mockDictionary.find((e) => e.headword === headword) ??
      null;
    const chars = [...headword];
    const wordReading = reading ?? entry?.reading ?? null;
    const syl = syllables(wordReading);

    const composition =
      chars.filter((c) => HAN.test(c)).length < 2
        ? []
        : chars.filter((c) => HAN.test(c)).map((char, index) => {
            const charEntry = mockDictionary.find((e) => e.headword === char);
            const own = syl.length === chars.length ? syl[index]! : null;
            return {
              char,
              reading: own ?? charEntry?.reading?.split(",")[0]?.trim() ?? null,
              meaning: shortGloss(charEntry?.compact[0]),
              entry_reading: charEntry?.reading ?? null,
              meanings: (charEntry?.compact ?? []).filter((c) => /[А-Яа-яЁё]/.test(c)),
            };
          });

    let charWords = null;
    if (chars.length === 1 && HAN.test(headword)) {
      const saved = await mockUserDictionaryRepository.listItems();
      const mine = new Set(saved.map((i) => i.headword));
      charWords = mockDictionary
        .filter((e) => e.headword !== headword && e.headword.includes(headword) && [...e.headword].length <= 3)
        .map((e) => ({ e, mine: mine.has(e.headword) }))
        .sort((a, b) => Number(b.mine) - Number(a.mine) || (a.e.hsk_level ?? 99) - (b.e.hsk_level ?? 99))
        .map(({ e, mine: isMine }) => ({
          headword: e.headword,
          reading: e.reading,
          meaning: shortGloss(e.compact[0]),
          hsk_level: e.hsk_level,
          position: charPosition(e.headword, headword),
          mine: isMine,
          stage: isMine ? wordFacts(e.headword).stage : null,
        }));
    }

    return DictionaryArticleSchema.parse({
      headword,
      reading: wordReading,
      entry: entry
        ? { id: entry.id, headword: entry.headword, reading: entry.reading, senses: entry.senses, compact: entry.compact }
        : null,
      hsk_level: entry?.hsk_level ?? null,
      composition,
      char_words: charWords,
    });
  },
  async translatePhrase(text) {
    await delay(undefined, 600);
    const zhSource = HAN.test(text);
    // Перевод — заглушка; разбор — самым длинным словом словаря слева направо, как на сервере.
    const zh = zhSource ? text.replace(/\s+/g, "") : "我想买咖啡。";
    const translation = zhSource ? (MOCK_PHRASES[zh] ?? `Перевод: «${zh}»`) : zh;
    const chars = [...zh];
    const words: PhraseWord[] = [];
    for (let i = 0; i < chars.length; ) {
      if (!HAN.test(chars[i]!)) {
        words.push({ text: chars[i]!, reading: null, meaning: null, in_dictionary: false, punct: true });
        i++;
        continue;
      }
      let len = Math.min(4, chars.length - i);
      let entry: (typeof mockDictionary)[number] | undefined;
      for (; len > 1; len--) {
        entry = mockDictionary.find((e) => e.headword === chars.slice(i, i + len).join(""));
        if (entry) break;
      }
      const word = chars.slice(i, i + len).join("");
      entry ??= mockDictionary.find((e) => e.headword === word);
      words.push({
        text: word,
        reading: entry?.reading?.split(",")[0]?.trim() ?? null,
        meaning: shortGloss(entry?.compact[0]),
        in_dictionary: !!entry,
        punct: false,
      });
      i += len;
    }
    return PhraseTranslationSchema.parse({
      direction: zhSource ? "zh-ru" : "ru-zh",
      translation,
      zh,
      pinyin: words.filter((w) => !w.punct).map((w) => w.reading ?? "?").join(" "),
      words,
    });
  },
};
