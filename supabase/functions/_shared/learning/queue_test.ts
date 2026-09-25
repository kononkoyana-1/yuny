/**
 *   cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test _shared/learning/
 */
import { assertEquals } from "jsr:@std/assert@1";
import { DAY_MS, intakeRate, perDay, type PlanLexeme, queueView, type StoredSkill } from "./mod.ts";

const DAY0 = new Date("2026-09-24T00:00:00Z");
const day = (n: number) => new Date(DAY0.getTime() + n * DAY_MS);
const lex = (id: string, folders = ["f"]): PlanLexeme => ({
  id, headword: id, reading: null, goal: "full", hskLevel: 1, folderIds: folders, addedAt: day(-10),
});
const started = (daysAgo: number): { read: StoredSkill } => ({
  read: {
    stability: 1, difficulty: 5, lastReview: day(-daysAgo), due: day(1 - daysAgo),
    reps: 1, lapses: 0, contextsPassed: 0, unlockedAt: new Date(day(-daysAgo).getTime() + 3_600_000),
  } as StoredSkill,
});
const input = (lexemes: PlanLexeme[], states: Record<string, { read: StoredSkill }> = {}, maxNew = 8) => ({
  lexemes, states, dayStart: DAY0, maxNew,
});

Deno.test("очередь: слово в двух папках — одно, «Уже знаю» и начатые не в очереди", () => {
  const words = [lex("a", ["f", "g"]), lex("b"), lex("c", ["g"]), lex("known", ["f"])];
  // «Уже знаю» записывает чтение со стабильностью 7 — слово уже не новое.
  const q = input(words, { known: started(0) });
  assertEquals(queueView(q, null).queued, 3);
  assertEquals(queueView(q, "f").queued, 2);
  assertEquals(queueView(q, "g").queued, 2);
});

Deno.test("срок: без истории — по потолку из настроек", () => {
  const words = Array.from({ length: 20 }, (_, i) => lex(`w${i}`));
  const q = input(words);
  assertEquals(intakeRate(q), 8);
  assertEquals(queueView(q, null), { queued: 20, etaDays: 3 });
  assertEquals(perDay(intakeRate(q)), 8);
});

Deno.test("срок: по фактическому приёму за дни истории, не больше 7", () => {
  const fresh = Array.from({ length: 30 }, (_, i) => lex(`n${i}`));
  // Начали 2 дня назад: 6 слов за 3 дня (сегодня тоже считается) — 2 в день.
  const two = ["a", "b", "c", "d", "e", "f"].map((id) => lex(id));
  const states = Object.fromEntries(two.map((l, i) => [l.id, started(i % 3)]));
  const q = input([...fresh, ...two], states);
  assertEquals(intakeRate(q), 2);
  assertEquals(queueView(q, null), { queued: 30, etaDays: 15 });
  // Давняя история: окно 7 дней, старые начатые не считаются.
  const old = input([...fresh, lex("old"), lex("x")], { old: started(40), x: started(1) });
  assertEquals(intakeRate(old), 1 / 7);
  assertEquals(perDay(intakeRate(old)), 1);
});

Deno.test("потолок 0: новые только из папки — срока нет", () => {
  const q = input([lex("a"), lex("b")], {}, 0);
  assertEquals(intakeRate(q), null);
  assertEquals(queueView(q, null), { queued: 2, etaDays: null });
  assertEquals(perDay(null), null);
});
