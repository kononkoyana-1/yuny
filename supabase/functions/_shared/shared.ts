/**
 * Shared runtime for every Yuny Edge Function (TZ.md §6).
 *
 * Responsibilities kept here and nowhere else:
 *   * CORS + a single error envelope (`{ error_code }`) — the client turns
 *     codes into human copy, technical detail never crosses the wire
 *     (TZ.md §10 "Error");
 *   * auth: every function runs on behalf of a signed-in user;
 *   * the `jobs` ledger for async work (TZ.md §6) — the client subscribes
 *     via Realtime and never polls;
 *   * the AI gateway: one schema-constrained call shape, so every generated
 *     structure is checked against a schema before it reaches Postgres.
 */
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.112.4";

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

/** The only error shape the client ever sees. No stack traces, no LLM text. */
export function fail(errorCode: string, status = 400): Response {
  return json({ error_code: errorCode }, status);
}

export class HandlerError extends Error {
  constructor(readonly code: string, readonly status = 400) {
    super(code);
  }
}

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export interface Ctx {
  userId: string;
  admin: SupabaseClient;
  body: Record<string, unknown>;
}

/**
 * Wraps a handler with CORS, auth, JSON body parsing, and error mapping so
 * each function file contains domain logic only.
 */
export function handler(fn: (ctx: Ctx) => Promise<Response>): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
    if (req.method !== "POST") return fail("method_not_allowed", 405);

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return fail("unauthorized", 401);

    const admin = serviceClient();
    const { data: userData, error: userError } = await admin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userError || !userData.user) return fail("unauthorized", 401);

    let body: Record<string, unknown> = {};
    try {
      const raw = await req.text();
      body = raw ? JSON.parse(raw) : {};
    } catch {
      return fail("invalid_request", 400);
    }

    try {
      return await fn({ userId: userData.user.id, admin, body });
    } catch (error) {
      if (error instanceof HandlerError) return fail(error.code, error.status);
      console.error("unhandled_error", error);
      return fail("internal_error", 500);
    }
  };
}

// ------------------------------------------------------------------ input

export function requireString(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new HandlerError("invalid_request", 400);
  }
  return value.trim();
}

export function optionalString(body: Record<string, unknown>, key: string): string | null {
  const value = body[key];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export function requireInt(body: Record<string, unknown>, key: string): number {
  const value = body[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new HandlerError("invalid_request", 400);
  }
  return Math.round(value);
}

export function requireUuid(body: Record<string, unknown>, key: string): string {
  const value = requireString(body, key);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new HandlerError("invalid_request", 400);
  }
  return value;
}

// ------------------------------------------------------------------- jobs

export type JobKind = "module_parse" | "lesson_generate" | "words_extract" | "context_generate";

export async function createJob(
  admin: SupabaseClient,
  userId: string,
  kind: JobKind,
  input: unknown,
): Promise<string> {
  const { data, error } = await admin
    .from("jobs")
    .insert({ user_id: userId, kind, input, status: "queued" })
    .select("id")
    .single();
  if (error) throw new HandlerError("job_create_failed", 500);
  return data.id as string;
}

/**
 * Runs `work` after the response has already been returned, then writes the
 * outcome onto the job row — that UPDATE is what the client's Realtime
 * subscription is waiting for (TZ.md §6).
 *
 * Each write only moves the job forward from the state it expects
 * (`queued → running → done/failed`): a job cancelled or declared stale
 * meanwhile (`words-extract`) stays as it is, even if the work finishes later.
 */
export function runJobInBackground(
  admin: SupabaseClient,
  jobId: string,
  work: () => Promise<unknown>,
): void {
  const task = (async () => {
    await admin.from("jobs").update({ status: "running" }).eq("id", jobId).eq("status", "queued");
    try {
      const result = await work();
      await admin.from("jobs").update({ status: "done", result }).eq("id", jobId).eq("status", "running");
    } catch (error) {
      const code = error instanceof HandlerError ? error.code : "internal_error";
      console.error("job_failed", jobId, error);
      await admin.from("jobs").update({ status: "failed", error_code: code }).eq("id", jobId)
        .eq("status", "running");
    }
  })();

  const runtime = (globalThis as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } })
    .EdgeRuntime;
  if (runtime?.waitUntil) runtime.waitUntil(task);
}

// --------------------------------------------------------------------- ai

