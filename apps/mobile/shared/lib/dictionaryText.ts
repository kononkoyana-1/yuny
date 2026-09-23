import type { DictionaryQueryKind } from "@yuny/shared";

/**
 * Разбор строки поиска на клиенте. Выдачу БКРС определяет сервер
 * (`supabase/functions/dictionary-search/search.ts`) — эти правила повторяют
 * его для того, что сервер не видит: поиска по своему словарю, который целиком
 * лежит на клиенте, и мок-репозитория.
 */

/** CJK Unified Ideographs — тот же диапазон, что у сервера и парсера словаря. */
const HANZI = /[一-鿿]/;
const CYRILLIC = /[Ѐ-ӿ]/;

export function queryKind(query: string): DictionaryQueryKind {
  if (HANZI.test(query)) return "hanzi";
  if (CYRILLIC.test(query)) return "russian";
  return "pinyin";
}

/**
 * Пиньинь без тонов, пробелов и апострофов, в нижнем регистре: `hànzì`,
 * `hàn zì` и `hanzi` — один запрос. Как `pinyinPlain` на сервере.
 */
export function pinyinPlain(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toLowerCase();
}

/**
 * Каждое чтение статьи отдельно: у «hǎo, hào» их два, и `hao` должен найти
 * оба, а `haoh` — ни одного.
 */
export function readingsPlain(reading: string | null): string[] {
  return (reading ?? "").split(/[,;]/).map(pinyinPlain).filter(Boolean);
}
