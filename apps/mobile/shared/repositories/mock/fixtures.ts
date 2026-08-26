import type { Goal, GoalOutcome, Profile } from "@yuny/shared";

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
