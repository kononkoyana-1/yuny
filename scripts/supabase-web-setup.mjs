#!/usr/bin/env node
/**
 * Подготовка проекта Supabase к web-сборке на GitHub Pages
 * (`.github/workflows/pages.yml`), через Management API по токену аккаунта:
 *
 *   node scripts/supabase-web-setup.mjs <адрес сайта>
 *
 * 1. Добавляет адрес сайта в разрешённые адреса возврата Auth
 *    (`uri_allow_list`) — иначе ссылка из письма подтверждения и вход через
 *    OAuth не вернут человека на сайт. Существующие адреса не трогаются, Site
 *    URL тоже: им может пользоваться локальная разработка.
 * 2. Сообщает, включён ли в проекте вход через Google (`google_enabled` в
 *    `$GITHUB_OUTPUT`): сборка показывает кнопку «Войти через Google», только
 *    когда провайдер настроен, иначе нажатие упало бы с ошибкой.
 * 3. Печатает публичный ключ проекта (publishable, или legacy anon, если
 *    publishable нет) в `$GITHUB_OUTPUT` как `publishable_key`. Ключ публичен
 *    по устройству — данные закрывает RLS, — но в репозитории его всё равно не
 *    держим: он приходит из проекта при каждой сборке.
 */
import { appendFileSync } from "node:fs";
import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

const REF = process.env.SUPABASE_PROJECT_REF;
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const site = process.argv[2];
if (!REF || !TOKEN || !site) {
  console.error("нужны SUPABASE_PROJECT_REF, SUPABASE_ACCESS_TOKEN и адрес сайта аргументом");
  process.exit(1);
}

async function api(method, route, body) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${REF}${route}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${route}: ${response.status} ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : null;
}

// 1. Адреса возврата. Шаблон `**` покрывает любой путь под сайтом.
const pattern = `${site.replace(/\/$/, "")}/**`;
const auth = await api("GET", "/config/auth");
const allowed = (auth.uri_allow_list ?? "").split(",").map((s) => s.trim()).filter(Boolean);
if (allowed.includes(pattern)) {
  console.log(`адрес возврата уже разрешён: ${pattern}`);
} else {
  await api("PATCH", "/config/auth", { uri_allow_list: [...allowed, pattern].join(",") });
  console.log(`добавлен адрес возврата: ${pattern}`);
}

// 2. Google.
const google = auth.external_google_enabled === true;
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `google_enabled=${google}\n`);
console.log(`вход через Google: ${google ? "включён" : "не настроен (Authentication → Sign In / Providers → Google)"}`);

// 3. Публичный ключ.
const keys = await api("GET", "/api-keys");
const key =
  keys.find((k) => k.type === "publishable")?.api_key ??
  keys.find((k) => k.name === "anon")?.api_key;
if (!key) throw new Error("у проекта нет ни publishable, ни anon ключа");
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `publishable_key=${key}\n`);
console.log(`публичный ключ: ${key.slice(0, 16)}…`);
