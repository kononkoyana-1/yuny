/**
 * Генерация заданий урока (TZ.md §8): четыре задания к одной пачке слов.
 *
 * Задания 1–3 пишет Gemini одним вызовом — текст для чтения, вопросы к нему и
 * русский текст для перевода строятся по одной теме, и держать их в одном
 * ответе дешевле и связнее. Задание 4 собирает код по словарю
 * (`wordCards.ts`), без ИИ.
 *
 * ИИ отвечает за содержание, код — за структуру (TZ.md §3, правило 3): сколько
 * утверждений, сколько вопросов, какой объём текста — проверяется здесь, и
 * ответ не по форме уходит на повтор, а не чинится молча.
 *
 * Уровень HSK проверяется не только промптом (`hskLevel.ts`, #22): текст выше
 * уровня — повтор с перечнем лишних слов. Если и повтор выше порога, берётся
 * лучшая из попыток: урок ученику нужнее, чем идеальный текст.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.112.4";
import { aiJson, HandlerError, objectSchema } from "./shared.ts";
import { levelReport, type LevelReport, withinLevel } from "./hskLevel.ts";
import { buildCards, type CardWord, type DictionarySense } from "./wordCards.ts";

// ---------------------------------------------------------------- структура

/** Сколько чего в уроке — решает код (TZ.md §8). */
export const STRUCTURE = {
  statements: 8,
  questions: 6,
  /** 200–300 иероглифов по ТЗ, с допуском: отбрасывать урок из-за 190 знаков дороже, чем принять. */
  textMinHanzi: 180,
  textMaxHanzi: 330,
  /** «Около 200 слов» — русских. */
  translationMinWords: 150,
  translationMaxWords: 260,
} as const;

/** Уровень, пока ученик его не выбрал: экран выбора — #39, фаза 7. */
export const DEFAULT_HSK_LEVEL = 2;

/** Попыток генерации на урок: первая и одна с перечнем лишних слов. */
const ATTEMPTS = 2;

export interface GeneratedLesson {
  reading: {
    text: string;
    pinyin: string;
    statements: { text: string; pinyin: string; is_true: boolean }[];
  };
  questions: { text: string; answer_notes: string }[];
  translation: { sentences: { ru: string; zh_reference: string }[] };
}

const LESSON_SCHEMA = objectSchema(
  {
    reading: objectSchema(
      {
        text: { type: "string" },
        pinyin: { type: "string" },
        statements: {
          type: "array",
          minItems: STRUCTURE.statements,
          items: objectSchema(
            { text: { type: "string" }, pinyin: { type: "string" }, is_true: { type: "boolean" } },
            ["text", "pinyin", "is_true"],
          ),
        },
      },
      ["text", "pinyin", "statements"],
    ),
    questions: {
      type: "array",
      minItems: STRUCTURE.questions,
      items: objectSchema(
        { text: { type: "string" }, answer_notes: { type: "string" } },
        ["text", "answer_notes"],
      ),
    },
    translation: objectSchema(
      {
        sentences: {
          type: "array",
          items: objectSchema(
            { ru: { type: "string" }, zh_reference: { type: "string" } },
            ["ru", "zh_reference"],
          ),
        },
      },
      ["sentences"],
    ),
  },
  ["reading", "questions", "translation"],
);

// ------------------------------------------------------------------- промпт

export interface LessonInput {
  title: string;
  topic: string | null;
  context: string | null;
  hskLevel: number;
  words: { word: string; reading: string | null; meaning_ru: string }[];
  grammar: { point: string; explanation: string; examples: string[] }[];
}

