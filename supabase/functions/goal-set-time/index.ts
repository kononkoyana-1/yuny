/**
 * `goal-set-time` — commits how many minutes a day the learner has chosen.
 *
 * A separate function because the client cannot write to `goals` at all: RLS
 * grants SELECT on own rows and nothing more (TZ.md §5, §3 Rule 3). Onboarding
 * asks for the time on screen 08, after the assessment, so the value arrives
 * after `goal-confirm` has already created the row.
 *
 * Deliberately narrow — it sets one column on one goal. `goal-confirm` owns
 * creation and everything educational; widening this into a general "update
 * goal" endpoint would hand the client a lever over state it is not allowed
 * to decide.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handler, HandlerError, json, requireInt, requireUuid } from "../_shared/shared.ts";

/**
 * The values screen 08 offers. Validated here as well as in the UI: an
 * out-of-range number would silently distort every lesson-count the plan
 * derives from it, and the client is not the authority on what the plan can
 * accommodate.
 */
const ALLOWED_MINUTES = [5, 10, 15, 25, 35];

Deno.serve(
  handler(async ({ userId, admin, body }) => {
    const goalId = requireUuid(body, "goal_id");
    const dailyMinutes = requireInt(body, "daily_minutes");

    if (!ALLOWED_MINUTES.includes(dailyMinutes)) {
      throw new HandlerError("invalid_request", 400);
    }

    const { data: goal } = await admin
      .from("goals")
      .select("id")
      .eq("id", goalId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!goal) throw new HandlerError("goal_not_found", 404);

    const { data: updated, error } = await admin
      .from("goals")
      .update({ daily_minutes: dailyMinutes })
      .eq("id", goalId)
      .eq("user_id", userId)
      .select(
        "id, user_id, raw_input, title, target_language, deadline, daily_minutes, status, readiness_label, readiness_reason, declared_cefr, required_cefr, created_at",
      )
      .single();
    if (error || !updated) throw new HandlerError("goal_update_failed", 500);

    return json({ goal: updated });
  }),
);
