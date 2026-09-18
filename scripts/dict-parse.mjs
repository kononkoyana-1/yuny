#!/usr/bin/env node
/**
 * Разбор большого китайско-русского словаря (大БКРС) из формата ABBYY Lingvo
 * DSL в NDJSON для последующей заливки в `dictionary_entries` (TZ.md §14).
 *
 * Запуск:
 *   node scripts/dict-parse.mjs --out /path/dict.ndjson
 *   node scripts/dict-parse.mjs --probe 打 上 好      — показать разбор слов и выйти
 *
 * Что на входе: три файла `docs/dictionary/dabkrs_*.dsl`, UTF-16LE, 3 452 950
 * карточек. Что на выходе: примерно 915 тысяч записей — только заголовки длиной
 * до трёх иероглифов. Длиннее — это фразы, топонимы и имена собственные;
 * приложению они не нужны, оно разбирает их как последовательность слов.
 *
 * Разметка DSL здесь закрытая, других тегов в файлах нет:
 *   [m1]…[m4]  уровень вложенности строки
 *   [b]        гнездо части речи: римская цифра плюс чтение
 *   [p] [c]    грамматические и стилистические пометы
 *   [i]        курсив — пояснения в скобках
 *   [ref]      перекрёстная ссылка на другую статью
 *   [ex] [*]   пример и блок, который его оборачивает
 */
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { open } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILES = ["dabkrs_1.dsl", "dabkrs_2.dsl", "dabkrs_3.dsl"].map((f) =>
  path.join(ROOT, "docs", "dictionary", f),
);

/**
 * Заголовок длиннее этого — фраза или имя собственное, в базу не идёт.
 *
 * Было четыре, стало три по решению от 2026-09-18: срез до четырёх знаков — это
 * 1,89 млн статей и 853 МБ на проекте вместе с индексами, а диск кончился.
 * Четырёхзначные заголовки — 973 тысячи статей и половина текста; приложение
 * разбирает такие фразы как последовательность слов (TZ.md §14).
 */
const MAX_HEADWORD = 3;
/** Сколько значений кладём в короткий список для промптов и карточек. */
const COMPACT_LIMIT = 6;

const args = process.argv.slice(2);
const outPath = args.includes("--out") ? args[args.indexOf("--out") + 1] : null;
const probeIdx = args.indexOf("--probe");
const probe = probeIdx === -1 ? null : new Set(args.slice(probeIdx + 1));

const isCjk = (ch) => ch >= "一" && ch <= "鿿";
const cjkLength = (s) => [...s].filter(isCjk).length;

/** Снимает разметку, оставляя текст: пометы и пояснения читаются как есть. */
function stripTags(text) {
  return text
    .replace(/\[\/?(?:m[1-9]|b|i|c|p|ex|\*|ref|s|t|u|sub|sup|url|lang[^\]]*)\]/g, "")
    .replace(/\\\[/g, "[")
    .replace(/\\\]/g, "]")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Тело карточки — одна длинная строка из блоков `[mN]…[/m]`. Блоки идут в том
 * порядке, в каком их читает человек, поэтому разбор линейный: римская цифра
 * открывает гнездо, арабская — значение внутри него, остальное — продолжение
 * текущего значения.
 */
function parseBody(body) {
  // Примеры выкидываем целиком: они раздувают базу втрое, а карточкам и
  // промптам не нужны. Нежадно — иначе один `[*]` съедает всё до последнего.
  const withoutExamples = body.replace(/\[\*\][\s\S]*?\[\/\*\]/g, "");

  const blocks = [...withoutExamples.matchAll(/\[m([1-9])\]([\s\S]*?)\[\/m\]/g)].map((m) => ({
    level: Number(m[1]),
    raw: m[2],
  }));
  // У части карточек тело не обёрнуто в [m…] вообще — там значение идёт голым.
  if (blocks.length === 0 && stripTags(withoutExamples)) {
    blocks.push({ level: 1, raw: withoutExamples });
  }

  const senses = [];
  let nest = null;

  for (const block of blocks) {
    const text = stripTags(block.raw);
    if (!text || text === "-----") continue;

    const roman = text.match(/^([IVX]+)\s*(.*)$/);
    const numbered = text.match(/^(\d+)\)\s*(.*)$/);
    const lettered = text.match(/^([а-яa-z])\)\s*(.*)$/);

    if (roman && (block.level === 1 || senses.length === 0)) {
      nest = roman[1];
      const rest = roman[2].trim();
      if (rest) senses.push({ nest, num: null, gloss: rest, header: true });
      continue;
    }
    if (numbered) {
      senses.push({ nest, num: numbered[1], gloss: numbered[2].trim() });
      continue;
    }
    if (lettered && senses.length > 0) {
      senses.push({ nest, num: lettered[1], gloss: lettered[2].trim() });
      continue;
    }
    senses.push({ nest, num: null, gloss: text });
  }

  return senses.filter((s) => s.gloss);
}

/** Длиннее этого значение перестаёт быть определением и становится пояснением. */
const MAX_COMPACT_GLOSS = 200;

/**
 * Короткий список значений — то, что уходит в промпт и в карточку. Отсюда
 * выброшено всё, что не является переводом:
 *
 * - заголовки гнёзд («I гл.») — они описывают строй статьи, а не смысл;
 * - служебные рубрики: они описывают, как слово работает в грамматике, а не
 *   что оно значит, и в карточке были бы ответом ни на что;
 * - чтение в начале значения: у многосложных статей БКРС ставит слог перед
 *   переводом («hǎo хороший»), и в карточке он был бы частью ответа.
 */
