/**
 * Turns approved content packages into idempotent SQL
 * (`docs/CONTENT_AGENTS.md` §5.4).
 *
 * This script exists because the Content Agent must not write SQL. Loading the
 * first authored batch failed four times over text like "where you go into a
 * building", which reached Postgres as syntax and came back as
 * `relation "a" does not exist` (`docs/plan-tasks.md`). Escaping is mechanical
 * work with one correct answer — it belongs in a script that does it the same
 * way every time, not in a model's output.
 *
 * Three things it guarantees that hand-written SQL did not:
 *  1. every literal is escaped by doubling quotes, and every emitted statement
 *     is asserted to have balanced quotes before it is written;
 *  2. `status = 'validated'` is set only for packages whose review says
 *     APPROVED — this is what makes the QA verdict physically meaningful
 *     rather than a note in a file (§5.6);
 *  3. output is split into 12–14 KB parts, because that is the size at which a
 *     failing line is found in a minute; in a 66 KB file it is not.
 *
 * Run:
 *   node scripts/content-emit.mjs <slug> [<slug> ...]   # named packages
 *   node scripts/content-emit.mjs --all                 # every approved package
 *   node scripts/content-emit.mjs --all --batch travel  # name the output files
 */
import { readFile, readdir, writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateSpec,
  validateDraft,
  sqlString,
  sqlJson,
  assertBalancedQuotes,
  assertNoProseLeak,
} from "./content-schema.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTENT = path.join(ROOT, "content");
const OUT_DIR = path.join(ROOT, "supabase");

/** Target size of one part file — the size at which a bad line is findable. */
const PART_BYTES = 13 * 1024;

const argv = process.argv.slice(2);
const all = argv.includes("--all");
const batchIndex = argv.indexOf("--batch");
const batch = batchIndex >= 0 ? argv[batchIndex + 1] : "content";
const named = argv.filter((a, i) => !a.startsWith("--") && i !== batchIndex + 1);

const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));

/**
 * A review is a markdown document, but its verdict has to be machine-readable
 * or the gate is decorative. The convention is a line `**Verdict:** APPROVED`
 * — the same line a human reads.
 */
async function readVerdict(slug) {
  const file = path.join(CONTENT, "reviews", `${slug}.review.md`);
  const text = await readFile(file, "utf8").catch(() => null);
  if (text === null) return { verdict: null, reason: `no review at ${path.relative(ROOT, file)}` };
  // A review file accumulates rounds, oldest first (§9.2), so the package's
  // standing verdict is the last one written — reading the first would let a
  // round-1 REVISION_REQUIRED veto content that round 2 approved.
  const matches = [...text.matchAll(/^\s*\*\*Verdict:\*\*\s*(APPROVED|REVISION_REQUIRED|SPEC_DEFECT)/gm)];
  if (matches.length === 0) return { verdict: null, reason: "review has no `**Verdict:**` line" };
  return { verdict: matches[matches.length - 1][1], reason: null };
}

// ------------------------------------------------------------- statements

const SOURCE_REF = (url) => `(select id from public.content_sources where source_url = ${sqlString(url)})`;
const UNIT_REF = (url, externalId) =>
  `(select cu.id from public.content_units cu where cu.source_id = ${SOURCE_REF(url)} and cu.external_id = ${sqlString(externalId)})`;
const ITEM_REF = (url, externalId, kind, dedupKey) =>
  `(select ki.id from public.knowledge_items ki where ki.content_unit_id = ${UNIT_REF(url, externalId)} ` +
  `and ki.kind = ${sqlString(kind)} and ki.dedup_key = ${sqlString(dedupKey)})`;

/**
 * Plain independent statements, no nested CTEs — the shape the Supabase SQL
 * editor is known to accept for this project (`supabase/seed-authored-travel.sql`).
 */
