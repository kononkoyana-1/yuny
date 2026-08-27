/**
 * `mission-from-content` (Phase 5) — the only new server-side logic this
 * phase needs. Materializes exactly one real `missions` row + 5
 * `activities` rows for a learner's goal, sourced from an already-processed
 * content pipeline chapter (TZ.md's content pipeline: content_sources →
 * content_units → knowledge_items → generated_exercises).
 *
 * Deliberately NOT an extension of `mission-generate` (that function is the
 * AI/skill-gap-driven generator — a different concern) and never calls
 * `aiJson()` — every task here is a deterministic mapping from data that
 * already exists. Once created, the mission behaves exactly like any other:
 * `activity-submit` grades it, `recommendation-get` surfaces it on Home,
 * `missions.status` flips to `completed` the same way.
 *
 * Idempotent per (goal_id, content_unit_id) — a partial unique index on
 * `missions` makes a second call return the existing mission rather than
 * duplicate one.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handler, HandlerError, json, requireUuid } from "../_shared/shared.ts";

const TASK_COUNT = 5;

interface KnowledgeRow {
  id: string;
  kind: string;
  data: Record<string, unknown>;
}
interface ExerciseRow {
  id: string;
  knowledge_item_id: string;
  type: string;
  payload: Record<string, unknown>;
}

interface TaskDraft {
  type: "vocabulary_choice" | "vocabulary_recall";
  payload: Record<string, unknown>;
  answerKey: Record<string, unknown>;
}

/**
 * Real generated fill-in-the-blank exercises become `text_input` tasks
 * verbatim — no re-authoring, the content pipeline already produced them.
 */
function fromFillBlank(exercise: ExerciseRow): TaskDraft {
  return {
    type: "vocabulary_recall",
    payload: {
      sentence_with_blank: exercise.payload.sentence_with_blank,
      skill: "vocabulary",
    },
    answerKey: { accepted_answers: exercise.payload.accepted_answers },
  };
}

/**
 * When the chapter doesn't have enough multiple_choice exercises on its
 * own (this pilot chapter has none), build the simplest deterministic MC
 * question there is: "which topic is this?", with three *other real*
 * chapter titles as distractors — same template already used for grammar
 * knowledge in `_shared/content.ts`'s deterministic fallback, applied to
 * topic recognition instead. Nothing invented: every option is a real
 * title from the same source. Exactly one of these per mission — asking
 * the identical question twice in a 5-task quiz would read as a mistake.
 */
function topicChoiceTask(chapterTitle: string, siblingTitles: string[]): TaskDraft {
  const distractors = siblingTitles.filter((t) => t !== chapterTitle).slice(0, 3);
  const options = [chapterTitle, ...distractors];
  return {
    type: "vocabulary_choice",
    payload: {
      prompt: "Which topic does this lesson cover?",
      options,
      skill: "vocabulary",
    },
    answerKey: { correct_index: 0 },
  };
}

/**
 * A generic, always-available distractor pool — words no beginner ESOL
 * lesson in this book teaches — for when a second multiple_choice task is
 * needed and there is no second real chapter's vocabulary to draw wrong
 * options from (true for this pilot chapter: it's the only one with any
 * extracted vocabulary). The *correct* option is always a real extracted
 * word; only the foils are this fixed filler.
 */
const GENERIC_DISTRACTOR_WORDS = ["mountain", "computer", "umbrella", "elephant"];

function vocabularyChoiceTask(correctWord: string, realDistractorPool: string[]): TaskDraft {
  // Prefer other real words from this same chapter as distractors — only
  // top up with generic filler when the chapter doesn't have enough.
  const realDistractors = realDistractorPool.filter((w) => w !== correctWord).slice(0, 3);
  const distractors = [
    ...realDistractors,
    ...GENERIC_DISTRACTOR_WORDS.filter((w) => !realDistractors.includes(w)),
  ].slice(0, 3);
  return {
    type: "vocabulary_choice",
    payload: {
      prompt: "Which word was one of this lesson's study words?",
      options: [correctWord, ...distractors],
      skill: "vocabulary",
    },
    answerKey: { correct_index: 0 },
  };
}

