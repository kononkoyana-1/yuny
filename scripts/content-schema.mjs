/**
 * Canonical shape of the three content-pipeline artifacts, and the machine
 * checks that gate them (`docs/CONTENT_AGENTS.md` §5, §10.1).
 *
 * Plain JS on purpose, no Zod:
 *  - `packages/shared` is declared as "schemas shared between the Expo client
 *    and Supabase Edge Functions" — a learning spec is neither, nothing at
 *    runtime ever parses one, so putting it there would widen that package's
 *    contract for no consumer;
 *  - the scripts run under bare `node` with no root-level dependency and no
 *    TypeScript support in this environment, so a dependency-free validator is
 *    the only one that actually runs everywhere;
 *  - error text is written for whoever has to fix the content ("LO-2 needs 5
 *    exercises, draft has 3"), not for a schema library's issue path.
 *
 * Every enum below mirrors a real database constraint. When they drift, the
 * seed fails at COPY time in Supabase instead of here — which is exactly the
 * four-failed-loads experience `docs/plan-tasks.md` records.
 */

/** `public.cefr_level` (20260828120000_content_taxonomy.sql). */
export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** `public.skill` (20260826120000_core_schema.sql). */
export const SKILLS = ["speaking", "listening", "vocabulary", "grammar", "reading", "writing"];

/** `knowledge_items.kind` CHECK. */
export const KNOWLEDGE_KINDS = ["vocabulary", "grammar", "topic", "example"];

/** `generated_exercises.type` CHECK. */
export const EXERCISE_TYPES = ["multiple_choice", "fill_blank"];

/** `content_units.kind` CHECK. */
export const UNIT_KINDS = ["front-matter", "chapter", "back-matter"];

/** `knowledge_items.origin` CHECK. */
export const ORIGINS = ["source_derived", "ai_generated"];

/** `roadmap_modules.kind` CHECK. */
export const MODULE_KINDS = ["foundation", "topic"];

/** Pipeline entry modes — `docs/CONTENT_AGENTS.md` §3. */
export const MODES = ["authored", "imported", "assessment-bank"];

/**
 * What the client can actually render today, mirroring `CLIENT_RENDERABLE_TYPES`
 * in `supabase/functions/_shared/mission.ts`. `multiple_choice` → the client's
 * `vocabulary_choice`, `fill_blank` → `vocabulary_recall`. An exercise type
 * outside this set passes `activity-submit` grading and then fails
 * `MissionTaskSchema.parse()` on the device — a failure that surfaces to a
 * learner rather than to us, which is why it is a blocker here.
 */
export const CLIENT_RENDERABLE_EXERCISE_TYPES = ["multiple_choice", "fill_blank"];

/** Severity vocabulary of a QA verdict (§10.2). Only `blocker` withholds APPROVED. */
export const SEVERITIES = ["blocker", "major", "minor"];

export const VERDICTS = ["APPROVED", "REVISION_REQUIRED", "SPEC_DEFECT"];

/** Max revision rounds before the package goes to a human (§9.2). */
export const MAX_REVISION_ROUNDS = 2;

// ---------------------------------------------------------------- helpers

class Report {
  constructor(label) {
    this.label = label;
    this.errors = [];
    this.warnings = [];
  }
  err(where, message) {
    this.errors.push(`${where}: ${message}`);
  }
  warn(where, message) {
    this.warnings.push(`${where}: ${message}`);
  }
  get ok() {
    return this.errors.length === 0;
  }
}

const isPlainObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

function requireEnum(report, where, value, allowed) {
  if (!allowed.includes(value)) {
    report.err(where, `expected one of ${allowed.join(" | ")}, got ${JSON.stringify(value)}`);
    return false;
  }
  return true;
}

function requireString(report, where, value) {
  if (!isNonEmptyString(value)) {
    report.err(where, `must be a non-empty string, got ${JSON.stringify(value)}`);
    return false;
  }
  return true;
}

function requireRange(report, where, value) {
  if (!Array.isArray(value) || value.length !== 2 || !value.every((n) => Number.isInteger(n))) {
    report.err(where, `must be a [min, max] pair of integers, got ${JSON.stringify(value)}`);
    return false;
  }
  if (value[0] > value[1]) {
    report.err(where, `min ${value[0]} is greater than max ${value[1]}`);
    return false;
  }
  return true;
}

