# Yuny backend (Supabase)

Project ref `ixtfifglohppaimvyvui` · `https://ixtfifglohppaimvyvui.supabase.co`

Implements TZ.md §12 (data model) and §13 (client ↔ backend contract). The
client selects this backend with `EXPO_PUBLIC_DATA_SOURCE=supabase`; with
`mock` it never touches the network.

Функции прежнего продукта удалены вместе с ним (TZ.md §16). Сейчас здесь
только `_shared/shared.ts` — обёртка CORS + ошибок + авторизации и шлюз к
Gemini; функции нового продукта (`module-create`, `module-parse`,
`lesson-generate`, `task-submit`, `dictionary-search`) приезжают в фазах 2-6.

## Layout

```
migrations/   applied in filename order; the schema of record
functions/    one folder per Edge Function from TZ.md §13
  _shared/    runtime shared by all of them (see below)
```

Имена файлов миграций совпадают с версиями, записанными в `supabase_migrations`
на проекте. До 2026-09-17 они расходились — миграции применяли не через CLI, и
`db push` считал бы все тринадцать неприменёнными. Новые файлы называть по
версии, которую вернул сервер, иначе расхождение вернётся.

`functions/_shared/` holds the CORS + error envelope + auth wrapper and the
Gemini gateway (`shared.ts`). Functions import it
as `../_shared/…`; each deploy bundles its own copy.

## The AI gateway

Everything educational goes through `aiJson()` in `_shared/shared.ts`: one
Gemini `generateContent` call whose `responseSchema` *is* the caller's schema,
so callers get a structure rather than prose to parse. Plain `fetch`, no SDK.
The provider lives in that one function — the eight call sites never name it.

