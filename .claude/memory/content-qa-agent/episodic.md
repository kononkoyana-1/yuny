# Episodic Memory — content-qa-agent

One entry per completed task, in the form "did X, hit Y, resolved by Z".
Written only at the Reflect step (AGENT_FRAMEWORK.md §6), never mid-task.

## clothing-a2-shopping-01 — first review (2026-08-28)

Round 1: REVISION_REQUIRED. Two blockers (ambiguous blanks for `size` and
`exchange`), one SPEC_DEFECT (grammar objective under a vocabulary skill), two
minors (`till` and `rail` outside the spec's own stated frequency calibration;
one calque sentence).

Round 2 against spec v2 and the rewritten draft: APPROVED, one non-blocking
minor (two-word `dedup_key`, which the schema allows).

Worth noting how the SPEC_DEFECT was found: not by reading the draft, but by
comparing the draft's objectives against the spec's `skill` field. Defects at
the specification level are invisible if the review only looks at content.
