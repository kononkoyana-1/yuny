/**
 * Mission generator (TZ.md §6 `mission-generate`, §9 Activity registry).
 * Activity payloads are renderer input only — the answer key travels
 * separately and is stored in `activity_answer_keys`.
 *
 * `mission-generate` is the *only* path that creates a mission. It always
 * decides the focus skill from Goal + Learning State first (TZ.md §3 Rule
 * 1), then picks *how* to fill it: real processed content when the pipeline
 * already has an unused chapter for that skill (`missionFromContent`
 * below), otherwise AI/deterministic authoring (`generateMission`). There
 * used to be a second, content-only entry point (`mission-from-content`)
 * that skipped the goal/skill decision entirely — that was the bug: it
 * produced missions nobody's Learning State asked for. Folded in here so
 * every mission, regardless of source, answers "why this, now" the same way.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.112.4";
import { aiAvailable, aiJson, isSkill, objectSchema, SKILLS, type Skill } from "./shared.ts";
import type { ActivityType } from "./activity.ts";

const SKILL_ENUM = { type: "string", enum: [...SKILLS] };

/**
 * Task types the client can actually render today (`taskRenderers.tsx`,
 * `packages/shared/schemas/mission.ts`'s `TaskTypeSchema`). `ACTIVITY_TYPES`
 * has eight entries for the full TZ.md §9 registry, but only two renderers
 * exist yet (TZ.md §19 Phase 5: "Начни с двух рендереров... Остальные
 * добавляются только после того, как эти два работают"). Generating the
 * other six would pass `activity-submit` grading fine and then fail
 * `MissionTaskSchema.parse()` on the client. Widen this the moment a new
 * renderer ships — nothing else here needs to change.
 */
const CLIENT_RENDERABLE_TYPES: ActivityType[] = ["vocabulary_choice", "vocabulary_recall"];

export interface ActivityDraft {
  type: ActivityType;
  /** Rendered by the client's Activity renderer (TZ.md §9). Never holds the answer. */
  payload: Record<string, unknown>;
  /** Server-only; stored in `activity_answer_keys`. */
  answer_key: Record<string, unknown> | null;
  skill: Skill;
}

export interface MissionDraft {
  title: string;
  purpose: string;
  why: string;
  primary_skill: Skill;
  estimated_minutes: number;
  activities: ActivityDraft[];
}

function deterministicMission(
  goalTitle: string,
  focusSkill: Skill,
  dailyMinutes: number,
): MissionDraft {
  return {
    title: `Warm up your ${focusSkill}`,
    purpose: `Practise the ${focusSkill} you need for "${goalTitle}" in short, concrete steps.`,
    why: `Your ${focusSkill} is the skill holding this goal back right now, so this is where practice pays off fastest.`,
    primary_skill: focusSkill,
    estimated_minutes: Math.max(5, Math.min(dailyMinutes, 30)),
    // Client-renderable only (see `CLIENT_RENDERABLE_TYPES`) — this is the
    // last-resort fallback when there is neither processed content nor a
    // working AI call, so it cannot afford to produce an unrenderable task.
    activities: [
      {
        type: "vocabulary_choice",
        skill: "vocabulary",
        payload: {
          prompt: 'Which word best completes: "I am ___ in this role because it matches my experience."',
          options: ["interested", "interesting", "interest", "interestingly"],
        },
        answer_key: { correct_index: 0 },
      },
      {
        type: "vocabulary_choice",
        skill: "vocabulary",
        payload: {
          prompt: 'Choose the correct sentence.',
          options: [
            "I have been studying this for two months.",
            "I am studying this since two months.",
            "I study this since two months.",
            "I have studied this since two months ago until now.",
          ],
        },
        answer_key: { correct_index: 0 },
      },
      {
        type: "vocabulary_recall",
        skill: "vocabulary",
        payload: {
          sentence_with_blank: `I am working towards "${goalTitle}" because it ___ (matter) to me.`,
        },
        answer_key: { accepted_answers: ["matters"] },
      },
    ],
  };
}

