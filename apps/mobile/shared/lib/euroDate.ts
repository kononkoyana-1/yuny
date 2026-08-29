/**
 * European date entry: the learner types `dd.mm.yyyy`, the backend stores ISO
 * `yyyy-mm-dd` (`goals.deadline` is a Postgres `date`).
 *
 * The conversion lives here rather than in the screen because a wrong date is
 * a silent, expensive error — a deadline off by months changes every plan the
 * system builds from it — and because `05.11.2026` is 5 November in most of
 * Europe and 11 May in the US. Keeping one parser means the app never has two
 * opinions about which it is.
 */

const EURO_PATTERN = /^(\d{2})\.(\d{2})\.(\d{4})$/;

/** `dd.mm.yyyy` → `yyyy-mm-dd`, or null when the text is not a real date. */
export function euroToIso(input: string): string | null {
  const match = EURO_PATTERN.exec(input.trim());
  if (!match) return null;

  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);

  // `new Date(2026, 1, 31)` silently rolls over to 3 March, so the parsed
  // date is compared back against its parts: a rollover means the input named
  // a day that does not exist.
  const date = new Date(Date.UTC(year, month - 1, day));
  const roundTrips =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  if (!roundTrips) return null;

  return `${yyyy}-${mm}-${dd}`;
}

/** `yyyy-mm-dd` → `dd.mm.yyyy`, for showing a stored deadline back. */
export function isoToEuro(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return iso;
  const [, yyyy, mm, dd] = match;
  return `${dd}.${mm}.${yyyy}`;
}

/**
 * Inserts the dots as the learner types, so they never have to. Digits only;
 * anything else is dropped, which also makes paste from another format
 * behave.
 */
export function formatEuroDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}
