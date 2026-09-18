/**
 * Разбор строки поиска (TZ.md §11, экран 04).
 *
 * Лежит отдельным файлом от обработчика, потому что это единственная здесь
 * логика без базы и сети — её можно проверить тестами, что и сделано в
 * `search_test.ts`.
 *
 * Те же правила повторены в SQL (`public.dict_pinyin_plain`,
 * `public.dictionary_search`): сервер не доверяет присланному виду запроса и
 * определяет письменность сам. Здесь он нужен, чтобы вернуть вид клиенту —
 * пустое состояние экрана звучит по-разному для иероглифа и для перевода.
 */

export type QueryKind = "hanzi" | "pinyin" | "russian";

/** Диапазон CJK Unified Ideographs — тот же, что у парсера словаря. */
const HANZI = /[一-鿿]/;
const CYRILLIC = /[Ѐ-ӿ]/;

export function queryKind(query: string): QueryKind {
  if (HANZI.test(query)) return "hanzi";
  if (CYRILLIC.test(query)) return "russian";
  return "pinyin";
}

/**
 * Пиньинь к виду, в котором он лежит в `reading_plain`: без тонов, без
 * пробелов и апострофов, в нижнем регистре. `hànzì`, `hàn zì` и `hanzi` —
 * один и тот же запрос.
 */
export function pinyinPlain(query: string): string {
  return query
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toLowerCase();
}

/** Пустая строка, одни пробелы или латиница без единой буквы искать нечего. */
export function isSearchable(query: string, kind: QueryKind): boolean {
  if (query.trim() === "") return false;
  return kind !== "pinyin" || pinyinPlain(query) !== "";
}
