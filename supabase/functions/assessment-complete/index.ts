/**
 * `assessment-complete` (TZ.md §6) — scores the raw answers and writes the
 * initial `learning_state` + `skill_states`, then the screen-07 summary.
 *
 * Async (`assessment_evaluate`, TZ.md §10 loading copy: "Checking your
 * answers…"): returns a `job_id`, the client waits on Realtime, and the job
 * result is exactly the `AssessmentResult` shape the client parses.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { summarizeAssessment } from "../_shared/assessment.ts";
import { declaredToBand, isCefrLevel } from "../_shared/cefr.ts";
import { BUDGET_SECONDS, nextStep, type LadderAnswer } from "../_shared/ladder.ts";
import {
  clamp01,
  createJob,
  handler,
  HandlerError,
  isSkill,
  json,
  logEvent,
  requireUuid,
  runJobInBackground,
  SKILLS,
  type Skill,
} from "../_shared/shared.ts";

/**
 * Skills the assessment did not test are recorded as UNKNOWN, not estimated.
 *
 * There used to be a discount table here (speaking 0.65, writing 0.75,
 * listening 0.9) applied to the tested average. It produced a stable fiction:
 * because the factors were fixed, listening always came out the strongest
 * untested skill and speaking always the weakest, for every learner alive,
 * regardless of evidence. Screen 07 then reported that as a finding.
 *
 * `confidence: 0` is the honest record of "we have not measured this", and
 * §5 of docs/onboarding-v2.md makes it the rule: the system does not assert
 * what it has not tested. The level still needs a number for the column, so
 * it carries the tested baseline — but with zero confidence attached, so no
 * consumer can mistake it for a measurement.
 */
const UNTESTED_CONFIDENCE = 0;

Deno.serve(
  handler(async ({ userId, admin, body }) => {
    const goalId = requireUuid(body, "goal_id");

    const { data: goal } = await admin
      .from("goals")
      .select("id, title, target_language")
      .eq("id", goalId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!goal) throw new HandlerError("goal_not_found", 404);

    const jobId = await createJob(admin, userId, "assessment_evaluate", { goal_id: goalId });
    await logEvent(admin, userId, "assessment_completed", { goal_id: goalId });

    runJobInBackground(admin, jobId, async () => {
      const { data: answers } = await admin
        .from("assessment_answers")
        .select("selected_index, assessment_questions(skill, correct_index, cefr_level)")
        .eq("goal_id", goalId);

      // Per-skill correctness among the questions actually answered, plus
      // the per-band record the ladder needs to reach a CEFR verdict.
      const tally: Record<string, { correct: number; total: number }> = {};
      const ladderAnswers: LadderAnswer[] = [];
      for (const answer of answers ?? []) {
        const question = answer.assessment_questions as unknown as
          | { skill: string; correct_index: number; cefr_level: string | null }
          | null;
        if (!question) continue;
        const correct = answer.selected_index === question.correct_index;
        if (isSkill(question.skill)) {
          const bucket = (tally[question.skill] ??= { correct: 0, total: 0 });
          bucket.total += 1;
          if (correct) bucket.correct += 1;
        }
        if (isCefrLevel(question.cefr_level)) {
          ladderAnswers.push({ level: question.cefr_level, correct });
        }
      }

      /**
       * The band verdict comes from the same ladder that chose the questions,
       * asked to finish: one rule decides both what to serve and what the run
       * concluded, so the two can never disagree. Null when no answer carried
       * a band — an unlevelled bank must not be reported as a measured level.
       */
      const declaredBand = declaredToBand(goal.declared_cefr);
      const finished = ladderAnswers.length > 0
        ? nextStep({ declared: declaredBand, answers: ladderAnswers, elapsedSeconds: BUDGET_SECONDS })
        : null;
      const assessedCefr = finished && finished.done ? finished.assessed : null;
      const cefrConfidence = finished && finished.done ? finished.confidence : null;

      const testedRatios = Object.values(tally).map((b) => b.correct / b.total);
      const baseline =
        testedRatios.length > 0
          ? testedRatios.reduce((sum, value) => sum + value, 0) / testedRatios.length
          : 0.4;

      const levels = {} as Record<Skill, number>;
      const confidences = {} as Record<Skill, number>;
      for (const skill of SKILLS) {
        const bucket = tally[skill];
        if (bucket) {
          levels[skill] = clamp01(bucket.correct / bucket.total);
          confidences[skill] = clamp01(0.45 + 0.1 * bucket.total);
        } else {
          levels[skill] = clamp01(baseline);
          confidences[skill] = UNTESTED_CONFIDENCE;
        }
      }

      const { data: learningState } = await admin
        .from("learning_states")
        .upsert(
          {
            user_id: userId,
            goal_id: goalId,
            assessed_cefr: assessedCefr,
            cefr_confidence: cefrConfidence,
          },
          { onConflict: "goal_id" },
        )
        .select("id")
        .single();
      if (!learningState) throw new HandlerError("assessment_failed", 500);

      await admin.from("skill_states").upsert(
        SKILLS.map((skill) => ({
          user_id: userId,
          learning_state_id: learningState.id,
          skill,
          level: levels[skill],
          confidence: confidences[skill],
          trend: "stable",
        })),
        { onConflict: "learning_state_id,skill" },
      );

      const summary = await summarizeAssessment(
        goal.title as string,
        levels,
        SKILLS.filter((skill) => tally[skill] !== undefined),
      );

      const { data: result } = await admin
        .from("assessment_results")
        .insert({
          user_id: userId,
          goal_id: goalId,
          learning_state_id: learningState.id,
          stronger_skill: summary.stronger_skill,
          needs_work_skill: summary.needs_work_skill,
          priority_label: summary.priority_label,
          focus_areas: summary.focus_areas,
        })
        .select("id, created_at")
        .single();
      if (!result) throw new HandlerError("assessment_failed", 500);

      const { data: state } = await admin
        .from("learning_states")
        .select("id, goal_id, assessed_cefr, cefr_confidence, updated_at, skill_states(id, learning_state_id, skill, level, confidence, trend)")
        .eq("id", learningState.id)
        .single();

      // Postgres returns numeric as a string; the client's Zod schema expects
      // numbers, so coerce here rather than loosening the schema.
      const skillStates = ((state?.skill_states ?? []) as Record<string, unknown>[]).map(
        (row) => ({
          id: row.id,
          learning_state_id: row.learning_state_id,
          skill: row.skill,
          level: Number(row.level),
          confidence: Number(row.confidence),
          trend: row.trend,
        }),
      );

      return {
        id: result.id,
        goal_id: goalId,
        learning_state: {
          id: state?.id,
          goal_id: goalId,
          assessed_cefr: state?.assessed_cefr ?? null,
          cefr_confidence: state?.cefr_confidence === null || state?.cefr_confidence === undefined
            ? null
            : Number(state.cefr_confidence),
          updated_at: state?.updated_at,
          skill_states: skillStates,
        },
        declared_cefr: goal.declared_cefr ?? null,
        assessed_cefr: assessedCefr,
        stronger_skill: summary.stronger_skill,
        needs_work_skill: summary.needs_work_skill,
        priority_label: summary.priority_label,
        focus_areas: summary.focus_areas,
        created_at: result.created_at,
      };
    });

    return json({ job_id: jobId, kind: "assessment_evaluate" });
  }),
);
