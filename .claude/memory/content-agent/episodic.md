# Episodic Memory — content-agent

One entry per completed task, in the form "did X, hit Y, resolved by Z".
Written only at the Reflect step (AGENT_FRAMEWORK.md §6), never mid-task.

## clothing-a2-shopping-01 — first draft through the pipeline (2026-08-28)

Wrote "Buying a jacket" (201 words, A2) with five vocabulary items and six
exercises against spec v2.

Two blockers came back from QA, both the same class — a blank whose intended
answer is not the only correct one:

- "he asks for a bigger ___" (wanted `size`) also accepts *one* and *jacket*;
- "he decides to ___ the jacket for a grey one" (wanted `exchange`) also
  accepts *change*, which at A2 is the likelier answer.

Both fixed by rebuilding the sentence so only the target word fits. The
`exchange` fix is worth reusing: "he asks for an ___ instead" — the article
*an* rules out *a change* on its own, so grammar does the disambiguating
instead of context.

Gate B separately caught a declared `word_count` of 213 against 201 actual
words. Cheap to fix, and it would have shipped silently before.
