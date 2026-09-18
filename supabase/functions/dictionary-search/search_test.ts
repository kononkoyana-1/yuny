/**
 * Три вида запроса с экрана словаря: иероглиф, пиньинь и русский перевод
 * (TZ.md §11, экран 04).
 *
 *   DENO_NO_PACKAGE_JSON=1 deno test supabase/functions/dictionary-search/
 */
import { assertEquals } from "jsr:@std/assert@1";

import { isSearchable, pinyinPlain, queryKind } from "./search.ts";

Deno.test("иероглиф распознаётся как иероглиф", () => {
  assertEquals(queryKind("打"), "hanzi");
  assertEquals(queryKind("打电话"), "hanzi");
  // Смешанный ввод: иероглиф в строке решает, что это иероглиф.
  assertEquals(queryKind("打 da"), "hanzi");
});

Deno.test("латиница распознаётся как пиньинь", () => {
  assertEquals(queryKind("da"), "pinyin");
  assertEquals(queryKind("dǎ"), "pinyin");
  assertEquals(queryKind("Dǎ Diànhuà"), "pinyin");
});

Deno.test("кириллица распознаётся как перевод", () => {
  assertEquals(queryKind("дюжина"), "russian");
  assertEquals(queryKind("Дюжина"), "russian");
});

Deno.test("пиньинь ищется и с тонами, и без них", () => {
  assertEquals(pinyinPlain("dǎ"), "da");
  assertEquals(pinyinPlain("da"), "da");
  assertEquals(pinyinPlain("hànzì"), "hanzi");
  assertEquals(pinyinPlain("hàn zì"), "hanzi");
  assertEquals(pinyinPlain("HÀNZÌ"), "hanzi");
  // Умляут — часть буквы, а не тон: `lǜ` и `lü` ищутся как `lu`.
  assertEquals(pinyinPlain("lǜ"), "lu");
  // Апостроф разделяет слоги в записи, но в `reading_plain` его нет.
  assertEquals(pinyinPlain("xi'an"), "xian");
});

Deno.test("запрос без единой буквы не ищется", () => {
  assertEquals(isSearchable("", "pinyin"), false);
  assertEquals(isSearchable("   ", "pinyin"), false);
  assertEquals(isSearchable("...", "pinyin"), false);
  assertEquals(isSearchable("123", "pinyin"), false);
  assertEquals(isSearchable("da", "pinyin"), true);
  assertEquals(isSearchable("打", "hanzi"), true);
  assertEquals(isSearchable("дюжина", "russian"), true);
});
