import { MissionResultSchema, MissionSchema, TaskResultSchema } from "@yuny/shared";
import type { MissionRepository, TaskResponseInput } from "../mission.repository";
import { delay } from "./delay";
import { MOCK_MISSION_ANSWER_KEY, mockMission } from "./fixtures";

/**
 * Mock `MissionRepository` (TZ.md §6). Grades the same way the real
 * `activity-submit`/`evaluateResponse` does — exact word match for
 * `vocabulary_recall`, index match for `vocabulary_choice` — against
 * `MOCK_MISSION_ANSWER_KEY`, which plays the role `activity_answer_keys`
 * plays server-side: the client-visible `mockMission` never carries it.
 */
const submitted = new Map<string, "weak" | "strong">();

export const mockMissionRepository: MissionRepository = {
  /**
   * Task `status` is projected from what has actually been submitted, rather
   * than returned frozen at `pending` from the fixture. The real backend
   * persists these statuses, and Home reads them to show how far through a
   * mission the learner is — a mock that always answers "nothing done" would
   * make that indicator untestable without the real database.
   */
  async getMission(missionId) {
    if (missionId !== mockMission.id) throw new Error(`No mock mission found for ${missionId}`);
    return delay(
      MissionSchema.parse({
        ...mockMission,
        status: mockMission.tasks.every((task) => submitted.has(task.id))
          ? "completed"
          : submitted.size > 0
            ? "active"
            : mockMission.status,
        tasks: mockMission.tasks.map((task) => ({
          ...task,
          status: submitted.has(task.id) ? "completed" : task.status,
        })),
      }),
      400,
    );
  },

  async submitTask(activityId, response: TaskResponseInput) {
    const key = MOCK_MISSION_ANSWER_KEY[activityId];
    if (!key) throw new Error(`No mock answer key for task ${activityId}`);

    let correct: boolean;
    if ("text" in response) {
      correct = response.text.trim().toLowerCase() === key.accepted;
    } else {
      correct = response.selected_index === key.correctIndex;
    }

    submitted.set(activityId, correct ? "strong" : "weak");
    const missionCompleted = mockMission.tasks.every((task) => submitted.has(task.id));

    return delay(
      TaskResultSchema.parse({
        feedback: {
          went_well: correct
            ? "You picked the right option straight away."
            : "You worked through the question rather than skipping it.",
          improve: correct
            ? "Try using this word out loud next time so it becomes automatic."
            : "Look at how the correct answer is built, then say it out loud once.",
          example: null,
        },
        evidence: { strength: correct ? "strong" : "weak" },
        mascot_state: {
          id: "b4b3f5a2-6c8e-4a1d-9f3b-2e6c8a4d0e01",
          user_id: mockMission.goal_id,
          stage: 1,
          mood: correct ? "celebrating" : "neutral",
          growth_progress: Math.min(0.999, submitted.size * 0.08),
          updated_at: new Date().toISOString(),
        },
        mission_completed: missionCompleted,
      }),
      350,
    );
  },

  async getMissionResult(missionId) {
    if (missionId !== mockMission.id) throw new Error(`No mock mission found for ${missionId}`);

    const strengths = mockMission.tasks.map((task) => submitted.get(task.id));
    return delay(
      MissionResultSchema.parse({
        mission_id: mockMission.id,
        title: mockMission.title,
        total_tasks: mockMission.tasks.length,
        correct_tasks: strengths.filter((s) => s === "strong").length,
        skills_practiced: ["vocabulary"],
      }),
      300,
    );
  },

  // Mock mode has exactly one fixture mission, always available — "generating"
  // just hands back its id, matching `mockRecommendationRepository`'s
  // always-available `mockRecommendation` (both source from the same
  // `mockMission`). The real work here lives in `SupabaseMissionRepository`.
  async generate() {
    return delay({ job_id: "mock-job-mission-generate", kind: "mission_generate" }, 400);
  },

  async getGenerated() {
    return delay({ mission_id: mockMission.id }, 300);
  },
};
