import { describe, expect, it } from "@jest/globals";
import type { AnswerResult, Exercise } from "@yuny/shared";
import { BackendError } from "@/shared/lib/backendError";
import { correctAnswerText, localVerdict, trayOutcome } from "@/shared/lib/studyVerdict";
import {
  advancesImmediately,
  anchorOf,
  checkFailed,
  dropChecks,
  dropWord,
  insertNext,
  pairBlockLength,
  RETRY_GAP,
  wordKey,
} from "./queue";
import { createOutbox } from "./outbox";

const ex = (task_id: string, over: Partial<Exercise> = {}): Exercise => ({
  task_id,
  code: "R1",
  lexeme: { headword: "买", reading: "mǎi", tone_label: null, translation: "покупать" },
  is_retry: false,
  is_check: false,
  portion: 0,
  ...over,
});
const ids = (xs: Exercise[]) => xs.map((x) => x.task_id);
const other = (id: string) => ex(id, { lexeme: { headword: "卖", reading: "mài", tone_label: null, translation: null } });

describe("очередь", () => {
  const items = [ex("a"), other("b"), other("c"), other("d"), other("e")];

  it("повтор после ошибки — через RETRY_GAP заданий", () => {
    const out = insertNext(items, 0, [ex("r", { is_retry: true })]);
    expect(ids(out).indexOf("r")).toBe(1 + RETRY_GAP);
  });

  it("блок пары — сразу, повтор — после него и ещё через паузу", () => {
    const out = insertNext(items, 0, [ex("card", { code: "pair_card" }), other("x1"), ex("r", { is_retry: true })]);
    expect(ids(out)).toEqual(["a", "card", "x1", "b", "c", "r", "d", "e"]);
  });

  it("повтор в конце очереди не теряется", () => {
    expect(ids(insertNext(items, 4, [ex("r", { is_retry: true })]))).toEqual(["a", "b", "c", "d", "e", "r"]);
  });

  it("«Уже знаю»: остальные задания слова убираются, прошлые и чужие остаются", () => {
    const list = [ex("a"), other("b"), ex("c"), ex("d", { code: "pair_card", lexeme: null })];
    expect(ids(dropWord(list, 0, wordKey(list[0]!)!))).toEqual(["a", "b", "d"]);
  });

  it("проверка «Уже знаю» не пройдена: её оставшиеся задания убираются, обычные — нет", () => {
    const list = [ex("k1", { is_check: true }), ex("k2", { code: "P2", is_check: true }), ex("r"), other("b")];
    expect(ids(dropChecks(list, 0, wordKey(list[0]!)!))).toEqual(["k1", "r", "b"]);
  });

  it("вставка цепляется к текущему, если человек уже ушёл дальше", () => {
    expect(anchorOf(items, "a", 3)).toBe(3);
    expect(anchorOf(items, "c", 0)).toBe(2);
  });

  it("блок пары не длиннее четырёх и конца очереди", () => {
    expect(pairBlockLength(items, 0)).toBe(4);
    expect(pairBlockLength(items, 3)).toBe(1);
  });
});

