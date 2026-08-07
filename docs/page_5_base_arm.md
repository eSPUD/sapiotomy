# Page 5 — the base-checkpoint arm

**Extends** the notebook described in [`page_5_notebook_v2.md`](page_5_notebook_v2.md). Nothing
already shipped changes: the same items, the same stem, the same three condition suffixes, the same
grader, the same trace bank. This adds **one checkpoint** to the sweep and **one figure** to the
page.

**The gap it closes.** Page 5 is titled *Chain of Thought: Reasoning Out Loud* and cites Wei and
Kojima for the technique, and then its only measurement of that technique is a null: adding
"Explain step by step." to Qwen2.5-3B-Instruct moved the score 0.0 points, 12 fixed and 12 broken,
±9.6. The page names a thing and never shows it working. Everything on it is about what happens
when a chain is *removed*, and a reader is entitled to ask what the prompt was ever for.

The answer is that it was for a model that had not been instruction-tuned. rasbt's ch04 measures
exactly our `zero_shot_cot` suffix on a base checkpoint and gets +25 points:

| | ch04, Qwen3-0.6B-**Base** | ours, Qwen2.5-3B-**Instruct** |
|---|---|---|
| ch03 stem alone | 15.2% | 43% |
| + `"\n\nExplain step by step."` | 40.6% | 43% |
| gain | **+25.4 pts** | **0.0 pts** (12/12 discordant, ±9.6) |

That is a citation, not a measurement of ours, and it crosses two model families, two generations
and a 5× size gap, so it cannot be set beside our number as if the two were one experiment. Running
the base checkpoint of the model we already use turns it into one experiment.

---

## 1. The arm

One checkpoint added to the sweep:

```
BASE = "Qwen/Qwen2.5-3B"          # the exact base of PRIMARY = "Qwen/Qwen2.5-3B-Instruct"
```

Same 100 items, same seed, same L4-5 band, same `GEN_CAP = 2048`, same greedy decoding, same
`render_prompt` stem, same three suffixes, same `extract_final_candidate` / `grade_answer`. **The
only thing that differs between this arm and the primary is instruction tuning.** That is the whole
point and it must stay true; any second difference and the contrast stops being attributable.

All three conditions run (300 generations), but they are not used equally:

| condition | on the base arm | plotted? |
|---|---|---|
| `bare` | the ch03 stem alone | **yes** |
| `zero_shot_cot` | + "Explain step by step." | **yes** |
| `forced_blurt` | + "Give only the final answer…" | **no** — reported as a compliance number only |

`forced_blurt` is run because it is nearly free at this point and because it answers a question the
page raises implicitly: the gag is an *instruction-following behaviour*, and a model that does not
follow instructions cannot be gagged. Expect `blurt_compliance` to fail on this arm. That failure
is the finding, not a bug, so it is recorded as a number and never drawn as a bar.

**Licensing is unchanged.** `Qwen/Qwen2.5-3B` carries the same Qwen Research License as
`Qwen/Qwen2.5-3B-Instruct`, which the deck already ships. No new exposure. (The 1.5B and 7B are
Apache-2.0; the 3B pair is not, in either variant.)

---

## 2. The one engineering hazard, and it is silent

The notebook's local `complete()` wrapper (cell 16) applies the chat template unconditionally:

```python
chat = tok.apply_chat_template([{"role": "user", "content": prompt_text}],
                               tokenize=False, add_generation_prompt=True)
```

**`Qwen/Qwen2.5-3B` ships a chat template anyway.** Its `tokenizer_config.json` carries a 2,427
character ChatML template it was never trained against, so this call will not raise. It will
succeed, wrap the stem in `<|im_start|>user … <|im_start|>assistant`, and hand a base completion
model a turn structure it has no reason to close. Its EOS is `<|endoftext|>`, not `<|im_end|>`, so
generation would never stop on end-of-turn: every trace would run to a stop string or to the 2048
cap. A near-100% truncation rate on the arm whose accuracy we are about to compare is precisely the
failure the existing per-condition truncation gate exists to catch, and it would present as "the
base model rambles" rather than as "we prompted it wrong".

