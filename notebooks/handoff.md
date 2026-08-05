# Handoff — 2026-08-04

State of the page 5 / page 6 notebooks after a session of fixes. Nothing here has been
committed; `harness.py` and this file are untracked.

## Where things stand

**Neither notebook has completed a real run.** Page 5 is ready to start (it crashed partway
through a Qwen3-1.7B run on the bug in §"Bugs fixed" below, now fixed). Page 6 has never run.
`out/page_05/traces.jsonl` holds 132 records from an abandoned Qwen3-0.6B run — they are keyed to
an old `RUN_ID`, so they are inert and will not replay. Keep them; they are the record that
motivated the figure-2 redesign.

## The main change: page 5's figure 2

Its primary axis used to be accuracy. The 0.6B run put every rung between 0% and 8% solved — a
two-problem spread, noise — while the *same traces* showed 0% → 100% on "did the prompt produce a
chain". The experiment had worked; the axis was hiding it.

So figure 2 is now **two panels** (never one axes with two scales):

- **primary** — share of responses containing a chain (≥`MIN_CHAIN_STEPS` steps, using the same
  `segment_steps` rule figure 1 animates)
- **secondary** — accuracy, behind a resolvability gate: 95% Wilson intervals, and if the best and
  worst rungs overlap the panel greys out, says `NOT RESOLVABLE, do not rank`, and
  `derived.json.claims.may_rank_rungs_by_accuracy` goes false.

`derived.json` now has a top-level `claims` object — the machine-readable form of
`docs/page_5_refactor.md` §6. **Read it before any number.** Rationale is in spec §§1-3 and §6.

## Bugs fixed

1. **Token reconstruction** (`incremental_token_strings`). Byte-level BPE splits characters like
   `≈` and `√` across two tokens; the prefix decode ends in U+FFFD which the next token resolves,
   so `cur[len(prev):]` silently dropped the character and the assert fired mid-run. Page 6 had a
   *different* bug in its own copy (no reconciliation for a sequence ending mid-character — which
   its budget caps produce constantly). One implementation now, fuzzed 0/500.
2. **`RUN_ID` did not include the generation cap.** Raising `MAX_NEW_TOKENS` and re-running
   silently replayed traces made under the old cap. It now names model, eval band and cap.
3. **Truncation checked in aggregate.** 13% overall looked tolerable while the cap clipped 0% of
   `forced_blurt` and 33% of `zero_shot_cot` — a scoring penalty aimed at the rungs the page argues
   for. Now asserted **per rung** at a 5% budget. Cap raised 512 → 1024.

## `harness.py`

Shared plumbing, ships in each notebook's download. Split rule and rationale are in
[`README.md`](README.md); the short version is **claim-bearing stays in the notebook, plumbing
moves**. `harness.generate` deliberately gives `enable_thinking` no default.

`harness.selftest(tokenizer)` runs the invariants (called from each notebook after loading).
`harness.fingerprint()` goes into every manifest.

## Open items

- **The accuracy gate will probably still fail.** Eval band is L4-5. If `FULL` on Qwen3-4B cannot
  resolve accuracy, the lever is `eval_levels=(3, 4)` in `PRESETS` — the notebook prints this when
  the gate fails. Going to `(2, 3)` collides with the exemplar band and needs
  `exemplar_levels=(1,)`; the disjointness assert catches it.
- **`FULL` is an overnight+ job on a 16 GB M5.** Qwen3-4B at ~8 GB bf16, ~824 generations. `QUICK`
  (Qwen3-1.7B, 24 items) resolves the primary axis on its own and is the sane first run.
- **Spec boundary.** The harness split rule is documented in `README.md` but not in
  `docs/page_5_refactor.md`. If the spec should be the single source for it, move it.
- Page 6's prose was cut only 12% (vs 49% for page 5); its remaining comments carry the
  budget-forcing rationale, which has no spec section of its own yet.

## Working notes

- **The notebooks exceed the Read tool's token limit**, so `NotebookEdit`'s read-before-write
  cannot be satisfied. Edit cells with a structured JSON script that asserts on the target's
  current content before overwriting.
- **Validate without a GPU by stubbing the model.** Patch `harness.load_model` to return a real
  (cached) tokenizer plus a fake model whose `.generate` returns canned or replayed token ids, then
  `exec` every code cell in order. That exercises the sweep loops, grading, segmentation, both
  figures, the gates and artifact writing — everything except the forward pass. Both notebooks pass
  this. Run it in a sandbox directory, not in `notebooks/`, or it appends stub traces to the real
  `traces.jsonl`.
- Cells 6-13 and several others have no `id` field; address them by position and verify the
  leading text before writing.
