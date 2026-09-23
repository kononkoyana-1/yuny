#!/usr/bin/env node
/**
 * Применить к проекту миграции из `supabase/migrations`, которых ещё нет в
 * журнале `supabase_migrations.schema_migrations`, по порядку версий.
 *
 *   node scripts/db-apply-pending.mjs            — применить
 *   node scripts/db-apply-pending.mjs --dry-run  — только показать
 *
 * Зовёт его CI перед сборкой сайта (`.github/workflows/pages.yml`), поэтому
 * он осторожен: если неприменённая миграция СТАРШЕ последней применённой, это
 * не «новая миграция», а расхождение журнала с файлами (такое уже было до
 * 2026-09-17, см. supabase/README.md). Тогда скрипт ничего не применяет и
 * падает — прогнать старый DDL поверх живой базы хуже, чем остановить деплой.
 */
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyFile, query } from "./db-apply-migration.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join("supabase", "migrations");
const dryRun = process.argv.includes("--dry-run");

const files = readdirSync(path.join(ROOT, DIR))
  .filter((f) => /^\d{14}_.+\.sql$/.test(f))
  .sort();

const rows = await query("select version from supabase_migrations.schema_migrations");
const applied = new Set(rows.map((r) => String(r.version)));
const newestApplied = [...applied].sort().at(-1) ?? "";

const pending = files.filter((f) => !applied.has(f.slice(0, 14)));
if (pending.length === 0) {
  console.log(`новых миграций нет (последняя применённая — ${newestApplied})`);
  process.exit(0);
}

const outOfOrder = pending.filter((f) => f.slice(0, 14) <= newestApplied);
if (outOfOrder.length > 0) {
  console.error(
    `стоп: эти файлы старше последней применённой миграции ${newestApplied}, ` +
      `но их нет в журнале — сверьте журнал с файлами вручную:\n  ${outOfOrder.join("\n  ")}`,
  );
  process.exit(1);
}

console.log(`к применению (${pending.length}):\n  ${pending.join("\n  ")}`);
if (dryRun) process.exit(0);

for (const file of pending) {
  await applyFile(path.join(DIR, file));
}
