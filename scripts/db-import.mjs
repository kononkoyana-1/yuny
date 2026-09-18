#!/usr/bin/env node
/**
 * Заливка справочных данных в Supabase: словарь БКРС и список слов HSK 2.0.
 *
 *   node scripts/db-import.mjs hsk
 *   node scripts/db-import.mjs dict --file /path/dict.ndjson [--limit 100000]
 *   node scripts/db-import.mjs size          — сколько занимают таблицы
 *
 * Ключ берётся из переменной `SUPABASE_SERVICE_ROLE_KEY` или из файла
 * `.env.local` в корне (он в .gitignore и в репозиторий не попадает). Обе
 * таблицы закрыты на запись для всех, кроме service role. URL — из
 * `apps/mobile/.env`.
 *
 * Данные уходят через PostgREST как JSON, а не строками SQL. Это не вкусовщина:
 * прошлый заливщик собирал INSERT конкатенацией, и определение со словом «into»
 * посреди текста доехало до Postgres настоящим синтаксисом. Здесь такого класса
 * ошибок нет вовсе — экранировать нечего.
 *
 * Заливка идемпотентна (`resolution=ignore-duplicates`) и продолжаемая:
 * состояние лежит рядом с файлом, прерванный прогон досылает остаток.
 */
import { createReadStream, existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BATCH = 1000;

function env() {
  const file = path.join(ROOT, "apps", "mobile", ".env");
  const local = path.join(ROOT, ".env.local");
  const url = existsSync(file)
    ? readFileSync(file, "utf8").match(/EXPO_PUBLIC_SUPABASE_URL=(\S+)/)?.[1]
    : process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    (existsSync(local)
      ? readFileSync(local, "utf8").match(/SUPABASE_SERVICE_ROLE_KEY=(\S+)/)?.[1]
      : null);
  if (!url) throw new Error("не нашёл EXPO_PUBLIC_SUPABASE_URL в apps/mobile/.env");
  if (!key) {
    throw new Error(
      "нужен секретный ключ Supabase: Dashboard → Project Settings → API Keys →\n" +
        "Secret keys (sb_secret_…) или Legacy → service_role. Положить строкой\n" +
        "SUPABASE_SERVICE_ROLE_KEY=… в .env.local в корне репозитория.",
    );
  }
  return { url: url.replace(/\/$/, ""), key };
}

/**
 * Два поколения ключей Supabase передаются по-разному. Новый секретный ключ
 * (`sb_secret_…`) — не JWT: он идёт только в `apikey`, шлюз сам выпускает
 * токен. Старый `service_role` — JWT, и его ждут ещё и в Authorization.
 */
function authHeaders(key) {
  return key.startsWith("sb_")
    ? { apikey: key }
    : { apikey: key, Authorization: `Bearer ${key}` };
}

async function post(table, rows, { url, key }, attempts = 10) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let response;
    try {
      response = await fetch(`${url}/rest/v1/${table}`, {
        method: "POST",
        headers: {
          ...authHeaders(key),
          "Content-Type": "application/json",
          Prefer: "resolution=ignore-duplicates,return=minimal",
        },
        body: JSON.stringify(rows),
      });
    } catch (error) {
      // Соединение до Supabase с этой машины встаёт не с первого раза: DNS
      // отдаёт два адреса, и один из них молчит — половина попыток умирает на
      // connect. Зато уже поднятое соединение undici переиспользует, и дальше
      // пачки идут подряд. Поэтому сетевую ошибку повторяем, а не падаем.
      if (attempt === attempts) throw error;
      await new Promise((r) => setTimeout(r, 1500 * Math.min(attempt, 4)));
      continue;
    }
    if (response.ok) return;
    const body = await response.text();
    // 5xx и обрывы — это сеть или перегруз, их имеет смысл повторить. 4xx —
    // наши данные, повтор ничего не изменит, лучше упасть с текстом ошибки.
    if (response.status < 500 || attempt === attempts) {
      throw new Error(`${table}: ${response.status} ${body.slice(0, 400)}`);
    }
    await new Promise((r) => setTimeout(r, 2000 * Math.min(attempt, 4)));
  }
}

/**
 * Проставить `dictionary_entries.hsk_level` по таблице `hsk_words`. Уровень
 * нужен поиску как признак частотности: слово из HSK идёт в выдаче выше
 * слова, которого нет ни в одном уровне. Шаг идемпотентный, поэтому вызывается
 * в конце каждого прогона — и после первой заливки, и после дозаливки остатка.
 */
