/**
 *   cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test _shared/learning/
 */
import { assert, assertEquals, assertNotEquals } from "jsr:@std/assert@1";

import {
  classify,
  DAY_MS,
  type OptionMeta,
  planPairStart,
  planSubmit,
  signTicket,
  type StoredPair,
  type StoredSkill,
  type SubmitInput,
  type Ticket,
  verifyTicket,
} from "./mod.ts";

const T0 = new Date("2026-09-24T09:00:00Z");
const day = (n: number) => new Date(T0.getTime() + n * DAY_MS);

const MAI3 = { headword: "买", reading: "mǎi" };
const MAI4 = { headword: "卖", reading: "mài" };
const LEX = { id: "lex-mai3", headword: "买", reading: "mǎi", goal: "full" as const, hskLevel: 1 };

const OPTIONS: OptionMeta[] = [
  { value: "покупать", ...MAI3 },
  { value: "продавать", ...MAI4 },
  { value: "есть", headword: "吃", reading: "chī" },
  { value: "пить", headword: "喝", reading: "hē" },
];

function ticket(over: Partial<Ticket> = {}): Ticket {
  return {
    v: 1,
    uid: "u1",
    session_id: "s1",
    exercise: "R1",
    lexeme_id: LEX.id,
    pair_id: null,
    target: MAI3,
    options: OPTIONS,
    expected: "покупать",
    exp: T0.getTime() + DAY_MS,
    ...over,
  };
}

function skill(stability: number, lastReview: Date, reps = 2): StoredSkill {
  return {
    stability,
    difficulty: 5,
    lastReview,
    due: new Date(lastReview.getTime() + stability * DAY_MS),
    reps,
    lapses: 0,
    contextsPassed: 0,
    unlockedAt: T0,
  };
}

function input(over: Partial<SubmitInput> & { value?: string }): SubmitInput {
  const t = over.ticket ?? ticket();
  return {
    now: T0,
    ticket: t,
    classified: over.classified ?? classify({
      target: t.target,
      answer: { kind: "choice", value: over.value ?? "покупать" },
      options: t.options,
      known: [MAI3, MAI4],
    }),
    lexeme: LEX,
    skills: {},
    pairs: [],
    partnerConfusions: [],
    partnerLexemeId: "lex-mai4",
    retention: 0.9,
    ...over,
  };
}

function activePair(over: Partial<StoredPair> = {}): StoredPair {
  // canonicalPair: 买 (U+4E70) < 卖 (U+5356) → A = 买.
  return {
    id: "pair-1",
    a: MAI3,
    b: MAI4,
    lexemeA: "lex-mai3",
    lexemeB: "lex-mai4",
    status: "active",
    resolveStreak: 0,
    memory: { stability: 2, difficulty: 6, lastReview: day(-2), due: day(0), reps: 1, lapses: 0 },
    ...over,
  };
}

// ---------------------------------------------------------------- навык

Deno.test("первый верный ответ создаёт навык «Читаю» и слово в стадии «знакомство»", () => {
  const plan = planSubmit(input({}));
  assertEquals(plan.skill, "read");
  assertEquals(plan.rating, 3);
  assertEquals(plan.skillWrites.length, 1);
  assertEquals(plan.skillWrites[0].repsBefore, null);
  assertEquals(plan.skillWrites[0].state.reps, 1);
  assertEquals(plan.before, null);
  assertEquals(plan.stage, "meeting");
});

Deno.test("стадия до ответа: первый верный ответ — «новое» → «знакомство», пара не решена", () => {
  const plan = planSubmit(input({}));
  assertEquals(plan.stageBefore, "new");
  assertEquals(plan.stage, "meeting");
  assertEquals(plan.pairResolved, null);
});

Deno.test("знак от 10 черт — стартовая сложность на единицу выше", () => {
  const plain = planSubmit(input({})).after!.d;
  assertEquals(planSubmit(input({ lexeme: { ...LEX, strokes: 8 } })).after!.d, plain);
  assert(Math.abs(planSubmit(input({ lexeme: { ...LEX, strokes: 12 } })).after!.d - plain - 1) < 0.2);
});

