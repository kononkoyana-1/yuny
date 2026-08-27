/**
 * Mission generator (TZ.md §6 `mission-generate`, §9 Activity registry).
 * Activity payloads are renderer input only — the answer key travels
 * separately and is stored in `activity_answer_keys`.
 */
import { aiAvailable, aiJson, isSkill, objectSchema, SKILLS, type Skill } from "./shared.ts";
import { ACTIVITY_TYPES, type ActivityType } from "./activity.ts";

const SKILL_ENUM = { type: "string", enum: [...SKILLS] };

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
        type: "grammar_practice",
        skill: "grammar",
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
        type: "writing_response",
        skill: "writing",
        payload: {
          prompt: "Write two or three sentences describing something you did well recently.",
          min_words: 20,
        },
        answer_key: null,
      },
      {
        type: "speaking_response",
        skill: "speaking",
        payload: {
          prompt: "Say out loud, in your own words: what are you working towards and why?",
          guidance: "Aim for 30-60 seconds. Do not read from a script.",
          target_seconds: 45,
        },
        answer_key: null,
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
      type: { type: "string", enum: ACTIVITY_TYPES },
      skill: SKILL_ENUM,
      payload_json: {
        type: "string",
        description:
          "JSON object for the renderer. vocabulary_choice/grammar_practice: {prompt, options[]}. " +
          "vocabulary_recall: {sentence_with_blank, hint}. reading_comprehension: " +
          "{passage, question, options[]}. listening_comprehension: {transcript, question, options[]}. " +
          "speaking_response: {prompt, guidance, target_seconds}. speaking_roleplay: " +
          "{scenario, your_role, partner_role, opening_line}. writing_response: {prompt, min_words}. " +
          "Never include the correct answer here.",
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
    .filter((activity) => ACTIVITY_TYPES.includes(activity.type))
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