**The fix, and it is already half-built.** `harness.complete` was written for exactly this case and
its docstring says so: raw text, no chat template, `stop` with no default because the rule that ends
a base model's answer is a claim. Page 5's stop string is already the right one, since the ch03 stem
contains `Question:\n` and a base model's habit is to invent the next question. So:

```python
def complete(prompt_text, mdl, tok, max_new_tokens=None, *, chat):
    """`chat=False` for base checkpoints: raw completion off the stem's "Answer:".
    A base tokenizer will happily apply a ChatML template it was never trained on,
    so this is passed explicitly per model rather than sniffed."""
    text = tok.apply_chat_template([{"role": "user", "content": prompt_text}],
                                   tokenize=False, add_generation_prompt=True) if chat else prompt_text
    return harness.complete(text, mdl, tok, stop=["\nQuestion:"],
                            max_new_tokens=max_new_tokens or GEN_CAP)
```

No default on `chat`, for the same reason `stop` has none. Sniffing for a chat template is exactly
the check that returns the wrong answer here.

---

## 3. Gates

Two new flags in `derived.json.claims`, and one existing gate gets a per-arm scope.

| flag | condition | consequence if false |
|---|---|---|
| `base_arm_extractable` | boxed rate ≥ 50% on the base arm's `bare` condition, or truncation < 10% | **the arm does not ship.** A low boxed rate means the grader's fallback-to-last-number is carrying the score, and we would be plotting format compliance as reasoning |
| `instruction_gain_resolves` | McNemar p < 0.05 on base `bare` vs base `zero_shot_cot` | the figure keeps both bars but the caption says "did not resolve", never "no gain" |
| `blurt_compliance` | *(existing)* now evaluated **per arm**; the primary must pass, the base arm is expected to fail | a failing base arm suppresses its `forced_blurt` bar and prints the compliance fraction instead |

`base_arm_extractable` is the one that matters and it is not paranoia. The one-shot and few-shot
rungs were cut from this page precisely because they moved the `\boxed{}` rate 22% → 93% on one
model while barely moving the score ([`page_5_notebook_v2.md` §1](page_5_notebook_v2.md)). A base
checkpoint is the most likely thing in the deck to reproduce that artifact. rasbt gets 15.2%
extractable out of a base model, which works, but his grader's fallback is doing real lifting, and
we do not get to inherit that quietly.

**Report beside the arm, always:** boxed rate per condition, truncation rate per condition, median
tokens per condition. If the gain turns out to be mostly "the suffix taught it to write `\boxed{}`",
the honest page says that and the figure changes meaning. That outcome is still worth publishing;
it is just a different sentence.

---

## 4. `derived.json` delta

Additive. Nothing existing changes shape, so the page keeps loading and the current figures keep
drawing while this is in flight.

```
figure_0{                                     # new, drawn in page-5 step 1
  base { model_id, label, params, quant, license,
         bare{ n, n_correct, accuracy, ci, median_tokens, boxed_rate, truncation_rate },
         cot { n, n_correct, accuracy, ci, median_tokens, boxed_rate, truncation_rate },
         blurt_compliance, blurt_median_tokens },
  instruct { …the same shape, from the primary… },
  contrasts{ base_cot_gain  { delta_pts, ci_pts, fixed, broken, p },
             instruct_cot_gain { …already computed as figure_2.contrasts[1]… } },
  same_family: true            # asserted, not assumed: base is PRIMARY's base
}
```

`figure_0.instruct.*` is a copy of numbers already in `figure_2`, not a recomputation. The
consistency assertions in [`page05.ts`](../web/src/lib/page05.ts) should check the two agree, the
same way they already check a solve count against its accuracy.

