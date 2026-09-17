---
name: content-fill
description: Fills one content gap end to end — picks the (topic, band) pair the most learners are blocked on, then drives learning-agent → content-agent → content-qa-agent through spec, draft, review and SQL. Use when asked to author learning material, close a coverage gap, or act on scripts/content-gaps.mjs output. Not for editing an existing package — that is a revision round inside this same loop.
---

# What this does

Turns one gap into one reviewed package. The three agents already exist and
each owns a decision; this skill owns only the **order** and the **gates**
between them.

You are the orchestrator. That means you do not write the spec, the text, the
exercises, or the review. If you author any of it yourself the pipeline
collapses into the single overloaded pass that `docs/CONTENT_AGENTS.md` §1 was
written to break up — and the collapse is invisible in the output, because the
files still look right.

# Step 0 — choose the gap

If the user named a topic and band, use those. Otherwise:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/content-gaps.mjs
```

Take the top row: most learners blocked, lowest band. If the credentials are
not available, **ask** which topic and band rather than guessing — a package
authored against an invented gap costs three agent runs and teaches nobody.

Then check the slug is free:

```bash
ls content/specs/ content/drafts/ content/approved/
```

Slug shape is `<topic>-<band>-<focus>-NN`, lower case, e.g.
`at-a-hotel-a2-checkin-01`. `<focus>` names the scenario, not the skill —
`shopping`, `checkin`, `ordering`. If the slug exists, this is a revision, not
a new package: go to the round that matches its state.

**One package, one skill.** A grammar objective inside a `vocabulary` package
sends its evidence to a skill it does not measure. QA already caught this once
(`content/reviews/clothing-a2-shopping-01.review.md`, round 1). If the gap
plainly needs both, that is two packages.

# Step 1 — spec (learning-agent)

Invoke `learning-agent` with: the topic slug and label, the CEFR band, the
goals blocked on it (titles from the gap report), and the explicit instruction
to write only `content/specs/<slug>.spec.json`.

Gate A, and you run it — not the agent's word for it:

```bash
node scripts/content-validate.mjs <slug>
```

Errors go back to `learning-agent`. Do not fix them yourself.

Watch one number: `content_budget.tasks_per_lesson` must be `15..20`
(`docs/onboarding-v2.md` §7.1). A spec still budgeted `3..5` was written
against the pre-2026-09-08 model and fills a quarter of a mission.

# Step 2 — draft (content-agent)

Invoke `content-agent` with the slug and nothing else it could mistake for
permission: the spec is the source of every learning decision, and the agent
writes only `content/drafts/<slug>.content.json`.

Gate B:

```bash
node scripts/content-validate.mjs <slug>
```

Zero errors before review. Warnings are answered in the handoff, not silenced.

If `content-agent` returns `SPEC_INFEASIBLE`, that is not a failure to route
around — go back to step 1 with the reason and let `learning-agent` re-issue at
`version + 1`.

# Step 3 — review (content-qa-agent)

Invoke `content-qa-agent` with the slug. It reads spec and draft, runs the
twelve checks in `docs/CONTENT_AGENTS.md` §10.2, writes
`content/reviews/<slug>.review.md`, and returns one verdict.

Do not summarise the draft for it, and do not pass along what the author
intended. It judges the artifact; supplying the reasoning behind the artifact
is how an independent review quietly becomes a second opinion on the author.

- `APPROVED` → the agent copies the draft byte-for-byte to
  `content/approved/<slug>.content.json`. Go to step 4.
- `REVISION_REQUIRED` → back to step 2 with the findings verbatim. The agent
  changes only what the review raised.
- `SPEC_DEFECT` → back to step 1.

**Cap: two revision rounds.** A third means the gap is not understood, and the
right move is to stop and report to the user — not to keep spending. Say which
findings are still open.

# Step 4 — SQL

```bash
node scripts/content-emit.mjs <slug> --batch <topic>
```

Writes `supabase/seed-<topic>.sql` plus `supabase/<topic>-parts/`. The emitter
sets `status = 'validated'` only for packages whose review says APPROVED, and
refuses to emit when `content/approved/` differs from `content/drafts/` — that
refusal is the QA gate made physical, so never work around it by copying files
yourself.

**Stop here. Do not apply the SQL.** Agents that write learning material have
no access to the production database (`docs/CONTENT_AGENTS.md` §2, TZ.md §3
rule 3). Hand the user the file paths and let them or the orchestrator apply
it.

# Report

Say, in this order: which gap and why it was top, the slug, the verdict and how
many rounds it took, what QA explicitly did not check, and the SQL paths. If
you stopped at the round cap, say which findings are open instead of implying a
package exists.

Re-run `scripts/content-gaps.mjs` only after the SQL is actually applied — the
report counts what is in the database, so before that it will still show the
gap you just filled, and that is correct.
