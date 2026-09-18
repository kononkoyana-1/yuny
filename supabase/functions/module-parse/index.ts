/**
 * `module-parse` (TZ.md §13): разбор материала в Gemini.
 *
 * Первый разбор запускает `module-create` сразу после загрузки — эта функция
 * нужна для повтора. Если разбор упал не по вине материала (Gemini недоступен,
 * ответ не разобрался), модуль остаётся в статусе `failed` вместе с файлами,
 * и экран ожидания предлагает «Попробовать ещё раз» — это вызов сюда. Файлы
 * заново загружать не нужно.
 *
 * После неучебного материала повторять нечего: такого модуля уже нет, и
 * ответ будет `module_not_found`.
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
import { parseModule } from "../_shared/moduleParse.ts";

Deno.serve(
  handler(async ({ userId, admin, body }) => {
    const moduleId = requireUuid(body, "module_id");

    const { data: module } = await admin
      .from("modules")
      .select("id, status")
      .eq("id", moduleId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!module) throw new HandlerError("module_not_found", 404);
    // Готовый модуль разбирать заново незачем, а идущий разбор нельзя
    // запускать второй раз поверх первого.
    if (module.status !== "failed") throw new HandlerError("module_not_retryable", 409);

    // Условие на статус в самом UPDATE — чтобы два быстрых нажатия «повторить»
    // не запустили два разбора одного модуля.
    const { data: claimed } = await admin
      .from("modules")
      .update({ status: "parsing", error_code: null })
      .eq("id", moduleId)
      .eq("status", "failed")
      .select("id");
    if (!claimed || claimed.length === 0) throw new HandlerError("module_not_retryable", 409);

    const jobId = await createJob(admin, userId, "module_parse", { module_id: moduleId });
    runJobInBackground(admin, jobId, () => parseModule(admin, userId, moduleId));

    return json({ job_id: jobId, kind: "module_parse", module_id: moduleId });
  }),
);
