import type { WordsExtractResult } from "@yuny/shared";

/**
 * Что вернул бы разбор страницы учебника «В магазине»: у части слов перевод
 * был написан в файле, у части — только иероглифы (перевод из словаря). Два
 * слова словарю неизвестны: у одного перевод из файла, у другого — от модели.
 */
export const mockExtractedWords: WordsExtractResult = {
  title: "Урок 5. В магазине",
  words: [
    { word: "商店", reading: "shāngdiàn", translation: "магазин", source: "file", entry_id: 201 },
    { word: "买", reading: "mǎi", translation: "покупать", source: "file", entry_id: 202 },
    { word: "便宜", reading: "piányi, biànyí", translation: "дешёвый", source: "file", entry_id: 108 },
    { word: "好吃", reading: "hǎochī", translation: "вкусный; легко есть, удобный для еды", source: "dictionary", entry_id: 103 },
    { word: "打电话", reading: "dǎ diànhuà", translation: "звонить по телефону", source: "dictionary", entry_id: 105 },
    { word: "多少钱", reading: "duōshao qián", translation: "сколько стоит?", source: "dictionary", entry_id: 203 },
    { word: "扫码", reading: "sǎomǎ", translation: "отсканировать QR-код", source: "ai", entry_id: null },
    // Нет в БКРС, но перевод был в файле — `file` без статьи (upload-words.review.md B1).
    { word: "网红", reading: "wǎnghóng", translation: "блогер, интернет-знаменитость", source: "file", entry_id: null },
  ],
};