const SYSTEM = `Ты составляешь урок китайского языка для ученика, чей родной язык — русский. Урок строится по материалу, который ученик принёс сам, и по пачке слов из этого материала.

Три задания, по одной теме — теме материала:

1. reading — текст на китайском, ${200}–${300} иероглифов. Он обязательно использует слова пачки и, если в материале есть грамматика, её конструкции. К тексту — ровно ${STRUCTURE.statements} утверждений на китайском, каждое либо верно, либо неверно по тексту; is_true — правда ли это по тексту. Верных и неверных — примерно поровну. pinyin — пиньинь с тонами для текста и для каждого утверждения.

2. questions — ровно ${STRUCTURE.questions} вопросов на китайском по тексту из первого задания. Ответить на них можно только развёрнуто, своими словами, иероглифами. Если в материале есть грамматика, вопросы должны вынуждать её использовать. answer_notes — по-русски: что должно быть в хорошем ответе, какая грамматика ожидается. Ученик answer_notes не увидит, по ним проверяют ответ.

3. translation — связный текст на русском, около 200 слов, на ту же тему, разбитый на предложения. Каждое предложение ученик переведёт на китайский отдельно. Текст должен давать повод использовать слова пачки и грамматику материала. zh_reference — хороший перевод предложения на китайский, для проверяющего.

Жёсткое требование к сложности: весь китайский текст — в пределах уровня HSK ученика. Разрешены слова этого уровня и ниже плюс слова пачки и материала, даже если они выше уровня. Никакой другой лексики выше уровня. Это не пожелание: текст выше уровня будет отклонён.`;

export function lessonPrompt(input: LessonInput, avoid: string[] = []): string {
  const lines = [
    `Уровень ученика: HSK ${input.hskLevel}.`,
    `Материал: «${input.title}».`,
    input.topic ? `Тема: ${input.topic}.` : "",
    input.context ? `О материале: ${input.context}` : "",
    "",
    "Слова пачки (их нужно использовать):",
    ...input.words.map((w) => `- ${w.word}${w.reading ? ` [${w.reading}]` : ""} — ${w.meaning_ru}`),
  ];
  if (input.grammar.length > 0) {
    lines.push("", "Грамматика материала (задействовать в тексте и вопросах):");
    for (const g of input.grammar) {
      lines.push(`- ${g.point}: ${g.explanation}${g.examples.length ? ` Примеры: ${g.examples.join(" ")}` : ""}`);
    }
  }
  if (avoid.length > 0) {
    lines.push(
      "",
      `Прошлая версия вышла за уровень HSK ${input.hskLevel}. Эти слова слишком сложные, замени их более простыми: ${avoid.join("、")}.`,
    );
  }
  return lines.filter((line, i, all) => line !== "" || all[i - 1] !== "").join("\n");
}

// ---------------------------------------------------------------- проверки

const HANZI_G = /[一-鿿]/g;
export const hanziCount = (text: string) => (text.match(HANZI_G) ?? []).length;
export const russianWordCount = (text: string) => (text.match(/[а-яё]+/gi) ?? []).length;

/**
 * Ответ Gemini к форме урока. Лишнее отрезается (восемь утверждений — это
 * восемь, девятое не нужно), недостающее — повод отклонить. Возвращает урок
 * или код, почему он не годится.
 */
export function shapeLesson(raw: GeneratedLesson): GeneratedLesson | { invalid: string } {
  const text = raw.reading?.text?.trim() ?? "";
  const hanzi = hanziCount(text);
  if (hanzi < STRUCTURE.textMinHanzi || hanzi > STRUCTURE.textMaxHanzi) {
    return { invalid: `text_length_${hanzi}` };
  }

  const statements = (raw.reading.statements ?? [])
    .map((s) => ({ text: s.text.trim(), pinyin: s.pinyin.trim(), is_true: s.is_true === true }))
    .filter((s) => hanziCount(s.text) > 0)
    .slice(0, STRUCTURE.statements);
  if (statements.length < STRUCTURE.statements) return { invalid: "statements_count" };
  // Все верные или все неверные — задание решается без чтения.
  const trues = statements.filter((s) => s.is_true).length;
  if (trues === 0 || trues === statements.length) return { invalid: "statements_one_sided" };

  const questions = (raw.questions ?? [])
    .map((q) => ({ text: q.text.trim(), answer_notes: q.answer_notes.trim() }))
    .filter((q) => hanziCount(q.text) > 0)
    .slice(0, STRUCTURE.questions);
  if (questions.length < STRUCTURE.questions) return { invalid: "questions_count" };

  const sentences = (raw.translation?.sentences ?? [])
    .map((s) => ({ ru: s.ru.trim(), zh_reference: s.zh_reference.trim() }))
    .filter((s) => russianWordCount(s.ru) > 0);
  const words = sentences.reduce((n, s) => n + russianWordCount(s.ru), 0);
  if (words < STRUCTURE.translationMinWords || words > STRUCTURE.translationMaxWords) {
    return { invalid: `translation_length_${words}` };
  }

  return {
    reading: { text, pinyin: raw.reading.pinyin.trim(), statements },
    questions,
    translation: { sentences },
  };
}

