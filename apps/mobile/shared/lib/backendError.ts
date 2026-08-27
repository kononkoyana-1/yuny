/**
 * The only error type repositories throw. The backend answers failures with
 * `{ error_code }` and nothing else (TZ.md §10 "Error" — the user never sees
 * a code, a stack trace, or anything mentioning an API), so the client keeps
 * the code for logging and lets the screen choose the human copy.
 */
export class BackendError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "BackendError";
  }
}
