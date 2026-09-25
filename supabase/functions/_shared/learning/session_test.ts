/**
 *   cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test _shared/learning/
 */
import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  buildSession,
  DAY_MS,
  intakeQuota,
  interleave,
  type PlanInput,
  type PlanLexeme,
  type PlanPair,
  type PlanTask,
  portions,
  sessionBudget,
  type StoredSkill,
} from "./mod.ts";

const T0 = new Date("2026-09-24T09:00:00Z");
const DAY0 = new Date("2026-09-24T00:00:00Z");
const day = (n: number) => new Date(T0.getTime() + n * DAY_MS);

function lex(id: string, folder = "f1", addedDaysAgo = 10, over: Partial<PlanLexeme> = {}): PlanLexeme {
  return { id, headword: id, reading: null, goal: "full", hskLevel: 1, folderIds: [folder], addedAt: day(-addedDaysAgo), ...over };
}

function st(stability: number, lastReviewDaysAgo: number, reps = 3, unlockedDaysAgo = 30): StoredSkill {
  const last = day(-lastReviewDaysAgo);
  return {
    stability,
    difficulty: 5,
    lastReview: last,
    due: new Date(last.getTime() + stability * DAY_MS),
    reps,
    lapses: 0,
    contextsPassed: 0,
    unlockedAt: day(-unlockedDaysAgo),
  };
}

