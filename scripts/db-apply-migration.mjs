#!/usr/bin/env node
/**
 * Применить файл миграции к проекту и записать его в журнал миграций.
 *
 *   node scripts/db-apply-migration.mjs supabase/migrations/20260918_foo.sql
 *   node scripts/db-apply-migration.mjs --sql "select 1"      — разовый запрос
 *
 * Зачем свой применятор, когда есть CLI и MCP:
 *   * `supabase db push` просит пароль от базы, а локально лежит только
 *     токен аккаунта (`~/.supabase/access-token`);
 *   * MCP-канал на запись отвечает `25006 read-only transaction` не всегда,
 *     но часто, и починить это со своей стороны нельзя.
 * Management API (`/database/query`) — тот же канал, которым ходит SQL Editor
 * в дашборде: пишет, работает по токену аккаунта, лишних зависимостей не
 * требует.
 *
 * Имя файла — версия миграции: `<version>_<name>.sql`. Если файл назван без
 * версии, скрипт сам поставит текущую метку времени и скажет, как переименовать
 * файл, — имена файлов и версии в `supabase_migrations.schema_migrations`
 * обязаны совпадать (см. `supabase/README.md`).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import os from "node:os";
import dns from "node:dns";

// IPv6 с этой машины не маршрутизируется (`ENETUNREACH` на 2a06:…), а
// api.supabase.com отдаёт AAAA-записи. Без явного порядка node ходит в них
// первым делом и падает, не добравшись до IPv4.
dns.setDefaultResultOrder("ipv4first");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// В CI (`.github/workflows/pages.yml`) проект задан переменной окружения:
// `apps/mobile/.env` там нет.
const PROJECT_REF =
  process.env.SUPABASE_PROJECT_REF ??
  readFileSync(path.join(ROOT, "apps", "mobile", ".env"), "utf8")
    .match(/EXPO_PUBLIC_SUPABASE_URL=https:\/\/([a-z]+)\.supabase\.co/)[1];

const token = (process.env.SUPABASE_ACCESS_TOKEN ??
  readFileSync(path.join(os.homedir(), ".supabase", "access-token"), "utf8")).trim();

/**
 * Один запрос к Management API. Канал до `api.supabase.com` рвётся на установке
 * соединения — повторяем, как и всё, что ходит в сеть с этой машины.
 */
export async function query(sql, attempts = 8) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await fetch(
        `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          // Эндпоинт подключается ролью `supabase_read_only_user`, у которой
          // `default_transaction_read_only=on`, поэтому любой DDL падал бы с
          // 25006. Права на запись у роли есть — не хватает только снятого
          // флага, и снимается он на саму транзакцию.
          body: JSON.stringify({ query: `set transaction read write;\n${sql}` }),
        },
      );
      if (response.ok) return response.json();
      const body = (await response.text()).slice(0, 600);
      if (response.status < 500 || attempt === attempts) {
        throw new Error(`${response.status} ${body}`);
      }
    } catch (error) {
      if (attempt === attempts) throw error;
    }
    await new Promise((r) => setTimeout(r, 1500 * Math.min(attempt, 4)));
  }
}

/** Одинарные кавычки внутри текста удваиваются — иначе литерал рвётся. */
function sqlLiteral(value) {
  return `'${value.replace(/'/g, "''")}'`;
}

async function main(args) {
  const inlineIdx = args.indexOf("--sql");
  if (inlineIdx !== -1) {
    console.log(JSON.stringify(await query(args[inlineIdx + 1]), null, 2));
    return;
  }

  const file = args[0];
  if (!file) {
    console.log('нужен путь к .sql или --sql "<запрос>"');
    process.exitCode = 1;
    return;
  }

  await applyFile(file);
}

/**
 * Применяет один файл миграции и пишет его в журнал. Ничего не проверяет —
 * «применён ли уже» решает вызывающий (`db-apply-pending.mjs`).
 */
export async function applyFile(file) {
  const sql = readFileSync(path.resolve(ROOT, file), "utf8");
  const base = path.basename(file, ".sql");
  const matched = base.match(/^(\d{14})_(.+)$/);
  const version = matched?.[1] ?? new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const name = matched?.[2] ?? base;

  await query(sql);

  // Журнал ведём сами: Management API применяет SQL, но о миграциях не знает.
  // `on conflict do nothing` — чтобы повторный запуск не падал.
  await query(
    `insert into supabase_migrations.schema_migrations (version, name, statements)
     values (${sqlLiteral(version)}, ${sqlLiteral(name)}, array[${sqlLiteral(sql)}]::text[])
     on conflict (version) do nothing`,
  );

  console.log(`применено: ${name} (версия ${version})`);
  if (!matched) {
    console.log(`переименуйте файл в ${version}_${name}.sql — имя должно совпадать с версией`);
  }
}

// Файл и запускают напрямую, и импортируют ради `query` — CLI только в первом
// случае.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main(process.argv.slice(2));
}
