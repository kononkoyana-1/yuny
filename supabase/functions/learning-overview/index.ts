/**
 * `learning-overview` (#70): сводки для экранов из памяти слов — только чтение.
 *
 * Тело:
 *   { action: "folders" }                        — стадии и «пора освежить» по каждой папке («Мой словарь»)
 *   { action: "folder", folder_id }              — карта папки: стадия, «пора освежить», пара у каждого слова
 *   { action: "word", headword, reading }        — карточка слова: стадия, 4 навыка, повторение, пары
 *   tz_offset_min? — смещение часов пользователя от UTC (граница дня)
 *
 * Стадии и сроки считает `_shared/learning/overview.ts`; клиент только выводит.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handler, HandlerError, json, optionalString, requireString, requireUuid } from "../_shared/shared.ts";
import { folderOverview, type FolderOverview, wordProgress } from "../_shared/learning/mod.ts";
import { must, type Row, toPair } from "../_shared/studyData.ts";
import { loadInput } from "../_shared/studyInput.ts";

function mapJson(o: FolderOverview) {
  return {
    word_count: o.wordCount,
    due_count: o.dueCount,
    stage_counts: o.stageCounts,
  };
}

Deno.serve(
  handler(async ({ userId, admin, body }) => {
    const { input } = await loadInput(admin, userId, body);

    if (body.action === "folders") {
      const folders = must(await admin.from("user_dictionary_folders").select("id").eq("user_id", userId)) as Row[];
      return json({
        folders: folders.map((f) => ({ folder_id: f.id, ...mapJson(folderOverview(input, f.id as string)) })),
      });
    }

    if (body.action === "folder") {
      const folderId = requireUuid(body, "folder_id");
      const o = folderOverview(input, folderId);
      return json({
        ...mapJson(o),
        words: o.words.map((w) => ({
          headword: w.headword,
          reading: w.reading,
          stage: w.stage,
          due: w.due,
          pair_partner: w.pairPartner,
        })),
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
