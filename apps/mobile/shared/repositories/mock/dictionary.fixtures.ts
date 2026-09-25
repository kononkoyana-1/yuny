import type { DictionaryEntry } from "@yuny/shared";

/**
 * Несколько статей БКРС в том виде, в каком их отдаёт `dictionary-search`:
 * `senses` разложены `scripts/dict-parse.mjs`, `compact` — до шести значений
 * без служебных рубрик. `rank` здесь не хранится — его ставит поиск.
 *
 * 打 и 好 — статьи с гнёздами (`nest` + `header: true`), остальные плоские, как
 * у 96% словаря.
 */
export const mockDictionary: Omit<DictionaryEntry, "rank">[] = [
  {
    id: 101,
    headword: "好",
    reading: "hǎo, hào",
    senses: [
      { nest: "I", num: null, gloss: "прил. hǎo", header: true },
      { nest: "I", num: "1", gloss: "хороший, добрый, прекрасный" },
      { nest: "I", num: "2", gloss: "здоровый, в порядке; выздороветь" },
      { nest: "I", num: "3", gloss: "дружный, близкий; дружить" },
      { nest: "I", num: "4", gloss: "легко, удобно (перед глаголом)" },
      { nest: "II", num: null, gloss: "нареч. hǎo", header: true },
      { nest: "II", num: "1", gloss: "очень, весьма, совсем" },
      { nest: "II", num: "2", gloss: "ладно, хорошо (выражает согласие)" },
      { nest: "III", num: null, gloss: "гл. hào", header: true },
      { nest: "III", num: "1", gloss: "любить, увлекаться" },
      { nest: "III", num: "2", gloss: "быть склонным к, часто (делать что-л.)" },
    ],
    compact: ["хороший, добрый, прекрасный", "здоровый, в порядке", "очень, весьма", "любить, увлекаться"],
    hsk_level: 1,
  },
  {
    id: 102,
    headword: "你好",
    reading: "nǐhǎo",
    senses: [{ nest: null, num: null, gloss: "здравствуй!, здравствуйте!" }],
    compact: ["здравствуй!, здравствуйте!"],
    hsk_level: 1,
  },
  {
    id: 103,
    headword: "好吃",
    reading: "hǎochī",
    senses: [
      { nest: null, num: "1", gloss: "вкусный" },
      { nest: null, num: "2", gloss: "легко есть, удобный для еды" },
    ],
    compact: ["вкусный", "легко есть, удобный для еды"],
    hsk_level: 2,
  },
  {
    id: 104,
    headword: "打",
    reading: "dǎ, dá",
    senses: [
      { nest: "I", num: null, gloss: "гл. dǎ", header: true },
      { nest: "I", num: "1", gloss: "бить, ударять; стучать" },
      { nest: "I", num: "2", gloss: "играть (в мяч, карты)" },
      { nest: "I", num: "3", gloss: "звонить (по телефону)" },
      { nest: "I", num: "4", gloss: "открывать, раскрывать (зонт)" },
      { nest: "II", num: null, gloss: "предлог dǎ", header: true },
      { nest: "II", num: null, gloss: "от, с, из (о месте и времени)" },
      { nest: "III", num: null, gloss: "сущ. dá", header: true },
      { nest: "III", num: null, gloss: "дюжина" },
    ],
    compact: ["бить, ударять", "играть (в мяч, карты)", "звонить (по телефону)", "дюжина"],
    hsk_level: 1,
  },
  {
    id: 105,
    headword: "打电话",
    reading: "dǎ diànhuà",
    senses: [{ nest: null, num: null, gloss: "звонить по телефону" }],
    compact: ["звонить по телефону"],
    hsk_level: 1,
  },
  {
    id: 106,
    headword: "学习",
    reading: "xuéxí",
    senses: [
      { nest: null, num: "1", gloss: "учиться, изучать; учёба" },
      { nest: null, num: "2", gloss: "перенимать (опыт), брать пример" },
    ],
    compact: ["учиться, изучать; учёба", "перенимать (опыт), брать пример"],
    hsk_level: 1,
  },
  {
    id: 107,
    headword: "学生",
    reading: "xuésheng",
    senses: [{ nest: null, num: null, gloss: "учащийся, ученик, студент" }],
    compact: ["учащийся, ученик, студент"],
    hsk_level: 1,
  },
  {
    id: 108,
    headword: "便宜",
    reading: "piányi, biànyí",
    senses: [
      { nest: "I", num: null, gloss: "piányi", header: true },
      { nest: "I", num: "1", gloss: "дешёвый, недорогой" },
      { nest: "I", num: "2", gloss: "выгода; поблажка; дать поблажку" },
      { nest: "II", num: null, gloss: "biànyí", header: true },
      { nest: "II", num: null, gloss: "удобный, подходящий; целесообразный" },
    ],
    compact: ["дешёвый, недорогой", "выгода; поблажка", "удобный, подходящий"],
    hsk_level: 2,
  },
  {
    id: 109,
    headword: "把握",
    reading: "bǎwò",
    senses: [
      { nest: null, num: "1", gloss: "держать в руках, крепко держать" },
      { nest: null, num: "2", gloss: "уверенность; быть уверенным" },
      { nest: null, num: "3", gloss: "ухватить, не упустить (момент)" },
    ],
    compact: ["держать в руках", "уверенность; быть уверенным", "ухватить, не упустить (момент)"],
    hsk_level: 4,
  },
  {
    id: 201,
    headword: "商店",
    reading: "shāngdiàn",
    senses: [{ nest: null, num: null, gloss: "магазин, лавка" }],
    compact: ["магазин, лавка"],
    hsk_level: 1,
  },
  {
    id: 202,
    headword: "买",
    reading: "mǎi",
    senses: [
      { nest: null, num: "1", gloss: "покупать, купить" },
      { nest: null, num: "2", gloss: "подкупать" },
    ],
    compact: ["покупать, купить", "подкупать"],
    hsk_level: 1,
  },
  {
    id: 203,
    headword: "多少钱",
    reading: "duōshao qián",
    senses: [{ nest: null, num: null, gloss: "сколько стоит?, почём?" }],
    compact: ["сколько стоит?, почём?"],
    hsk_level: 1,
  },
  {
    id: 110,
    headword: "上海",
    reading: "Shànghǎi",
    senses: [{ nest: null, num: null, gloss: "Шанхай (город)" }],
    compact: ["Шанхай (город)"],
    hsk_level: null,
  },
  // Знаки и слова для состава слова (#79) и графа знака (#84).
  ...[
    flat(301, "电", "diàn", ["электричество; электрический", "молния", "телеграмма"], 1),
    flat(302, "脑", "nǎo", ["мозг; голова", "ум, разум"], null),
    flat(303, "电脑", "diànnǎo", ["компьютер", "электронный мозг"], 1),
    flat(304, "电话", "diànhuà", ["телефон; телефонный звонок"], 1),
    flat(305, "话", "huà", ["речь, слова; язык", "говорить"], 1),
    flat(306, "电影", "diànyǐng", ["кино, кинофильм"], 1),
    flat(307, "看", "kàn, kān", ["смотреть, глядеть", "читать (про себя)", "навещать", "присматривать"], 1),
    flat(308, "看书", "kànshū", ["читать книгу"], null),
    flat(309, "看见", "kànjiàn", ["увидеть, заметить"], 1),
    flat(310, "好看", "hǎokàn", ["красивый, симпатичный", "интересный (о книге, фильме)"], 2),
    flat(311, "难看", "nánkàn", ["некрасивый, безобразный", "неприглядный"], 3),
    flat(312, "看病", "kànbìng", ["лечить; принимать больных", "идти к врачу"], null),
    flat(313, "看法", "kànfǎ", ["взгляд, мнение, точка зрения"], 4),
    flat(314, "你", "nǐ", ["ты, тебе, тебя"], 1),
    flat(315, "吃", "chī", ["есть, кушать", "пить (лекарство)"], 1),
    flat(316, "学", "xué", ["учиться, изучать", "наука"], 1),
    flat(317, "习", "xí", ["упражняться, повторять", "привычка"], null),
    flat(318, "生", "shēng", ["рождаться; жизнь", "сырой, незрелый"], null),
    flat(319, "爱好", "àihào", ["увлечение, хобби; любить, увлекаться"], 3),
    flat(320, "爱", "ài", ["любить; любовь"], 1),
    flat(321, "好人", "hǎorén", ["хороший человек", "добряк"], null),
    flat(322, "好处", "hǎochù", ["польза, выгода; хорошая сторона"], 4),
    flat(323, "看不起", "kànbuqǐ", ["презирать, смотреть свысока"], 5),
  ],
];

/** Статья без гнёзд, как у 96% словаря: значения по порядку, `compact` — они же. */
function flat(
  id: number,
  headword: string,
  reading: string,
  glosses: string[],
  hsk: DictionaryEntry["hsk_level"],
): Omit<DictionaryEntry, "rank"> {
  return {
    id,
    headword,
    reading,
    senses: glosses.map((gloss, i) => ({ nest: null, num: glosses.length > 1 ? String(i + 1) : null, gloss })),
    compact: glosses,
    hsk_level: hsk,
  };
}