/**
 * Gemini through the Generative Language REST API, called with `fetch` and
 * no SDK. The provider is pinned in exactly one place: every function reaches
 * AI through `aiJson`, so the shape below is the whole gateway.
 *
 * The model id is configuration, not a constant, because it is the one thing
 * here that changes without the code changing. Verify what a key can actually
 * reach with `node scripts/gemini-check.mjs` — the id on a pricing page and
 * the id the API accepts are not reliably the same string.
 *
 * The default is an exact id rather than the `gemini-flash-latest` alias.
 * The alias never 404s, which sounds like the safer choice and is not: it
 * moves under you on Google's schedule, and this generator's output goes
 * straight into learning material. A model that disappears fails loudly on
 * the next call; a model that quietly becomes a different model produces
 * subtly different content that nothing here would flag.
 */
const AI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-3.5-flash";

/**
 * Where a retry goes when the main model is busy. Google answers
 * `503 "This model is currently experiencing high demand"` per model, for
 * minutes at a time (2026-09-25: every upload failed on `gemini-3.5-flash`),
 * so retrying the same model mostly waits out the same spike. Retries rotate
 * through these instead.
 *
 * Aliases on purpose, unlike `AI_MODEL`: they never 404, and a fallback only
 * serves while the pinned model is down — the drift the note above warns
 * about is acceptable for that window, a hard failure is not. Override with
 * the `GEMINI_FALLBACK_MODELS` secret (comma-separated; empty — no fallback).
 */
const AI_FALLBACK_MODELS = (Deno.env.get("GEMINI_FALLBACK_MODELS") ?? "gemini-flash-lite-latest,gemini-flash-latest")
  .split(",")
  .map((m) => m.trim())
  .filter((m) => m && m !== AI_MODEL);
const AI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Thinking is left at the model's own default rather than switched off.
 * Disabling it takes a different field on every model generation
 * (`thinkingBudget` on 2.5, `thinkingLevel` on 3.x) and an unknown field is a
 * hard 400 — so a setting meant as an optimisation would turn every model
 * change into an outage. Thinking tokens are billed against
 * `maxOutputTokens`, so the caller's budget gets headroom rather than a cap
 * the model can exhaust before writing a single character of JSON.
 */
const THINKING_HEADROOM = 2048;

export function aiAvailable(): boolean {
  return Boolean(Deno.env.get("GEMINI_API_KEY"));
}

/**
 * Gemini's `responseSchema` is a subset of OpenAPI 3.0, not JSON Schema:
 * types are upper-case, and `additionalProperties` is not merely ignored —
 * sending it is a 400. Callers keep writing plain JSON Schema through
 * `objectSchema`, and the translation happens here so the provider's dialect
 * stops at this file.
 */
const GEMINI_TYPES: Record<string, string> = {
  string: "STRING",
  number: "NUMBER",
  integer: "INTEGER",
  boolean: "BOOLEAN",
  array: "ARRAY",
  object: "OBJECT",
};

/**
 * `maxItems` is deliberately absent. `gemini-3.5-flash` answers any schema
 * carrying it with a bare `400 INVALID_ARGUMENT` — as a number or as a string,
 * checked 2026-09-18 — while the same schema without it passes. Earlier
 * models accepted it, so this broke silently on the model switch. Callers may
 * still write `maxItems` (it documents intent); it is dropped here, and the
 * caller caps the array in code after parsing.
 */
const GEMINI_SCHEMA_KEYS = new Set([
  "description",
  "enum",
  "format",
  "maxLength",
  "maximum",
  "minItems",
  "minLength",
  "minimum",
  "nullable",
  "pattern",
  "required",
]);

function toGeminiSchema(schema: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  const type = schema.type;
  if (typeof type === "string") out.type = GEMINI_TYPES[type] ?? type.toUpperCase();

  for (const [key, value] of Object.entries(schema)) {
    if (GEMINI_SCHEMA_KEYS.has(key)) out[key] = value;
  }

  if (schema.items && typeof schema.items === "object") {
    out.items = toGeminiSchema(schema.items as Record<string, unknown>);
  }

  if (schema.properties && typeof schema.properties === "object") {
    const properties: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(schema.properties as Record<string, unknown>)) {
      properties[key] = toGeminiSchema(value as Record<string, unknown>);
    }
    out.properties = properties;
    // Declared order is not decoration: without it Gemini may emit fields in
    // an order that differs from the prompt's own framing, which measurably
    // degrades the content of the later fields.
    out.propertyOrdering = Object.keys(properties);
  }

  return out;
}

/**
 * One part of a Gemini request — text, an inlined document/image, or a file
 * already uploaded through the Files API (see `aiUploadFile`).
 */
export type AiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } }
  | { fileData: { mimeType: string; fileUri: string } };

