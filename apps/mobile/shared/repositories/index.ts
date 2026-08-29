import { mockAssessmentRepository } from "./mock/assessment.repository.mock";
import { mockGoalRepository } from "./mock/goal.repository.mock";
import { mockMissionRepository } from "./mock/mission.repository.mock";
import { mockRecommendationRepository } from "./mock/recommendation.repository.mock";
import { mockRoadmapRepository } from "./mock/roadmap.repository.mock";
import { mockUserRepository } from "./mock/user.repository.mock";
import { supabaseAssessmentRepository } from "./supabase/assessment.repository.supabase";
import { supabaseGoalRepository } from "./supabase/goal.repository.supabase";
import { supabaseMissionRepository } from "./supabase/mission.repository.supabase";
import { supabaseRecommendationRepository } from "./supabase/recommendation.repository.supabase";
import { supabaseRoadmapRepository } from "./supabase/roadmap.repository.supabase";
import { supabaseUserRepository } from "./supabase/user.repository.supabase";
import type { AssessmentRepository } from "./assessment.repository";
import type { GoalRepository } from "./goal.repository";
import type { MissionRepository } from "./mission.repository";
import type { RecommendationRepository } from "./recommendation.repository";
import type { RoadmapRepository } from "./roadmap.repository";
import type { UserRepository } from "./user.repository";
import { DATA_SOURCE } from "@/shared/config/dataSource";

/**
 * Mock-first repository selection (TZ.md §6). Both branches are live: `mock`
 * needs no network, `supabase` talks to the real backend. Screens import the
 * exported instances and never learn which one they got — that is what makes
 * the switch a no-op for UI code (TZ.md §19 Phase 6 "Проверка").
 */

export const goalRepository: GoalRepository =
  DATA_SOURCE === "supabase" ? supabaseGoalRepository : mockGoalRepository;

export const userRepository: UserRepository =
  DATA_SOURCE === "supabase" ? supabaseUserRepository : mockUserRepository;

export const assessmentRepository: AssessmentRepository =
  DATA_SOURCE === "supabase" ? supabaseAssessmentRepository : mockAssessmentRepository;

export const recommendationRepository: RecommendationRepository =
  DATA_SOURCE === "supabase" ? supabaseRecommendationRepository : mockRecommendationRepository;

export const roadmapRepository: RoadmapRepository =
  DATA_SOURCE === "supabase" ? supabaseRoadmapRepository : mockRoadmapRepository;

export const missionRepository: MissionRepository =
  DATA_SOURCE === "supabase" ? supabaseMissionRepository : mockMissionRepository;

export type {
  DeclaredLevel,
  GoalAnalysis,
  GoalDraft,
  GoalDraftInput,
  GoalRepository,
  JobRef,
} from "./goal.repository";
export type { ProfileUpdateInput, UserRepository } from "./user.repository";
export type { AssessmentAnswerInput, AssessmentRepository } from "./assessment.repository";
export type { RecommendationRepository } from "./recommendation.repository";
export type { RoadmapRepository } from "./roadmap.repository";
export type { MissionRepository, TaskResponseInput } from "./mission.repository";
