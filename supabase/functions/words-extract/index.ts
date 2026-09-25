/**
 * `words-extract`: слова из загруженного файла для своего словаря (экран 02
 * в редакции без модулей). Принимает те же пути, что `module-create`, ставит
 * фоновую задачу и сразу отвечает `job_id`; результат задачи — название
 * файла и слова с переводами (`_shared/wordsExtract.ts`). Модуль не
 * создаётся: пока Главная скрыта, файл нужен только ради слов.
 *
 * Повтор с тем же `material_id` — не вторая задача: если прошлая ещё идёт или
 * уже готова, отдаём её (ответ мог потеряться в сети). Если прошлая упала или
 * зависла (не менялась дольше `STALE_MS`), это и есть «Попробовать ещё раз» —
 * файлы на месте, запускаем заново.
 *
 * `{ action: "cancel", material_id }` — человек нажал «Отмена»: идущая задача
 * помечается `failed / cancelled` (фоновая работа, если ещё жива, итог уже не
 * запишет), загруженные файлы удаляются.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  createJob,
  handler,
  json,
  requireUuid,
  runJobInBackground,
} from "../_shared/shared.ts";
import { BUCKET, requireFiles, storedFiles } from "../_shared/uploadedFiles.ts";
import { extractWords } from "../_shared/wordsExtract.ts";

/**
 * Дольше этого задача не может идти честно: вызов модели укладывается в
 * `AI_DEADLINE_MS` (110 с) плюс чтение файла и словаря. Такая задача — след
 * оборванной платформой фоновой работы (2026-09-25), её итог не придёт никогда.
 */
const STALE_MS = 3 * 60_000;

Deno.serve(
  handler(async ({ userId, admin, body }) => {
    const materialId = requireUuid(body, "material_id");
    const folder = `${userId}/${materialId}/`;

    if (body.action === "cancel") {
      await admin
        .from("jobs")
        .update({ status: "failed", error_code: "cancelled" })
        .eq("user_id", userId)
        .eq("kind", "words_extract")
        .eq("input->>material_id", materialId)
        .in("status", ["queued", "running"]);
      const { data: objects } = await admin.storage.from(BUCKET).list(`${userId}/${materialId}`);
      const paths = (objects ?? []).map((o) => `${folder}${o.name}`);
      if (paths.length > 0) await admin.storage.from(BUCKET).remove(paths);
      return json({ cancelled: true, material_id: materialId });
    }

    const requested = requireFiles(body, folder);

    const { data: previous } = await admin
      .from("jobs")
      .select("id, status, updated_at")
      .eq("user_id", userId)
      .eq("kind", "words_extract")
      .eq("input->>material_id", materialId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (previous && previous.status !== "failed") {
      const stale = previous.status !== "done" &&
        Date.now() - new Date(previous.updated_at).getTime() > STALE_MS;
      if (!stale) return json({ job_id: previous.id, kind: "words_extract", material_id: materialId });
      await admin
        .from("jobs")
        .update({ status: "failed", error_code: "stale" })
        .eq("id", previous.id)
        .in("status", ["queued", "running"]);
    }

    const stored = await storedFiles(admin, folder, requested);

    const jobId = await createJob(admin, userId, "words_extract", { material_id: materialId });
    runJobInBackground(admin, jobId, () => extractWords(admin, stored));

    return json({ job_id: jobId, kind: "words_extract", material_id: materialId });
  }),
);