Two secrets: `GEMINI_API_KEY` (issued at <https://aistudio.google.com/apikey>)
and `GEMINI_MODEL`. Check a key before it goes anywhere near production:

```bash
GEMINI_API_KEY=… node scripts/gemini-check.mjs
```

It lists the models that key can actually reach and proves the chosen one
honours `responseSchema` — the model id on a pricing page and the id the API
accepts are not reliably the same string. `GEMINI_MODEL` defaults to the exact
id `gemini-3.5-flash` rather than the `gemini-flash-latest` alias: the alias
never 404s, but it moves on Google's schedule, and a generator feeding learning
material should fail loudly rather than quietly become a different model.

Full setup from zero — issuing the key, choosing the model, secrets, deploy,
verification: `docs/GEMINI_SETUP.md`.

**Every generator also has a deterministic implementation**, used when
`GEMINI_API_KEY` is not set. That branch is not a stub: onboarding →
assessment → mission → activity → feedback is fully walkable without a key.
Set the secret (Dashboard → Edge Functions → Secrets) to switch the whole
backend to real generation — no code change, no redeploy.

Objective activity types (multiple choice, recall) are graded against
`activity_answer_keys` with no AI involved at all, key or no key.

## What the client may touch

RLS default: SELECT your own rows, nothing else. Writes go through Edge
Functions on the service role. Two deliberate exceptions from TZ.md §5:
`profiles` (SELECT + UPDATE own) and `assessment_answers` (INSERT own — raw
answers carry no judgement).

Eight tables have RLS on and **zero policies on purpose** —
`activity_answer_keys`, `activity_responses`, `events`,
`assessment_questions`, and the four content pipeline tables below. The
security advisor reports each as INFO `rls_enabled_no_policy`; that is the
intended state, not a gap. Do not "fix" it by adding policies:
`assessment_questions.correct_index` and `activity_answer_keys.key` are
answer keys, and a client that can read them can cheat every exercise; the
content pipeline tables have no client-facing feature yet (no Library UI in
this phase) to expose them through.

## Content pipeline (open educational resources)

`content-import` (`_shared/content.ts`) turns a CC-licensed OER source into
draft exercises: `content_sources → content_units → knowledge_items →
generated_exercises`, in that order, matching Source → Raw Content → Parsed
Content → Structured Knowledge → Exercises. Deliberately not wired to
`materials` (learner-uploaded Library items) or `activities` (per-learner
Mission instances) — see the migration's comment for why.

- **Adapters** (`getAdapter(parser)`) do the source-specific work — today
  just `pressbooks`, which covers Open Oregon, BCcampus, and most CC-licensed
  OER textbooks. A second Pressbooks book needs a new `content_sources` row,
  not new code; a genuinely new platform needs one new adapter function.
- **Parsing** is mechanical regex, not AI — headings/paragraphs are
  unambiguous in Pressbooks' rendered HTML.
- **Extraction and exercise generation** go through the same `aiJson()`
  gateway as everything else, each with a deterministic fallback for when
  `GEMINI_API_KEY` is unset — same convention as the learner-facing
  generators.
- **Idempotent at every stage**: `content_units` upserts on
  `(source_id, external_id)`, `knowledge_items` on
  `(content_unit_id, kind, dedup_key)`, `generated_exercises` on
  `(knowledge_item_id, type)`. Re-running an import updates in place; it
  never duplicates.
- **Provenance** is structural, not denormalized — every `knowledge_item`
  points at its `content_unit`, every `generated_exercise` points at its
  `knowledge_item`. One join answers "where did this come from" for
  anything the pipeline produced.
- **Validation split**: `origin` (`source_derived` | `ai_generated`) records
  whether a knowledge item was pulled verbatim or inferred by the model;
  `status` (`draft` | `validated`) on both knowledge items and exercises is
  what a review step would flip before anything reaches a real Mission.

## Dashboard steps that code cannot do

Current state, read from `/auth/v1/settings` on 2026-08-27: only the `email`
provider is on, signups are open, and email confirmation is required.

1. **Google** — Cloud Console → OAuth client (Web). Authorised redirect URI
   `https://ixtfifglohppaimvyvui.supabase.co/auth/v1/callback`. Paste client
   id + secret into Authentication → Sign In / Providers → Google. Then set
   `EXPO_PUBLIC_GOOGLE_SIGN_IN=enabled` in `apps/mobile/.env`; until then the
   button stays hidden rather than failing on tap.
2. **Redirect URLs** — Authentication → URL Configuration: add
   `yuny://auth-callback` (native) and the web build's origin.
3. **Apple** — needs an Apple Developer account: Sign in with Apple, a
   Services ID and a key, then the Apple provider here. Required by App Store
   review once any third-party sign-in is offered. The button already shows
   on iOS only.
4. **Email delivery** — the built-in SMTP is rate limited to a couple of
   messages an hour and is not meant for real traffic. For testing either
   configure custom SMTP (Authentication → Emails) or turn on auto-confirm
   in dev; `check-email.tsx` handles the confirmation path either way.
5. **Leaked password protection** — Authentication → password settings.
   Off today; the advisor flags it as WARN and it matters now that email +
   password is a supported way in.
6. **`GEMINI_API_KEY`** and **`GEMINI_MODEL`** — Edge Functions → Secrets,
   to switch off the deterministic branch. Verify the pair with
   `scripts/gemini-check.mjs` first.

## Routine tasks

Migrations and function deploys currently go through the Supabase MCP server
(`apply_migration`, `deploy_edge_function`). With a personal access token the
CLI works too and is faster:

```bash
export SUPABASE_ACCESS_TOKEN=...            # supabase.com/dashboard/account/tokens
supabase link --project-ref ixtfifglohppaimvyvui
supabase db push                            # migrations/
supabase functions deploy                   # functions/
```

After any migration, regenerate the client's view of the schema:

```bash
pnpm --filter @yuny/shared gen:types
```

## Test data

`e2e-runner@yunytest.local` was inserted straight into `auth.users` to walk
the API without a UI, along with its goal, missions and evidence. **Delete
the user before production** — the cascade takes its rows with it.