Deno.test("повтор навыка пишется с проверкой reps — защита от гонки двух ответов", () => {
  const plan = planSubmit(input({ skills: { read: skill(2, day(-2), 4) } }));
  assertEquals(plan.skillWrites[0].repsBefore, 4);
  assertEquals(plan.skillWrites[0].state.reps, 5);
  assert(plan.after!.s > 2);
  assert(plan.before!.r > 0.8 && plan.before!.r < 1);
});

Deno.test("знакомство со словом не трогает память", () => {
  const t = ticket({ exercise: "intro", options: undefined });
  const plan = planSubmit(input({ ticket: t, classified: classify({ target: MAI3, answer: { kind: "seen" } }) }));
  assertEquals(plan.skillWrites, []);
  assertEquals(plan.rating, null);
  assertEquals(plan.stage, "new");
});

Deno.test("успех в предложении — «Использую» +1 контекст и слабое повторение «Читаю» и «Пиньинь»", () => {
  const t = ticket({ exercise: "C2" });
  const plan = planSubmit(input({
    ticket: t,
    skills: { read: skill(5, day(-3)), pinyin: skill(4, day(-3)), use: skill(1.5, day(-2)) },
  }));
  const bySkill = Object.fromEntries(plan.skillWrites.map((w) => [w.skill, w.state]));
  assertEquals(plan.skill, "use");
  assertEquals(bySkill.use.contextsPassed, 1);
  assert(bySkill.read.stability > 5);
  assert(bySkill.pinyin.stability > 4);
});

Deno.test("пропуск с выбором (C1) — память «Использую» растёт, но контекст не засчитан: это узнавание", () => {
  const plan = planSubmit(input({
    ticket: ticket({ exercise: "C1" }),
    skills: { read: skill(5, day(-3)), pinyin: skill(4, day(-3)), use: skill(1.5, day(-2)) },
  }));
  const use = plan.skillWrites.find((w) => w.skill === "use")!.state;
  assert(use.stability > 1.5);
  assertEquals(use.contextsPassed, 0);
});

Deno.test("перенос не чаще раза в сутки на навык", () => {
  const t = ticket({ exercise: "C1" });
  const plan = planSubmit(input({ ticket: t, skills: { read: skill(5, day(-0.5)), use: skill(1.5, day(-2)) } }));
  assertEquals(plan.skillWrites.map((w) => w.skill), ["use"]);
});

// ---------------------------------------------------------------- пары

Deno.test("первая путаница 买→卖 заводит пару pending, count_ab, без интервенции", () => {
  const plan = planSubmit(input({ value: "продавать", skills: { read: skill(2, day(-2)) } }));
  assertEquals(plan.pairWrites.length, 1);
  const w = plan.pairWrites[0];
  assertEquals([w.id, w.a, w.b, w.incAB, w.incBA, w.state], [null, MAI3, MAI4, 1, 0, null]);
  assertEquals([w.lexemeA, w.lexemeB], ["lex-mai3", "lex-mai4"]);
  assertEquals(plan.eventPairWrite, 0);
  assertEquals(plan.interventionWrite, null);
  // Путаница бьёт мягче, чем «забыл»: × 0.5.
  assertEquals(plan.after!.s, 1);
});

Deno.test("вторая путаница за 30 дней — пора контрастная карточка", () => {
  const plan = planSubmit(input({ value: "продавать", partnerConfusions: [day(-10)] }));
  assertEquals(plan.interventionWrite, 0);
});

Deno.test("путаница 30+ дней назад не считается", () => {
  const plan = planSubmit(input({ value: "продавать", partnerConfusions: [day(-31)] }));
  assertEquals(plan.interventionWrite, null);
});

Deno.test("спутал слово, чья пара в расписании, — пара провалена и снова ограничивает интервалы", () => {
  const pair = activePair({ status: "watch", resolveStreak: 2, memory: { ...activePair().memory!, stability: 9 } });
  const plan = planSubmit(input({ value: "продавать", pairs: [pair], skills: { read: skill(8, day(-8)) } }));
  const w = plan.pairWrites[0];
  assertEquals(w.id, "pair-1");
  assertEquals(w.state!.status, "active");
  assertEquals(w.state!.resolveStreak, 0);
  assertEquals(plan.interventionWrite, null);
});

