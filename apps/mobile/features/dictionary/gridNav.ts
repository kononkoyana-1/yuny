/**
 * Клавиши мозаики слов (folder-map.design.md §7): стрелки двигают фокус по
 * сетке с учётом числа колонок, Home / End — к первой и последней плитке.
 * У краёв фокус стоит на месте, а не перескакивает: это карта, а не круг.
 * Вынесено из экрана, чтобы проверять без рендера.
 *
 * Возвращает индекс плитки, куда перевести фокус (у края — тот же `current`:
 * клавиша всё равно наша, страницу она прокручивать не должна), или `null`,
 * если клавиша не про сетку.
 */
export function nextGridIndex(current: number, count: number, columns: number, key: string): number | null {
  if (count <= 0 || columns <= 0) return null;
  const last = count - 1;
  const row = Math.floor(current / columns);
  switch (key) {
    case "ArrowLeft":
      return Math.max(current - 1, 0);
    case "ArrowRight":
      return Math.min(current + 1, last);
    case "ArrowUp":
      return current - columns >= 0 ? current - columns : current;
    case "ArrowDown":
      // Под плиткой пусто (неполный последний ряд) — на последнюю плитку.
      if (current + columns <= last) return current + columns;
      return row < Math.floor(last / columns) ? last : current;
    case "Home":
      return 0;
    case "End":
      return last;
    default:
      return null;
  }
}
