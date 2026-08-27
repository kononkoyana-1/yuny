import { FunctionsHttpError } from "@supabase/supabase-js";
import { BackendError } from "./backendError";
import { requireUserId } from "./auth";
import { getSupabase } from "./supabase";

/**
 * Calls one Edge Function (TZ.md §6). Guarantees a session exists first, and
 * normalises every failure into a `BackendError` carrying the backend's
 * `error_code`.
 */
export async function invokeEdge<T>(name: string, body: Record<string, unknown>): Promise<T> {
  await requireUserId();

  const { data, error } = await getSupabase().functions.invoke<T>(name, { body });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      // The function answered with a status — its body carries the code.
      const payload = await error.context.json().catch(() => null);
      throw new BackendError(payload?.error_code ?? "internal_error");
    }
    throw new BackendError("network_error");
  }
  if (data === null) throw new BackendError("empty_response");
  return data;
}
