#!/usr/bin/env node
/**
 * What to author next, counted from real demand rather than guessed from the
 * taxonomy.
 *
 * The taxonomy has 21 topics and six bands. Authoring against that grid means
 * 126 packages, most of which no learner will ever be routed to. This report
 * asks the opposite question: which (topic, band) pairs did real goals ask
 * for, and which of those have nothing behind them.
 *
 * Demand comes from `goal_topics` — the list `analyzeGoal` produced and
 * `goal-confirm` now records — spread across the band range each goal spans,
 * from what the assessment measured to what the goal needs. That range is the
 * same one `buildRoadmap` walks, so the report describes the route the learner
 * would actually be given.
 *
 * Coverage is counted exactly the way `_shared/roadmap.ts:readCoverage` counts
 * it: validated `knowledge_items` in content units tagged with the topic and
 * levelled at that band, at least MIN_ITEMS_PER_MODULE of them. Duplicating
 * the rule is the point — if this report and the roadmap disagreed about what
 * "covered" means, the backlog would be fiction.
 *
 * Read-only. It never writes, and it is not a queue: nothing here tracks
 * whether a package was written. What exists is recounted on every run, so
 * the report cannot drift out of step with the database.
 *
 * Usage:
 *   SUPABASE_URL=https://<ref>.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/content-gaps.mjs [--all]
 *
 *   --all   also list pairs that are already covered, not just the gaps.
 *
 * Dependency-free on purpose, like the other scripts here: it must run before
 * anything is installed.
 */

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set.");
  console.error("The service role key is required: `goal_topics`, `topics` and the");
  console.error("content tables are all service-role only (RLS on, no policies).");
  console.error("Dashboard → Project Settings → API → service_role.");
  process.exit(1);
}

const showAll = process.argv.includes("--all");

/** Must match `_shared/roadmap.ts`. A module needs somewhere to send the learner. */
const MIN_ITEMS_PER_MODULE = 2;
const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

/**
 * PostgREST reads, paged. The default ceiling is 1000 rows and silently
 * truncating `knowledge_items` would understate coverage — which turns into a
 * backlog entry for content that already exists, the one error this report
 * must not make.
 */
