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

/**
 * How long a mission is. Three-to-six tasks is a spot check: the learner
 * meets a word once and the session is over before the module it belongs to
 * has been practised at all. Fifteen to twenty is a session — long enough to
 * meet an item, use it, and meet it again, and long enough to fill the daily
 * minutes the learner committed to.
 *
 * It is a range rather than a number because the authoring call aims at MAX
 * and everything downstream filters: an unrenderable type, an empty payload
 * or a repeated target costs a task, not the mission. MIN is the floor below
 * which a draft is not worth shipping and the caller re-authors or falls back.
 */
const MISSION_MIN_TASKS = 15;
const MISSION_MAX_TASKS = 20;

/**
 * Multiple-choice options with the correct one placed at a rotating index.
 *
 * Every deterministic MC task here used to be built correct-answer-first with
 * `correct_index: 0`. At three tasks that is a smell; at twenty it is a
 * winning strategy — a learner who always taps the first option scores full
 * marks and learns nothing. `seed` is the task's own position, so the correct
 * answer moves across the options evenly and the same mission still builds
 * the same way twice.
 */
function choiceOptions(
  correct: string,
  distractors: string[],
  seed: number,
): { options: string[]; correctIndex: number } {
  const options = [correct, ...distractors];
  const correctIndex = seed % options.length;
  options.splice(correctIndex, 0, options.splice(0, 1)[0]);
  return { options, correctIndex };
}

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

/**
 * Last-resort content: no AI key, or an AI response with nothing renderable
 * left in it after filtering. These items are deliberately general — nothing
 * on this path knows which module the learner is in, so pretending to be
 * on-theme would be a lie told in the mission title. What the bank does claim
 * is that every item is correct English, every item renders, and there are
 * enough of them to be a mission rather than a stub. Anything better needs
 * the model.
 */
const FALLBACK_CHOICES: { prompt: string; correct: string; distractors: string[] }[] = [
  {
    prompt: 'Which word completes: "I am ___ in this role because it matches my experience."',
    correct: "interested",
    distractors: ["interesting", "interest", "interestingly"],
  },
  {
    prompt: "Choose the correct sentence.",
    correct: "I have been studying English for two months.",
    distractors: [
      "I am studying English since two months.",
      "I study English since two months.",
      "I have studied English since two months ago.",
    ],
  },
  {
    prompt: 'Which word completes: "She ___ to work by train every morning."',
    correct: "goes",
    distractors: ["go", "going", "gone"],
  },
  {
    prompt: 'Which word completes: "There ___ a lot of people at the station."',
    correct: "were",
    distractors: ["was", "has", "is being"],
  },
  {
    prompt: "Choose the correct question.",
    correct: "How long have you lived here?",
    distractors: [
      "How long you live here?",
      "How long do you living here?",
      "How long are you live here?",
    ],
  },
  {
    prompt: 'Which word completes: "I would like ___ information about the course."',
    correct: "some",
    distractors: ["a", "many", "few"],
  },
  {
    prompt: 'Which word completes: "He is good ___ solving problems."',
    correct: "at",
    distractors: ["in", "on", "for"],
  },
  {
    prompt: "Choose the correct sentence.",
    correct: "I did not understand the last question.",
    distractors: [
      "I did not understood the last question.",
      "I not understood the last question.",
      "I was not understand the last question.",
    ],
  },
  {
    prompt: 'Which word completes: "We need to ___ a decision before Friday."',
    correct: "make",
    distractors: ["do", "take", "give"],
  },
  {
    prompt: 'Which word completes: "If it ___ tomorrow, we will stay at home."',
    correct: "rains",
    distractors: ["will rain", "rained", "would rain"],
  },
  {
    prompt: 'Which word completes: "This is the ___ film I have ever seen."',
    correct: "best",
    distractors: ["better", "most good", "goodest"],
  },
  {
    prompt: "Choose the correct sentence.",
    correct: "She told me that she was busy.",
    distractors: [
      "She told to me that she was busy.",
      "She said me that she was busy.",
      "She told me that she is busy yesterday.",
    ],
  },
];

