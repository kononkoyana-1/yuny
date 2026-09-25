import { describe, expect, it } from "@jest/globals";
import { queueText } from "./queueText";

describe("queueText", () => {
  it("пишет очередь и срок со склонениями", () => {
    expect(queueText({ queued: 180, eta_days: 23, per_day: 8 })).toBe("В очереди 180 слов · примерно 23 дня при 8 в день");
    expect(queueText({ queued: 1, eta_days: 1, per_day: 8 })).toBe("В очереди 1 слово · примерно 1 день при 8 в день");
    expect(queueText({ queued: 22, eta_days: 5, per_day: 5 })).toBe("В очереди 22 слова · примерно 5 дней при 5 в день");
  });

  it("при потолке 0 — новые только из папки", () => {
    expect(queueText({ queued: 180, eta_days: null, per_day: null })).toBe(
      "В очереди 180 слов · новые приходят только из папки",
    );
  });

  it("пустая очередь — строки нет", () => {
    expect(queueText({ queued: 0, eta_days: 0, per_day: 8 })).toBeNull();
  });
});