async function select(table, query) {
  const rows = [];
  const pageSize = 1000;

  for (let offset = 0; ; offset += pageSize) {
    const response = await fetch(`${url}/rest/v1/${table}?${query}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Range: `${offset}-${offset + pageSize - 1}`,
        "Range-Unit": "items",
      },
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      throw new Error(`${table}: HTTP ${response.status} ${detail}`);
    }

    const page = await response.json();
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

function bandRange(from, to) {
  const a = CEFR_ORDER.indexOf(from);
  const b = CEFR_ORDER.indexOf(to);
  if (a < 0 || b < 0) return [];
  return CEFR_ORDER.slice(Math.min(a, b), Math.max(a, b) + 1);
}

const [topics, goals, states, demand, units, links, items] = await Promise.all([
  select("topics", "select=id,slug,label"),
  select("goals", "select=id,title,status,required_cefr"),
  select("learning_states", "select=goal_id,assessed_cefr"),
  select("goal_topics", "select=goal_id,topic_id"),
  select("content_units", "select=id,cefr_level"),
  select("content_unit_topics", "select=topic_id,content_unit_id"),
  select("knowledge_items", "select=content_unit_id&status=eq.validated"),
]);

// ------------------------------------------------------------- coverage

const validatedByUnit = new Map();
for (const item of items) {
  validatedByUnit.set(item.content_unit_id, (validatedByUnit.get(item.content_unit_id) ?? 0) + 1);
}

const levelByUnit = new Map(units.filter((u) => u.cefr_level).map((u) => [u.id, u.cefr_level]));

/** `${topic_id}\t${band}` → validated item count. */
const covered = new Map();
for (const link of links) {
  const band = levelByUnit.get(link.content_unit_id);
  if (!band) continue;
  const count = validatedByUnit.get(link.content_unit_id) ?? 0;
  const cell = `${link.topic_id}\t${band}`;
  covered.set(cell, (covered.get(cell) ?? 0) + count);
}

// --------------------------------------------------------------- demand

const assessedByGoal = new Map(states.map((s) => [s.goal_id, s.assessed_cefr]));
const goalById = new Map(goals.map((g) => [g.id, g]));
const topicById = new Map(topics.map((t) => [t.id, t]));

/** `${topic_id}\t${band}` → { goals: Set, titles: [] } */
const wanted = new Map();
let goalsWithoutRange = 0;

for (const row of demand) {
  const goal = goalById.get(row.goal_id);
  if (!goal || !goal.required_cefr) continue;

  // No assessment yet means no measured floor; the goal still demands its own
  // required band, so it counts there rather than being dropped.
  const assessed = assessedByGoal.get(row.goal_id);
  const bands = assessed
    ? bandRange(assessed, goal.required_cefr)
    : [goal.required_cefr];
  if (!assessed) goalsWithoutRange += 1;

  for (const band of bands) {
    const cell = `${row.topic_id}\t${band}`;
    const entry = wanted.get(cell) ?? { goals: new Set(), titles: new Set() };
    entry.goals.add(row.goal_id);
    entry.titles.add(goal.title);
    wanted.set(cell, entry);
  }
}

// --------------------------------------------------------------- report

const rows = [...wanted.entries()]
  .map(([cell, entry]) => {
    const [topicId, band] = cell.split("\t");
    return {
      topic: topicById.get(topicId),
      band,
      have: covered.get(cell) ?? 0,
      learners: entry.goals.size,
      titles: [...entry.titles],
    };
  })
  .filter((row) => row.topic)
  .filter((row) => showAll || row.have < MIN_ITEMS_PER_MODULE)
  // Most learners blocked first; then the lowest band, because a gap low in
  // the ladder blocks everything stacked above it.
  .sort(
    (a, b) =>
      b.learners - a.learners ||
      CEFR_ORDER.indexOf(a.band) - CEFR_ORDER.indexOf(b.band) ||
      a.topic.slug.localeCompare(b.topic.slug),
  );

const activeGoals = goals.filter((g) => g.status === "active").length;

console.log("");
console.log(`Goals: ${goals.length} (${activeGoals} active) · demand rows: ${demand.length}`);
console.log(`Topics: ${topics.length} · validated knowledge items: ${items.length}`);
console.log("");

if (demand.length === 0) {
  console.log("No demand recorded yet.");
  console.log("`goal_topics` is written by `goal-confirm`, so it fills from the next");
  console.log("goal confirmed after that function was deployed — goals confirmed");
  console.log("earlier are not backfilled: their analysis is in the job payload and");
  console.log("would have to be replayed to be trusted.");
  process.exit(0);
}

if (rows.length === 0) {
  console.log("Every requested (topic, band) pair is covered. Nothing to author.");
  process.exit(0);
}

console.log(showAll ? "Requested pairs:" : `Gaps (fewer than ${MIN_ITEMS_PER_MODULE} validated items):`);
console.log("");
console.log("  learners  band  have  topic");
for (const row of rows) {
  const flag = row.have < MIN_ITEMS_PER_MODULE ? " " : "✓";
  console.log(
    `${flag} ${String(row.learners).padStart(8)}  ${row.band.padEnd(4)}  ` +
      `${String(row.have).padStart(4)}  ${row.topic.slug} — ${row.topic.label}`,
  );
}
console.log("");

if (goalsWithoutRange > 0) {
  console.log(
    `${goalsWithoutRange} demand rows belong to goals with no assessment yet; they are` +
      ` counted at their required band only.`,
  );
}
console.log("A gap is not a verdict on the topic — it is a package to write:");
console.log("  learning-agent → content-agent → content-qa-agent → scripts/content-emit.mjs");
