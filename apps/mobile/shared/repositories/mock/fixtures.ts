import type {
  AssessmentQuestion,
  AssessmentResult,
  Goal,
  GoalOutcome,
  LearningState,
  Mission,
  Profile,
  Recommendation,
  Roadmap,
} from "@yuny/shared";

/**
 * Realistic mock data (TZ.md §6 "Mock-first" — "без Lorem Ipsum"). One
 * user, mid-way through one active goal, matches the worked example TZ.md
 * §19 Phase 1 names explicitly: "Prepare for English job interviews".
 */
const NOW = new Date().toISOString();

export const MOCK_USER_ID = "b0dc2736-b2d0-4f23-bc95-f8dbcc234c29";
const MOCK_GOAL_ID = "f3d634fc-2ac0-4499-9443-16ea9901823d";

export const mockProfile: Profile = {
  id: MOCK_USER_ID,
  native_language: "ru",
  ui_language: "en",
  display_name: "Alex Morgan",
  created_at: NOW,
};

export const mockGoal: Goal = {
  id: MOCK_GOAL_ID,
  user_id: MOCK_USER_ID,
  raw_input:
    "I need to prepare for job interviews in English within the next three months.",
  title: "Prepare for English job interviews",
  target_language: "en",
  deadline: "2026-11-24",
  daily_minutes: 25,
  status: "active",
  readiness_label: "On track",
  readiness_reason:
    "Your speaking and vocabulary practice this week keeps you aligned with the interview deadline.",
  // The learner said B1 on screen 03; `goal-analyze` judged the goal itself
  // to need B2. The gap between the two is what the roadmap has to close.
  declared_cefr: "B1",
  required_cefr: "B2",
  created_at: NOW,
};

export const mockGoalOutcomes: GoalOutcome[] = [
  {
    id: "e26b28b2-485e-45ce-b2bb-73ab33457dd0",
    goal_id: MOCK_GOAL_ID,
    label: "Introduce yourself confidently",
    description:
      "Describe your background, skills, and motivation clearly in under two minutes.",
    position: 0,
    created_at: NOW,
  },
  {
    id: "0976f957-5785-4cd7-ac74-d286a7e9173b",
    goal_id: MOCK_GOAL_ID,
    label: "Answer behavioral questions",
    description:
      "Use concrete examples to answer \"Tell me about a time...\" questions naturally.",
    position: 1,
    created_at: NOW,
  },
  {
    id: "b85ada78-7239-4ff6-9841-d9829611835a",
    goal_id: MOCK_GOAL_ID,
    label: "Discuss your experience naturally",
    description:
      "Talk through your resume and past projects without sounding memorized.",
    position: 2,
    created_at: NOW,
  },
];

/**
 * Screen 06 (Initial Assessment) fixtures — text-only multiple choice
 * (vocabulary/grammar/reading). No listening/speaking items: those Activity
 * renderers don't exist until Phase 5 (TZ.md §19), and MVP Spec §9 lists
 * assessment activity types as possibilities, not a per-skill requirement.
 */
const MOCK_LEARNING_STATE_ID = "1c9a7c3b-1a52-4b7e-9b0a-2e6a2a9c6b41";

export const mockAssessmentQuestions: AssessmentQuestion[] = [
  {
    id: "a2f6d9c1-4b3a-4e7a-9c1a-6d2f8b1e3a01",
    skill: "vocabulary",
    prompt:
      "\"I'm excited about this ___ because it matches my experience.\" Which word fits best?",
    options: ["opportunity", "weather", "bicycle", "spoon"],
  },
  {
    id: "a2f6d9c1-4b3a-4e7a-9c1a-6d2f8b1e3a02",
    skill: "vocabulary",
    prompt: "Which word means the same as \"accomplished\" in \"I accomplished several projects\"?",
    options: ["completed", "forgot", "avoided", "postponed"],
  },
  {
    id: "a2f6d9c1-4b3a-4e7a-9c1a-6d2f8b1e3a03",
    skill: "grammar",
    prompt: "Which sentence is correct?",
    options: [
      "I have worked here for three years.",
      "I have worked here since three years.",
      "I working here for three years.",
      "I work here since three years.",
    ],
  },
  {
    id: "a2f6d9c1-4b3a-4e7a-9c1a-6d2f8b1e3a04",
    skill: "reading",
    prompt:
      "\"Tell me about a time you handled a difficult situation at work.\" What is the interviewer most likely asking for?",
    options: [
      "A specific example with a concrete outcome",
      "Your opinion on office difficulty in general",
      "A list of every job you've had",
      "Whether you enjoy difficult work",
    ],
  },
];

/**
 * Initial `learning_states` + `skill_states` (TZ.md §5) an `assessment-complete`
 * job would produce for the mock goal — realistic spread, not evenly zeroed
 * out, matching TZ.md §6 "Mock-first — реалистичные данные".
 */
