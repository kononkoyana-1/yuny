/**
 * `recommendation-get` (TZ.md §6) — answers "what would help me most right
 * now, and why", or `null` when there is no mission ready (Home's "No
 * Mission" empty state, TZ.md §10).
 *
 * The reason is stored, not computed on device: screen 09's "Why this?" must
 * show the same sentence the server decided (TZ.md §3 Rule 1, §16).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  handler,
  HandlerError,
  isSkill,
  json,
  requireUuid,
  SKILLS,
  type Skill,
} from "../_shared/shared.ts";

const SKILL_PHRASE: Record<Skill, string> = {
  speaking: "speaking out loud without rehearsing",
  listening: "following speech at natural speed",
  vocabulary: "having the right words ready",
  grammar: "building sentences that hold up under pressure",
  reading: "reading quickly without translating",
  writing: "writing clearly in your own words",
};

Deno.serve(
  handler(async ({ userId, admin, body }) => {
    const goalId = requireUuid(body, "goal_id");

    const { data: goal } = await admin
      .from("goals")
      .select("id, title")
      .eq("id", goalId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!goal) throw new HandlerError("goal_not_found", 404);

    // Without a mission there is no "one best next action" to recommend.
    const { data: mission } = await admin
      .from("missions")
      .select("id, title, estimated_minutes")
      .eq("goal_id", goalId)
      .in("status", ["pending", "active"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!mission) return json({ recommendation: null });

    const { data: learningState } = await admin
      .from("learning_states")
      .select("id, skill_states(skill, level)")
      .eq("goal_id", goalId)
      .maybeSingle();

    const skillRows = (learningState?.skill_states ?? []) as { skill: string; level: number }[];
    if (skillRows.length === 0) throw new HandlerError("assessment_required", 409);

    // Weakest skill first; ties broken by the canonical skill order so the
    // answer is stable between calls.
    const focus = [...skillRows]
      .filter((row) => isSkill(row.skill))
      .sort(
        (a, b) =>
          Number(a.level) - Number(b.level) ||
          SKILLS.indexOf(a.skill as Skill) - SKILLS.indexOf(b.skill as Skill),
      )[0].skill as Skill;

    const reason =
      `Right now ${SKILL_PHRASE[focus]} is what stands between you and "${goal.title}", ` +
      `so this is where practice pays off fastest.`;

    // Home asks on every mount; only record a new row when the advice has
    // actually changed, so `recommendations` stays a history of decisions
    // rather than a log of screen visits.
    const { data: latest } = await admin
      .from("recommendations")
      .select("id, goal_id, mission_id, reason, skills_affected, created_at")
      .eq("goal_id", goalId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let recommendation = latest;
    const unchanged =
      latest &&
      latest.mission_id === mission.id &&
      (latest.skills_affected as string[]).length === 1 &&
      (latest.skills_affected as string[])[0] === focus;

    if (!unchanged) {
      const { data: created, error } = await admin
        .from("recommendations")
        .insert({
          user_id: userId,
          goal_id: goalId,
          mission_id: mission.id,
          reason,
          skills_affected: [focus],
        })
        .select("id, goal_id, mission_id, reason, skills_affected, created_at")
        .single();
      if (error || !created) throw new HandlerError("recommendation_failed", 500);
      recommendation = created;
    }

    return json({
      recommendation: {
        ...recommendation,
        // Denormalized so Home can render the mission card without a second
        // round trip (see `RecommendationSchema` in `@yuny/shared`).
        mission_title: mission.title,
        estimated_minutes: mission.estimated_minutes,
      },
    });
  }),
);
