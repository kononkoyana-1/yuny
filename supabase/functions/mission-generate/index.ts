/**
 * `mission-generate` (TZ.md §6) — async (`mission_generate`, TZ.md §10
 * "Building your next mission…"). The single entry point for creating a
 * mission: decides the focus skill from Goal + Learning State, then fills
 * it from real processed content when available (`missionFromContent`) or
 * AI/deterministic authoring (`generateMission`) otherwise. Writes the
 * mission, its activities, and the server-only answer keys, then resolves
 * the job with the mission id.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { generateMission, missionFromContent, type MissionDraft } from "../_shared/mission.ts";
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

Deno.serve(
  handler(async ({ userId, admin, body }) => {
    const goalId = requireUuid(body, "goal_id");

    const { data: goal } = await admin
      .from("goals")
      .select("id, title, target_language, daily_minutes")
      .eq("id", goalId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!goal) throw new HandlerError("goal_not_found", 404);

    const jobId = await createJob(admin, userId, "mission_generate", { goal_id: goalId });

    runJobInBackground(admin, jobId, async () => {
      const [{ data: outcomes }, { data: learningState }] = await Promise.all([
        admin
          .from("goal_outcomes")
          .select("label, description")
          .eq("goal_id", goalId)
          .order("position", { ascending: true }),
        admin
          .from("learning_states")
          .select("id, skill_states(skill, level)")
          .eq("goal_id", goalId)
          .maybeSingle(),
      ]);

      const levels = {} as Record<Skill, number>;
      for (const skill of SKILLS) levels[skill] = 0.4;
      for (const row of (learningState?.skill_states ?? []) as { skill: string; level: number }[]) {
        if (isSkill(row.skill)) levels[row.skill] = clamp01(Number(row.level));
      }

      const focusSkill = [...SKILLS].sort((a, b) => levels[a] - levels[b])[0];

      /**
       * The open module is where the learner is on the map (§6: exactly one is
       * `in_progress`), so it is what this mission is for. It shapes the
       * mission before it labels it — the content path is narrowed to the
       * module's topic and the authoring path is told the theme — because a
       * `roadmap_module_id` on an off-theme mission would make the map a
       * caption rather than a description.
       *
       * Missions predate the roadmap and still work without one: no module
       * means no narrowing and a null column, exactly as before.
       */
      const { data: openModule } = await admin
        .from("roadmap_modules")
        .select("id, topic_id, title, target_cefr")
        .eq("goal_id", goalId)
        .eq("status", "in_progress")
        .order("position", { ascending: true })
        .limit(1)
        .maybeSingle();

      const fromContent = await missionFromContent(
        admin,
        goalId,
        focusSkill,
        (openModule?.topic_id as string | null) ?? null,
      );
      const draft: MissionDraft = fromContent
        ? fromContent.draft
        : await generateMission({
            goalTitle: goal.title as string,
            targetLanguage: goal.target_language as string,
            outcomes: (outcomes ?? []) as { label: string; description: string }[],
            levels,
            focusSkill,
            dailyMinutes: goal.daily_minutes as number,
            module: openModule
              ? {
                  title: openModule.title as string,
                  targetCefr: openModule.target_cefr as string,
                }
              : null,
          });

      const { data: mission, error: missionError } = await admin
        .from("missions")
        .insert({
          user_id: userId,
          goal_id: goalId,
          content_unit_id: fromContent?.contentUnitId ?? null,
          roadmap_module_id: (openModule?.id as string | undefined) ?? null,
          title: draft.title,
          purpose: draft.purpose,
          why: draft.why,
          primary_skill: draft.primary_skill,
          estimated_minutes: draft.estimated_minutes,
          status: "pending",
        })
        .select("*")
        .single();
      if (missionError || !mission) throw new HandlerError("mission_failed", 500);

      const { data: activities, error: activityError } = await admin
        .from("activities")
        .insert(
          draft.activities.map((activity, index) => ({
            user_id: userId,
            mission_id: mission.id,
            type: activity.type,
            // `skill` rides along in the payload so `activity-submit` knows
            // which skill_state to move without re-deriving it from the type.
            payload: { ...activity.payload, skill: activity.skill },
            position: index,
            status: "pending",
          })),
        )
        .select("id, position");
      if (activityError || !activities) throw new HandlerError("mission_failed", 500);

      const keys = activities
        .map((activity) => ({
          activity_id: activity.id as string,
          key: draft.activities[activity.position as number]?.answer_key,
        }))
        .filter((entry) => entry.key != null);
      if (keys.length > 0) await admin.from("activity_answer_keys").insert(keys);

      await logEvent(admin, userId, "mission_generated", {
        goal_id: goalId,
        mission_id: mission.id,
      });

      return { mission_id: mission.id, mission };
    });

    return json({ job_id: jobId, kind: "mission_generate" });
  }),
);