function base(over: Partial<PlanInput> = {}): PlanInput {
  return {
    now: T0,
    dayStart: DAY0,
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

/** n слов, у которых «Читаю» просрочено. */
function dueWords(n: number, folder = "f1") {
  const lexemes = Array.from({ length: n }, (_, i) => lex(`d${folder}${i}`, folder));
  const states = Object.fromEntries(lexemes.map((l) => [l.id, { read: st(2, 5), pinyin: st(30, 1) }]));
  return { lexemes, states };
}

function newWords(n: number, folder = "f1", addedDaysAgo = 1) {
  return Array.from({ length: n }, (_, i) => lex(`n${folder}${i}`, folder, addedDaysAgo + i * 0.01));
}

const lexOf = (t: PlanTask) => ("lexemeId" in t ? t.lexemeId : null);

// ---------------------------------------------------------------- бюджет

Deno.test("бюджет: минуты × темп, темп зажат в 3..6", () => {
  assertEquals(sessionBudget(10, 4), 40);
  assertEquals(sessionBudget(5, 20), 30);
  assertEquals(sessionBudget(15, 0), 60);
});

Deno.test("квота: место от завтрашней нагрузки, потолок, минус начатые сегодня", () => {
  assertEquals(intakeQuota({ budget: 40, dueTomorrow: 10, maxNew: 8, startedToday: 0 }), 5);
  assertEquals(intakeQuota({ budget: 40, dueTomorrow: 0, maxNew: 8, startedToday: 0 }), 6);
  assertEquals(intakeQuota({ budget: 40, dueTomorrow: 0, maxNew: 3, startedToday: 0 }), 3);
  assertEquals(intakeQuota({ budget: 40, dueTomorrow: 50, maxNew: 8, startedToday: 0 }), 0);
  assertEquals(intakeQuota({ budget: 40, dueTomorrow: 10, maxNew: 8, startedToday: 5 }), 0);
});

Deno.test("порции по 8–10 без огрызка", () => {
  assertEquals(portions(40), [10, 10, 10, 10]);
  assertEquals(portions(21), [7, 7, 7]);
  assertEquals(portions(12), [6, 6]);
  assertEquals(portions(9), [9]);
  assertEquals(portions(0), []);
});

// ---------------------------------------------------------------- «Сегодня»

Deno.test("«Сегодня»: повторения по просроченности, новые по квоте", () => {
  const due = dueWords(10);
  const fresh = newWords(5, "f2");
  const plan = buildSession(base({ lexemes: [...due.lexemes, ...fresh], states: due.states }));
  const reviews = plan.tasks.filter((t) => t.kind === "review" && !t.round);
  assertEquals(reviews.length, 10);
  assert(plan.stats.newTaken > 0);
  assertEquals(plan.tasks.filter((t) => t.kind === "intro").length, plan.stats.newTaken);
  assertEquals(plan.stats.reason, null);
});

Deno.test("долг: повторений больше бюджета — берём бюджет, новых 0, причина debt, остальное не сгорает", () => {
  const due = dueWords(60);
  const plan = buildSession(base({ lexemes: [...due.lexemes, ...newWords(5)], states: due.states }));
  assertEquals(plan.tasks.length, 40);
  assertEquals(plan.stats.dueNow, 60);
  assertEquals(plan.stats.newTaken, 0);
  assertEquals(plan.stats.reason, "debt");
});

Deno.test("сегодня уже спрошенное в папке не повторяется", () => {
  const due = dueWords(3);
  const reviewed = new Set(due.lexemes.map((l) => `${l.id}:read`));
  const plan = buildSession(base({ lexemes: due.lexemes, states: due.states, reviewedToday: reviewed }));
  assertEquals(plan.tasks.length, 0);
});

Deno.test("новое слово: вспоминание не раньше чем через 3 задания после знакомства", () => {
  const due = dueWords(12);
  const plan = buildSession(base({ lexemes: [...due.lexemes, ...newWords(3, "f2")], states: due.states }));
  for (const t of plan.tasks.filter((t) => t.kind === "intro")) {
    const intro = plan.tasks.indexOf(t);
    const recall = plan.tasks.findIndex((x) => x.kind === "review" && x.lexemeId === t.lexemeId);
    assert(recall - intro >= 3, `вспоминание через ${recall - intro}`);
  }
});

Deno.test("перемешивание: одно слово не чаще раза в 4 задания, не больше двух одинаковых форматов подряд", () => {
  const due = dueWords(8);
  for (const l of due.lexemes) due.states[l.id].pinyin = st(1, 3);
  const plan = buildSession(base({ lexemes: due.lexemes, states: due.states }));
  assertEquals(plan.tasks.length, 16);
  plan.tasks.forEach((t, i) => {
    const prev = plan.tasks.slice(Math.max(0, i - 3), i).map(lexOf);
    assert(!prev.includes(lexOf(t)), `слово ${lexOf(t)} на ${i}`);
    if (i >= 2) assert(!(plan.tasks[i - 1].code === t.code && plan.tasks[i - 2].code === t.code), `формат ${t.code} на ${i}`);
  });
});

Deno.test("пара на карточку — блок целиком в начале; пара в расписании — X1", () => {
  const due = dueWords(4);
  const pairs: PlanPair[] = [
    {
      id: "p-card",
      a: { headword: "买", reading: "mǎi" },
      b: { headword: "卖", reading: "mài" },
      lexemeA: "a",
      lexemeB: "b",
      status: "pending",
      memory: null,
      resolveStreak: 0,
      confusions: 2,
      lastConfusedAt: day(-1),
    },
    {
      id: "p-due",
      a: { headword: "大", reading: "dà" },
      b: { headword: "太", reading: "tài" },
      lexemeA: "c",
      lexemeB: "d",
      status: "active",
      memory: { stability: 1, difficulty: 6, lastReview: day(-3), due: day(-2), reps: 1, lapses: 0 },
      resolveStreak: 0,
      confusions: 3,
      lastConfusedAt: day(-5),
    },
  ];
  const plan = buildSession(base({ lexemes: due.lexemes, states: due.states, pairs }));
  const codes = plan.tasks.map((t) => t.code);
  const card = codes.indexOf("pair_card");
  assertEquals(codes.slice(card, card + 5), ["pair_card", "X1", "X1", "X1", "X1"]);
  // Правильный ответ то A, то B: оба слова по два раза.
  const sides = plan.tasks.slice(card + 1, card + 5).map((t) => (t.kind === "pair" ? t.side : null));
  assertEquals(sides.filter((s) => s === "a").length, 2);
  assertEquals(sides.filter((s) => s === "b").length, 2);
  assertEquals(plan.tasks.filter((t) => t.kind === "pair" && t.pairId === "p-due").length, 1);
});

Deno.test("не вводить в один день слово и его пару путаницы", () => {
  const fresh = [lex("a", "f1", 1), lex("b", "f1", 1.01), lex("c", "f1", 1.02)];
  const pairs: PlanPair[] = [{
    id: "p",
    a: { headword: "a", reading: null },
    b: { headword: "b", reading: null },
    lexemeA: "a",
    lexemeB: "b",
    status: "pending",
    memory: null,
    resolveStreak: 0,
    confusions: 1,
    lastConfusedAt: day(-40),
  }];
  const plan = buildSession(base({ lexemes: fresh, pairs, maxNew: 2 }));
  const intros = plan.tasks.filter((t) => t.kind === "intro").map(lexOf).sort();
  assertEquals(intros, ["a", "c"]);
});

// ---------------------------------------------------------------- папка

Deno.test("папка: есть что повторить — режим «повторить», только слова папки", () => {
  const f1 = dueWords(3, "f1");
  const f2 = dueWords(3, "f2");
  const plan = buildSession(base({
    mode: "folder",
    folderId: "f1",
    lexemes: [...f1.lexemes, ...f2.lexemes],
    states: { ...f1.states, ...f2.states },
  }));
  assertEquals(plan.folderMode, "review");
  assert(plan.tasks.every((t) => lexOf(t)!.startsWith("df1")));
});

Deno.test("папка: раунд из 7 новых — знакомство, R1, P1, R2 на каждое + знакомые из этой же папки", () => {
  const known = dueWords(3, "f1");
  const other = dueWords(3, "f2");
  const fresh = newWords(10, "f1");
  const lexemes = [...fresh, ...known.lexemes, ...other.lexemes];
  const states = { ...known.states, ...other.states };
  const plan = buildSession(base({ mode: "folder", folderId: "f1", folderMode: "new", lexemes, states }));
  assertEquals(plan.folderMode, "new");
  assertEquals(plan.stats.newTaken, 7);
  assertEquals(plan.tasks.length, 7 * 4 + 3);
  // Слова других папок в раунд не попадают.
  const otherIds = new Set(other.lexemes.map((l) => l.id));
  assert(plan.tasks.every((t) => !otherIds.has(lexOf(t) ?? "")));
  // В папке нет знакомых — раунд без перемешивания, чужих слов тоже нет.
  const alone = buildSession(base({ mode: "folder", folderId: "f1", lexemes: [...fresh, ...other.lexemes], states: other.states }));
  assertEquals(alone.tasks.length, 7 * 4);
  const round = plan.tasks.filter((t) => lexOf(t)?.startsWith("nf1"));
  for (const code of ["intro", "R1", "P1", "R2"]) assertEquals(round.filter((t) => t.code === code).length, 7);
  // Первый круг раньше второго у каждого слова.
  for (const t of round.filter((t) => t.code === "intro")) {
    const seq = plan.tasks.filter((x) => lexOf(x) === t.lexemeId).map((x) => x.code);
    assertEquals(seq, ["intro", "R1", "P1", "R2"]);
  }
});

Deno.test("папка: раунд сверх квоты можно — прогноз на завтра растёт", () => {
  const plan = buildSession(base({ mode: "folder", folderId: "f1", lexemes: newWords(7), maxNew: 0 }));
  assertEquals(plan.stats.newTaken, 7);
  assertEquals(plan.stats.newQuota, 0);
  assert(plan.stats.dueTomorrow >= 7);
});

Deno.test("папка: всё свежее — практика трудными форматами", () => {
  const l = [lex("x"), lex("y")];
  const states = { x: { read: st(20, 1), pinyin: st(20, 1) }, y: { read: st(20, 1) } };
  const plan = buildSession(base({ mode: "folder", folderId: "f1", lexemes: l, states }));
  assertEquals(plan.folderMode, "practice");
  assertEquals(plan.tasks.map((t) => t.code).sort(), ["P2", "R2", "R2"]);
});

Deno.test("interleave: блок идёт целиком, зависимость держит задержку", () => {
  const tasks = interleave([
    { key: "i", task: { kind: "intro", lexemeId: "a", code: "intro" }, lexemeId: "a", rank: 0 },
    {
      key: "r",
      task: { kind: "review", lexemeId: "a", skill: "read", code: "R1" },
      lexemeId: "a",
      rank: 1,
      after: { key: "i", gap: 3 },
    },
    { key: "x", task: { kind: "review", lexemeId: "b", skill: "read", code: "R2" }, lexemeId: "b", rank: 2 },
  ]);
  // Других заданий мало — вспоминание всё равно после знакомства.
  assertEquals(tasks.map((t) => t.code), ["intro", "R2", "R1"]);
});

Deno.test("контрастных карточек не больше двух за занятие", () => {
  const due = dueWords(2);
  const pair = (n: number): PlanPair => ({
    id: `p${n}`,
    a: { headword: `a${n}`, reading: null },
    b: { headword: `b${n}`, reading: null },
    lexemeA: null,
    lexemeB: null,
    status: "pending",
    memory: null,
    resolveStreak: 0,
    confusions: 2,
    lastConfusedAt: day(-1),
  });
  const plan = buildSession(base({ lexemes: due.lexemes, states: due.states, pairs: [pair(1), pair(2), pair(3)], minutes: 15 }));
  assertEquals(plan.tasks.filter((t) => t.kind === "pair_card").length, 2);
});
