# Page 8 — replacing the simulation with a real best-of-N experiment

**Status:** plan only. Nothing here is implemented.

## Why

Page 8 currently rests on `LILY_PAD_MODEL` in `src/lib/sim.ts`: hand-tuned
`answerProbs`, an invented `appeal` vector, and a "verifier reliability" slider whose
units nobody can defend. The page's own footnote admits it — *"no reported result fixes
what a 40%-reliable verifier means numerically."* Every other page in the deck either
replays a digitized published curve or runs real code in the browser (page 10's routing
search). Page 8 is the one place where the numbers are invented.

The fix is to **measure it**: sample N candidates from a real non-reasoning model, score
them with a real verifier, and let the page replay what actually happened. The three
claims the page makes are all empirically checkable:

| # | Claim on the page today | What would make it measured |
|---|---|---|
| A | A right answer is often in the pile even when the model's usual answer is wrong | coverage (pass@N) vs pass@1 on real samples |
| B | On trap problems the majority is wrong, and gets *worse* with N | majority@N curve on items where the modal answer is wrong |
| C | Best-of-N beats voting exactly as far as the judge can be trusted | best-of-N@N under verifiers of measured quality |

Claim B is the load-bearing one and the one most likely to fail. Section 3 below is
about de-risking it before any money is spent.

## Non-goals

- **No live inference in the browser.** The page replays committed data, same as every
  other page. `NEXT_PUBLIC_LIVE_INFERENCE` and `LiveDemo` stay out of this; they are a
  separate, optional WebGPU path (`web/docs/LIVE_INFERENCE.md`) and are not what this is.
- **No API key in the app, no per-reader cost, no network dependency at page load.**
- **Not a benchmark paper.** One model, one item pool, one date. The page must say so.

---

## 1. Model and API

**Generator: `claude-haiku-4-5`** — $1 / $5 per MTok in/out, 200K context.

Why this one:

