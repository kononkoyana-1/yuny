/**
 * What `ModuleCircle` shows inside its disc when the server's `cover_text`
 * is `null` (home.design.md §3): the first grapheme of the module's
 * `title`, trimmed and upper-cased.
 *
 * `Array.from` rather than string indexing — `title[0]` would split a
 * surrogate pair (most CJK characters sit above the BMP as an astral code
 * point) into an unpaired half.
 */
export function coverText(title: string): string {
  const trimmed = title.trim();
  const first = Array.from(trimmed)[0] ?? "";
  return first.toLocaleUpperCase("ru");
}
