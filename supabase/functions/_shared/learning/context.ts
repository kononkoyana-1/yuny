/**
 * Предложения со словом (#64, vocabulary-engine.md §7): пишет ИИ, проверяет
 * код. Здесь только чистые функции: проверка ответа модели (нарезка на слова
 * по словарю, целевое слово на месте, длина, пиньинь по словарю, русский
 * перевод, допустимые порядки для плиток), покрытие — все ли слова кроме
 * целевого знакомы пользователю, — уровень пользователя и выбор предложения.
 * Кэш, генерация и запросы — `_shared/contextSentences.ts`.
 */
import type { WordKey } from "./classify.ts";
import { formatPinyin, parsePinyin, type Syllable } from "./pinyin.ts";

/** T1 — коллокация (买票), T2 — простое предложение (我想买咖啡。). T3–T4 — позже. */
export type ContextTier = "T1" | "T2";

export interface ContextSentence {
  /** Строка кэша `context_sentences`; у только что проверенного — `null`. */
  id: string | null;
  tier: ContextTier;
  zh: string;
  /** Пиньинь по словам: слоги сверены со словарём, тоны — знаками. */
  pinyin: string;
  ru: string;
  /** Слова и знаки препинания, как их нарезал код. */
  tokens: string[];
  /** Уровень HSK каждого слова; `null` — вне HSK (или пунктуация, или само слово). */
  tokenLevels: (number | null)[];
  targetIndex: number;
  /** Другие допустимые порядки плиток (без пунктуации) — для сборки фразы (C2). */
  altOrders: string[][];
  /** Самый высокий HSK среди остальных слов; `null` — есть слово вне HSK. */
  hskMax: number | null;
}

/** Словарь для проверки: чтения заголовков (`dictionary_entries`) и уровни HSK (`hsk_words`). */
export interface Lexicon {
  readings: Map<string, string[]>;
  hsk: Map<string, number>;
}

/** Что пользователь знает: слова на «Узнаю» и выше и уровень по его словарю. */
export interface KnownWords {
  words: Set<string>;
  /** 0 — данных нет: годятся только его слова и белый список. */
  level: number;
}

/**
 * Белый список: частотные слова HSK1 — местоимения, частицы, связки, счёт,
 * самые частые глаголы. Без них ни одной фразы не сложить, а добавлять их в
 * словарь никто не станет (vocabulary-engine.md, приложение B, п. 4).
 */
export const FUNCTION_WORDS: ReadonlySet<string> = new Set([
  "的", "了", "是", "不", "没", "很", "也", "都", "就", "还", "吗", "呢", "吧", "啊",
  "在", "有", "和", "这", "那", "哪", "个", "些", "一", "两",
  "我", "你", "他", "她", "我们", "你们", "他们", "这个", "那个", "这儿", "那儿", "什么", "谁",
  "要", "想", "会", "能", "去", "来", "说", "看", "好", "太", "多", "大", "小",
]);

/** Длина в иероглифах по тиру: коллокация и короткое предложение. */
export const TIER_LENGTH: Record<ContextTier, [number, number]> = { T1: [2, 4], T2: [4, 12] };

/** Сколько предложений на слово просим у модели за раз: T1 и T2. */
export const BATCH_COUNT: Record<ContextTier, number> = { T1: 4, T2: 8 };

/** Самое длинное слово словаря, которое пробуем при нарезке. */
const MAX_WORD = 4;
const MAX_RU = 140;
const MAX_ALT = 4;
/** Порог уровня: слов уровня у пользователя не меньше стольких, и из них знакомы ≥ 60%. */
const LEVEL_MIN_WORDS = 5;
const LEVEL_SHARE = 0.6;

