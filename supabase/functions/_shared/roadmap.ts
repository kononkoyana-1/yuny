/**
 * Roadmap construction (docs/onboarding-v2.md §6).
 *
 * The split here is the whole design. AI answers exactly one question — which
 * of the canonical topics this particular goal is about, and what to say to
 * the learner about each — because relevance is a judgement about meaning.
 * Everything that decides what the learner actually gets is ordinary code:
 * which topics have material at the needed bands, whether a foundation block
 * goes in front, what order the modules run in, and which single module is
 * open. Those are educational decisions with a definable right answer, and
 * TZ.md §3 Rule 1 keeps them where they can be read, tested, and repeated.
 *
 * That division also survives the AI being unavailable: without a key the
 * relevance step falls back to the goal's own declared topics and the map is
 * still built. A learner never lands on an empty screen because a provider
 * was down.
 */
import { CEFR_ORDER, type CefrLevel } from "./cefr.ts";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.112.4";
import { aiAvailable, aiJson, objectSchema } from "./shared.ts";

/**
 * A module needs somewhere to send the learner, and the shortest honest test
 * of that is: does this topic have reviewed material at this band. It counts
 * validated `knowledge_items`, not exercises, because a mission is built from
 * knowledge items — `mission-generate` can reach them through the content
 * path or fall back to authoring around them, and both produce a real lesson.
 * Counting exercises instead would describe how one generator currently works
 * rather than whether anything is there to teach.
 */
const MIN_ITEMS_PER_MODULE = 2;

/** Beyond this the map stops being a route and starts being a catalogue. */
const MAX_MODULES = 8;

/**
 * A gap of two bands or more is not something topic modules close on the way
 * past — the learner is missing the ground the topics stand on, so foundation
 * modules go in front (§6 rule 3).
 */
const FOUNDATION_GAP = 2;

export interface TopicCoverage {
  topic_id: string;
  slug: string;
  label: string;
  /** Bands where this topic has at least `MIN_ITEMS_PER_MODULE` validated items. */
  levels: CefrLevel[];
}

export interface RoadmapModuleDraft {
  topic_id: string | null;
  position: number;
  title: string;
  why: string;
  target_cefr: CefrLevel;
  kind: "foundation" | "topic";
  status: "locked" | "available" | "in_progress" | "completed";
}

function index(level: CefrLevel): number {
  return CEFR_ORDER.indexOf(level);
}

/** Inclusive band window between where the learner is and where the goal is. */
function bandRange(from: CefrLevel, to: CefrLevel): CefrLevel[] {
  const low = Math.min(index(from), index(to));
  const high = Math.max(index(from), index(to));
  return CEFR_ORDER.slice(low, high + 1) as unknown as CefrLevel[];
}

// ------------------------------------------------------------- coverage

/**
 * What the content pipeline can actually teach, per topic and band.
 *
 * Deliberately one query over the join rather than a per-topic loop: the
 * roadmap is built inside the assessment job, where the learner is already
 * watching a spinner, and 21 round trips would be paid on every onboarding.
 */
export async function readCoverage(
  admin: SupabaseClient,
  bands: CefrLevel[],
): Promise<TopicCoverage[]> {
  const { data: topics } = await admin.from("topics").select("id, slug, label");
  const topicRows = (topics ?? []) as { id: string; slug: string; label: string }[];
  if (topicRows.length === 0) return [];

  // Three plain queries rather than one with a filter on an embedded resource.
  // The embedded form is shorter, but its failure mode is an empty result set
  // that looks exactly like "no content yet" — and a roadmap that is silently
  // always empty is the one bug here that would never announce itself.
  const { data: units } = await admin
    .from("content_units")
    .select("id, cefr_level")
    .in("cefr_level", bands);
  const levelByUnit = new Map<string, CefrLevel>(
    ((units ?? []) as { id: string; cefr_level: CefrLevel }[]).map((u) => [u.id, u.cefr_level]),
  );
  if (levelByUnit.size === 0) return [];

  const { data: links } = await admin
    .from("content_unit_topics")
    .select("topic_id, content_unit_id")
    .in("content_unit_id", [...levelByUnit.keys()]);

  const unitsByTopic = new Map<string, Map<string, CefrLevel>>();
  for (const row of (links ?? []) as { topic_id: string; content_unit_id: string }[]) {
    const level = levelByUnit.get(row.content_unit_id);
    if (!level) continue;
    const perTopic = unitsByTopic.get(row.topic_id) ?? new Map<string, CefrLevel>();
    perTopic.set(row.content_unit_id, level);
    unitsByTopic.set(row.topic_id, perTopic);
  }

  const allUnitIds = [...new Set([...unitsByTopic.values()].flatMap((m) => [...m.keys()]))];
  if (allUnitIds.length === 0) return [];

  // `status = 'validated'` is the same gate `missionFromContent` enforces
  // (docs/CONTENT_AGENTS.md §5.6). A roadmap built on unreviewed material
  // would promise modules the mission generator is forbidden to open.
  const { data: items } = await admin
    .from("knowledge_items")
    .select("content_unit_id")
    .in("content_unit_id", allUnitIds)
    .eq("status", "validated");

  const itemsPerUnit = new Map<string, number>();
  for (const row of (items ?? []) as { content_unit_id: string }[]) {
    itemsPerUnit.set(row.content_unit_id, (itemsPerUnit.get(row.content_unit_id) ?? 0) + 1);
  }

  return topicRows
    .map((topic) => {
      const perBand = new Map<CefrLevel, number>();
      for (const [unitId, level] of unitsByTopic.get(topic.id) ?? []) {
        perBand.set(level, (perBand.get(level) ?? 0) + (itemsPerUnit.get(unitId) ?? 0));
      }
      const levels = bands.filter((band) => (perBand.get(band) ?? 0) >= MIN_ITEMS_PER_MODULE);
      return { topic_id: topic.id, slug: topic.slug, label: topic.label, levels };
    })
    .filter((coverage) => coverage.levels.length > 0);
}

