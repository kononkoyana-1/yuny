import { ProfileSchema } from "@yuny/shared";
import type { ProfileUpdateInput, UserRepository } from "../user.repository";
import { delay } from "./delay";
import { mockProfile } from "./fixtures";

/** In-memory so `updateProfile` reads back its own writes during a session. */
let currentProfile = { ...mockProfile };

export const mockUserRepository: UserRepository = {
  async getProfile() {
    return delay(ProfileSchema.parse(currentProfile));
  },

  async updateProfile(patch: ProfileUpdateInput) {
    currentProfile = ProfileSchema.parse({ ...currentProfile, ...patch });
    return delay(currentProfile, 300);
  },

  async getEmail() {
    return delay("anya@example.com");
  },

  async deleteAccount() {
    await delay(undefined, 600);
    currentProfile = { ...mockProfile };
  },
};
