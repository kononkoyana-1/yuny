import { create } from "zustand";
import type { GoalOutcome } from "@yuny/shared";
import type { AssessmentAnswerInput, DeclaredLevel } from "@/shared/repositories";

/**
 * Ephemeral cross-screen onboarding draft (TZ.md §2 — Zustand is "только
 * эфемерный UI-стейт"). Screens 01-08 live in one `(onboarding)` Stack and
 * jointly build up one `GoalDraft` + one assessment run; nothing here is
 * persisted or sent anywhere on its own — each mutation still goes through
 * a repository call (goal-analyze/goal-confirm/assessment-*), this store
 * only carries values between those calls and the screens that need them.
 */
export type DraftOutcome = Pick<GoalOutcome, "label" | "description" | "position">;

interface OnboardingState {
  targetLanguage: string | null;
  rawInput: string;
  deadline: string;
  dailyMinutes: number | null;
  /**
   * What the learner said about their own level on screen 03. The assessment
   * needs it to know which band to open on, so it has to survive the trip
   * from screen 03 to screen 06.
   */
  declaredLevel: DeclaredLevel | null;
  analysisJobId: string | null;
  /** True once `title`/`outcomes` have been seeded from the current `analysisJobId`'s result. */
  analysisSeeded: boolean;
  title: string;
  outcomes: DraftOutcome[];
  goalId: string | null;
  answeredIds: string[];
  assessmentJobId: string | null;

  setTargetLanguage: (code: string) => void;
  setGoalSetup: (input: {
    rawInput: string;
    deadline: string;
    dailyMinutes: number;
    declaredLevel: DeclaredLevel;
  }) => void;
  setAnalysisJobId: (jobId: string) => void;
  seedAnalysis: (title: string, outcomes: DraftOutcome[]) => void;
  setTitle: (title: string) => void;
  setOutcome: (index: number, patch: Partial<DraftOutcome>) => void;
  setGoalId: (goalId: string) => void;
  recordAnswer: (answer: AssessmentAnswerInput) => void;
  setAssessmentJobId: (jobId: string) => void;
  reset: () => void;
}

const INITIAL_DRAFT = {
  targetLanguage: null,
  rawInput: "",
  deadline: "",
  dailyMinutes: null,
  declaredLevel: null,
  analysisJobId: null,
  analysisSeeded: false,
  title: "",
  outcomes: [],
  goalId: null,
  answeredIds: [],
  assessmentJobId: null,
} satisfies Omit<
  OnboardingState,
  | "setTargetLanguage"
  | "setGoalSetup"
  | "setAnalysisJobId"
  | "seedAnalysis"
  | "setTitle"
  | "setOutcome"
  | "setGoalId"
  | "recordAnswer"
  | "setAssessmentJobId"
  | "reset"
>;

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...INITIAL_DRAFT,

  setTargetLanguage: (code) => set({ targetLanguage: code }),

  setGoalSetup: ({ rawInput, deadline, dailyMinutes, declaredLevel }) =>
    set({ rawInput, deadline, dailyMinutes, declaredLevel }),

  setAnalysisJobId: (jobId) => set({ analysisJobId: jobId, analysisSeeded: false }),

  seedAnalysis: (title, outcomes) => set({ title, outcomes, analysisSeeded: true }),

  setTitle: (title) => set({ title }),

  setOutcome: (index, patch) =>
    set((state) => ({
      outcomes: state.outcomes.map((outcome, i) => (i === index ? { ...outcome, ...patch } : outcome)),
    })),

  setGoalId: (goalId) => set({ goalId }),

  recordAnswer: (answer) =>
    set((state) => ({ answeredIds: [...state.answeredIds, answer.question_id] })),

  setAssessmentJobId: (jobId) => set({ assessmentJobId: jobId }),

  reset: () => set(INITIAL_DRAFT),
}));
