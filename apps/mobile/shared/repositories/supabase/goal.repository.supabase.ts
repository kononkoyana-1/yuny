import { GoalOutcomeSchema, GoalSchema, SkillSchema } from "@yuny/shared";
import { z } from "zod";
import { awaitJob, jobRefSchema } from "@/shared/lib/jobs";
import { invokeEdge } from "@/shared/lib/edge";
import { requireUserId } from "@/shared/lib/auth";
import { getSupabase } from "@/shared/lib/supabase";
import { BackendError } from "@/shared/lib/backendError";
import type {
  GoalAnalysis,
  GoalDraft,
  GoalDraftInput,
  GoalRepository,
  JobRef,
} from "../goal.repository";

/**
 * `goal-analyze`'s job result. `GoalAnalysis` is a client-side interface with
 * no table behind it, so its schema lives here — but it is still parsed
 * before reaching state, like every other backend response (TZ.md §6
 * "Валидация").
 */
const GoalAnalysisSchema = z.object({
  title: z.string().min(1),
  target_situations: z.array(z.string().min(1)),
  required_skills: z.array(SkillSchema),
  outcomes: z
    .array(GoalOutcomeSchema.pick({ label: true, description: true, position: true }))
    .min(1),
});

/**
 * Reads go straight to Postgres under RLS; writes go through Edge Functions,
 * because everything they decide — outcomes, readiness — is backend-owned
 * (TZ.md §3 Rule 1, §5 "Права клиента": `goals` is SELECT-only for clients).
 */
export const supabaseGoalRepository: GoalRepository = {
  async getActive() {
    await requireUserId();
    const { data, error } = await getSupabase()
      .from("goals")
      .select(
        "id, user_id, raw_input, title, target_language, deadline, daily_minutes, status, readiness_label, readiness_reason, created_at",
      )
      .eq("status", "active")
      .maybeSingle();

    if (error) throw new BackendError("goal_read_failed");
    return data ? GoalSchema.parse(data) : null;
  },

  async getOutcomes(goalId) {
    await requireUserId();
    const { data, error } = await getSupabase()
      .from("goal_outcomes")
      .select("id, goal_id, label, description, position, created_at")
      .eq("goal_id", goalId)
      .order("position", { ascending: true });

    if (error) throw new BackendError("goal_read_failed");
    return (data ?? []).map((row) => GoalOutcomeSchema.parse(row));
  },

  async analyze(input: GoalDraftInput) {
    const job = await invokeEdge<JobRef>("goal-analyze", { ...input });
    return jobRefSchema("goal_analyze").parse(job);
  },

  async getAnalysis(jobId) {
    // Resolves off the Realtime `jobs` subscription — no polling (TZ.md §6).
    const result = await awaitJob<GoalAnalysis>(jobId);
    return GoalAnalysisSchema.parse(result);
  },

  async confirm(draft: GoalDraft) {
    const goal = await invokeEdge("goal-confirm", { ...draft });
    return GoalSchema.parse(goal);
  },
};