- It is genuinely non-reasoning in the sense the deck means. Do **not** pass a `thinking`
  parameter; Haiku 4.5 answers directly. (Note: `output_config.effort` is *not* supported
  on Haiku 4.5 and will error — don't send it.)
- It supports `temperature`, which the whole experiment depends on. Sampling parameters
  were removed on Opus 4.8/4.7 and Fable 5 — those models cannot be used as the generator
  here at all. This is a hard constraint on model choice, not a preference.
- It is cheap enough that the entire study can be re-run from scratch for the price of a
  sandwich, which matters more than it sounds: a study you can re-run is a study you can
  fix after a reviewer pokes at it.

**Verifier: two conditions.**

- *Self-verify:* `claude-haiku-4-5` judging its own candidates. This is the honest
  baseline and the one most likely to show the failure mode the page is about.
- *Cross-verify:* `claude-sonnet-4-6` ($3/$15, supports `temperature` and
  `thinking: {type: "disabled"}`) judging Haiku's candidates. A stronger judge on the same
  candidates is the cleanest possible demonstration of "selection is worth exactly as much
  as your selector," and it costs almost nothing extra.

**Transport: the Message Batches API** (`client.messages.batches.create`) — 50% off, up to
100,000 requests per batch, results within an hour typically. Two things to get right:

- Results come back in **arbitrary order**. Key everything by `custom_id`; never by
  position. Encode `custom_id` as `{item_id}:{condition}:{sample_index}` so the analysis
  never has to guess.
- Each `params` block is a full Messages request. Poll `processing_status` until `"ended"`,
  then stream `batches.results(id)` and branch on `result.type`
  (`succeeded` / `errored` / `canceled` / `expired`). An `errored` result with
  `error.type: "invalid_request"` is a bug in our request; anything else is retryable.

**Do not use** structured outputs (`output_config.format`) for the *generation* pass.
Constraining the output format changes the sampling distribution, and the whole point is
to observe the model's natural answer distribution. Parse a plain-text final line instead
(section 4). Structured outputs *are* appropriate for the verifier pass, where we want a
clean score and don't care about naturalness.

**Cost.** Rough sizing at 60 items × 64 samples × 2 prompt conditions = 7,680 generations,
~400 input / ~250 output tokens each. That is ~3.1M in / ~1.9M out → $3.1 + $9.6 = $12.7,
halved by batch to **~$6.4**. Verifier passes (7,680 judgements × 2 verifiers, ~600 in /
~80 out) add **~$5**. Pilots and one full re-run bring the whole study in under **$25**.

---

## 2. The item pool

Three families, ~150 items total in the pool. Every item carries: `id`, `family`,
`question`, `answer` (canonical), `answer_type` (`integer` | `decimal` | `day`), `source`,
and — for the attractor family — `trap_answer`, the wrong answer we expect to be popular.

**Family 1 — attractor items (CRT-style).** Problems with a salient, wrong, one-step
answer sitting right on the surface. The lily-pad problem is the archetype and is already
authored in `src/lib/authored.ts`.

> ⚠️ **The classic CRT items will not trap a 2026 model.** Lily pad, bat-and-ball, and
> the widgets problem are in every training set several times over. The pool must be
> **structurally-perturbed variants**: same trap geometry, different surface. E.g. a
> culture that quadruples daily and covers a quarter of the dish on day 19 (the "half the
> days" pull is still there; the memorized answer is not). Generate ~40 variants, hold the
> originals out as a memorization control — if the model aces the originals and fails the
> variants, that contrast is itself worth a sentence on the page.

**Family 2 — large-number arithmetic.** From `notes_on_slides.md`: DeepSeek V3 blurts
`4502 × 6398 = 28,793,796` (off by 10,000; correct is 28,803,796). This is the deck's own
observed failure mode, it already appears on pages 1–2, and it has a mechanically
verifiable answer. Scale the operands until pass@1 lands in the 20–60% band.

**Family 3 — numerically-perturbed GSM8K.** Take GSM8K items (Cobbe et al. 2021 — the
paper page 8 *already* cites for verifier best-of-N, which is a pleasing bit of
coherence; MIT licensed) and swap the numbers for larger ones, recomputing ground truth
programmatically. Defeats memorization, keeps the multi-step structure.

Ground truth for families 2 and 3 is computed, not typed — the generator script emits
`answer` from the same code that emits `question`, and a unit test recomputes it.

---

## 3. Phase 0 — the pilot, and the go/no-go gate

**This phase decides whether the page's thesis survives contact with a real model.
Run it before spending anything on the main sweep.**

Sample **k = 16** at the working temperature for all ~150 pool items, under both prompt
conditions. Cost: well under $1.

For each item compute `p_correct` (= pass@1), the **modal answer**, and whether the
correct answer appeared at all. Bucket:

| Bucket | Rule | Meaning for the page |
|---|---|---|
| **Trap** | modal answer ≠ correct, **and** correct appears ≥ 1 time in 16 | Exactly page 8's regime: popular answer wrong, right answer rare but present |
| **Solvable** | modal answer = correct | Page 7's regime — voting works here |
| **Hopeless** | correct never appears | No selector can help; this is the coverage ceiling, and worth showing |

**The bucket sizes are themselves a finding.** "On this pool, N% of items are trap items
for this model" turns the page's hand-wavy *"sometimes the right answer is the rarest
one"* into a measured base rate. That sentence alone justifies the whole exercise.

### Go / no-go

**Gate: ≥ 12 trap items, spread across at least two families.** If the gate fails, escalate
in this order before touching the main sweep:

1. **Harder items** — bigger operands, more steps, more distracting surface structure.
2. **The blurt condition** (see below). If "answer immediately, no working" doesn't produce
   attractor behaviour, something is wrong with the prompt, not the model.
3. **A weaker generator.** Last resort; it weakens the page's claim to be about frontier
   behaviour and should be called out in the copy if used.

If all three fail, that is a real negative result and the page should be rewritten to say
so rather than simulating the result we wanted.

### The two prompt conditions (a design decision, not just a fallback)

- **`blurt`** — *"Answer immediately. Reply with only the final answer on a line beginning
  `ANSWER:`. Do not show any working."*
- **`work`** — *"Think step by step, briefly. End with the final answer on a line beginning
  `ANSWER:`."*

Running both is worth the 2× cost. It makes the "non-reasoning" condition literal rather
than assumed, it produces the attractor behaviour page 8 needs, and it wires straight back
to page 1's blurt-vs-show-your-work dial — the same contrast, now measured at N candidates
instead of one. Fix both prompts byte-for-byte before the pilot and never edit them again;
a changed prompt invalidates every sample taken under the old one.

### Guarding against cherry-picking

Split the pool 50/50 *before* the pilot. Bucket on the first half, then run the main sweep
on **both** halves and report the held-out half separately. If the trap rate holds up out
of sample, the finding is real. Record the split seed.

---

## 4. Phase 1 — generation

- **N = 64** samples per item per condition. The page's chart already runs 1→64.
- **Independent requests.** 64 separate batch entries, not one request asking for 64
  answers. Answers listed inside a single response are not i.i.d. — they condition on each
  other, which is precisely the diversity collapse page 7 is about. Getting this wrong
  invalidates every curve downstream.
- **Temperature**: sweep {0.3, 0.7, 1.0} during the pilot, pick one for the main run, and
  report it. Set `temperature` **only** — never `temperature` and `top_p` together (400 on
  Claude 4+).
- Identical system prompt across all items; only the question varies.

**Answer extraction.** Strict regex on `^ANSWER:\s*(.+)$`, last match wins. Then normalize:
strip commas, currency, units; canonicalize `"Day 47"` → `47`; float tolerance for
decimals. Three outcomes per sample — `correct`, `wrong(value)`, `malformed` — and
**`malformed` is its own bucket, never silently folded into `wrong`**. Report the malformed
rate; if it exceeds ~2% the prompt needs fixing, not the parser.

**Everything is committed.** Every raw response body lands in
`experiments/best-of-n/raw/` (gzipped JSONL). Temperature sampling is not reproducible, so
the transcripts *are* the provenance — the analysis must be deterministic from them, and a
test should recompute the headline numbers from the raw files.

---

## 5. Phase 2 — verifiers

Four selectors, scored on **the same 64 candidates**, which is what makes the comparison
mean anything.

| Selector | How | Cost |
|---|---|---|
| **Oracle** | ground-truth check; equals coverage | free |
| **Majority** | plurality over normalized answers, ties broken uniformly at random | free |
| **LLM verifier (self)** | Haiku scores each candidate 0–10 | ~$2 |
| **LLM verifier (cross)** | Sonnet 4.6 scores each candidate 0–10 | ~$3 |

**Verifier prompt design:**

- **One candidate at a time.** Pairwise or list-wise judging introduces position bias and
  makes the score depend on what else was in the batch. Single-candidate scoring keeps the
  judgement independent, which is what "score every candidate" means on the page.
- The judge sees question + candidate working + candidate answer, and **never** the ground
  truth or the other candidates.
- `output_config.format` with a small JSON schema (`{score: integer, reason: string}`) —
  here structured output is a plus, not a confound.
- **Tie-breaking is a declared policy, not an accident.** Many candidates will score 10.
  Break ties uniformly at random with a recorded seed. This choice materially moves the
  best-of-N curve and must be in the provenance string.

**Measure the verifier, don't assert it.** Over the whole candidate pool, compute the
judge's **AUC** and **accuracy at discriminating correct from incorrect candidates**. That
number is the honest replacement for the invented "40% reliable." Also record its
correlation with candidate *length* and with hedging language — if the judge prefers long,
confident-sounding wrong answers, that is the page's "judge reading the wrong criterion"
thesis caught in the wild, and it is the single best thing this experiment could turn up.

### Re-anchoring the reliability slider

The slider is page 8's second half and cannot just be deleted. But no measurement defines
a continuous "reliability %" axis, so stop pretending it does. Replace the invented
parameter with **interpolation between three measured anchors**:

| Anchor | What it is | Where its number comes from |
|---|---|---|
| Oracle | perfect judge | measured coverage |
| Real LLM judge | Haiku (and Sonnet) scoring | measured selection accuracy |
| Anti-judge | always picks the most-popular answer | measured — it *is* the majority curve |

The dial then mixes oracle ↔ real judge ↔ anti-judge with a stated weight, relabeled
something like **"how often the judge uses the right criterion"** — a mixing weight, which
is honest, rather than an accuracy claim, which would not be. Every endpoint of the dial is
a real measurement; only the path between them is interpolated, and the caption says so.
The crossing point where best-of-N drops below majority voting then becomes a *measured*
crossing — which is Stroebl et al. 2024's claim, demonstrated on our own data instead of
gestured at.

---

## 6. Phase 3 — analysis

**Sub-sample; do not re-run.** Draw 64 once, then derive every N from those 64:

- **coverage / pass@N** — use the unbiased estimator
  `1 − C(n−c, N) / C(n, N)` (n = 64, c = # correct), not a bootstrap. Exact and cheap.
- **majority@N**, **bestof@N** — bootstrap: draw N of the 64 without replacement, B = 2,000
  times, take the fraction correct. Report **median and a 95% interval**.

Confidence bands are not decoration here. The page's most dramatic claim — that majority
voting *declines* with N — needs to be visibly outside the noise, or it should not be
claimed.

**Sanity invariants** (assert these; a violation means a bug, not a discovery):

- `coverage(N)` is non-decreasing in N
- `coverage(N) ≥ majority(N)` and `coverage(N) ≥ bestof(N)` at every N
- `bestof(N)` under the oracle verifier `== coverage(N)` exactly
- `majority(1) == bestof(1) == pass@1` within bootstrap noise

**Expected shapes** — worth stating up front so a surprise is legible as a surprise:
on the trap set, `majority(N)` should *fall* toward 0 (more samples = a sharper measurement
of the wrong consensus), `coverage(N)` should climb log-linearly, and `bestof(N)` should sit
between them at a height set by the judge's measured AUC. If majority doesn't fall, the
trap bucketing is wrong and Phase 0 needs revisiting.

---

## 7. Deliverables

```
experiments/best-of-n/            # outside web/ — not part of the app bundle
  README.md                       # how to re-run, what it cost, what it produced
  items.ts                        # pool generator; emits questions AND ground truth
  items.json                      # frozen pool (committed)
  run-generate.ts                 # batch submit + collect  (@anthropic-ai/sdk)
  run-verify.ts                   # batch submit + collect
  analyze.ts                      # → the data file below
  raw/*.jsonl.gz                  # every transcript, committed
web/data/best-of-n-measured.json  # the curve file the page reads
```

**Schema question to settle first.** `src/lib/data.ts` requires every data file to carry a
`citation` with `{ref, url, venue, preprint}` — a guard built for *digitized published
curves*. This file is an own-measurement, and jamming a fake paper citation into it would
defeat the exact guardrail the schema exists to enforce. Recommended: extend the schema
with a `kind: "measured"` variant carrying `{model, date, temperature, n_samples,
n_items, commit}` instead of a paper citation, and update the data-fidelity test to accept
it. This is a small change to `data.ts` + `curves.ts` and should land *before* the
experiment, so the harness writes the right shape the first time.

**`data/PROVENANCE.md`** gets a new row: extraction method `measured (own run)`, plus the
exact model IDs, run date, temperature, N, item counts, bootstrap seed, tie-break seed,
malformed rate, and total cost.

---

## 8. Page rebuild

- **Step 1** — the fabricated batch becomes a **real batch of 64 transcripts** from one
  trap item. The reader clicks a candidate and reads what the model actually wrote,
  including the wrong reasoning that got there. Page 7 already has the click-a-row-to-read
  interaction to copy.
- **Step 2** — curves become measured, with confidence bands. Chip changes from
  *"seeded illustrative simulation · no live model"* to
  *"measured · claude-haiku-4-5 · T=1.0 · 64 samples × M items · <date>"*.
- **Reliability dial** — kept, re-anchored, relabeled per section 5.
- **Cobbe et al. 2021 and Stroebl et al. 2024 stay**, but their role changes: they are now
  cited for the *shape* and for priority, while the numbers on screen are the deck's own.
  That is a stronger position than today, not a weaker one.
- **Footnote** rewritten: the current text apologizes for being illustrative; the new text
  states the method, the model, the date, and the limits.

---

## 9. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| No trap items exist for a modern model | **Kills the page as written** | Phase 0 gate; escalation ladder; a negative result gets published as one |
| Self-verification is self-preferring | High — confounds claim C | The cross-model verifier condition exists precisely for this |
| One model, one pool, one date | Medium — generality | Say so on the page; the memorization control adds range |
| Model retirement makes it unreproducible | Medium | Pin exact model IDs; commit raw transcripts; the analysis stands on the transcripts, not the API |
| Temperature sampling isn't reproducible | Low | Transcripts are the provenance; analysis is deterministic from them |
| Cherry-picked trap items | High — credibility | Pre-registered pool split; report held-out half separately |
| Batch results keyed by position | Low but silent | `custom_id` everywhere; assert every expected key is present before analysis |

---

## 10. Sequencing

| Phase | Work | Cost | Gate |
|---|---|---|---|
| 0a | `data.ts` schema `kind: "measured"` + test | — | typecheck + tests green |
| 0b | Item pool + harness + **pilot** | < $1 | **≥ 12 trap items across ≥ 2 families, or stop** |
| 1 | Main generation sweep | ~$6 | malformed rate < 2% |
| 2 | Verifier passes (self + cross) | ~$5 | verifier AUC computed and reported |
| 3 | Analysis → data file + PROVENANCE row | — | all sanity invariants hold |
| 4 | Page 8 rebuild | — | — |
| 5 | Tests: replay determinism, invariants, a11y, E2E | — | `typecheck && lint && test && build && test:e2e` |

Phase 0b is the real decision point. Everything after it is execution; everything before it
is cheap.
