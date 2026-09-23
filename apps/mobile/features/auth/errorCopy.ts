import { BackendError } from "@/shared/lib/backendError";
import { t } from "@/shared/i18n";

/**
 * Human copy for auth failures (TZ.md §10 "Error" — no codes, no stack
 * traces, nothing mentioning an API). The code stays in the thrown
 * `BackendError` for logging; only these sentences reach the screen.
 */
const KNOWN = new Set([
  "invalid_credentials",
  "email_not_confirmed",
  "email_taken",
  "weak_password",
  "too_many_attempts",
  "sign_in_cancelled",
  "apple_unavailable",
  "network_error",
]);

export function authErrorCopy(error: unknown): string {
  const code = error instanceof BackendError ? error.code : "";
  return t(`auth.error.${KNOWN.has(code) ? code : "unknown"}`);
}