const FALLBACK_RECALLS: { sentence: string; answers: string[] }[] = [
  { sentence: "I ___ (work) here since 2019.", answers: ["have worked"] },
  {
    sentence: "She ___ (not / like) coffee in the morning.",
    answers: ["does not like", "doesn't like"],
  },
  { sentence: "They ___ (arrive) at the hotel an hour ago.", answers: ["arrived"] },
  { sentence: "We are looking forward ___ meeting you.", answers: ["to"] },
  { sentence: "This task ___ (be) more difficult than the last one.", answers: ["is"] },
  { sentence: "I have lived in this city ___ five years.", answers: ["for"] },
  {
    sentence: "If I ___ (have) more time, I would learn another language.",
    answers: ["had"],
  },
  { sentence: "The report ___ (send) to the client yesterday.", answers: ["was sent"] },
];

function deterministicMission(
  goalTitle: string,
  focusSkill: Skill,
  dailyMinutes: number,
): MissionDraft {
  // Interleaved rather than "all the choices, then all the recalls": twenty
  // tasks of one shape in a row is the same session twice, and alternating
  // recognition with production is the point of practising at this length.
  // Client-renderable types only (see `CLIENT_RENDERABLE_TYPES`) — this path
  // exists precisely because nothing else worked, so it cannot afford to
  // produce a task the client will refuse to draw.
  const activities: ActivityDraft[] = [];
  for (let i = 0; activities.length < MISSION_MAX_TASKS; i += 1) {
    const choice = FALLBACK_CHOICES[i];
    if (choice) {
      const { options, correctIndex } = choiceOptions(
        choice.correct,
        choice.distractors,
        activities.length,
      );
      activities.push({
        type: "vocabulary_choice",
        skill: "vocabulary",
        payload: { prompt: choice.prompt, options },
        answer_key: { correct_index: correctIndex },
      });
    }
    const recall = FALLBACK_RECALLS[i];
    if (recall && activities.length < MISSION_MAX_TASKS) {
      activities.push({
        type: "vocabulary_recall",
        skill: "vocabulary",
        payload: { sentence_with_blank: recall.sentence },
        answer_key: { accepted_answers: recall.answers },
      });
    }
    if (!choice && !recall) break;
  }

  return {
    title: `Warm up your ${focusSkill}`,
    purpose: `Practise the ${focusSkill} you need for "${goalTitle}" in short, concrete steps.`,
    why: `Your ${focusSkill} is the skill holding this goal back right now, so this is where practice pays off fastest.`,
    primary_skill: focusSkill,
    estimated_minutes: estimateMinutes(activities.length, dailyMinutes),
    activities,
  };
}

/**
 * A mission's estimate describes the mission, not the learner's daily budget:
 * with a fixed task count the honest number comes from the tasks. The daily
 * budget is still the floor, because a mission that claims to be shorter than
 * the time the learner set aside reads as a mistake.
 */
function estimateMinutes(taskCount: number, dailyMinutes: number): number {
  return Math.max(5, Math.min(40, Math.max(Math.ceil(taskCount * 0.6), dailyMinutes)));
}

export interface GenerateMissionOptions {
  goalTitle: string;
  targetLanguage: string;
  outcomes: { label: string; description: string }[];
  levels: Record<Skill, number>;
  focusSkill: Skill;
  dailyMinutes: number;
  /**
   * The roadmap module the learner is currently inside, when there is one.
   * A mission stamped with `roadmap_module_id` had better be *about* that
   * module: the map tells the learner "you are working through Travel", and a
   * mission about supermarket vocabulary filed under it makes the map a label
   * rather than a description of what is happening.
   */
  module?: { title: string; targetCefr: string } | null;
}

/**
 * One authored activity plus the item it practises. The target is not stored
 * anywhere — it exists so the model has to name what a task is *about* before
 * writing it (the field is declared first, and `propertyOrdering` makes that
 * order real), and so the code below can tell two tasks on the same word
 * apart. Over twenty tasks that distinction is the difference between a
 * mission and a list.
 */
interface AuthoredActivity {
  draft: ActivityDraft;
  target: string;
}

interface RawActivity {
  target: string;
  type: ActivityType;
  skill: Skill;
  payload_json: string;
  answer_key_json: string;
}