export const mockLearningState: LearningState = {
  id: MOCK_LEARNING_STATE_ID,
  goal_id: MOCK_GOAL_ID,
  // The assessment confirmed the learner's own B1 estimate. Confidence is
  // high but not 1: fifteen questions narrow a band, they do not settle it.
  assessed_cefr: "B1",
  cefr_confidence: 0.72,
  updated_at: NOW,
  skill_states: [
    {
      id: "d4e1a9f2-6c3b-4a8d-9e1f-2b6c8a4d0e01",
      learning_state_id: MOCK_LEARNING_STATE_ID,
      skill: "listening",
      level: 0.72,
      confidence: 0.6,
      trend: "stable",
    },
    {
      id: "d4e1a9f2-6c3b-4a8d-9e1f-2b6c8a4d0e02",
      learning_state_id: MOCK_LEARNING_STATE_ID,
      skill: "speaking",
      level: 0.35,
      confidence: 0.55,
      trend: "stable",
    },
    {
      id: "d4e1a9f2-6c3b-4a8d-9e1f-2b6c8a4d0e03",
      learning_state_id: MOCK_LEARNING_STATE_ID,
      skill: "vocabulary",
      level: 0.55,
      confidence: 0.65,
      trend: "stable",
    },
    {
      id: "d4e1a9f2-6c3b-4a8d-9e1f-2b6c8a4d0e04",
      learning_state_id: MOCK_LEARNING_STATE_ID,
      skill: "grammar",
      level: 0.5,
      confidence: 0.6,
      trend: "stable",
    },
    {
      id: "d4e1a9f2-6c3b-4a8d-9e1f-2b6c8a4d0e05",
      learning_state_id: MOCK_LEARNING_STATE_ID,
      skill: "reading",
      level: 0.6,
      confidence: 0.6,
      trend: "stable",
    },
  ],
};

/**
 * Screen 07 (Assessment Result) — copy matches `docs/MVP Product
 * Specification.md` §10's exact worked example verbatim, and screen 08's
 * `focus_areas` matches its §11 example, since both are given as concrete
 * spec text rather than left to invention (frontend-builder boundary: does
 * not invent screen content).
 */
export const mockAssessmentResult: AssessmentResult = {
  id: "6f2c8d4a-3b1e-4c9a-8d2f-1a6c4b8e2f01",
  goal_id: MOCK_GOAL_ID,
  learning_state: mockLearningState,
  stronger_skill: "listening",
  needs_work_skill: "speaking",
  priority_label: "Interview vocabulary",
  // Declared and assessed agree here, which is the "confirmed" outcome of
  // the three on screen 07 (docs/onboarding-v2.md §4.2).
  declared_cefr: "B1",
  assessed_cefr: "B1",
  focus_areas: [
    "Build interview vocabulary",
    "Practice answering questions",
    "Improve listening comprehension",
    "Simulate interviews",
  ],
  created_at: NOW,
};

/**
 * Screen 09 (Home) "Today's Mission" fixture — mission title and reason are
 * verbatim `docs/MVP Product Specification.md` §12/§16 worked examples
 * ("Practice interview answers" / "Your speaking is currently your biggest
 * gap"), not invented copy (frontend-builder boundary: does not invent
 * screen content). `estimated_minutes` has no spec value to copy — 12 is a
 * plausible placeholder consistent with `mockGoal.daily_minutes` (25),
 * leaving room in the day for review, not a backend-computed figure.
 */
export const MOCK_MISSION_ID = "7c2e9a4d-1f6b-4c8a-9d3e-5b2f7a1c9e04";

export const mockRecommendation: Recommendation = {
  id: "3a9d5c1e-8b4f-4e2a-9c6d-1f8b3a5e9c02",
  goal_id: MOCK_GOAL_ID,
  mission_id: MOCK_MISSION_ID,
  mission_title: "Practice interview answers",
  estimated_minutes: 12,
  reason: "Your speaking is currently your biggest gap for your goal.",
  skills_affected: ["speaking"],
  created_at: NOW,
};

/**
 * Phase 5 Mission fixture — same shape `mission-generate`'s content-sourced
 * path produces in Supabase mode from the real "Greetings" chapter (5 vocabulary words: read,
 * repeat, write, say, listen), so manual testing looks the same in both
 * data sources. `mission.title` matches `mockRecommendation.mission_title`
 * above so Home's card and the Mission it opens agree with each other.
 */
