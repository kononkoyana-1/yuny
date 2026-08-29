# Episodic Memory — learning-agent

One entry per completed task, in the form "did X, hit Y, resolved by Z".
Written only at the Reflect step (AGENT_FRAMEWORK.md §6), never mid-task.

## clothing-a2-shopping-01 — first spec through the pipeline (2026-08-28)

Wrote the first Learning Specification, for the `clothing` topic at A2 —
chosen because `docs/plan-tasks.md` measured that topic at zero chapters on
every band.

Put two objectives in one package: LO-1 vocabulary (shopping nouns) and LO-2
grammar (too / not … enough), under `skill: "vocabulary"`. QA returned
SPEC_DEFECT: a mission built from this unit carries
`missions.primary_skill = 'vocabulary'`, so evidence from the grammar
exercises would have been filed under a skill they do not measure — corrupting
Learning State through exactly the path `TZ.md §3` Rule 1 protects.

Resolved by issuing version 2 with LO-2 removed and recorded as a separate
future package (`clothing-a2-fit-grammar-01`, skill `grammar`). Cost: one full
revision round that would not have happened if the skill field had been read as
a constraint on the whole package rather than a label on it.
