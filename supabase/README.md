# Yuny backend (Supabase)

Project ref `ixtfifglohppaimvyvui` · `https://ixtfifglohppaimvyvui.supabase.co`

Implements TZ.md §5 (data model), §6 (client ↔ backend contract) and §19
Phase 6. The client selects this backend with
`EXPO_PUBLIC_DATA_SOURCE=supabase`; with `mock` it never touches the network.

## Layout

```
migrations/   applied in filename order; the schema of record
functions/    one folder per Edge Function from TZ.md §6
  _shared/    runtime shared by all of them (see below)
```

`functions/_shared/` holds the CORS + error envelope + auth wrapper
(`shared.ts`), the activity type registry (`activity.ts`), and the four
generators (`goal.ts`, `assessment.ts`, `mission.ts`, `feedback.ts`).
Functions import it as `../_shared/…`; each deploy bundles its own copy.

## The AI gateway

Everything educational goes through `aiJson()` in `_shared/shared.ts`: one
`claude-opus-5` call shaped as a strict tool whose parameters *are* the
response schema, forced with `tool_choice`. Strict mode guarantees the
arguments validate, so callers get a structure rather than prose to parse.

**Every generator also has a deterministic implementation**, used when
`ANTHROPIC_API_KEY` is not set. That branch is not a stub: onboarding →
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

Four tables have RLS on and **zero policies on purpose** —
`activity_answer_keys`, `activity_responses`, `events`,
`assessment_questions`. The security advisor reports each as INFO
`rls_enabled_no_policy`; that is the intended state, not a gap. Do not
"fix" it by adding policies: `assessment_questions.correct_index` and
`activity_answer_keys.key` are answer keys, and a client that can read them
can cheat every exercise.

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
6. **`ANTHROPIC_API_KEY`** — Edge Functions → Secrets, to switch off the
   deterministic branch.

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
