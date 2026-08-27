/**
 * `activity-submit` (TZ.md §6) — the single write path for learner answers.
 * One submission produces feedback, an evidence row, an updated
 * `skill_state`, and an updated `mascot_state`: all four are decided here,
 * never on device (TZ.md §3 Rule 1, §11 "Правила").
 *
 * Speaking submissions are async (`speaking_assess`, TZ.md §10 "Listening to
 * your answer…"); everything else answers inline.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { evaluateResponse } from "../_shared/feedback.ts";
import type { ActivityType } from "../_shared/activity.ts";
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
  type Ctx,
  type Skill,
} from "../_shared/shared.ts";

/** Fallback when a mission's activity payload carries no explicit skill. */
const TYPE_SKILL: Record<ActivityType, Skill> = {
  vocabulary_choice: "vocabulary",
  vocabulary_recall: "vocabulary",
  grammar_practice: "grammar",
  reading_comprehension: "reading",
  listening_comprehension: "listening",
  speaking_response: "speaking",
  speaking_roleplay: "speaking",
  writing_response: "writing",
};

const SPEAKING_TYPES: ActivityType[] = ["speaking_response", "speaking_roleplay"];

/** How far one response is allowed to move a skill level. */
const LEARNING_RATE = 0.3;

async function processSubmission(
  ctx: Ctx,
  activityId: string,
  responsePayload: Record<string, unknown>,
) {
  const { admin, userId } = ctx;

  const { data: activity } = await admin
    .from("activities")
    .select("id, type, payload, status, mission_id, missions(id, goal_id, primary_skill)")
    .eq("id", activityId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!activity) throw new HandlerError("activity_not_found", 404);

  const mission = activity.missions as unknown as { id: string; goal_id: string } | null;
  if (!mission) throw new HandlerError("activity_not_found", 404);

  const { data: goal } = await admin
    .from("goals")
    .select("id, target_language")
    .eq("id", mission.goal_id)
    .single();

  const { data: keyRow } = await admin
    .from("activity_answer_keys")
    .select("key")
    .eq("activity_id", activityId)
    .maybeSingle();

  const payload = (activity.payload ?? {}) as Record<string, unknown>;
  const type = activity.type as ActivityType;
  const skill: Skill = isSkill(payload.skill) ? payload.skill : TYPE_SKILL[type];

  const { data: response, error: responseError } = await admin
    .from("activity_responses")
    .insert({ user_id: userId, activity_id: activityId, payload: responsePayload })
    .select("id, submitted_at")
    .single();
  if (responseError || !response) throw new HandlerError("submit_failed", 500);

  const evaluation = await evaluateResponse({
    activityType: type,
    skill,
    payload,
    answerKey: (keyRow?.key ?? null) as Record<string, unknown> | null,
    response: responsePayload,
    targetLanguage: (goal?.target_language as string) ?? "en",
  });

  const { data: feedback } = await admin
    .from("feedback")
    .insert({
      user_id: userId,
      activity_response_id: response.id,
      went_well: evaluation.went_well,
      improve: evaluation.improve,
      example: evaluation.example,
    })
    .select("id, activity_response_id, went_well, improve, example, created_at")
    .single();

  const { data: evidence } = await admin
    .from("evidence")
    .insert({
      user_id: userId,
      goal_id: mission.goal_id,
      activity_id: activityId,
      skill: evaluation.skill,
      strength: evaluation.strength,
      payload: { activity_type: type, score: evaluation.score },
    })
    .select("id, goal_id, activity_id, skill, strength, payload, created_at")
    .single();

  // ---- skill state: move the measured skill towards this response's score.
  const { data: learningState } = await admin
    .from("learning_states")
    .select("id")
    .eq("goal_id", mission.goal_id)
    .maybeSingle();

  let skillStates: Record<string, unknown>[] = [];
  if (learningState) {
    const { data: current } = await admin
      .from("skill_states")
      .select("id, level, confidence")
      .eq("learning_state_id", learningState.id)
      .eq("skill", evaluation.skill)
      .maybeSingle();

    const previousLevel = current ? Number(current.level) : 0.4;
    const nextLevel = clamp01(previousLevel + (evaluation.score - previousLevel) * LEARNING_RATE);
    const delta = nextLevel - previousLevel;

    await admin.from("skill_states").upsert(
      {
        ...(current ? { id: current.id } : {}),
        user_id: userId,
        learning_state_id: learningState.id,
        skill: evaluation.skill,
        level: nextLevel,
        confidence: clamp01(Math.max(current ? Number(current.confidence) : 0.3, 0.35) + 0.05),
        trend: delta > 0.02 ? "improving" : delta < -0.02 ? "declining" : "stable",
      },
      { onConflict: "learning_state_id,skill" },
    );

    const { data: allStates } = await admin
      .from("skill_states")
      .select("id, learning_state_id, skill, level, confidence, trend")
      .eq("learning_state_id", learningState.id);

    skillStates = (allStates ?? []).map((row) => ({
      ...row,
      level: Number(row.level),
      confidence: Number(row.confidence),
    }));
  }

  // ---- activity + mission progress
  await admin.from("activities").update({ status: "completed" }).eq("id", activityId);

  const { data: remaining } = await admin
    .from("activities")
    .select("id")
    .eq("mission_id", mission.id)
    .neq("status", "completed");
  if ((remaining ?? []).length === 0) {
    await admin.from("missions").update({ status: "completed" }).eq("id", mission.id);
  }

  // ---- mascot: growth is earned by evidence, not by taps (TZ.md §11).
  const { data: mascot } = await admin
    .from("mascot_states")
    .select("id, stage, growth_progress")
    .eq("user_id", userId)
    .maybeSingle();

  let mascotState = mascot;
  if (mascot) {
    const gained = Number(mascot.growth_progress) + evaluation.score * 0.08;
    const levelledUp = gained >= 1 && Number(mascot.stage) < 5;
    const { data: updatedMascot } = await admin
      .from("mascot_states")
      .update({
        stage: levelledUp ? Number(mascot.stage) + 1 : mascot.stage,
        growth_progress: clamp01(levelledUp ? gained - 1 : Math.min(gained, 0.999)),
        mood: evaluation.score >= 0.7 ? "celebrating" : "neutral",
      })
      .eq("id", mascot.id)
      .select("id, user_id, stage, mood, growth_progress, updated_at")
      .single();
    mascotState = updatedMascot as typeof mascot;
  }

  await logEvent(admin, userId, "activity_submitted", {
    activity_id: activityId,
    skill: evaluation.skill,
    strength: evaluation.strength,
  });

  return {
    feedback,
    evidence,
    skill_states: skillStates,
    mascot_state: mascotState
      ? { ...mascotState, growth_progress: Number((mascotState as { growth_progress: number }).growth_progress) }
      : null,
    mission_completed: (remaining ?? []).length === 0,
  };
}

Deno.serve(
  handler(async (ctx) => {
    const activityId = requireUuid(ctx.body, "activity_id");
    const recordingPath =
      typeof ctx.body.recording_path === "string" ? ctx.body.recording_path : null;
    const responsePayload: Record<string, unknown> = {
      ...((ctx.body.payload as Record<string, unknown>) ?? {}),
      ...(recordingPath ? { recording_path: recordingPath } : {}),
    };

    const { data: activity } = await ctx.admin
      .from("activities")
      .select("type")
      .eq("id", activityId)
      .eq("user_id", ctx.userId)
      .maybeSingle();
    if (!activity) throw new HandlerError("activity_not_found", 404);

    const isSpeaking =
      SPEAKING_TYPES.includes(activity.type as ActivityType) || recordingPath !== null;

    if (!isSpeaking) {
      return json(await processSubmission(ctx, activityId, responsePayload));
    }

    const jobId = await createJob(ctx.admin, ctx.userId, "speaking_assess", {
      activity_id: activityId,
    });
    runJobInBackground(ctx.admin, jobId, () =>
      processSubmission(ctx, activityId, responsePayload),
    );
    return json({ job_id: jobId, kind: "speaking_assess" });
  }),
);
