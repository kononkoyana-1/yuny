/**
 * `learning-overview` (#70): сводки для экранов из памяти слов — только чтение.
 *
 * Тело:
 *   { action: "folders" }                        — стадии, «пора освежить» и очередь по каждой папке («Мой словарь»)
 *   { action: "folder", folder_id }              — карта папки: стадия, «пора освежить», пара у каждого слова, очередь
 *   { action: "word", headword, reading }        — карточка слова: стадия, 4 навыка, повторение, пары
 *   tz_offset_min? — смещение часов пользователя от UTC (граница дня)
 *
 * Стадии и сроки считает `_shared/learning/overview.ts`; клиент только выводит.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handler, HandlerError, json, optionalString, requireString, requireUuid } from "../_shared/shared.ts";
import {
  folderOverview,
  type FolderOverview,
  type PlanInput,
  queueView,
  wordProgress,
} from "../_shared/learning/mod.ts";
import { must, type Row, toPair } from "../_shared/studyData.ts";
import { loadInput } from "../_shared/studyInput.ts";

function mapJson(o: FolderOverview) {
  return {
    word_count: o.wordCount,
    due_count: o.dueCount,
    stage_counts: o.stageCounts,
  };
}

/** Изучено и впереди (#85): срок — при `max_new` новых в день из настроек. */
function queueJson(input: Omit<PlanInput, "mode" | "minutes">, folderId: string | null) {
  const q = queueView(input, folderId);
  return { learned: q.learned, queued: q.queued, eta_days: q.etaDays };
}

Deno.serve(
  handler(async ({ userId, admin, body }) => {
    const { input } = await loadInput(admin, userId, body);
    // «по 8 новых в день» — настройка; `null` — потолок 0, новые приходят только из папки.
    const pace = { per_day: input.maxNew > 0 ? input.maxNew : null };

    if (body.action === "folders") {
      const folders = must(await admin.from("user_dictionary_folders").select("id").eq("user_id", userId)) as Row[];
      const total = queueView(input, null);
      return json({
        folders: folders.map((f) => ({
          folder_id: f.id,
          ...mapJson(folderOverview(input, f.id as string)),
          ...queueJson(input, f.id as string),
          ...pace,
        })),
        // Все слова во всех папках, без повторов: сводка над списками.
        total: { words: total.total, learned: total.learned, queued: total.queued, eta_days: total.etaDays },
        ...pace,
      });
    }

    if (body.action === "folder") {
      const folderId = requireUuid(body, "folder_id");
      const o = folderOverview(input, folderId);
      // Порядок карты — порядок добавления в папку (`position`): как в файле, ручные — в конце.
      const items = must(
        await admin.from("user_dictionary_items").select("headword, reading, position")
          .eq("user_id", userId).eq("folder_id", folderId),
      ) as Row[];
      const positionOf = new Map(items.map((i) => [`${i.headword}\u0000${i.reading ?? ""}`, Number(i.position)]));
      const words = o.words
        .map((w) => ({
          headword: w.headword,
          reading: w.reading,
          stage: w.stage,
          due: w.due,
          pair_partner: w.pairPartner,
          position: positionOf.get(`${w.headword}\u0000${w.reading ?? ""}`) ?? 0,
        }))
        .sort((a, b) => a.position - b.position);
      return json({
        ...mapJson(o),
        ...queueJson(input, folderId),
        ...pace,
        words,
      });
    }

    if (body.action === "word") {
      const headword = requireString(body, "headword");
      const reading = optionalString(body, "reading") ?? null;
      const lexeme = input.lexemes.find((l) => l.headword === headword && (l.reading ?? null) === reading);
      if (!lexeme) return json({ found: false });
      // Решённые пары тоже: «путали с 卖 — различаете с 30 сентября».
      const rows = must(
        await admin.from("confusion_pairs").select("*").eq("user_id", userId)
          .or(`lexeme_a.eq.${lexeme.id},lexeme_b.eq.${lexeme.id}`),
      ) as Row[];
      const pairs = rows.map((r) => ({ ...toPair(r), resolvedAt: r.resolved_at ? new Date(r.resolved_at) : null }));
      const p = wordProgress(input, lexeme, pairs);
      return json({
        found: true,
        stage: p.stage,
        skills: p.skills,
        next_review_days: p.nextReviewDays,
        confusions: p.confusions.map((c) => ({
          partner: c.partner,
          partner_reading: c.partnerReading,
          status: c.status,
          resolved_on: c.resolvedOn,
        })),
      });
    }

    throw new HandlerError("invalid_request", 400);
  }),
);
