import { BackendError } from "@/shared/lib/backendError";
import type { StudyRepository } from "../study.repository";
import { delay } from "./delay";
import { TODAY_FIXTURES, todayFixture, type TodayFixture } from "./study.fixtures";

/**
 * Состояние карточки «Сегодня» в mock-режиме, по образцу
 * `EXPO_PUBLIC_MOCK_SETTINGS`: `ready` (по умолчанию), `debt`, `done`,
 * `nothing_due`, `no_words`, `error`, `slow`.
 */
const MOCK_TODAY = process.env.EXPO_PUBLIC_MOCK_TODAY;

export const mockStudyRepository: StudyRepository = {
  async preview() {
    if (MOCK_TODAY === "error") {
      await delay(null);
      throw new BackendError("session_preview_failed");
    }
    const name: TodayFixture = MOCK_TODAY && MOCK_TODAY in TODAY_FIXTURES ? (MOCK_TODAY as TodayFixture) : "ready";
    return delay(todayFixture(name), MOCK_TODAY === "slow" ? 3000 : 400);
  },
};
