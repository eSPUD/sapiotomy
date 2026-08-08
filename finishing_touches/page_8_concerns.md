# Page 8 — Best-of-N and Verifiers

**Why this page has its own file.** Four of five review dimensions grade it `fair`, more than any
other page in Act 2. It is the only one of the new pages 5–9 that never received the copy-and-
apparatus pass pages 5–7 got, and the seam is visible to a reader inside a single act. Its central
evidence figure is labelled in notebook shorthand. It defines its own subject three figures after
first use. And it states an unresolved statistical ranking as fact on a page that quotes a p-value
for everything else.

None of this is a data problem. The measurement is sound, the artifacts are complete, and the
reproducibility dimension graded the page `good`. This is a presentation debt, and it is all
fixable in one pass.

**What is already right, and must not be "fixed":** the lede. *"Counting asks what is most common.
Judging asks what is best."* is the tightest definition open in the deck, and leading with the
resolved win is marked **Settled** in `docs/page_8_measured_payoff.md` §9 ("Lead with the win. The
resolved result opens the page and the tie takes the closing beat"). A reviewer challenged it and
was refuted. Step 3's figcaption — *"Being good at the problems is not being good at judging
them"* — is a model earned takeaway.

---

## 1. The main evidence figure speaks notebook, not English

`Page8.tsx:372-375` renders `{r.selector}` directly as row labels, and `web/src/lib/page08.ts:267`
passes selectors through unmapped. What the reader sees on the page's primary figure:

```
majority · best-of-N (self) · best-of-N (qwen1.5b) · best-of-N (qwen7b)
best-of-N (math1.5b) · best-of-N (skywork-prm) · heuristic · logprob
```

Eight rows of internal identifiers. `logprob` appears nowhere in the page's prose — no legend, no
tooltip, no later figure explains it. `self` is never unpacked. The figure has no legend, and
figure 3 reuses the same raw names.

This is the exact fault class `docs/finishing_touches.md` §5 names as fixed on pages 5–7 —
"figures that arrive with no sentence saying what they are a picture of" — still live on page 8's
main figure. The page already proves it knows better: figure 1's legend maps this very selector to
`"best-of-N, trained verifier"` at `Page8.tsx:241`.

**Fix.** Add a reader-facing `label` field in `asPaired` in `web/src/lib/page08.ts` (keep `selector`
for lookups) covering **all eight rows**, not the five a first pass would catch:

| selector | label |
|---|---|
| `majority` | majority vote |
| `best-of-N (skywork-prm)` | best-of-N, trained verifier |
| `best-of-N (qwen7b)` | best-of-N, 7B generalist judge |
| `best-of-N (qwen1.5b)` | best-of-N, 1.5B generalist judge |
| `best-of-N (math1.5b)` | best-of-N, 1.5B math-specialist judge |
| `best-of-N (self)` | best-of-N, the writer judging its own answers |
| `heuristic` | hand-written length/format heuristic |
| `logprob` | answer log-probability |

Render `r.label` at `Page8.tsx:374` and widen `PAIR_M.left` to fit. Apply the same map to figure 3's
judge labels (`{j.name}`, `Page8.tsx:486`) so the two figures stay in sync.

**Also reconcile the row count with the spec.** `docs/page_8_measured_payoff.md` §6 specs this
figure at **six** rows, with the diagnostic rungs (`logprob`, `self`) in a printed table, "never on
a chart." Either drop those two rows or update the spec to bless eight labelled ones. Do not leave
the page and its spec disagreeing.

`Page8.test.tsx:87` asserts only `net<0` and `/shortest wins/`, so this change is test-safe.

## 2. "ch05" is unresolvable for every reader

`Page8.tsx:359` (chart title) and `Page8.tsx:616` (figcaption) anchor on *"ch05's own heuristic
scorer"*. The footer says only *"different chapters of the source we build on"* (`700-704`). The
book is never named anywhere in the deck — and that is **deliberate and test-enforced**:
`Page5.test.tsx:314` and `Page7.test.tsx:126` both assert the rendered body must not contain
"reasoning-from-scratch."

So a reader meets a chapter reference to a book that does not exist on the page. The instinct to
"just name the source once" is wrong — it would break two tests and reverse a house decision.

**Fix.** Replace the `ch05` shorthand at both `Page8.tsx:359` and `616` with a self-contained
phrase: *"the heuristic scorer from the source we build on."* Leave full source naming to the
notebook download, whose bundled README already names Raschka's *reasoning-from-scratch* and the
ch05 scorers in full. That is the pattern the rest of the deck uses.

## 3. "Verifier" is used before anyone says what it is

Step 1 opens *"The verifier takes the rightmost dot"* (`Page8.tsx:542-544`) and the specimen axis
reads *"what the verifier scored it →"* (`148`). The only definition — "trained to score rather than
to answer" — arrives in **step 3's** figcaption (`648`) and its margin note (`652-658`). The word
appears nowhere in pages 1–7, so a reader with no ML background meets a scoring axis with no scorer:
who judged, on what basis, trained how?

**Fix — and note what *not* to do.** Do **not** add a "step 0" idea section: its judging-vs-counting
content already exists as the lede's first two sentences, and duplicating it violates the house
minimal-verbosity rule. Do **not** rewrite the lede. Instead define the verifier at first use:
expand `Page8.tsx:542-544` to *"The verifier — a second model trained only to score solutions, never
to write them — takes the rightmost dot"*, and/or repurpose the step 1 margin note (`599-604`,
currently "Same batch, two rules") to carry that sentence with the Cobbe et al. 2021
`CitationBadge`, mirroring page 7's cited-for-the-technique margin.

