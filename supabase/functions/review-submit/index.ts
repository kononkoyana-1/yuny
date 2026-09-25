/**
 * `review-submit` (#61): ответ на задание → память.
 *
 * Клиент уже показал итог сам (ключ ответа — в задании), а здесь решение
 * окончательное: сервер верит только подписанному билету задания, сам
 * классифицирует ответ, пересчитывает навык, перенос и пары путаницы и пишет
 * всё одной транзакцией (`learning_apply_review`) вместе с журналом.
 *
 * Тело:
 *   { ticket, request_id, answer, latency_ms?, second_try?, device? }
 *   { action: "pair_start", ticket }   — итог блока различения пары
 *
 * Повтор с тем же `request_id` (сеть) не засчитывается второй раз и
 * возвращает тот же исход.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.112.4";
import { handler, HandlerError, json, optionalString, requireString, requireUuid } from "../_shared/shared.ts";
import {
  type Answer,
  buildExercise,
  buildPairCard,
  type Built,
  classify,
  type Classified,
  easierCode,
  explanation,
  resultOutcome,
  type Stage,
  type StudyWord,
  DAY_MS,
  MODEL,
  normalizePinyin,
  type PairWrite,
  planPairStart,
  planSubmit,
  type Skill,
  type StoredPair,
  type StoredSkill,
  type SubmitLexeme,
  type Ticket,
  verifyTicket,
  type WordKey,
  wordStage,
} from "../_shared/learning/mod.ts";
import { issue, loadPool, russianGloss } from "../_shared/studyData.ts";

const CONFUSIONS = ["confusion", "form_similar", "homophone"];
/** Сколько последних верных ответов брать для медианы скорости. */
const MEDIAN_SAMPLE = 50;

function secret(): string {
  const s = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!s) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return s;
}

// ------------------------------------------------------------------ вход

/**
 * Ответ клиента (`StudyAnswerSchema`): `{option_id}`, `{text}`, `{self}`,
 * `{blank}`, `{choice}` — в форму классификатора. Вариант — по номеру в
 * билете: текст варианта знает сервер, а не клиент.
 */
function parseAnswer(raw: unknown, ticket: Ticket): Answer {
  const a = raw as Record<string, unknown> | null;
  const bad = () => new HandlerError("invalid_answer", 400);
  if (!a || typeof a !== "object") throw bad();
  if (typeof a.option_id === "string") {
    const i = Number(a.option_id.replace(/^o/, ""));
    const opt = ticket.options?.[i];
    if (!opt) throw bad();
    return { kind: "choice", value: opt.value };
  }
  if (typeof a.text === "string" && a.text.length <= 200) return { kind: "pinyin", text: a.text };
  if (a.self === "recalled" || a.self === "forgot") return { kind: "self", remembered: a.self === "recalled" };
  if (a.choice === "ok" || a.choice === "know" || a.choice === "remember") return { kind: "seen" };
  if (a.blank === true) {
    if (ticket.options) return { kind: "choice", value: null };
    if (ticket.exercise === "R2") return { kind: "self", remembered: false };
    if (ticket.expected_orders) return { kind: "order", tokens: [] };
    return { kind: "pinyin", text: "" };
  }
  switch (a.kind) {
    case "seen":
      return { kind: "seen" };
    case "self":
      if (typeof a.remembered !== "boolean") throw bad();
      return { kind: "self", remembered: a.remembered };
    case "pinyin":
      if (typeof a.text !== "string" || a.text.length > 200) throw bad();
      return { kind: "pinyin", text: a.text };
    case "choice":
      if (a.value !== null && (typeof a.value !== "string" || a.value.length > 300)) throw bad();
      return { kind: "choice", value: a.value as string | null };
    case "order":
      if (!Array.isArray(a.tokens) || a.tokens.length > 40 || !a.tokens.every((t) => typeof t === "string")) {
        throw bad();
      }
      return { kind: "order", tokens: a.tokens as string[] };
    default:
      throw bad();
  }
}