export async function generateMission(options: {
  goalTitle: string;
  targetLanguage: string;
  outcomes: { label: string; description: string }[];
  levels: Record<Skill, number>;
  focusSkill: Skill;
  dailyMinutes: number;
}): Promise<MissionDraft> {
  if (!aiAvailable()) {
    return deterministicMission(options.goalTitle, options.focusSkill, options.dailyMinutes);
  }

  // `payload` and `answer_key` are free-form per activity type, and strict
  // tools require `additionalProperties: false` on every object — so they
  // travel as JSON strings and are parsed on arrival.
  const activitySchema = objectSchema(
    {
      type: { type: "string", enum: CLIENT_RENDERABLE_TYPES },
      skill: SKILL_ENUM,
      payload_json: {
        type: "string",
        description:
          "JSON object for the renderer. vocabulary_choice: {prompt, options[]}. " +
          "vocabulary_recall: {sentence_with_blank}. Never include the correct answer here.",
      },
      answer_key_json: {
        type: "string",
        description:
          'JSON object with the answer key, or the literal string "null" for open-ended tasks. ' +
          'Multiple choice: {"correct_index": 0}. Recall: {"accepted_answers": ["..."]}.',
      },
    },
    ["type", "skill", "payload_json", "answer_key_json"],
  );

  interface RawActivity {
    type: ActivityType;
    skill: Skill;
    payload_json: string;
    answer_key_json: string;
  }
  interface RawMission extends Omit<MissionDraft, "activities"> {
    activities: RawActivity[];
  }

  const mission = await aiJson<RawMission>({
    name: "record_mission",
    description: "Record the next practice mission for a learner.",
    schema: objectSchema(
      {
        title: { type: "string", description: "Short, concrete mission name." },
        purpose: { type: "string", description: "One sentence: what the learner will be able to do." },
        why: {
          type: "string",
          description: "One sentence explaining why this mission now, referencing their weakest skill.",
        },
        primary_skill: SKILL_ENUM,
        estimated_minutes: { type: "integer", description: "Realistic total, 5-40." },
        activities: { type: "array", minItems: 3, maxItems: 6, items: activitySchema },
      },
      ["title", "purpose", "why", "primary_skill", "estimated_minutes", "activities"],
    ),
    system:
      "You design short language practice missions. Content must be in the learner's target " +
      "language where the learner produces or reads it, with instructions in English. " +
      "Every activity must be answerable on a phone in under five minutes. " +
      "Never put the correct answer in the payload.",
    prompt:
      `Goal: ${options.goalTitle}\nTarget language: ${options.targetLanguage}\n` +
      `Outcomes:\n${options.outcomes.map((o) => `- ${o.label}: ${o.description}`).join("\n")}\n` +
      `Current levels (0-1):\n${SKILLS.map((s) => `- ${s}: ${options.levels[s].toFixed(2)}`).join("\n")}\n` +
      `Skill to focus on: ${options.focusSkill}\n` +
      `Time budget: ${options.dailyMinutes} minutes`,
    maxTokens: 12000,
  });

  const activities = mission.activities
    .filter((activity) => CLIENT_RENDERABLE_TYPES.includes(activity.type))
    .map((activity): ActivityDraft => ({
      type: activity.type,
      skill: isSkill(activity.skill) ? activity.skill : options.focusSkill,
      payload: parseJsonObject(activity.payload_json) ?? {},
      answer_key: parseJsonObject(activity.answer_key_json),
    }))
    .filter((activity) => Object.keys(activity.payload).length > 0);

  if (activities.length === 0) {
    return deterministicMission(options.goalTitle, options.focusSkill, options.dailyMinutes);
  }

  return {
    title: mission.title,
    purpose: mission.purpose,
    why: mission.why,
    primary_skill: isSkill(mission.primary_skill) ? mission.primary_skill : options.focusSkill,
    estimated_minutes: Math.max(5, Math.min(40, mission.estimated_minutes || 15)),
    activities,
  };
}

