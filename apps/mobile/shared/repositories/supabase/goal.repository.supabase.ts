import { CefrLevelSchema, GoalOutcomeSchema, GoalSchema, SkillSchema } from "@yuny/shared";
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
  required_cefr: CefrLevelSchema,
  topics: z.array(z.string().min(1)),
});

/**
 * Reads go straight to Postgres under RLS; writes go through Edge Functions,
 * because everything they decide — outcomes, readiness — is backend-owned
 * (TZ.md §3 Rule 1, §5 "Права клиента": `goals` is SELECT-only for clients).
 */
export const supabaseGoalRepository: GoalRepository = {
  /**
   * The column list must stay in step with `GoalSchema`. `declared_cefr` and
   * `required_cefr` were added to the schema when the CEFR work landed but not
   * to this select, and because Zod's `.nullable()` still requires the key to
   * be present, every call threw — Home and the tab layout both read this, so
   * finishing onboarding dropped the learner onto a broken screen.
   *
   * Worth being precise about why it stayed hidden: an omitted column and a
   * NULL column look identical once the row is a plain object, so this is not
   * the kind of mistake a passing typecheck or a walk through onboarding will
   * surface. Only a real row reaching a real parse shows it.
   */
  async getActive() {
    await requireUserId();
    const { data, error } = await getSupabase()
      .from("goals")
      .select(
        "id, user_id, raw_input, title, target_language, deadline, daily_minutes, status, " +
          "readiness_label, readiness_reason, declared_cefr, required_cefr, created_at",
      )
      .eq("status", "active")
      .maybeSingle();

    if (error) throw new BackendError("goal_read_failed");
    return data ? GoalSchema.parse(data) : null;
  },

  async setDailyMinutes(goalId, dailyMinutes) {
    const response = await invokeEdge<{ goal: unknown }>("goal-set-time", {
      goal_id: goalId,
      daily_minutes: dailyMinutes,
    });
    return GoalSchema.parse(response.goal);
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
