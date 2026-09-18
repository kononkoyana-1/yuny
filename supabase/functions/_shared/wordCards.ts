/**
 * Задание 4 — карточки со словами (TZ.md §8, §9). Единственное задание без ИИ:
 * и собирается, и проверяется оно по словарю.
 *
 * Что здесь решается:
 *   * какое значение из статьи БКРС правильное — то, что подошло по контексту
 *     материала (`meaning_ru` и `sense_hint` из разбора, TZ.md §7);
 *   * какие ответы засчитываются — синонимы этого значения через запятую или
 *     точку с запятой, и только они (TZ.md §9);
 *   * порядок карточек и направление каждой — случайные, но зафиксированные
 *     при генерации: иначе при переоткрытии урока карточки перетасуются.
 *
 * Без базы и сети — покрыто тестами в `wordCards_test.ts`.
 */

/**
 * Значение статьи, как его разложил `scripts/dict-parse.mjs`. Строка с
 * `header: true` — не значение, а заголовок гнезда: часть речи и чтение
 * («гл. dǎ», «piányi»). Ответом она быть не может, но по её чтению видно,
 * к какому произношению относятся значения гнезда.
 */
export interface DictionarySense {
  nest: string | null;
  num: string | null;
  gloss: string;
  header?: boolean | string | null;
}

export interface CardWord {
  /** `module_vocabulary.id` */
  id: string;
  word: string;
  reading: string | null;
  meaning_ru: string;
  sense_hint: string;
  /** Значения статьи БКРС или `null`, если слова в словаре нет. */
  senses: DictionarySense[] | null;
}

export type CardDirection = "zh_ru" | "ru_zh";

/** Что видит экран. Правильных ответов здесь нет. */
export interface CardContent {
  id: string;
  direction: CardDirection;
  /** zh_ru — слово иероглифами; ru_zh — значение по-русски. */
  prompt: string;
  /** Пиньинь под кнопкой (TZ.md §8). Только для zh_ru: в ru_zh он подсказал бы ответ. */
  reading: string | null;
}

/** Что знает только сервер. */
export interface CardKey {
  id: string;
  direction: CardDirection;
  /** Засчитываемые ответы, уже приведённые `normalizeAnswer`. */
  accepted: string[];
  /** Что показать как правильный ответ после проверки. */
  display: string;
}

// ------------------------------------------------------------ нормализация

/**
 * Ответ к виду для сравнения (TZ.md §9): регистр и пробелы по краям не важны,
 * «ё» равна «е», внутренние пробелы схлопываются.
 */
export function normalizeAnswer(text: string): string {
  return text.trim().toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ");
}

/**
 * Значение, которое не перевод, а служебная пометка словаря: «см. 大»,
 * «вм. 大», «только в сочетаниях». Правильным ответом такое быть не может.
 */
const NOT_A_MEANING = /^(\*\s*)?(см\.|вм\.|сокр\.|то же, что|только в сочетаниях|употр\.)/i;

/**
 * Синонимы одного значения. «бить, ударять; колотить; драться» — четыре
 * ответа. Пояснения в скобках к ответу не относятся: «акробатика (в Пекинской
 * опере)» засчитывается как «акробатика».
 */
