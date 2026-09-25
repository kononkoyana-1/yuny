/**
 *   cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test _shared/learning/
 */
import { assertEquals } from "jsr:@std/assert@1";
import {
  buildSession,
  DAY_MS,
  estimateMinutes,
  type PlanInput,
  type PlanLexeme,
  type PlanPair,
  planDigest,
  recallNow,
  type StoredSkill,
  todayState,
} from "./mod.ts";

const T0 = new Date("2026-09-24T09:00:00Z");
const day = (n: number) => new Date(T0.getTime() + n * DAY_MS);

function lex(id: string, folders = ["f1"], addedDaysAgo = 1): PlanLexeme {
  return { id, headword: id, reading: null, goal: "full", hskLevel: 1, folderIds: folders, addedAt: day(-addedDaysAgo) };
}

function st(stability: number, lastReviewDaysAgo: number | null): StoredSkill {
  const last = lastReviewDaysAgo === null ? null : day(-lastReviewDaysAgo);
  return {
    stability,
    difficulty: 5,
    lastReview: last,
    due: last ? new Date(last.getTime() + stability * DAY_MS) : null,
    reps: last ? 3 : 0,
    lapses: 0,
    contextsPassed: 0,
    unlockedAt: day(-30),
  } as StoredSkill;
}

function base(over: Partial<PlanInput> = {}): PlanInput {
  return {
    now: T0,
    dayStart: new Date("2026-09-24T00:00:00Z"),
    mode: "today",
    minutes: 10,
    pace: 4,
    maxNew: 8,
    retention: 0.9,
    lexemes: [],
    states: {},
    pairs: [],
    reviewedToday: new Set(),
    seed: 1,
    ...over,
  };
}

Deno.test("состояние: нет слов / есть задания / пусто после ответов / пусто без ответов", () => {
  const empty = base();
  assertEquals(todayState(empty, buildSession(empty)), "no_words");

  const fresh = base({ lexemes: [lex("a")] });
  assertEquals(todayState(fresh, buildSession(fresh)), "ready");

  // Слово выучено надолго — сегодня спрашивать нечего.
  const stable = { lexemes: [lex("a", ["f1"], 60)], states: { a: { read: st(200, 1), pinyin: st(200, 1) } } };
  assertEquals(todayState(base(stable), buildSession(base(stable))), "nothing_due");
  const after = base({ ...stable, reviewedToday: new Set(["a:read"]) });
  assertEquals(todayState(after, buildSession(after)), "done");
});

Deno.test("вспомните сейчас: только учившиеся слова, чтение важнее прочих навыков", () => {
  const input = {
    lexemes: [lex("a"), lex("b"), lex("c")],
    states: {
      a: { read: st(100, 0) }, // R = 1
      b: { pinyin: st(100, 0), read: st(1, null) }, // чтения не отвечали — берём пиньинь
      // c — ни одного ответа: в счёт не идёт
    },
  };
  assertEquals(recallNow(input, T0), { recalled: 2, total: 2 });
});

Deno.test("состав плана: новые по первой папке слова, пары без повторов", () => {
  const pair: PlanPair = {
    id: "p1",
    a: { headword: "买", reading: "mǎi" },
    b: { headword: "卖", reading: "mài" },
    lexemeA: null,
    lexemeB: null,
    confusions: 2,
    lastConfusedAt: day(-1),
  } as PlanPair;
  const input = base({ lexemes: [lex("x", ["f2", "f1"]), lex("y", ["f2"]), lex("z", ["f3"])], pairs: [pair] });
  const plan = {
    ...buildSession(input),
    tasks: [
      { kind: "intro", lexemeId: "x", code: "intro" },
      { kind: "pair_card", pairId: "p1", code: "pair_card" },
      { kind: "intro", lexemeId: "z", code: "intro" },
      { kind: "intro", lexemeId: "y", code: "intro" },
      { kind: "pair", pairId: "p1", lexemeId: null, code: "X1" },
    ],
  } as ReturnType<typeof buildSession>;
  assertEquals(planDigest(input, plan), {
    newSources: [{ folderId: "f2", count: 2 }, { folderId: "f3", count: 1 }],
    pairs: [{ a: "买", b: "卖" }],
  });
});

Deno.test("минуты по темпу: не меньше одной, пустой план — ноль", () => {
  assertEquals(estimateMinutes(34, 4), 9);
  assertEquals(estimateMinutes(2, 4), 1);
  assertEquals(estimateMinutes(0, 4), 0);
});
