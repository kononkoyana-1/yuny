/**
 * `material-ingest` (TZ.md §6) — async (`material_ingest`, TZ.md §10
 * "Processing your material…"). The client has already uploaded the file to
 * `materials/{user_id}/…` (Storage RLS, TZ.md §5); this function turns it
 * into a Library row with usable text.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk@0.121.0";
import {
  aiAvailable,
  createJob,
  handler,
  HandlerError,
  json,
  logEvent,
  objectSchema,
  optionalString,
  requireString,
  runJobInBackground,
} from "../_shared/shared.ts";

const KINDS = ["pdf", "image", "text", "url"] as const;
type MaterialKind = (typeof KINDS)[number];

/** Storage objects can be megabytes; chunk to keep the stack shallow. */
function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

const EXTRACT_TOOL = {
  name: "record_material",
  description: "Record the title and readable text of a learner's uploaded material.",
  strict: true,
  input_schema: objectSchema(
    {
      title: { type: "string", description: "Short descriptive title, max 80 chars." },
      extracted_text: {
        type: "string",
        description: "The readable text content, cleaned of layout artefacts.",
      },
    },
    ["title", "extracted_text"],
  ),
} as unknown as Anthropic.Tool;

async function extractFromFile(
  bytes: Uint8Array,
  mediaType: string,
  kind: MaterialKind,
): Promise<{ title: string; extracted_text: string }> {
  const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
  const data = toBase64(bytes);

  const block: Anthropic.ContentBlockParam =
    kind === "pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } }
      : {
          type: "image",
          source: {
            type: "base64",
            media_type: mediaType as "image/png" | "image/jpeg" | "image/webp",
            data,
          },
        };

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 16000,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    system:
      "You prepare learner-uploaded material for a language-learning library. " +
      "Extract the readable text faithfully; do not summarise or translate it.",
    messages: [
      { role: "user", content: [block, { type: "text", text: "Extract this material." }] },
    ],
    tools: [EXTRACT_TOOL],
    tool_choice: { type: "tool", name: "record_material" },
  });

  for (const content of response.content) {
    if (content.type === "tool_use" && content.name === "record_material") {
      return content.input as { title: string; extracted_text: string };
    }
  }
  throw new HandlerError("material_unreadable", 422);
}

/** Deliberately dependency-free: strip markup, keep the words. */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

Deno.serve(
  handler(async ({ userId, admin, body }) => {
    const kind = requireString(body, "kind") as MaterialKind;
    if (!KINDS.includes(kind)) throw new HandlerError("invalid_request", 400);

    const storagePath = optionalString(body, "storage_path");
    const sourceUrl = optionalString(body, "source_url");
    const inlineText = optionalString(body, "text");
    const providedTitle = optionalString(body, "title");

    if (!storagePath && !sourceUrl && !inlineText) throw new HandlerError("invalid_request", 400);
    // Storage RLS already scopes uploads to the caller's folder; re-check
    // here so a forged path cannot reach another user's object via the
    // service role.
    if (storagePath && !storagePath.startsWith(`${userId}/`)) {
      throw new HandlerError("forbidden", 403);
    }

    const { data: material, error } = await admin
      .from("materials")
      .insert({
        user_id: userId,
        kind,
        storage_path: storagePath,
        source_url: sourceUrl,
        extracted_text: inlineText,
        title: providedTitle ?? "Processing…",
        status: "queued",
      })
      .select("id")
      .single();
    if (error || !material) throw new HandlerError("material_create_failed", 500);

    const jobId = await createJob(admin, userId, "material_ingest", { material_id: material.id });

    runJobInBackground(admin, jobId, async () => {
      await admin.from("materials").update({ status: "processing" }).eq("id", material.id);

      let title = providedTitle ?? "Untitled material";
      let text = inlineText ?? "";

      if (kind === "url" && sourceUrl) {
        const page = await fetch(sourceUrl, { headers: { "User-Agent": "Yuny/1.0" } });
        if (!page.ok) throw new HandlerError("material_unreachable", 422);
        const html = await page.text();
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (!providedTitle && titleMatch) title = htmlToText(titleMatch[1]).slice(0, 80);
        text = htmlToText(html).slice(0, 20000);
      } else if ((kind === "pdf" || kind === "image") && storagePath) {
        const { data: file, error: downloadError } = await admin.storage
          .from("materials")
          .download(storagePath);
        if (downloadError || !file) throw new HandlerError("material_unreachable", 422);

        if (aiAvailable()) {
          const bytes = new Uint8Array(await file.arrayBuffer());
          const extracted = await extractFromFile(bytes, file.type || "image/png", kind);
          if (!providedTitle) title = extracted.title.slice(0, 80);
          text = extracted.extracted_text;
        } else {
          // No AI configured: the file is still in the Library, just without
          // extracted text. Nothing here invents content.
          if (!providedTitle) title = storagePath.split("/").pop() ?? "Uploaded file";
          text = "";
        }
      } else if (kind === "text" && !text) {
        throw new HandlerError("invalid_request", 400);
      }

      const { data: ready } = await admin
        .from("materials")
        .update({
          title,
          extracted_text: text || null,
          status: "ready",
        })
        .eq("id", material.id)
        .select("id, kind, storage_path, source_url, title, status, created_at")
        .single();

      await logEvent(admin, userId, "material_ingested", { material_id: material.id, kind });
      return ready;
    });

    return json({ job_id: jobId, kind: "material_ingest", material_id: material.id });
  }),
);