// ------------------------------------------------------------ relevance

export interface RelevantTopic {
  slug: string;
  /** Learner-facing reason this topic is on the route (TZ.md §16). */
  why: string;
}

/**
 * The one AI judgement in this file: of the topics that *can* be taught,
 * which ones does this goal need, in what order, and why. The model chooses
 * from `covered` only — it is never asked what content ought to exist, which
 * is how a map ends up promising a module with nothing behind it.
 */
export async function rankTopics(
  goal: { title: string; situations: string[]; outcomes: string[] },
  covered: TopicCoverage[],
): Promise<RelevantTopic[]> {
  const slugs = covered.map((topic) => topic.slug);
  if (slugs.length === 0) return [];

  if (!aiAvailable()) {
    // Word overlap between the goal's own text and the topic slugs. Crude, and
    // it only reorders a list every entry of which is already teachable — so
    // the worst case is a sensible route in a less useful order, never a
    // module with nothing behind it.
    const words = new Set(
      [goal.title, ...goal.situations, ...goal.outcomes]
        .join(" ")
        .toLowerCase()
        .match(/[a-z]+/g) ?? [],
    );
    const score = (slug: string) =>
      slug.split("-").filter((part) => part.length > 3 && words.has(part)).length;
    return [...slugs]
      .sort((a, b) => score(b) - score(a))
      .slice(0, MAX_MODULES)
      .map((slug) => ({ slug, why: `Part of what "${goal.title}" asks you to handle.` }));
  }

  const ranked = await aiJson<{ topics: RelevantTopic[] }>({
    name: "rank_goal_topics",
    description:
      "Choose and order the topics a learner must work through to reach their goal.",
    schema: objectSchema(
      {
        topics: {
          type: "array",
          minItems: 1,
          maxItems: MAX_MODULES,
          items: objectSchema(
            {
              slug: { type: "string", enum: slugs, description: "One of the available topics." },
              why: {
                type: "string",
                description:
                  "One sentence to the learner about why this belongs in their route. " +
                  "Warm and concrete; address them as 'you'; no jargon, no level codes.",
              },
            },
            ["slug", "why"],
          ),
        },
      },
      ["topics"],
    ),
    system:
      "You plan a learner's route to a language goal. Choose only topics that genuinely " +
      "serve the goal — a short honest route beats a long padded one. Order them so " +
      "earlier topics support later ones. Write to the learner directly, warmly and " +
      "plainly; never mention models, levels, or the system itself.",
    prompt:
      `Goal: ${goal.title}\n` +
      `Situations the learner needs to handle:\n${goal.situations.map((s) => `- ${s}`).join("\n")}\n` +
      `Outcomes they are working towards:\n${goal.outcomes.map((o) => `- ${o}`).join("\n")}\n` +
      `Topics available to teach: ${slugs.join(", ")}`,
    maxTokens: 2000,
  });

  const allowed = new Set(slugs);
  const seen = new Set<string>();
  return ranked.topics.filter((topic) => {
    if (!allowed.has(topic.slug) || seen.has(topic.slug)) return false;
    seen.add(topic.slug);
    return true;
  });
}

// ------------------------------------------------------------- assembly

/**
 * Turns coverage + relevance into the ordered module list, applying §6 rules
 * 3 and 4 and the status rule. Pure: no I/O, so the ordering and the statuses
 * can be reasoned about and tested without a database.
 *
 * Ordering is by band first, then foundation before topics inside a band,
 * then relevance. Band first is deliberate and it is not the same as "most
 * relevant first": a B2 module the learner cannot yet read is not more useful
 * for being more relevant.
 */
