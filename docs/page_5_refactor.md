# Page 5 — "How to Reason" refactor spec

**Status:** notebook drafted (`notebooks/page_05_how_to_reason.ipynb`), pending approval; the
page itself is unchanged. Act 2's opening page.

**Implementation follows the notebook-first pipeline** in
[page_6_refactor.md](page_6_refactor.md) section 6, which is canonical for every page resting on
traces or empirical analysis: spec to notebook, notebook refined and approved, notebook
translated to JS, page renders committed logs with no inference at demonstration time.

**What we take from `reasoning-from-scratch`:** ch04 section 4.3's mechanism, which is one line
(`prompt + "\n\nExplain step by step."`), plus the ch03 harness. Not its numbers.

---

## 0. The decision that shapes everything below

### The prompt is the lever, so the model must not be

Page 5's claim is that *changing the prompt* changes the behaviour. With a hybrid model it
would be trivial to get a blurt and a chain by flipping the thinking toggle, and that would be
a demonstration of a product feature rather than of a prompting technique.

**So thinking stays OFF for the entire page.** Same weights, same mode, same decoding, and the
only thing that varies is the words in the prompt. This is load-bearing and it must be stated
on the page, because a skeptical reader will otherwise assume we flipped a switch.

---

## 1. Page Objective & Core Narrative

**Objective unchanged and it is the right one.** Act 1 ended asking whether a machine can be
walked down a road. The first tool is the simplest: show it one.

**What the page currently is.** `COT_DEMO` ([authored.ts:361](../web/src/lib/authored.ts:361))
quotes Wei Figure 1 verbatim: the cafeteria problem, the "The answer is 27" blurt, the
three-line chain, and the tennis-ball exemplar. The comment says so explicitly. Figure 2 redraws
the same paper's per-scale table. The page is a faithful, well-built retelling, and a retelling
is what it should stop being.

**Revised narrative, three beats:**

1. **One line of prompt, two behaviours.** Same model, same question, same decoding. Add four
   words and a chain appears. Real traces, both of them.
2. **So what exactly do you say?** The prompt ladder, measured. Bare question, forced blurt,
   the magic phrase, one worked example, several. This is "how to reason" as an actual
   experiment, and its ranking is not obvious in advance.
3. **The chain costs something.** The formulation that buys the most accuracy also writes the
   most. Hand to page 6.

**What leaves the page entirely.** The emergence claim and the model-size axis. Page 5 is about
*how* to make a model reason; where it stops working is a different subject with a different
evidentiary bar, and one we cannot meet with two checkpoints. No figure on this page has model
size on any axis, which is the structural way to guarantee the page cannot be read as making a
size claim.

---

## 2. Proposed Visual Layout / Diagrams

### Figure 1 (step 1) — the lever, in three panels

Three real completions on **one problem**, from one model at one setting. The page opens on the
four-word diff and ends on the worked example, so it travels from *tell it* to *show it*, and
figure 2 then explains why the second buys more.

```
  Qwen3-4B · thinking off · greedy · one question, three prompts

  ┌── the default ──────────┐ ┌── + "Explain step ──────┐ ┌── worked example ───────┐
  │                          │ │      by step."          │ │    prepended            │
  │ [real blurt, 1 line]     │ │ [real chain, N steps]   │ │ [real chain, exemplar's │
  │                          │ │                         │ │  shape]                 │
  │ ✗   9 tokens             │ │ ✓   180 tokens          │ │ ✓   204 tokens          │
  └──────────────────────────┘ └─────────────────────────┘ └─────────────────────────┘
        nothing added              four words added            an example added
```

Every rung shares ch03's `render_prompt` stem; instruction rungs add text *after* it and
exemplar rungs add *before* it. The notebook splits on that stem and emits `prompt_before` and
`prompt_after` per panel, so the page has **one highlight rule for all three** rather than a
per-rung special case.

The interaction survives from the current page and is good: a switch, then ask, then walk the
chain a step at a time. What changes is that all three outputs are real, and the switch now
moves along **the prompt**, with the diff shown explicitly.

**The third panel's caption is about shape, not correctness.** What a worked example
demonstrably changes on one problem is the format the chain takes; that it also scores higher
is figure 2's claim, made across the item set where it can actually be supported. Claiming more
than shape here would outrun the run (section 6).

**Step segmentation comes from the notebook, not from TypeScript.** Walking a chain a step at a
time requires the trace divided into steps, which is a derivation; doing it during translation
would put logic on the page that the cross-language agreement test cannot check. `derived.json`
carries `steps` per panel, each with a contiguous token range covering every token, so the
reveal animates real token boundaries and stops at step ends.

