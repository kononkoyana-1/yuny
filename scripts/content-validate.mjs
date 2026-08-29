/**
 * Gate B of the content pipeline (`docs/CONTENT_AGENTS.md` §9.1, §10.1).
 *
 * Runs every mechanical check over a spec/draft pair *before* the QA agent
 * sees it, so review attention goes to pedagogy rather than to "this
 * fill_blank has two blanks". Nothing here needs judgement; anything that
 * does belongs in the QA checklist (§10.2), not in this file.
 *
 * Run:
 *   node scripts/content-validate.mjs                 # every package in content/
 *   node scripts/content-validate.mjs <slug>          # one package
 *   node scripts/content-validate.mjs --approved      # re-check what was approved
 *
 * Exit code 1 on any error, so it can gate a commit or a handoff.
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateSpec, validateDraft } from "./content-schema.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTENT = path.join(ROOT, "content");

const args = process.argv.slice(2);
const useApproved = args.includes("--approved");
const only = args.filter((a) => !a.startsWith("--"));

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function listSlugs() {
  const entries = await readdir(path.join(CONTENT, "specs")).catch(() => []);
  return entries.filter((f) => f.endsWith(".spec.json")).map((f) => f.replace(/\.spec\.json$/, ""));
}

let failed = 0;
const slugs = only.length > 0 ? only : await listSlugs();

if (slugs.length === 0) {
  console.log("No packages under content/specs/ — nothing to validate.");
  process.exit(0);
}

for (const slug of slugs) {
  const specFile = path.join(CONTENT, "specs", `${slug}.spec.json`);
  const draftFile = path.join(CONTENT, useApproved ? "approved" : "drafts", `${slug}.content.json`);

  let spec;
  try {
    spec = await readJson(specFile);
  } catch (error) {
    console.error(`\n${slug}\n  spec: cannot read ${path.relative(ROOT, specFile)} — ${error.message}`);
    failed += 1;
    continue;
  }

  const specReport = validateSpec(spec);
  let draft = null;
  let draftReport = null;

  try {
    draft = await readJson(draftFile);
  } catch {
    // A spec with no draft yet is a legitimate state: the Learning Agent has
    // handed off and the Content Agent has not started.
  }

  if (draft) {
    draftReport = validateDraft(draft, spec);
  }

  const errors = [...specReport.errors, ...(draftReport?.errors ?? [])];
  const warnings = [...specReport.warnings, ...(draftReport?.warnings ?? [])];
  const status = errors.length > 0 ? "FAIL" : warnings.length > 0 ? "PASS (warnings)" : "PASS";

  console.log(`\n${slug} — ${status}${draft ? "" : "  [spec only, no draft yet]"}`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  for (const w of warnings) console.log(`  ! ${w}`);

  if (draft && errors.length === 0) {
    const items = draft.knowledge_items?.length ?? 0;
    const exercises = draft.exercises?.length ?? 0;
    const objectives = spec.learning_objectives?.length ?? 0;
    console.log(`  ${objectives} objectives · ${items} knowledge items · ${exercises} exercises · ${spec.level?.cefr} · ${spec.skill}`);
  }
  if (errors.length > 0) failed += 1;
}

console.log(`\n${slugs.length - failed}/${slugs.length} packages pass gate B.`);
process.exit(failed > 0 ? 1 : 0);
