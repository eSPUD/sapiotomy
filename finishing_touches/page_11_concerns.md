# Page 11 — The Keystone: The Test-Time Compute Scaling Law

**Why this page has its own file.** It carries the only place in the deck where one page states
something another page measured to be false. It is also the act's payoff page and its only invented
centerpiece, sitting immediately after five pages that proved everything on them can be measured.
The refactor spec at `docs/page_11_refactor_spec.md` fixes both, and this review endorses it — but
the contradiction is on the live page today and does not need to wait for a GPU.

> **Updated after the merge of `c194308`.** The spec and `notebooks/page_11_training_vs_scale.ipynb`
> are now on main. **Arm 0 has been run and gate 1 passed bit-exactly** (max drift 0.0 against pages
> 6/7/8's shipped aggregates), so §2's first step below is complete and pages 6–8 have been
> independently audited as a side effect. Gate 2 and arms A–C await a GPU. Nothing on `Page11.tsx`
> changed, so §1 — the contradiction — is still live and still the priority.

---

## 1. The mechanism paragraph contradicts page 7's shipped measurement

`Page11.tsx:988-991`, the paragraph titled *"Why difficulty decides the game"*:

> On hard ones every chain breaks somewhere, so no number of re-draws holds a right answer to find.
> **Thinking amplifies competence; only parameters create it.**

`web/data/page-07-derived.json`, measured on exactly those MATH-500 L4/5 items:

```json
"handoff": { "n_chains": 16, "plurality_accuracy": 0.55, "coverage": 0.78, "thrown_away": 0.23 }
```

The right answer is somewhere in 16 samples for **78%** of these problems. The chains do not all
break. What fails is the *selector*: the vote returns the right answer on 55%, the trained verifier
on 60%, an oracle on 78%. Page 7 says this in prose on the page — *"The right answer was somewhere
in the pile on 78% of problems. The vote returned it on 55%"* — and page 9 spends a whole page on
why the selectors miss.

So a reader walking 7 → 9 → 11 in order, which is the order the deck asks for, catches the deck
disagreeing with itself about its own data. This is the single most damaging finding in the review,
and it was confirmed independently three times.

**Fix, available today, no run required.** Replace the "every chain breaks" clause with the measured
mechanism:

> On hard ones a correct chain still turns up, but rarely enough that no realistic selector can
> reliably fish it out — the right answer is in the pile far more often than any rule retrieves it.

Stroebl et al., **already cited on this page**, is the published form of exactly that point, so the
citation apparatus needs no change. The bolded closing sentence survives if it is corrected to what
the deck actually measured: *"thinking amplifies what the weights hold; only weights create it —
bigger, or better-trained."* That is also the sentence the refactor spec lands on, so patching now
costs nothing later.

## 2. The act's climax is its only authored centerpiece

`Page11.tsx:1156-1167` (footer): the section-1 allocator curves are *"authored illustrations pinned
to the cited findings, not digitized data."* That disclosure is honest and the page is not dishonest
anywhere. But it lands immediately after five consecutive pages that replay their own measured runs,
and it is the page the whole act is built toward.

**This is what the refactor spec exists to fix, and its first step needed no GPU — and has now
run.** Arm 0 derives the accuracy-vs-FLOPs family chart from `out/page_06/`, `out/page_07/` and
`out/page_08/` — runs the deck already owns — and gate 1 required it to reproduce the shipped
numbers exactly (3B greedy 43%, vote@16 55%, best-of-16 60%, coverage 78%, 7B greedy 60%) before
anything else ran. **It passed bit-exactly, max drift 0.0.**

That result is worth more than this page. It means a second, independently written derivation
reproduces pages 6, 7 and 8's published aggregates to the digit — the strongest evidence in this
whole review that the measured pipeline is sound, and it arrived as a free side effect of a page 11
gate. Note it in the reproducibility section of any writeup.

## 3. The distribution mechanism is stated twice at length

`Page11.tsx:985-992` (*"extra samples only re-draw from what the model can already produce…"*) and
`1030-1043` (*"sampling, voting, and search can only surface answers the model can already
produce… the distribution itself never moves"*) make the same argument at full length. The page's
own header plate at `44-46` claims this intuition *"is stated once here and reused by pages 12 and
13"* — it is stated twice on this page.

**Fix.** Cut `985-992` to one sentence pointing at the cited callout, e.g. *"Why hard mode is
unwinnable is §2's fine print: thinking amplifies a foothold; only parameters create one."* This
composes with fix §1 — the sentence you keep is the one you correct.

## 4. FLOPs denominates the page and is never glossed

First deck use is the lede itself (`Page11.tsx:860-866`, *"two ways to spend the same FLOPs"*), and
it recurs in every axis label, scoreboard cell and panel — *"total inference FLOPs (units of one 1×
answer, log scale)"* at `345`. A reader with no ML background is asked to read a page whose entire
argument is denominated in an unexplained unit.

**Fix.** One parenthetical at first use: *"FLOPs — floating-point operations, the raw count of
arithmetic a chip does; the common currency of training and thinking."*

## 5. Step 1 asks for a lot before the mechanism arrives

The reader is given a size control, a compute slider, a difficulty setting and a target line, and
must form a hypothesis from all four before the "why difficulty decides the game" paragraph explains
what governs any of it. Worth considering when the refactor rebuilds the section — the spec's plan
to add a **third control (training)** as the winning move the size and compute knobs cannot find is
good design, but it adds a fourth degree of freedom to a step that is already dense. Consider
staging the controls rather than presenting all of them at once.

---

## On the refactor spec: endorsed, with three additions

Both direction reviewers independently rated
`docs/page_11_refactor_spec.md` **right direction**, and one called it
the strongest spec of the set. Its discipline matches what pages 5–9 established: pre-registered
outcome branches written before the run ("Every branch ships"), build-blocking gates, an arm 0 that
must reproduce shipped numbers before anything new runs, and era-instance scoping that keeps Snell
and Wu as published receipts rather than casualties. Its §4.2 confound audit — especially the
mandatory easy-band arm, since L4/5 is Snell's own parameters-win regime — is exactly the honesty
the deck needs at its climax. Nothing in it should be dropped.

Three things to add:

**1. The deck already holds prior evidence the spec never cites.**
`docs/finishing_touches.md` §3 records experiment 4's Qwen2.5 result: Math-1.5B against the 7B,
with the 7B *allowed to reason*, is −6 / +1 / +0 across L3/L4/L5, none resolved. One generation of
instruction tuning closed the specialist gap that was +20 everywhere in Qwen2. That points squarely
at §6 branch 3 ("ties"), not branch 1 ("beats"). Draft the page copy from "ties at ~5× fewer FLOPs
per answer" and treat "beats" as the upgrade if the data delivers it. §3 explicitly warns that the
specialist-versus-7B framing "cannot be inherited from the handoff without re-reading these
numbers," and the spec inherits it.

**2. A downstream cross-reference sweep belongs in step 4.** If B1 lands, page 11's current headline
goes stale in at least three other places: `web/src/lib/pages.ts:60` ("a small model that thinks can
beat a 14x larger one — except on the hardest problems"), `Page12.tsx:641-642` ("the first knob that
lifts the curve without buying a single parameter"), and `Page13.tsx:576-579` ("Page 11's law: model
size picks your curve; test-time compute slides you along it"). Stale cross-references are this
repo's signature hazard — see the four live examples in
[`finishing_touches.md`](finishing_touches.md) — so the sweep should be a named task, not an
assumption.

**3. §7's rewritten handoff drops a loose end that two later pages catch.** The new handoff names
the measured recipe but loses the "waste" clause — reasoning bought at answer time and then
discarded — which page 12's lede and page 13's seam were both written to receive. Keep both ends in
the block.

**One coordination note.** This spec and the page 12 spec live in different worktrees and both touch
the 11→12 handoff: page 11's B4 names the specialist recipe, page 12's spec demotes the specialist
gate notebook. They are compatible — finished-specialist-wins handing off to the-loop-that-builds-
one is a clean seam — but only if they are merged by one hand, in one pass.

---

## Suggested order

1. §1 — the contradiction. One paragraph, no run, highest embarrassment risk in the deck.
2. §3 and §4 — the duplication and the gloss. Both compose with §1; do all three in one commit.
3. ~~Arm 0 of the refactor spec, with gate 1.~~ **Done in `c194308` — gate 1 passed bit-exactly.**
4. The rest of the refactor, with the three additions above folded into the spec first. Gate 2 and
   arms A–C are implemented in the notebook and need only a GPU.