/** Words that carry a giveaway even when blanked — see `distractor` checks below. */
const normalize = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N}\s']/gu, " ").replace(/\s+/g, " ").trim();

// ------------------------------------------------------- learning spec

/**
 * Validates a Learning Specification (`content/specs/<slug>.spec.json`).
 * Structural only — whether the objective is *worth* teaching is the QA
 * agent's judgement, not this file's.
 */
export function validateSpec(spec) {
  const r = new Report("spec");
  if (!isPlainObject(spec)) {
    r.err("root", "spec must be an object");
    return r;
  }

  requireString(r, "spec_id", spec.spec_id);
  if (isNonEmptyString(spec.spec_id) && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(spec.spec_id)) {
    r.err("spec_id", `must be a lowercase kebab-case slug, got "${spec.spec_id}"`);
  }
  if (!Number.isInteger(spec.version) || spec.version < 1) {
    r.err("version", `must be an integer >= 1, got ${JSON.stringify(spec.version)}`);
  }
  requireEnum(r, "mode", spec.mode, MODES);

  // --- goal context
  const goal = spec.goal_context;
  if (!isPlainObject(goal)) {
    r.err("goal_context", "missing");
  } else {
    requireString(r, "goal_context.goal_family", goal.goal_family);
    if (!Array.isArray(goal.target_situations) || goal.target_situations.length === 0) {
      r.err("goal_context.target_situations", "at least one target situation is required");
    }
    // A bank item is deliberately topic-neutral (§3.3) — demanding a topic
    // there would reintroduce the defect where the test measured familiarity
    // with interviews instead of language.
    if (spec.mode === "assessment-bank") {
      if (goal.topic_slug != null) {
        r.warn("goal_context.topic_slug", "assessment-bank items should be topic-neutral; a topic here narrows what the test measures");
      }
    } else if (!requireString(r, "goal_context.topic_slug", goal.topic_slug)) {
      // already reported
    }
    if (goal.module_kind != null) requireEnum(r, "goal_context.module_kind", goal.module_kind, MODULE_KINDS);
  }

  // --- scenario
  if (!isPlainObject(spec.scenario)) {
    r.err("scenario", "missing");
  } else {
    requireString(r, "scenario.description", spec.scenario.description);
  }

  // --- level
  const level = spec.level;
  if (!isPlainObject(level)) {
    r.err("level", "missing");
  } else {
    requireEnum(r, "level.cefr", level.cefr, CEFR_LEVELS);
    if (!Number.isInteger(level.difficulty) || level.difficulty < 1 || level.difficulty > 5) {
      r.err("level.difficulty", `must be an integer 1..5, got ${JSON.stringify(level.difficulty)}`);
    }
    if (!Array.isArray(level.calibration_basis) || level.calibration_basis.length === 0) {
      r.err(
        "level.calibration_basis",
        "at least one measurable basis is required — a band asserted without one is exactly the " +
          "'level assigned per book, not per chapter' defect this pipeline exists to stop",
      );
    }
  }

  requireEnum(r, "skill", spec.skill, SKILLS);
  if (!Array.isArray(spec.sub_skills) || spec.sub_skills.length === 0) {
    r.err("sub_skills", "at least one sub-skill is required");
  }

  // --- objectives
  const objectives = spec.learning_objectives;
  if (!Array.isArray(objectives) || objectives.length === 0) {
    r.err("learning_objectives", "at least one objective is required");
  } else {
    const seen = new Set();
    objectives.forEach((lo, i) => {
      const at = `learning_objectives[${i}]`;
      if (!isPlainObject(lo)) {
        r.err(at, "must be an object");
        return;
      }
      if (requireString(r, `${at}.id`, lo.id)) {
        if (seen.has(lo.id)) r.err(`${at}.id`, `duplicate objective id "${lo.id}"`);
        seen.add(lo.id);
      }
      requireString(r, `${at}.statement`, lo.statement);
      requireEnum(r, `${at}.knowledge_kind`, lo.knowledge_kind, KNOWLEDGE_KINDS);
      if (!Array.isArray(lo.target_keys) || lo.target_keys.length === 0) {
        r.err(`${at}.target_keys`, "at least one target key is required");
      }
      const a = lo.assessment;
      if (!isPlainObject(a)) {
        r.err(`${at}.assessment`, "missing — an objective with no assessment criteria is not verifiable");
        return;
      }
      requireString(r, `${at}.assessment.evidence_of_success`, a.evidence_of_success);
      if (!Array.isArray(a.exercise_types) || a.exercise_types.length === 0) {
        r.err(`${at}.assessment.exercise_types`, "at least one exercise type is required");
      } else {
        a.exercise_types.forEach((t, j) => requireEnum(r, `${at}.assessment.exercise_types[${j}]`, t, EXERCISE_TYPES));
      }
      if (!Number.isInteger(a.min_exercises) || a.min_exercises < 1) {
        r.err(`${at}.assessment.min_exercises`, `must be an integer >= 1, got ${JSON.stringify(a.min_exercises)}`);
      }
      if (!Array.isArray(a.out_of_scope)) {
        r.warn(
          `${at}.assessment.out_of_scope`,
          "absent — QA then has no way to know what it must NOT demand, and tends to ask for everything",
        );
      }
    });
  }

  // --- budget
  const budget = spec.content_budget;
  if (!isPlainObject(budget)) {
    r.err("content_budget", "missing");
  } else {
    if (spec.mode !== "assessment-bank") requireRange(r, "content_budget.unit_word_count", budget.unit_word_count);
    if (requireRange(r, "content_budget.tasks_per_lesson", budget.tasks_per_lesson)) {
      // onboarding-v2.md §7.1 — 15..20 tasks in a mission, and the same two
      // numbers as MISSION_MIN_TASKS / MISSION_MAX_TASKS in
      // supabase/functions/_shared/mission.ts. Was 3..5 until 2026-09-08, when
      // the lesson stopped being one link in an unimplemented chain of five
      // and became the whole session; a package still budgeted for the old
      // size fills a quarter of a mission and leaves the rest to be authored
      // on the fly, which is the opposite of why packages exist.
      const [min, max] = budget.tasks_per_lesson;
      if (min < 15 || max > 20) {
        r.warn(
          "content_budget.tasks_per_lesson",
          `${min}..${max} sits outside the 15..20 fixed by onboarding-v2.md §7.1 — state why in the spec if deliberate`,
        );
      }
    }
    requireRange(r, "content_budget.exercises_per_objective", budget.exercises_per_objective);
  }

  // --- provenance
  const prov = spec.provenance;
  if (!isPlainObject(prov)) {
    r.err("provenance", "missing");
  } else {
    requireEnum(r, "provenance.origin", prov.origin, ORIGINS);
    requireString(r, "provenance.source_url", prov.source_url);
    requireString(r, "provenance.license", prov.license);
    if (spec.mode === "authored" && prov.origin !== "ai_generated") {
      r.err(
        "provenance.origin",
        "authored content has no source to quote — everything, examples included, is ai_generated " +
          "(decision of 2026-08-28, docs/plan-tasks.md)",
      );
    }
  }

  if (!isNonEmptyString(spec.coverage_rationale)) {
    r.err(
      "coverage_rationale",
      "required — onboarding-v2.md §6 only admits a topic that actually has material at the needed band, " +
        "and that claim is unverifiable unless recorded with the decision",
    );
  }
  return r;
}