---

## 5. What the page may claim

**Supported once the gates pass:**

- Adding "Explain step by step." to the base checkpoint of Qwen2.5-3B moves the score by what
  `figure_0.contrasts.base_cot_gain` reports, on these 100 items, greedy. Gated on
  `instruction_gain_resolves`.
- The same string on the instruction-tuned checkpoint of the same weights, at the same size, on the
  same items, moves it by the bound already reported. Gated on `instruction_null_bounded`.
- Therefore: **on this family, at this size, the difference between the two is instruction tuning
  and nothing else.** This is the sentence the arm exists to earn, and it is the strongest form the
  page's thesis can take.
- The gag is an instruction-following behaviour: the base checkpoint complied on *k* of *n* items.

**Not supported, and not to appear:**

- Any claim that CoT prompting "works on base models" in general. One family, one size, one
  benchmark, one language, one phrasing of the suffix.
- Any comparison of our base number to rasbt's 15.2% / 40.6% as though they were the same
  experiment. Different family, different generation, 5× size gap, different implementation
  (his is a from-scratch Qwen3 reimplementation loading `.pth` from `rasbt/qwen3-from-scratch`, not
  the HF transformers path). It may be cited as an independent result pointing the same way; it may
  not sit inside our figure.
- Anything about *when* in training the chain arrived. We measure two endpoints, not a trajectory.
  Page 12 owns that.
- Any claim that instruction tuning *causes* reasoning. It is the only variable that differs, which
  licenses "the difference is attributable to instruction tuning", not a mechanism.

---

## 6. Where it lands on the page

**Recommendation: page 5, step 1, one compact figure.** The definition section currently ends on
"every step is text the model has to write before it can write the next one" and then hands off to
figure 1. A two-row slope between those two beats — base going up steeply, instruct flat — is the
historical setup the rest of the page needs, and it is what makes the title honest.

```
  + "Explain step by step."          bare        + suffix
  ────────────────────────────────────────────────────────
  Qwen2.5-3B          (base)         ●───────────────● +N
  Qwen2.5-3B-Instruct                ●───────────────● 0.0
```

Two rows, four dots, no axis furniture beyond a shared 0-100 scale. It must **not** grow into a
third figure with tabs and a stepper: page 5 is already dense and the copy pass that preceded this
was about removing weight, not adding it. If it cannot be told in one small figure and two
sentences, it belongs on page 12 instead.

**Fallback: page 12's opener.** Page 12 is where "this is a result about training rather than
prompting" already lands, and page 5's margin note already hands it there. If page 5 turns out to
have no room, the arm still earns its keep as page 12's first figure, and page 5's margin note
gains one clause pointing at it.

---

## 7. Cost and order of work

300 generations on one checkpoint: bf16 3B fits a 16 GB card, and the sweep loop, resume log and
trace bank all already handle a fourth model with no change. Budget more wall-clock per generation
than the instruct arm, because a base model is likelier to run toward the cap.

1. `complete(..., chat=...)` with no default, and every existing call site updated to `chat=True`.
   Ships alone; it is a no-op refactor and the existing traces must replay byte-identical after it.
2. Add `BASE` to the sweep as a fourth model. Confirm on 10 items that truncation is not ~100%
   before spending the other 290, because that is the symptom of hazard §2 and it is cheap to catch.
3. Full arm, gates, `figure_0` into `derived.json`, cross-check `figure_0.instruct` against
   `figure_2`.
4. Republish `page-05-derived.json` and the notebook zip. **The zip is the page's whole claim**, so
   it goes in the same commit as the figure, never after it.
5. The figure and its two sentences.

Step 2's answer decides whether steps 3-5 happen at all. If the base checkpoint cannot be graded
without the fallback carrying it, the honest outcome is a paragraph in this document saying so and
no figure, and rasbt's ch04 stays what it is: someone else's measurement, cited as such.
