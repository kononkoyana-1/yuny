import { describe, expect, it } from "@jest/globals";
import type { AnswerResult, Exercise, StudyAnswer } from "@yuny/shared";
import {
  daySummary,
  pauseAfter,
  portionCount,
  portionSummary,
  roundProgress,
  roundSummary,
  stageUps,
  type Logged,
} from "./summary";

const ex = (task_id: string, portion: number, headword = "买"): Exercise => ({
  task_id,
  code: "R1",
  lexeme: { headword, reading: null, tone_label: null, translation: null },
  is_retry: false,
  is_check: false,
  portion,
  options: [{ id: "o0", text: "a", kind: "ru", a11y: "" }],
  key: { option_id: "o0" },
});

const result = (over: Partial<AnswerResult>): AnswerResult => ({
  outcome: "correct",
  correct: {},
  error_type: null,
  partner: null,
  explanation: [],
  next: [],
  stage: null,
  stage_before: null,
  pair_resolved: null,
  known: false,
  duplicate: false,
  ...over,
});

const logged = (task: Exercise, portion: number, given: StudyAnswer, r: AnswerResult | null): Logged => ({
  task,
  given,
  local: "option_id" in given ? (given.option_id === "o0" ? "correct" : "wrong") : null,
  result: r,
  failed: false,
  portion,
});

describe("порции", () => {
  it("пауза после последнего задания каждой порции, кроме последней", () => {
    const list = [ex("a", 0), ex("b", 0), ex("c", 1), ex("d", 1), ex("e", 2)];
    expect([...pauseAfter(list)]).toEqual([["b", 1], ["d", 2]]);
    expect(portionCount(list)).toBe(3);
    expect(pauseAfter([ex("a", 0)]).size).toBe(0);
  });

  it("итог порции: вспомнили — верно или почти, знакомство не считается", () => {
    const intro = { ...ex("i", 0), code: "intro" as const };
    const log = [
      logged(ex("a", 0), 1, { option_id: "o0" }, null),
      logged(ex("b", 0), 1, { option_id: "o1" }, result({ outcome: "wrong" })),
      logged(ex("c", 0), 1, { option_id: "o1" }, result({ outcome: "partial" })),
      logged(intro, 1, { choice: "ok" }, result({ outcome: "seen" })),
      logged(ex("d", 1), 2, { option_id: "o0" }, null),
    ];
    expect(portionSummary(log, 1)).toMatchObject({ recalled: 2, answered: 3 });
  });
});

describe("стадии и пары", () => {
  it("по слову — первая стадия «до» и последняя «после», только рост", () => {
    const log = [
      logged(ex("a", 0, "买"), 1, { option_id: "o0" }, result({ stage_before: "meeting", stage: "recognize" })),
      logged(ex("b", 0, "买"), 1, { option_id: "o0" }, result({ stage_before: "recognize", stage: "recall" })),
      logged(ex("c", 0, "卖"), 1, { option_id: "o0" }, result({ stage_before: "recall", stage: "recall" })),
      logged(ex("d", 0, "贵"), 1, { option_id: "o1" }, result({ stage_before: "recall", stage: "recognize" })),
    ];
    expect(stageUps(log)).toEqual([{ headword: "买", reading: null, from: "meeting", to: "recall" }]);
  });

  it("решённые пары без повторов", () => {
    const pair = { a: "买", b: "卖" };
    const log = [
      logged(ex("a", 0), 1, { option_id: "o0" }, result({ pair_resolved: pair })),
      logged(ex("b", 0), 1, { option_id: "o0" }, result({ pair_resolved: pair })),
    ];
    expect(daySummary(log).pairsResolved).toEqual([pair]);
  });
});

describe("итог раунда", () => {
  it("знакомства без подтверждённых «уже знаю», без повторов", () => {
    const intro = (id: string, headword: string): Exercise => ({ ...ex(id, 0, headword), code: "intro" });
    const log = [
      logged(intro("i1", "火锅"), 1, { choice: "remember" }, result({ outcome: "seen" })),
      logged(intro("i2", "米饭"), 1, { choice: "know" }, result({ outcome: "seen" })),
      logged(ex("c1", 0, "米饭"), 1, { option_id: "o0" }, result({ known: true })),
      logged(intro("i3", "火锅"), 1, { choice: "remember" }, null),
    ];
    expect(roundSummary(log)).toEqual({
      learned: [{ headword: "火锅", reading: null }],
      known: [{ headword: "米饭", reading: null }],
    });
  });
});

describe("счётчик раунда «3 из 7 слов»", () => {
  const intro = (id: string, headword: string): Exercise => ({ ...ex(id, 0, headword), code: "intro" });
  const words = [intro("i1", "火锅"), intro("i2", "米饭"), intro("i3", "豆腐"), ex("r", 0, "火锅")];

  it("слово запомнено после двух верных вспоминаний; проверка и знакомство не в счёт", () => {
    const log = [
      logged(intro("i1", "火锅"), 1, { choice: "remember" }, null),
      logged(ex("a", 0, "火锅"), 1, { option_id: "o0" }, null),
      logged({ ...ex("k", 0, "豆腐"), is_check: true }, 1, { option_id: "o0" }, result({})),
      logged(ex("b", 0, "豆腐"), 1, { option_id: "o1" }, result({ outcome: "wrong" })),
    ];
    expect(roundProgress(words, log)).toEqual({ learned: 0, total: 3 });
    log.push(logged(ex("c", 0, "火锅"), 1, { option_id: "o1" }, result({ outcome: "partial" })));
    expect(roundProgress(words, log)).toEqual({ learned: 1, total: 3 });
  });

  it("подтверждённое «Уже знаю» тоже закрывает слово", () => {
    const log = [logged({ ...ex("k", 0, "米饭"), is_check: true }, 1, { option_id: "o0" }, result({ known: true }))];
    expect(roundProgress(words, log)).toEqual({ learned: 1, total: 3 });
  });

  it("слова не из раунда не считаются", () => {
    const log = [
      logged(ex("a", 0, "贵"), 1, { option_id: "o0" }, null),
      logged(ex("b", 0, "贵"), 1, { option_id: "o0" }, null),
    ];
    expect(roundProgress(words, log).learned).toBe(0);
  });
});