**Second panel, optional, on the same figure: two models, same prompt.** Permitted and useful,
with one strict rule. The comparison is about **whether a chain appears and what shape it
takes**, never about who got the answer right. Both models produce a chain, because the prompt
works on both; the chains differ in quality, and that difference is what the rest of Act 2 is
about. Any caption that could be read as "the smaller one cannot reason" is out of scope for
this page and must be rewritten. If the two traces cannot be captioned without implying a size
law, cut the panel.

### Figure 2 (step 2) — the prompt ladder

This replaces the emergence chart completely. Horizontal bars, one per prompt formulation, same
model, same items, same decoding, thinking off throughout.

```
  bare question              ████████
  "answer with the number"   ██████
  "explain step by step"     ████████████████████
  one worked example         ██████████████████████
  several worked examples    ███████████████████████
                             └─── share of problems solved ───┘

  tokens written, same order:   12 · 8 · 214 · 260 · 291
```

Why this is the right figure for this page:

- **It is literally the page's title as an axis.** How to reason means what to put in the
  prompt, and this varies exactly that.
- **The ranking is a real question.** Does a worked example beat the magic phrase, and by how
  much? Readers wonder, and nothing on the current page answers it.
- **It cannot be misread as a size claim,** because size appears nowhere on it.
- **It carries its own cost row,** which is the handoff.

The forced-blurt rung matters and should not be dropped for tidiness: it is the floor, and it
shows that the model's default is already doing a little reasoning even when nobody asked.

### Step 3 — the close

One paired readout, not a third chart: the best rung's accuracy next to its token count. The
sentence the page ends on is that the chain was not free, and page 6 begins by metering it.

---

## 3. Empirical Data / Reasoning Traces Needed

**Same instrument as pages 6 to 8**, which is what makes Act 2 one continuous measurement:
Qwen3-4B primary, Qwen3-1.7B for the optional two-model panel, bf16, MATH-500 levels 4 and 5,
`extract_final_candidate` then `grade_answer`, greedy decoding.

**The sweep is one pass per rung.**

| Rung | Prompt | Note |
|---|---|---|
| bare | the question alone | the true default |
| forced blurt | + answer-only instruction | the floor |
| zero-shot CoT | + "Explain step by step." | ch04 section 4.3's exact mechanism, one line |
| one-shot | one worked example prepended | see below on where the example comes from |
| few-shot | three worked examples prepended | diminishing returns expected |

Five rungs x ~160 items, greedy, thinking off. Smaller than page 6's sweep. Recorded per item:
prompt rung, full trace, extracted answer, correctness, tokens generated.

**The worked examples are real traces, not authored ones.** This is the detail that keeps the
page honest. Take held-out problems the model already solved correctly under the zero-shot CoT
rung, verify them, and prepend those as the exemplars. The few-shot prompt is then built out of
the model's own verified-correct work on different problems, so nothing on the page is written
by us and the exemplar is re-derivable like everything else. Held-out means the exemplar
problems never appear in the evaluated set.

**Figure 1's specimens are curated from the same run**, using page 9's method: search the dump
for a problem where the bare prompt blurts wrong and the CoT prompt lands right, with a chain
short enough to walk on screen. That pairing is common enough that legibility, not existence,
will be the binding constraint.

**One risk worth naming.** A modern instruction-tuned model may already write some working when
asked a bare maths question, so the bare rung might not blurt cleanly and the gap between rungs
1 and 3 could be small. If so, the forced-blurt rung carries figure 1 instead, and the page's
framing shifts from *make it reason* to *let it reason*, which is a more accurate description of
a 2026 model and costs the page nothing. Decided from the run itself — the notebook measures the
bare rung's share of items showing working and records the verdict in `derived.json`; do not
paper over it.

---

## 4. Text / Captioning Balance

- **Lede:** two sentences. Something in the shape of: the technique of prompting for
  step-by-step work is not ours; what follows is that technique run on a model you can download.
- **Figure 1:** one caption naming the intervention and the constraint (only the prompt changed;
  the model never moved). The highlighted prompt diff does the rest.
- **Figure 2:** one sentence on the ranking, and it should name the surprise if there is one.
  Do not describe the bars.
- **Step 3:** one sentence, the handoff.
- **Margin notes:** the deck's existing convention holds. Operating hints where a control needs
  one, and bare cites beside the figure they back. Wei et al. sits beside figure 1 (few-shot
  chain of thought) and Kojima et al. beside the zero-shot rung of figure 2, since those are the
  figures whose *techniques* they originate. Cite the technique, not the measurement: the
  numbers are ours, so no cite should carry a number or sit where it implies the data came from
  a paper.
