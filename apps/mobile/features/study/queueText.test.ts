import { describe, expect, it } from "@jest/globals";
import { etaText, learnedText, queueText, totalsEtaText } from "./queueText";

describe("queueText", () => {
  it("пишет, сколько изучено и сколько осталось", () => {
    expect(learnedText({ learned: 12, queued: 28 })).toBe("Изучено 12 из 40 · осталось 28");
    expect(learnedText({ learned: 22, queued: 0 })).toBe("Изучены все 22 слова");
    expect(learnedText({ learned: 0, queued: 0 })).toBeNull();
  });

  it("срок — по настройке «новых в день»", () => {
    expect(etaText({ learned: 12, queued: 28, eta_days: 4, per_day: 8 })).toBe("примерно 4 дня при 8 новых в день");
    expect(etaText({ learned: 12, queued: 28, eta_days: null, per_day: null })).toBe(
      "в настройках 0 новых в день — учите раундами по папке",
    );
    expect(queueText({ learned: 12, queued: 28, eta_days: 4, per_day: 8 })).toBe(
      "Изучено 12 из 40 · осталось 28 — примерно 4 дня при 8 новых в день",
    );
    expect(queueText({ learned: 5, queued: 0, eta_days: 0, per_day: 8 })).toBe("Изучены все 5 слов");
  });

  it("сводка по всем словам", () => {
    expect(totalsEtaText({ queued: 138, eta_days: 18 }, 8)).toBe("По 8 новых в день — ещё примерно 18 дней");
    expect(totalsEtaText({ queued: 0, eta_days: 0 }, 8)).toBe("Новых слов не осталось — все уже в работе");
    expect(totalsEtaText({ queued: 10, eta_days: null }, null)).toBe(
      "В настройках 0 новых в день: новые слова приходят только из раундов по папкам",
    );
  });
});
