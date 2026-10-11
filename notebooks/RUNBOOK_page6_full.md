# Page 6, the FULL run: the runbook

A fresh generation of page 6's chains: three Qwen2.5 checkpoints, the same 100 MATH-500
level 4+5 problems, greedy, budgets of 128 to **4,096** tokens, and the `Wait` arm (section
12) at 0 to 3 injections.

## Why it is being run

The published chains (2026-08-07) were made by a notebook that, at each cap, appended
`Final answer: \boxed{` and let the model write 32 more tokens. A model that runs out of
budget does not do that, so the page must show the chain as it stopped. Replaying the old
chains with that text discarded works, but it moves the 7B's last doubling to **+3 points**
(1,024 → 2,048), so the 7B no longer bends inside the grid and page 6's gate refuses it. The
grid gains a 4,096 stop, and the chains are regenerated so that none of them carries
forced text.

The handoff to page 7 stays at 2,048 tokens (`PAGE7_TOTAL`), the total page 7 splits.

## Before starting

On the GPU machine, from a checkout of this branch:

```bash
pip install -r notebooks/requirements.txt    # bitsandbytes is needed: the 7B loads in 8-bit
mv notebooks/out/page_06 notebooks/out/page_06_forced_2026-08    # if it exists
```

`out/page_06/` must start empty. The run id is new (it ends `-cap4096-...-stop`), so old
records would not be resumed, but they would sit in the same `traces.jsonl` and ship in
the download.

Use the card the published run used (`NVIDIA GeForce RTX 5080`) if possible. Greedy decoding
can differ between GPU architectures, so a different card is a different instrument; the
manifest records whichever card is used.

## Starting it

```bash
cd notebooks && PAGE6_RUN_MODE=FULL jupyter nbconvert --to notebook --execute --ExecutePreprocessor.timeout=-1 --output out/page_06_FULL_run.ipynb page_06_thinking_longer.ipynb
```

The committed notebook defaults to `REPLAY`; the mode comes from the environment, and the
executed copy lands in `out/` rather than over the original.

If it dies, run the same command again. Each chain is appended to `traces.jsonl` as it is
written and the run resumes from there.

## Expected cost

The published run took 2 to 3 hours on this card. The 4,096 stop only generates chains still
cut off at 2,048 (6% for the 3B, more for the 1.5B), because a chain that finished on its own
is reused at every larger budget. The `Wait` arm's first step now runs to 4,096 as well.
Budget **3 to 5 hours**; the 8-bit 7B is the slow part.

## What comes back

From `notebooks/out/page_06/`: `traces.jsonl`, `manifest.json`, `results.json`, and
`out/page_06_FULL_run.ipynb` (the executed copy). Copy those back to the same paths in
the main checkout, then build the website's data from them:

```bash
cd notebooks && python page_06_site_data.py
```

That writes `out/page_06/derived.json`, which pages 11 and 14 also read from there.

## After the run

1. **Check the 7B.** In the executed copy, figure 2's table gives each doubling's gain. If the
   7B still gains 2 points or more at 2,048 → 4,096, the gate still refuses it. Stop and
   decide, rather than loosening the gate.
2. **Leftover fields.** `derived.json` still carries fields from the forced-answer run, kept
   only because the page reads them: `tokens_generated` (now always `own_tokens`), `pilot`
   (check 5 on 30 problems instead of 100), and handoff names ending `_at_max` that hold the
   2,048 values. Drop or rename them in `page_06_site_data.py` and `page06.ts` together.
3. **Page 6.** Take forcing out of the page: `web/src/lib/page06.ts` (raw types without
   `forced`, `cut_index`, `answer_start`, `answer_*`, `forced_rate`; the gates key on
   `truncated`; `traceZones` returns only `own` and `unwritten`; the run-mode gate reads
   `manifest.generated_by` on a replay), figure 1's "we close the block and make it commit"
   band in `Page6.tsx`, the step 1 copy ("make it answer on the spot"), and the tests that
   pin the old run's specimen, counts and dip.
4. **The download.** Rebuild `web/public/notebooks/page-06-thinking-longer.zip` with the
   notebook, `harness.py`, `page_06_site_data.py`, `requirements.txt`, a README without the
   forced-answer paragraph, and the new `out/page_06/` files (`results.json` among them, which
   the bundle test checks against `derived.json`'s `source` stamp, as it does for page 7). Then
   set page 6's `siteData` and `repoNotebookIsTheShippedOne` (back to `true`) in
   `web/src/lib/notebookBundles.test.ts`
   and update the size label (`NOTEBOOK_SIZE` in `Page6.tsx`, page 16's download list).
5. **Downstream.** Pages 11 and 15 (`page_17_when_reasoning_breaks.ipynb`) reproduce page 6's
   accuracy cells bit-exactly, and page 16 reads `PAGE6` directly, so all three need
   re-deriving against the new numbers. Page 7 still forces its own answers; that is a
   separate decision.
