/**
 * Варианты для упражнений с выбором (#62; vocabulary-engine.md, раздел 3).
 * Выбрать 买 из {买, 桌子, 猫, 红} — не проверка: неверные варианты должны
 * быть правдоподобными. Кандидатов собирает `learning_distractor_pool`
 * (SQL), здесь — выбор, порядок и фильтры. Чистая функция: одинаковый `seed`
 * — одинаковые варианты.
 */
import { usableGloss } from "./gloss.ts";
import type { OptionMeta, WordKey } from "./classify.ts";
import { formatPinyin, parsePinyin, sameSyllables, toneVariants } from "./pinyin.ts";

/** Что показано как вариант: значение (R1, C1), пиньинь (P1) или знак (R3, W1, W2). */
export type OptionKind = "meaning" | "pinyin" | "hanzi";

/**
 * Откуда кандидат, от сильного к слабому:
 * `pair` — пара путаницы пользователя; `shared_char` / `same_sound` — слово
 * его словаря с общим знаком / тем же звучанием; `homophone` / `form` —
 * омофон / слово с общим знаком из словаря; `ai` — кэш «часто путают с»;
 * `user` / `level` — любое своё слово / слово того же уровня HSK.
 */
export type CandidateSource = "pair" | "shared_char" | "same_sound" | "homophone" | "form" | "ai" | "user" | "level";

export interface Candidate extends WordKey {
  /** Русское значение — для вариантов-значений. */
  gloss: string | null;
  source: CandidateSource;
}

export interface PickInput {
  kind: OptionKind;
  target: WordKey & { gloss: string | null };
  candidates: Candidate[];
  /** Сколько неверных вариантов: 3 для «из 4», 5 для «из 6». */
  count: number;
  /** Не брать эти слова (первый круг раунда папки — слова этого же раунда). */
  exclude?: string[];
  seed: number;
}

const ORDER: Record<OptionKind, CandidateSource[]> = {
  meaning: ["pair", "shared_char", "form", "same_sound", "ai", "homophone", "user", "level"],
  pinyin: ["pair", "same_sound", "homophone", "shared_char", "form", "ai", "user", "level"],
  hanzi: ["pair", "form", "shared_char", "same_sound", "homophone", "ai", "user", "level"],
};

/** Сколько вариантов «тот же слог, другой тон» в P1: остальные — чужие чтения. */
const TONE_VARIANTS = 2;

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(xs: T[], rand: () => number): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Значения через «;» и «,» — отдельные термины, в нижнем регистре. */
function terms(gloss: string): string[] {
  return gloss.toLowerCase().replace(/\([^)]*\)/g, "").split(/[;,]/).map((s) => s.trim()).filter(Boolean);
}

/** Синоним правильного значения — нечестный вариант: оба ответа верны. */
export function synonym(a: string, b: string): boolean {
  const ta = terms(a);
  return terms(b).some((t) => ta.includes(t));
}

const firstGloss = (g: string | null) => (g ? g.split(";")[0].trim() : "");

function display(kind: OptionKind, w: WordKey & { gloss: string | null }, candidate = false): string | null {
  if (kind === "hanzi") return w.headword;
  // Правильное значение — перевод ученика как есть; у чужих слов — только годное
  // значение словаря (без «гл.», «вм. …», фамилий и т. п.).
  if (kind === "meaning") return candidate ? usableGloss(w.gloss) : firstGloss(w.gloss) || null;
  const syl = w.reading ? parsePinyin(w.reading) : null;
  return syl ? formatPinyin(syl) : null;
}

function similarity(target: WordKey, c: Candidate): OptionMeta["similarity"] {
  if (c.source === "form" || c.source === "shared_char") return "form";
  if (c.source === "same_sound" || c.source === "homophone") return "sound";
  if (c.source === "pair") {
    if ([...c.headword].some((ch) => target.headword.includes(ch))) return "form";
    if (c.reading && target.reading && sameSyllables(c.reading, target.reading)) return "sound";
  }
  return undefined;
}

/**
 * Варианты вместе с правильным, перемешанные. `null` — правдоподобных
 * кандидатов не хватило: сборщик берёт другой формат.
 */
export function pickOptions(input: PickInput): OptionMeta[] | null {
  const { kind, target, count } = input;
  const rand = rng(input.seed);
  const right = display(kind, target);
  if (!right) return null;

  const exclude = new Set(input.exclude ?? []);
  const seen = new Set([right.toLowerCase()]);
  const picked: OptionMeta[] = [];
  const take = (o: OptionMeta) => {
    const key = o.value.toLowerCase();
    if (picked.length >= count || seen.has(key)) return;
    seen.add(key);
    picked.push(o);
  };

  // P1: сначала тот же слог с другим тоном — это и проверяет пиньинь.
  if (kind === "pinyin" && target.reading) {
    for (const v of shuffle(toneVariants(target.reading), rand).slice(0, TONE_VARIANTS)) {
      take({ value: v, headword: target.headword, reading: v, similarity: "sound" });
    }
  }

  const ok = (c: Candidate) => {
    if (c.headword === target.headword || exclude.has(c.headword)) return false;
    if (kind === "meaning") {
      const g = usableGloss(c.gloss);
      if (!g || !target.gloss || synonym(g, target.gloss)) return false;
    }
    return true;
  };

  for (const source of ORDER[kind]) {
    const group = shuffle(input.candidates.filter((c) => c.source === source && ok(c)), rand);
    for (const c of group) {
      const value = display(kind, c, true);
      if (value) take({ value, headword: c.headword, reading: c.reading, similarity: similarity(target, c) });
    }
    if (picked.length >= count) break;
  }

  if (picked.length < count) return null;
  return shuffle([{ value: right, headword: target.headword, reading: target.reading }, ...picked], rand);
}
