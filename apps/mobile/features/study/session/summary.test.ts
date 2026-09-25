import { describe, expect, it } from "@jest/globals";
import type { AnswerResult, Exercise, StudyAnswer } from "@yuny/shared";
import { daySummary, pauseAfter, portionCount, portionSummary, stageUps, type Logged } from "./summary";

const ex = (task_id: string, portion: number, headword = "买"): Exercise => ({
  task_id,
  code: "R1",
  lexeme: { headword, reading: null, tone_label: null, translation: null },
  is_retry: false,
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