export function synonyms(gloss: string): string[] {
  if (NOT_A_MEANING.test(gloss.trim())) return [];
  return gloss
    .replace(/\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .split(/[,;]/)
    .map((part) =>
      normalizeAnswer(
        part
          // Помета перед значением — «*» (устар.), «вежл.», «геогр.» — не часть ответа.
          .replace(/^\s*\*\s*/, "")
          .replace(/^\s*(?:[а-яё]{2,7}\.\s*)+/i, "")
          .replace(/[.…:!?]+$/, ""),
      )
    )
    // В значении бывает китайский пример или латиница — ответом это не будет.
    .filter((part) => /[а-я]/.test(part));
}

/** Слова для сравнения: кириллица, без коротких связок, начало слова как основа. */
function stems(text: string): Set<string> {
  return new Set(
    normalizeAnswer(text)
      .split(/[^а-я]+/)
      .filter((w) => w.length >= 3)
      .map((w) => w.slice(0, 5)),
  );
}

/**
 * Какое значение статьи имел в виду материал. Побеждает значение, у которого
 * больше всего общих слов с `meaning_ru` и `sense_hint`; при равенстве —
 * раньше стоящее, словарь ставит частотное первым.
 *
 * Если общих слов нет ни у одного значения, эвристика не знает ответа, и
 * засчитываются все значения статьи. Это мягче, чем угадать первое, и всё ещё
 * внутри статьи — TZ.md §9 запрещает только синонимы вне её.
 */
export function pickSense(
  senses: DictionarySense[],
  meaningRu: string,
  senseHint: string,
  reading: string | null = null,
): { accepted: string[]; display: string } | null {
  const usable = sensesForReading(senses, reading)
    .filter((sense) => !isHeader(sense))
    .map((sense) => ({ gloss: sense.gloss, words: synonyms(sense.gloss) }))
    .filter((sense) => sense.words.length > 0);
  if (usable.length === 0) return null;

  const context = stems(`${meaningRu} ${senseHint}`);
  let best = -1;
  let bestScore = 0;
  usable.forEach((sense, index) => {
    let score = 0;
    for (const stem of stems(sense.gloss)) if (context.has(stem)) score += 1;
    if (score > bestScore) {
      best = index;
      bestScore = score;
    }
  });

  if (best === -1) {
    return {
      accepted: [...new Set(usable.flatMap((s) => s.words))],
      display: usable[0].gloss,
    };
  }
  return { accepted: usable[best].words, display: usable[best].gloss };
}

const isHeader = (sense: DictionarySense) => sense.header === true || sense.header === "true";

/** Чтение с тонами без пробелов: «Dǎ» и «dǎ» — одно, «dǎ» и «dá» — нет. */
const toned = (text: string) => text.normalize("NFC").toLowerCase().replace(/[\s'’·-]/g, "");

/**
 * Значения того гнезда, чей заголовок несёт чтение слова. У 便宜 гнездо I —
 * piányi, «дешёвый», гнездо II — biànyí, «удобный»; разбор дал чтение, и оно
 * выбирает гнездо точнее, чем любое сравнение слов. Нет гнёзд или ни один
 * заголовок не совпал — все значения статьи.
 */
function sensesForReading(senses: DictionarySense[], reading: string | null): DictionarySense[] {
  if (!reading) return senses;
  const wanted = toned(reading);
  const nest = senses.find((sense) =>
    isHeader(sense) &&
    (sense.gloss.match(/[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+/gi) ?? []).some((w) => toned(w) === wanted)
  )?.nest;
  return nest ? senses.filter((sense) => sense.nest === nest) : senses;
}

// ------------------------------------------------------------------ сборка

/** Перемешивание Фишера — Йетса с подставляемым генератором ради тестов. */
function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Карточки урока. Слово без статьи в словаре тоже идёт в карточки: в сторону
 * zh_ru ответом служит значение из разбора — проверить его больше не по чему,
 * а выбросить слово из пачки значило бы потерять его совсем (TZ.md §8).
 */
export function buildCards(
  words: CardWord[],
  random: () => number = Math.random,
): { content: { cards: CardContent[] }; answerKey: { cards: CardKey[] } } {
  const cards: CardContent[] = [];
  const keys: CardKey[] = [];

  for (const word of shuffle(words, random)) {
    const direction: CardDirection = random() < 0.5 ? "zh_ru" : "ru_zh";

    if (direction === "ru_zh") {
      // В обратную сторону сверяется написание, ровно как в словаре (TZ.md §9).
      cards.push({ id: word.id, direction, prompt: word.meaning_ru, reading: null });
      keys.push({
        id: word.id,
        direction,
        accepted: [normalizeAnswer(word.word)],
        display: word.word,
      });
      continue;
    }

    const sense = word.senses
      ? pickSense(word.senses, word.meaning_ru, word.sense_hint, word.reading)
      : null;
    const fallback = synonyms(word.meaning_ru);
    cards.push({ id: word.id, direction, prompt: word.word, reading: word.reading });
    keys.push({
      id: word.id,
      direction,
      accepted: sense?.accepted ??
        (fallback.length > 0 ? fallback : [normalizeAnswer(word.meaning_ru)]),
      display: sense?.display ?? word.meaning_ru,
    });
  }

  return { content: { cards }, answerKey: { cards: keys } };
}