function answerText(a: Answer): string | null {
  switch (a.kind) {
    case "seen":
      return null;
    case "self":
      return a.remembered ? "remembered" : "forgot";
    case "pinyin":
      return a.text;
    case "choice":
      return a.value;
    case "order":
      return a.tokens.join(" ");
  }
}

function latency(raw: unknown): number | null {
  return typeof raw === "number" && Number.isFinite(raw) && raw >= 0 && raw <= 600_000 ? Math.round(raw) : null;
}

// ---------------------------------------------------------------- чтение

const toDate = (v: string | null) => (v ? new Date(v) : null);

// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;

function toSkill(r: Row): StoredSkill {
  return {
    stability: r.stability,
    difficulty: r.difficulty,
    lastReview: toDate(r.last_review),
    due: new Date(r.due),
    reps: r.reps,
    lapses: r.lapses,
    contextsPassed: r.contexts_passed,
    unlockedAt: new Date(r.unlocked_at),
  };
}

function toPair(r: Row): StoredPair {
  return {
    id: r.id,
    a: { headword: r.headword_a, reading: r.reading_a },
    b: { headword: r.headword_b, reading: r.reading_b },
    lexemeA: r.lexeme_a,
    lexemeB: r.lexeme_b,
    status: r.status,
    resolveStreak: r.resolve_streak,
    memory: r.stability == null ? null : {
      stability: r.stability,
      difficulty: r.difficulty,
      lastReview: toDate(r.last_review),
      due: new Date(r.due),
      reps: 0,
      lapses: 0,
    },
  };
}

