/**
 * `assessment-next` (TZ.md §6) — serves one question at a time for screen 06.
 *
 * Questions are served from the server-side bank so `correct_index` never
 * crosses the wire: the client has no SELECT right on `assessment_questions`
 * at all. For a target language with no bank rows yet, a batch is generated
 * once and persisted, so the second learner in that language pays nothing.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  aiAvailable,
  aiJson,
  handler,
  HandlerError,
  json,
  objectSchema,
  requireUuid,
  SKILLS,
} from "../_shared/shared.ts";

/** Length of the initial assessment (MVP Spec §9 — short, not a full exam). */
const MAX_QUESTIONS = 8;

interface BankRow {
  id: string;
  skill: string;
  prompt: string;
  options: string[];
  position: number;
}

interface GeneratedQuestion {
  skill: string;
  prompt: string;
  options: string[];
  correct_index: number;
  difficulty: number;
}

/**
 * Text-only multiple choice (vocabulary / grammar / reading). Speaking and
 * Listening renderers are Phase 5 work, so the initial assessment must not
 * depend on them.
 */
async function generateBank(language: string): Promise<GeneratedQuestion[]> {
  const { questions } = await aiJson<{ questions: GeneratedQuestion[] }>({
    name: "record_assessment_bank",
    description: "Record a short multiple-choice placement bank for one language.",
    schema: objectSchema(
      {
        questions: {
          type: "array",
          minItems: 8,
          maxItems: 12,
          items: objectSchema(
            {
              skill: { type: "string", enum: ["vocabulary", "grammar", "reading"] },
              prompt: { type: "string" },
              options: { type: "array", minItems: 3, maxItems: 4, items: { type: "string" } },
              correct_index: { type: "integer" },
              difficulty: { type: "integer", description: "1 (easiest) to 5 (hardest)." },
            },
            ["skill", "prompt", "options", "correct_index", "difficulty"],
          ),
        },
      },
      ["questions"],
    ),
    system:
      "You write short placement questions for language learners. Exactly one option is " +
      "correct and the wrong options are plausible, not silly. Instructions are in English; " +
      "the material being tested is in the target language. Spread difficulty from easy to hard.",
    prompt: `Target language (BCP-47 code): ${language}. Cover vocabulary, grammar and reading.`,
    maxTokens: 8000,
  });
  return questions;
}

Deno.serve(
  handler(async ({ userId, admin, body }) => {
    const goalId = requireUuid(body, "goal_id");

    const { data: goal } = await admin
      .from("goals")
      .select("id, target_language")
      .eq("id", goalId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!goal) throw new HandlerError("goal_not_found", 404);

    const { data: answerRows } = await admin
      .from("assessment_answers")
      .select("question_id")
      .eq("goal_id", goalId);

    const answered = new Set<string>((answerRows ?? []).map((row) => row.question_id as string));
    if (Array.isArray(body.answered_ids)) {
      for (const id of body.answered_ids) if (typeof id === "string") answered.add(id);
    }

    if (answered.size >= MAX_QUESTIONS) return json({ done: true, question: null });

    const language = goal.target_language as string;
    let { data: bank } = await admin
      .from("assessment_questions")
      .select("id, skill, prompt, options, position")
      .eq("language", language)
      .order("position", { ascending: true });

    if (!bank || bank.length === 0) {
      if (aiAvailable()) {
        const generated = await generateBank(language);
        await admin.from("assessment_questions").insert(
          generated
            .filter((question) => (SKILLS as readonly string[]).includes(question.skill))
            .map((question, index) => ({
              language,
              skill: question.skill,
              prompt: question.prompt,
              options: question.options,
              correct_index: Math.max(0, Math.min(question.options.length - 1, question.correct_index)),
              difficulty: Math.max(1, Math.min(5, question.difficulty)),
              position: index,
            })),
        );
        ({ data: bank } = await admin
          .from("assessment_questions")
          .select("id, skill, prompt, options, position")
          .eq("language", language)
          .order("position", { ascending: true }));
      }

      // Still nothing: fall back to the seeded English bank rather than
      // stranding the learner mid-onboarding.
      if (!bank || bank.length === 0) {
        ({ data: bank } = await admin
          .from("assessment_questions")
          .select("id, skill, prompt, options, position")
          .eq("language", "en")
          .order("position", { ascending: true }));
      }
    }

    const next = ((bank ?? []) as BankRow[]).find((row) => !answered.has(row.id));
    if (!next) return json({ done: true, question: null });

    return json({
      done: false,
      question: {
        id: next.id,
        skill: next.skill,
        prompt: next.prompt,
        options: next.options,
      },
    });
  }),
);
