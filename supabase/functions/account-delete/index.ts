/**
 * `account-delete`: удаление аккаунта из настроек (#40).
 *
 * Строки пользователя в базе уходят каскадом от `auth.users`: у каждой
 * таблицы с `user_id` — `on delete cascade` (профиль, папки, слова, память,
 * журнал ответов, задачи). Файлы в Storage каскадом не уходят — их удаляем
 * сами до удаления пользователя: после него путь `{user_id}/…` станет ничьим.
 *
 * Вызов без `{ confirm: "delete" }` отклоняется: случайный запрос не должен
 * стирать аккаунт.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.112.4";
import { handler, HandlerError, json } from "../_shared/shared.ts";

/** Бакеты, где файлы лежат в папке `{user_id}/`. */
const BUCKETS = ["materials", "recordings"];
const PAGE = 1000;

/** Все пути под `prefix`, с подпапками (у файла в списке есть `id`, у папки — нет). */
async function listAll(admin: SupabaseClient, bucket: string, prefix: string): Promise<string[]> {
  const paths: string[] = [];
  for (let offset = 0;; offset += PAGE) {
    const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: PAGE, offset });
    if (error) throw error;
    for (const item of data ?? []) {
      const path = `${prefix}/${item.name}`;
      if (item.id) paths.push(path);
      else paths.push(...await listAll(admin, bucket, path));
    }
    if (!data || data.length < PAGE) return paths;
  }
}

async function removeFiles(admin: SupabaseClient, userId: string): Promise<void> {
  for (const bucket of BUCKETS) {
    const paths = await listAll(admin, bucket, userId);
    for (let i = 0; i < paths.length; i += PAGE) {
      const { error } = await admin.storage.from(bucket).remove(paths.slice(i, i + PAGE));
      if (error) throw error;
    }
  }
}

Deno.serve(
  handler(async ({ userId, admin, body }) => {
    if (body.confirm !== "delete") throw new HandlerError("confirmation_required", 400);

    await removeFiles(admin, userId);

    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      console.error("account_delete_failed", error);
      throw new HandlerError("delete_failed", 500);
    }
    return json({ deleted: true });
  }),
);
