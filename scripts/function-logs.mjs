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

// С 2026-09 все логи — в одной таблице `logs` (ClickHouse SQL); отбираем по
// тексту сообщения (наши `console.error` начинаются с узнаваемых меток).
const sql = `select toString(timestamp) as time, event_message from logs
  ${safe ? `where event_message like '%${safe}%'` : ""}
  order by timestamp desc limit 200`;

const url = new URL(`https://api.supabase.com/v1/projects/${PROJECT_REF}/analytics/endpoints/logs`);
url.searchParams.set("sql", sql);
url.searchParams.set("iso_timestamp_start", start.toISOString());
url.searchParams.set("iso_timestamp_end", end.toISOString());
const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
const text = await response.text();
if (!response.ok) {
  console.error(`HTTP ${response.status}: ${text.slice(0, 1000)}`);
  process.exit(1);
}
const body = JSON.parse(text);
if (body.error) {
  console.error(JSON.stringify(body.error, null, 2));
  process.exit(1);
}
const rows = body.result ?? [];
for (const row of [...rows].reverse()) {
  console.log(`${row.time}  ${String(row.event_message).trim()}`);
}
console.log(`— ${rows.length} строк за ${hours} ч${safe ? `, фильтр «${safe}»` : ""}`);