// -------------------------------------------------------- content draft

/**
 * Validates a Content Draft against the spec that ordered it
 * (`content/drafts/<slug>.content.json`). This is gate B (§9.1): everything
 * mechanical is caught here so the QA agent spends its attention on pedagogy.
 */
export function validateDraft(draft, spec) {
  const r = new Report("draft");
  if (!isPlainObject(draft)) {
    r.err("root", "draft must be an object");
    return r;
  }

  if (draft.spec_id !== spec.spec_id) {
    r.err("spec_id", `draft targets "${draft.spec_id}" but spec is "${spec.spec_id}"`);
  }
  if (draft.spec_version !== spec.version) {
    r.err(
      "spec_version",
      `draft was written against spec version ${draft.spec_version}, current is ${spec.version} — ` +
        "a draft against a superseded spec is not reviewable (§9.3)",
    );
  }

  const objectiveIds = new Set((spec.learning_objectives ?? []).map((lo) => lo.id));
  const bankMode = spec.mode === "assessment-bank";

  // --- content unit (not present for bank items: they attach to no chapter)
  let unitWords = 0;
  if (!bankMode) {
    const unit = draft.content_unit;
    if (!isPlainObject(unit)) {
      r.err("content_unit", "missing");
    } else {
      requireString(r, "content_unit.external_id", unit.external_id);
      requireString(r, "content_unit.title", unit.title);
      if (unit.kind != null) requireEnum(r, "content_unit.kind", unit.kind, UNIT_KINDS);
      if (unit.cefr_level !== spec.level?.cefr) {
        r.err(
          "content_unit.cefr_level",
          `is "${unit.cefr_level}" but the spec fixed "${spec.level?.cefr}" — the level is the Learning Agent's ` +
            "decision and the Content Agent may not change it (§4.1)",
        );
      }
      if (!Array.isArray(unit.parsed_blocks) || unit.parsed_blocks.length === 0) {
        r.err("content_unit.parsed_blocks", "at least one block is required");
      } else {
        unit.parsed_blocks.forEach((b, i) => {
          const at = `content_unit.parsed_blocks[${i}]`;
          if (!isPlainObject(b)) return r.err(at, "must be an object");
          if (!["heading", "paragraph", "exercise"].includes(b.type)) {
            r.err(`${at}.type`, `expected heading | paragraph | exercise, got ${JSON.stringify(b.type)}`);
          }
          requireString(r, `${at}.text`, b.text);
          if (isNonEmptyString(b.text)) unitWords += b.text.trim().split(/\s+/).length;
        });
      }
      if (!Array.isArray(unit.topics) || unit.topics.length === 0) {
        r.err("content_unit.topics", "at least one topic slug is required (content_unit_topics)");
      } else if (spec.goal_context?.topic_slug && !unit.topics.includes(spec.goal_context.topic_slug)) {
        r.err("content_unit.topics", `does not include the spec's topic "${spec.goal_context.topic_slug}"`);
      }
      if (Number.isInteger(unit.word_count) && Math.abs(unit.word_count - unitWords) > Math.max(5, unitWords * 0.05)) {
        r.err("content_unit.word_count", `declared ${unit.word_count}, blocks actually contain ${unitWords}`);
      }
      const budget = spec.content_budget?.unit_word_count;
      if (Array.isArray(budget) && (unitWords < budget[0] || unitWords > budget[1])) {
        r.err("content_unit", `text is ${unitWords} words, spec budget is ${budget[0]}..${budget[1]}`);
      }
    }
  }

  // --- knowledge items
  const items = draft.knowledge_items ?? [];
  const keysByKind = new Map();
  if (!bankMode && items.length === 0) r.err("knowledge_items", "at least one item is required");
  items.forEach((it, i) => {
    const at = `knowledge_items[${i}]`;
    if (!isPlainObject(it)) return r.err(at, "must be an object");
    requireEnum(r, `${at}.kind`, it.kind, KNOWLEDGE_KINDS);
    requireString(r, `${at}.dedup_key`, it.dedup_key);
    requireEnum(r, `${at}.origin`, it.origin, ORIGINS);
    if (!isPlainObject(it.data)) r.err(`${at}.data`, "must be an object");
    if (!objectiveIds.has(it.objective_id)) {
      r.err(`${at}.objective_id`, `"${it.objective_id}" is not an objective in this spec (${[...objectiveIds].join(", ")})`);
    }
    if (spec.mode === "authored" && it.origin !== "ai_generated") {
      r.err(`${at}.origin`, "authored content cannot be source_derived — there is no source to quote");
    }
    // Mirrors unique (content_unit_id, kind, dedup_key). A duplicate here does
    // not fail the load: `on conflict do update` silently overwrites the first
    // item with the second, and the package quietly ships one item short.
    const bucket = `${it.kind}::${normalize(it.dedup_key)}`;
    if (keysByKind.has(bucket)) {
      r.err(`${at}.dedup_key`, `duplicates knowledge_items[${keysByKind.get(bucket)}] — the upsert would overwrite it, not add it`);
    }
    keysByKind.set(bucket, i);
  });

  // --- exercises
  const exercises = draft.exercises ?? [];
  const perObjective = new Map();
  const exerciseKeys = new Set();
  exercises.forEach((ex, i) => {
    const at = `exercises[${i}]`;
    if (!isPlainObject(ex)) return r.err(at, "must be an object");
    if (!objectiveIds.has(ex.objective_id)) {
      r.err(`${at}.objective_id`, `"${ex.objective_id}" is not an objective in this spec`);
    } else {
      perObjective.set(ex.objective_id, (perObjective.get(ex.objective_id) ?? 0) + 1);
    }
    if (!requireEnum(r, `${at}.type`, ex.type, EXERCISE_TYPES)) return;
    if (!CLIENT_RENDERABLE_EXERCISE_TYPES.includes(ex.type)) {
      r.err(`${at}.type`, `"${ex.type}" has no client renderer — it would fail MissionTaskSchema.parse() on the device`);
    }

    if (!bankMode) {
      const owner = items.find((it) => it.dedup_key === ex.knowledge_dedup_key);
      if (!owner) {
        r.err(`${at}.knowledge_dedup_key`, `"${ex.knowledge_dedup_key}" matches no knowledge item in this draft`);
      }
      // Mirrors unique (knowledge_item_id, type).
      const key = `${ex.knowledge_dedup_key}::${ex.type}`;
      if (exerciseKeys.has(key)) {
        r.err(at, `a second "${ex.type}" for "${ex.knowledge_dedup_key}" — the upsert keeps only one`);
      }
      exerciseKeys.add(key);
    }

    const p = ex.payload;
    if (!isPlainObject(p)) return r.err(`${at}.payload`, "must be an object");

    if (ex.type === "fill_blank") {
      if (!requireString(r, `${at}.payload.sentence_with_blank`, p.sentence_with_blank)) return;
      const blanks = (p.sentence_with_blank.match(/___/g) ?? []).length;
      if (blanks !== 1) r.err(`${at}.payload.sentence_with_blank`, `must contain exactly one "___", found ${blanks}`);
      if (!Array.isArray(p.accepted_answers) || p.accepted_answers.length === 0) {
        return r.err(`${at}.payload.accepted_answers`, "at least one accepted answer is required");
      }
      const haystack = ` ${normalize(p.sentence_with_blank)} `;
      for (const answer of p.accepted_answers) {
        if (haystack.includes(` ${normalize(answer)} `)) {
          r.err(
            `${at}.payload`,
            `the answer "${answer}" also appears in the sentence itself — the task is solvable by copying`,
          );
        }
      }
    }

    if (ex.type === "multiple_choice") {
      requireString(r, `${at}.payload.prompt`, p.prompt);
      if (!Array.isArray(p.options) || p.options.length < 3) {
        return r.err(`${at}.payload.options`, `at least 3 options are required, got ${p.options?.length ?? 0}`);
      }
      const seen = new Set();
      p.options.forEach((o, j) => {
        if (!isNonEmptyString(o)) r.err(`${at}.payload.options[${j}]`, "must be a non-empty string");
        const n = normalize(o);
        if (seen.has(n)) r.err(`${at}.payload.options[${j}]`, `duplicates another option ("${o}")`);
        seen.add(n);
      });
      if (!Number.isInteger(p.correct_index) || p.correct_index < 0 || p.correct_index >= p.options.length) {
        return r.err(`${at}.payload.correct_index`, `must index into options (0..${p.options.length - 1}), got ${JSON.stringify(p.correct_index)}`);
      }
      // Cheap guard against giving the answer away by shape: the correct option
      // being reliably the longest is a pattern learners find long before we do.
      const correct = String(p.options[p.correct_index]);
      const longest = p.options.reduce((a, b) => (String(b).length > String(a).length ? b : a));
      if (correct === longest && p.options.filter((o) => String(o).length === correct.length).length === 1) {
        r.warn(`${at}.payload`, `the correct option is the longest one — check the set does not cue the answer by shape`);
      }
      if (bankMode && p.options.length < 3) r.err(`${at}.payload.options`, "assessment_questions requires at least 2, this pipeline requires 3");
    }
  });

  // --- objective coverage
  for (const lo of spec.learning_objectives ?? []) {
    const have = perObjective.get(lo.id) ?? 0;
    const need = lo.assessment?.min_exercises ?? 0;
    if (have < need) r.err(`objective ${lo.id}`, `needs ${need} exercises, draft has ${have}`);
    const cap = spec.content_budget?.exercises_per_objective;
    if (Array.isArray(cap) && have > cap[1]) {
      r.warn(`objective ${lo.id}`, `has ${have} exercises, budget caps at ${cap[1]}`);
    }
    if (!bankMode) {
      const covered = items.filter((it) => it.objective_id === lo.id).length;
      if (covered === 0) r.err(`objective ${lo.id}`, "no knowledge item carries this objective");
    }
  }

  // --- lesson budget
  const tasks = spec.content_budget?.tasks_per_lesson;
  if (Array.isArray(tasks) && !bankMode && exercises.length < tasks[0]) {
    r.err("exercises", `${exercises.length} exercises cannot fill a lesson of ${tasks[0]}..${tasks[1]} tasks`);
  }

  return r;
}