function emitPackage(spec, draft, status) {
  const out = [];
  const { source_url: url, license, origin } = spec.provenance;
  const say = (comment) => out.push(`-- ${comment}`);

  if (spec.mode === "assessment-bank") {
    say(`${spec.spec_id} — assessment bank items (${spec.level.cefr}, ${spec.skill})`);
    for (const [i, ex] of (draft.exercises ?? []).entries()) {
      if (ex.type !== "multiple_choice") continue; // assessment_questions is MC-only
      const options = `array[${ex.payload.options.map(sqlString).join(", ")}]::text[]`;
      out.push(
        `insert into public.assessment_questions (language, skill, prompt, options, correct_index, difficulty, position, cefr_level, spec_id, objective_id)\n` +
          `values (${sqlString(draft.language ?? "en")}, ${sqlString(spec.skill)}, ${sqlString(ex.payload.prompt)}, ${options}, ` +
          `${ex.payload.correct_index}, ${spec.level.difficulty}, ${i}, ${sqlString(spec.level.cefr)}::public.cefr_level, ` +
          `${sqlString(spec.spec_id)}, ${sqlString(ex.objective_id)})\n` +
          `on conflict (language, prompt) do update set options = excluded.options, correct_index = excluded.correct_index, ` +
          `difficulty = excluded.difficulty, cefr_level = excluded.cefr_level, spec_id = excluded.spec_id, objective_id = excluded.objective_id;`,
      );
    }
    return out;
  }

  const unit = draft.content_unit;
  say(`===== ${unit.title} (${spec.level.cefr}) · spec ${spec.spec_id} v${spec.version} · status ${status} =====`);

  out.push(
    `insert into public.content_sources (title, author, source_url, license, license_url, parser, parser_config, status)\n` +
      `values (${sqlString(spec.provenance.source_title ?? "Yuny authored content (English)")}, ${sqlString(spec.provenance.author ?? "Yuny")}, ` +
      `${sqlString(url)}, ${sqlString(license)}, ${sqlString(spec.provenance.license_url ?? null)}, ` +
      `${sqlString(spec.provenance.parser ?? "authored")}, '{}'::jsonb, 'ready')\n` +
      `on conflict (source_url) do update set status = 'ready', license = excluded.license;`,
  );

  const wordCount = unit.parsed_blocks.reduce((n, b) => n + b.text.trim().split(/\s+/).length, 0);
  out.push(
    `insert into public.content_units (source_id, external_id, kind, title, position, parsed_blocks, parsed_at, word_count, status, cefr_level, spec_id)\n` +
      `values (${SOURCE_REF(url)}, ${sqlString(unit.external_id)}, ${sqlString(unit.kind ?? "chapter")}, ${sqlString(unit.title)}, ` +
      `${unit.position ?? 0}, ${sqlJson(unit.parsed_blocks)}, now(), ${wordCount}, 'parsed', ` +
      `${sqlString(unit.cefr_level)}::public.cefr_level, ${sqlString(spec.spec_id)})\n` +
      `on conflict (source_id, external_id) do update set parsed_blocks = excluded.parsed_blocks, ` +
      `word_count = excluded.word_count, cefr_level = excluded.cefr_level, title = excluded.title, spec_id = excluded.spec_id;`,
  );

  for (const slug of unit.topics) {
    out.push(
      `insert into public.content_unit_topics (content_unit_id, topic_id)\n` +
        `values (${UNIT_REF(url, unit.external_id)}, (select id from public.topics where slug = ${sqlString(slug)}))\n` +
        `on conflict do nothing;`,
    );
  }

  for (const item of draft.knowledge_items) {
    out.push(
      `insert into public.knowledge_items (content_unit_id, kind, dedup_key, data, origin, status, objective_id)\n` +
        `values (${UNIT_REF(url, unit.external_id)}, ${sqlString(item.kind)}, ${sqlString(item.dedup_key)}, ` +
        `${sqlJson(item.data)}, ${sqlString(item.origin ?? origin)}, ${sqlString(status)}, ${sqlString(item.objective_id)})\n` +
        `on conflict (content_unit_id, kind, dedup_key) do update set data = excluded.data, ` +
        `status = excluded.status, objective_id = excluded.objective_id;`,
    );
    for (const ex of draft.exercises.filter((e) => e.knowledge_dedup_key === item.dedup_key)) {
      out.push(
        `insert into public.generated_exercises (knowledge_item_id, type, payload, status, objective_id)\n` +
          `values (${ITEM_REF(url, unit.external_id, item.kind, item.dedup_key)}, ${sqlString(ex.type)}, ` +
          `${sqlJson(ex.payload)}, ${sqlString(status)}, ${sqlString(ex.objective_id)})\n` +
          `on conflict (knowledge_item_id, type) do update set payload = excluded.payload, ` +
          `status = excluded.status, objective_id = excluded.objective_id;`,
      );
    }
  }
  return out;
}

// ------------------------------------------------------------------ main