/** Весь китайский текст урока, который видит ученик, — для проверки уровня. */
export function lessonChinese(lesson: GeneratedLesson): string {
  return [
    lesson.reading.text,
    ...lesson.reading.statements.map((s) => s.text),
    ...lesson.questions.map((q) => q.text),
  ].join("\n");
}

// ----------------------------------------------------------- задания в базу

export interface TaskRow {
  type: "reading_truefalse" | "open_questions" | "translation" | "word_cards";
  position: 1 | 2 | 3 | 4;
  content: unknown;
  answer_key: unknown;
}

/**
 * Четыре задания урока: что видит экран — в `content`, что знает только
 * сервер — в `answer_key`. Идентификаторы пунктов — по порядку, `s1`…, `q1`…,
 * `t1`…: по ним `task-submit` сопоставит ответ с ключом.
 */
export function lessonTasks(
  lesson: GeneratedLesson,
  cards: ReturnType<typeof buildCards>,
): TaskRow[] {
  return [
    {
      type: "reading_truefalse",
      position: 1,
      content: {
        text: lesson.reading.text,
        pinyin: lesson.reading.pinyin,
        statements: lesson.reading.statements.map((s, i) => ({ id: `s${i + 1}`, text: s.text, pinyin: s.pinyin })),
      },
      answer_key: {
        statements: lesson.reading.statements.map((s, i) => ({ id: `s${i + 1}`, is_true: s.is_true })),
      },
    },
    {
      type: "open_questions",
      position: 2,
      content: { questions: lesson.questions.map((q, i) => ({ id: `q${i + 1}`, text: q.text })) },
      answer_key: {
        questions: lesson.questions.map((q, i) => ({ id: `q${i + 1}`, answer_notes: q.answer_notes })),
      },
    },
    {
      type: "translation",
      position: 3,
      content: {
        sentences: lesson.translation.sentences.map((s, i) => ({ id: `t${i + 1}`, text: s.ru })),
      },
      answer_key: {
        sentences: lesson.translation.sentences.map((s, i) => ({ id: `t${i + 1}`, reference: s.zh_reference })),
      },
    },
    { type: "word_cards", position: 4, content: cards.content, answer_key: cards.answerKey },
  ];
}

// ---------------------------------------------------------------- генерация

async function generateWithinLevel(
  input: LessonInput,
  hsk: Map<string, number>,
): Promise<{ lesson: GeneratedLesson; report: LevelReport }> {
  const materialWords = new Set(input.words.map((w) => w.word));
  let best: { lesson: GeneratedLesson; report: LevelReport } | null = null;
  let lastInvalid = "";
  let avoid: string[] = [];

  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    const raw = await aiJson<GeneratedLesson>({
      name: "generate_lesson",
      description: "Составь три задания урока китайского по материалу ученика",
      schema: LESSON_SCHEMA,
      system: SYSTEM,
      prompt: lessonPrompt(input, avoid),
      maxTokens: 12000,
    });

    const shaped = shapeLesson(raw);
    if ("invalid" in shaped) {
      lastInvalid = shaped.invalid;
      console.error("lesson_invalid_shape", attempt, shaped.invalid);
      continue;
    }

    const report = levelReport(lessonChinese(shaped), hsk, materialWords, input.hskLevel);
    if (!best || report.share < best.report.share) best = { lesson: shaped, report };
    if (withinLevel(report)) break;
    console.error("lesson_above_level", attempt, input.hskLevel, report.share.toFixed(2), report.offenders.join(" "));
    avoid = report.offenders.slice(0, 30);
  }

  if (!best) {
    console.error("lesson_no_valid_attempt", lastInvalid);
    throw new HandlerError("ai_invalid_response", 502);
  }
  return best;
}