Deno.serve(
  handler(async ({ userId, admin, body }) => {
    const goalId = requireUuid(body, "goal_id");
    const contentUnitId = requireUuid(body, "content_unit_id");

    const { data: goal } = await admin
      .from("goals")
      .select("id")
      .eq("id", goalId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!goal) throw new HandlerError("goal_not_found", 404);

    // Idempotent: a mission already exists for this (goal, chapter) pair.
    const { data: existing } = await admin
      .from("missions")
      .select("id")
      .eq("goal_id", goalId)
      .eq("content_unit_id", contentUnitId)
      .maybeSingle();
    if (existing) return json({ mission_id: existing.id, created: false });

    const { data: unit } = await admin
      .from("content_units")
      .select("id, source_id, title, part_title")
      .eq("id", contentUnitId)
      .maybeSingle();
    if (!unit) throw new HandlerError("content_unit_not_found", 404);

    const { data: knowledge } = await admin
      .from("knowledge_items")
      .select("id, kind, data")
      .eq("content_unit_id", contentUnitId)
      .eq("kind", "vocabulary");

    const { data: exercises } = await admin
      .from("generated_exercises")
      .select("id, knowledge_item_id, type, payload")
      .in("knowledge_item_id", ((knowledge ?? []) as KnowledgeRow[]).map((k) => k.id));

    const fillBlanks = ((exercises ?? []) as ExerciseRow[]).filter((e) => e.type === "fill_blank");

    const { data: siblings } = await admin
      .from("content_units")
      .select("title")
      .eq("source_id", unit.source_id as string)
      .eq("kind", "chapter")
      .limit(10);
    const siblingTitles = ((siblings ?? []) as { title: string }[]).map((s) => s.title);

    const words = fillBlanks
      .map((e) => (Array.isArray(e.payload.accepted_answers) ? String(e.payload.accepted_answers[0]) : null))
      .filter((w): w is string => Boolean(w));

    const drafts: TaskDraft[] = [];
    const usedWords: string[] = [];

    // Up to 3 real words become text_input tasks, verbatim from the
    // pipeline's own generated exercises — no re-authoring.
    for (const exercise of fillBlanks) {
      if (usedWords.length >= 3) break;
      drafts.push(fromFillBlank(exercise));
      const word = Array.isArray(exercise.payload.accepted_answers)
        ? String(exercise.payload.accepted_answers[0])
        : null;
      if (word) usedWords.push(word);
    }

    // Remaining real words (not spent on a text_input task) become
    // multiple_choice tasks — the correct answer is always real vocabulary
    // from this chapter, distractors prefer other real words from it too.
    for (const word of words.filter((w) => !usedWords.includes(w))) {
      if (drafts.length >= TASK_COUNT) break;
      drafts.push(vocabularyChoiceTask(word, words));
      usedWords.push(word);
    }

    // Still short (the chapter didn't yield enough vocabulary): fall back
    // to one topic-recognition question, grounded in real sibling titles.
    if (drafts.length < TASK_COUNT) {
      drafts.push(topicChoiceTask(unit.title as string, siblingTitles));
    }

    if (drafts.length !== TASK_COUNT) throw new HandlerError("insufficient_content", 422);

    const { data: mission, error: missionError } = await admin
      .from("missions")
      .insert({
        user_id: userId,
        goal_id: goalId,
        content_unit_id: contentUnitId,
        title: `Warm up: ${unit.title}`,
        purpose: `Practise the vocabulary from "${unit.title}"${unit.part_title ? ` (${unit.part_title})` : ""}.`,
        why: `This chapter is already processed and ready — a real first mission to prove the learning loop end to end.`,
        primary_skill: "vocabulary",
        estimated_minutes: 5,
        status: "pending",
      })
      .select("id")
      .single();
    if (missionError || !mission) throw new HandlerError("mission_create_failed", 500);

    const { data: activities, error: activitiesError } = await admin
      .from("activities")
      .insert(
        drafts.map((draft, index) => ({
          user_id: userId,
          mission_id: mission.id,
          type: draft.type,
          payload: draft.payload,
          position: index,
          status: "pending",
        })),
      )
      .select("id, position");
    if (activitiesError || !activities) throw new HandlerError("mission_create_failed", 500);

    await admin.from("activity_answer_keys").insert(
      activities.map((activity) => ({
        activity_id: activity.id,
        key: drafts[activity.position as number].answerKey,
      })),
    );

    return json({ mission_id: mission.id, created: true, tasks: activities.length });
  }),
);
