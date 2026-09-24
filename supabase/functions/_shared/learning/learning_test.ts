/**
 *   cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test _shared/learning/
 */
import { assert, assertAlmostEquals, assertEquals } from "jsr:@std/assert@1";

import {
  canonicalPair,
  cappedDue,
  classify,
  DAY_MS,
  formatWeight,
  implicitReview,
  initialDifficulty,
  intervalDays,
  type MemoryState,
  needsIntervention,
  normalizePinyin,
  retrievability,
  review,
  reviewPair,
  sameSyllables,
  startPair,
  unlockedSkills,
  wordStage,
  type WordFeatures,
} from "./mod.ts";

const T0 = new Date("2026-09-24T09:00:00Z");
const day = (n: number) => new Date(T0.getTime() + n * DAY_MS);
const near = (actual: number, expected: number, tol = 0.02) => assertAlmostEquals(actual, expected, tol);

// ------------------------------------------------------------------ кривая

Deno.test("кривая: через S дней вероятность ровно 0.9, интервал при 0.9 равен S", () => {
  near(retrievability(7, 7), 0.9, 1e-9);
  near(intervalDays(7, 0.9), 7, 1e-9);
  assert(intervalDays(7, 0.95) < 7);
  assert(intervalDays(7, 0.85) > 7);
});

// ------------------------------------------------- пример 买 из раздела 4

const mai: WordFeatures = { hskLevel: 1, hasConfusable: true, syllables: 1 };
const good = { kind: "success", rating: 3 } as const;
const easy = { kind: "success", rating: 4 } as const;

Deno.test("пример 买: стартовая сложность — 5.5 для чтения и пиньиня, 7.0 для письма", () => {
  near(initialDifficulty("read", mai), 5.5, 1e-9);
  near(initialDifficulty("pinyin", mai), 5.5, 1e-9);
  near(initialDifficulty("write", mai), 7.0, 1e-9);
});

Deno.test("пример 买: «Читаю» 1.25 → 6.19 → 19.2", () => {
  const d0 = initialDifficulty("read", mai);
  const s0 = review(null, good, { now: day(0), weight: formatWeight("R1"), initialDifficulty: d0 });
  near(s0.stability, 1.25);
  near(s0.difficulty, 5.5);
  const s2 = review(s0, easy, { now: day(2), weight: formatWeight("R2"), initialDifficulty: d0 });
  near(s2.stability, 6.19);
  near(s2.difficulty, 5.2);
  const s9 = review(s2, good, { now: day(9), weight: formatWeight("R3"), initialDifficulty: d0 });
  near(s9.stability, 19.2, 0.1);
});

Deno.test("пример 买: «Пиньинь» 2.5 → путаница с 卖 1.25 → 5.49", () => {
  const d0 = initialDifficulty("pinyin", mai);
  const s0 = review(null, good, { now: day(0), weight: formatWeight("P2"), initialDifficulty: d0 });
  near(s0.stability, 2.5);
  const s3 = review(s0, { kind: "error", error: "confusion" }, { now: day(3), weight: 1, initialDifficulty: d0 });
  near(s3.stability, 1.25);
  near(s3.difficulty, 6.1);
  assertEquals(s3.lapses, 1);
  const s5 = review(s3, good, { now: day(5), weight: formatWeight("P2"), initialDifficulty: d0 });
  near(s5.stability, 5.49);
});

Deno.test("пример 买: «Пишу» — путаница при первом показе 0.4, затем 2.26", () => {
  const d0 = initialDifficulty("write", mai);
  const s2 = review(null, { kind: "error", error: "confusion" }, { now: day(2), weight: formatWeight("W1"), initialDifficulty: d0 });
  near(s2.stability, 0.4);
  near(s2.difficulty, 7.6);
  const s4 = review(s2, good, { now: day(4), weight: formatWeight("W1"), initialDifficulty: d0 });
  near(s4.stability, 2.26);
});

Deno.test("пример 买: «Использую» — первый пропуск с выбором даёт 1.5", () => {
  const s = review(null, good, { now: day(8), weight: formatWeight("C1"), initialDifficulty: 5.5 });
  near(s.stability, 1.5);
});

