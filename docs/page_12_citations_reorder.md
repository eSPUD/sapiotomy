# Page 12 — three new citations + section reorder

Plan for the page 12 revision. Two changes, one commit-series: (A) integrate
three verified outside citations into the pseudocode's annotation column and one
existing callout; (B) reorder the sections so the pseudocode follows the
interactive and precedes the results. No section is added; page height grows by
three `RefItem` lines and nothing else.

All quotes below were verified against the primary sources on 2026-07-29
(ar5iv full text for STaR; PDF full text for GVM; arXiv abstracts for ExIt and
RFT).

---

## Verified sources

| # | Ref | Paper | Where it lands |
|---|-----|-------|----------------|
| 1 | `star` | Zelikman et al. 2022, *STaR: Bootstrapping Reasoning With Reasoning*, NeurIPS 2022 (arXiv:2203.14465) | unchanged (already cited) |
| 2 | `exit` | Anthony, Tian & Barber 2017, *Thinking Fast and Slow with Deep Learning and Tree Search*, NeurIPS 2017 (arXiv:1705.08439) | pseudocode line 2 (`loop:`) |
| 3 | `rft` | Yuan et al. 2023, *Scaling Relationship on Learning Mathematical Reasoning with Large Language Models* (arXiv:2308.01825, preprint) | pseudocode line 5 |
| 4 | `gvm` | Yao et al. 2025, *Optimizing Chain-of-Thought Reasoners via Gradient Variance Minimization in Rejection Sampling and RL* (arXiv:2505.02391, preprint) | the counterweight callout |

### What each one is allowed to claim (verbatim backing)

**ExIt (2)** — grounds the page's "this is RL in disguise" mapping in a method
five years older than LLM reasoning. STaR itself: ExIt was "a reinforcement
learning technique serving as an inspiration for our approach"; "filtering
generated examples based on whether their ultimate answer matches the target
can be seen as expert feedback. However, we have a fixed 'expert' and do not
train a separate value function." Independently, GVM: "this algorithm framework
can further date back to the expert iteration in the RL literature Anthony et
al. (2017)." The RL framing now has outside support from two directions.

**RFT (3)** — names the sample-k alternative to STaR's single greedy attempt,
and fixes an error on the page while doing it. STaR §3.1: "STaR approximates J
by (1) greedily decoding samples of (rᵢ, ŷᵢ) to reduce variance of this
estimate" — greedy, one attempt per problem. So line 5's current annotation
("in RL terms: sample from the current policy") describes RFT, not STaR; the
file's own docblock already states the greedy-decoding correction and the
annotation contradicts it. STaR's temperature caveat, verbatim: higher
temperature "substantially increases the likelihood of a correct answer despite
incorrect reasoning, and training on bad or irrelevant reasoning prevents
generalization." **Guardrail:** GVM calls STaR and the RAFT/RFT family
"closely related" but explicitly distinguishes them on the greedy-vs-sampling
axis — the page may say "closely related", never "synonymous".

**GVM (4)** — outside support for the counterweight, which currently rests
only on STaR describing its own weakness. Verbatim (§1.1): "STaR uses greedy
decoding rather than sampling, which deviates from the EM principle and suffers
from severe bias across prompts of different difficulty levels"; "STaR retrains
from the original pre-trained model in each iteration, rather than
bootstrapping from the updated model"; and — the sentence the counterweight
needs — "our preliminary experiments suggest that LLMs often generate wrong
reasoning path and output the correct answer regardless of the context."

**Correction to the source report:** STaR does *not* float token-level /
process verifiers as future work (checked against full text); the counterweight
was under-sourced either way, which GVM now fixes.

---

## (A) Citation edits — all in the annotation column + one callout

1. **Line 2** (`loop:`) — currently bare, and has no exit condition a reader
   will accept. Becomes:

   ```
   2   loop: until accuracy plateaus    expert iteration (Anthony et al. 2017) —
                                        the same loop, before LLMs
   ```

   `<Cite n={REF.exit} />` on the note. The exit condition is a backward
   reference to section 1's plateau — the annotation line does double duty.

