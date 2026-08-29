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

export type JobKind =
  | "goal_analyze"
  | "assessment_evaluate"
  | "mission_generate"
  | "material_ingest"
  | "speaking_assess";

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
 */
export function runJobInBackground(
  admin: SupabaseClient,
  jobId: string,
  work: () => Promise<unknown>,
): void {
  const task = (async () => {
    await admin.from("jobs").update({ status: "running" }).eq("id", jobId);
    try {
      const result = await work();
      await admin.from("jobs").update({ status: "done", result }).eq("id", jobId);
    } catch (error) {
      const code = error instanceof HandlerError ? error.code : "internal_error";
      console.error("job_failed", jobId, error);
      await admin.from("jobs").update({ status: "failed", error_code: code }).eq("id", jobId);
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

const GEMINI_SCHEMA_KEYS = new Set([
  "description",
  "enum",
  "format",
  "maxItems",
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

/** One part of a Gemini request — text, or an inlined document/image. */
export type AiPart = { text: string } | { inlineData: { mimeType: string; data: string } };

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

  const payload = await callGemini(body, apiKey, options.name);

  try {
    return JSON.parse(payload) as T;
  } catch {
    console.error("ai_unparsable_json", options.name, payload.slice(0, 500));
    throw new HandlerError("ai_invalid_response", 502);
  }
}

/**
 * Retries once, and only on the failures that are worth retrying: rate
 * limiting and the provider's own 5xx. A 400 is our bug — a schema Gemini
 * will reject the same way every time — so it fails immediately with the
 * response logged, rather than being served twice and hidden behind a
 * generic error code.
 */
async function callGemini(
  body: unknown,
  apiKey: string,
  purpose: string,
): Promise<string> {
  const url = `${AI_ENDPOINT}/${AI_MODEL}:generateContent`;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      const retryable = response.status === 429 || response.status >= 500;
      if (retryable && attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        continue;
      }
      console.error("ai_http_error", purpose, response.status, detail);
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