Deno.test("пример 买: пара 买/卖 1.0 → 2.66 → 9.93, ограничение снимается", () => {
  const p3 = startPair(4, 4, day(3));
  near(p3.memory!.stability, 1.0);
  assertEquals(p3.status, "active");
  const p4 = reviewPair(p3, true, formatWeight("X2"), day(4));
  near(p4.memory!.stability, 2.66);
  assertEquals(p4.status, "active");
  assertEquals(p4.resolveStreak, 1);
  const p7 = reviewPair(p4, true, formatWeight("X3"), day(7));
  near(p7.memory!.stability, 9.93, 0.05);
  assertEquals(p7.status, "watch");
  assertEquals(p7.resolveStreak, 2);
});

// ------------------------------------------------------------- пара и срок

Deno.test("пара: срок навыка не дальше срока активной пары, у watch — без ограничения", () => {
  const pair = startPair(4, 4, day(3));
  const far = day(20);
  assertEquals(cappedDue(far, pair).getTime(), pair.memory!.due.getTime());
  assertEquals(cappedDue(day(3.5), pair).getTime(), day(3.5).getTime());
  assertEquals(cappedDue(far, { ...pair, status: "watch" }).getTime(), far.getTime());
  assertEquals(cappedDue(far, null).getTime(), far.getTime());
});

Deno.test("пара: спутал снова — счётчик снятия в ноль, пара снова active", () => {
  const p = reviewPair({ ...startPair(4, 4, day(0)), resolveStreak: 2, status: "watch" }, false, 1, day(8));
  assertEquals(p.status, "active");
  assertEquals(p.resolveStreak, 0);
});

Deno.test("пара: три различения на интервалах ≥1, ≥3, ≥7 — решена; слишком рано — не засчитывается", () => {
  let p = startPair(4, 4, day(0));
  p = reviewPair(p, true, 1, day(0.5)); // меньше суток — не в счёт
  assertEquals(p.resolveStreak, 0);
  p = reviewPair(p, true, 1, day(2));
  p = reviewPair(p, true, 1, day(5));
  p = reviewPair(p, true, 1, day(12));
  assertEquals(p.status, "resolved");
});

Deno.test("пара: интервенция — две путаницы за 30 дней, старые не считаются", () => {
  assert(needsIntervention([day(-3), day(0)], day(0)));
  assert(!needsIntervention([day(-40), day(0)], day(0)));
  assert(!needsIntervention([day(0)], day(0)));
});

Deno.test("пара: стороны в порядке кодовых точек, как collate \"C\"", () => {
  const mai3 = { headword: "买", reading: "mǎi" };
  const mai4 = { headword: "卖", reading: "mài" };
  assertEquals(canonicalPair(mai4, mai3), [mai3, mai4]);
  assertEquals(canonicalPair(mai3, mai4), [mai3, mai4]);
  // Одинаковый знак — решает чтение.
  const le = { headword: "了", reading: "le" };
  const liao = { headword: "了", reading: "liǎo" };
  assertEquals(canonicalPair(liao, le), [le, liao]);
});

// ------------------------------------------------------------------ пиньинь

Deno.test("пиньинь: знак, цифра, регистр и пробелы — одно и то же", () => {
  for (const s of ["mǎi", "mai3", "MAI3", "mai 3", " mǎi "]) assertEquals(normalizePinyin(s), "mai3");
});

Deno.test("пиньинь: многосложное слово режется на слоги, лёгкий тон — 5", () => {
  for (const s of ["dòufu", "dou4fu", "dou4 fu5", "dou4fu0", "Dòu fu"]) assertEquals(normalizePinyin(s), "dou4 fu5");
  assertEquals(normalizePinyin("piányi"), "pian2 yi5");
  assertEquals(normalizePinyin("jīnzhēngū"), "jin1 zhen1 gu1");
  assertEquals(normalizePinyin("Xī'ān"), "xi1 an1");
  assertEquals(normalizePinyin("xiān"), "xian1");
});

Deno.test("пиньинь: v и u: — это ü, после j/q/x/y — u", () => {
  assertEquals(normalizePinyin("lv4"), "lü4");
  assertEquals(normalizePinyin("lǜ"), "lü4");
  assertEquals(normalizePinyin("nu:3"), "nü3");
  assertEquals(normalizePinyin("qù"), "qu4");
  assertEquals(normalizePinyin("qv4"), "qu4");
});

