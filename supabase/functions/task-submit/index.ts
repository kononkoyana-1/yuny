/**
 * `task-submit` (TZ.md §9, §13): проверка ответа и запись отправки.
 *
 * Синхронная: через `jobs` идут только разбор и генерация (TZ.md §13), а
 * проверка — это одна отправка и один ответ. Карточки проверяются кодом
 * мгновенно, остальное — одним вызовом Gemini.
 *
 * Каждая отправка — новая строка в `task_submissions`: задание пройдено после
 * первой отправки, какой бы ни был процент (TZ.md §10).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handler, HandlerError, json, requireUuid } from "../_shared/shared.ts";
import {
  aiReview,
  checkCards,
  type CheckResult,
  checkStatements,
  requireAnswers,
} from "../_shared/taskCheck.ts";
import type { CardKey } from "../_shared/wordCards.ts";

interface Item {
  id: string;
  text: string;
}

Deno.serve(
  handler(async ({ userId, admin, body }) => {
    const taskId = requireUuid(body, "task_id");

    const { data: task } = await admin
      .from("tasks")
      .select("id, type, content, lesson_id, module_id")
      .eq("id", taskId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!task) throw new HandlerError("task_not_found", 404);

    const { data: keyRow } = await admin
      .from("task_answer_keys")
      .select("answer_key")
      .eq("task_id", taskId)
      .maybeSingle();
    if (!keyRow) throw new HandlerError("internal_error", 500);
    const key = keyRow.answer_key;
    const content = task.content;

    let answers: Record<string, string | boolean>;
    let result: CheckResult;

    switch (task.type) {
      case "word_cards": {
        const keys = key.cards as CardKey[];
        // Пустая карточка — не повод отказать в отправке: это неверный ответ.
        const raw = (body.answers ?? {}) as Record<string, unknown>;
        answers = Object.fromEntries(
          keys.map((k) => [k.id, typeof raw[k.id] === "string" ? (raw[k.id] as string).slice(0, 200) : ""]),
        );
        result = checkCards(answers as Record<string, string>, keys);
        break;
      }

      case "reading_truefalse": {
        const statements = content.statements as Item[];
        answers = requireAnswers(body.answers, statements.map((s) => s.id), "boolean");
        const checked = checkStatements(answers as Record<string, boolean>, key.statements, statements);
        const errors = checked.wrong.map((w) => ({
          fragment: w.text,
          what: w.is_true ? "Это утверждение верно по тексту" : "Это утверждение неверно по тексту",
          correct: w.is_true ? "Верно" : "Неверно",
        }));
        // Процент — код. ИИ только объясняет спорные места, и только если они есть.
        let comment: string | null = null;
        if (checked.wrong.length > 0) {
          const review = await aiReview(
            "reading",
            [
              "Задание: прочитать текст и решить, верно или неверно каждое утверждение.",
              `Текст:\n${content.text}`,
              "Ученик ошибся в этих утверждениях:",
              ...checked.wrong.map((w) => `- ${w.text} — на самом деле ${w.is_true ? "верно" : "неверно"}`),
              "Объясни по тексту, почему каждое из них верно или неверно: процитируй нужное место. Процент уже посчитан, score_percent поставь любой — он не используется.",
            ].join("\n"),
          );
          comment = review.comment;
        }
        result = { score_percent: checked.score_percent, comment, errors };
        break;
      }

      case "open_questions": {
        const questions = content.questions as Item[];
        answers = requireAnswers(body.answers, questions.map((q) => q.id), "chinese");
        const [{ data: reading }, { data: grammar }] = await Promise.all([
          admin.from("tasks").select("content").eq("lesson_id", task.lesson_id).eq("type", "reading_truefalse").maybeSingle(),
          admin.from("module_grammar").select("point, explanation").eq("module_id", task.module_id).order("position"),
        ]);
        const notes = new Map((key.questions as { id: string; answer_notes: string }[]).map((q) => [q.id, q.answer_notes]));
        result = await aiReview(
          "open_questions",
          [
            "Задание: развёрнуто ответить иероглифами на вопросы по тексту.",
            reading ? `Текст:\n${(reading.content as { text: string }).text}` : "",
            grammar && grammar.length > 0
              ? `Грамматика урока, которую ответы должны задействовать: ${grammar.map((g) => g.point).join("; ")}.`
              : "",
            "",
            ...questions.map((q) =>
              `Вопрос ${q.id}: ${q.text}\nЧто ожидалось: ${notes.get(q.id) ?? "—"}\nОтвет ученика: ${answers[q.id]}`
            ),
            "",
            "score_percent — насколько ответы в целом верны по смыслу и по языку, от 0 до 100.",
          ].filter(Boolean).join("\n"),
        );
        break;
      }

      case "translation": {
        const sentences = content.sentences as Item[];
        answers = requireAnswers(body.answers, sentences.map((s) => s.id), "chinese");
        const refs = new Map((key.sentences as { id: string; reference: string }[]).map((s) => [s.id, s.reference]));
        result = await aiReview(
          "translation",
          [
            "Задание: письменно перевести русский текст на китайский, по предложениям.",
            "",
            ...sentences.map((s) =>
              `${s.id}. ${s.text}\nЭталон: ${refs.get(s.id) ?? "—"}\nПеревод ученика: ${answers[s.id]}`
            ),
            "",
            "score_percent — насколько перевод в целом верен по смыслу и по языку, от 0 до 100.",
          ].join("\n"),
        );
        break;
      }

      default:
        throw new HandlerError("internal_error", 500);
    }

    const { data: submission, error } = await admin
      .from("task_submissions")
      .insert({
        task_id: taskId,
        lesson_id: task.lesson_id,
        module_id: task.module_id,
        user_id: userId,
        answers,
        score_percent: result.score_percent,
        comment: result.comment,
        errors: result.errors,
      })
      .select("id")
      .single();
    if (error || !submission) throw new HandlerError("internal_error", 500);

    return json({ submission_id: submission.id, task_id: taskId, ...result });
  }),
);
