import type { CharWord } from "@yuny/shared";

/** Лучей в графе знака (#84): на 390 px больше не читается; остальное — списком «ещё N». */
export const GRAPH_RAYS = 12;

/**
 * Раскладка графа по сторонам: первые `GRAPH_RAYS` слов (порядок сервера —
 * свои, HSK, остальные) — лучами, слева те, где знак в конце, справа — в
 * начале и в середине. Хвост — списком.
 */
export function graphSides(words: CharWord[], rays = GRAPH_RAYS) {
  const shown = words.slice(0, rays);
  return {
    left: shown.filter((w) => w.position === "end"),
    right: shown.filter((w) => w.position !== "end"),
    rest: words.slice(rays),
  };
}