const AI_FILES_UPLOAD = "https://generativelanguage.googleapis.com/upload/v1beta/files";
const AI_FILES = "https://generativelanguage.googleapis.com/v1beta";

/**
 * Uploads one file through the Gemini Files API and returns a part that
 * references it.
 *
 * Inline data is capped per *request*, not per file, and base64 grows the
 * bytes by a third — so a 20 MB PDF that TZ.md §6 allows cannot travel
 * inline at all. Callers inline what fits and upload the rest here. Files
 * expire on Google's side after 48 hours; nothing needs cleaning up.
 */
export async function aiUploadFile(
  bytes: Uint8Array<ArrayBuffer>,
  mimeType: string,
  displayName: string,
): Promise<AiPart> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new HandlerError("ai_unavailable", 503);

  const start = await fetch(AI_FILES_UPLOAD, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(bytes.byteLength),
      "X-Goog-Upload-Header-Content-Type": mimeType,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: displayName } }),
  });
  const uploadUrl = start.headers.get("x-goog-upload-url");
  if (!start.ok || !uploadUrl) {
    console.error("ai_upload_start_failed", start.status, (await start.text()).slice(0, 300));
    throw new HandlerError("ai_unavailable", 503);
  }

  const finish = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": String(bytes.byteLength),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: bytes,
  });
  if (!finish.ok) {
    console.error("ai_upload_failed", finish.status, (await finish.text()).slice(0, 300));
    throw new HandlerError("ai_unavailable", 503);
  }
  let file = ((await finish.json()) as { file?: AiFile }).file;
  if (!file?.uri || !file.name) throw new HandlerError("ai_unavailable", 503);

  // A PDF is usually ACTIVE at once, but the API does not promise it, and a
  // request naming a PROCESSING file is rejected. A short wait is cheaper than
  // a failed parse.
  for (let attempt = 0; file.state === "PROCESSING" && attempt < 10; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const poll = await fetch(`${AI_FILES}/${file.name}`, { headers: { "x-goog-api-key": apiKey } });
    if (poll.ok) file = (await poll.json()) as AiFile;
  }
  if (!file.uri || (file.state && file.state !== "ACTIVE")) {
    console.error("ai_upload_not_active", file.name, file.state);
    throw new HandlerError("ai_unavailable", 503);
  }

  return { fileData: { mimeType, fileUri: file.uri } };
}

interface AiFile {
  name?: string;
  uri?: string;
  state?: "STATE_UNSPECIFIED" | "PROCESSING" | "ACTIVE" | "FAILED";
}

/**
 * The single AI call shape used by every function: a response schema the
 * model is constrained to fill, so the caller gets a structure rather than
 * prose it would have to parse. `name` and `description` survive from the
 * previous tool-based gateway because they still carry the task's framing —
 * here they go into the system instruction instead of a tool declaration.
 */
export async function aiJson<T>(options: {
  name: string;
  description: string;
  schema: Record<string, unknown>;
  system: string;
  prompt: string | AiPart[];
  maxTokens?: number;
  /** Модель вместо основной — например, дешёвая для проверок; запасные те же. */
  model?: string;
}): Promise<T> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new HandlerError("ai_unavailable", 503);

  const parts: AiPart[] =
    typeof options.prompt === "string" ? [{ text: options.prompt }] : options.prompt;

  const body = {
    systemInstruction: {
      parts: [{ text: `${options.system}\n\nTask: ${options.description}` }],
    },
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: toGeminiSchema(options.schema),
      maxOutputTokens: (options.maxTokens ?? 8000) + THINKING_HEADROOM,
    },
  };

  const payload = await callGemini(body, apiKey, options.name, options.model);

  try {
    return JSON.parse(payload) as T;
  } catch {
    console.error("ai_unparsable_json", options.name, payload.slice(0, 500));
    throw new HandlerError("ai_invalid_response", 502);
  }
}

/**
 * Retries only the failures worth retrying: rate limiting and the provider's
 * own 5xx. A 400 is our bug — a schema Gemini will reject the same way every
 * time — so it fails immediately with the response logged, rather than being
 * served twice and hidden behind a generic error code.
 *
 * Four attempts with a growing wait, not one quick repeat. Gemini answers
 * `503 "This model is currently experiencing high demand"` for spells longer
 * than a second, and a lesson generation that gives up after 1.2s hands the
 * learner an error over a wait they would gladly have sat through — the call
 * already runs in the background against a job.
 *
 * Every attempt has its own time limit, and all attempts together fit in
 * `AI_DEADLINE_MS`. Without it a hung request outlived the platform's
 * wall-clock limit for background work: the worker was killed before the
 * `catch` could run, and the job stayed `running` forever (2026-09-25, a
 * 125 KB photo). Failing inside the limit leaves a `failed` job the client
 * can retry.
 */