## 4. Two headline sentences carry no statistics, and the run says they should

`Page8.tsx:645-648`: *"the best solver on this ladder is the worst judge on it. The only judge above
the vote is [skywork-prm]."*

The artifact disagrees with the confidence:

```json
"claims": { "judge_ranking_resolved": false, "a_weaker_judge_beats_counting": false }
```

The across-temperature means behind the figure differ by 2–7 points on ~78-item denominators, with
overlapping best/worst bars. Both sentences are true of the point estimates; neither is resolved.
On a page that attaches an exact McNemar p-value to every other comparison, its two strongest
sentences carry none.

**Fix.** Soften to point-estimate language — *"on this run, the best solver ranked last"* — or add
the clause saying the ordering is not resolved at this sample. The flag is already in the artifact,
so this is a copy change, not a re-run.

## 5. The apparatus is in a footer the act abolished

`Page8.tsx:693-704` is a single 11-line run-on paragraph mixing provenance (model, items, chains,
temperatures, date), test methodology ("differences are exact McNemar tests over the problems where
two rules disagree"), and citation rationale ("Cobbe et al. 2021 is cited for the technique … the
comparison between counting and selection is ours too"). The notebook download is a small `text-xs`
link at the very bottom (`684-691`).

Pages 5, 6 and 7 all put a provenance plate plus a prominent download directly under the lede, with
comments saying *"It is the pipeline's whole claim, so it stays above the fold"* and *"Pages 5 and 6
settled this shape."* Git history confirms this is a miss, not a choice: page 8's measured rewrite
(`f65adbf`) sits on a branch parallel to the 5–7 footer-retirement merge (`2fa1206`) — the merge is
not an ancestor of the rewrite.

**Fix, with two corrections to the obvious version.**

- Port the 5–7 plate: two-sentence prose, one mono instrument line, download as the only lit
  element (mirror `Page7.tsx:320-344`). Keep the "every selection rule reads the same candidates"
  line — `docs/page_8_refactor.md:254-256` requires it.
- Delete the footer. But **do not** add new per-step caveat notes: the same-candidates fact already
  appears three times in the body (intro `524-525`, margin note `599-604`, step 4 `664-668`).
  Only one thing is footer-only and needs relocating — the "the comparison between counting and
  selection is ours" disclosure, which fits the step 4 margin (`678` is an empty placeholder).
  The McNemar rationale is already in the notebook; that is a deletion, not a migration.
- **Do this in the same pass as page 9**, which has the identical footer-plus-bottom-chip shape.
  Fixing page 8 alone makes page 9 the new outlier.

## 6. Page 7's promise is never explicitly settled

Page 7 closes by naming the 23% of problems whose right answer was generated and thrown away, then
promises page 8 changes only the selection rule. Page 8's step 4 (`660-677`) never re-uses that
vocabulary; 78% appears nowhere as a visible number on the page. The reader arrives with one
question — does judging recover what counting discarded? — and the measured answer (mostly no:
coverage 78% against verifier 60% and vote 56%) is never said in words.

**Fix.** One sentence in step 4, quoting numbers the page already exports rather than deriving
anything new. Figure 3 already measures exactly this quantity — its y-axis is "picks a correct
candidate (%)" defined only on items where a correct candidate exists, with the majority line at
72% and the trained verifier at ~77%. So:

> On the problems where a right answer was generated at all, the vote returns it 72% of the time and
> the trained verifier 77% — so most of what page 7's vote threw away stays thrown away under
> judging too.

Place it before the existing pivot sentence ("So the question is not how many candidates…"), which
it then motivates. No new figure annotation is needed.

## 7. Its handoff sentence on page 7 is false

Covered as priority 1.1 in [`finishing_touches.md`](finishing_touches.md): page 7 claims page 8
"keeps the same 16 candidates" while `web/data/page-08-derived.json` records
`page_7_agreement.same_candidates: false` and 12,800 of its own generations. The fix lives on page
7, but the receipt belongs here — page 8 measured the agreement (vote 55% vs 56%, coverage 78%
both) and renders it nowhere. Surface it in a margin note when fixing page 7's sentence.

---

## Suggested order

1. §4 and §7 — the two accuracy problems. Copy-only, no re-run, highest embarrassment risk.
2. §1 and §2 — the label map and the `ch05` phrase. One file each, test-safe.
3. §3 and §6 — two sentences, both quoting data already on the page.
4. §5 — the shell conversion, done together with page 9.