async function listApproved() {
  const entries = await readdir(path.join(CONTENT, "approved")).catch(() => []);
  return entries.filter((f) => f.endsWith(".content.json")).map((f) => f.replace(/\.content\.json$/, ""));
}

const slugs = all ? await listApproved() : named;
if (slugs.length === 0) {
  console.error("Nothing to emit. Pass slugs, or --all once packages exist in content/approved/.");
  process.exit(1);
}

const statements = [
  `-- Generated by scripts/content-emit.mjs — do not edit by hand.`,
  `-- Source of truth: content/approved/<slug>.content.json + content/specs/<slug>.spec.json`,
  `-- Every row lands with status='validated': it passed the QA gate (docs/CONTENT_AGENTS.md §5.6).`,
  ``,
];

for (const slug of slugs) {
  const spec = await readJson(path.join(CONTENT, "specs", `${slug}.spec.json`));
  const draft = await readJson(path.join(CONTENT, "approved", `${slug}.content.json`));

  // Re-run both gates. An approved package that no longer validates means the
  // spec moved after approval — emitting it would ship content nobody reviewed.
  const specReport = validateSpec(spec);
  const draftReport = validateDraft(draft, spec);
  const problems = [...specReport.errors, ...draftReport.errors];
  if (problems.length > 0) {
    console.error(`\n${slug}: refusing to emit — package no longer passes gate B:`);
    for (const p of problems) console.error(`  ✗ ${p}`);
    process.exit(1);
  }

  // The approved copy must be exactly the draft that was reviewed. The QA agent
  // may not edit content (§4.4) — if it had, approving its own edit would make
  // it a co-author of the thing it signed off. Tool lists cannot express "may
  // write reviews but not drafts", so the rule is enforced here instead of
  // promised in a prompt.
  const draftPath = path.join(CONTENT, "drafts", `${slug}.content.json`);
  const draftOnDisk = await readFile(draftPath, "utf8").catch(() => null);
  const approvedOnDisk = await readFile(path.join(CONTENT, "approved", `${slug}.content.json`), "utf8");
  if (draftOnDisk !== null && draftOnDisk !== approvedOnDisk) {
    console.error(`\n${slug}: refusing to emit — content/approved/ differs from content/drafts/.`);
    console.error("  An approved package must be a copy of the reviewed draft, not an edited variant.");
    console.error(`  Diff them, and if the change is wanted, it belongs in a new round: git diff --no-index ${path.relative(ROOT, draftPath)} content/approved/${slug}.content.json`);
    process.exit(1);
  }

  const { verdict, reason } = await readVerdict(slug);
  if (verdict !== "APPROVED") {
    console.error(`\n${slug}: refusing to emit — ${reason ?? `verdict is ${verdict}`}.`);
    console.error("  Only an APPROVED review may reach the database (docs/CONTENT_AGENTS.md §4.4).");
    process.exit(1);
  }

  statements.push(...emitPackage(spec, draft, "validated"), ``);
  console.log(`${slug}: emitted (${spec.mode}, ${spec.level.cefr}, ${spec.skill})`);
}

for (const statement of statements) {
  assertBalancedQuotes(statement);
  assertNoProseLeak(statement);
}

// --- write combined file + parts
const combined = `${statements.join("\n")}\n`;
const combinedFile = path.join(OUT_DIR, `seed-${batch}.sql`);
await writeFile(combinedFile, combined, "utf8");

const partsDir = path.join(OUT_DIR, `${batch}-parts`);
await rm(partsDir, { recursive: true, force: true });
await mkdir(partsDir, { recursive: true });

let part = [];
let bytes = 0;
let index = 1;
const flush = async () => {
  if (part.length === 0) return;
  const name = String(index).padStart(2, "0");
  await writeFile(path.join(partsDir, `${name}.sql`), `${part.join("\n")}\n`, "utf8");
  index += 1;
  part = [];
  bytes = 0;
};
for (const statement of statements) {
  if (bytes + statement.length > PART_BYTES) await flush();
  part.push(statement);
  bytes += statement.length + 1;
}
await flush();

console.log(
  `\n${path.relative(ROOT, combinedFile)} — ${(combined.length / 1024).toFixed(1)} KB` +
    `\n${path.relative(ROOT, partsDir)}/ — ${index - 1} parts of ≤ ${PART_BYTES / 1024} KB`,
);