Deno.test("партнёр среди вариантов и выбран верный — пара проверена; интервал слова не дальше срока пары", () => {
  const pair = activePair();
  const plan = planSubmit(input({ pairs: [pair], skills: { read: skill(10, day(-10)) } }));
  assertEquals(plan.pairWrites.length, 1);
  const pw = plan.pairWrites[0].state!;
  assert(pw.memory!.stability > 2);
  const read = plan.skillWrites[0].state;
  assert(pw.memory!.stability < 7);
  assertEquals(read.due.getTime(), pw.memory!.due.getTime());
});

Deno.test("задание на пару (X1) в расписании обновляет пару, не навык", () => {
  const t = ticket({ exercise: "X1", pair_id: "pair-1" });
  const plan = planSubmit(input({ ticket: t, pairs: [activePair()] }));
  assertEquals(plan.skill, null);
  assertEquals(plan.skillWrites, []);
  assertEquals(plan.eventPairId, "pair-1");
  assertEquals(plan.pairWrites.length, 1);
});

Deno.test("задание на пару в блоке различения (pending) — только журнал", () => {
  const t = ticket({ exercise: "X1", pair_id: "pair-1" });
  const plan = planSubmit(input({ ticket: t, pairs: [activePair({ status: "pending", memory: null })] }));
  assertEquals(plan.pairWrites, []);
  assertEquals(plan.eventPairId, "pair-1");
});

Deno.test("итог блока различения: 3 из 4 — пара в расписании со скидкой; повторно — ничего", () => {
  const pending = activePair({ status: "pending", memory: null });
  const w = planPairStart(pending, [{ ok: true }, { ok: true }, { ok: false }, { ok: true }], T0)!;
  assertEquals(w.state!.status, "active");
  assert(w.state!.memory!.stability < 2.5);
  assertEquals(planPairStart(activePair(), [{ ok: true }], T0), null);
  assertEquals(planPairStart(pending, [], T0), null);
});

// ---------------------------------------------------------------- билет

Deno.test("билет: подпись проверяется, чужой и просроченный отклоняются", async () => {
  const token = await signTicket(ticket(), "secret");
  const ok = await verifyTicket(token, "secret", "u1", T0);
  assertEquals(typeof ok === "object" && ok.target, MAI3);
  assertEquals(await verifyTicket(token, "other", "u1", T0), "ticket_invalid");
  assertEquals(await verifyTicket(token, "secret", "u2", T0), "ticket_foreign");
  assertEquals(await verifyTicket(token, "secret", "u1", day(2)), "ticket_expired");
});

Deno.test("билет: подменённый ответ не проходит", async () => {
  const token = await signTicket(ticket(), "secret");
  const [body, sig] = token.split(".");
  const forged = JSON.parse(atob(body.replace(/-/g, "+").replace(/_/g, "/")));
  forged.expected = "продавать";
  const forgedBody = btoa(unescape(encodeURIComponent(JSON.stringify(forged))))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  assertNotEquals(forgedBody, body);
  assertEquals(await verifyTicket(`${forgedBody}.${sig}`, "secret", "u1", T0), "ticket_invalid");
  assertEquals(await verifyTicket("garbage", "secret", "u1", T0), "ticket_invalid");
});

// ---------------------------------------------------------- повтор и «Уже знаю»

Deno.test("повтор после ошибки в сессии не трогает расписание", () => {
  const plan = planSubmit(input({ ticket: ticket({ retry: true }), skills: { read: skill(2, day(-2)) } }));
  assertEquals(plan.skillWrites, []);
  assertEquals(plan.rating, 3);
});

Deno.test("«Уже знаю»: проверка пройдена — навык со стабильностью 7", () => {
  const t = ticket({ exercise: "R2", options: undefined, check: "known" });
  const plan = planSubmit(input({
    ticket: t,
    classified: classify({ target: MAI3, answer: { kind: "self", remembered: true } }),
  }));
  assertEquals(plan.skillWrites.length, 1);
  assertEquals(plan.skillWrites[0].state.stability, 7);
  assertEquals(plan.skillWrites[0].repsBefore, null);
});

Deno.test("«Уже знаю»: не прошёл — память не трогаем", () => {
  const t = ticket({ exercise: "P2", options: undefined, check: "known" });
  const plan = planSubmit(input({
    ticket: t,
    classified: classify({ target: MAI3, answer: { kind: "pinyin", text: "mai4" } }),
  }));
  assertEquals(plan.skillWrites, []);
});
