import { describe, expect, it } from "@jest/globals";
import { todayFixture } from "@/shared/repositories/mock/study.fixtures";
import { compositionA11y, currentPlan, doneDetailText, footerText, newSourceText, pairMoreText } from "./todayText";

describe("todayText", () => {
  const ready = todayFixture("ready");
  const plan10 = currentPlan(ready)!;
  const plan15 = ready.plans.find((p) => p.minutes === 15)!;

  it("берёт план под запомненный бюджет", () => {
    expect(plan10.minutes).toBe(10);
  });

  it("подписывает источник новых слов", () => {
    expect(newSourceText(plan10)).toBe("из «Покупки»");
    expect(newSourceText(plan15)).toBe("из «Покупки» и ещё 1");
    expect(newSourceText({ ...plan10, new_sources: [] })).toBeUndefined();
  });

  it("считает лишние пары", () => {
    expect(pairMoreText(plan10)).toBeUndefined();
    expect(pairMoreText(plan15)).toBe("и ещё 1");
  });

  it("склеивает состав для диктора", () => {
    expect(compositionA11y(plan10, false)).toBe(
      "Повторить: 26. Новые слова: 5, из «Покупки». Разобрать пару: 买 и 卖.",
    );
    expect(compositionA11y(plan10, true)).toBe("Повторить: 26. Разобрать пару: 买 и 卖.");
  });

  it("пишет прогноз, а без выученных слов — только завтра", () => {
    expect(footerText(ready, plan10)).toBe("Сейчас вы вспомните ~212 из 347 слов · Завтра ~30");
    const fresh = { ...ready, recall_now: { recalled: 0, total: 0 } };
    expect(footerText(fresh, plan10)).toBe("Завтра ~30");
    const done = todayFixture("done");
    expect(doneDetailText(done, currentPlan(done)!)).toBe("Завтра ~30 заданий · вспомните ~301 из 347");
  });
});
