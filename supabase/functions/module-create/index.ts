/**
 * `module-create` (TZ.md §13): принимает загруженные файлы, создаёт модуль и
 * ставит фоновый разбор. Ответ — `job_id` и `module_id`; клиент ждёт задачу
 * через Realtime и по `done` открывает модуль.
 *
 * Файлы клиент кладёт в Storage сам, до вызова: `{user_id}/{material_id}/…`
 * в bucket `materials`. Сюда приходят только пути.
 *
 * Лимиты TZ.md §6 проверяются заново, и не по тому, что прислал клиент, а по
 * тому, что реально лежит в Storage: размер и тип берутся из метаданных
 * объекта. Файлы, не прошедшие проверку, удаляются — модуль из них не
 * получится, а место они занимают.
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
import { checkLimits, type StoredFile } from "../_shared/materials.ts";
import { parseModule } from "../_shared/moduleParse.ts";

const BUCKET = "materials";

interface RequestedFile {
  path: string;
  filename: string;
}

function requireFiles(body: Record<string, unknown>, folder: string): RequestedFile[] {
  const raw = body.files;
  if (!Array.isArray(raw) || raw.length === 0) throw new HandlerError("invalid_request", 400);

  return raw.map((item) => {
    const file = item as Record<string, unknown>;
    const path = typeof file.path === "string" ? file.path : "";
    const filename = typeof file.filename === "string" ? file.filename.trim() : "";
    // Путь обязан лежать прямо в папке этой загрузки: ни чужого префикса, ни
    // подпапок, ни `..`. Политика Storage и так не дала бы прочесть чужое, но
    // сервер ходит в Storage ключом service role, мимо политик.
    const name = path.startsWith(folder) ? path.slice(folder.length) : "";
    if (!name || name.includes("/") || name.includes("..") || !filename) {
      throw new HandlerError("invalid_request", 400);
    }
    return { path, filename };
  });
}

Deno.serve(
  handler(async ({ userId, admin, body }) => {
    const materialId = requireUuid(body, "material_id");
    const folder = `${userId}/${materialId}/`;
    const requested = requireFiles(body, folder);

    // Повторный вызов с тем же `material_id` — это не второй модуль, а тот
    // же самый: ответ первого вызова мог потеряться в сети, и клиент шлёт
    // снова (docs/design/specs/upload.design.md §2, «Попробовать ещё раз»).
    // Отдаём уже созданный модуль и его последнюю задачу разбора.
    const { data: existing } = await admin
      .from("module_materials")
      .select("module_id")
      .eq("user_id", userId)
      .like("storage_path", `${folder}%`)
      .limit(1)
      .maybeSingle();
    if (existing) {
      const { data: job } = await admin
        .from("jobs")
        .select("id")
        .eq("user_id", userId)
        .eq("kind", "module_parse")
        .eq("input->>module_id", existing.module_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (job) return json({ job_id: job.id, kind: "module_parse", module_id: existing.module_id });
    }

    // Что на самом деле лежит в папке загрузки. Размер и тип — отсюда.
    const { data: objects, error: listError } = await admin.storage
      .from(BUCKET)
      .list(folder.slice(0, -1), { limit: 100 });
    if (listError) throw new HandlerError("storage_unavailable", 503);

    const discardFolder = async () => {
      const all = (objects ?? []).map((o) => `${folder}${o.name}`);
      if (all.length > 0) await admin.storage.from(BUCKET).remove(all);
    };

    const stored: StoredFile[] = [];
    for (const file of requested) {
      const object = objects?.find((o) => `${folder}${o.name}` === file.path);
      if (!object) {
        await discardFolder();
        throw new HandlerError("file_missing", 422);
      }
      const meta = (object.metadata ?? {}) as { size?: number; mimetype?: string };
      stored.push({
        path: file.path,
        filename: file.filename,
        mimeType: meta.mimetype ?? "",
        sizeBytes: meta.size ?? 0,
      });
    }

    const limitError = checkLimits(stored);
    if (limitError) {
      await discardFolder();
      throw new HandlerError(limitError, 422);
    }

    const { data: module, error: moduleError } = await admin
      .from("modules")
      .insert({ user_id: userId, status: "parsing" })
      .select("id")
      .single();
    if (moduleError || !module) throw new HandlerError("module_create_failed", 500);
    const moduleId = module.id as string;

    const { error: materialsError } = await admin.from("module_materials").insert(
      stored.map((file, index) => ({
        module_id: moduleId,
        user_id: userId,
        position: index + 1,
        storage_path: file.path,
        filename: file.filename,
        mime_type: file.mimeType,
        size_bytes: file.sizeBytes,
      })),
    );
    if (materialsError) {
      await admin.from("modules").delete().eq("id", moduleId);
      throw new HandlerError("module_create_failed", 500);
    }

    const jobId = await createJob(admin, userId, "module_parse", { module_id: moduleId });
    runJobInBackground(admin, jobId, () => parseModule(admin, userId, moduleId));

    return json({ job_id: jobId, kind: "module_parse", module_id: moduleId });
  }),
);