// --------------------------------------------------------- SQL emission

/**
 * The guard that cost four failed loads to learn (`docs/plan-tasks.md`): a text
 * fragment like "where you go into a building" reached Postgres as syntax and
 * came back as `relation "a" does not exist`. Proper escaping (§`sqlString`)
 * is the actual fix; this stays as a second pair of eyes, because it caught a
 * second instance ("from X until Y") that review by eye had missed.
 */
const SQL_VOCABULARY = new Set([
  // statement keywords
  "insert", "into", "values", "on", "conflict", "do", "update", "set", "nothing",
  "select", "from", "where", "and", "or", "not", "null", "now", "array", "excluded",
  "public", "as", "true", "false",
  // types and casts
  "text", "jsonb", "uuid", "integer", "smallint", "timestamptz", "cefr_level",
  // tables
  "content_sources", "content_units", "content_unit_topics", "knowledge_items",
  "generated_exercises", "assessment_questions", "topics", "missions",
  // columns
  "id", "title", "author", "source_url", "license", "license_url", "parser",
  "parser_config", "status", "source_id", "external_id", "kind", "position",
  "parsed_blocks", "parsed_at", "word_count", "unit_url", "raw_html", "cefr_level",
  "spec_id", "objective_id", "content_unit_id", "topic_id", "dedup_key", "data",
  "origin", "knowledge_item_id", "type", "payload", "language", "skill", "prompt",
  "options", "correct_index", "difficulty", "slug",
  // aliases used by the reference sub-selects
  "cu", "ki",
]);

