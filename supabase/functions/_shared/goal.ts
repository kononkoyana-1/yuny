/**
 * Goal generators (TZ.md §6 `goal-analyze`, `goal-confirm`).
 *
 * Each has an AI implementation and a deterministic one. The deterministic
 * branch is not a stub: it keeps onboarding walkable when `GEMINI_API_KEY`
 * is not configured, so `EXPO_PUBLIC_DATA_SOURCE=supabase` behaves like the
 * mock source (TZ.md §19 Phase 6 "Проверка").
 */
import { CEFR_ORDER, type CefrLevel } from "./cefr.ts";
import { aiAvailable, aiJson, isSkill, objectSchema, SKILLS, type Skill } from "./shared.ts";

const SKILL_ENUM = { type: "string", enum: [...SKILLS] };
const CEFR_ENUM = { type: "string", enum: [...CEFR_ORDER] };

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
  /**
   * The band this goal actually demands. Screen 04 shows it, `goals` stores
   * it, and the roadmap exists to close the gap between it and the learner's
   * measured band (docs/onboarding-v2.md §6, rule 3).
   */
  required_cefr: CefrLevel;
  /**
   * Canonical topic slugs the goal implies — chosen from the taxonomy the
   * caller passes in, never invented. Screen 04 renders them, and the roadmap
   * treats them as relevance input that content coverage then filters.
   */
  topics: string[];
}

export interface GoalInput {
  raw_input: string;
  target_language: string;
  deadline: string;
  daily_minutes: number;
  /** A CEFR band, or "unknown" when the learner picked "I'm not sure" (§4.1). */
  declared_level: string;
}

/**
 * Without AI there is nothing to judge a goal's language demand against, so
 * the fallback states a mid-scale band rather than pretending to a reading it
 * did not take. B1 is the honest neutral: high enough that the roadmap still
 * has a gap to close for a beginner, low enough that it does not fabricate an
 * advanced target for someone whose goal is ordinary.
 */
const FALLBACK_REQUIRED_CEFR: CefrLevel = "B1";

/**
 * Slug-word matching against the learner's own words. Crude on purpose: it
 * only ever returns real slugs from the canonical list, so the worst case is
 * an empty list — which screen 04 already renders as "no chips", not as an
 * error.
 */
function deterministicTopics(rawInput: string, topicSlugs: string[]): string[] {
  const words = new Set(rawInput.toLowerCase().match(/[a-z]+/g) ?? []);
  return topicSlugs
    .filter((slug) => slug.split("-").some((part) => part.length > 3 && words.has(part)))
    .slice(0, 5);
}

function titleFrom(rawInput: string): string {
  const trimmed = rawInput.trim().replace(/[.!?]+$/, "");
  if (!trimmed) return "Your language goal";
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return capitalized.length > 80 ? `${capitalized.slice(0, 77)}...` : capitalized;
}

/**
 * `topicSlugs` is the canonical taxonomy, read by the caller and passed in:
 * this module stays free of I/O so both branches are testable, and the model
 * gets a closed list to choose from rather than licence to invent a topic the
 * content pipeline has never heard of.
 */
export async function analyzeGoal(
  input: GoalInput,
  topicSlugs: string[],
): Promise<GoalAnalysis> {
  if (!aiAvailable()) {
    return {
      required_cefr: FALLBACK_REQUIRED_CEFR,
      topics: deterministicTopics(input.raw_input, topicSlugs),
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
        required_cefr: {
          ...CEFR_ENUM,
          description:
            "The CEFR band this goal genuinely demands — the level at which the learner " +
            "could handle these situations, not an aspirational ceiling.",
        },
        topics: {
          type: "array",
          minItems: 1,
          maxItems: 6,
          items: { type: "string", enum: topicSlugs },
          description: "Topic slugs this goal implies, most relevant first.",
        },
      },
      ["title", "target_situations", "required_skills", "outcomes", "required_cefr", "topics"],
    ),
    system:
      "You design language-learning plans. Turn a learner's own words into concrete, " +
      "observable outcomes. Write plainly in the learner's UI language (English). " +
      "Never invent facts about the learner that they did not state. " +
      "Choose topics only from the list given to you.",
    prompt:
      `Learner's own words: "${input.raw_input}"\n` +
      `Target language: ${input.target_language}\n` +
      `Learner's own estimate of their level: ${input.declared_level}\n` +
      `Deadline: ${input.deadline}\n` +
      `Time available per day: ${input.daily_minutes} minutes\n` +
      `Available topics: ${topicSlugs.join(", ")}`,
  });

  // The enum constrains the model, but the taxonomy is the authority: a slug
  // that is not in the canonical list cannot become a roadmap module, so it is
  // dropped here rather than surfacing on screen 04 as a promise nothing backs.
  const allowed = new Set(topicSlugs);

  return {
    required_cefr: analysis.required_cefr,
    topics: analysis.topics.filter((slug) => allowed.has(slug)),
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
    maxTokens: 1000,
  });
}
