import { RoadmapModuleSchema, RoadmapSchema } from "@yuny/shared";
import { requireUserId } from "@/shared/lib/auth";
import { getSupabase } from "@/shared/lib/supabase";
import { BackendError } from "@/shared/lib/backendError";
import type { RoadmapRepository } from "../roadmap.repository";

/**
 * A plain SELECT rather than an Edge Function: `roadmap_modules` is
 * SELECT-only for clients under RLS ("roadmap_modules: read own"), and
 * nothing here decides anything — the module list, its order and every
 * status were committed by the backend that built the route (TZ.md §3
 * Rule 1, §5 "Права клиента").
 *
 * An empty result is `null`, not an empty roadmap. Until the backend builds
 * a route (plan-tasks "Этап 6") there is no map, and "no map yet" and "a map
 * with no modules" are different things: the first is the normal early state,
 * the second would be a bug worth showing.
 */
export const supabaseRoadmapRepository: RoadmapRepository = {
  async getForGoal(goalId) {
    await requireUserId();
    const { data, error } = await getSupabase()
      .from("roadmap_modules")
      .select("id, goal_id, topic_id, position, title, why, target_cefr, kind, status")
      .eq("goal_id", goalId)
      .order("position", { ascending: true });

    if (error) throw new BackendError("roadmap_read_failed");
    if (!data || data.length === 0) return null;

    const modules = data.map((row) => RoadmapModuleSchema.parse(row));
    return RoadmapSchema.parse({
      goal_id: goalId,
      modules,
      completed_modules: modules.filter((module) => module.status === "completed").length,
      total_modules: modules.length,
    });
  },
};
