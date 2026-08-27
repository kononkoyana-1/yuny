/**
 * `goal-analyze` (TZ.md §6) — long-running, so it returns a `job_id`
 * immediately and the client waits on Realtime (TZ.md §6 "Асинхронные
 * операции"). The job result is the `GoalAnalysis` shape the client's
 * `getAnalysis(jobId)` reads.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { analyzeGoal } from "../_shared/goal.ts";
import {
  createJob,
  handler,
  json,
  logEvent,
  requireInt,
  requireString,
  runJobInBackground,
} from "../_shared/shared.ts";

Deno.serve(
  handler(async ({ userId, admin, body }) => {
    const input = {
      raw_input: requireString(body, "raw_input"),
      target_language: requireString(body, "target_language"),
      deadline: requireString(body, "deadline"),
      daily_minutes: requireInt(body, "daily_minutes"),
    };

    const jobId = await createJob(admin, userId, "goal_analyze", input);
    await logEvent(admin, userId, "goal_analyze_requested", {
      target_language: input.target_language,
    });

    runJobInBackground(admin, jobId, () => analyzeGoal(input));

    return json({ job_id: jobId, kind: "goal_analyze" });
  }),
);
