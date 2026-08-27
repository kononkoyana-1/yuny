/**
 * `content-import` — admin-triggered entry point for the content pipeline
 * (see `_shared/content.ts`). Not part of the client contract in TZ.md §6:
 * nothing in the app calls this. It runs the whole
 * Source → Raw → Parsed → Knowledge → Exercises chain synchronously and
 * returns counts, because a developer/admin invoking it wants the result,
 * not a job to poll — the `jobs`/Realtime machinery exists for end-user
 * flows with a UI waiting on them, which this isn't.
 *
 * Auth is still required (via `handler()`) so this can't be hit
 * anonymously, but it does not check for any particular role — there is no
 * admin role in this schema yet. Treat that as a known gap, not a decision.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  extractKnowledge,
  generateExercise,
  getAdapter,
  parseUnit,
  type KnowledgeDraft,
} from "../_shared/content.ts";
import { handler, HandlerError, json, optionalString, requireString, type Ctx } from "../_shared/shared.ts";

interface SourceInput {
  title: string;
  author: string;
  source_url: string;
  license: string;
  license_url: string | null;
  parser: string;
  parser_config: Record<string, unknown>;
}

function readSourceInput(body: Record<string, unknown>): SourceInput {
  const source = body.source as Record<string, unknown> | undefined;
  if (!source) throw new HandlerError("invalid_request", 400);
  return {
    title: requireString(source, "title"),
    author: requireString(source, "author"),
    source_url: requireString(source, "source_url"),
    license: requireString(source, "license"),
    license_url: optionalString(source, "license_url"),
    parser: requireString(source, "parser"),
    parser_config: (source.parser_config as Record<string, unknown>) ?? {},
  };
}

/** Registers a source if new, or reuses the existing row — re-running an import is idempotent. */
async function resolveSource(admin: Ctx["admin"], body: Record<string, unknown>): Promise<string> {
  const existingId = optionalString(body, "source_id");
  if (existingId) return existingId;

  const input = readSourceInput(body);
  const { data, error } = await admin
    .from("content_sources")
    .upsert(input, { onConflict: "source_url" })
    .select("id")
    .single();
  if (error || !data) throw new HandlerError("source_registration_failed", 500);
  return data.id as string;
}

Deno.serve(
  handler(async ({ admin, body }) => {
    const sourceId = await resolveSource(admin, body);
    // Caps how many units this run processes — the whole book on every
    // call would be slow and is unnecessary for proving the pipeline works;
    // omit to process everything (a real full import).
    const limit = typeof body.limit === "number" && body.limit > 0 ? Math.floor(body.limit) : undefined;

    const { data: source, error: sourceError } = await admin
      .from("content_sources")
      .select("id, parser, parser_config")
      .eq("id", sourceId)
      .single();
    if (sourceError || !source) throw new HandlerError("source_not_found", 404);

    await admin.from("content_sources").update({ status: "processing" }).eq("id", sourceId);

    try {
      const adapter = getAdapter(source.parser as string);
      const config = source.parser_config as Record<string, unknown>;

      // --- Raw Content: fetch, then upsert by (source_id, external_id) so
      // re-running never duplicates a unit — it just refreshes it.
      const rawUnits = await adapter.fetchUnits(config);
      const toProcess = limit ? rawUnits.slice(0, limit) : rawUnits;

      const unitIds: string[] = [];
      let parsedCount = 0;
      let knowledgeCount = 0;
      let exerciseCount = 0;

      for (const raw of toProcess) {
        const { blocks, wordCount } = parseUnit(raw.html);

        const { data: unit, error: unitError } = await admin
          .from("content_units")
          .upsert(
            {
              source_id: sourceId,
              external_id: raw.externalId,
              kind: raw.kind,
              part_title: raw.partTitle,
              title: raw.title,
              position: raw.position,
              unit_url: raw.unitUrl,
              raw_html: raw.html,
              raw_fetched_at: new Date().toISOString(),
              parsed_blocks: blocks,
              parsed_at: new Date().toISOString(),
              word_count: wordCount,
              status: "parsed",
            },
            { onConflict: "source_id,external_id" },
          )
          .select("id")
          .single();
        if (unitError || !unit) continue;
        unitIds.push(unit.id as string);
        parsedCount += 1;

        // --- Structured Knowledge, upserted by (unit, kind, dedup_key) —
        // re-extracting the same unit updates rather than duplicates.
        const drafts = await extractKnowledge(raw.title, raw.partTitle, blocks);
        for (const draft of drafts) {
          const { data: item, error: itemError } = await admin
            .from("knowledge_items")
            .upsert(
              {
                content_unit_id: unit.id,
                kind: draft.kind,
                dedup_key: draft.dedupKey,
                data: draft.data,
                origin: draft.origin,
                status: draft.origin === "source_derived" ? "validated" : "draft",
              },
              { onConflict: "content_unit_id,kind,dedup_key" },
            )
            .select("id")
            .single();
          if (itemError || !item) continue;
          knowledgeCount += 1;

          // --- Exercises, upserted by (knowledge_item, type) — same
          // idempotency shape, one step further down the chain.
          const exercise = await generateExercise(draft);
          if (!exercise) continue;
          const { error: exerciseError } = await admin.from("generated_exercises").upsert(
            {
              knowledge_item_id: item.id,
              type: exercise.type,
              payload: exercise.payload,
              status: "draft",
            },
            { onConflict: "knowledge_item_id,type" },
          );
          if (!exerciseError) exerciseCount += 1;
        }
      }

      await admin.from("content_sources").update({ status: "ready", status_error: null }).eq("id", sourceId);

      return json({
        source_id: sourceId,
        units_available: rawUnits.length,
        units_processed: parsedCount,
        knowledge_items: knowledgeCount,
        exercises: exerciseCount,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      await admin
        .from("content_sources")
        .update({ status: "failed", status_error: message.slice(0, 500) })
        .eq("id", sourceId);
      throw new HandlerError("content_import_failed", 500);
    }
  }),
);