Deno.test("пиньинь: не пиньинь — null", () => {
  assertEquals(normalizePinyin("买"), null);
  assertEquals(normalizePinyin("хочу"), null);
  assertEquals(normalizePinyin(""), null);
});

Deno.test("пиньинь: те же слоги без учёта тона", () => {
  assert(sameSyllables("mǎi", "mài"));
  assert(!sameSyllables("mǎi", "mǎ"));
});

// ------------------------------------------------------------ классификатор

const MAI3 = { headword: "买", reading: "mǎi" };
const MAI4 = { headword: "卖", reading: "mài" };

Deno.test("классификатор: mai4 при 卖 в словаре — путаница с 卖", () => {
  const c = classify({ target: MAI3, answer: { kind: "pinyin", text: "mai4" }, known: [MAI3, MAI4] });
  assertEquals(c.outcome, "confusion");
  assertEquals(c.partner, MAI4);
  assertEquals(c.grade, { kind: "error", error: "confusion" });
});

Deno.test("классификатор: mai2 без такого слова — ошибка тона; mei3 — слога", () => {
  assertEquals(classify({ target: MAI3, answer: { kind: "pinyin", text: "mai2" }, known: [MAI3, MAI4] }).outcome, "tone");
  assertEquals(classify({ target: MAI3, answer: { kind: "pinyin", text: "mai4" }, known: [MAI3] }).outcome, "tone");
  assertEquals(classify({ target: MAI3, answer: { kind: "pinyin", text: "mei3" }, known: [MAI3] }).outcome, "syllable");
  assertEquals(classify({ target: MAI3, answer: { kind: "pinyin", text: "   " } }).outcome, "blank");
});

Deno.test("классификатор: правильный пиньинь; скорость двигает оценку, вторая попытка — не успех", () => {
  const base = { target: MAI3, answer: { kind: "pinyin", text: "mǎi" } as const, medianMs: 4000 };
  assertEquals(classify({ ...base, latencyMs: 4000 }).grade, { kind: "success", rating: 3 });
  assertEquals(classify({ ...base, latencyMs: 1500 }).grade, { kind: "success", rating: 4 });
  assertEquals(classify({ ...base, latencyMs: 12000 }).grade, { kind: "success", rating: 2 });
  assertEquals(classify({ ...base, latencyMs: 1500, medianMs: null }).grade, { kind: "success", rating: 3 });
  const second = classify({ ...base, secondTry: true });
  assertEquals(second.outcome, "ok");
  assertEquals(second.grade, { kind: "error", error: "second_try" });
});

Deno.test("классификатор: выбор знака — путаница, похожая форма, омофон, просто неверно", () => {
  const options = [
    { value: "买", ...MAI3 },
    { value: "卖", ...MAI4 },
    { value: "实", headword: "实", reading: "shí", similarity: "form" as const },
    { value: "麦", headword: "麦", reading: "mài", similarity: "sound" as const },
    { value: "马", headword: "马", reading: "mǎ" },
    { value: "猫", headword: "猫", reading: "māo" },
  ];
  const pick = (value: string, known = [MAI3, MAI4]) =>
    classify({ target: MAI3, answer: { kind: "choice", value }, options, known });
  assertEquals(pick("买").outcome, "ok");
  assertEquals(pick("卖").outcome, "confusion");
  assertEquals(pick("卖").partner, MAI4);
  assertEquals(pick("卖", [MAI3]).outcome, "homophone"); // 卖 не в словаре: те же слоги
  assertEquals(pick("实").outcome, "form_similar");
  assertEquals(pick("麦").outcome, "homophone");
  assertEquals(pick("猫").outcome, "wrong");
  assertEquals(classify({ target: MAI3, answer: { kind: "choice", value: null }, options }).outcome, "blank");
});

Deno.test("классификатор: сборка фразы — верно, другой допустимый порядок, не тот порядок, не те слова", () => {
  const expectedOrders = [["这个", "太", "贵", "了", "，", "我", "不", "买", "。"], ["我", "不", "买", "，", "这个", "太", "贵", "了", "。"]];
  const run = (tokens: string[]) => classify({ target: MAI3, answer: { kind: "order", tokens }, expectedOrders }).outcome;
  assertEquals(run(expectedOrders[0]), "ok");
  assertEquals(run(expectedOrders[1]), "ok");
  assertEquals(run(["这个", "贵", "太", "了", "，", "我", "不", "买", "。"]), "order");
  assertEquals(run(["这个", "太", "贵", "了", "，", "我", "不", "卖", "。"]), "wrong");
});