2. **Line 5** (`r, ŷ ← M(x)`) — replace the incorrect annotation. Becomes:

   ```
   5   r, ŷ ← M(x)    one greedy rollout — low variance, biased exploration;
                      RFT (Yuan et al. 2023) samples k instead
   ```

   `<Cite n={REF.rft} />` on the note. One edit fixes the error and adds the
   citation. The intro sentence above the listing ("the annotations on lines 5
   and 6 name what it secretly is") updates to point at lines 2 and 6 — the
   ExIt note and the binary-reward note now carry the RL identity.

3. **Counterweight callout** ("Trained on reasoning, graded on answers") —
   one added sentence before the page-9 kicker, citing GVM:

   > Not a hypothetical: models often write a wrong reasoning path and still
   > land on the right answer — hint or no hint.

   `<Cite n={REF.gvm} />`. This is the only place GVM is cited; its
   retrain-from-base quote is *support* for line 10's existing annotation, not
   a second cite (line 10's note frames restart-from-base positively — bolting
   a critique-framed cite onto it would muddle the note).

4. **`REF` map** becomes `{ star: 1, exit: 2, rft: 3, gvm: 4 }` — numbered in
   order of first appearance under the new section order: star (section 1),
   exit + rft (section 2 listing), gvm (counterweight at page bottom).

5. **References sidenote** gains three `RefItem`s (arXiv links above; `rft` and
   `gvm` are preprints — no venue line, consistent with house style for
   preprint refs elsewhere in the deck).

## (B) Section reorder

New order: **interactive → pseudocode → results**, with the two closing
paragraphs staying at the page bottom.

1. **Section 1 — "Run the loop"** — unchanged, stays first, keeps its
   "What you're watching" sidenote.
2. **Section 2 — "The loop, written down"** (was section 3) — moves up.
   Heading renumbers to `2.`. The plain-language walkthrough and the listing
   move with it. The **References sidenote moves beside this section** (three
   of four refs first appear here; star still resolves fine from section 1
   above).
3. **Section 3 — "What the loop bought"** (was section 2) — the Table 1 bars
   move below the listing. Heading renumbers to `3.`.
4. **The two closing paragraphs — counterweight + o1/R1 hand-off — do NOT
   travel with the pseudocode.** They detach from the listing's section and
   remain the last two content blocks on the page (left column, after the
   results section, before the Simulated/Cited footer). Interpretation on
   record: "leave the two paragraphs at the bottom" = the counterweight and
   the page-13 hand-off keep closing the page; the hand-off must stay last
   regardless, and the counterweight now reads over both the listing *and*
   the results it follows. The Simulated/Cited footer is untouched either way.
5. **Narrative seams to re-stitch** (small prose edits only):
   - Section 2's lead-in ("The same loop, compressed to ten lines") still
     works after the interactive — "the same loop" now refers to section 1's
     diagram, which is truer than before.
   - Section 3's figcaption already stands alone; no edit needed beyond
     confirming no "above/below" directionals break. (Grep for "section 2",
     "section 3", "above", "below" in the file and fix any stale pointers —
     the listing's figcaption references "section 1's legend", which stays
     correct.)
6. **Docblock** (lines 3–53) rewritten to describe the new order, the four
   refs, and to retire the "correction that must hold" paragraph into a
   description of line 5's annotation (the correction is now enforced by the
   listing itself, not just guarded against).

## Grid mechanics

The page is one `lg:grid-cols-[minmax(0,1fr)_15rem]` grid with alternating
section / `Note` children. New child order:

```
section 1 (interactive)   | Note: What you're watching
section 2 (pseudocode)    | Note: References (4 items)
section 3 (results)       | (empty)
closing block (counterweight + hand-off, left column)
```

The closing block is a plain left-column `div` (auto-placement puts it in
column 1 on a new row; add `lg:col-start-1` only if auto-placement misbehaves).

## Test updates — `Page12.test.tsx`

Assertions that break and their replacements:

- `"in RL terms:"` count (`line 81`, expects 2) → becomes **1** (line 6 only);
  add explicit assertions for the new line-5 text (`one greedy rollout`) and
  the ExIt note (`expert iteration`).
- `"writes the loop down"` → add `until accuracy plateaus`.
- `"explains the algorithm in plain language above the listing"` → keeps
  passing; add a sibling ordering test: **listing precedes the Table 1
  figure** (`compareDocumentPosition`, same pattern), and **counterweight
  follows the Table 1 figure** — this pins the reorder and the
  paragraphs-stay-at-bottom decision.
- References: assert 4 `RefItem` links with the three new arXiv hrefs.
- Counterweight: add `Not a hypothetical` / wrong-reasoning-right-answer
  assertion.
- Unchanged and must keep passing: hook question, Table 1 row set, regime
  panels, frontier strip, GSM8K caveat, calibration anchors, hand-off line,
  Simulated/Cited footer, no-V-STaR/ReST/luck-into-skill guards.

No E2E specs target page 12; none to update. No `web/data/` changes — all
three citations are prose-level; `PROVENANCE.md` untouched (it tracks data
files, and section 3's numbers still come solely from STaR Table 1).

## Commit plan + gates

Two commits on a `page-12-citations-reorder` branch:

1. `content(page12): pseudocode above the results; closing blocks stay put`
   — reorder + renumber + docblock + ordering tests.
2. `content(page12): ground the loop in ExIt, RFT, GVM; fix line 5`
   — REF map, annotations, counterweight sentence, RefItems + tests.

Gates before each commit: `npm run typecheck && npm run lint && npm test &&
npm run build` (from `web/`).

## Acceptance criteria

- [ ] Reading order: hook → interactive → pseudocode → results → counterweight
      → hand-off → footer.
- [ ] Line 5 no longer claims STaR samples; RFT named as the k-sample variant.
- [ ] `loop:` has an exit condition tied to section 1's plateau.
- [ ] Every structural claim on the page ("this is RL", "greedy is a
      limitation", "the filter reads answers, never arguments") has at least
      one non-STaR citation.
- [ ] Nowhere does the page call STaR and RFT synonymous.
- [ ] Page height: +3 reference lines, nothing else.
- [ ] All gates green.

---

## Revision (2026-07-29, screenshot review)

Three fixes after seeing the shipped page, aligning it with the page 2/3
reference grammar:

1. **Cite superscripts out of the annotation column.** The annotations still
   name ExIt and RFT (intuition-column content), but the numbered markers move
   into the listing's figcaption prose — pages 2/3 never put sups inside a
   figure's annotation column.
2. **Walkthrough below the listing.** "The algorithm, explained" moves under
   the pseudocode: the listing keeps its punch, the plain-language pass
   becomes the safety net instead of a spoiler.
3. **Section 3's source made visible.** All bars were always Zelikman et al.
   2022 Table 1 (CommonsenseQA dev) via `data/star-cqa.json`, but the only
   cite sat mid-figcaption; the heading subtitle now carries the sup. The
   References notes split per section — 1–3 beside the listing, GVM beside
   the closing blocks it supports.
