import { mockGoalRepository } from "./mock/goal.repository.mock";
import { mockUserRepository } from "./mock/user.repository.mock";
import { supabaseGoalRepository } from "./supabase/goal.repository.supabase";
import { supabaseUserRepository } from "./supabase/user.repository.supabase";
import type { GoalRepository } from "./goal.repository";
import type { UserRepository } from "./user.repository";

/**
 * Mock-first repository selection (TZ.md §6). Only the `mock` branch is
 * expected to work today — `supabase` throws until Phase 6.
 */
const dataSource = process.env.EXPO_PUBLIC_DATA_SOURCE === "supabase" ? "supabase" : "mock";

export const goalRepository: GoalRepository =
  dataSource === "supabase" ? supabaseGoalRepository : mockGoalRepository;

export const userRepository: UserRepository =
  dataSource === "supabase" ? supabaseUserRepository : mockUserRepository;

export type { GoalDraft, GoalDraftInput, GoalRepository, JobRef } from "./goal.repository";
export type { ProfileUpdateInput, UserRepository } from "./user.repository";
