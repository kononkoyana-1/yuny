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
 *   * the AI gateway: one strict-tool call shape, so every generated
 *     structure is schema-checked before it reaches Postgres.
 */
import Anthropic from "npm:@anthropic-ai/sdk@0.121.0";
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

const AI_MODEL = "claude-opus-5";

export function aiAvailable(): boolean {
  return Boolean(Deno.env.get("ANTHROPIC_API_KEY"));
}

/**
 * The single AI call shape used by every function: a strict tool whose
 * parameters *are* the response schema, forced with `tool_choice`. Strict
 * mode guarantees the arguments validate against the schema, so the caller
 * gets a structure rather than prose it would have to parse.
 *
 * Thinking is disabled deliberately — forced `tool_choice` is incompatible
 * with extended thinking, and these are short extraction-shaped tasks.
 */
export async function aiJson<T>(options: {
  name: string;
  description: string;
  schema: Record<string, unknown>;
  system: string;
  prompt: string;
  maxTokens?: number;
  effort?: "low" | "medium" | "high";
}): Promise<T> {
  const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: options.maxTokens ?? 8000,
    thinking: { type: "disabled" },
    output_config: { effort: options.effort ?? "medium" },
    system: options.system,
    messages: [{ role: "user", content: options.prompt }],
    tools: [
      {
        name: options.name,
        description: options.description,
        strict: true,
        input_schema: options.schema as Anthropic.Tool["input_schema"],
      },
    ],
    tool_choice: { type: "tool", name: options.name },
  });

  if (response.stop_reason === "refusal") throw new HandlerError("ai_unavailable", 503);

  for (const block of response.content) {
    if (block.type === "tool_use" && block.name === options.name) {
      return block.input as T;
    }
  }
  throw new HandlerError("ai_invalid_response", 502);
}

/** JSON-Schema helper — strict tools require `additionalProperties: false`. */
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
