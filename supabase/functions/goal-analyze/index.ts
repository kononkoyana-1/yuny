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
  optionalString,
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
      // Screen 03 offers "I'm not sure" as a first-class answer (§4.1), so an
      // absent or unrecognised value is the same thing as that choice — not
      // an invalid request.
      declared_level: optionalString(body, "declared_level") ?? "unknown",
    };

    const jobId = await createJob(admin, userId, "goal_analyze", input);
    await logEvent(admin, userId, "goal_analyze_requested", {
      target_language: input.target_language,
    });

    runJobInBackground(admin, jobId, async () => {
      // The taxonomy is read here rather than inside the generator: `_shared`
      // stays free of I/O, and the model receives a closed list of real slugs
      // instead of licence to name a topic the content pipeline has never
      // heard of.
      const { data: topics } = await admin.from("topics").select("slug").order("slug");
      const slugs = ((topics ?? []) as { slug: string }[]).map((topic) => topic.slug);
      return await analyzeGoal(input, slugs);
    });

    return json({ job_id: jobId, kind: "goal_analyze" });
  }),
);