/** Tolerant parse for the JSON-in-a-string fields strict tools force on us. */
function parseJsonObject(raw: string | null | undefined): Record<string, unknown> | null {
  if (!raw || raw.trim() === "" || raw.trim() === "null") return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

// -------------------------------------------------- content-sourced tasks

const TASK_COUNT = 5;

interface KnowledgeRow {
  id: string;
  data: Record<string, unknown>;
}
interface ExerciseRow {
  id: string;
  knowledge_item_id: string;
  type: string;
  payload: Record<string, unknown>;
}

/** Real generated fill-in-the-blank exercises become recall tasks verbatim. */
function fromFillBlank(exercise: ExerciseRow): ActivityDraft {
  return {
    type: "vocabulary_recall",
    skill: "vocabulary",
    payload: { sentence_with_blank: exercise.payload.sentence_with_blank },
    answer_key: { accepted_answers: exercise.payload.accepted_answers },
  };
}

/**
 * When the chapter doesn't have enough multiple_choice exercises on its own,
 * build the simplest deterministic MC question there is: "which topic is
 * this?", with three *other real* chapter titles as distractors. Nothing
 * invented: every option is a real title from the same source.
 */
function topicChoiceTask(chapterTitle: string, siblingTitles: string[]): ActivityDraft {
  const distractors = siblingTitles.filter((t) => t !== chapterTitle).slice(0, 3);
  return {
    type: "vocabulary_choice",
    skill: "vocabulary",
    payload: { prompt: "Which topic does this lesson cover?", options: [chapterTitle, ...distractors] },
    answer_key: { correct_index: 0 },
  };
}

const GENERIC_DISTRACTOR_WORDS = ["mountain", "computer", "umbrella", "elephant"];

/**
 * The *correct* option is always a real extracted word; foils prefer other
 * real words from the same chapter, topping up with fixed generic filler
 * only when the chapter doesn't have enough of its own.
 */
function vocabularyChoiceTask(correctWord: string, realDistractorPool: string[]): ActivityDraft {
  const realDistractors = realDistractorPool.filter((w) => w !== correctWord).slice(0, 3);
  const distractors = [
    ...realDistractors,
    ...GENERIC_DISTRACTOR_WORDS.filter((w) => !realDistractors.includes(w)),
  ].slice(0, 3);
  return {
    type: "vocabulary_choice",
    skill: "vocabulary",
    payload: {
      prompt: "Which word was one of this lesson's study words?",
      options: [correctWord, ...distractors],
    },
    answer_key: { correct_index: 0 },
  };
}

/**
 * The content-sourced path: fills the mission from an already-processed
 * textbook chapter (`content_units` → `knowledge_items` →
 * `generated_exercises`) instead of asking AI to author from scratch,
 * when — and only when — the pipeline actually has unused material for the
 * `focusSkill` that Goal + Learning State just picked. Vocabulary is the
 * only pipeline-covered skill today (`content-import`'s current adapters);
 * every other skill falls through to `generateMission`. Returns `null` on
 * any shortfall so the caller can fall back — this is an optimization over
 * `generateMission`, never a replacement decision-maker.
 */
export async function missionFromContent(
  admin: SupabaseClient,
  goalId: string,
  focusSkill: Skill,
): Promise<{ draft: MissionDraft; contentUnitId: string } | null> {
  if (focusSkill !== "vocabulary") return null;

  const { data: usedRows } = await admin
    .from("missions")
    .select("content_unit_id")
    .eq("goal_id", goalId)
    .not("content_unit_id", "is", null);
  const usedUnitIds = ((usedRows ?? []) as { content_unit_id: string }[]).map((r) => r.content_unit_id);

  // Eligible units are decided before the oldest-first pick, not after it.
  // Picking the oldest chapter and *then* discovering it holds nothing
  // validated would strand every reviewed chapter behind the first unreviewed
  // one — the content path would go dark while approved material sat unused.
  const { data: eligibleRows } = await admin
    .from("knowledge_items")
    .select("content_unit_id")
    .eq("kind", "vocabulary")
    .eq("status", "validated");
  const eligibleUnitIds = [
    ...new Set(((eligibleRows ?? []) as { content_unit_id: string }[]).map((r) => r.content_unit_id)),
  ].filter((id) => !usedUnitIds.includes(id));
  if (eligibleUnitIds.length === 0) return null;

  const { data: units } = await admin
    .from("content_units")
    .select("id, source_id, title, part_title")
    .eq("kind", "chapter")
    .eq("status", "parsed")
    .in("id", eligibleUnitIds)
    .order("created_at", { ascending: true })
    .limit(1);
  const unit = (units ?? [])[0] as { id: string; source_id: string; title: string; part_title: string | null } | undefined;
  if (!unit) return null;

  // `status = 'validated'` is the QA gate made physical (docs/CONTENT_AGENTS.md
  // §5.6). The column has existed since the content pipeline landed, but until
  // now nothing read it: a draft nobody reviewed reached a learner exactly as
  // an approved one did, which made the whole review step advisory. Only
  // material an independent reviewer approved is eligible for a mission.
  //
  // Falling short here is safe by construction: `missionFromContent` returns
  // null and `mission-generate` falls back to `generateMission`. The learner
  // gets a mission either way; they just do not get unreviewed material.
  const { data: knowledge } = await admin
    .from("knowledge_items")
    .select("id, data")
    .eq("content_unit_id", unit.id)
    .eq("kind", "vocabulary")
    .eq("status", "validated");
  const knowledgeRows = (knowledge ?? []) as KnowledgeRow[];
  if (knowledgeRows.length === 0) return null;

  const { data: exercises } = await admin
    .from("generated_exercises")
    .select("id, knowledge_item_id, type, payload")
    .in("knowledge_item_id", knowledgeRows.map((k) => k.id))
    .eq("status", "validated");
  const fillBlanks = ((exercises ?? []) as ExerciseRow[]).filter((e) => e.type === "fill_blank");

  const { data: siblings } = await admin
    .from("content_units")
    .select("title")
    .eq("source_id", unit.source_id)
    .eq("kind", "chapter")
    .limit(10);
  const siblingTitles = ((siblings ?? []) as { title: string }[]).map((s) => s.title);

  const words = fillBlanks
    .map((e) => (Array.isArray(e.payload.accepted_answers) ? String(e.payload.accepted_answers[0]) : null))
    .filter((w): w is string => Boolean(w));

  const drafts: ActivityDraft[] = [];
  const usedWords: string[] = [];

  for (const exercise of fillBlanks) {
    if (usedWords.length >= 3) break;
    drafts.push(fromFillBlank(exercise));
    const word = Array.isArray(exercise.payload.accepted_answers)
      ? String(exercise.payload.accepted_answers[0])
      : null;
    if (word) usedWords.push(word);
  }

  for (const word of words.filter((w) => !usedWords.includes(w))) {
    if (drafts.length >= TASK_COUNT) break;
    drafts.push(vocabularyChoiceTask(word, words));
    usedWords.push(word);
  }

  if (drafts.length < TASK_COUNT) {
    drafts.push(topicChoiceTask(unit.title, siblingTitles));
  }

  if (drafts.length !== TASK_COUNT) return null;

  return {
    contentUnitId: unit.id,
    draft: {
      title: `Warm up: ${unit.title}`,
      purpose: `Practise the vocabulary from "${unit.title}"${unit.part_title ? ` (${unit.part_title})` : ""}.`,
      why: `Vocabulary is the skill holding this goal back right now, and this chapter is ready to practise.`,
      primary_skill: "vocabulary",
      estimated_minutes: 5,
      activities: drafts,
    },
  };
}
