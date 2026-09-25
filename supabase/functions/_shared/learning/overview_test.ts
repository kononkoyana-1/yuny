/**
 *   cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test _shared/learning/
 */
import { assertEquals } from "jsr:@std/assert@1";
import { DAY_MS, folderOverview, type PlanLexeme, type PlanPair, skillLevel, type StoredSkill, wordProgress } from "./mod.ts";

const T0 = new Date("2026-09-24T09:00:00Z");
const day = (n: number) => new Date(T0.getTime() + n * DAY_MS);
const lex = (id: string, folder = "f"): PlanLexeme => ({
  id, headword: id, reading: null, goal: "full", hskLevel: 1, folderIds: [folder], addedAt: day(-10),
});
function st(stability: number, lastReviewDaysAgo: number): StoredSkill {
  const last = day(-lastReviewDaysAgo);
  return {
    stability, difficulty: 5, lastReview: last, due: new Date(last.getTime() + stability * DAY_MS),
    reps: 3, lapses: 0, contextsPassed: 0, unlockedAt: day(-30),
  } as StoredSkill;
}
const pair = (over: Partial<PlanPair>): PlanPair => ({
  id: "p", a: { headword: "买", reading: "mǎi" }, b: { headword: "卖", reading: "mài" },
  lexemeA: "买", lexemeB: "卖", status: "active", resolveStreak: 0, memory: null, confusions: 2, lastConfusedAt: day(-1),
  ...over,
} as PlanPair);
const base = (lexemes: PlanLexeme[], states = {}, pairs: PlanPair[] = []) => ({
  now: T0, dayStart: new Date("2026-09-24T00:00:00Z"), pace: 4, maxNew: 8, retention: 0.9,
  lexemes, states, pairs, reviewedToday: new Set<string>(), seed: 1,
});

Deno.test("уровень навыка: не начат / свежий / держится / устойчиво", () => {
  assertEquals(skillLevel(undefined, T0), "not_started");
  assertEquals(skillLevel(st(1, 0), T0), "fresh");
  assertEquals(skillLevel(st(5, 0), T0), "holding");
  assertEquals(skillLevel(st(30, 0), T0), "stable");
  assertEquals(skillLevel(st(30, 200), T0), "fresh"); // давно не повторяли — забывается
});

Deno.test("карта папки: стадии, «пора освежить», метка пары, чужие папки не считаются", () => {
  const input = base(
    [lex("买"), lex("卖"), lex("新"), lex("x", "other")],
    { 买: { read: st(2, 5), pinyin: st(30, 2) }, 卖: { read: st(30, 2) } },
    [pair({})],
  );
  const map = folderOverview(input, "f");
  assertEquals(map.wordCount, 3);
  assertEquals(map.dueCount, 1);
  assertEquals(map.stageCounts.new, 1);
  const mai = map.words.find((w) => w.headword === "买")!;
  assertEquals(mai.due, true);
  assertEquals(mai.pairPartner, "卖");
  assertEquals(map.words.find((w) => w.headword === "新")!.stage, "new");
});

Deno.test("прогресс слова: ближайшее повторение и пары, включая решённые", () => {
  const input = base([lex("买")], { 买: { read: st(10, 3), pinyin: st(4, 1) } });
  const resolved = { ...pair({ status: "resolved" }), resolvedAt: new Date("2026-09-20T10:00:00Z") };
  const p = wordProgress(input, lex("买"), [resolved]);
  assertEquals(p.skills.read, "holding");
  assertEquals(p.skills.write, "not_started");
  assertEquals(p.nextReviewDays, 3);
  assertEquals(p.confusions, [{ partner: "卖", partnerReading: "mài", status: "resolved", resolvedOn: "2026-09-20" }]);
  assertEquals(wordProgress(base([lex("x")]), lex("x"), []).nextReviewDays, null);
});
