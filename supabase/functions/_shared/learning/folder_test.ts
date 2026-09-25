/**
 *   cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test _shared/learning/
 */
import { assert, assertEquals } from "jsr:@std/assert@1";
import { DAY_MS, extraNewOffer, folderPlan, type PlanLexeme, type StoredSkill } from "./mod.ts";

const T0 = new Date("2026-09-24T09:00:00Z");
const day = (n: number) => new Date(T0.getTime() + n * DAY_MS);

const lex = (id: string, folder: string, addedDaysAgo = 1): PlanLexeme => ({
  id,
  headword: id,
  reading: null,
  goal: "full",
  hskLevel: 1,
  folderIds: [folder],
  addedAt: day(-addedDaysAgo),
});

function st(stability: number, lastReviewDaysAgo: number): StoredSkill {
  const last = day(-lastReviewDaysAgo);
  return {
    stability,
    difficulty: 5,
    lastReview: last,
    due: new Date(last.getTime() + stability * DAY_MS),
    reps: 3,
    lapses: 0,
    contextsPassed: 0,
    unlockedAt: day(-30),
  } as StoredSkill;
}

const base = (lexemes: PlanLexeme[], states: Record<string, Record<string, StoredSkill>> = {}) => ({
  now: T0,
  dayStart: new Date("2026-09-24T00:00:00Z"),
  pace: 4,
  maxNew: 8,
  retention: 0.9,
  lexemes,
  states,
  pairs: [],
  reviewedToday: new Set<string>(),
  seed: 1,
});

Deno.test("папка: сначала повторить, новые и практика — второстепенные", () => {
  const lexemes = [lex("d1", "f"), lex("n1", "f"), lex("n2", "f")];
  const plan = folderPlan(base(lexemes, { d1: { read: st(2, 5), pinyin: st(30, 2) } }), "f", 10);
  assertEquals(plan.primary?.mode, "review");
  assertEquals(plan.primary?.count, 1);
  assertEquals(plan.alternatives.map((a) => a.mode), ["new", "practice"]);
  assertEquals(plan.alternatives[0].totalNew, 2);
  assertEquals(plan.practiceNote, false);
});

Deno.test("папка: всё держится — практика с заметкой", () => {
  const lexemes = [lex("a", "f", 60)];
  const plan = folderPlan(base(lexemes, { a: { read: st(200, 2), pinyin: st(200, 2) } }), "f", 10);
  assertEquals(plan.primary?.mode, "practice");
  assertEquals(plan.practiceNote, true);
  assertEquals(plan.alternatives, []);
});

Deno.test("папка без слов — предложить нечего; новые — раунд не больше 7", () => {
  assertEquals(folderPlan(base([lex("x", "other")]), "f", 10).primary, null);
  const many = Array.from({ length: 12 }, (_, i) => lex(`n${i}`, "f", 1 + i * 0.01));
  const plan = folderPlan(base(many), "f", 10);
  assertEquals(plan.primary?.mode, "new");
  assertEquals(plan.primary?.count, 7);
  assertEquals(plan.primary?.totalNew, 12);
  assert(plan.primary!.minutes >= 1);
});

Deno.test("«Ещё 7 новых»: папка первого нового слова, прибавка на завтра", () => {
  const offer = extraNewOffer(base([lex("n1", "f"), lex("n2", "f")]), 10);
  assertEquals(offer?.folderId, "f");
  assertEquals(offer?.count, 2);
  assert(offer!.tomorrowDelta > 0);
  assertEquals(extraNewOffer(base([]), 10), null);
});
