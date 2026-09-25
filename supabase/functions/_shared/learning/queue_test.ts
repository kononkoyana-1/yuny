/**
 *   cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test _shared/learning/
 */
import { assertEquals } from "jsr:@std/assert@1";
import { DAY_MS, type PlanLexeme, queueView, type StoredSkill } from "./mod.ts";

const DAY0 = new Date("2026-09-24T00:00:00Z");
const lex = (id: string, folders = ["f"]): PlanLexeme => ({
  id, headword: id, reading: null, goal: "full", hskLevel: 1, folderIds: folders, addedAt: new Date(DAY0.getTime() - DAY_MS),
});
const started = { read: { stability: 7, difficulty: 5, lastReview: DAY0, due: DAY0, reps: 1, lapses: 0, contextsPassed: 0, unlockedAt: DAY0 } as StoredSkill };

Deno.test("изучено и впереди: слово в двух папках — одно, «Уже знаю» — изучено", () => {
  const words = [lex("a", ["f", "g"]), lex("b"), lex("c", ["g"]), lex("known", ["f"])];
  const input = { lexemes: words, states: { known: started }, maxNew: 8 };
  assertEquals(queueView(input, null), { total: 4, learned: 1, queued: 3, etaDays: 1 });
  assertEquals(queueView(input, "f"), { total: 3, learned: 1, queued: 2, etaDays: 1 });
  assertEquals(queueView(input, "g"), { total: 2, learned: 0, queued: 2, etaDays: 1 });
});

Deno.test("срок — по настройке «новых в день», не по факту", () => {
  const words = Array.from({ length: 20 }, (_, i) => lex(`w${i}`));
  assertEquals(queueView({ lexemes: words, states: {}, maxNew: 8 }, null).etaDays, 3);
  assertEquals(queueView({ lexemes: words, states: {}, maxNew: 0 }, null).etaDays, null);
  assertEquals(queueView({ lexemes: [], states: {}, maxNew: 8 }, null), { total: 0, learned: 0, queued: 0, etaDays: 0 });
});