describe("итог по ключу", () => {
  const options = [
    { id: "o0", text: "покупать", kind: "ru" as const, a11y: "" },
    { id: "o1", text: "продавать", kind: "ru" as const, a11y: "" },
  ];

  it("вариант", () => {
    const e = ex("a", { options, key: { option_id: "o0" } });
    expect(localVerdict(e, { option_id: "o0" })).toBe("correct");
    expect(localVerdict(e, { option_id: "o1" })).toBe("wrong");
    expect(correctAnswerText(e, null)).toBe("покупать");
  });

  it("пиньинь: знак и цифра равны, другой тон — «почти», пусто — неверно", () => {
    const e = ex("a", { code: "P2", key: { pinyin: "mai3" } });
    expect(localVerdict(e, { text: "mǎi" })).toBe("correct");
    expect(localVerdict(e, { text: "MAI3" })).toBe("correct");
    expect(localVerdict(e, { text: "mai4" })).toBe("partial");
    expect(localVerdict(e, { text: "mei3" })).toBe("wrong");
    expect(localVerdict(e, { blank: true })).toBe("wrong");
  });

  it("плитки", () => {
    const e = ex("a", {
      code: "C2",
      tiles: [{ id: "t0", text: "我" }, { id: "t1", text: "买" }],
      key: { tokens: ["我", "买"] },
    });
    expect(localVerdict(e, { tile_ids: ["t0", "t1"] })).toBe("correct");
    expect(localVerdict(e, { tile_ids: ["t1", "t0"] })).toBe("wrong");
  });

  it("знакомство и самооценка без проверки; сервер важнее ключа", () => {
    expect(localVerdict(ex("a", { code: "intro" }), { choice: "ok" })).toBeNull();
    expect(localVerdict(ex("a", { code: "R2" }), { self: "recalled" })).toBeNull();
    const server = { outcome: "correct" } as AnswerResult;
    expect(trayOutcome("wrong", server)).toBe("correct");
    expect(trayOutcome("wrong", null)).toBe("wrong");
  });
});

describe("очередь отправки", () => {
  const input = (id: string) => ({ task_id: id, request_id: id, answer: { option_id: "o0" }, latency_ms: 1 });
  const ok = { outcome: "correct" } as AnswerResult;

  it("повторяет при обрыве сети, пока не дойдёт", async () => {
    let calls = 0;
    const box = createOutbox(async () => {
      if (++calls < 3) throw new BackendError("network_error");
      return ok;
    }, async () => {});
    await expect(box.submit(input("a"))).resolves.toBe(ok);
    expect(calls).toBe(3);
    expect(box.pending()).toBe(0);
  });

  it("окончательная ошибка не повторяется и не держит очередь", async () => {
    const sent: string[] = [];
    const box = createOutbox(async (i) => {
      sent.push(i.task_id);
      if (i.task_id === "a") throw new BackendError("ticket_expired");
      return ok;
    }, async () => {});
    await expect(box.submit(input("a"))).rejects.toThrow("ticket_expired");
    await expect(box.submit(input("b"))).resolves.toBe(ok);
    expect(sent).toEqual(["a", "b"]);
  });

  it("отправляет по порядку", async () => {
    const sent: string[] = [];
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const box = createOutbox(async (i) => {
      if (i.task_id === "a") await gate;
      sent.push(i.task_id);
      return ok;
    }, async () => {});
    const a = box.submit(input("a"));
    const b = box.submit(input("b"));
    expect(box.pending()).toBe(2);
    release();
    await Promise.all([a, b]);
    expect(sent).toEqual(["a", "b"]);
  });
});

describe("проверка «Уже знаю»", () => {
  const check = ex("k", { code: "R2", is_check: true });
  const base = { result: null, local: null };

  it("«Не вспомнил» в проверке — лоток «Тогда запомним», в обычном R2 — сразу дальше", () => {
    expect(advancesImmediately(check, { self: "forgot" })).toBe(false);
    expect(advancesImmediately(check, { self: "recalled" })).toBe(true);
    expect(advancesImmediately(ex("r2", { code: "R2" }), { self: "forgot" })).toBe(true);
  });

  it("провал: не вспомнил, ошибся или почти; сервер важнее ключа", () => {
    expect(checkFailed({ ...base, task: check, given: { self: "forgot" } })).toBe(true);
    expect(checkFailed({ ...base, task: check, given: { self: "recalled" } })).toBe(false);
    const p2 = ex("p", { code: "P2", is_check: true });
    expect(checkFailed({ ...base, task: p2, given: { text: "mai4" }, local: "partial" })).toBe(true);
    expect(checkFailed({ ...base, task: p2, given: { text: "mai3" }, local: "correct" })).toBe(false);
    const wrong = { outcome: "wrong" } as AnswerResult;
    expect(checkFailed({ task: p2, given: { text: "mai3" }, local: "correct", result: wrong })).toBe(true);
    expect(checkFailed({ ...base, task: ex("x"), given: { option_id: "o1" }, local: "wrong" })).toBe(false);
  });
});
