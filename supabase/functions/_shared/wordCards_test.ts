/**
 *   cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test --allow-env _shared/
 *
 * Статьи ниже — настоящие значения из `dictionary_entries` (БКРС), урезанные
 * до нужного тесту.
 */
import { assertEquals } from "jsr:@std/assert@1";

import {
  buildCards,
  type CardWord,
  type DictionarySense,
  normalizeAnswer,
  pickSense,
  synonyms,
} from "./wordCards.ts";

const header = (nest: string, gloss: string): DictionarySense => ({ nest, num: null, gloss, header: true });
const sense = (nest: string, num: string, gloss: string): DictionarySense => ({ nest, num, gloss, header: null });

const GUI: DictionarySense[] = [
  header("I", "прил. /наречие"),
  sense("I", "1", "дорогой, дорогостоящий, высокой стоимости (цены); дорого; по высокой (дорогой) цене"),
  sense("I", "2", "благородный, уважаемый, вельможный, достойный; вежл. Ваш"),
  sense("I", "3", "ценный, редкостный; отличный, превосходный; драгоценный, дорогой; благородный"),
  header("II", "гл."),
  sense("II", "1", "высоко ценить; уважать; чтить; желать; понимать значимость, считать главным"),
];

const PIANYI: DictionarySense[] = [
  header("I", "piányi"),
  sense("I", "1", "дешёвый, недорогой, доступный (по цене), низкой стоимости"),
  sense("I", "2", "уступать, снижать цену"),
  header("II", "biànyí"),
  sense("II", "1", "удобный; подходящий; целесообразный; удобство"),
];

Deno.test("ответ сравнивается без регистра, краёв и разницы ё/е", () => {
  assertEquals(normalizeAnswer("  Дешёвый "), "дешевый");
});

Deno.test("синонимы: через запятую и точку с запятой, без скобок и помет", () => {
  assertEquals(synonyms("бить, ударять; колотить; драться"), ["бить", "ударять", "колотить", "драться"]);
  assertEquals(synonyms("акробатика (в Пекинской опере)"), ["акробатика"]);
  assertEquals(synonyms("благородный; вежл. Ваш"), ["благородный", "ваш"]);
  assertEquals(synonyms("* высокое положение, важный пост"), ["высокое положение", "важный пост"]);
});

Deno.test("синонимы: служебная ссылка — не значение", () => {
  assertEquals(synonyms("см. 大"), []);
  assertEquals(synonyms("только в сочетаниях; напр. 匒匌"), []);
});

Deno.test("значение по контексту: 贵 «дорогой (о цене)» — первое, а не «благородный»", () => {
  const picked = pickSense(GUI, "дорогой", "о цене: слишком дорого в магазине", "guì");
  assertEquals(picked?.accepted.includes("дорогостоящий"), true);
  assertEquals(picked?.accepted.includes("благородный"), false);
});

Deno.test("значение по контексту: 贵 в смысле «уважать» — гнездо глагола", () => {
  const picked = pickSense(GUI, "высоко ценить", "ценить, уважать что-то", "guì");
  assertEquals(picked?.accepted.includes("уважать"), true);
});

Deno.test("заголовок гнезда ответом не бывает", () => {
  const all = pickSense(GUI, "", "", null)!.accepted;
  assertEquals(all.some((a) => a.startsWith("прил") || a === "гл"), false);
});

Deno.test("гнездо выбирается по чтению: 便宜 piányi — «дешёвый», biànyí — «удобный»", () => {
  assertEquals(pickSense(PIANYI, "дешёвый", "цена", "piányi")?.accepted.includes("дешевый"), true);
  assertEquals(pickSense(PIANYI, "удобный", "удобно", "biànyí")?.accepted.includes("удобный"), true);
  // Слова совпали бы с обоими гнёздами — решает чтение.
  assertEquals(pickSense(PIANYI, "удобный", "", "piányi")?.accepted.includes("удобный"), false);
});

Deno.test("общих слов нет — засчитываются все значения статьи, но не чужие", () => {
  const picked = pickSense(PIANYI, "выгодный", "что-то выгодное", null)!;
  assertEquals(picked.accepted.includes("дешевый") && picked.accepted.includes("удобный"), true);
  assertEquals(picked.accepted.includes("выгодный"), false);
});

// Детерминированный генератор, чтобы порядок и направления были воспроизводимы.
function seeded(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) % 2 ** 31;
    return seed / 2 ** 31;
  };
}

const WORDS: CardWord[] = [
  { id: "a", word: "贵", reading: "guì", meaning_ru: "дорогой", sense_hint: "о цене", senses: GUI },
  { id: "b", word: "便宜", reading: "piányi", meaning_ru: "дешёвый", sense_hint: "о цене", senses: PIANYI },
  { id: "c", word: "斤", reading: "jīn", meaning_ru: "цзинь, полкило", sense_hint: "мера веса", senses: null },
];

Deno.test("карточки: каждое слово ровно один раз, ключ к каждой", () => {
  const { content, answerKey } = buildCards(WORDS, seeded(7));
  assertEquals(content.cards.map((c) => c.id).sort(), ["a", "b", "c"]);
  assertEquals(answerKey.cards.map((k) => k.id), content.cards.map((c) => c.id));
});

Deno.test("карточки: ответов нет в том, что видит экран", () => {
  const { content } = buildCards(WORDS, seeded(3));
  for (const card of content.cards) {
    assertEquals(Object.keys(card).sort(), ["direction", "id", "prompt", "reading"]);
  }
});

Deno.test("карточки: ru_zh сверяет написание, пиньинь не подсказывает", () => {
  const ruZh = buildCards(WORDS, () => 0.9).content.cards; // 0.9 → всегда ru_zh
  assertEquals(ruZh.every((c) => c.direction === "ru_zh" && c.reading === null), true);
  const keys = buildCards(WORDS, () => 0.9).answerKey.cards;
  assertEquals(keys.find((k) => k.id === "b")?.accepted, ["便宜"]);
});

Deno.test("карточки: слово без статьи в словаре проверяется по значению из разбора", () => {
  const keys = buildCards(WORDS, () => 0.1).answerKey.cards; // 0.1 → всегда zh_ru
  assertEquals(keys.find((k) => k.id === "c")?.accepted, ["цзинь", "полкило"]);
});

Deno.test("карточки: один и тот же генератор — один и тот же урок", () => {
  assertEquals(buildCards(WORDS, seeded(42)), buildCards(WORDS, seeded(42)));
});
