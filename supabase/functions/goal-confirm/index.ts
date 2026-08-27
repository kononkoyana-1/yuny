/**
 * `goal-confirm` (TZ.md §6) — turns a reviewed draft into the user's one
 * active goal, its outcomes, and an empty learning state. Readiness is
 * computed here and stored on the row: the client never derives it
 * (TZ.md §3 Rule 1).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { assessReadiness, type OutcomeDraft } from "../_shared/goal.ts";
import {
  handler,
  HandlerError,
  json,
  logEvent,
  requireInt,
  requireString,
} from "../_shared/shared.ts";

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

    // One active goal per user (enforced by a partial unique index too).
    await admin
      .from("goals")
      .update({ status: "paused" })
      .eq("user_id", userId)
      .eq("status", "active");

    const { data: goal, error: goalError } = await admin
      .from("goals")
      .insert({ user_id: userId, ...input, title, status: "active" })
      .select("*")
      .single();
    if (goalError || !goal) throw new HandlerError("goal_create_failed", 500);

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

    const readiness = await assessReadiness(input, outcomes);
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