// `payload` and `answer_key` are free-form per activity type, and strict
// schemas require `additionalProperties: false` on every object — so they
// travel as JSON strings and are parsed on arrival.
const ACTIVITY_SCHEMA = objectSchema(
  {
    target: {
      type: "string",
      description:
        "The one word, phrase or pattern this task practises. Every activity in " +
        "the mission practises a different target.",
    },
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
  ["target", "type", "skill", "payload_json", "answer_key_json"],
);

const AUTHORING_SYSTEM =
  "You design language practice missions: a run of short tasks a learner works through " +
  "in one sitting. Content must be in the learner's target language where the learner " +
  "produces or reads it, with instructions in English. Every activity must be answerable " +
  "on a phone in under a minute. Never put the correct answer in the payload. In multiple " +
  "choice, vary which position the correct option sits in.";

/** The learner's situation, identical for the first call and any top-up. */
function missionBrief(options: GenerateMissionOptions): string {
  return (
    `Goal: ${options.goalTitle}\nTarget language: ${options.targetLanguage}\n` +
    `Outcomes:\n${options.outcomes.map((o) => `- ${o.label}: ${o.description}`).join("\n")}\n` +
    `Current levels (0-1):\n${SKILLS.map((s) => `- ${s}: ${options.levels[s].toFixed(2)}`).join("\n")}\n` +
    `Skill to focus on: ${options.focusSkill}\n` +
    (options.module
      ? `Current module: ${options.module.title} (aim at CEFR ${options.module.targetCefr})\n` +
        `Everything in this mission must belong to that module's theme and level.\n`
      : "")
  );
}

/**
 * Output budget. Twenty activities land at roughly three thousand tokens, and
 * `callGemini` treats `MAX_TOKENS` as a hard failure rather than salvaging a
 * truncated object — so the budget is set well clear of the estimate. Thinking
 * is billed against the same ceiling (see `THINKING_HEADROOM` in shared.ts).
 */
const AUTHORING_TOKENS = 16000;

interface RawMission extends Omit<MissionDraft, "activities"> {
  activities: RawActivity[];
}

/** Raw activities → drafts, dropping anything the client could not draw. */
function toAuthored(raw: RawActivity[], fallbackSkill: Skill): AuthoredActivity[] {
  return (raw ?? [])
    .filter((activity) => CLIENT_RENDERABLE_TYPES.includes(activity.type))
    .map((activity) => ({
      target: String(activity.target ?? "").trim().toLowerCase(),
      draft: {
        type: activity.type,
        skill: isSkill(activity.skill) ? activity.skill : fallbackSkill,
        payload: parseJsonObject(activity.payload_json) ?? {},
        answer_key: parseJsonObject(activity.answer_key_json),
      } as ActivityDraft,
    }))
    .filter((entry) => Object.keys(entry.draft.payload).length > 0);
}

/**
 * Repetition is the failure mode a longer mission invites: at four tasks the
 * model has no room to repeat itself, at twenty it has plenty. Targets catch
 * two tasks on the same item; the payload signature catches the same sentence
 * arriving under two different targets.
 */
function dedupeAuthored(entries: AuthoredActivity[]): AuthoredActivity[] {
  const targets = new Set<string>();
  const payloads = new Set<string>();
  const kept: AuthoredActivity[] = [];

  for (const entry of entries) {
    const signature = JSON.stringify(entry.draft.payload);
    if (entry.target && targets.has(entry.target)) continue;
    if (payloads.has(signature)) continue;
    if (entry.target) targets.add(entry.target);
    payloads.add(signature);
    kept.push(entry);
  }
  return kept;
}

/**
 * Models lean hard towards putting the correct option first, and a response
 * schema cannot express "vary the answer position" — the instruction in the
 * system prompt helps but does not bind. Across four tasks that lean is
 * invisible; across twenty it is a shortcut the learner will find before the
 * vocabulary. The correct option is moved to a position-derived index and the
 * key rewritten to match, so the answer stays correct and stops being
 * guessable from its place in the list.
 */
function spreadCorrectAnswers(drafts: ActivityDraft[]): ActivityDraft[] {
  return drafts.map((draft, position) => {
    if (draft.type !== "vocabulary_choice") return draft;

    const options = draft.payload.options;
    const current = draft.answer_key?.correct_index;
    if (!Array.isArray(options) || options.length < 2) return draft;
    if (typeof current !== "number" || current < 0 || current >= options.length) return draft;

    const placed = choiceOptions(
      String(options[current]),
      options.filter((_, index) => index !== current).map(String),
      position,
    );
    return {
      ...draft,
      payload: { ...draft.payload, options: placed.options },
      answer_key: { ...draft.answer_key, correct_index: placed.correctIndex },
    };
  });
}

/**
 * A follow-up call for the tasks the first one did not deliver. It is capped
 * at one attempt on purpose: a model that under-delivers twice is having a bad
 * day, and a third round would spend the learner's waiting time to discover
 * that. The targets already covered travel with it, so this extends the
 * mission rather than restating its opening.
 */
async function authorMoreActivities(
  options: GenerateMissionOptions,
  count: number,
  covered: string[],
): Promise<AuthoredActivity[]> {
  try {
    const extra = await aiJson<{ activities: RawActivity[] }>({
      name: "extend_mission",
      description: "Add more practice activities to a mission already in progress.",
      schema: objectSchema(
        { activities: { type: "array", minItems: 1, maxItems: count, items: ACTIVITY_SCHEMA } },
        ["activities"],
      ),
      system: AUTHORING_SYSTEM,
      prompt:
        missionBrief(options) +
        `\nThe mission already practises these targets — do not repeat any of them:\n` +
        covered.map((target) => `- ${target}`).join("\n") +
        `\n\nWrite ${count} further activities that extend the same mission.`,
      maxTokens: AUTHORING_TOKENS,
    });
    return toAuthored(extra.activities, options.focusSkill);
  } catch (error) {
    // The mission already has usable tasks; losing the top-up shortens it but
    // must not cost the learner the whole session.
    console.error("mission_topup_failed", error);
    return [];
  }
}

export async function generateMission(
  options: GenerateMissionOptions,
): Promise<MissionDraft> {
  if (!aiAvailable()) {
    return deterministicMission(options.goalTitle, options.focusSkill, options.dailyMinutes);
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
        activities: {
          type: "array",
          minItems: MISSION_MIN_TASKS,
          maxItems: MISSION_MAX_TASKS,
          items: ACTIVITY_SCHEMA,
        },
      },
      ["title", "purpose", "why", "primary_skill", "estimated_minutes", "activities"],
    ),
    system: AUTHORING_SYSTEM,
    prompt:
      missionBrief(options) +
      `\nWrite ${MISSION_MAX_TASKS} activities. Each practises a different target, and ` +
      `together they build: recognition first, recall and production later. Mix multiple ` +
      `choice and fill-in-the-blank roughly evenly.\n` +
      `Time budget: about ${options.dailyMinutes} minutes in total.`,
    maxTokens: AUTHORING_TOKENS,
  });

  let authored = dedupeAuthored(toAuthored(mission.activities, options.focusSkill));

  if (authored.length < MISSION_MIN_TASKS) {
    const extra = await authorMoreActivities(
      options,
      MISSION_MAX_TASKS - authored.length,
      authored.map((entry) => entry.target).filter(Boolean),
    );
    authored = dedupeAuthored([...authored, ...extra]);
  }

  authored = authored.slice(0, MISSION_MAX_TASKS);

  if (authored.length === 0) {
    return deterministicMission(options.goalTitle, options.focusSkill, options.dailyMinutes);
  }

  // Short of the floor even after the top-up, the choice is between a shorter
  // mission that is about the learner's module and a full-length one from the
  // generic fallback bank. On-theme wins: padding would hide a model problem
  // behind filler the learner did not need. The log line is what makes the
  // shortfall visible instead.
  if (authored.length < MISSION_MIN_TASKS) {
    console.warn("mission_below_floor", authored.length, MISSION_MIN_TASKS);
  }

  const activities = spreadCorrectAnswers(authored.map((entry) => entry.draft));

  return {
    title: mission.title,
    purpose: mission.purpose,
    why: mission.why,
    primary_skill: isSkill(mission.primary_skill) ? mission.primary_skill : options.focusSkill,
    estimated_minutes: Math.max(
      estimateMinutes(activities.length, options.dailyMinutes),
      Math.min(40, mission.estimated_minutes || 0),
    ),
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
function topicChoiceTask(
  chapterTitle: string,
  siblingTitles: string[],
  seed: number,
): ActivityDraft {
  const { options, correctIndex } = choiceOptions(
    chapterTitle,
    siblingTitles.filter((t) => t !== chapterTitle).slice(0, 3),
    seed,
  );
  return {
    type: "vocabulary_choice",
    skill: "vocabulary",
    payload: { prompt: "Which topic does this lesson cover?", options },
    answer_key: { correct_index: correctIndex },
  };
}

const GENERIC_DISTRACTOR_WORDS = ["mountain", "computer", "umbrella", "elephant"];

/**
 * The *correct* option is always a real extracted word; foils prefer other
 * real words from the same chapter, topping up with fixed generic filler
 * only when the chapter doesn't have enough of its own.
 */
function vocabularyChoiceTask(
  correctWord: string,
  realDistractorPool: string[],
  seed: number,
): ActivityDraft {
  const realDistractors = realDistractorPool.filter((w) => w !== correctWord).slice(0, 3);
  const { options, correctIndex } = choiceOptions(
    correctWord,
    [
      ...realDistractors,
      ...GENERIC_DISTRACTOR_WORDS.filter((w) => !realDistractors.includes(w)),
    ].slice(0, 3),
    seed,
  );
  return {
    type: "vocabulary_choice",
    skill: "vocabulary",
    payload: { prompt: "Which word was one of this lesson's study words?", options },
    answer_key: { correct_index: correctIndex },
  };
}

/**
 * How much of a content-sourced mission may be built rather than drawn from
 * real exercises. `vocabularyChoiceTask` and `topicChoiceTask` ask the same
 * question every time, with only the options changing — at two of five tasks
 * that is acceptable padding, at twelve of twenty it is the mission. A chapter
 * that cannot reach the floor mostly from its own validated exercises is not
 * ready to carry a session, and the caller authors on-theme instead.
 */
const MAX_SYNTHETIC_TASKS = 4;

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
  /**
   * The open roadmap module's topic, when the learner is inside one. Narrowing
   * to it is what makes the mission's `roadmap_module_id` mean something: a
   * chapter drawn from any topic at all, then filed under "Travel", would turn
   * the map into decoration. Returning null when this topic has nothing ready
   * is the correct outcome — the caller then authors on-theme instead.
   */
  topicId?: string | null,
): Promise<{ draft: MissionDraft; contentUnitId: string } | null> {
  if (focusSkill !== "vocabulary") return null;

  let topicUnitIds: string[] | null = null;
  if (topicId) {
    const { data: topicUnits } = await admin
      .from("content_unit_topics")
      .select("content_unit_id")
      .eq("topic_id", topicId);
    topicUnitIds = ((topicUnits ?? []) as { content_unit_id: string }[]).map(
      (row) => row.content_unit_id,
    );
    if (topicUnitIds.length === 0) return null;
  }

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
  ]
    .filter((id) => !usedUnitIds.includes(id))
    .filter((id) => topicUnitIds === null || topicUnitIds.includes(id));
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

  // Real exercises first, and as many of them as the chapter has: these are
  // the tasks an author wrote and a reviewer approved, so they carry the
  // mission. Everything after this point is scaffolding around them.
  for (const exercise of fillBlanks) {
    if (drafts.length >= MISSION_MAX_TASKS) break;
    drafts.push(fromFillBlank(exercise));
    const word = Array.isArray(exercise.payload.accepted_answers)
      ? String(exercise.payload.accepted_answers[0])
      : null;
    if (word) usedWords.push(word);
  }

  const realTaskCount = drafts.length;

  for (const word of words.filter((w) => !usedWords.includes(w))) {
    if (drafts.length >= MISSION_MAX_TASKS) break;
    if (drafts.length - realTaskCount >= MAX_SYNTHETIC_TASKS) break;
    drafts.push(vocabularyChoiceTask(word, words, drafts.length));
    usedWords.push(word);
  }

  if (drafts.length < MISSION_MAX_TASKS && drafts.length - realTaskCount < MAX_SYNTHETIC_TASKS) {
    drafts.push(topicChoiceTask(unit.title, siblingTitles, drafts.length));
  }

  // Below the floor the chapter simply is not a session's worth of reviewed
  // material. Returning null is the honest answer: `mission-generate` then
  // authors a full-length mission on the module's theme, which beats shipping
  // a six-task mission or padding one with invented filler.
  if (drafts.length < MISSION_MIN_TASKS) return null;

  return {
    contentUnitId: unit.id,
    draft: {
      title: `Warm up: ${unit.title}`,
      purpose: `Practise the vocabulary from "${unit.title}"${unit.part_title ? ` (${unit.part_title})` : ""}.`,
      why: `Vocabulary is the skill holding this goal back right now, and this chapter is ready to practise.`,
      primary_skill: "vocabulary",
      estimated_minutes: estimateMinutes(drafts.length, 5),
      activities: drafts,
    },
  };
}