const HAN = /\p{Script=Han}/u;
const CYRILLIC = /[А-Яа-яЁё]/;
/** Знаки препинания, которые могут стоять во фразе, — отдельными «словами». */
const PUNCT = /[。，！？、；：“”‘’「」《》（）…—,.!?;:"'()]/;
const PUNCT_ASCII: Record<string, string> = { "。": ".", "，": ",", "！": "!", "？": "?", "、": ",", "；": ";", "：": ":", "…": "…" };

const isPunct = (t: string) => [...t].every((c) => PUNCT.test(c));
const hanCount = (t: string) => [...t].filter((c) => HAN.test(c)).length;

/**
 * Смысл, в котором слово учится, — ключ кэша: первое значение перевода
 * пользователя, в нижнем регистре. «Покупать; купить» и «покупать» — одно.
 */
export function senseKey(translation: string | null): string {
  const first = (translation ?? "").split(/[;,]/)[0] ?? "";
  return first.toLowerCase().replace(/[.!?…]+$/u, "").replace(/\s+/g, " ").trim().slice(0, 80);
}

/**
 * Нарезка прямым максимальным сопоставлением: на каждой позиции — самое
 * длинное слово из словаря (до 4 знаков), иначе один знак. Пунктуация —
 * отдельными токенами.
 */
export function maxMatch(text: string, has: (w: string) => boolean): string[] {
  const chars = [...text];
  const out: string[] = [];
  let i = 0;
  while (i < chars.length) {
    if (!HAN.test(chars[i])) {
      out.push(chars[i]);
      i++;
      continue;
    }
    let taken = 1;
    for (let len = Math.min(MAX_WORD, chars.length - i); len > 1; len--) {
      const w = chars.slice(i, i + len).join("");
      if ([...w].every((c) => HAN.test(c)) && has(w)) {
        taken = len;
        break;
      }
    }
    out.push(chars.slice(i, i + taken).join(""));
    i += taken;
  }
  return out;
}

/** Делится ли слово целиком на слова из набора (我想 → 我 + 想). */
function splits(word: string, ok: (w: string) => boolean): boolean {
  const chars = [...word];
  const reach = [true, ...chars.map(() => false)];
  for (let i = 0; i < chars.length; i++) {
    if (!reach[i]) continue;
    for (let j = i + 1; j <= chars.length; j++) {
      if (ok(chars.slice(i, j).join(""))) reach[j] = true;
    }
  }
  return reach[chars.length];
}

/** Уровень HSK слова: само слово, иначе самый высокий из частей; не делится на слова HSK — `null`. */
function levelOf(word: string, hsk: Map<string, number>): number | null {
  const own = hsk.get(word);
  if (own !== undefined) return own;
  const chars = [...word];
  // Минимальный наихудший уровень по разбиениям — динамикой по позициям.
  const best: (number | null)[] = [0, ...chars.map(() => null)];
  for (let i = 0; i < chars.length; i++) {
    if (best[i] === null) continue;
    for (let j = i + 1; j <= chars.length; j++) {
      const l = hsk.get(chars.slice(i, j).join(""));
      if (l === undefined) continue;
      const v = Math.max(best[i]!, l);
      if (best[j] === null || v < best[j]!) best[j] = v;
    }
  }
  return best[chars.length];
}

/** Первое чтение из словарного «hǎo, hào». */
function readingsOf(reading: string | null): Syllable[][] {
  return (reading ?? "").split(/[,;]/).map((r) => parsePinyin(r.trim())).filter((s): s is Syllable[] => !!s);
}

/** Тот же слог; лёгкий тон в сочетании допустим (东西 dōngxi). */
const sameSyllable = (x: Syllable, y: Syllable) => x.base === y.base && (x.tone === y.tone || x.tone === 5 || y.tone === 5);

/**
 * Где в фразе целевое слово: по нарезке модели (`tokens` + `target_index`),
 * а если она не сходится с текстом — единственное вхождение. Два вхождения
 * без разметки — неизвестно, которое спрашивать: отказ.
 */
function targetAt(zh: string, headword: string, tokens: unknown, index: unknown): number {
  if (Array.isArray(tokens) && Number.isInteger(index) && tokens.every((t) => typeof t === "string")) {
    const i = index as number;
    if ((tokens[i] as string | undefined)?.trim() === headword) {
      const before = (tokens as string[]).slice(0, i).join("").replace(/\s+/g, "");
      if (zh.slice(before.length, before.length + headword.length) === headword) return before.length;
    }
  }
  const first = zh.indexOf(headword);
  return first >= 0 && zh.indexOf(headword, first + 1) < 0 ? first : -1;
}

/**
 * Слово поглощено более длинным словом HSK: 学 внутри 学校, 天 внутри 今天 —
 * такая фраза учит другое слово.
 */
function swallowed(zh: string, at: number, headword: string, hsk: Map<string, number>): boolean {
  const end = at + headword.length;
  for (let s = Math.max(0, at - MAX_WORD + 1); s <= at; s++) {
    for (let e = end; e <= Math.min(zh.length, s + MAX_WORD); e++) {
      if (e - s > headword.length && hsk.has(zh.slice(s, e))) return true;
    }
  }
  return false;
}

/**
 * Все порядки из `raw`, которые складываются из тех же плиток: модель режет
 * по-своему, поэтому порядок сверяется по тексту, а не по её словам.
 */
function altOrdersOf(raw: unknown, tiles: string[]): string[][] {
  if (!Array.isArray(raw)) return [];
  const main = tiles.join("\u0000");
  const seen = new Set([main]);
  const out: string[][] = [];
  for (const alt of raw.slice(0, 8)) {
    if (!Array.isArray(alt) || !alt.every((t) => typeof t === "string")) continue;
    const text = [...alt.join("")].filter((c) => HAN.test(c)).join("");
    const used = tiles.map(() => false);
    const order: string[] = [];
    const walk = (pos: number): boolean => {
      if (pos === text.length) return order.length === tiles.length;
      for (let i = 0; i < tiles.length; i++) {
        if (used[i] || !text.startsWith(tiles[i], pos)) continue;
        used[i] = true;
        order.push(tiles[i]);
        if (walk(pos + tiles[i].length)) return true;
        used[i] = false;
        order.pop();
      }
      return false;
    };
    if (!walk(0)) continue;
    const key = order.join("\u0000");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push([...order]);
    if (out.length >= MAX_ALT) break;
  }
  return out;
}

/**
 * Одно предложение от модели → проверенное или `null`:
 * - только иероглифы и пунктуация, длина в пределах тира (T1 — без пунктуации);
 * - целевое слово на месте и не поглощено словом HSK;
 * - нарезка по словарю (`dictionary_entries` + `hsk_words`), каждое слово в нём есть;
 * - пиньинь — по слогу на знак, у целевого слова — его чтение, у остальных — одно из словарных;
 * - `ru` — по-русски.
 */
export function checkSentence(raw: unknown, word: WordKey, tier: ContextTier, lexicon: Lexicon): ContextSentence | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.zh !== "string" || typeof r.pinyin !== "string" || typeof r.ru !== "string") return null;
  const zh = r.zh.replace(/\s+/g, "");
  if (![...zh].every((c) => HAN.test(c) || PUNCT.test(c))) return null;
  const [min, max] = TIER_LENGTH[tier];
  const n = hanCount(zh);
  if (n < min || n > max || n <= hanCount(word.headword)) return null;
  if (tier === "T1" && n !== [...zh].length) return null;

  const at = targetAt(zh, word.headword, r.tokens, r.target_index);
  if (at < 0 || swallowed(zh, at, word.headword, lexicon.hsk)) return null;

  const has = (w: string) => lexicon.readings.has(w) || lexicon.hsk.has(w);
  // Статья БКРС, которая целиком делится на слова HSK (我想, 买东西), — это
  // сочетание, а не слово: режем на слова, так понятнее и плиток больше.
  const isWord = (w: string) => lexicon.hsk.has(w) || (lexicon.readings.has(w) && levelOf(w, lexicon.hsk) === null);
  const left = maxMatch(zh.slice(0, at), isWord);
  const right = maxMatch(zh.slice(at + word.headword.length), isWord);
  const tokens = [...left, word.headword, ...right];
  const targetIndex = left.length;
  if (tokens.some((t, i) => i !== targetIndex && !isPunct(t) && !has(t))) return null;

  // Пиньинь: по слогу на каждый знак, по словам — сверка со словарём.
  const syllables = parsePinyin(r.pinyin.replace(/[^\p{L}\d\s'’-]/gu, " "));
  if (!syllables || syllables.length !== n) return null;
  const parts: string[] = [];
  let pos = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (isPunct(t)) {
      if (parts.length && PUNCT_ASCII[t]) parts[parts.length - 1] += PUNCT_ASCII[t];
      continue;
    }
    const own = syllables.slice(pos, pos + hanCount(t));
    pos += own.length;
    const dict = i === targetIndex ? readingsOf(word.reading).slice(0, 1) : readingsOf((lexicon.readings.get(t) ?? []).join(","));
    const fits = (d: Syllable[]) =>
      d.length === own.length && d.every((s, k) => i === targetIndex ? sameSyllable(s, own[k]) : s.base === own[k].base);
    // Слово только из HSK, без статьи со чтением, — не с чем сверить; у целевого без чтения — тоже.
    if (dict.length && !dict.some(fits)) return null;
    parts.push(formatPinyin(own));
  }

  const ru = r.ru.trim();
  if (!CYRILLIC.test(ru) || HAN.test(ru) || ru.length > MAX_RU) return null;

  const tokenLevels = tokens.map((t, i) => (i === targetIndex || isPunct(t) ? null : levelOf(t, lexicon.hsk)));
  const others = tokens.filter((t, i) => i !== targetIndex && !isPunct(t));
  const levels = others.map((t) => (FUNCTION_WORDS.has(t) ? lexicon.hsk.get(t) ?? 1 : levelOf(t, lexicon.hsk)));
  const tiles = tokens.filter((t) => !isPunct(t));
  return {
    id: null,
    tier,
    zh,
    pinyin: parts.join(" "),
    ru,
    tokens,
    tokenLevels,
    targetIndex,
    altOrders: altOrdersOf(r.alt_orders, tiles),
    hskMax: levels.some((l) => l === null) ? null : Math.max(...(levels as number[])),
  };
}

/** Ответ модели целиком: годные предложения, без повторов, не больше заказанного на тир. */
export function checkBatch(raw: unknown, word: WordKey, lexicon: Lexicon): ContextSentence[] {
  const items = (raw as { items?: unknown })?.items;
  if (!Array.isArray(items)) return [];
  const out: ContextSentence[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const tier = (item as { tier?: unknown })?.tier;
    if (tier !== "T1" && tier !== "T2") continue;
    if (out.filter((s) => s.tier === tier).length >= BATCH_COUNT[tier] + 2) continue;
    const s = checkSentence(item, word, tier, lexicon);
    if (!s || seen.has(s.zh)) continue;
    seen.add(s.zh);
    out.push(s);
  }
  return out;
}

// ---------------------------------------------------------------- покрытие

/**
 * Слова, которых пользователь не знает: всё, кроме целевого слова,
 * пунктуации, белого списка, его слов на «Узнаю» и выше и слов HSK не выше
 * его уровня. Слово, которое делится на знакомые (我想 → 我 + 想), — знакомо.
 */
export function unknownWords(s: ContextSentence, known: KnownWords): string[] {
  const ok = (w: string) => FUNCTION_WORDS.has(w) || known.words.has(w);
  return s.tokens.filter((t, i) => {
    if (i === s.targetIndex || isPunct(t) || ok(t)) return false;
    const level = s.tokenLevels[i];
    if (level != null && known.level > 0 && level <= known.level) return false;
    return !splits(t, ok);
  });
}

export const covered = (s: ContextSentence, known: KnownWords) => unknownWords(s, known).length === 0;

/**
 * Уровень пользователя — по его словарю, не самооценка: самый высокий
 * уровень HSK, слов которого у него хотя бы 5 и из них ≥ 60% на «Узнаю» и
 * выше. Уровень, где слов меньше 5, не решает ни за, ни против; первый
 * проваленный — дальше не смотрим.
 */
export function userLevel(words: { hskLevel: number | null; known: boolean }[]): number {
  let level = 0;
  for (let l = 1; l <= 6; l++) {
    const at = words.filter((w) => w.hskLevel === l);
    const k = at.filter((w) => w.known).length;
    if (at.length < LEVEL_MIN_WORDS) continue;
    if (k / at.length < LEVEL_SHARE) break;
    level = l;
  }
  return level;
}

/** «Узнаю» — стабильность «Читаю» от 3 дней (vocabulary-engine.md §1, §7). */
const KNOWN_READ = 3;

/**
 * Что знает пользователь — по его памяти: слова, у которых «Читаю» держится
 * от 3 дней, и уровень по ним. `list` — те же слова для промпта, самые
 * устойчивые первыми, не больше 150 (длинный список модель не держит).
 */
export function knownWords(
  lexemes: { id: string; headword: string; hskLevel: number | null }[],
  states: Record<string, { read?: { stability: number } } | undefined>,
): KnownWords & { list: string[] } {
  const read = (id: string) => states[id]?.read?.stability ?? 0;
  const known = lexemes.filter((l) => read(l.id) >= KNOWN_READ);
  return {
    words: new Set(known.map((l) => l.headword)),
    level: userLevel(lexemes.map((l) => ({ hskLevel: l.hskLevel, known: read(l.id) >= KNOWN_READ }))),
    list: [...new Set([...known].sort((a, b) => read(b.id) - read(a.id)).map((l) => l.headword))].slice(0, 150),
  };
}

/** Плитки для сборки фразы: слова без пунктуации. */
export const sentenceTiles = (s: ContextSentence) => s.tokens.filter((t) => !isPunct(t));

export type ContextUse = "example" | "C1" | "C2";

/** Годится ли предложение для задачи: C2 — предложение (T2) из 3+ плиток. */
export function fitsUse(s: ContextSentence, use: ContextUse): boolean {
  if (use === "C2") return s.tier === "T2" && sentenceTiles(s).length >= 3;
  return true;
}

/**
 * Предложение для задачи: только покрытые; для примера и C1 — сперва
 * предложения (T2), потом коллокации; недавно показанные (`avoid`) — в
 * последнюю очередь. Выбор среди равных — по `seed`.
 */
export function pickSentence(
  list: ContextSentence[],
  opts: { use: ContextUse; known: KnownWords; seed: number; avoid?: ReadonlySet<string> },
): ContextSentence | null {
  const ok = list.filter((s) => fitsUse(s, opts.use) && covered(s, opts.known));
  if (!ok.length) return null;
  const score = (s: ContextSentence) => (s.tier === "T2" ? 0 : 2) + (s.id && opts.avoid?.has(s.id) ? 1 : 0);
  const best = Math.min(...ok.map(score));
  const top = ok.filter((s) => score(s) === best);
  return top[Math.abs(opts.seed) % top.length];
}

/** Строка кэша → предложение; битая строка — `null`. */
export function readSentence(row: Record<string, unknown>): ContextSentence | null {
  const tokens = row.tokens;
  const levels = row.token_levels;
  const index = row.target_index;
  if (!Array.isArray(tokens) || !tokens.every((t) => typeof t === "string")) return null;
  if (!Array.isArray(levels) || levels.length !== tokens.length) return null;
  if (typeof index !== "number" || index < 0 || index >= tokens.length) return null;
  if (row.tier !== "T1" && row.tier !== "T2") return null;
  const alt = Array.isArray(row.alt_orders)
    ? (row.alt_orders as unknown[]).filter((o): o is string[] => Array.isArray(o) && o.every((t) => typeof t === "string"))
    : [];
  return {
    id: typeof row.id === "string" ? row.id : null,
    tier: row.tier,
    zh: String(row.zh ?? ""),
    pinyin: String(row.pinyin ?? ""),
    ru: String(row.ru ?? ""),
    tokens,
    tokenLevels: levels.map((l) => (typeof l === "number" ? l : null)),
    targetIndex: index,
    altOrders: alt,
    hskMax: typeof row.hsk_max === "number" ? row.hsk_max : null,
  };
}