export function assembleRoadmap(options: {
  assessed: CefrLevel;
  required: CefrLevel;
  coverage: TopicCoverage[];
  ranked: RelevantTopic[];
}): RoadmapModuleDraft[] {
  const byslug = new Map(options.coverage.map((topic) => [topic.slug, topic]));
  const from = index(options.assessed);
  const to = index(options.required);

  /**
   * Foundation and topic modules are planned into one list and sorted
   * together. Rule 3 decides *whether* foundation belongs on the route; the
   * band decides *where*.
   *
   * The alternative — every foundation module in front, as §6 rule 4 was
   * first written — produced routes that read wrong to the person walking
   * them. A learner measured at A2 with a B2 goal got "Foundations: A2",
   * "Foundations: B1", then two topic modules at A2: climb to B1, then come
   * back down. Each module was individually correct and the sequence was
   * still nonsense.
   */
  const planned: { draft: Omit<RoadmapModuleDraft, "position">; band: CefrLevel; rank: number }[] =
    [];

  // Rule 3. Foundation is not a separate product — it is a stretch of this
  // same route (§6), so it is `kind='foundation'` here and nothing else.
  if (to - from >= FOUNDATION_GAP) {
    for (let step = 0; step < FOUNDATION_GAP && from + step < to; step += 1) {
      const band = CEFR_ORDER[from + step] as CefrLevel;
      planned.push({
        band,
        // Foundation sorts ahead of topics in its own band: the ground comes
        // before what is built on it, which is what rule 3 is actually for.
        rank: -1,
        draft: {
          topic_id: null,
          title: `Foundations: ${band}`,
          why:
            "Your goal asks for more than where you are right now, so we start by " +
            "building the ground it stands on. This part goes quickly.",
          target_cefr: band,
          kind: "foundation",
          status: "locked",
        },
      });
    }
  }

  /**
   * Topics are capped so that trimming to `MAX_MODULES` can never drop a
   * foundation module. Foundation is structural — rule 3 put it there because
   * the learner cannot reach the goal without it — whereas the eighth topic
   * is the least relevant thing on the route. Capping after the merge would
   * let a high-band foundation fall off the end, which is the one trim that
   * changes what the route means.
   */
  const topicBudget = Math.max(0, MAX_MODULES - planned.length);
  const topics: { topic: TopicCoverage; why: string; band: CefrLevel; relevance: number }[] = [];
  options.ranked.forEach((relevant, relevance) => {
    const topic = byslug.get(relevant.slug);
    if (!topic) return;
    // The lowest band the learner can already work at is where the topic
    // starts: a module exists to be entered, not to be admired from below.
    const band = topic.levels[0];
    if (band === undefined) return;
    topics.push({ topic, why: relevant.why, band, relevance });
  });

  for (const entry of topics.slice(0, topicBudget)) {
    planned.push({
      band: entry.band,
      rank: entry.relevance,
      draft: {
        topic_id: entry.topic.topic_id,
        title: entry.topic.label,
        why: entry.why,
        target_cefr: entry.band,
        kind: "topic",
        status: "locked",
      },
    });
  }

  planned.sort((a, b) => index(a.band) - index(b.band) || a.rank - b.rank);

  const drafts = planned
    .slice(0, MAX_MODULES)
    .map((entry, position) => ({ ...entry.draft, position }));

  // Exactly one module is open, the next is visible, the rest are shut. The
  // client renders this; it never computes it (TZ.md §3 Rule 1).
  if (drafts[0]) drafts[0].status = "in_progress";
  if (drafts[1]) drafts[1].status = "available";

  return drafts;
}

// ------------------------------------------------------------- entry point

/**
 * Builds and stores the route for one goal. Returns the module count so the
 * caller can record what was actually produced — an empty route is a real
 * outcome (no reviewed material at the learner's bands yet), not a failure,
 * and it is worth being able to see how often it happens.
 *
 * Idempotent by deletion: rebuilding replaces the route rather than appending
 * to it. `roadmap_modules` has `unique (goal_id, position)`, so a second run
 * that merely inserted would collide, and a partially-updated route is worse
 * than a rebuilt one.
 */
export async function buildRoadmap(
  admin: SupabaseClient,
  options: {
    userId: string;
    goalId: string;
    goalTitle: string;
    situations: string[];
    outcomes: string[];
    assessed: CefrLevel;
    required: CefrLevel;
  },
): Promise<number> {
  const bands = bandRange(options.assessed, options.required);
  const coverage = await readCoverage(admin, bands);
  const ranked = await rankTopics(
    { title: options.goalTitle, situations: options.situations, outcomes: options.outcomes },
    coverage,
  );

  const drafts = assembleRoadmap({
    assessed: options.assessed,
    required: options.required,
    coverage,
    ranked,
  });
  if (drafts.length === 0) return 0;

  await admin.from("roadmap_modules").delete().eq("goal_id", options.goalId);

  const { error } = await admin.from("roadmap_modules").insert(
    drafts.map((draft) => ({ user_id: options.userId, goal_id: options.goalId, ...draft })),
  );
  if (error) {
    console.error("roadmap_insert_failed", options.goalId, error.message);
    return 0;
  }

  return drafts.length;
}
