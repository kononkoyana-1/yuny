#!/usr/bin/env node
/**
 * Заливка данных о знаках (#74) в `hanzi_chars` из Make Me a Hanzi.
 *
 *   node scripts/hanzi-import.mjs            — скачать, отобрать, залить
 *   node scripts/hanzi-import.mjs --dry-run  — скачать и разобрать, в базу не писать
 *
 * Файлы берутся с зафиксированного коммита при каждом запуске и в репозиторий
 * не попадают (условия лицензий, docs/learning/data-sources.md):
 *   * `dictionary.txt` (LGPL-3) — разбор IDS, ключ, этимология;
 *   * `graphics.txt` (Arphic Public License) — черты; нужно только их число.
 *
 * Берём только знаки, которые встречаются в `dictionary_entries.headword`.
 * Пишет через Management API (`db-apply-migration.mjs`), как и CI: токен —
 * `SUPABASE_ACCESS_TOKEN`. Повторный запуск обновляет строки (`on conflict do
 * update`). Запускается из Actions → «Hanzi import».
 */
import { pathToFileURL } from "node:url";

const COMMIT = "bddc96d41bef78427ed0e034e9f7e31d71fd1b92";
const BASE = `https://raw.githubusercontent.com/skishore/makemeahanzi/${COMMIT}`;
const BATCH = 500;
const ETYMOLOGY = new Set(["ideographic", "pictographic", "pictophonetic"]);
/** Описатели IDS (⿰…⿻) и «？» — не компоненты. */
const NOT_COMPONENT = /[⿰-⿻？]/u;

/** Знаки из разбора, один уровень: «⿱十买» → [十, 买]; «？» пропускаем. */
export function componentsOf(ids) {
  if (!ids) return [];
  return [...new Set([...ids].filter((c) => !NOT_COMPONENT.test(c)))];
}

/**
 * Два файла источника → строки `hanzi_chars`. Чистая функция: строки файлов —
 * по одному JSON на строку; битые строки пропускаются.
 */
export function parseHanzi(dictionaryText, graphicsText) {
  const strokes = new Map();
  for (const line of graphicsText.split("\n")) {
    const g = parseLine(line);
    if (g?.character && Array.isArray(g.strokes)) strokes.set(g.character, g.strokes.length);
  }
  const rows = [];
  for (const line of dictionaryText.split("\n")) {
    const d = parseLine(line);
    if (typeof d?.character !== "string" || [...d.character].length !== 1) continue;
    const ety = d.etymology && ETYMOLOGY.has(d.etymology.type) ? d.etymology : null;
    const ids = typeof d.decomposition === "string" && d.decomposition !== "？" ? d.decomposition : null;
    rows.push({
      character: d.character,
      stroke_count: strokes.get(d.character) || null,
      decomposition: ids,
      radical: typeof d.radical === "string" ? d.radical : null,
      etymology_type: ety?.type ?? null,
      etymology_semantic: (ety?.type === "pictophonetic" && ety.semantic) || null,
      etymology_phonetic: (ety?.type === "pictophonetic" && ety.phonetic) || null,
      components: componentsOf(ids),
    });
  }
  return rows;
}

function parseLine(line) {
  if (!line.trim()) return null;
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

async function download(name) {
  const response = await fetch(`${BASE}/${name}`);
  if (!response.ok) throw new Error(`${name}: ${response.status}`);
  return response.text();
}

/** Одинарные кавычки внутри текста удваиваются — иначе литерал рвётся. */
const sqlLiteral = (value) => `'${value.replace(/'/g, "''")}'`;

async function main(args) {
  const dryRun = args.includes("--dry-run");
  console.log(`Make Me a Hanzi @ ${COMMIT.slice(0, 7)}: скачиваю…`);
  const [dictionary, graphics] = await Promise.all([download("dictionary.txt"), download("graphics.txt")]);
  const all = parseHanzi(dictionary, graphics);
  console.log(`  знаков в источнике: ${all.length}`);
  if (dryRun) {
    console.log(JSON.stringify(all.slice(0, 3), null, 2));
    return;
  }

  // Токен читается при загрузке модуля — поэтому импорт здесь, а не наверху:
  // так `parseHanzi` можно проверить без ключей.
  const { query } = await import("./db-apply-migration.mjs");
  const [{ chars }] = await query(
    `select string_agg(distinct ch, '') as chars
       from public.dictionary_entries, regexp_split_to_table(headword, '') as ch`,
    8,
    { readOnly: true },
  );
  const used = new Set(chars ?? "");
  const rows = all.filter((r) => used.has(r.character));
  console.log(`  из них в словаре: ${rows.length}`);

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = JSON.stringify(rows.slice(i, i + BATCH));
    await query(
      `insert into public.hanzi_chars (character, stroke_count, decomposition, radical,
         etymology_type, etymology_semantic, etymology_phonetic, components)
       select character, stroke_count, decomposition, radical,
         etymology_type, etymology_semantic, etymology_phonetic, components
         from jsonb_to_recordset(${sqlLiteral(batch)}::jsonb) as r(
           character text, stroke_count smallint, decomposition text, radical text,
           etymology_type text, etymology_semantic text, etymology_phonetic text, components text[])
       on conflict (character) do update set
         stroke_count = excluded.stroke_count, decomposition = excluded.decomposition,
         radical = excluded.radical, etymology_type = excluded.etymology_type,
         etymology_semantic = excluded.etymology_semantic,
         etymology_phonetic = excluded.etymology_phonetic, components = excluded.components`,
    );
    process.stdout.write(`\r  залито ${Math.min(i + BATCH, rows.length)} из ${rows.length}   `);
  }
  console.log("\nготово");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main(process.argv.slice(2));
}

