/**
 * `goal-confirm` (TZ.md §6) — turns a reviewed draft into the user's one
 * active goal, its outcomes, and an empty learning state. Readiness is
 * computed here and stored on the row: the client never derives it
 * (TZ.md §3 Rule 1).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.112.4";
import { assessReadiness, type OutcomeDraft } from "../_shared/goal.ts";
import { isCefrLevel } from "../_shared/cefr.ts";
import {
  handler,
  HandlerError,
  json,
  logEvent,
  optionalString,
  requireInt,
  requireString,
} from "../_shared/shared.ts";

/**
 * `required_cefr` is read back off the `goal_analyze` job rather than taken
 * from the request body, and that is the point: it is an educational decision
 * the backend already made (TZ.md §3 Rule 1). A client that could post its own
 * value could declare any goal to be an A1 goal and get an easier route for
 * it. `declared_cefr` travels the opposite way — it is the learner's own
 * statement about themselves, so the body is exactly where it belongs.
 *
 * Matching is by the learner's own words: a learner who analysed twice gets
 * the analysis they actually confirmed, not whichever finished last.
 */
async function analysisFor(
  admin: SupabaseClient,
  userId: string,
  rawInput: string,
): Promise<{ requiredCefr: string | null; topics: string[] }> {
  const { data: jobs } = await admin
    .from("jobs")
    .select("input, result")
    .eq("user_id", userId)
    .eq("kind", "goal_analyze")
    .eq("status", "done")
    .order("created_at", { ascending: false })
    .limit(5);

  for (const job of (jobs ?? []) as { input: unknown; result: unknown }[]) {
    const input = job.input as { raw_input?: string } | null;
    if (input?.raw_input !== rawInput) continue;

    const result = job.result as { required_cefr?: unknown; topics?: unknown } | null;
    const level = result?.required_cefr;
    const topics = Array.isArray(result?.topics)
      ? (result.topics as unknown[]).filter((slug): slug is string => typeof slug === "string")
      : [];
    return { requiredCefr: isCefrLevel(level) ? level : null, topics };
  }
  return { requiredCefr: null, topics: [] };
}

/**
 * Records which canonical topics this goal asked for (see the
 * `goal_topics` migration). `analyzeGoal` already filtered the slugs against
 * the taxonomy, and the insert joins `topics` again rather than trusting them:
 * a slug that has since been renamed simply does not match, which is the right
 * outcome for a table whose whole job is to be countable.
 *
 * Failing here must not fail the confirmation. The learner's goal, outcomes
 * and learning state are the transaction that matters; this is bookkeeping for
 * authoring decisions, and losing a row of it costs a line in a report, not a
 * learner's onboarding.
 */
async function recordDemand(
  admin: SupabaseClient,
  goalId: string,
  slugs: string[],
): Promise<void> {
  if (slugs.length === 0) return;
  try {
    const { data: topics } = await admin.from("topics").select("id, slug").in("slug", slugs);
    const rows = ((topics ?? []) as { id: string }[]).map((topic) => ({
      goal_id: goalId,
      topic_id: topic.id,
    }));
    if (rows.length > 0) await admin.from("goal_topics").insert(rows);
  } catch (error) {
    console.error("goal_topics_insert_failed", goalId, error);
  }
}

function readOutcomes(body: Record<string, unknown>): OutcomeDraft[] {
  const raw = body.outcomes;
  if (!Array.isArray(raw) || raw.length === 0) throw new HandlerError("invalid_request", 400);
  return raw.slice(0, 6).map((entry, index) => {
    const outcome = entry as Record<string, unknown>;
    const label = typeof outcome.label === "string" ? outcome.label.trim() : "";
    const description =
      typeof outcome.description === "string" ? outcome.description.trim() : "";
    if (!label || !description) throw new HandlerError("invalid_request", 400);
    return { label, description, position: index };
  });
}

Deno.serve(
  handler(async ({ userId, admin, body }) => {
    const input = {
      raw_input: requireString(body, "raw_input"),
      target_language: requireString(body, "target_language"),
      deadline: requireString(body, "deadline"),
      daily_minutes: requireInt(body, "daily_minutes"),
    };
    const title = requireString(body, "title");
    const outcomes = readOutcomes(body);

    // "I'm not sure" reaches here as "unknown" and is stored as null: the
    // ladder reads a null declared level as "start at A2 and widen" (§4.1),
    // and writing a band the learner never claimed would erase that.
    const declaredLevel = optionalString(body, "declared_level");
    const declaredCefr = isCefrLevel(declaredLevel) ? declaredLevel : null;
    const analysis = await analysisFor(admin, userId, input.raw_input);

    // One active goal per user (enforced by a partial unique index too).
    await admin
      .from("goals")
      .update({ status: "paused" })
      .eq("user_id", userId)
      .eq("status", "active");

    const { data: goal, error: goalError } = await admin
      .from("goals")
      .insert({
        user_id: userId,
        ...input,
        title,
        status: "active",
        declared_cefr: declaredCefr,
        required_cefr: analysis.requiredCefr,
      })
      .select("*")
      .single();
    if (goalError || !goal) throw new HandlerError("goal_create_failed", 500);

    await recordDemand(admin, goal.id as string, analysis.topics);

    const { error: outcomeError } = await admin.from("goal_outcomes").insert(
      outcomes.map((outcome) => ({ user_id: userId, goal_id: goal.id, ...outcome })),
    );
    if (outcomeError) throw new HandlerError("goal_create_failed", 500);

    // Every goal owns exactly one learning state; skill states are filled in
    // by `assessment-complete`.
    await admin
      .from("learning_states")
      .insert({ user_id: userId, goal_id: goal.id })
      .select("id")
      .single();

    // `input` is spread straight into the insert, so it holds column names and
    // nothing else — the declared level is a `GoalInput` field but a differently
    // named column, and it is added here rather than widening that object.
    const readiness = await assessReadiness(
      { ...input, declared_level: declaredLevel ?? "unknown" },
      outcomes,
    );
    const { data: updated, error: updateError } = await admin
      .from("goals")
      .update({ readiness_label: readiness.label, readiness_reason: readiness.reason })
      .eq("id", goal.id)
      .select("*")
      .single();
    if (updateError || !updated) throw new HandlerError("goal_create_failed", 500);

    await logEvent(admin, userId, "goal_confirmed", { goal_id: goal.id });

    return json(updated);
  }),
);