function must<T>(res: { data: T; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data;
}

async function loadLexeme(admin: SupabaseClient, userId: string, id: string | null): Promise<SubmitLexeme | null> {
  if (!id) return null;
  const row = must(
    await admin.from("learning_lexemes")
      .select("id, headword, reading, goal, dictionary_entries(hsk_level)")
      .eq("user_id", userId).eq("id", id).maybeSingle(),
  ) as Row | null;
  if (!row) return null;
  return {
    id: row.id,
    headword: row.headword,
    reading: row.reading,
    goal: row.goal,
    hskLevel: row.dictionary_entries?.hsk_level ?? null,
  };
}

async function loadSkills(admin: SupabaseClient, lexemeId: string | null) {
  const out: Partial<Record<Skill, StoredSkill>> = {};
  if (!lexemeId) return out;
  const rows = must(await admin.from("skill_states").select("*").eq("lexeme_id", lexemeId)) as Row[];
  for (const r of rows) out[r.skill as Skill] = toSkill(r);
  return out;
}

/** Пары со словом (по лексеме или по заголовку — партнёр мог быть не в словаре) и пара билета. */
async function loadPairs(admin: SupabaseClient, userId: string, ticket: Ticket): Promise<StoredPair[]> {
  const q = (s: string) => `"${s.replace(/["\\]/g, "")}"`;
  const ors = [`headword_a.eq.${q(ticket.target.headword)}`, `headword_b.eq.${q(ticket.target.headword)}`];
  if (ticket.lexeme_id) ors.push(`lexeme_a.eq.${ticket.lexeme_id}`, `lexeme_b.eq.${ticket.lexeme_id}`);
  if (ticket.pair_id) ors.push(`id.eq.${ticket.pair_id}`);
  const rows = must(await admin.from("confusion_pairs").select("*").eq("user_id", userId).or(ors.join(","))) as Row[];
  return rows.map(toPair);
}

/** Слова словаря, среди которых классификатор ищет партнёра путаницы. */
async function loadKnown(admin: SupabaseClient, userId: string, ticket: Ticket, answer: Answer): Promise<WordKey[]> {
  if (answer.kind === "choice" && ticket.options?.length) {
    const heads = [...new Set(ticket.options.map((o) => o.headword))];
    return must(
      await admin.from("learning_lexemes").select("headword, reading").eq("user_id", userId).in("headword", heads),
    ) as WordKey[];
  }
  if (answer.kind === "pinyin" && normalizePinyin(answer.text)) {
    // Набрал чтение другого своего слова — ищем по чтениям словаря. PostgREST
    // отдаёт не больше 1000 строк: у большого словаря берём самые свежие.
    return must(
      await admin.from("learning_lexemes").select("headword, reading").eq("user_id", userId)
        .not("reading", "is", null).order("created_at", { ascending: false }).limit(1000),
    ) as WordKey[];
  }
  return [];
}

async function medianLatency(admin: SupabaseClient, userId: string, exercise: string): Promise<number | null> {
  const rows = must(
    await admin.from("review_events").select("latency_ms").eq("user_id", userId).eq("exercise", exercise)
      .eq("outcome", "ok").not("latency_ms", "is", null)
      .order("created_at", { ascending: false }).limit(MEDIAN_SAMPLE),
  ) as Row[];
  if (rows.length < 5) return null;
  const xs = rows.map((r) => r.latency_ms as number).sort((a, b) => a - b);
  return xs[Math.floor(xs.length / 2)];
}

async function partnerLexemeId(admin: SupabaseClient, userId: string, w: WordKey): Promise<string | null> {
  let q = admin.from("learning_lexemes").select("id").eq("user_id", userId).eq("headword", w.headword);
  q = w.reading === null ? q.is("reading", null) : q.eq("reading", w.reading);
  const row = must(await q.maybeSingle()) as Row | null;
  return row?.id ?? null;
}

/** Когда за окно путали эти два слова — в любую сторону. */
async function confusionDates(
  admin: SupabaseClient,
  userId: string,
  now: Date,
  target: { lexemeId: string; headword: string },
  partner: { lexemeId: string | null; headword: string },
): Promise<Date[]> {
  const from = new Date(now.getTime() - MODEL.pair.windowDays * DAY_MS).toISOString();
  const q = (s: string) => `"${s.replace(/["\\]/g, "")}"`;
  const sides = [`and(lexeme_id.eq.${target.lexemeId},partner.eq.${q(partner.headword)})`];
  if (partner.lexemeId) sides.push(`and(lexeme_id.eq.${partner.lexemeId},partner.eq.${q(target.headword)})`);
  const rows = must(
    await admin.from("review_events").select("created_at").eq("user_id", userId)
      .gte("created_at", from).in("outcome", CONFUSIONS).or(sides.join(",")),
  ) as Row[];
  return rows.map((r) => new Date(r.created_at));
}

// ---------------------------------------------------------------- запись

const iso = (d: Date | null) => (d ? d.toISOString() : null);

function pairPayload(w: PairWrite) {
  const m = w.state?.memory ?? null;
  return {
    id: w.id,
    headword_a: w.a.headword,
    reading_a: w.a.reading,
    headword_b: w.b.headword,
    reading_b: w.b.reading,
    lexeme_a: w.lexemeA,
    lexeme_b: w.lexemeB,
    inc_ab: w.incAB,
    inc_ba: w.incBA,
    confused_at: iso(w.confusedAt),
    set_state: w.state !== null,
    status: w.state?.status ?? null,
    stability: m?.stability ?? null,
    difficulty: m?.difficulty ?? null,
    last_review: iso(m?.lastReview ?? null),
    due: iso(m?.due ?? null),
    resolve_streak: w.state?.resolveStreak ?? 0,
  };
}

async function apply(admin: SupabaseClient, payload: Record<string, unknown>) {
  const { data, error } = await admin.rpc("learning_apply_review", { p: payload });
  if (error) return { error: error as { code?: string } };
  return { data: data as { duplicate: boolean; pair_ids: string[] } };
}

// ---------------------------------------------------------------- ответ

async function stageNow(admin: SupabaseClient, userId: string, ticket: Ticket, now: Date) {
  const lexeme = await loadLexeme(admin, userId, ticket.lexeme_id);
  if (!lexeme) return null;
  const [skills, pairs] = await Promise.all([loadSkills(admin, lexeme.id), loadPairs(admin, userId, ticket)]);
  return wordStage(skills, {
    now,
    goal: lexeme.goal,
    activePair: pairs.some((p) => p.status === "active" && (p.lexemeA === lexeme.id || p.lexemeB === lexeme.id)),
  });
}

/** Повтор запроса: исход из журнала, стадия — по памяти сейчас. */
async function duplicateResponse(admin: SupabaseClient, userId: string, requestId: string, ticket: Ticket, now: Date) {
  const ev = must(
    await admin.from("review_events").select("outcome, partner, expected").eq("user_id", userId)
      .eq("request_id", requestId).maybeSingle(),
  ) as Row | null;
  if (!ev) return null;
  return json({
    outcome: ev.outcome === "seen" ? "seen" : ev.outcome === "ok" ? "correct" : ev.outcome === "tone" ? "partial" : "wrong",
    correct: { text: ev.expected },
    error_type: ev.outcome === "ok" || ev.outcome === "seen" ? null : ev.outcome,
    partner: ev.partner ? { headword: ev.partner, reading: null, meaning: null } : null,
    explanation: [],
    next: [],
    stage: await stageNow(admin, userId, ticket, now),
    known: false,
    duplicate: true,
  });
}

/** Значение партнёра путаницы: его лексема или словарь. */
async function meaningOf(admin: SupabaseClient, userId: string, w: WordKey, lexemeId: string | null) {
  if (lexemeId) {
    const l = must(await admin.from("learning_lexemes").select("translation").eq("user_id", userId).eq("id", lexemeId)
      .maybeSingle()) as Row | null;
    if (l?.translation) return l.translation.split(";")[0].trim() as string;
  }
  let q = admin.from("dictionary_entries").select("compact").eq("headword", w.headword);
  q = w.reading === null ? q.is("reading", null) : q.eq("reading", w.reading);
  const e = must(await q.limit(1).maybeSingle()) as Row | null;
  return russianGloss(e?.compact);
}

interface ResultCtx {
  partnerLexemeId: string | null;
  wantsKnowCheck: boolean;
  interventionPairId: string | null;
  known: boolean;
  lexeme: SubmitLexeme | null;
}

/** Результат ответа (`AnswerResultSchema`) и вставленные задания. */
async function result(
  admin: SupabaseClient,
  userId: string,
  ticket: Ticket,
  classified: Classified,
  stage: Stage | null,
  ctx: ResultCtx,
) {
  const lex = ctx.lexeme;
  const word: StudyWord = {
    lexemeId: ticket.lexeme_id,
    headword: ticket.target.headword,
    reading: ticket.target.reading,
    translation: lex ? (await meaningOf(admin, userId, ticket.target, lex.id)) : null,
  };
  const p = classified.partner;
  const partnerMeaning = p ? await meaningOf(admin, userId, p, ctx.partnerLexemeId) : null;
  const outcome = resultOutcome(classified);
  const rightIndex = ticket.options?.findIndex((o) => o.headword === word.headword && o.reading === word.reading) ?? -1;

  const next: Built[] = [];
  const seed = Math.floor(Math.random() * 2 ** 31);
  const pool = async () => (lex ? await loadPool(admin, userId, word, lex.hskLevel) : []);
  if (ctx.wantsKnowCheck) {
    // «Уже знаю»: трудная проверка — вспомнить значение и набрать пиньинь.
    for (const code of ["R2", "P2"] as const) {
      const b = buildExercise({ code, word, candidates: [], seed, check: "known" });
      if (b) next.push(b);
    }
  } else if (outcome !== "correct" && outcome !== "seen" && !ticket.retry && !ticket.check &&
    !ticket.exercise.startsWith("X")) {
    // Переобучение: это же слово ещё раз, лёгким форматом, через пару заданий.
    const code = easierCode(ticket.exercise);
    const b = code ? buildExercise({ code, word, candidates: await pool(), seed, retry: true }) : null;
    if (b) next.push(b);
  }
  if (ctx.interventionPairId && p) {
    // Вторая путаница за 30 дней — карточка пары и три задания на различение.
    const partner: StudyWord = { lexemeId: ctx.partnerLexemeId, ...p, translation: partnerMeaning };
    next.push(buildPairCard(word, partner, ctx.interventionPairId));
    const candidates = await pool();
    for (let i = 0; i < 3; i++) {
      const [t, o] = i % 2 ? [partner, word] : [word, partner];
      const b = buildExercise({
        code: "X1",
        word: t,
        candidates: [{ headword: o.headword, reading: o.reading, gloss: o.translation, source: "pair" }, ...candidates],
        seed: seed + i,
        pairId: ctx.interventionPairId,
      });
      if (b) next.push(b);
    }
  }

  return {
    outcome,
    correct: { ...(rightIndex >= 0 ? { option_id: `o${rightIndex}` } : {}), text: ticket.expected },
    error_type: classified.grade?.kind === "error" ? classified.grade.error : null,
    partner: p ? { headword: p.headword, reading: p.reading, meaning: partnerMeaning } : null,
    explanation: explanation(classified, word, partnerMeaning),
    next: await Promise.all(next.map((b) => issue(b, userId, ticket.session_id, 0))),
    stage,
    known: ctx.known,
    duplicate: false,
  };
}

async function submit(admin: SupabaseClient, userId: string, ticket: Ticket, body: Record<string, unknown>) {
  const requestId = requireUuid(body, "request_id");
  const answer = parseAnswer(body.answer, ticket);
  const latencyMs = latency(body.latency_ms);
  const now = new Date();

  const early = await duplicateResponse(admin, userId, requestId, ticket, now);
  if (early) return early;

  // Два ответа по одному слову наперегонки — перечитать и посчитать заново.
  for (let attempt = 0; attempt < 3; attempt++) {
    const [lexeme, skills, pairs, known, medianMs, settings] = await Promise.all([
      loadLexeme(admin, userId, ticket.lexeme_id),
      loadSkills(admin, ticket.lexeme_id),
      loadPairs(admin, userId, ticket),
      loadKnown(admin, userId, ticket, answer),
      medianLatency(admin, userId, ticket.exercise),
      admin.from("learning_settings").select("retention").eq("user_id", userId).maybeSingle(),
    ]);
    if (ticket.lexeme_id && !lexeme) throw new HandlerError("lexeme_not_found", 404);

    const classified = classify({
      target: ticket.target,
      answer,
      options: ticket.options,
      expectedOrders: ticket.expected_orders,
      known,
      secondTry: body.second_try === true,
      latencyMs,
      medianMs,
    });

    const partner = classified.partner;
    const partnerLex = partner ? await partnerLexemeId(admin, userId, partner) : null;
    const partnerConfusions = partner && lexeme && CONFUSIONS.includes(classified.outcome)
      ? await confusionDates(admin, userId, now, { lexemeId: lexeme.id, headword: lexeme.headword }, { lexemeId: partnerLex, headword: partner.headword })
      : [];

    const plan = planSubmit({
      now,
      ticket,
      classified,
      lexeme,
      skills,
      pairs,
      partnerConfusions,
      partnerLexemeId: partnerLex,
      retention: (settings.data as Row | null)?.retention ?? MODEL.retention,
    });

    const res = await apply(admin, {
      user_id: userId,
      request_id: requestId,
      session_id: ticket.session_id,
      lexeme_id: ticket.lexeme_id,
      skill: plan.skill,
      exercise: ticket.exercise,
      prompt: ticket.prompt ?? {},
      options: ticket.options?.map((o) => o.value) ?? null,
      expected: ticket.expected,
      answer: answerText(answer),
      outcome: classified.outcome,
      partner: partner?.headword ?? null,
      latency_ms: latencyMs,
      rating: plan.rating,
      r_before: plan.before?.r ?? null,
      s_before: plan.before?.s ?? null,
      s_after: plan.after?.s ?? null,
      d_before: plan.before?.d ?? null,
      d_after: plan.after?.d ?? null,
      device: optionalString(body, "device")?.slice(0, 32) ?? null,
      event_pair_id: plan.eventPairId,
      event_pair_write: plan.eventPairWrite,
      skills: plan.skillWrites.map((w) => ({
        skill: w.skill,
        reps_before: w.repsBefore,
        stability: w.state.stability,
        difficulty: w.state.difficulty,
        last_review: iso(w.state.lastReview),
        due: iso(w.state.due),
        reps: w.state.reps,
        lapses: w.state.lapses,
        contexts_passed: w.state.contextsPassed,
        unlocked_at: iso(w.state.unlockedAt),
      })),
      pairs: plan.pairWrites.map(pairPayload),
    });

    if (res.error?.code === "40001") continue;
    if (res.error?.code === "23505") {
      const dup = await duplicateResponse(admin, userId, requestId, ticket, now);
      if (dup) return dup;
    }
    if (res.error) throw res.error;
    if (res.data!.duplicate) {
      const dup = await duplicateResponse(admin, userId, requestId, ticket, now);
      if (dup) return dup;
    }

    const pairId = plan.interventionWrite === null ? null : res.data!.pair_ids[plan.interventionWrite];
    const knownNow = ticket.check === "known" && plan.skillWrites.length > 0 &&
      (["read", "pinyin"] as const).every((k) => skills[k] || plan.skillWrites.some((w) => w.skill === k));
    return json(
      await result(admin, userId, ticket, classified, plan.stage, {
        partnerLexemeId: partnerLex,
        wantsKnowCheck: (body.answer as Row)?.choice === "know" && ticket.exercise === "intro" && !!lexeme,
        interventionPairId: pairId,
        known: knownNow,
        lexeme,
      }),
    );
  }
  throw new HandlerError("busy_retry", 409);
}

/** Итог блока различения: по ответам на задания пары в этой сессии из журнала. */
async function pairStart(admin: SupabaseClient, userId: string, ticket: Ticket) {
  if (!ticket.pair_id) throw new HandlerError("invalid_request", 400);
  const pair = must(
    await admin.from("confusion_pairs").select("*").eq("user_id", userId).eq("id", ticket.pair_id).maybeSingle(),
  ) as Row | null;
  if (!pair) throw new HandlerError("pair_not_found", 404);
  const answers = must(
    await admin.from("review_events").select("outcome").eq("user_id", userId)
      .eq("session_id", ticket.session_id).eq("pair_id", ticket.pair_id).like("exercise", "X%"),
  ) as Row[];
  const write = planPairStart(toPair(pair), answers.map((a) => ({ ok: a.outcome === "ok" })), new Date());
  if (!write) return json({ status: pair.status, started: false });
  const m = write.state!.memory!;
  // Только память и статус пары, и только если она всё ещё pending (повтор — ничего).
  const updated = must(
    await admin.from("confusion_pairs").update({
      status: write.state!.status,
      stability: m.stability,
      difficulty: m.difficulty,
      last_review: iso(m.lastReview),
      due: iso(m.due),
      resolve_streak: 0,
    }).eq("user_id", userId).eq("id", ticket.pair_id).eq("status", "pending").select("id"),
  ) as Row[];
  return json({ status: write.state!.status, started: updated.length > 0 });
}

Deno.serve(
  handler(async ({ userId, admin, body }) => {
    const token = typeof body.task_id === "string" ? body.task_id : requireString(body, "ticket");
    const ticket = await verifyTicket(token, secret(), userId, new Date());
    if (typeof ticket === "string") throw new HandlerError(ticket, ticket === "ticket_foreign" ? 403 : 400);
    if (body.action === "pair_start") return await pairStart(admin, userId, ticket);
    return await submit(admin, userId, ticket, body);
  }),
);