interface VocabularyRow {
  id: string;
  word: string;
  reading: string | null;
  meaning_ru: string;
  sense_hint: string;
  dictionary_entries: { senses: DictionarySense[] } | null;
}

export async function generateLesson(
  admin: SupabaseClient,
  userId: string,
  lessonId: string,
): Promise<{ lesson_id: string; task_count: number }> {
  const { data: lesson } = await admin
    .from("lessons")
    .select("id, module_id, vocabulary_ids")
    .eq("id", lessonId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!lesson) throw new HandlerError("lesson_not_found", 404);

  try {
    const [{ data: module }, { data: vocab }, { data: grammar }, { data: profile }, { data: hskRows }] =
      await Promise.all([
        admin.from("modules").select("title, topic, context").eq("id", lesson.module_id).single(),
        admin
          .from("module_vocabulary")
          .select("id, word, reading, meaning_ru, sense_hint, dictionary_entries(senses)")
          .in("id", lesson.vocabulary_ids),
        admin
          .from("module_grammar")
          .select("point, explanation, examples")
          .eq("module_id", lesson.module_id)
          .order("position"),
        admin.from("profiles").select("hsk_level").eq("id", userId).maybeSingle(),
        admin.from("hsk_words").select("word, level").limit(6000),
      ]);
    if (!module || !vocab || vocab.length === 0) throw new HandlerError("lesson_not_found", 404);

    // Порядок пачки — тот, что зафиксирован в уроке, а не порядок ответа базы.
    const byId = new Map((vocab as unknown as VocabularyRow[]).map((v) => [v.id, v]));
    const words = (lesson.vocabulary_ids as string[]).map((id) => byId.get(id)).filter((v) => v !== undefined);

    const hsk = new Map<string, number>();
    for (const { word, level } of (hskRows ?? []) as { word: string; level: number }[]) {
      hsk.set(word, Math.min(hsk.get(word) ?? level, level));
    }

    const input: LessonInput = {
      title: module.title ?? "Материал",
      topic: module.topic,
      context: module.context,
      hskLevel: profile?.hsk_level ?? DEFAULT_HSK_LEVEL,
      words: words.map((w) => ({ word: w.word, reading: w.reading, meaning_ru: w.meaning_ru })),
      grammar: grammar ?? [],
    };

    const { lesson: generated, report } = await generateWithinLevel(input, hsk);
    const cards = buildCards(
      words.map((w): CardWord => ({
        id: w.id,
        word: w.word,
        reading: w.reading,
        meaning_ru: w.meaning_ru,
        sense_hint: w.sense_hint,
        senses: w.dictionary_entries?.senses ?? null,
      })),
    );
    const tasks = lessonTasks(generated, cards);

    // Повторная генерация упавшего урока начинает с чистого листа.
    await admin.from("tasks").delete().eq("lesson_id", lessonId);
    const { data: inserted, error: tasksError } = await admin
      .from("tasks")
      .insert(tasks.map((t) => ({
        lesson_id: lessonId,
        module_id: lesson.module_id,
        user_id: userId,
        type: t.type,
        position: t.position,
        content: t.content,
      })))
      .select("id, position");
    if (tasksError || !inserted) throw tasksError ?? new HandlerError("internal_error", 500);

    const idByPosition = new Map(inserted.map((row) => [row.position, row.id]));
    const { error: keysError } = await admin.from("task_answer_keys").insert(
      tasks.map((t) => ({ task_id: idByPosition.get(t.position), answer_key: t.answer_key })),
    );
    if (keysError) throw keysError;

    const { error: lessonError } = await admin
      .from("lessons")
      .update({ status: "ready", error_code: null })
      .eq("id", lessonId);
    if (lessonError) throw lessonError;

    console.log("lesson_ready", lessonId, input.hskLevel, report.share.toFixed(2));
    return { lesson_id: lessonId, task_count: tasks.length };
  } catch (error) {
    const code = error instanceof HandlerError ? error.code : "internal_error";
    await admin.from("lessons").update({ status: "failed", error_code: code }).eq("id", lessonId);
    throw error;
  }
}
