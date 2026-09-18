#!/usr/bin/env node
/**
 * Разовая правка залитых данных: у карточки без транскрипции БКРС ставит в
 * строке чтения заполнитель («_», реже «--» или тире), и первая версия парсера
 * записала его в `reading` как настоящее чтение — 1,27 млн статей.
 *
 *   node scripts/db-fix-placeholder-readings.mjs [--from <id>]
 *
 * Парсер это уже не повторит (`dict-parse.mjs`: признак чтения — хоть одна
 * буква), так что при заливке с нуля скрипт не нужен. Идемпотентен и
 * продолжаем: идёт диапазонами `id`, каждый диапазон — отдельная транзакция.
 *
 * Две вещи здесь не случайны.
 *
 * Диапазоны по `id`, а не `order by … limit N`: сортировка полутора миллионов
 * строк уходит во временный файл, а на диске проекта места нет — первый заход
 * так и умер с `53100 no space left on device`.
 *
 * `vacuum` между пачками: правка на 130 тысяч строк оставляет столько же
 * мёртвых версий, и без уборки таблица растёт на четыре мегабайта за пачку.
 * После уборки место переиспользуется и размер базы стоит на месте.
 */
import { query } from "./db-apply-migration.mjs";

const RANGE = 200_000;

const args = process.argv.slice(2);
const from = Number(args[args.indexOf("--from") + 1]) || 0;

const scalar = async (sql) => Object.values((await query(sql))[0])[0];
const left = () =>
  scalar(`select count(*) from public.dictionary_entries
           where reading is not null and reading !~ '[[:alpha:]]'`);

const maxId = Number(await scalar("select coalesce(max(id), 0) from public.dictionary_entries"));
console.log(`заполнителей: ${Number(await left()).toLocaleString("ru")}, id до ${maxId.toLocaleString("ru")}`);

for (let start = from; start <= maxId; start += RANGE) {
  await query(
    `update public.dictionary_entries
        set reading = null
      where id >= ${start} and id < ${start + RANGE}
        and reading is not null
        and reading !~ '[[:alpha:]]'`,
  );
  // vacuum не выполняется внутри транзакции, а `query` открывает её ради
  // `set transaction read write` — поэтому уборка идёт отдельным запросом,
  // одиночным оператором.
  await vacuum();
  const size = Number(await scalar("select pg_database_size(current_database())"));
  console.log(
    `  id < ${(start + RANGE).toLocaleString("ru")}: осталось ` +
      `${Number(await left()).toLocaleString("ru")}, база ${(size / 1048576).toFixed(0)} МБ`,
  );
}

console.log("готово");

/** Одиночный оператор мимо `query`: тому нужна транзакция, этому — её отсутствие. */
async function vacuum() {
  const { readFileSync } = await import("node:fs");
  const os = await import("node:os");
  const path = await import("node:path");
  const token = (
    process.env.SUPABASE_ACCESS_TOKEN ??
    readFileSync(path.join(os.homedir(), ".supabase", "access-token"), "utf8")
  ).trim();
  const ref = readFileSync(new URL("../apps/mobile/.env", import.meta.url), "utf8").match(
    /EXPO_PUBLIC_SUPABASE_URL=https:\/\/([a-z]+)\.supabase\.co/,
  )[1];

  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query: "vacuum public.dictionary_entries" }),
      });
      if (response.ok) return;
      if (response.status < 500) throw new Error(`${response.status} ${(await response.text()).slice(0, 300)}`);
    } catch (error) {
      if (attempt === 8) throw error;
    }
    await new Promise((r) => setTimeout(r, 1500 * Math.min(attempt, 4)));
  }
}