- **Chips:** the "quoted from Wei et al. Fig. 1" chip is deleted along with the quotation. The
  "no live model" chip is replaced by a provenance chip naming model, mode, decoding, item set
  and date, with **thinking off** stated explicitly.

---

## 5. Transition / Flow

**From page 4.** Unchanged and already good. Act 1 closed on whether a machine can be walked
down a road; page 5 shows it being walked.

**To page 6, which is the reason this refactor is happening now.** The current close, that the
road only helps a big-enough walker, hands page 6 a claim about model size that page 6 does not
use and cannot support. The new close hands over the thing page 6 is actually about.

The prompt bought a chain. The chain is long. Length is tokens, and tokens are compute, and the
reader has just watched the token count go from single digits to hundreds for a few points of
accuracy. So the question page 6 opens on is no longer abstract: **how much of that length do
you actually need?** Page 6's first move, capping generation and forcing an answer, is then
obviously the next thing to try rather than a new topic.

The two pages also become one experiment read twice. Page 5 varies the prompt at unlimited
length; page 6 fixes the prompt and varies the length. Same model, same items, same harness.

---

## 6. What the page is allowed to claim

The claims contract for the translation step ([page_6_refactor.md](page_6_refactor.md) §6):
the notebook produces the numbers, and this section bounds the sentences they can support.

**Supported by the run:**

- Adding "Explain step by step." changes what the model writes — one model, one setting, both
  traces shown in full, re-derivable from the notebook.
- The five formulations rank as `derived.json` reports, on MATH-500 levels 4 and 5, thinking
  off throughout.
- The formulation that scores highest also writes the most tokens.
- The worked examples in the few-shot prompts are the model's own verified-correct solutions
  to held-out problems.
- On the specimen problem, prepending a worked example changes the **shape** of the chain. One
  problem cannot support more than that, which is why the accuracy claim for exemplar rungs is
  made by figure 2 across the item set and never by figure 1's third panel.

**Not supported, and not to appear on the page:** anything about model size or emergence
(section 1); any general claim about chain-of-thought beyond this model, dataset and
difficulty band; any number attributed to Wei et al. or Kojima et al. (section 4).

**Limitations, stated rather than buried:**

- *n* = 160 in `FULL`, so adjacent rungs within a couple of points are not resolvable, and
  the caption must not rank rungs that overlap.
- Greedy decoding diverges on a handful of items across hardware; re-deriving reproduces the
  shape and the ranking, not every digit.
- The exemplar harvest prefers the shortest correct held-out solutions — a legibility choice,
  which means the exemplars are not a random sample of the model's correct work.
- `forced_blurt` is one phrasing of "do not explain"; a different phrasing would move the
  floor.
- Step segmentation is a rule (paragraphs, then lines, then sentences, with digit-free
  fragments merged), not a model's judgement of where a reasoning step ends. It is visible in
  the notebook and a reader can disagree with it.

**Blocking gate on the specimen.** If `derived.json` reports `specimen_is_fallback: true`, the
run found no problem where the default rung misses and zero-shot CoT lands, and figure 1's
panels are illustrative only. That run must not be translated to the page. Figure 2's
aggregates are unaffected by the fallback and remain valid.

---

## Open questions for review

1. ~~Does the two-model panel survive?~~ **Resolved: not built in the notebook draft.** The
   notebook carries one checkpoint and no panel code, so figure 1 is single-model. The design
   in §2 stands if the panel is revived later — as its own cell, under the strict rule that
   the comparison is chain shape only, never correctness.

**Resolved in review of the notebook draft:**

- *Figure 1 leads with zero-shot CoT, but the page's registered concept is few-shot.* Resolved
  by adding a **third panel**: the figure opens on the four-word diff and ends on the worked
  example, so both mechanisms are present and the page arrives where its concept line says it
  does. The third panel is a preference in the specimen sort, never a filter, so it costs the
  search nothing.
- *`derived.json` carried no step segmentation.* Resolved: segmentation is a notebook
  derivation with a visible rule, emitted per panel with contiguous token ranges.
- *`QUICK` could hard-fail on the specimen search.* Resolved: specimen search degrades with
  `specimen_is_fallback` rather than raising, and `QUICK`'s eval grid went from 12 items to 24.
  The pipeline standard in [page_6_refactor.md](page_6_refactor.md) §6 now states precisely what
  `QUICK` does and does not guarantee.
2. **Few-shot count.** Three exemplars is a guess. If the ladder shows one-shot and few-shot
   landing on top of each other, collapse them into a single rung and reclaim the space.
3. **What if the bare rung already reasons?** Covered in section 3, but it changes the page's
   framing verb, so worth a decision rather than a default.
