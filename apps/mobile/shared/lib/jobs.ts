import { z } from "zod";
import { BackendError } from "./backendError";
import { getSupabase } from "./supabase";

/** Async job kinds (TZ.md §6, §10 loading copy). */
export type JobKind =
  | "goal_analyze"
  | "assessment_evaluate"
  | "mission_generate"
  | "material_ingest"
  | "speaking_assess";

interface JobRow {
  status: "queued" | "running" | "done" | "failed";
  result: unknown;
  error_code: string | null;
}

/**
 * Every Edge Function that starts async work answers with the same
 * `{ job_id, kind }` envelope (TZ.md §6), so each repository validates it
 * with this rather than restating the shape.
 */
export function jobRefSchema<K extends JobKind>(kind: K) {
  return z.object({ job_id: z.uuid(), kind: z.literal(kind) });
}

/** TZ.md §10 requires a timeout and a route into Error/Recovery. */
const DEFAULT_TIMEOUT_MS = 90_000;

/**
 * Resolves when the `jobs` row reaches a terminal state (TZ.md §6). The
 * client subscribes via Realtime and never polls — the single `select` below
 * is not a poll, it closes the race where the job finished between the Edge
 * Function returning and this subscription opening.
 */
const FAILED_STATUSES: string[] = ["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"];

export function awaitJob<T>(jobId: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      void getSupabase().removeChannel(channel);
      fn();
    };

    const handle = (row: JobRow | null | undefined) => {
      if (!row) return;
      if (row.status === "done") finish(() => resolve(row.result as T));
      if (row.status === "failed") {
        finish(() => reject(new BackendError(row.error_code ?? "internal_error")));
      }
    };

    const timer = setTimeout(
      () => finish(() => reject(new BackendError("timeout"))),
      timeoutMs,
    );

    const channel = getSupabase()
      .channel(`job:${jobId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${jobId}` },
        (payload) => handle(payload.new as JobRow),
      )
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" || FAILED_STATUSES.includes(status)) {
          // Also closes the race where the job finished between the Edge
          // Function returning and this subscription opening.
          const { data } = await getSupabase()
            .from("jobs")
            .select("status, result, error_code")
            .eq("id", jobId)
            .maybeSingle();
          handle(data as JobRow | null);
        }

        // Realtime never came up and the job is still running: fail now into
        // Error/Recovery instead of holding the screen for the full timeout
        // (TZ.md §10).
        if (FAILED_STATUSES.includes(status)) {
          finish(() => reject(new BackendError("realtime_unavailable")));
        }
      });
  });
}
