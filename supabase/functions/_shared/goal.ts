/**
 * Goal generators (TZ.md §6 `goal-analyze`, `goal-confirm`).
 *
 * Each has an AI implementation and a deterministic one. The deterministic
 * branch is not a stub: it keeps onboarding walkable when `ANTHROPIC_API_KEY`
 * is not configured, so `EXPO_PUBLIC_DATA_SOURCE=supabase` behaves like the
 * mock source (TZ.md §19 Phase 6 "Проверка").
 */
import { aiAvailable, aiJson, isSkill, objectSchema, SKILLS, type Skill } from "./shared.ts";

const SKILL_ENUM = { type: "string", enum: [...SKILLS] };

export interface OutcomeDraft {
  label: string;
  description: string;
  position: number;
}

export interface GoalAnalysis {
  title: string;
  target_situations: string[];
  required_skills: Skill[];
  outcomes: OutcomeDraft[];
}

export interface GoalInput {
  raw_input: string;
  target_language: string;
  deadline: string;
  daily_minutes: number;
}

function titleFrom(rawInput: string): string {
  const trimmed = rawInput.trim().replace(/[.!?]+$/, "");
  if (!trimmed) return "Your language goal";
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return capitalized.length > 80 ? `${capitalized.slice(0, 77)}...` : capitalized;
}

export async function analyzeGoal(input: GoalInput): Promise<GoalAnalysis> {
  if (!aiAvailable()) {
    return {
      title: titleFrom(input.raw_input),
      target_situations: [
        "Everyday conversations where you need the language without preparation",
        "Situations where you have to explain your own experience out loud",
      ],
      required_skills: ["speaking", "vocabulary", "listening"],
      outcomes: [
        {
          label: "Introduce yourself confidently",
          description:
            "Describe your background, skills, and motivation clearly in under two minutes.",
          position: 0,
        },
        {
          label: "Handle unprepared questions",
          description: "Answer follow-up questions without rehearsing the wording first.",
          position: 1,
        },
        {
          label: "Talk through your experience",
          description: "Walk through what you have done before without sounding memorized.",
          position: 2,
        },
      ],
    };
  }

  const analysis = await aiJson<GoalAnalysis>({
    name: "record_goal_analysis",
    description: "Record the decomposition of a learner's language goal.",
    schema: objectSchema(
      {
        title: { type: "string", description: "Short goal title, max 80 chars, no trailing period." },
        target_situations: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: { type: "string" },
          description: "Concrete real-world situations this goal is really about.",
        },
        required_skills: {
          type: "array",
          minItems: 1,
          maxItems: 6,
          items: SKILL_ENUM,
          description: "Skills that actually matter for this goal, most important first.",
        },
        outcomes: {
          type: "array",
          minItems: 3,
          maxItems: 5,
          items: objectSchema(
            {
              label: { type: "string", description: "Observable capability, max 60 chars." },
              description: { type: "string", description: "One sentence, concrete and testable." },
              position: { type: "integer", description: "0-based ordering." },
            },
            ["label", "description", "position"],
          ),
        },
      },
      ["title", "target_situations", "required_skills", "outcomes"],
    ),
    system:
      "You design language-learning plans. Turn a learner's own words into concrete, " +
      "observable outcomes. Write plainly in the learner's UI language (English). " +
      "Never invent facts about the learner that they did not state.",
    prompt:
      `Learner's own words: "${input.raw_input}"\n` +
      `Target language: ${input.target_language}\n` +
      `Deadline: ${input.deadline}\n` +
      `Time available per day: ${input.daily_minutes} minutes`,
  });

  return {
    title: analysis.title.slice(0, 80),
    target_situations: analysis.target_situations,
    required_skills: analysis.required_skills.filter(isSkill),
    outcomes: analysis.outcomes.map((outcome, index) => ({ ...outcome, position: index })),
  };
}

// ------------------------------------------------------------ goal-confirm

export interface Readiness {
  label: string;
  reason: string;
}

/** Rough feasibility: outcomes to cover vs. minutes left before the deadline. */
function deterministicReadiness(
  input: GoalInput,
  outcomeCount: number,
): Readiness {
  const days = Math.max(
    0,
    Math.round((new Date(input.deadline).getTime() - Date.now()) / 86_400_000),
  );
  const minutesAvailable = days * input.daily_minutes;
  const minutesNeeded = outcomeCount * 400;

  if (days <= 0) {
    return {
      label: "Deadline passed",
      reason: "The date you picked is already behind us — choose a new one to start practising.",
    };
  }
  if (minutesAvailable >= minutesNeeded * 1.3) {
    return {
      label: "Comfortable",
      reason: `About ${days} days at ${input.daily_minutes} minutes leaves room to practise each outcome more than once.`,
    };
  }
  if (minutesAvailable >= minutesNeeded * 0.75) {
    return {
      label: "On track",
      reason: `${days} days at ${input.daily_minutes} minutes a day covers your outcomes if you keep a steady rhythm.`,
    };
  }
  return {
    label: "Tight",
    reason: `${days} days at ${input.daily_minutes} minutes is enough for the essentials — add time or move the date for full coverage.`,
  };
}

export async function assessReadiness(
  input: GoalInput,
  outcomes: OutcomeDraft[],
): Promise<Readiness> {
  if (!aiAvailable()) return deterministicReadiness(input, outcomes.length);

  const days = Math.max(
    0,
    Math.round((new Date(input.deadline).getTime() - Date.now()) / 86_400_000),
  );

  return await aiJson<Readiness>({
    name: "record_readiness",
    description: "Record a feasibility verdict for a learner's goal and schedule.",
    schema: objectSchema(
      {
        label: { type: "string", description: "Two or three words, e.g. 'On track', 'Tight'." },
        reason: {
          type: "string",
          description: "One sentence explaining the verdict in terms of time and outcomes.",
        },
      },
      ["label", "reason"],
    ),
    system:
      "You judge whether a language goal is achievable in the time available. " +
      "Be honest and specific; never mention models, tokens, or APIs. " +
      "Address the learner directly in plain English.",
    prompt:
      `Goal: ${input.raw_input}\nTarget language: ${input.target_language}\n` +
      `Days left: ${days}\nMinutes per day: ${input.daily_minutes}\n` +
      `Outcomes to reach:\n${outcomes.map((o) => `- ${o.label}: ${o.description}`).join("\n")}`,
    effort: "low",
    maxTokens: 1000,
  });
}
