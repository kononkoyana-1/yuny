/**
 * Response evaluation (TZ.md §6 `activity-submit`). Objective activity types
 * are graded against the stored answer key with no AI involved at all; only
 * open-ended speaking and writing reach the model.
 */
import { aiAvailable, aiJson, clamp01, objectSchema, type Skill } from "./shared.ts";
import type { ActivityType } from "./activity.ts";

export interface ResponseEvaluation {
  went_well: string;
  improve: string;
  example: string | null;
  skill: Skill;
  strength: "weak" | "moderate" | "strong";
  /** 0-1 score for this single response; feeds the skill_state update. */
  score: number;
}

export async function evaluateResponse(options: {
  activityType: ActivityType;
  skill: Skill;
  payload: Record<string, unknown>;
  answerKey: Record<string, unknown> | null;
  response: Record<string, unknown>;
  targetLanguage: string;
}): Promise<ResponseEvaluation> {
  // Objective types are graded against the key, with no AI involved at all.
  const correctIndex = options.answerKey?.correct_index;
  if (typeof correctIndex === "number") {
    const chosen = options.response.selected_index;
    const correct = chosen === correctIndex;
    const choices = Array.isArray(options.payload.options) ? options.payload.options : [];
    return {
      went_well: correct
        ? "You picked the right option straight away."
        : "You worked through the options rather than skipping the question.",
      improve: correct
        ? "Try using this phrasing out loud next time so it becomes automatic."
        : "Look at how the correct option is built, then say the whole sentence once.",
      example: typeof choices[correctIndex] === "string" ? String(choices[correctIndex]) : null,
      skill: options.skill,
      strength: correct ? "strong" : "weak",
      score: correct ? 1 : 0,
    };
  }

  const accepted = options.answerKey?.accepted_answers;
  if (Array.isArray(accepted)) {
    const given = String(options.response.text ?? "").trim().toLowerCase();
    const correct = accepted.some((value) => String(value).trim().toLowerCase() === given);
    return {
      went_well: correct
        ? "You recalled the word without any prompt."
        : "You committed to an answer instead of leaving it blank.",
      improve: correct
        ? "Use the same word in a sentence of your own to lock it in."
        : `The expected word was "${accepted[0]}" — say the full sentence with it once.`,
      example: `${accepted[0]}`,
      skill: options.skill,
      strength: correct ? "strong" : "weak",
      score: correct ? 1 : 0,
    };
  }

  // Open-ended: speaking transcripts and writing.
  const learnerText = String(
    options.response.transcript ?? options.response.text ?? "",
  ).trim();

  if (!aiAvailable()) {
    const words = learnerText ? learnerText.split(/\s+/).length : 0;
    const score = clamp01(words / 60);
    return {
      went_well:
        words >= 25
          ? "You produced a full answer rather than a single phrase."
          : "You answered in your own words instead of skipping.",
      improve:
        words >= 25
          ? "Add one concrete detail — a number, a name, or a result — to make it land."
          : "Aim for two or three more sentences so the listener gets the whole picture.",
      example: null,
      skill: options.skill,
      strength: score > 0.66 ? "strong" : score > 0.33 ? "moderate" : "weak",
      score,
    };
  }

  const evaluation = await aiJson<ResponseEvaluation>({
    name: "record_feedback",
    description: "Record feedback on one learner response.",
    schema: objectSchema(
      {
        went_well: { type: "string", description: "One specific thing the learner did well." },
        improve: { type: "string", description: "One specific, actionable improvement." },
        example: {
          type: "string",
          description: "A better version of one sentence they said, or an empty string if none.",
        },
        strength: { type: "string", enum: ["weak", "moderate", "strong"] },
        score: { type: "number", description: "0 to 1 quality of this response." },
      },
      ["went_well", "improve", "example", "strength", "score"],
    ),
    system:
      "You give language-learning feedback. Exactly one strength and one improvement, both " +
      "concrete and about this answer. Warm, direct, never patronising. Never mention " +
      "models, APIs, scores, or percentages in the text you write.",
    prompt:
      `Activity type: ${options.activityType}\nSkill: ${options.skill}\n` +
      `Target language: ${options.targetLanguage}\n` +
      `Task shown to the learner: ${JSON.stringify(options.payload)}\n` +
      `Learner's answer: ${learnerText || "(empty)"}`,
    maxTokens: 2000,
  });

  return {
    went_well: evaluation.went_well,
    improve: evaluation.improve,
    example: evaluation.example ? evaluation.example : null,
    skill: options.skill,
    strength: evaluation.strength,
    score: clamp01(evaluation.score),
  };
}