/**
 * The guard that four failed loads paid for (`docs/plan-tasks.md`): text like
 * "where you go into a building" reached Postgres as syntax and came back as
 * `relation "a" does not exist`.
 *
 * The heuristic originally written by hand — flag a SQL keyword followed by a
 * short word — cannot be used here: "from the shop" and "into a bag" are
 * ordinary English, so it fires on almost every well-formed sentence and the
 * warning becomes noise nobody reads.
 *
 * This is the exact form of the same check. Strip every quoted literal and
 * every comment, then assert that what remains is nothing but known SQL
 * vocabulary. Prose that escaped its literal shows up as a word that does not
 * belong, named precisely, at emit time rather than at load time.
 */
export function assertNoProseLeak(statement) {
  const skeleton = statement
    .replace(/'(?:[^']|'')*'/g, " ") // quoted literals, doubled quotes included
    .replace(/--[^\n]*/g, " "); // line comments
  for (const token of skeleton.match(/[A-Za-z_][A-Za-z_0-9]*/g) ?? []) {
    if (!SQL_VOCABULARY.has(token.toLowerCase())) {
      throw new Error(
        `"${token}" appears outside a string literal — text has leaked into SQL syntax.\n` +
          `Statement: ${statement.slice(0, 300)}`,
      );
    }
  }
}

/**
 * Single-quoted SQL literal. Doubling the quote is the whole fix for the
 * escaping class of failure; everything else here is about failing loudly on
 * input that could not survive a round trip.
 */
export function sqlString(value) {
  if (value === null || value === undefined) return "null";
  const text = String(value);
  if (text.includes("\0")) throw new Error(`NUL byte in SQL literal: ${text.slice(0, 60)}`);
  return `'${text.replace(/'/g, "''")}'`;
}

export function sqlJson(value) {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

/**
 * Every emitted statement must have balanced quotes. If it does not, escaping
 * failed and the load would fail in Supabase with a message pointing at the
 * wrong place — which is precisely the debugging experience being designed out.
 */
export function assertBalancedQuotes(statement) {
  const quotes = (statement.match(/'/g) ?? []).length;
  if (quotes % 2 !== 0) {
    throw new Error(`unbalanced quotes in emitted SQL:\n${statement.slice(0, 300)}`);
  }
}

export { Report };
