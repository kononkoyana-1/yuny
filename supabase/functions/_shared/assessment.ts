/**
 * Assessment summary generator (TZ.md §6 `assessment-complete`) — the
 * screen-07 "Stronger / Needs Work / Priority" copy. Backend-owned: the
 * client never derives skill priority (TZ.md §3 Rule 1).
 */
import { aiAvailable, aiJson, isSkill, objectSchema, SKILLS, type Skill } from "./shared.ts";

const SKILL_ENUM = { type: "string", enum: [...SKILLS] };

export interface AssessmentSummary {
  stronger_skill: Skill;
  needs_work_skill: Skill;
  priority_label: string;
  focus_areas: string[];
}

export async function summarizeAssessment(
  goalTitle: string,
  levels: Record<Skill, number>,
  requiredSkills: Skill[],
): Promise<AssessmentSummary> {
  const ranked = [...SKILLS].sort((a, b) => levels[b] - levels[a]);
  const stronger = ranked[0];
  const relevant = requiredSkills.length > 0 ? requiredSkills : [...SKILLS];
  const needsWork =
    [...relevant].sort((a, b) => levels[a] - levels[b])[0] ?? ranked[ranked.length - 1];

  if (!aiAvailable()) {
    return {
      stronger_skill: stronger,
      needs_work_skill: needsWork,
      priority_label: `${needsWork.charAt(0).toUpperCase()}${needsWork.slice(1)} practice`,
      focus_areas: [
        `Build ${needsWork} confidence in real situations`,
        `Keep your ${stronger} strong with regular use`,
        "Practise answering without preparing the wording first",
        "Review what you got wrong before moving on",
      ],
    };
  }

  const summary = await aiJson<AssessmentSummary>({
    name: "record_assessment_summary",
    description: "Record what an initial language assessment says about a learner.",
    schema: objectSchema(
      {
        stronger_skill: SKILL_ENUM,
        needs_work_skill: SKILL_ENUM,
        priority_label: {
          type: "string",
          description: "Two or three words naming the single top priority.",
        },
        focus_areas: {
          type: "array",
          minItems: 3,
          maxItems: 5,
          items: { type: "string" },
          description: "Ordered focus areas, each a short imperative phrase.",
        },
      },
      ["stronger_skill", "needs_work_skill", "priority_label", "focus_areas"],
    ),
    system:
      "You interpret a language assessment for the learner. Be encouraging and specific. " +
      "Never mention scores, percentages, models, or APIs.",
    prompt:
      `Goal: ${goalTitle}\nSkills that matter for this goal: ${relevant.join(", ")}\n` +
      `Measured levels (0-1):\n${SKILLS.map((s) => `- ${s}: ${levels[s].toFixed(2)}`).join("\n")}`,
    effort: "low",
    maxTokens: 1500,
  });

  return {
    stronger_skill: isSkill(summary.stronger_skill) ? summary.stronger_skill : stronger,
    needs_work_skill: isSkill(summary.needs_work_skill) ? summary.needs_work_skill : needsWork,
    priority_label: summary.priority_label,
    focus_areas: summary.focus_areas,
  };
}
