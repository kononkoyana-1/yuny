import { AnswerResultSchema, FolderStudyPlanSchema, type AnswerResult, type Exercise } from "@yuny/shared";
import { BackendError } from "@/shared/lib/backendError";
import { correctAnswerText, localVerdict } from "@/shared/lib/studyVerdict";
import type { StudyRepository } from "../study.repository";
import { delay } from "./delay";
import { TODAY_FIXTURES, todayFixture, type TodayFixture } from "./study.fixtures";
import { mockLearningSettingsRepository } from "./learningSettings.repository.mock";
import { mockFolderMap, mockFolderProgress, mockWordProgress } from "./study.overview.mock";
import { mockStudySession, pairCard, pairTasks, r1 } from "./study.session.fixtures";

/**
 * Состояние карточки «Сегодня» в mock-режиме, по образцу
 * `EXPO_PUBLIC_MOCK_SETTINGS`: `ready` (по умолчанию), `debt`, `done`,
 * `nothing_due`, `no_words`, `error`, `slow`.
 */
const MOCK_TODAY = process.env.EXPO_PUBLIC_MOCK_TODAY;

/**
 * Сессия: `start_error` — задания не собрались; `flaky` — каждый второй
 * ответ теряется в сети (очередь отправки); `slow` — ответ идёт 2 секунды.
 */
const MOCK_STUDY = process.env.EXPO_PUBLIC_MOCK_STUDY;

/** Выданные задания — mock проверяет ответ по ним, как сервер по билету. */
const issued = new Map<string, Exercise>();
let submits = 0;

function remember(list: Exercise[]): Exercise[] {
  for (const e of list) issued.set(e.task_id, e);
  return list;
}

function result(over: Partial<AnswerResult>): AnswerResult {
  return AnswerResultSchema.parse({
    outcome: "seen",
    correct: {},
    error_type: null,
    partner: null,
    explanation: [],
    next: [],
    stage: null,
    known: false,
    duplicate: false,
    ...over,
  });
}

export const mockStudyRepository: StudyRepository = {
  async preview() {
    if (MOCK_TODAY === "error") {
      await delay(null);
      throw new BackendError("session_preview_failed");
    }
    const name: TodayFixture = MOCK_TODAY && MOCK_TODAY in TODAY_FIXTURES ? (MOCK_TODAY as TodayFixture) : "ready";
    const today = todayFixture(name);
    // Бюджет и «окно уже было сегодня» — из mock-настроек, как сервер из `learning_settings`.
    const settings = await mockLearningSettingsRepository.get().catch(() => null);
    const preview = settings
      ? {
        ...today,
        budget_minutes: settings.session_minutes,
        show_daily_prompt: today.show_daily_prompt && settings.last_prompt_on !== today.today,
      }
      : today;
    return delay(preview, MOCK_TODAY === "slow" ? 3000 : 400);
  },

  async folderProgress() {
    return delay(await mockFolderProgress(), 300);
  },

  async folderMap(folderId) {
    return delay(await mockFolderMap(folderId), 400);
  },

  async wordProgress(word) {
    return delay(mockWordProgress(word), 300);
  },

  async folderPlan() {
    // Как в folder-study.design.md §3: новые слова главным, повторить и практика — вторыми.
    return delay(
      FolderStudyPlanSchema.parse({
        primary: { mode: "new", count: 7, total_new: 18, minutes: 7 },
        alternatives: [
          { mode: "review", count: 3, total_new: null, minutes: 2 },
          { mode: "practice", count: null, total_new: null, minutes: 5 },
        ],
        practice_note: false,
        load_warning: null,
      }),
      300,
    );
  },

  async start(input) {
    if (MOCK_STUDY === "start_error") {
      await delay(null);
      throw new BackendError("network_error");
    }
    // Папка: режим как просили (по умолчанию — новые); «Ещё 7 новых» — раунд знакомства.
    const session = mockStudySession(
      input.mode === "folder"
        ? { mode: "folder", folder_mode: input.folder_mode ?? "new" }
        : input.extra_new
          ? { mode: "folder", folder_mode: "new" }
          : { mode: "today", folder_mode: null },
    );
    remember(session.exercises);
    return delay(session, 600);
  },

  async submit({ task_id, answer }) {
    await delay(null, MOCK_STUDY === "slow" ? 2000 : 250);
    if (MOCK_STUDY === "flaky" && ++submits % 2 === 1) throw new BackendError("network_error");
    const e = issued.get(task_id);
    if (!e) throw new BackendError("ticket_invalid");

    if ("choice" in answer) return result({ outcome: "seen" });
    if ("self" in answer) {
      return answer.self === "recalled"
        ? result({ outcome: "correct", stage_before: "recognize", stage: "recall" })
        : result({ outcome: "wrong" });
    }

    const verdict = localVerdict(e, answer) ?? "wrong";
    const correct = { ...e.key, text: correctAnswerText(e, null) ?? undefined };
    if (verdict === "correct") {
      // Верный ответ двигает слово на стадию выше; верное «卖» в блоке пары — пара решена.
      return result({
        outcome: "correct",
        correct,
        stage_before: "meeting",
        stage: "recognize",
        pair_resolved: e.lexeme?.headword === "卖" ? { a: "买", b: "卖" } : null,
      });
    }

    // Ошибка: слово вернётся через пару заданий в лёгком формате.
    const retry = e.lexeme?.headword === "卖" ? r1("mai4", 0, true) : r1("mai", 0, true);
    const confused = e.code === "R1" && "option_id" in answer && answer.option_id === "o1" && e.lexeme?.headword === "买";
    if (confused) {
      return result({
        outcome: "wrong",
        correct,
        error_type: "confusion",
        partner: { headword: "卖", reading: "mài", meaning: "продавать" },
        explanation: ["买 mǎi — «покупать», 卖 mài — «продавать».", "У 卖 сверху есть 十."],
        next: remember([pairCard(), ...pairTasks(), retry]),
      });
    }
    if (verdict === "partial") {
      return result({
        outcome: "partial",
        correct,
        error_type: "tone",
        explanation: [`Слог верный, тон — ${e.lexeme?.tone_label ?? "другой"}: ${e.lexeme?.reading ?? ""}`],
        next: remember([retry]),
      });
    }
    return result({
      outcome: "wrong",
      correct,
      error_type: "blank" in answer ? "blank" : "wrong",
      explanation: e.lexeme ? [`${e.lexeme.headword} ${e.lexeme.reading ?? ""} — «${e.lexeme.translation ?? ""}».`] : [],
      next: remember([retry]),
    });
  },

  async pairStart() {
    await delay(null, 200);
  },
};
