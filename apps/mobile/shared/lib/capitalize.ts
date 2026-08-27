/** Capitalizes the first character only — used for display copy, not locale-aware casing. */
export function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
