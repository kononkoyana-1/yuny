/**
 * Whole calendar days between today and an ISO date (e.g. `goals.deadline`).
 * Pure date arithmetic on a value the backend already computed and sent —
 * not the kind of educational-state derivation TZ.md §3 Rule 1 forbids
 * (readiness, progress, feasibility). Rounds to the nearest day so a
 * same-day deadline reads as 0, not -0.4.
 */
export function daysUntil(isoDate: string): number {
  const deadline = new Date(`${isoDate}T00:00:00`);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = deadline.getTime() - startOfToday.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/** Home's "94 days left" style label (MVP Spec §12 worked example). */
export function formatDaysLeft(isoDate: string): string {
  const days = daysUntil(isoDate);
  if (days > 1) return `${days} days left`;
  if (days === 1) return "1 day left";
  if (days === 0) return "Due today";
  return "Deadline passed";
}
