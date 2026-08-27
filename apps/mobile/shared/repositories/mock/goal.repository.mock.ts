import { GoalOutcomeSchema, GoalSchema } from "@yuny/shared";
import type { Goal } from "@yuny/shared";
import type {
  GoalAnalysis,
  GoalDraft,
  GoalDraftInput,
  GoalRepository,
  JobRef,
} from "../goal.repository";
import { capitalize } from "@/shared/lib/capitalize";
import { delay } from "./delay";
import { mockGoal, mockGoalOutcomes } from "./fixtures";

/**
 * In-memory `goal_analyze` job results, keyed by `job_id` (TZ.md §6 async
 * job pattern). Never evicted — acceptable for mock-mode scope (this map
 * lives only for one JS session and is replaced entirely by real Postgres
 * `jobs` rows in Phase 6), same lifetime as `mockUserRepository`'s
 * in-memory `currentProfile`.
 */
const analysisJobs = new Map<string, GoalAnalysis>();

/**
 * In-memory active-goal slot, starting `null` (fresh install, no Goal yet —
 * TZ.md §19 Phase 3's own success check: "пользователь доходит до Home с
 * активной Goal" implies starting without one). `confirm()` is the only
 * writer; `getActive()` reads it back, the same pattern as
 * `mockUserRepository`'s `currentProfile`. `(tabs)/_layout.tsx`'s onboarding
 * gate and `(tabs)/index.tsx`'s Home both depend on `getActive()` actually
 * transitioning from `null` to a real Goal — a hardcoded always-active
 * return here makes onboarding unreachable in the mock app entirely.
 */
let activeGoal: Goal | null = null;

const OUTCOME_DRAFT_SCHEMA = GoalOutcomeSchema.pick({
  label: true,
  description: true,
  position: true,
});

/** No real NLP in mock mode — light heuristic so different input still reads differently. */
function deriveTitle(rawInput: string): string {
  const trimmed = rawInput.trim().replace(/\.+$/, "");
  if (!trimmed) return mockGoal.title;
  const capitalized = capitalize(trimmed);
  return capitalized.length > 80 ? `${capitalized.slice(0, 77)}...` : capitalized;
}

/**
 * Mock `GoalRepository` (TZ.md §6). Every returned value is parsed through
 * its Zod schema, exactly like a real Edge Function response would be
 * (TZ.md §6 "Валидация") — this is what makes swapping in
 * `SupabaseGoalRepository` in Phase 6 a no-op for every screen.
 */
export const mockGoalRepository: GoalRepository = {
  async getActive() {
    return delay(activeGoal ? GoalSchema.parse(activeGoal) : null);
  },

  async getOutcomes(goalId) {
    const rows = mockGoalOutcomes.filter((outcome) => outcome.goal_id === goalId);
    return delay(rows.map((row) => GoalOutcomeSchema.parse(row)));
  },

  async analyze(input: GoalDraftInput) {
    const jobRef: JobRef = { job_id: `mock-job-${Date.now()}`, kind: "goal_analyze" };
    analysisJobs.set(jobRef.job_id, {
      title: deriveTitle(input.raw_input),
      target_situations: [
        "Interviewing for roles that use the target language day to day",
        "Small talk with interviewers before the formal questions start",
      ],
      required_skills: ["speaking", "vocabulary", "listening"],
      outcomes: mockGoalOutcomes.map((outcome) => OUTCOME_DRAFT_SCHEMA.parse(outcome)),
    });
    return delay(jobRef, 800);
  },

  async getAnalysis(jobId) {
    const analysis = analysisJobs.get(jobId);
    if (!analysis) {
      throw new Error(`No goal analysis found for job ${jobId}`);
    }
    return delay(analysis, 300);
  },

  async confirm(draft: GoalDraft) {
    const confirmed = GoalSchema.parse({
      ...mockGoal,
      raw_input: draft.raw_input,
      title: draft.title,
      target_language: draft.target_language,
      deadline: draft.deadline,
      daily_minutes: draft.daily_minutes,
      status: "active",
    });
    activeGoal = confirmed;
    return delay(confirmed, 600);
  },
};
