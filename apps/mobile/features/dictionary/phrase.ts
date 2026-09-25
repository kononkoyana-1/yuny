/**
 * Фраза это или слово (#76): фразу переводим целиком и разбираем на слова,
 * обычная выдача словаря остаётся ниже.
 *
 * - Китайский: больше 4 знаков, или есть знаки препинания, или в выдаче нет
 *   статьи с точно таким заголовком.
 * - Русский: два слова и больше, и ни одно значение в выдаче не равно запросу.
 * - Пиньинь — всегда слово.
 */
const HAN = /\p{Script=Han}/u;
const CYRILLIC = /[А-Яа-яЁё]/;

const norm = (s: string) => s.toLocaleLowerCase("ru").replace(/ё/g, "е").replace(/\s+/g, " ").trim();

export function isPhraseQuery(query: string, items: { headword: string; compact: string[] }[]): boolean {
  const q = query.trim();
  if (!q) return false;
  if (HAN.test(q)) {
    const compact = q.replace(/\s+/g, "");
    const han = [...compact].filter((c) => HAN.test(c)).length;
    if (han > 4 || han < [...compact].length) return true;
    return !items.some((i) => i.headword === compact);
  }
  if (CYRILLIC.test(q)) {
    if (q.split(/\s+/).length < 2) return false;
    const wanted = norm(q.replace(/[.!?…]+$/u, ""));
    return !items.some((i) => i.compact.some((c) => c.split(/[;,]/).some((part) => norm(part) === wanted)));
  }
  return false;
}