export const mockMission: Mission = {
  id: MOCK_MISSION_ID,
  goal_id: MOCK_GOAL_ID,
  title: "Practice interview answers",
  purpose: 'Practise the vocabulary from "Greetings."',
  why: "Confident greetings are the first thing an interviewer hears — this is where practice pays off fastest.",
  estimated_minutes: 5,
  status: "pending",
  tasks: [
    {
      id: "8e1a2c4d-6f3b-4a9c-8d2e-1b6f4a8c2e01",
      mission_id: MOCK_MISSION_ID,
      type: "vocabulary_recall",
      payload: { sentence_with_blank: "One of the words from this lesson's study list is: ___." },
      position: 0,
      status: "pending",
    },
    {
      id: "8e1a2c4d-6f3b-4a9c-8d2e-1b6f4a8c2e02",
      mission_id: MOCK_MISSION_ID,
      type: "vocabulary_recall",
      payload: { sentence_with_blank: "One of the words from this lesson's study list is: ___." },
      position: 1,
      status: "pending",
    },
    {
      id: "8e1a2c4d-6f3b-4a9c-8d2e-1b6f4a8c2e03",
      mission_id: MOCK_MISSION_ID,
      type: "vocabulary_recall",
      payload: { sentence_with_blank: "One of the words from this lesson's study list is: ___." },
      position: 2,
      status: "pending",
    },
    {
      id: "8e1a2c4d-6f3b-4a9c-8d2e-1b6f4a8c2e04",
      mission_id: MOCK_MISSION_ID,
      type: "vocabulary_choice",
      payload: {
        prompt: "Which word was one of this lesson's study words?",
        options: ["say", "mountain", "computer", "umbrella"],
      },
      position: 3,
      status: "pending",
    },
    {
      id: "8e1a2c4d-6f3b-4a9c-8d2e-1b6f4a8c2e05",
      mission_id: MOCK_MISSION_ID,
      type: "vocabulary_choice",
      payload: {
        prompt: "Which word was one of this lesson's study words?",
        options: ["listen", "elephant", "mountain", "computer"],
      },
      position: 4,
      status: "pending",
    },
  ],
};

/**
 * The correct answer for each `mockMission` task, keyed by task id — kept
 * separate from `mockMission` itself for the same reason the real backend
 * keeps `activity_answer_keys` in its own table: a repository that returned
 * this alongside the task would leak the answer to the client.
 */
export const MOCK_MISSION_ANSWER_KEY: Record<string, { accepted?: string; correctIndex?: number }> = {
  "8e1a2c4d-6f3b-4a9c-8d2e-1b6f4a8c2e01": { accepted: "read" },
  "8e1a2c4d-6f3b-4a9c-8d2e-1b6f4a8c2e02": { accepted: "repeat" },
  "8e1a2c4d-6f3b-4a9c-8d2e-1b6f4a8c2e03": { accepted: "write" },
  "8e1a2c4d-6f3b-4a9c-8d2e-1b6f4a8c2e04": { correctIndex: 0 },
  "8e1a2c4d-6f3b-4a9c-8d2e-1b6f4a8c2e05": { correctIndex: 0 },
};

/**
 * The mock roadmap — the route this goal implies, in the order the planner
 * would work through it (docs/onboarding-v2.md §6).
 *
 * Exactly one module is `in_progress` and it is the one `mockMission`
 * belongs to; everything before it is `completed` and everything after is
 * `locked`. That invariant is the backend's, and the mock honours it so the
 * screens are exercised against valid data rather than against a shape that
 * could never occur.
 */
export const mockRoadmap: Roadmap = {
  goal_id: MOCK_GOAL_ID,
  completed_modules: 2,
  total_modules: 5,
  modules: [
    {
      id: "3f1c8b90-5d2e-4a76-9c14-7e0b3a5d1c01",
      goal_id: MOCK_GOAL_ID,
      topic_id: null,
      position: 0,
      title: "Introduce yourself",
      why: "Every interview opens here, so it is the cheapest place to sound fluent.",
      target_cefr: "A2",
      kind: "foundation",
      status: "completed",
    },
    {
      id: "3f1c8b90-5d2e-4a76-9c14-7e0b3a5d1c02",
      goal_id: MOCK_GOAL_ID,
      topic_id: null,
      position: 1,
      title: "Talk about your experience",
      why: "You can already name your role; this is about describing what you did in it.",
      target_cefr: "B1",
      kind: "topic",
      status: "completed",
    },
    {
      id: "3f1c8b90-5d2e-4a76-9c14-7e0b3a5d1c03",
      goal_id: MOCK_GOAL_ID,
      topic_id: null,
      position: 2,
      title: "Answer behavioural questions",
      why: "Your assessment showed you understand these questions but do not yet structure an answer.",
      target_cefr: "B1",
      kind: "topic",
      status: "in_progress",
    },
    {
      id: "3f1c8b90-5d2e-4a76-9c14-7e0b3a5d1c04",
      goal_id: MOCK_GOAL_ID,
      topic_id: null,
      position: 3,
      title: "Ask the interviewer questions",
      why: "The part most candidates skip, and the one that reads as confidence.",
      target_cefr: "B1",
      kind: "topic",
      status: "locked",
    },
    {
      id: "3f1c8b90-5d2e-4a76-9c14-7e0b3a5d1c05",
      goal_id: MOCK_GOAL_ID,
      topic_id: null,
      position: 4,
      title: "Handle a full interview",
      why: "Everything above, end to end, without stopping to translate.",
      target_cefr: "B2",
      kind: "topic",
      status: "locked",
    },
  ],
};
