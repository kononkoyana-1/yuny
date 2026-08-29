/**
 * `assessment-next` (TZ.md §6) — serves one question at a time for screen 06,
 * now adaptively (docs/onboarding-v2.md §5).
 *
 * Questions come from the server-side bank so `correct_index` never crosses
 * the wire: the client has no SELECT right on `assessment_questions` at all.
 *
 * State split, deliberately: `assessment_sessions` holds what cannot be
 * derived (the declared band, when the run started), and the answers
 * themselves are re-read from `assessment_answers` every call. That keeps
 * one source of truth for what was answered and lets a learner close the app
 * mid-assessment and come back without losing the ladder's position.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { declaredToBand, isCefrLevel, type CefrLevel } from "../_shared/cefr.ts";
import { BUDGET_SECONDS, nextStep, type LadderAnswer } from "../_shared/ladder.ts";
import { handler, HandlerError, json, requireUuid } from "../_shared/shared.ts";

interface BankRow {
  id: string;
  skill: string;
  prompt: string;
  options: string[];
  cefr_level: string | null;
}

Deno.serve(
  handler(async ({ userId, admin, body }) => {
    const goalId = requireUuid(body, "goal_id");

    const { data: goal } = await admin
      .from("goals")
      .select("id, target_language, declared_cefr")
      .eq("id", goalId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!goal) throw new HandlerError("goal_not_found", 404);

    const language = goal.target_language as string;
    const declared = declaredToBand(goal.declared_cefr);

    // --- session ---------------------------------------------------------
    let { data: session } = await admin
      .from("assessment_sessions")
      .select("id, declared_cefr, started_at, served_count, status")
      .eq("goal_id", goalId)
      .eq("status", "active")
      .maybeSingle();

    if (!session) {
      const { data: created, error } = await admin
        .from("assessment_sessions")
        .insert({
          user_id: userId,
          goal_id: goalId,
          declared_cefr: declared,
          current_cefr: declared,
          budget_seconds: BUDGET_SECONDS,
        })
        .select("id, declared_cefr, started_at, served_count, status")
        .single();
      if (error || !created) throw new HandlerError("assessment_session_failed", 500);
      session = created;
    }

    // --- what has been answered so far -----------------------------------
    //
    // Graded here rather than trusted from the client: `correct_index` lives
    // server-side and the ladder's next step depends on it (TZ.md §3 Rule 1).
    const { data: answerRows } = await admin
      .from("assessment_answers")
      .select("question_id, selected_index, assessment_questions(cefr_level, correct_index)")
      .eq("goal_id", goalId);

    const answered = new Set<string>();
    const ladderAnswers: LadderAnswer[] = [];
    for (const row of (answerRows ?? []) as {
      question_id: string;
      selected_index: number;
      assessment_questions: { cefr_level: string | null; correct_index: number } | null;
    }[]) {
      answered.add(row.question_id);
      const q = row.assessment_questions;
      if (!q || !isCefrLevel(q.cefr_level)) continue;
      ladderAnswers.push({ level: q.cefr_level, correct: row.selected_index === q.correct_index });
    }

    const elapsedSeconds = Math.max(
      0,
      Math.floor((Date.now() - new Date(session.started_at as string).getTime()) / 1000),
    );

    const step = nextStep({ declared, answers: ladderAnswers, elapsedSeconds });

    if (step.done) {
      await admin
        .from("assessment_sessions")
        .update({ status: "complete", ended_at: new Date().toISOString() })
        .eq("id", session.id);
      return json({ done: true, question: null });
    }

    // --- pick a question at the band the ladder asked for -----------------
    const question = await pickQuestion(admin, language, step.serve, answered);
    if (!question) {
      // The bank cannot serve this band. Ending here beats serving a
      // question from the wrong band and recording it as evidence about one
      // the learner was never asked about.
      await admin
        .from("assessment_sessions")
        .update({ status: "complete", ended_at: new Date().toISOString() })
        .eq("id", session.id);
      return json({ done: true, question: null });
    }

    await admin
      .from("assessment_sessions")
      .update({ current_cefr: step.serve, served_count: (session.served_count as number) + 1 })
      .eq("id", session.id);

    return json({
      done: false,
      question: {
        id: question.id,
        skill: question.skill,
        prompt: question.prompt,
        options: question.options,
      },
    });
  }),
);

/**
 * One unseen question at `band`, preferring the learner's own language and
 * the least-used skill so a run does not turn into nine vocabulary items.
 *
 * The widening fallbacks are a standing requirement, not a stopgap: content
 * coverage is uneven by band and will stay that way for any newly added
 * language (docs/plan-tasks.md, stage 5). Serving nothing would strand the
 * learner mid-onboarding, so the order is: band + language, then band in
 * English, then the neighbouring band.
 */
async function pickQuestion(
  admin: Parameters<Parameters<typeof handler>[0]>[0]["admin"],
  language: string,
  band: CefrLevel,
  answered: Set<string>,
): Promise<BankRow | null> {
  const attempts: { language: string; level: CefrLevel }[] = [
    { language, level: band },
    { language: "en", level: band },
  ];

  for (const attempt of attempts) {
    const { data } = await admin
      .from("assessment_questions")
      .select("id, skill, prompt, options, cefr_level")
      .eq("language", attempt.language)
      .eq("cefr_level", attempt.level)
      .limit(60);

    const pool = ((data ?? []) as BankRow[]).filter((row) => !answered.has(row.id));
    if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
  }
  return null;
}
