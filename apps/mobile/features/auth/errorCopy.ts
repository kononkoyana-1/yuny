import { BackendError } from "@/shared/lib/backendError";

/**
 * Human copy for auth failures (TZ.md §10 "Error" — no codes, no stack
 * traces, nothing mentioning an API). The code stays in the thrown
 * `BackendError` for logging; only these sentences reach the screen.
 */
const COPY: Record<string, string> = {
  invalid_credentials: "That email and password don't match. Try again.",
  email_not_confirmed: "Confirm your email first — check your inbox for the link.",
  email_taken: "There's already an account with this email. Try signing in.",
  weak_password: "Pick a longer password — at least 8 characters.",
  too_many_attempts: "Too many attempts. Wait a minute and try again.",
  sign_in_cancelled: "Sign-in was cancelled.",
  apple_unavailable: "Sign in with Apple isn't available on this device.",
  network_error: "We couldn't reach the server. Check your connection.",
};

export function authErrorCopy(error: unknown): string {
  const code = error instanceof BackendError ? error.code : "";
  return COPY[code] ?? "Something went wrong. Let's try again.";
}
