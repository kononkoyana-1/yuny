/**
 * Content pipeline: Source → Raw Content → Parsed Content → Structured
 * Knowledge → Exercises. One file per pipeline stage would scatter a single
 * cohesive flow across several files for no reason — `_shared/mission.ts`
 * already mixes deterministic and AI generation in one module, this follows
 * the same shape.
 *
 * Deliberately not wired to `materials` (learner uploads) or `activities`
 * (per-learner Mission instances) — see the migration comment for why.
 */
import { aiAvailable, aiJson, objectSchema } from "./shared.ts";

// ---------------------------------------------------------------- adapters
//
// A "source" only needs a `parser` key naming one of these. Adding a second
// book on the same platform (Pressbooks powers most Open Oregon / BCcampus
// OER) needs zero code — just a row with a different `book_slug`. A new
// platform needs one new entry here; the tables and every downstream stage
// are untouched.

export interface RawUnit {
  externalId: string;
  kind: "front-matter" | "chapter" | "back-matter";
  partTitle: string | null;
  title: string;
  position: number;
  unitUrl: string;
  html: string;
}

export interface SourceMetadata {
  title: string;
  author: string;
  license: string;
  licenseUrl: string | null;
}

interface Adapter {
  fetchMetadata(config: Record<string, unknown>): Promise<SourceMetadata>;
  fetchUnits(config: Record<string, unknown>): Promise<RawUnit[]>;
}

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
};

/** Network flakiness is the normal case for third-party OER sites, not the exception. */
async function fetchWithRetry(url: string, attempts = 4): Promise<Response> {
  let last: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url, { headers: BROWSER_HEADERS });
      if (response.ok) return response;
      last = new Error(`HTTP ${response.status} fetching ${url}`);
    } catch (error) {
      last = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 1500 * (i + 1)));
  }
  throw last instanceof Error ? last : new Error(`failed to fetch ${url}`);
}

interface PressbooksTocEntry {
  id: number;
  title: string;
  slug: string;
  link: string;
  word_count?: number;
}
interface PressbooksToc {
  "front-matter": PressbooksTocEntry[];
  parts: { title: string; chapters: PressbooksTocEntry[] }[];
  "back-matter": PressbooksTocEntry[];
}

/**
 * Pressbooks (the platform behind Open Oregon, BCcampus, and most CC-licensed
 * OER textbooks). Metadata and the table of contents come from its public
 * REST API; unit content is scraped from the rendered page, because the
 * per-chapter REST endpoint's shape isn't reliable across Pressbooks
 * versions — the rendered HTML is.
 */
