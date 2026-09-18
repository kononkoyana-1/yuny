/**
 * Нарезка слов модуля на уроки (TZ.md §8, §10): урок — пачка до 20 слов и
 * четыре задания к ней. Слов больше двадцати — лишние не выбрасываются, а
 * уходят в следующий урок. Считает сервер (TZ.md §3, правило 1).
 *
 * Здесь только арифметика, без базы, — покрыто тестами в `lessons_test.ts`.
 */

export const MAX_WORDS_PER_LESSON = 20;

/**
 * Пачки поровну, а не «по двадцать и остаток». Жадная нарезка давала бы на
 * 21 слове урок из двадцати слов и урок из одного — второй урок на одно слово
 * не урок. Поровну: 21 → 11 + 10, 45 → 15 + 15 + 15. Число уроков то же
 * самое, `ceil(n / 20)`, и ни одна пачка не больше двадцати.
 *
 * Порядок слов сохраняется — это порядок материала, и соседние слова в нём
 * обычно из одного задания. Первые пачки на слово больше, если поровну не
 * делится.
 */
export function batchWords<T>(words: T[], max = MAX_WORDS_PER_LESSON): T[][] {
  if (words.length === 0) return [];
  const lessons = Math.ceil(words.length / max);
  const base = Math.floor(words.length / lessons);
  const extra = words.length % lessons;

  const batches: T[][] = [];
  let start = 0;
  for (let i = 0; i < lessons; i += 1) {
    const size = base + (i < extra ? 1 : 0);
    batches.push(words.slice(start, start + size));
    start += size;
  }
  return batches;
}
