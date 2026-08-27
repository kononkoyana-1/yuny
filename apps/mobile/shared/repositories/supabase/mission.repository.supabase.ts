import { MissionResultSchema, MissionSchema, TaskResultSchema } from "@yuny/shared";
import { BackendError } from "@/shared/lib/backendError";
import { invokeEdge } from "@/shared/lib/edge";
import { getSupabase } from "@/shared/lib/supabase";
import type { MissionRepository, TaskResponseInput } from "../mission.repository";

/**
 * Reads go straight to Postgres under RLS (`missions`/`activities`/
 * `evidence` are all "read own"); the one write, `submitTask`, goes through
 * `activity-submit` — the same Edge Function every other Activity type
 * already uses, unmodified. Nothing here is Phase-5-specific on the server
 * side except which two `type` values it expects back.
 */
export const supabaseMissionRepository: MissionRepository = {
  async getMission(missionId) {
    const supabase = getSupabase();

    const { data: mission, error: missionError } = await supabase
      .from("missions")
      .select("id, goal_id, title, purpose, why, estimated_minutes, status")
      .eq("id", missionId)
      .single();
    if (missionError || !mission) throw new BackendError("mission_not_found");

    const { data: tasks, error: tasksError } = await supabase
      .from("activities")
      .select("id, mission_id, type, payload, position, status")
      .eq("mission_id", missionId)
      .order("position", { ascending: true });
    if (tasksError) throw new BackendError("mission_not_found");

    return MissionSchema.parse({ ...mission, tasks: tasks ?? [] });
  },

  async submitTask(activityId, response: TaskResponseInput) {
    const payload = "selected_index" in response
      ? { selected_index: response.selected_index }
      : { text: response.text };
    const result = await invokeEdge("activity-submit", { activity_id: activityId, payload });
    return TaskResultSchema.parse(result);
  },

  async getMissionResult(missionId) {
    const supabase = getSupabase();

    const { data: mission, error: missionError } = await supabase
      .from("missions")
      .select("id, title")
      .eq("id", missionId)
      .single();
    if (missionError || !mission) throw new BackendError("mission_not_found");

    const { data: activities } = await supabase
      .from("activities")
      .select("id")
      .eq("mission_id", missionId);
    const activityIds = (activities ?? []).map((a) => a.id as string);

    if (activityIds.length === 0) {
      return MissionResultSchema.parse({
        mission_id: mission.id,
        title: mission.title,
        total_tasks: 0,
        correct_tasks: 0,
        skills_practiced: [],
      });
    }

    const { data: evidenceRows } = await supabase
      .from("evidence")
      .select("strength, skill")
      .in("activity_id", activityIds);

    const rows = evidenceRows ?? [];
    const skillsPracticed = Array.from(new Set(rows.map((row) => row.skill)));

    return MissionResultSchema.parse({
      mission_id: mission.id,
      title: mission.title,
      total_tasks: activityIds.length,
      correct_tasks: rows.filter((row) => row.strength === "strong").length,
      skills_practiced: skillsPracticed,
    });
  },
};