function compactSenses(senses, reading) {
  const syllables = new Set(
    (reading ?? "")
      .split(/[,;\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );

  const stripReading = (gloss) => {
    const first = gloss.match(/^([^\s]+)\s+(.*)$/);
    if (!first) return gloss;
    const head = first[1].toLowerCase().replace(/[.,;:]$/, "");
    return syllables.has(head) ? first[2] : gloss;
  };

  const META =
    /в сочетании с|выступает в качестве|в словообразовании|в формообразовании|перед существительным|после глагольной основы|входит в состав|замыкает обстоятельство/;

  return senses
    .filter(
      (s) =>
        !s.header &&
        s.gloss.length > 1 &&
        s.gloss.length <= MAX_COMPACT_GLOSS &&
        !META.test(s.gloss),
    )
    .map((s) => stripReading(s.gloss))
    .filter((g) => g.length > 1)
    .slice(0, COMPACT_LIMIT);
}

/**
 * Текст статьи для страницы словаря. В NDJSON не попадает и в базе не
 * хранится: это ровно те же значения, что и в `senses`, только склеенные, и
 * платить за них второй раз (84 МБ на полном словаре) незачем — страница
 * собирает статью из структуры. Нужен для `--probe`, чтобы глазами сверить
 * разбор с исходником.
 */
function renderArticle(senses) {
  return senses
    .map((s) => {
      const prefix = [s.nest && s.header ? s.nest : null, s.num ? `${s.num})` : null]
        .filter(Boolean)
        .join(" ");
      return prefix ? `${prefix} ${s.gloss}` : s.gloss;
    })
    .join("\n");
}

const stats = {
  cards: 0,
  kept: 0,
  skippedLong: 0,
  skippedEmpty: 0,
  crossRefOnly: 0,
  bytes: 0,
};

async function run() {
  const out = outPath ? await open(outPath, "w") : null;
  const buffer = [];

  const flush = async () => {
    if (!out || buffer.length === 0) return;
    const chunk = buffer.join("");
    buffer.length = 0;
    stats.bytes += Buffer.byteLength(chunk);
    await out.write(chunk);
  };

  for (const file of FILES) {
    const rl = createInterface({
      input: createReadStream(file, { encoding: "utf16le" }),
      crlfDelay: Infinity,
    });

    let headword = null;
    let reading = null;
    let body = [];

    const finish = async () => {
      if (headword === null) return;
      stats.cards += 1;
      const emit = await handle(headword, reading, body.join(" "));
      if (emit) {
        buffer.push(`${JSON.stringify(emit)}\n`);
        if (buffer.length >= 5000) await flush();
      }
      headword = null;
      reading = null;
      body = [];
    };

    for await (const line of rl) {
      const text = line.replace(/\r$/, "");
      if (!text.trim() || text.startsWith("#") || text.startsWith("﻿#")) continue;

      if (!/^[ \t]/.test(text)) {
        await finish();
        headword = text.replace(/^﻿/, "").trim();
        continue;
      }
      // Первая строка с отступом — чтение, если в ней нет разметки значений.
      if (reading === null && body.length === 0 && !text.includes("[m")) {
        reading = text.trim();
        continue;
      }
      body.push(text.trim());
    }
    await finish();
    rl.close();
  }

  await flush();
  if (out) await out.close();

  if (!probe) {
    console.log(
      [
        `карточек прочитано:      ${stats.cards.toLocaleString("ru")}`,
        `записей на выходе:       ${stats.kept.toLocaleString("ru")}`,
        `отброшено по длине:      ${stats.skippedLong.toLocaleString("ru")}`,
        `отброшено пустых:        ${stats.skippedEmpty.toLocaleString("ru")}`,
        `только перекрёстная ссылка: ${stats.crossRefOnly.toLocaleString("ru")}`,
        outPath ? `размер NDJSON:           ${(stats.bytes / 1048576).toFixed(1)} МБ` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }
}

async function handle(headword, reading, body) {
  const length = cjkLength(headword);
  if (length === 0 || length > MAX_HEADWORD) {
    stats.skippedLong += 1;
    return null;
  }

  const senses = parseBody(body);
  if (senses.length === 0) {
    stats.skippedEmpty += 1;
    return null;
  }

  const rawReading = reading && !reading.startsWith("[") ? stripTags(reading) : null;
  // У карточки без транскрипции эта строка не пустая: БКРС ставит в неё
  // заполнитель — «_», реже «--» или тире. Чтением он не является, и пускать
  // его дальше нельзя: на странице словаря он покажется как чтение, а в базе
  // займёт место значения «чтения нет». Признак настоящего чтения — хоть одна
  // буква.
  const readingText = rawReading && /\p{L}/u.test(rawReading) ? rawReading : null;
  const compact = compactSenses(senses, readingText);
  // Статья вида «см. 上海» смысла не несёт, но нужна поиску: по ней человек
  // доходит до настоящей статьи. Считаем отдельно, чтобы видеть их долю.
  if (compact.every((g) => /^см\.|^сокр\. от/.test(g))) stats.crossRefOnly += 1;

  const record = {
    headword,
    reading: readingText,
    senses,
    compact,
  };

  if (probe) {
    if (probe.has(headword)) {
      console.log(`\n=== ${headword}  [${record.reading ?? "без чтения"}]`);
      console.log(`значений: ${senses.length}, гнёзд: ${new Set(senses.map((s) => s.nest)).size}`);
      console.log(`короткий список: ${compact.join(" | ")}`);
      console.log(renderArticle(senses).split("\n").slice(0, 12).join("\n"));
    }
    return null;
  }

  stats.kept += 1;
  return record;
}

await run();