Deno.test("классификатор: самооценка и знакомство", () => {
  assertEquals(classify({ target: MAI3, answer: { kind: "self", remembered: true } }).outcome, "ok");
  assertEquals(classify({ target: MAI3, answer: { kind: "self", remembered: false } }).outcome, "blank");
  const seen = classify({ target: MAI3, answer: { kind: "seen" } });
  assertEquals(seen.outcome, "seen");
  assertEquals(seen.grade, null);
});

// ------------------------------------------------ разблокировка и стадии

const st = (stability: number, lastReviewDay: number, extra: Partial<MemoryState> = {}) => ({
  stability,
  difficulty: 5,
  lastReview: day(lastReviewDay),
  due: day(lastReviewDay + stability),
  reps: 3,
  lapses: 0,
  ...extra,
});

Deno.test("разблокировка: «Пишу» после S(Читаю) ≥ 3 и не для «только читать»; «Использую» — после Читаю ≥ 3 и Пиньинь ≥ 2", () => {
  assertEquals(unlockedSkills({ read: st(1, 0), pinyin: st(5, 0) }, "full"), ["read", "pinyin"]);
  assertEquals(unlockedSkills({ read: st(3, 0), pinyin: st(1, 0) }, "full"), ["read", "pinyin", "write"]);
  assertEquals(unlockedSkills({ read: st(3, 0), pinyin: st(2, 0) }, "full"), ["read", "pinyin", "write", "use"]);
  assertEquals(unlockedSkills({ read: st(3, 0), pinyin: st(2, 0) }, "read_only"), ["read", "pinyin", "use"]);
});

Deno.test("стадии: от «Новое» до «Устойчиво»", () => {
  const now = day(0);
  const opts = { now, goal: "full" as const, activePair: false };
  assertEquals(wordStage({}, opts), "new");
  assertEquals(wordStage({ read: st(1.25, 0) }, opts), "meeting");
  assertEquals(wordStage({ read: st(6, 0), pinyin: st(2, 0) }, opts), "recognize");
  assertEquals(wordStage({ read: st(6, 0), pinyin: st(8, 0), write: st(8, 0) }, opts), "recall");
  assertEquals(wordStage({ read: st(6, 0), pinyin: st(8, 0) }, { ...opts, goal: "read_only" }), "recall");
  const use = { ...st(10, 0), contextsPassed: 2, unlockedAt: day(-10) };
  assertEquals(wordStage({ read: st(6, 0), pinyin: st(8, 0), write: st(8, 0), use }, opts), "use");
  const stable = { read: st(70, 0), pinyin: st(35, 0), write: st(31, 0), use: { ...st(25, 0), contextsPassed: 3, unlockedAt: day(-30) } };
  assertEquals(wordStage(stable, opts), "stable");
  assertEquals(wordStage(stable, { ...opts, activePair: true }), "use");
});

Deno.test("стадии: давно не повторённый навык не засчитывается — стадия понижается", () => {
  // «Читаю» S = 6, повторяли 30 дней назад: R ≈ 0.62 < 0.8.
  assertEquals(wordStage({ read: st(6, -30) }, { now: day(0), goal: "full", activePair: false }), "meeting");
});

// ------------------------------------------------------------------ перенос

Deno.test("перенос: успех в контексте — слабое повторение, не чаще раза в сутки", () => {
  const read = st(6, -3);
  const after = implicitReview(read, day(0));
  assert(after && after.stability > read.stability);
  const full = review(read, good, { now: day(0), weight: 1, initialDifficulty: 5 });
  assert(after!.stability < full.stability);
  assertEquals(implicitReview(st(6, -0.5), day(0)), null);
  assertEquals(implicitReview(null, day(0)), null);
});

Deno.test("ошибка не опускает стабильность ниже 0.4 и не растит её", () => {
  const s = review(st(0.5, -1), { kind: "error", error: "blank" }, { now: day(0), weight: 1, initialDifficulty: 5 });
  near(s.stability, 0.4, 1e-9);
  const t = review(st(10, -5), { kind: "error", error: "tone" }, { now: day(0), weight: 1, initialDifficulty: 5 });
  near(t.stability, 6, 1e-9);
});
