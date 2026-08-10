# Page 14 refactor — deferred findings and the distill run

Opened 2026-08-09 from `docs/review/pages_1_through_14_analysis.md`.

**Status: nothing here has been actioned.** `Page14.tsx`, `Page14.test.tsx` and
`web/data/deepseek-r1-distill.json` are untouched by the forward-plan pass, by author
direction. This document is a handoff, not a change log.

---

## 1. The two corrections that block the page as written

Both are single sentences that the page **already states correctly elsewhere**. Both were
recommended for immediate fix and deferred here.

### F14 · major · the lede attributes R1-Zero's property to R1

`Page14.tsx:863-872`, on a page titled DeepSeek-R1:

> "In January 2025 DeepSeek published all of it ... trained with **no worked examples at all**"

Only **R1-Zero** had no SFT warm-up. The page opens section 1 correctly on R1-Zero
(`:885-887`), and the correction (*"the released R1 adds a small cold start of curated
traces"*) arrives roughly 700 words later at `:1129-1131`, never joined to the lede.

A reader takes away the page's most quotable claim and it is false for the model in the
title.

Fix: attach the claim to R1-Zero in the lede, or move the cold-start qualifier up.

### F15 · major · the closing block attaches the o1-0912 match to the wrong number

`Page14.tsx:1171-1176`:

> "71.0% on AIME, level with o1-0912"

The page states it correctly at `:1024-1029`: *"Add page 7's majority vote across 64 samples
and it reaches 86.7%, level with OpenAI-o1-0912."* The match required 64 samples and a
majority vote, roughly 64x the answer-time compute.

**This is the sentence the reader carries into page 15.** Page 15's whole subject is that a
number without its coordinates is not a number.

Fix: restore the cons@64 qualifier in the closing block.

---

## 2. F16 · major · the divergence argument rests on two authored shapes and the footer discloses one

Only the **endpoints** 15.6 and 71.0 of the accuracy series are real. The **length series has
no intermediate data at all** and is a straight line (`Page14.tsx:398`). The footer
(`:1183-1190`) discloses only the accuracy interpolation.

A reader who scrubs, watches the green curve bend while the blue one keeps going, and reads
*"Length is not a schedule anyone set"* concludes DeepSeek measured that divergence.

The underlying claim is defensible (the paper's Fig 3 shows near-linear length growth); the
on-screen provenance does not cover the series the argument leans on hardest. This is the
same class of defect as page 13's F2, and page 14's Simulated/Cited footer is the **correct**
pattern for the deck. Extend it rather than replacing it.

> **Do not action the prior proposal** in `finishing_touches/finishing_touches.md` and
> `docs/page_14_scaling_frame.md:258-261` to delete page 14's Simulated/Cited footer for
> consistency with page 13. The review finds page 13 is the page with the disclosure gap. If
> uniformity is wanted, unify upward. (F105.)

---

## 3. F33 · the R1-distill measurement

This is the largest item on the page and the reason the document exists.

### What is currently possible and why it is a trap

`web/data/deepseek-r1-distill.json` already carries a full MATH-500 column, unused:

| model | AIME 2024 pass@1 (drawn) | MATH-500 pass@1 (unused) |
|---|---|---|
| R1-Distill-Qwen-1.5B | 28.9 | 83.9 |
| R1-Distill-Qwen-7B | 55.5 | 92.8 |
| R1-Distill-Llama-8B | 50.4 | 89.1 |
| R1-Distill-Qwen-14B | 69.7 | 93.9 |
| R1-Distill-Qwen-32B | 72.6 | 94.3 |
| R1-Distill-Llama-70B | 70.0 | 94.5 |
| teacher DeepSeek-R1 | 79.8 | 97.3 |

**Adding that column unchanged breaks two shipped claims and one pinned assertion.** Verified:

1. **The kink reverses.** On AIME, Llama-70B (70.0) sits left of Qwen-32B (72.6) and the page
   sells that as its surprise (`Page14.tsx:211`), pinned at `Page14.test.tsx:229`. On
   MATH-500 the order flips: 94.5 vs 94.3.
2. **The band collapses.** ~11 points across a 65x parameter range against a 97.3 teacher, so
   *"the dots march right through the closed rules as size grows"* does not exist on that
   axis.
3. **The closed-model rules cannot be drawn.** There is no `gpt4oMath` or `o1miniMath` in the
   file, so the section's payoff claim disappears.

### The direction the review recommends

Rank a **measured** distill run on the deck's own harness **above** adding the published
column. It is the only addition in pages 12-14 that would meet the standard pages 5-9 set.

And if the reversal shows up in the deck's own measurement, the page is *better* for owning
it: it is page 15's thesis arriving early, from the deck's own instrument rather than from a
published table.

### Run spec

**Models (author-committed):** `deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B` and
`deepseek-ai/DeepSeek-R1-Distill-Qwen-7B`. Compare against the other models already measured
in the deck.

**Item set — already pinned, and this is the whole point.** Pages 6 and 7 both ran:

```
dataset          math500_l45   (MATH-500 ch03 copy, levels 4-5)
n                100
item_set_sha256  9ab2b579204221a0c701e6c54ec2c041a63500f9d633ba208aebef8606c43155
seed             123
```

`page-07-derived.json` carries `manifest.items.same_as_page_6: true`. A distill run on this
set is directly comparable to the deck's measured spine, which is exactly what a published
MATH-500 column is not.

**Harness:** `notebooks/harness.py`, version 1.3, sha256
`7076c1218c6345ec9202087a98a2bd0c71ae47d6e406a81dc1901a0c7c78d6d8` (as recorded by pages 6
and 7). Grading via `reasoning_from_scratch.ch03.extract_final_candidate` +
`grade_answer`, both directions, matching pages 5-9 so the numbers are commensurable.

**Decoding:** match page 6's greedy arm for the headline (pass@1, T = 0), since the existing
`points` series is pass@1. If a sampled arm is also wanted, reuse page 7's `t0.30-c2048`
config so the two pages share a coordinate system.

**Cap:** distills emit long chains. Page 6's 2048 cap will truncate them heavily. **Decide
the cap before the run and record the truncation rate**, or the result is a censorship
measurement rather than an accuracy one. This is the single most likely way to get a wrong
number here; page 6's own censoring finding (F13, F59) is the precedent.

**Emit** `web/data/page-14-derived.json` with the same `manifest` shape pages 5-9 use (run
id, notebook + harness sha256, item set hash, decoding block, integrity block), so the
PROVENANCE rebuild can pick it up with no special case.

**Gates to declare before running,** in the style of pages 5-9's `claims` blocks:

- does the 32B/70B kink survive on this harness and this item set?
- does the 1.5B-vs-7B gap reproduce the published 28.9 → 55.5 direction?
- what fraction of chains hit the cap, per checkpoint?

**Branches to write copy for, both, in advance:**

- *Kink survives* → the page's existing surprise is now measured rather than transcribed.
  Strongest outcome; `Page14.test.tsx:229` stands.
- *Kink reverses* → the page must own the reversal, and `Page14.test.tsx:229` must change.
  Frame it as page 15 arriving early: the same models, ranked differently by a different
  instrument.

---

## 4. Remaining page-14 findings

Filed here for the same session. None is blocking on its own.

| # | Sev | Finding |
|---|---|---|
| F98 | minor | *"within seven points of the 671B teacher"* (`:210`) is arithmetically false: Qwen-32B 72.6 against teacher 79.8 is **7.2**. The chart draws the teacher line precisely so this is checkable. |
| F99 | minor-high | *"the best open reasoning model that existed the week before"* (`:209`) is unnamed, undrawn and mistimed. The model is **QwQ-32B-Preview at 50.0**, present in the data file as `qwqAime`, neither named in copy nor drawn as a rule, and it shipped roughly **two months** before R1, not a week. |
| F100 | minor-to-major | The dot plot's payoff sentence credits the wrong mechanism: *"a model you can download beats a closed frontier product **by thinking longer at answer time**"* (`:1164-1169`). The figure is a pass@1 table with no controlled thinking budget on either side, and the section's own thesis two paragraphs above is that the **training** knob transferred. |
| F97 | minor | The page's most memorable reveal fires at an invented threshold: `AHA_STEP = 5000` (`:144-147`) drives the dashed rule and the skeleton's stage change; the paper gives a behaviour at *"an intermediate version"*, not a step. Disclosed twice, which keeps it minor, but the single most memorable interaction in 12-14 is the least evidenced element in them. |
| F102 | minor | *"Page 12's recipe with a far stronger teacher"* (`:1127-1129`) drops the axis page 12's concept turns on: STaR is a model becoming its **own** teacher; distillation is one model teaching a **different** one. |
| F103 | minor | The dot plot's row targets are mouse-only: `onClick` on a `<g aria-hidden="true">` inside a `role="img"` frame (`:766`). The chip row below is the accessible path, so it is not an axe violation, but the header comment sells row-clicking as a feature. |
| F104 | minor | *"fits on a phone"* (`:206`) traces to nothing in `deepseek-r1-distill.json` or the paper. A 1.5B model at bf16 is ~3 GB, so the claim needs an unstated quantization assumption. |

F98, F99 and F100 are three checkable overclaims **on one figure** and are one sitting's
work; the forward plan groups them as a unit.

---

## 5. Preserve

- **The aha beat is the one landed predict-observe-explain moment in pages 12-14.** The
  reader is told *"nothing in the reward mentions length"* (`:994-997`) and then watches
  length climb anyway. It survives F97 only because the threshold is disclosed twice. Do not
  weaken it while fixing F97; disclose harder instead.
- **Page 14 answers all four of page 13's section-4 open questions, and the pairing is pinned
  in test on both sides.** The review calls this the strongest structural device in 12-14. Any
  F33 restructuring must leave both ends intact.
- **The Simulated/Cited footer.** See §2.

## 6. Leave alone

**F101 · GPT-4o at 12% on page 13 vs 9.3% here.** Both correctly sourced (OpenAI's own report
vs DeepSeek's measurement). Page 15 uses exactly this pair as a teaching case and needs the
discrepancy to arrive unexplained. The forward plan resolves this explicitly: **leave both
pages silent.** Do not add a reconciling clause.

## 7. Cross-session coordination

- Pages 15-19 are being revised in a separate session. F15 and F101 both feed page 15
  directly.
- Page 13's F2, F3 and F6 are being fixed in the current forward-plan pass. F3 redraws the
  waterfall as three parallel readings, which is page 15's first courtroom case; page 14's
  closing block (F15) is the other half of that setup.
- `PROVENANCE.md` and `SUBMISSION.md` (F31, F32) have **not** been rebuilt yet and are
  scheduled to run last, after this page and pages 15-19 settle. If §3's run happens, its
  `page-14-derived.json` needs a row.
