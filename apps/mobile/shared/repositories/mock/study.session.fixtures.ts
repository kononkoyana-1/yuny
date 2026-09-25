import { StudySessionSchema, type Exercise, type StudySession } from "@yuny/shared";
import { uuid } from "@/shared/lib/uuid";

/**
 * Mock-сессия (#67): по заданию на каждый формат экрана упражнений
 * (exercise.design.md §4), слова из пути 买 (vocabulary-engine.md §11).
 * Ключи ответа — как у сервера; ошибка на R1 «продавать» — путаница с 卖,
 * она приводит карточку пары.
 */

const MAI = { headword: "买", reading: "mǎi", tone_label: "3-й тон", translation: "покупать" };
const MAI4 = { headword: "卖", reading: "mài", tone_label: "4-й тон", translation: "продавать" };
const GUI = { headword: "贵", reading: "guì", tone_label: "4-й тон", translation: "дорогой" };
const PIANYI = { headword: "便宜", reading: "piányi", tone_label: "2-й + лёгкий", translation: "дешёвый" };

let seq = 0;
const id = (code: string) => `mock.${code}.${++seq}`;

const base = (code: Exercise["code"], lexeme: Exercise["lexeme"], portion: number): Exercise => ({
  task_id: id(code),
  code,
  lexeme,
  is_retry: false,
  portion,
});

export function introMai(portion = 0): Exercise {
  return {
    ...base("intro", MAI, portion),
    intro: {
      example: { zh: "我想买咖啡。", pinyin: "wǒ xiǎng mǎi kāfēi", ru: "Я хочу купить кофе." },
      char_notes: [{ char: "买", known_in: ["买东西", "买单"] }],
      actions: "ok",
    },
  };
}

export function r1(word: "mai" | "mai4", portion = 0, retry = false): Exercise {
  const lexeme = word === "mai" ? MAI : MAI4;
  const options = [
    { id: "o0", text: "покупать", kind: "ru" as const, a11y: "покупать" },
    { id: "o1", text: "продавать", kind: "ru" as const, a11y: "продавать" },
    { id: "o2", text: "дешёвый", kind: "ru" as const, a11y: "дешёвый" },
    { id: "o3", text: "пакет", kind: "ru" as const, a11y: "пакет" },
  ];
  return { ...base("R1", lexeme, portion), options, key: { option_id: word === "mai" ? "o0" : "o1" }, is_retry: retry };
}

function p1Gui(portion: number): Exercise {
  return {
    ...base("P1", GUI, portion),
    options: [
      { id: "o0", text: "guī", kind: "pinyin", a11y: "guī, первый тон" },
      { id: "o1", text: "guì", kind: "pinyin", a11y: "guì, четвёртый тон" },
      { id: "o2", text: "kuì", kind: "pinyin", a11y: "kuì, четвёртый тон" },
      { id: "o3", text: "huì", kind: "pinyin", a11y: "huì, четвёртый тон" },
    ],
    key: { option_id: "o1" },
  };
}

function r2Pianyi(portion: number): Exercise {
  return base("R2", PIANYI, portion);
}

const HANZI_OPTIONS = ["买", "卖", "实", "头", "贵", "读"].map((text, i) => ({
  id: `o${i}`,
  text,
  kind: "hanzi" as const,
  a11y: text,
}));

function w(code: "W1" | "W2", lexeme: typeof MAI4 | typeof GUI, portion: number): Exercise {
  const right = HANZI_OPTIONS.find((o) => o.text === lexeme.headword)!;
  return { ...base(code, lexeme, portion), options: HANZI_OPTIONS, key: { option_id: right.id } };
}

function p2Mai(portion: number): Exercise {
  return { ...base("P2", MAI, portion), key: { pinyin: "mai3" } };
}

function c1Mai(portion: number): Exercise {
  return {
    ...base("C1", MAI, portion),
    sentence: { tokens: ["我", "想", "", "咖啡", "。"], blank_index: 2, ru: "Я хочу купить кофе." },
    options: ["买", "卖", "喝", "去"].map((text, i) => ({ id: `o${i}`, text, kind: "hanzi" as const, a11y: text })),
    key: { option_id: "o0" },
  };
}

function c2Gui(portion: number): Exercise {
  const tokens = ["这个", "太", "贵", "了", "我", "不", "买"];
  const shuffled = [4, 2, 6, 0, 5, 3, 1];
  return {
    ...base("C2", GUI, portion),
    sentence: { tokens: [], blank_index: null, ru: "Это слишком дорого, я не куплю." },
    tiles: shuffled.map((i) => ({ id: `t${i}`, text: tokens[i]! })),
    key: { tokens },
  };
}

export function pairCard(): Exercise {
  return {
    ...base("pair_card", null, 0),
    pair: {
      a: { headword: "买", reading: "mǎi", tone_label: "3-й тон", meaning: "покупать" },
      b: { headword: "卖", reading: "mài", tone_label: "4-й тон", meaning: "продавать" },
      // Строка разбора и подсказка — из данных о знаках (#74); пока их нет, как на сервере.
      difference: null,
      mnemonic: null,
      collocations: ["买东西", "卖东西"],
      collocation_notes: [
        { zh: "买东西", pinyin: "mǎi dōngxi", ru: "покупать вещи" },
        { zh: "卖东西", pinyin: "mài dōngxi", ru: "продавать вещи" },
      ],
    },
  };
}

/** Блок различения после карточки: 4 задания, правильный ответ то 卖, то 买. */
export function pairTasks(): Exercise[] {
  return [r1("mai4"), r1("mai"), r1("mai"), w("W1", MAI4, 0)];
}

export function mockStudySession(
  kind: { mode: "today" | "folder"; folder_mode: "review" | "new" | "practice" | null } = { mode: "today", folder_mode: null },
): StudySession {
  const exercises = [
    introMai(0),
    r1("mai", 0),
    p1Gui(0),
    r2Pianyi(0),
    w("W1", MAI4, 0),
    p2Mai(1),
    w("W2", GUI, 1),
    c1Mai(1),
    c2Gui(1),
  ];
  return StudySessionSchema.parse({
    // Каждый заход — своё занятие, как у сервера («Ещё 7» не должно вернуть прошлое).
    session_id: uuid(),
    mode: kind.mode,
    folder_mode: kind.folder_mode,
    exercises,
    portions: [5, 4],
    stats: { budget: 40, due_now: 26, new_quota: 5, new_taken: 1, reason: null, due_tomorrow: 30 },
  });
}
