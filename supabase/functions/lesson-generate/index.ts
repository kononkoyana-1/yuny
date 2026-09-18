/**
 * `lesson-generate` (TZ.md §13): четыре задания урока. Долгая операция —
 * идёт через `jobs`, клиент ждёт её на экране ожидания.
 *
 * Урок генерируется, когда его открывают, а не весь модуль сразу после
 * разбора: каждый урок — вызов Gemini, и уроки, до которых ученик не дошёл,
 * не должны их тратить.
 *
 * Состояния урока: `pending` и `failed` — можно генерировать; `generating` —
 * генерация уже идёт, повторный вызов вернёт ту же задачу; `ready` — задания
 * есть, генерировать нечего.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  createJob,
  handler,
  HandlerError,
  json,
  requireUuid,
  runJobInBackground,
} from "../_shared/shared.ts";
import { generateLesson } from "../_shared/lessonGenerate.ts";

Deno.serve(
  handler(async ({ userId, admin, body }) => {
    const lessonId = requireUuid(body, "lesson_id");

    const { data: lesson } = await admin
      .from("lessons")
      .select("id, status")
      .eq("id", lessonId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!lesson) throw new HandlerError("lesson_not_found", 404);
    if (lesson.status === "ready") throw new HandlerError("lesson_ready", 409);

    const runningJob = async () => {
      const { data: job } = await admin
        .from("jobs")
        .select("id")
        .eq("user_id", userId)
        .eq("kind", "lesson_generate")
        .eq("input->>lesson_id", lessonId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return job?.id as string | undefined;
    };

    if (lesson.status === "generating") {
      const jobId = await runningJob();
      if (jobId) return json({ job_id: jobId, kind: "lesson_generate", lesson_id: lessonId });
    }

    // Захват урока условием на статус в самом UPDATE: два быстрых открытия
    // не запустят две генерации одного урока.
    const { data: claimed } = await admin
      .from("lessons")
      .update({ status: "generating", error_code: null })
      .eq("id", lessonId)
      .in("status", ["pending", "failed"])
      .select("id");
    if (!claimed || claimed.length === 0) {
      const jobId = await runningJob();
      if (jobId) return json({ job_id: jobId, kind: "lesson_generate", lesson_id: lessonId });
      throw new HandlerError("lesson_ready", 409);
    }

    const jobId = await createJob(admin, userId, "lesson_generate", { lesson_id: lessonId });
    runJobInBackground(admin, jobId, () => generateLesson(admin, userId, lessonId));

    return json({ job_id: jobId, kind: "lesson_generate", lesson_id: lessonId });
  }),
);
