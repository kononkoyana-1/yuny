/**
 * `words-extract`: слова из загруженного файла для своего словаря (экран 02
 * в редакции без модулей). Принимает те же пути, что `module-create`, ставит
 * фоновую задачу и сразу отвечает `job_id`; результат задачи — название
 * файла и слова с переводами (`_shared/wordsExtract.ts`). Модуль не
 * создаётся: пока Главная скрыта, файл нужен только ради слов.
 *
 * Повтор с тем же `material_id` — не вторая задача: если прошлая ещё идёт или
 * уже готова, отдаём её (ответ мог потеряться в сети). Если прошлая упала,
 * это и есть «Попробовать ещё раз» — файлы на месте, запускаем заново.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  createJob,
  handler,
  json,
  requireUuid,
  runJobInBackground,
} from "../_shared/shared.ts";
import { requireFiles, storedFiles } from "../_shared/uploadedFiles.ts";
import { extractWords } from "../_shared/wordsExtract.ts";

Deno.serve(
  handler(async ({ userId, admin, body }) => {
    const materialId = requireUuid(body, "material_id");
    const folder = `${userId}/${materialId}/`;
    const requested = requireFiles(body, folder);

    const { data: previous } = await admin
      .from("jobs")
      .select("id, status")
      .eq("user_id", userId)
      .eq("kind", "words_extract")
      .eq("input->>material_id", materialId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (previous && previous.status !== "failed") {
      return json({ job_id: previous.id, kind: "words_extract", material_id: materialId });
    }

    const stored = await storedFiles(admin, folder, requested);

    const jobId = await createJob(admin, userId, "words_extract", { material_id: materialId });
    runJobInBackground(admin, jobId, () => extractWords(admin, stored));

    return json({ job_id: jobId, kind: "words_extract", material_id: materialId });
  }),
);
