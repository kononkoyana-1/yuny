/**
 * Файлы, которые клиент сам положил в Storage перед вызовом функции:
 * `materials/{user_id}/{material_id}/…`. Сюда приходят только пути.
 *
 * Общее у `module-create` и `words-extract`: путь обязан лежать в папке этой
 * загрузки, а размер и тип берутся не из того, что прислал клиент, а из
 * метаданных объекта в Storage. Файлы, не прошедшие лимиты TZ.md §6,
 * удаляются — из них ничего не получится, а место они занимают.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.112.4";
import { HandlerError } from "./shared.ts";
import { checkLimits, type StoredFile } from "./materials.ts";

export const BUCKET = "materials";

export interface RequestedFile {
  path: string;
  filename: string;
}

export function requireFiles(body: Record<string, unknown>, folder: string): RequestedFile[] {
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

/**
 * Что на самом деле лежит в папке загрузки, в порядке `requested`. Бросает
 * `file_missing` или код лимита, удалив перед этим всю папку.
 */
export async function storedFiles(
  admin: SupabaseClient,
  folder: string,
  requested: RequestedFile[],
): Promise<StoredFile[]> {
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
  return stored;
}
