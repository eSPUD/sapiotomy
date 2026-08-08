# Page 7 — Frequency Voting

**Why this page has its own file.** Not because it is weak — as an explainable it is one of the best
in the deck, and two dimensions grade it `good`. It gets its own file because it carries the single
most damaging defect in the review (a sentence the deck's own data denies), because its download
bundle is broken in two independent ways, and because its main figure names its three lines twice,
differently. Three of five dimensions grade it `fair` on the strength of those specific breakages,
not on the page's quality.

**What is already right.** The pizza parable (`Page7.tsx:355-368`) is two paragraphs that exist to
land one load-bearing clause — *wrong in uncorrelated ways* — and the entire rest of the page
measures that clause. The two explainer boxes under figure 2 say only what the figure cannot. The
Limits margin note states each caveat exactly once, including the fitted-temperature admission.
Prose is ~12% cuttable, second-tightest in the deck.

---

## 1. The closing handoff asserts something page 8's data denies **[the review's top finding]**

`Page7.tsx:649-652`:

> Page 8 keeps the same **16** candidates and changes only the rule for picking one.

`web/data/page-08-derived.json`:

```json
"page_7_agreement": { "same_candidates": false, "page_07_vote": 0.55, "page_08_vote": 0.56,
                      "page_07_coverage": 0.78, "page_08_coverage": 0.78 },
"manifest": { "candidates": { "source": "page 8's own generations" } }
```

Page 8 generated 12,800 fresh chains across four temperatures under run hash `5a00d35f`; pages 5–7
run on `9ab2b579`. The sentence was true of the plan — `docs/page_8_refactor.md` specified that page
8 "runs no generation at all: it opens page 7's `traces.jsonl`" — and the implementation went the
other way, as `docs/page_8_measured_payoff.md` records ("Page 8 generated its own pool: 12,800
chains"). Nobody went back to the sentence.

This is the deck's most load-bearing seam claim, it is an identity claim, and the shipped JSON
refuses it in a field named `same_candidates`. A reviewer who opens the download finds it in one
grep.

The galling part: **page 8 measured the agreement and it is excellent.** Vote 55% against 56%,
coverage 78% both ways, gate `agrees_with_page_7: true`. The honest sentence is as strong as the
false one.

**Fix.**

> Page 8 re-runs the same protocol on the same problems, checks it lands where this page landed, and
> changes only the rule for picking one.

Then surface `page_7_agreement`'s numbers in page 8's margin as the receipt.

**And fix the artifact too.** `web/data/page-07-derived.json` carries `pool.note`:

> "page 8's candidate pile: the same chains, read by other selection rules"

Same stale claim, emitted by the page 7 notebook, shipped in the download. Correct it in the
notebook and republish, or the copy fix leaves the contradiction sitting in the data.

## 2. The download is broken in two independent ways

`notebooks/README.md:130-132` promises: *"The manifest records the notebook's sha256, so 'this file
made these numbers' is checkable rather than asserted."* I ran that check.

| | sha256 |
|---|---|
| `web/data/page-07-derived.json` → `manifest.notebook_sha256` | `2d1a51af…` |
| the notebook inside `web/public/notebooks/page-07-frequency-voting.zip` | `6bf06128…` |
| `notebooks/page_07_frequency_voting.ipynb` in the repo | `9c210953…` |

Three different hashes. **No obtainable copy of the page 7 notebook is the one its manifest names.**
Pages 5, 8 and 9 all pass this check (their manifest matches the bundled copy); page 6 fails the
same way.

Worse, the two copies differ in substance, not just in saved outputs. The repo notebook contains:

```python
# without this filter a None sorts against an int and the cell dies.
```

**The shipped zip does not have that filter.** And `notebooks/README.md:73-74` instructs the reader
to put page 6's `out/page_06/` on disk for page 7's grid derivation — page 6's shipped bank contains
exactly the extension-arm records (`budget=None`) that trigger the crash. So a reader who follows
the README's own instructions hits the exact bug the authors already fixed.

**Fix.** Rebuild the zip from the current notebook and regenerate the REPLAY manifest in the same
pass so zip, repo and manifest agree. The bundle test currently asserts only `derived.json`
equality; extend it to assert the zipped notebook's code cells match the repo copy, which is what
would have caught this. Consider hashing code cells only — the drift here is outputs and metadata,
and the code was never the problem.

**Related, already tracked.** `docs/finishing_touches.md` §2 notes that
`page-07-derived.json` records no precision at all: `manifest.models[0]` has `"quant": null,
"dtype": null` while the page asserts *"Qwen2.5-3B-Instruct · bf16"* (`Page7.tsx:328`). Backfill it
on the same replay.

## 3. The main figure's three lines have two sets of names

Step 3's intro (`Page7.tsx:458-467`) is the reading key for the page's central figure, and it bolds:

> **The vote** … **In the pile** … **T = 0**

The chart labels the same three lines:

> "the vote returns it" (`251-254`) · "at least one chain is right" (`242-245`) · "one greedy chain"
> (`256-260`)

Git history shows exactly how this happened: commit `ae6b70d` wrote the intro to match the
then-current labels; commit `a481d84` renamed the chart's labels — adding a comment that the old
names were *"the notebook's vocabulary and not a reader's"* — and left the intro untouched. The file
is now internally inconsistent: the comment at `473-475` still claims *"The three lines are named in
the step's intro"* when two of the three names appear nowhere on the chart.

`ChartFrame`'s `title` prop renders only as an `aria-label`, so a sighted reader never sees the
bridging text. A reader scanning for a line called "T = 0" finds "one greedy chain" and has to
supply the equivalence unaided.

**Fix.** Rename the intro's three bolded terms to the chart's labels — not the reverse, which would
restore the notebook vocabulary the author deliberately removed. Update the stale comment at
`473-475` while you are there.

## 4. "Greedy" is load-bearing here and first explained on page 10

The baseline line is labelled *"one greedy chain"* (`256-260`) and the headline callout reads *"One
chain of chain-of-thought, decoded greedily, solves 43%"* (`480-487`). The +12-point headline is a
contrast against that baseline. The word is first explained three pages later, in page 10's
`thoughtSearch.ts:51-53`. Pages 1–6 never mention sampling, temperature or likelihood at all.

**Fix — and note the altitude constraint.** The page *does* operationally define the baseline three
times already ("T = 0 turns sampling off, which makes all 16 chains identical", `465`; the flat-line
explainer at `491-493`). What is missing is only the word "greedy" being tied to that definition. So
this is smaller than it looks, and the obvious fix is wrong: `docs/page_7_refactor.md:225-234`
explicitly forbids the mechanism on this page ("Nothing about tokens, scores, or probability
distributions"), and the likeliest-next-word framing is page 10's owned reveal.

Change `465-467` to something like:

> T = 0 turns sampling off — greedy decoding, the setting pages 5 and 6 ran — so all 16 chains are
> the same chain.

Optionally echo it in the chart label (*"one greedy chain (T = 0)"*) so the intro's name and the
line's label finally match, which also closes §3.

## 5. Prose: real duplication, but less than it first appears

- **The discarded-answer gap is explained three times** around figure 2: the intro (`463-464`), the
  in-chart label (`269`), and the sub-chart caption (`476-479`) — whose own code comment claims it
  says "only the thing the intro cannot." Cut the caption, or reduce it to its one new fact ("and it
  widens as you add chains") folded into the intro.
- **The click instruction appears twice**, near-verbatim (`387-388` and `401-403`). Delete the
  in-card duplicate.
- **The diversity numbers are pre-narrated**: *"Turning the temperature up makes them disagree
  more"* sits directly above the row of numbers showing exactly that. End the caption at "averaged
  per problem."
- **Step 4 is *not* the four-block problem it appears to be.** A reviewer flagged the caption,
  control footnote, takeaway and margin note as overlapping; on inspection each carries unique
  content, "cut-off is a property of the run" appears once in rendered prose (the second hit was a
  code comment), and deleting the margin note would violate the page's documented one-note-per-step
  apparatus and lose its only unique claim ("A capped row and a finished row at the same N are not
  the same experiment"). **Fix only the one real duplication:** cut the margin note's second
  sentence ("The comparison the page makes is the last two columns, never the first two"), which
  repeats the takeaway, and keep its first.

## 6. The headline bundles sampling's contribution into the vote's

`Page7.tsx:480-488` quotes 43% → 55% against one greedy chain — a +12-point win for voting. The
decomposition lives in a margin note at `533-537`: against one *sampled* chain, the vote gains only
4 points, p = 0.39. The file's own header calls this *"THE TRAP"*.

The page is being honest — the number is in the margin, correctly labelled — and the header's rule
to quote the greedy contrast is defensible. But the reader who reads only the headline box leaves
with the wrong attribution.

**Fix.** Half a sentence in the headline box: *"sampling alone is worth part of this — see margin."*
Keep the quoted number as is.

## 7. Housekeeping

`docs/finishing_touches.md` §5 says page 7 still has "a footer doing the notebook's job, subsection
titles that name a conclusion, and figures that arrive with no sentence saying what they are a
picture of." All three are fixed — the page has margin notes, content-naming titles ("One box of
slips", "What the vote buys"), and figure-intro sentences. Commits `ae6b70d` and merge `2fa1206`
landed the work. **Close the entry** per the repo's own rule: delete it and link the commit.

---

## Suggested order

1. §1 — the false handoff sentence and the `pool.note` in the artifact. Highest priority in the
   whole review.
2. §2 — rebuild the zip and the manifest. A reader following the README currently hits a crash.
3. §3 and §4 together — one edit to `465-467` closes both, plus the stale comment.
4. §5, §6, §7 — copy trims and a tracker deletion.
