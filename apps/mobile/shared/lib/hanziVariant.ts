/**
 * #65 (today-session.design.md §9, DS5): `HanziText variant="hero"` renders
 * `typography.hanziHero` for 1–2 знака and `typography.hanziHeroLong` for
 * 3+, so a longer word doesn't overflow the hero's fixed scene height.
 *
 * Counts Unicode code points, not UTF-16 units — `"".length` over-counts any
 * character outside the Basic Multilingual Plane (a surrogate pair reads as
 * 2), which matters for rarer hanzi in Extension B and beyond.
 */
export function pickHanziHeroVariant(text: string): "hero" | "heroLong" {
  return [...text].length >= 3 ? "heroLong" : "hero";
}

/**
 * Folder-map word tile (folder-map.design.md §3.3): `hanziTile` for 1–2
 * знака, `hanziTileLong` for 3 (at 30 px they touch the tile's edges), and
 * `hanziInline` in up to two lines for 4+.
 */
export function pickHanziTileVariant(text: string): "tile" | "tileLong" | "inline" {
  const n = [...text].length;
  return n <= 2 ? "tile" : n === 3 ? "tileLong" : "inline";
}
