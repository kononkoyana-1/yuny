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
 * Skills the short assessment cannot test directly (speaking, listening,
 * writing) start from what the tested skills show, discounted — productive
 * skills lag comprehension for most learners — and with low confidence, so
 * the first real Activity moves them quickly.
 */
const UNTESTED_DISCOUNT: Record<Skill, number> = {
  speaking: 0.65,
  writing: 0.75,
  listening: 0.9,
  reading: 1,
  vocabulary: 1,
  grammar: 1,
};

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
        .select("selected_index, assessment_questions(skill, correct_index)")
        .eq("goal_id", goalId);

      // Per-skill correctness among the questions actually answered.
      const tally: Record<string, { correct: number; total: number }> = {};
      for (const answer of answers ?? []) {
        const question = answer.assessment_questions as unknown as
          | { skill: string; correct_index: number }
          | null;
        if (!question || !isSkill(question.skill)) continue;
        const bucket = (tally[question.skill] ??= { correct: 0, total: 0 });
        bucket.total += 1;
        if (answer.selected_index === question.correct_index) bucket.correct += 1;
      }

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
          levels[skill] = clamp01(baseline * UNTESTED_DISCOUNT[skill]);
          confidences[skill] = 0.3;
        }
      }

      const { data: learningState } = await admin
        .from("learning_states")
        .upsert({ user_id: userId, goal_id: goalId }, { onConflict: "goal_id" })
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
        .select("id, goal_id, updated_at, skill_states(id, learning_state_id, skill, level, confidence, trend)")
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
          updated_at: state?.updated_at,
          skill_states: skillStates,
        },
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
