/**
 * `session-build` (#63): сессия «Сегодня» или учёба по папке.
 *
 * Тело:
 *   { action: "preview" }                         — три плана для окна «Повторим?» и карточка
 *                                                   «Сегодня» над словарём (#66), без записи
 *   { action: "folder_preview", folder_id }       — что предложить на экране папки (#69)
 *   { action: "start", mode: "today", extra_new: true } — «Ещё 7 новых слов» после «Сегодня»
 *   { action: "start", mode: "today", minutes? }  — задания «Сегодня»
 *   { action: "start", mode: "folder", folder_id, folder_mode? }
 *   tz_offset_min? — смещение часов пользователя от UTC (граница дня)
 *
 * Решает чистый `buildSession`; здесь чтение, варианты ответа и билеты.
 * Контракт — `packages/shared/schemas/study.ts`.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.112.4";
import { handler, HandlerError, json, requireUuid } from "../_shared/shared.ts";
import {
  buildExercise,
  buildPairCard,
  buildSession,
  type Candidate,
  estimateMinutes,
  extraNewOffer,
  type FolderMode,
  type FolderModeOffer,
  folderPlan,
  type PlanInput,
  type PlanTask,
  planDigest,
  recallNow,
  todayState,
  withoutOptions,
} from "../_shared/learning/mod.ts";
import {
  issue,
  loadPool,
  must,
  type Row,
  type StudyLexeme,
  studyWord,
} from "../_shared/studyData.ts";
import { loadInput } from "../_shared/studyInput.ts";

const MINUTES = [5, 10, 15] as const;
async function preview(
  admin: SupabaseClient,
  userId: string,
  input: Omit<PlanInput, "mode" | "minutes">,
  defaultMinutes: number,
  day: { today: string; lastPromptOn: string | null },
) {
  const folderNames = new Map(
    (must(await admin.from("user_dictionary_folders").select("id, name").eq("user_id", userId)) as Row[])
      .map((f) => [f.id as string, f.name as string]),
  );
  const built = MINUTES.map((minutes) => ({ minutes, plan: buildSession({ ...input, mode: "today", minutes }) }));
  const plans = built.map(({ minutes, plan }) => {
    const fresh = plan.tasks.filter((t) => t.kind === "intro").length;
    const digest = planDigest(input, plan);
    return {
      minutes,
      due: plan.tasks.length - fresh * 3,
      new: fresh,
      total: plan.tasks.length,
      est_minutes: estimateMinutes(plan.tasks.length, input.pace),
      new_sources: digest.newSources.map((s) => ({
        folder_id: s.folderId,
        folder_name: folderNames.get(s.folderId) ?? "",
        count: s.count,
      })),
      pairs: digest.pairs,
      due_tomorrow: plan.stats.dueTomorrow,
    };
  });
  const budget = MINUTES.includes(defaultMinutes as 5) ? defaultMinutes : 10;
  const chosen = built.find((b) => b.minutes === budget)!.plan;
  const state = todayState(input, chosen);
  return json({
    plans,
    due_now: chosen.stats.dueNow,
    reason: chosen.stats.reason,
    budget_minutes: budget,
    state,
    recall_now: recallNow(input, input.now),
    today: day.today,
    extra_new: extraNew(input, budget),
    // Раз в день, пока сегодня не отвечали и есть что повторить (daily-and-folder-study §2.1).
    show_daily_prompt: state === "ready" && input.reviewedToday.size === 0 && day.lastPromptOn !== day.today,
  });
}

function extraNew(input: Omit<PlanInput, "mode" | "minutes">, minutes: number) {
  const offer = extraNewOffer(input, minutes);
  return offer ? { count: offer.count, tomorrow_delta: offer.tomorrowDelta } : null;
}

function folderPreview(input: Omit<PlanInput, "mode" | "minutes">, folderId: string, minutes: number) {
  const plan = folderPlan(input, folderId, minutes);
  const offer = (o: FolderModeOffer) => ({ mode: o.mode, count: o.count, total_new: o.totalNew, minutes: o.minutes });
  return json({
    primary: plan.primary ? offer(plan.primary) : null,
    alternatives: plan.alternatives.map(offer),
    practice_note: plan.practiceNote,
    load_warning: plan.loadWarning ? { tomorrow_tasks: plan.loadWarning.tomorrowTasks } : null,
  });
}

async function start(
  admin: SupabaseClient,
  userId: string,
  body: Record<string, unknown>,
  input: Omit<PlanInput, "mode" | "minutes">,
  lexemes: StudyLexeme[],
  defaultMinutes: number,
) {
  const minutes = MINUTES.includes(body.minutes as 5) ? (body.minutes as number) : defaultMinutes;
  // «Ещё 7 новых слов» после «Сегодня» — раунд знакомства в папке, где новые слова есть.
  const extra = body.mode !== "folder" && body.extra_new === true ? extraNewOffer(input, minutes) : null;
  const mode = body.mode === "folder" || extra ? "folder" : "today";
  const folderId = extra ? extra.folderId : mode === "folder" ? requireUuid(body, "folder_id") : undefined;
  const folderMode = extra
    ? "new"
    : ["review", "new", "practice"].includes(body.folder_mode as string)
    ? (body.folder_mode as FolderMode)
    : undefined;
  const plan = buildSession({ ...input, mode, minutes, folderId, folderMode });

  const byId = new Map(lexemes.map((l) => [l.id, l]));
  const pools = new Map<string, Promise<Candidate[]>>();
  const pool = (l: StudyLexeme) => {
    if (!pools.has(l.id)) pools.set(l.id, loadPool(admin, userId, l, l.hskLevel));
    return pools.get(l.id)!;
  };
  const ownHeadwords = lexemes.map((l) => l.headword);
  // Первый круг раунда: слова этого раунда в варианты не берём.
  const roundWords = plan.tasks.filter((t) => t.kind === "intro").map((t) => byId.get(t.lexemeId)!.headword);
  const pairById = new Map(input.pairs.map((p) => [p.id, p]));
  const sessionId = crypto.randomUUID();

  let portion = 0;
  let inPortion = 0;
  const portionOf = () => {
    const i = portion;
    if (++inPortion >= (plan.portions[portion] ?? Infinity)) {
      portion++;
      inPortion = 0;
    }
    return i;
  };

  const build = async (t: PlanTask, seed: number) => {
    if (t.kind === "pair_card" || t.kind === "pair") {
      const p = pairById.get(t.pairId)!;
      const side = (id: string | null, w: { headword: string; reading: string | null }) => {
        const l = id ? byId.get(id) : undefined;
        return { lexemeId: id, headword: w.headword, reading: w.reading, translation: l?.translation ?? null };
      };
      const a = side(p.lexemeA, p.a);
      const b = side(p.lexemeB, p.b);
      if (t.kind === "pair_card") return buildPairCard(a, b, p.id);
      // Различение: партнёр — всегда среди вариантов.
      const target = seed % 2 ? a : b;
      const other = target === a ? b : a;
      const l = target.lexemeId ? byId.get(target.lexemeId) : undefined;
      const candidates: Candidate[] = [
        { headword: other.headword, reading: other.reading, gloss: other.translation, source: "pair" },
        ...(l ? await pool(l) : []),
      ];
      return buildExercise({ code: "X1", word: target, candidates, seed, pairId: p.id });
    }
    const l = byId.get(t.lexemeId)!;
    const word = studyWord(l);
    if (t.kind === "intro") return buildExercise({ code: "intro", word, candidates: [], seed, ownHeadwords });
    const needsPool = ["R1", "P1", "W1", "W2"].includes(t.code);
    const candidates = needsPool ? await pool(l) : [];
    const exclude = t.round === 1 ? roundWords : undefined;
    return buildExercise({ code: t.code, word, candidates, seed, exclude }) ??
      (withoutOptions(t.code) ? buildExercise({ code: withoutOptions(t.code)!, word, candidates, seed }) : null);
  };

  const built = await Promise.all(plan.tasks.map((t, i) => build(t, input.seed + i)));
  const exercises = [];
  for (const b of built) {
    // Задание, которое не собрать (нет чтения, мало вариантов для знака), пропускаем.
    if (b) exercises.push(await issue(b, userId, sessionId, portionOf()));
  }
  return json({
    session_id: sessionId,
    mode: plan.mode,
    folder_mode: plan.folderMode,
    exercises,
    portions: rebalance(plan.portions, exercises.length),
    stats: {
      budget: plan.stats.budget,
      due_now: plan.stats.dueNow,
      new_quota: plan.stats.newQuota,
      new_taken: plan.stats.newTaken,
      reason: plan.stats.reason,
      due_tomorrow: plan.stats.dueTomorrow,
    },
  });
}

/** Порции после пропусков: номера порций у заданий уже проставлены, пересчитываем размеры. */
function rebalance(portions: number[], n: number): number[] {
  const total = portions.reduce((a, b) => a + b, 0);
  if (total === n) return portions;
  const out = [...portions];
  let extra = total - n;
  for (let i = out.length - 1; i >= 0 && extra > 0; i--) {
    const cut = Math.min(out[i], extra);
    out[i] -= cut;
    extra -= cut;
  }
  return out.filter((x) => x > 0);
}

Deno.serve(
  handler(async ({ userId, admin, body }) => {
    const { input, lexemes, defaultMinutes, today, lastPromptOn } = await loadInput(admin, userId, body);
    if (body.action === "folder_preview") {
      return folderPreview(input, requireUuid(body, "folder_id"), defaultMinutes);
    }
    if (body.action === "preview") {
      return await preview(admin, userId, input, defaultMinutes, { today, lastPromptOn });
    }
    if (body.action !== "start") throw new HandlerError("invalid_request", 400);
    return await start(admin, userId, body, input, lexemes, defaultMinutes);
  }),
);
