#!/usr/bin/env node
/**
 * Логи Edge Functions за последние часы — для разбора сбоев без доступа к
 * панели Supabase (Actions → «Function logs (read-only)»). Только чтение:
 * Management API `analytics/endpoints/logs`.
 *
 *   SUPABASE_ACCESS_TOKEN=… node scripts/function-logs.mjs [подстрока] [часов]
 *
 * Без подстроки — все записи функций, с ней — только строки, где она есть
 * (например, `ai_` — ответы Gemini: `ai_http_retry`, `ai_http_error`, …).
 */
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF ?? "ixtfifglohppaimvyvui";
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error("SUPABASE_ACCESS_TOKEN is not set.");
  process.exit(1);
}

const filter = process.argv[2] ?? "";
const hours = Number(process.argv[3] ?? 3);
const end = new Date();
const start = new Date(end.getTime() - hours * 3_600_000);

// Строка фильтра идёт в SQL логов — только безопасные символы.
const safe = filter.replace(/[^\w\-.: ]/g, "");
const where = safe ? `where event_message like '%${safe}%'` : "";

// Имя источника логов у Supabase менялось вместе с эндпоинтом — пробуем по очереди.
const SOURCES = ["function_logs", "edge_function_logs", "function_console_logs", "function_edge_logs"];

async function run(source) {
  const sql = `select datetime(timestamp) as time, event_message from ${source} ${where} order by timestamp desc limit 200`;
  const url = new URL(`https://api.supabase.com/v1/projects/${PROJECT_REF}/analytics/endpoints/logs`);
  url.searchParams.set("sql", sql);
  url.searchParams.set("iso_timestamp_start", start.toISOString());
  url.searchParams.set("iso_timestamp_end", end.toISOString());
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const text = await response.text();
  if (!response.ok) return { error: `HTTP ${response.status}: ${text.slice(0, 500)}` };
  const body = JSON.parse(text);
  return body.error ? { error: JSON.stringify(body.error).slice(0, 500) } : { rows: body.result ?? [] };
}

for (const source of SOURCES) {
  const { rows, error } = await run(source);
  if (error) {
    console.error(`${source}: ${error}`);
    continue;
  }
  for (const row of [...rows].reverse()) console.log(`${row.time}  ${String(row.event_message).trim()}`);
  console.log(`— ${source}: ${rows.length} строк за ${hours} ч${safe ? `, фильтр «${safe}»` : ""}`);
  process.exit(0);
}
process.exit(1);