const AI_ATTEMPT_TIMEOUT_MS = 50_000;
const AI_DEADLINE_MS = 110_000;

async function callGemini(
  body: unknown,
  apiKey: string,
  purpose: string,
  model?: string,
): Promise<string> {
  // Attempt 0 — the main model (or the one asked for); each retry — the next fallback, then the first again.
  const models = [model ?? AI_MODEL, ...AI_FALLBACK_MODELS.filter((m) => m !== model)];

  const RETRY_WAITS_MS = [2000, 6000, 15000];
  const startedAt = Date.now();
  const left = () => AI_DEADLINE_MS - (Date.now() - startedAt);

  for (let attempt = 0; attempt <= RETRY_WAITS_MS.length; attempt += 1) {
    const wait = RETRY_WAITS_MS[attempt];
    const model = models[attempt % models.length]!;
    const url = `${AI_ENDPOINT}/${model}:generateContent`;
    const canRetry = () => wait !== undefined && left() > wait + 5_000;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(Math.max(1_000, Math.min(AI_ATTEMPT_TIMEOUT_MS, left()))),
      });
    } catch (error) {
      // Timeout or a dropped connection: the same as a 503 for retrying.
      console.error("ai_fetch_error", purpose, model, attempt, String(error));
      if (canRetry()) {
        await new Promise((resolve) => setTimeout(resolve, wait));
        continue;
      }
      throw new HandlerError("ai_unavailable", 503);
    }

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      // 404/400 on a fallback: the alias is unknown to this key or rejects
      // the schema — move on to the next model rather than fail the job.
      const retryable = response.status === 429 || response.status >= 500 ||
        (model !== AI_MODEL && (response.status === 404 || response.status === 400));
      if (retryable && canRetry()) {
        console.error("ai_http_retry", purpose, model, attempt, response.status, detail.slice(0, 200));
        await new Promise((resolve) => setTimeout(resolve, wait));
        continue;
      }
      console.error("ai_http_error", purpose, model, response.status, detail);
      throw new HandlerError(
        response.status === 400 ? "ai_invalid_response" : "ai_unavailable",
        response.status === 400 ? 502 : 503,
      );
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
      promptFeedback?: { blockReason?: string };
    };

    const blocked = data.promptFeedback?.blockReason;
    if (blocked) {
      console.error("ai_blocked", purpose, blocked);
      throw new HandlerError("ai_unavailable", 503);
    }

    const candidate = data.candidates?.[0];
    const finish = candidate?.finishReason;

    // STOP is the only finish reason that leaves complete JSON behind. MAX_TOKENS
    // in particular returns a truncated object that parses as prose and fails as
    // data, so it is caught here rather than at JSON.parse.
    if (finish && finish !== "STOP") {
      console.error("ai_finish_reason", purpose, finish);
      throw new HandlerError(
        finish === "MAX_TOKENS" ? "ai_invalid_response" : "ai_unavailable",
        finish === "MAX_TOKENS" ? 502 : 503,
      );
    }

    const text = (candidate?.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join("")
      .trim();
    if (!text) throw new HandlerError("ai_invalid_response", 502);
    if (model !== AI_MODEL) console.log("ai_fallback_served", purpose, model, attempt);
    return text;
  }

  throw new HandlerError("ai_unavailable", 503);
}

/**
 * JSON-Schema helper. `additionalProperties: false` stays because it is what
 * the schema *means* — the translator above strips it for Gemini, and the
 * shape remains readable as ordinary JSON Schema for anything else that reads
 * these files.
 */
export function objectSchema(
  properties: Record<string, unknown>,
  required: string[],
): Record<string, unknown> {
  return { type: "object", properties, required, additionalProperties: false };
}

// ------------------------------------------------------------------ utils

export const SKILLS = [
  "speaking",
  "listening",
  "vocabulary",
  "grammar",
  "reading",
  "writing",
] as const;
export type Skill = (typeof SKILLS)[number];

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, Math.round(value * 1000) / 1000));
}

export function isSkill(value: unknown): value is Skill {
  return typeof value === "string" && (SKILLS as readonly string[]).includes(value);
}

export async function logEvent(
  admin: SupabaseClient,
  userId: string,
  name: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  await admin.from("events").insert({ user_id: userId, name, payload });
}
