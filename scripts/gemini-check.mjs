#!/usr/bin/env node
/**
 * Checks a Google AI Studio key before it is put into Edge Function secrets.
 *
 * Answers the three questions that otherwise get answered by a failed
 * onboarding run in production:
 *   1. does the key work at all;
 *   2. which model ids does it actually reach — the name on the pricing page
 *      and the name the API accepts are not reliably the same string;
 *   3. does the chosen model honour `responseSchema`, which is the whole
 *      basis of `aiJson` returning a structure instead of prose.
 *
 * Usage:
 *   GEMINI_API_KEY=... node scripts/gemini-check.mjs
 *   GEMINI_API_KEY=... node scripts/gemini-check.mjs gemini-3.5-flash
 *
 * Dependency-free on purpose: this runs before anything is configured, so it
 * must not need an install step (same reason as scripts/content-*.mjs).
 */

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";

/** Must match the default in supabase/functions/_shared/shared.ts. */
const DEFAULT_MODEL = "gemini-3.5-flash";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set.");
  console.error("Issue one at https://aistudio.google.com/apikey, then:");
  console.error("  GEMINI_API_KEY=... node scripts/gemini-check.mjs");
  process.exit(1);
}

const requested = process.argv[2] ?? process.env.GEMINI_MODEL ?? null;

async function call(path, init = {}) {
  const response = await fetch(`${ENDPOINT}/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey, ...init.headers },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} on ${path}\n${text.slice(0, 600)}`);
  }
  return JSON.parse(text);
}

/** `models/gemini-3.5-flash` -> `gemini-3.5-flash`. */
function shortName(name) {
  return name.replace(/^models\//, "");
}

async function listModels() {
  const names = [];
  let pageToken = "";
  // The list is paginated and the flash models are not reliably on page one.
  do {
    const page = await call(`models?pageSize=200${pageToken ? `&pageToken=${pageToken}` : ""}`);
    for (const model of page.models ?? []) {
      if ((model.supportedGenerationMethods ?? []).includes("generateContent")) {
        names.push(shortName(model.name));
      }
    }
    pageToken = page.nextPageToken ?? "";
  } while (pageToken);
  return names;
}

/**
 * One real structured-output round trip. The schema is written in Gemini's
 * own dialect (upper-case types, no `additionalProperties`) because that is
 * what `toGeminiSchema` in supabase/functions/_shared/shared.ts emits — if
 * this shape is rejected, the gateway would be rejected too.
 */
async function probe(model) {
  const data = await call(`models/${model}:generateContent`, {
    method: "POST",
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: "You classify short phrases by CEFR band. Answer only through the schema." }],
      },
      contents: [
        { role: "user", parts: [{ text: 'Phrase: "I would rather have gone by train."' }] },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            level: { type: "STRING", enum: ["A1", "A2", "B1", "B2", "C1", "C2"] },
            reason: { type: "STRING", description: "One short sentence." },
          },
          required: ["level", "reason"],
          propertyOrdering: ["level", "reason"],
        },
        maxOutputTokens: 2048,
      },
    }),
  });

  const candidate = data.candidates?.[0];
  const text = (candidate?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
  return { finishReason: candidate?.finishReason, text, usage: data.usageMetadata };
}

const models = await listModels();
console.log(`key works — ${models.length} models accept generateContent\n`);

const flash = models.filter((name) => name.includes("flash"));
console.log("flash models reachable with this key:");
for (const name of flash) console.log(`  ${name}`);
if (flash.length === 0) console.log("  (none — the key may be restricted)");

const model = requested ?? (models.includes(DEFAULT_MODEL) ? DEFAULT_MODEL : flash[0]);
if (!model) {
  console.error("\nNo usable model found. Pass one explicitly as an argument.");
  process.exit(1);
}

if (requested && !models.includes(requested)) {
  console.error(`\n"${requested}" is not in this key's model list — the call below will likely 404.`);
}

console.log(`\nstructured-output probe on ${model}`);
const result = await probe(model);
console.log(`  finishReason: ${result.finishReason}`);
console.log(`  response:     ${result.text}`);
if (result.usage) {
  console.log(
    `  tokens:       ${result.usage.promptTokenCount} in, ` +
      `${result.usage.candidatesTokenCount ?? 0} out, ` +
      `${result.usage.thoughtsTokenCount ?? 0} thinking`,
  );
}

let parsed;
try {
  parsed = JSON.parse(result.text);
} catch {
  console.error("\n✗ Response is not JSON — responseSchema is not being honoured.");
  process.exit(1);
}

if (result.finishReason !== "STOP" || typeof parsed.level !== "string") {
  console.error("\n✗ Schema not satisfied. Do not use this model for aiJson.");
  process.exit(1);
}

console.log(`\n✓ ${model} honours responseSchema. Set it as GEMINI_MODEL:`);
console.log(`    supabase secrets set GEMINI_API_KEY=… GEMINI_MODEL=${model}`);