const pressbooksAdapter: Adapter = {
  async fetchMetadata(config) {
    const baseUrl = String(config.base_url).replace(/\/$/, "");
    const slug = String(config.book_slug);
    const response = await fetchWithRetry(`${baseUrl}/${slug}/wp-json/pressbooks/v2/metadata`);
    const meta = (await response.json()) as {
      name: string;
      author?: { name: string }[];
      license?: string;
    };
    const author = (meta.author ?? []).map((a) => a.name).join(", ") || "Unknown";

    // The metadata endpoint doesn't carry the license URL directly; read it
    // off the rendered book page, which always states it in plain text.
    const homepage = await fetchWithRetry(`${baseUrl}/${slug}/`);
    const html = await homepage.text();
    const licenseMatch = html.match(/creativecommons\.org\/licenses\/[^"'\s<>]+/);
    const licenseUrl = licenseMatch ? `https://${licenseMatch[0]}` : null;

    return {
      title: meta.name,
      author,
      license: meta.license ?? "See license_url",
      licenseUrl,
    };
  },

  async fetchUnits(config) {
    const baseUrl = String(config.base_url).replace(/\/$/, "");
    const slug = String(config.book_slug);
    const response = await fetchWithRetry(`${baseUrl}/${slug}/wp-json/pressbooks/v2/toc`);
    const toc = (await response.json()) as PressbooksToc;

    const units: Omit<RawUnit, "html">[] = [];
    let position = 0;
    for (const entry of toc["front-matter"] ?? []) {
      units.push({
        externalId: `front-matter-${entry.id}`,
        kind: "front-matter",
        partTitle: null,
        title: entry.title,
        position: position++,
        unitUrl: entry.link,
      });
    }
    for (const part of toc.parts) {
      for (const chapter of part.chapters) {
        units.push({
          externalId: `chapter-${chapter.id}`,
          kind: "chapter",
          partTitle: part.title,
          title: chapter.title,
          position: position++,
          unitUrl: chapter.link,
        });
      }
    }
    for (const entry of toc["back-matter"] ?? []) {
      units.push({
        externalId: `back-matter-${entry.id}`,
        kind: "back-matter",
        partTitle: null,
        title: entry.title,
        position: position++,
        unitUrl: entry.link,
      });
    }

    const withHtml: RawUnit[] = [];
    for (const unit of units) {
      const page = await fetchWithRetry(unit.unitUrl);
      withHtml.push({ ...unit, html: await page.text() });
    }
    return withHtml;
  },
};

const ADAPTERS: Record<string, Adapter> = { pressbooks: pressbooksAdapter };

export function getAdapter(parser: string): Adapter {
  const adapter = ADAPTERS[parser];
  if (!adapter) throw new Error(`no content adapter registered for "${parser}"`);
  return adapter;
}

// -------------------------------------------------------------- parsing
//
// Purely mechanical — headings and paragraphs are unambiguous in Pressbooks'
// rendered HTML, so there's nothing here an AI call would do more reliably
// than a regex walk, and every extra AI call is cost and latency this stage
// doesn't need.

export interface ParsedBlock {
  type: "heading" | "paragraph" | "exercise";
  level?: number;
  text: string;
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8211;|&ndash;/g, "-")
    .replace(/&#8216;|&#8217;|&lsquo;|&rsquo;/g, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Numeric entities the specific replacements above didn't already
    // catch — the FAQ page (richer prose than the thin grammar chapters)
    // surfaced this gap: fewer content shapes exercise this path than
    // exercise the tag-stripping above, but Pressbooks emits them freely
    // in longer text.
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Bounds the region to the chapter's own body: after its title heading
 * (Pressbooks pages open with a sitewide `<h1>` for the book itself, then
 * the chapter's own `<h1>`), before the license attribution block that
 * closes every page.
 */
function extractBodyRegion(html: string): string {
  const licenseIndex = html.indexOf('class="license-attribution"');
  const end = licenseIndex >= 0 ? licenseIndex : html.length;

  const h1Matches = [...html.matchAll(/<h1\b[^>]*>.*?<\/h1>/gis)];
  const bodyStart = h1Matches.length >= 2
    ? h1Matches[h1Matches.length - 1].index! + h1Matches[h1Matches.length - 1][0].length
    : 0;

  return html.slice(bodyStart, end);
}

export function parseUnit(html: string): { blocks: ParsedBlock[]; wordCount: number } {
  const region = extractBodyRegion(html);
  const blocks: ParsedBlock[] = [];

  // Walk headings (h2-h4) and the paragraph text between them, in document
  // order — a single regex pass, not a full HTML parser.
  const headingPattern = /<h([2-4])\b[^>]*>(.*?)<\/h\1>/gis;
  const cursor = { last: 0 };
  let match: RegExpExecArray | null;

  const pushParagraphs = (segment: string) => {
    // Pressbooks wraps prose in <p>; a paragraph block per <p> tag, not per
    // whole segment, so a lesson's several short paragraphs stay distinct.
    const paragraphs = [...segment.matchAll(/<p\b[^>]*>(.*?)<\/p>/gis)].map((m) =>
      stripTags(m[1]),
    );
    for (const text of paragraphs) {
      if (text.length > 0) blocks.push({ type: "paragraph", text });
    }
  };

  while ((match = headingPattern.exec(region)) !== null) {
    pushParagraphs(region.slice(cursor.last, match.index));
    const level = Number(match[1]);
    const text = stripTags(match[2]);
    const isExercise = /^exercise\b/i.test(text);
    blocks.push({ type: isExercise ? "exercise" : "heading", level, text });
    cursor.last = match.index + match[0].length;
  }
  pushParagraphs(region.slice(cursor.last));

  const wordCount = blocks.reduce((sum, block) => sum + block.text.split(/\s+/).filter(Boolean).length, 0);
  return { blocks, wordCount };
}

// --------------------------------------------------------- knowledge extraction

export interface KnowledgeDraft {
  kind: "vocabulary" | "grammar" | "topic" | "example";
  dedupKey: string;
  data: Record<string, unknown>;
  origin: "source_derived" | "ai_generated";
}

/**
 * No AI key: pull what's mechanically there — the unit is itself a topic,
 * chapter titles that look like grammar points are grammar points, and any
 * explicit word list in the text (Pressbooks flip-card instructions spell
 * these out, e.g. "study the words: read, repeat, write, say, listen")
 * becomes vocabulary. Nothing here is invented, so origin is always
 * `source_derived` — the AI branch below is what actually infers.
 */
function deterministicKnowledge(unitTitle: string, blocks: ParsedBlock[]): KnowledgeDraft[] {
  const drafts: KnowledgeDraft[] = [];

  drafts.push({
    kind: "topic",
    dedupKey: unitTitle.toLowerCase().trim(),
    data: { label: unitTitle },
    origin: "source_derived",
  });

  // Titles like "Be and Subject Pronouns" or "Simple Past and Future with
  // Be Verb" are themselves the grammar point being taught.
  if (/\b(verb|pronoun|tense|article|preposition|adjective|question|negative|plural|comparative)\b/i.test(unitTitle)) {
    drafts.push({
      kind: "grammar",
      dedupKey: unitTitle.toLowerCase().trim(),
      data: { point: unitTitle, explanation: `Covered in the "${unitTitle}" lesson.` },
      origin: "source_derived",
    });
  }

  for (const block of blocks) {
    // Not anchored to end-of-string: "study the words: a, b, c. Listen and
    // repeat." has real trailing sentences after the list, so this stops at
    // the first period (or the end) instead of requiring one.
    const wordListMatch = block.text.match(/words?:\s*([a-z, ]+?)(?:\.|$)/i);
    if (wordListMatch) {
      for (const raw of wordListMatch[1].split(",")) {
        const word = raw.trim().toLowerCase();
        if (word.length > 1) {
          drafts.push({
            kind: "vocabulary",
            dedupKey: word,
            data: { word },
            origin: "source_derived",
          });
        }
      }
    }
    if (block.type === "paragraph" && block.text.length > 25) {
      drafts.push({
        kind: "example",
        dedupKey: block.text.toLowerCase().slice(0, 80),
        data: { sentence: block.text },
        origin: "source_derived",
      });
    }
  }

  return drafts;
}

interface AiKnowledgeItem {
  kind: "vocabulary" | "grammar" | "topic" | "example";
  key: string;
  vocabulary_word: string;
  vocabulary_definition: string;
  grammar_point: string;
  grammar_explanation: string;
  topic_label: string;
  example_sentence: string;
}

/**
 * With a key: infer what a lesson like this is actually teaching, since the
 * page text is thin (instructional glue around videos and interactive
 * widgets, not prose) — a human teacher reading "Watch the videos and
 * complete the exercises" plus the chapter title already knows the lesson
 * is about greetings vocabulary and present-tense "be"; this asks the model
 * to make the same inference, structurally.
 */
async function aiKnowledge(
  unitTitle: string,
  partTitle: string | null,
  blocks: ParsedBlock[],
): Promise<KnowledgeDraft[]> {
  const context = blocks.map((b) => `[${b.type}] ${b.text}`).join("\n").slice(0, 4000);

  const { items } = await aiJson<{ items: AiKnowledgeItem[] }>({
    name: "record_knowledge_items",
    description: "Record the vocabulary, grammar points, topics, and examples a lesson teaches.",
    schema: objectSchema(
      {
        items: {
          type: "array",
          minItems: 1,
          maxItems: 12,
          items: objectSchema(
            {
              kind: { type: "string", enum: ["vocabulary", "grammar", "topic", "example"] },
              key: {
                type: "string",
                description: "Short unique identifier for this item, lowercase, e.g. the word itself.",
              },
              vocabulary_word: { type: "string", description: "Set for kind=vocabulary, else empty string." },
              vocabulary_definition: { type: "string", description: "Set for kind=vocabulary, else empty string." },
              grammar_point: { type: "string", description: "Set for kind=grammar, else empty string." },
              grammar_explanation: { type: "string", description: "Set for kind=grammar, else empty string." },
              topic_label: { type: "string", description: "Set for kind=topic, else empty string." },
              example_sentence: { type: "string", description: "Set for kind=example, else empty string." },
            },
            [
              "kind", "key", "vocabulary_word", "vocabulary_definition",
              "grammar_point", "grammar_explanation", "topic_label", "example_sentence",
            ],
          ),
        },
      },
      ["items"],
    ),
    system:
      "You are cataloguing a beginner ESOL lesson for a language-learning app. The lesson " +
      "page itself is thin (it links out to videos and interactive widgets), so infer what " +
      "a lesson with this title and this surrounding text is actually teaching, the way an " +
      "ESOL teacher would recognise it on sight. Prefer vocabulary and grammar an absolute " +
      "beginner would encounter first. Every example must be a complete, natural sentence " +
      "using the target language point — never a fragment.",
    prompt:
      `Lesson: "${unitTitle}"${partTitle ? ` (part of "${partTitle}")` : ""}\n\nPage content:\n${context}`,
    maxTokens: 3000,
  });

  return items
    .filter((item) => ["vocabulary", "grammar", "topic", "example"].includes(item.kind))
    .map((item): KnowledgeDraft => {
      const dedupKey = item.key.toLowerCase().trim() || item.kind;
      switch (item.kind) {
        case "vocabulary":
          return {
            kind: "vocabulary",
            dedupKey,
            data: { word: item.vocabulary_word, definition: item.vocabulary_definition },
            origin: "ai_generated",
          };
        case "grammar":
          return {
            kind: "grammar",
            dedupKey,
            data: { point: item.grammar_point, explanation: item.grammar_explanation },
            origin: "ai_generated",
          };
        case "topic":
          return {
            kind: "topic",
            dedupKey,
            data: { label: item.topic_label },
            origin: "ai_generated",
          };
        default:
          return {
            kind: "example",
            dedupKey,
            data: { sentence: item.example_sentence },
            origin: "ai_generated",
          };
      }
    })
    .filter((draft) => Object.values(draft.data).every((v) => typeof v === "string" && v.length > 0));
}

export async function extractKnowledge(
  unitTitle: string,
  partTitle: string | null,
  blocks: ParsedBlock[],
): Promise<KnowledgeDraft[]> {
  if (!aiAvailable()) return deterministicKnowledge(unitTitle, blocks);
  try {
    const items = await aiKnowledge(unitTitle, partTitle, blocks);
    return items.length > 0 ? items : deterministicKnowledge(unitTitle, blocks);
  } catch {
    // The pipeline must still make progress on a single bad AI response —
    // fall back rather than failing the whole unit.
    return deterministicKnowledge(unitTitle, blocks);
  }
}

// --------------------------------------------------------- exercise generation

export interface ExerciseDraft {
  type: "multiple_choice" | "fill_blank";
  payload: Record<string, unknown>;
}

function deterministicExercise(
  kind: KnowledgeDraft["kind"],
  data: Record<string, unknown>,
): ExerciseDraft | null {
  if (kind === "vocabulary") {
    const word = String(data.word ?? "");
    if (!word) return null;
    const definition = typeof data.definition === "string" ? data.definition : null;
    // Only phrase it as "the word that means X" when a real definition
    // exists — without one, that framing is circular ("the word for a word
    // meaning word"). A word-derived deterministic item genuinely has no
    // definition, so fall back to what's actually known: it was on the
    // lesson's study list.
    return {
      type: "fill_blank",
      payload: {
        sentence_with_blank: definition
          ? `The word that means "${definition}" is ___.`
          : "One of the words from this lesson's study list is: ___.",
        accepted_answers: [word],
      },
    };
  }
  if (kind === "grammar") {
    const point = String(data.point ?? "");
    if (!point) return null;
    return {
      type: "multiple_choice",
      payload: {
        prompt: `Which lesson covers "${point}"?`,
        options: [point, "Vocabulary review", "Pronunciation practice", "Listening comprehension"],
        correct_index: 0,
      },
    };
  }
  return null;
}

async function aiExercise(
  kind: KnowledgeDraft["kind"],
  data: Record<string, unknown>,
): Promise<ExerciseDraft | null> {
  if (kind === "topic") return null;

  const type = kind === "vocabulary" ? "fill_blank" : "multiple_choice";

  if (type === "fill_blank") {
    const { sentence_with_blank, answer } = await aiJson<{
      sentence_with_blank: string;
      answer: string;
    }>({
      name: "record_fill_blank",
      description: "Write a fill-in-the-blank exercise for one vocabulary word.",
      schema: objectSchema(
        {
          sentence_with_blank: {
            type: "string",
            description: 'A natural sentence using the word, with it replaced by "___".',
          },
          answer: { type: "string", description: "The exact word that fills the blank." },
        },
        ["sentence_with_blank", "answer"],
      ),
      system:
        "You write beginner ESOL fill-in-the-blank exercises. One short, natural sentence. " +
        "The blank must have exactly one correct, unambiguous answer.",
      prompt: `Word: "${data.word}"\nDefinition: "${data.definition ?? ""}"`,
      maxTokens: 500,
    });
    if (!sentence_with_blank.includes("___") || !answer) return null;
    return {
      type: "fill_blank",
      payload: { sentence_with_blank, accepted_answers: [answer] },
    };
  }

  const { prompt, options, correct_index } = await aiJson<{
    prompt: string;
    options: string[];
    correct_index: number;
  }>({
    name: "record_multiple_choice",
    description: "Write a multiple-choice exercise testing one grammar point.",
    schema: objectSchema(
      {
        prompt: { type: "string", description: "A short question or fill-in sentence." },
        options: { type: "array", minItems: 3, maxItems: 4, items: { type: "string" } },
        correct_index: { type: "integer" },
      },
      ["prompt", "options", "correct_index"],
    ),
    system:
      "You write beginner ESOL multiple-choice grammar exercises. Exactly one option correct, " +
      "the rest plausible mistakes a beginner would actually make.",
    prompt: `Grammar point: "${data.point}"\nExplanation: "${data.explanation ?? ""}"`,
    maxTokens: 600,
  });
  if (options.length < 2 || correct_index < 0 || correct_index >= options.length) return null;
  return { type: "multiple_choice", payload: { prompt, options, correct_index } };
}

export async function generateExercise(item: KnowledgeDraft): Promise<ExerciseDraft | null> {
  if (!aiAvailable()) return deterministicExercise(item.kind, item.data);
  try {
    const draft = await aiExercise(item.kind, item.data);
    return draft ?? deterministicExercise(item.kind, item.data);
  } catch {
    return deterministicExercise(item.kind, item.data);
  }
}