async function backfillHskLevel({ url, key }) {
  const response = await fetch(`${url}/rest/v1/rpc/dict_backfill_hsk_level`, {
    method: "POST",
    headers: { ...authHeaders(key), "Content-Type": "application/json" },
    body: "{}",
  });
  if (!response.ok) {
    console.log(`  уровни HSK не проставлены: ${response.status} ${(await response.text()).slice(0, 200)}`);
    return;
  }
  console.log(`  уровни HSK проставлены у ${Number(await response.text()).toLocaleString("ru")} статей`);
}

const bar = (done, total) => {
  const pct = ((done / total) * 100).toFixed(1);
  process.stdout.write(`\r  ${done.toLocaleString("ru")} из ${total.toLocaleString("ru")} (${pct}%)   `);
};

async function importHsk(conn) {
  const levels = JSON.parse(readFileSync(path.join(ROOT, "content", "hsk_levels.json"), "utf8"));
  const rows = Object.entries(levels).flatMap(([name, words]) =>
    words.map((word) => ({ word, level: Number(name.replace("HSK", "")) })),
  );
  console.log(`HSK: ${rows.length} слов`);
  for (let i = 0; i < rows.length; i += BATCH) {
    await post("hsk_words", rows.slice(i, i + BATCH), conn);
    bar(Math.min(i + BATCH, rows.length), rows.length);
  }
  console.log("\n  готово");
  await backfillHskLevel(conn);
}

/** Пиньинь без тонов и пробелов: по нему ищет тот, кто набирает латиницей. */
function plainReading(reading) {
  if (!reading) return null;
  return reading
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toLowerCase() || null;
}

async function importDict(conn, file, limit) {
  const statePath = `${file}.state`;
  const start = existsSync(statePath) ? Number(readFileSync(statePath, "utf8")) : 0;
  if (start) console.log(`продолжаю со строки ${start.toLocaleString("ru")}`);

  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  let line = 0;
  let sent = start;
  let batch = [];
  const began = Date.now();

  const flush = async () => {
    if (batch.length === 0) return;
    await post("dictionary_entries", batch, conn);
    sent += batch.length;
    batch = [];
    writeFileSync(statePath, String(line));
    const rate = Math.round((sent - start) / ((Date.now() - began) / 1000));
    process.stdout.write(`\r  залито ${sent.toLocaleString("ru")}, ${rate} строк/с   `);
  };

  for await (const raw of rl) {
    line += 1;
    if (line <= start) continue;
    if (limit && sent - start >= limit) break;
    const r = JSON.parse(raw);
    batch.push({
      headword: r.headword,
      reading: r.reading,
      reading_plain: plainReading(r.reading),
      senses: r.senses,
      compact: r.compact,
    });
    if (batch.length >= BATCH) await flush();
  }
  await flush();
  rl.close();
  console.log(`\n  готово: ${sent.toLocaleString("ru")} строк`);
  await backfillHskLevel(conn);
}

async function showSize(conn) {
  const query = `select relname,
       pg_size_pretty(pg_total_relation_size(c.oid)) as total,
       pg_size_pretty(pg_relation_size(c.oid))       as data,
       pg_size_pretty(pg_indexes_size(c.oid))        as indexes,
       (select count(*) from public.dictionary_entries) as dict_rows
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and relname in ('dictionary_entries','hsk_words')`;
  const response = await fetch(`${conn.url}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: { ...authHeaders(conn.key), "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  console.log(response.ok ? await response.text() : "нет rpc exec_sql — смотреть размер через MCP");
}

const [what, ...rest] = process.argv.slice(2);
const arg = (name) => (rest.includes(name) ? rest[rest.indexOf(name) + 1] : null);

if (!["hsk", "dict", "size"].includes(what)) {
  console.log("что заливаем: hsk | dict --file <ndjson> [--limit N] | size");
  process.exit(1);
}

// Ключ спрашиваем только когда действительно идём в сеть: подсказка по
// аргументам должна работать и без него.
const conn = env();

if (what === "hsk") await importHsk(conn);
else if (what === "dict") {
  const file = arg("--file");
  if (!file) throw new Error("нужен --file с путём к NDJSON от scripts/dict-parse.mjs");
  await importDict(conn, file, Number(arg("--limit")) || 0);
} else if (what === "size") await showSize(conn);
