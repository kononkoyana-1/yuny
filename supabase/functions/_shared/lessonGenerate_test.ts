/**
 *   cd supabase/functions && DENO_NO_PACKAGE_JSON=1 deno test --allow-env _shared/
 */
import { assertEquals } from "jsr:@std/assert@1";

import {
  type GeneratedLesson,
  hanziCount,
  lessonPrompt,
  lessonTasks,
  shapeLesson,
  STRUCTURE,
} from "./lessonGenerate.ts";
import { buildCards } from "./wordCards.ts";

const HANZI_250 = "我去商店买苹果。".repeat(36).slice(0, 250);

function lesson(overrides: Partial<{ hanzi: number; statements: number; trues: number; questions: number; ruWords: number }> = {}): GeneratedLesson {
  const { hanzi = 250, statements = 8, trues = 4, questions = 6, ruWords = 200 } = overrides;
  const text = "我去商店买苹果。".repeat(60).replace(/。/g, "").slice(0, hanzi);
  const sentence = "Я иду в магазин и покупаю там яблоки сегодня"; // 9 слов
  const sentenceCount = Math.ceil(ruWords / 9);
  return {
    reading: {
      text,
      pinyin: "wǒ qù shāngdiàn",
      statements: Array.from({ length: statements }, (_, i) => ({ text: `他去商店${i}。`, pinyin: "tā", is_true: i < trues })),
    },
    questions: Array.from({ length: questions }, (_, i) => ({ text: `你去商店买什么${i}？`, answer_notes: "ожидается 买" })),
    translation: {
      sentences: Array.from({ length: sentenceCount }, (_, i) => ({ ru: i === 0 ? sentence.split(" ").slice(0, ruWords - 9 * (sentenceCount - 1)).join(" ") : sentence, zh_reference: "我去商店。" })),
    },
  };
}

Deno.test("урок по форме проходит как есть", () => {
  const shaped = shapeLesson(lesson());
  assertEquals("invalid" in shaped, false);
  if (!("invalid" in shaped)) {
    assertEquals(shaped.reading.statements.length, STRUCTURE.statements);
    assertEquals(shaped.questions.length, STRUCTURE.questions);
  }
});

Deno.test("лишние утверждения и вопросы отрезаются, а не отклоняют урок", () => {
  const shaped = shapeLesson(lesson({ statements: 11, trues: 5, questions: 9 }));
  if ("invalid" in shaped) throw new Error(shaped.invalid);
  assertEquals(shaped.reading.statements.length, 8);
  assertEquals(shaped.questions.length, 6);
});

Deno.test("недостаток отклоняет урок: код, а не ИИ решает структуру", () => {
  assertEquals(shapeLesson(lesson({ statements: 7, trues: 3 })), { invalid: "statements_count" });
  assertEquals(shapeLesson(lesson({ questions: 5 })), { invalid: "questions_count" });
});

Deno.test("объём текста для чтения — 200–300 иероглифов с допуском", () => {
  assertEquals(shapeLesson(lesson({ hanzi: 120 })), { invalid: "text_length_120" });
  assertEquals(shapeLesson(lesson({ hanzi: 400 })), { invalid: "text_length_400" });
  assertEquals("invalid" in shapeLesson(lesson({ hanzi: 190 })), false);
});

Deno.test("все утверждения верные или все неверные — задание решается без чтения", () => {
  assertEquals(shapeLesson(lesson({ trues: 8 })), { invalid: "statements_one_sided" });
  assertEquals(shapeLesson(lesson({ trues: 0 })), { invalid: "statements_one_sided" });
});

Deno.test("перевод — около 200 русских слов", () => {
  assertEquals(shapeLesson(lesson({ ruWords: 60 })), { invalid: "translation_length_60" });
});

Deno.test("промпт: уровень, слова пачки и лишние слова прошлой попытки", () => {
  const prompt = lessonPrompt({
    title: "Урок 5. В магазине",
    topic: null,
    context: null,
    hskLevel: 2,
    words: [{ word: "商店", reading: "shāngdiàn", meaning_ru: "магазин" }],
    grammar: [],
  }, ["通货膨胀", "显著"]);
  assertEquals(prompt.includes("HSK 2"), true);
  assertEquals(prompt.includes("商店 [shāngdiàn] — магазин"), true);
  assertEquals(prompt.includes("通货膨胀、显著"), true);
  assertEquals(prompt.includes("Грамматика"), false);
});

Deno.test("задания: четыре, по порядку, ключи отдельно от содержимого", () => {
  const shaped = shapeLesson(lesson());
  if ("invalid" in shaped) throw new Error(shaped.invalid);
  const cards = buildCards([{ id: "v1", word: "商店", reading: "shāngdiàn", meaning_ru: "магазин", sense_hint: "", senses: null }], () => 0.1);
  const tasks = lessonTasks(shaped, cards);

  assertEquals(tasks.map((t) => [t.position, t.type]), [
    [1, "reading_truefalse"], [2, "open_questions"], [3, "translation"], [4, "word_cards"],
  ]);
  const reading = tasks[0].content as { statements: { id: string }[] };
  assertEquals(JSON.stringify(reading).includes("is_true"), false);
  assertEquals(reading.statements.map((s) => s.id), ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"]);
  assertEquals(JSON.stringify(tasks[1].content).includes("answer_notes"), false);
  assertEquals(JSON.stringify(tasks[2].content).includes("reference"), false);
});

Deno.test("счёт иероглифов не считает пунктуацию", () => {
  assertEquals(hanziCount("我去，商店。ABC 123"), 4);
  assertEquals(hanziCount(HANZI_250) > 0, true);
});
