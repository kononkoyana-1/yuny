/**
 * Error routing table (`docs/design/specs/upload.design.md` §2). Pure
 * `(phase, code) → FailureKind` — no network, no store, no i18n — so the
 * screen and the store both classify a `BackendError` the same way and the
 * mapping is unit-testable on its own.
 *
 * `phase` is not the store's `FlowState["phase"]` — it is finer-grained,
 * matching the four rows of the spec's table: a Storage upload failure
 * classifies differently from a `module-create` failure even though both
 * happen while the store is in `sending`.
 */
export type ErrorPhase =
  /** Storage upload of one file (`sending`, before `module-create`). */
  | "upload"
  /** `module-create` response. */
  | "create"
  /** The `module_parse` job result. */
  | "job"
  /** `module-parse` retry call. */
  | "retry";

export type FailureKind =
  | "send_failed"
  | "limits"
  | "material_rejected"
  | "pdf_too_long"
  | "parse_failed"
  | "parse_slow"
  | "lost";

/** `module-create` codes that mean "fix your selection", not "try again". */
const CREATE_LIMIT_CODES = new Set([
  "too_many_files",
  "file_too_large",
  "total_too_large",
  "unsupported_type",
]);

const JOB_SLOW_CODES = new Set(["timeout", "realtime_unavailable"]);
/** `file_missing` on a retry: the files are gone, so there is nothing left to read again. */
const RETRY_LOST_CODES = new Set(["module_not_found", "module_not_retryable", "file_missing"]);

/**
 * Classifies a failure by the phase it happened in and the backend's
 * `error_code`. Never shown to the user directly — the caller looks up
 * human copy for the returned `FailureKind` (§Copy `upload.fail.*` /
 * `upload.error.*`).
 */
export function errorRoute(phase: ErrorPhase, code: string): FailureKind {
  switch (phase) {
    case "upload":
      // "Любая ошибка загрузки" — the code does not matter, only that the
      // Storage `upload` call rejected.
      return "send_failed";

    case "create":
      return CREATE_LIMIT_CODES.has(code) ? "limits" : "send_failed";

    case "job":
      if (code === "not_language_material") return "material_rejected";
      if (code === "pdf_too_many_pages") return "pdf_too_long";
      if (code === "file_missing") return "lost";
      if (JOB_SLOW_CODES.has(code)) return "parse_slow";
      // ai_unavailable, ai_invalid_response, internal_error, unknown.
      return "parse_failed";

    case "retry":
      return RETRY_LOST_CODES.has(code) ? "lost" : "parse_failed";
  }
}

/**
 * Whether the current `material_id` must be discarded before the next
 * attempt. True exactly where the spec's "Действие" column says so:
 * `limits` (the server already deleted the upload folder), `lost` (the
 * material can no longer be completed), and the one `send_failed` case
 * caused by `file_missing`. Every other `send_failed` keeps the same id so
 * the retried `upload`/`createModule` calls stay idempotent (`upsert: true`).
 */
export function needsFreshMaterialId(kind: FailureKind, code: string): boolean {
  if (kind === "limits" || kind === "lost") return true;
  return kind === "send_failed" && code === "file_missing";
}
