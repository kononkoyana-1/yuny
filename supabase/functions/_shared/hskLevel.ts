/**
 * Сложность сгенерированного текста против уровня ученика (TZ.md §4, #22).
 *
 * Промпт просит держаться уровня HSK, но промпт — пожелание. Здесь проверка:
 * текст режется на слова, каждое слово сверяется со списком HSK и словами
 * самого материала, и если слов выше уровня слишком много, генерация
 * отклоняется и повторяется.
 *
 * Без базы и сети — покрыто тестами в `hskLevel_test.ts`.
 */

/** Самое длинное слово HSK 2.0 — четыре знака (一路平安, 实事求是). */
const MAX_WORD = 4;

const HANZI = /[一-鿿]/;

/**
 * Доля слов выше уровня, после которой текст считается слишком сложным.
 *
 * Стартовая цифра, а не выведенная: в тексте на 200–300 знаков это 3–5 слов
 * на полсотни. Подстраивать по живым генерациям — смотреть `offenders` у
 * отклонённых текстов.
 */
export const MAX_ABOVE_LEVEL_SHARE = 0.1;

/**
 * Слова текста прямым максимальным сопоставлением: на каждой позиции берётся
 * самое длинное слово из словаря, иначе один знак. Сегментатор простой, но
 * вопрос здесь не «как правильно разбить», а «много ли тут чужой лексики», и
 * для него хватает. Не-китайское (пунктуация, цифры, латиница) пропускается.
 */
export function segment(text: string, lexicon: Set<string>): string[] {
  const chars = [...text];
  const words: string[] = [];
  let i = 0;
  while (i < chars.length) {
    if (!HANZI.test(chars[i])) {
      i += 1;
      continue;
    }
    let taken = 1;
    for (let len = Math.min(MAX_WORD, chars.length - i); len > 1; len -= 1) {
      const candidate = chars.slice(i, i + len).join("");
      if (lexicon.has(candidate)) {
        taken = len;
        break;
      }
    }
    words.push(chars.slice(i, i + taken).join(""));
    i += taken;
  }
  return words;
}

export interface LevelReport {
  /** Всего китайских слов в тексте. */
  total: number;
  /** Слов выше уровня ученика — по списку HSK или вовсе вне его. */
  above: number;
  share: number;
  /** Сами слова выше уровня, без повторов, — чтобы было что подстраивать. */
  offenders: string[];
}

/**
 * Сколько в тексте слов выше уровня.
 *
 * Слово в норме, если оно из материала ученика (TZ.md §4: «плюс слова из его
 * материала») или из HSK его уровня и ниже. Знак, который не вошёл ни в одно
 * слово словаря и сам не слово HSK, тоже считается «выше»: у ученика HSK 2
 * такой знак почти наверняка не из его лексики.
 */
export function levelReport(
  text: string,
  hsk: Map<string, number>,
  materialWords: Set<string>,
  userLevel: number,
): LevelReport {
  const lexicon = new Set<string>([...hsk.keys(), ...materialWords]);
  const words = segment(text, lexicon);
  const offenders = new Set<string>();
  let above = 0;

  for (const word of words) {
    if (materialWords.has(word)) continue;
    const level = hsk.get(word);
    if (level !== undefined && level <= userLevel) continue;
    above += 1;
    offenders.add(word);
  }

  return {
    total: words.length,
    above,
    share: words.length === 0 ? 0 : above / words.length,
    offenders: [...offenders],
  };
}

export function withinLevel(report: LevelReport, maxShare = MAX_ABOVE_LEVEL_SHARE): boolean {
  return report.share <= maxShare;
}
