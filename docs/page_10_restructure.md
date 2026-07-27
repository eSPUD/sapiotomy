# Page 10 — restructuring "Searching Through Thoughts"

Three problems were raised: figure 1 reads as a pathfinding algorithm, figure 2 rests on Game
of 24 which nobody knows, and the sidenotes are too verbose. This plan resolves all three.
It is the output of a literature search, a concept-ideation pass, and an adversarial
verification pass, plus direct measurement of the engine that ships today.

> **STATUS: BUILT.** The plan below was carried out. Two things changed during
> implementation, both because the measurements said so rather than because the design was
> revised on taste — see **§6, What changed when it met the engine**. Everything in §2's
> behaviour table is now a *measurement*, not a target, and is asserted in
> `src/lib/act2thoughts.test.ts`.

---

## 0. What the research pass established

### Citations — verified, twice

Every number below was fetched from the primary source by the lit agent and re-fetched
independently by the verifier. Both passes agree.

| Source | Status |
| --- | --- |
| Yao et al. 2023, *Tree of Thoughts*, arXiv:2305.10601, NeurIPS 2023 | **confirmed**, incl. Table 3 (mini crosswords) and Table 2 (Game of 24) |
| Lee et al. 2025, *Evolving Deeper LLM Thinking* (Mind Evolution), arXiv:2501.09891 | numbers **confirmed**; venue is **arXiv only** — DeepMind's own publications page lists it as a preprint |
| Zhou et al., *LATS*, arXiv:2310.04406, ICML 2024 (PMLR v235) | **confirmed**, incl. the 100-question HotpotQA subset caveat |
| Koh et al. 2024, *Tree Search for Language Model Agents*, arXiv:2407.01476 | numbers **confirmed**; **venue unverifiable** — do not assert one |
| Hao et al. 2023, *RAP*, EMNLP 2023 | **confirmed** (incl. the non-monotonic CoT/GPT-4 row, which is genuinely in the paper) |
| Antoniades et al., *SWE-Search*, arXiv:2410.20285 | numbers **confirmed**; **"ICLR 2025" could not be verified** — must be dropped or flagged preprint |
| Boyle et al., *iToT*, arXiv:2409.00413 | **partially correct** — arXiv comments say "*will appear in* IEEE 2024 NLVIZ Workshop", i.e. not a confirmed publication record |

The Game-of-24 numbers currently on the page (7.3 / 4.0 / 9.0 / 45 / 74) are **accurate**. The
problem with them is recognizability, exactly as stated in the brief — not correctness.

### Three defects in the current page, found while checking

These are pre-existing and must not be inherited by the rewrite.

1. **A false claim in the copy.** `Page10.tsx:469` says *"MCTS finds the same route for a
   fraction of the bill."* Measured against its own engine, it does not. Running
   `search()` over `ROUTE_MAP` (24 towns, 31 roads):

   ```
   greedy    examined= 11  solved=false
   beam b=1  examined= 11  solved=false
   beam b=2  examined= 16  solved=true
   beam b=3  examined= 17  solved=true
   beam b=4  examined= 20  solved=true
   beam b=5  examined= 23  solved=true
   dfs       examined= 16  solved=true
   mcts      examined= 16  solved=true
   bfs       examined= 23  solved=true
   ```

   MCTS ties DFS exactly (16 = 16) and costs 70% of BFS. "A fraction of the bill" is not
   true. It also shows the beam slider has only **two** regimes (b=1 fails, b≥2 solves), so
   four of its five positions teach nothing — and `act2routing.test.ts` pins that as intended.

2. **A stale end-to-end test.** `tests-e2e/act2verifiers.spec.ts:32-40` asserts the strings
   `no solution found` and `✓ solved`. Neither exists anywhere in `src/`. The page renders
   `✗ stranded at …` and `✓ arrived · … mi`. That test cannot be passing.

3. **Page 11 already is figure 2, and already is Game of 24.** The brief described page 11 as
   a maze explorer. It is not. `Page11.tsx` is a **branching-factor slider (b = 1..5)** driving
   an SVG search tree with pruned branches dimmed, captioned with the **same
   `data/tree-of-thoughts.json` Game-of-24 numbers page 10 uses** — `"watch Game-of-24 success
   climb"`, a `BigNumber` labelled `Game of 24 solved (b = {b})`, and the io/cot/cotSc line
   repeated verbatim. So page 10's figure 2 currently duplicates page 11 outright, and Game of
   24 survives on page 11 three times over. See §7, *Open decisions*.

4. **A subtler honesty problem.** Today the single `beamWidth` state drives *both* the map
   search *and* the Tree-of-Thoughts bar (`interpolate(data, beamWidth)`). The map's beam width
   and Yao's *b* are unrelated quantities. The rewrite decouples them.

---

## 1. Decisions

| # | Decision | Rationale |
| --- | --- | --- |
| D1 | **Figure 1 = "Four Groups of Four"** — an authored 16-word grouping puzzle | The only concept where the reader *invents the trap themselves*, and the only one whose dead end resolves as a positive discovery |
| D2 | **Figure 2 = Yao et al. 2023, Table 3, mini crosswords** — including the two ablation bars | Same paper already in the repo, peer-reviewed, zero new citation risk, and the ablations prove the *mechanism* rather than just the outcome |
| D3 | **Adopt the Page 1 / Page 6 `Note` pattern**; delete the sticky aside entirely | The house style the brief asks for |
| D4 | **Replace `routing.ts` + `ROUTE_MAP` wholesale**, do not generalise them | They have exactly two consumers: `Page10.tsx` and `act2routing.test.ts`. Nothing else in the app touches them |
| D5 | **Author-and-measure before writing any copy** | Strategy outcomes are design *targets* until an engine says otherwise. Vindicated: two of them were wrong, and were caught before a word of copy was written (§6) |

### D1 — why "Four Groups of Four"

Sixteen everyday words split into four groups of four:

```
ROSE · LILY · VIOLET · HEATHER · PUPIL · LENS · RETINA · IRIS
BLOOD · NAVEL · SEVILLE · MANDARIN · CHERRY · RUBY · BRICK · WINE
```

True solution: **parts of the eye** = PUPIL, LENS, RETINA, IRIS · **flowers that are also
girls' names** = ROSE, LILY, VIOLET, HEATHER · **types of orange** = BLOOD, NAVEL, SEVILLE,
MANDARIN · **shades of red** = CHERRY, RUBY, BRICK, WINE.

The trap: `ROSE · LILY · VIOLET · IRIS` labelled simply **"Flowers"** is a genuinely
*tighter-sounding* group than the correct `ROSE · LILY · VIOLET · HEATHER`, which needs the
qualifier "flowers **that are also girls' names**". The evaluator ranks the wrong group above
the right one, **and it is right to, on the evidence it is allowed to see.** The second-ranked
option, `ROSE · LILY · IRIS · HEATHER` as **"Girls' names"**, is the same mistake in the other
direction. Both steal IRIS, which the eye needs.

This is the whole argument for it. Show most people those sixteen words and they reach for
rose/lily/violet/iris *before the page says anything*. So when greedy does the same, the reader
is not watching a machine be foolish — they are watching themselves. And the dead end resolves
as an **aha**: greedy strands holding HEATHER, PUPIL, LENS, RETINA — one homeless word and
three-quarters of a real group, one swap from being right. That is a positive fact the reader
can check, not an absence they must take on trust. It is true of every dead end in the space
(asserted in the test suite), so the page's line — *"three of them are a real group missing its
fourth, and that fourth is already spent"* — is never a bluff.

The evaluator's rule is stated in one sentence and is legible from the cards: **it rewards
tight categories and marks down anything needing a qualifier.** Its single blindness is that it
never checks whether a group strands the words it leaves behind.

That last axis is the sharpest discriminator among all seven concepts considered:

> **positive** dead end (reader discovers a fact) > **negative** dead end (reader must trust an
> absence) > **asserted** dead end (pure fiat).

Rejected, with reasons:

- **The Word Square** (runner-up, 4×4 crossword; ~28 nodes vs ~40) — its dead ends are negative
  existentials the reader cannot verify (*"no four-letter word for 'back end' starts with SE"*),
  and it renders as a grid. Its one real advantage is that figure 1 would literally *be*
  figure 2's task one size down. See §7.
- **The Irreversible Booking** — flights, prices and a running budget is constrained
  shortest-path with pounds substituted for miles. The same original sin as the road map.
- **Who Ate The Last One** — the puzzle does not work as written; the stated dead-end branch is
  in fact the correct one.
- **One Oven, Three Courses** — resource-contention scheduling; the proposed oven strip is a
  Gantt chart. Depth 3 leaves DFS's backtrack nothing to show.
- **Nothing Rhymes With Silver** — "nothing rhymes with silver" is common trivia, so most
  readers *won't* make greedy's move. That inverts the page's core rhetorical beat.
- **The Bug Hunt** — needs software intuition; every dead end is invented evidence by fiat.

### D2 — why the crossword ablations, not TravelPlanner

The lit agent recommended Mind Evolution on TravelPlanner (5.6 → 55.6 → 82.8 → **95.6%**, with
cost columns showing search was *cheaper* than sequential revision). It is genuinely tempting
and its numbers are fully verified. It loses on three counts:

1. It is **evolutionary/population search, not tree search.** On a page titled "Searching
   Through Thoughts" that hands off to an AlphaGo/MCTS interlude, the copy would have to spend
   a sentence apologising for the mismatch.
2. It is a **venue-less preprint**, on the TravelPlanner **validation** set (180 instances),
   with Gemini 1.5 Flash.
3. It needs a **new citation to defend**, on a page whose figure 1 is already an authored
   simulation. One disclosure per page is enough.

The crossword bars, from Table 3 of the paper **already in `data/tree-of-thoughts.json`**
(% of words filled correctly, GPT-4, 20 puzzles):

| Method | Words correct |
| --- | --- |
| Input-output prompting | 14% |
| Chain of thought | 15.6% |
| Tree of Thoughts, **backtracking off** | 20% |
| Tree of Thoughts, **pruning off** | 41.5% |
| Tree of Thoughts, full | **60%** |

Those two middle bars are the gift, and they are why this beats every alternative including
TravelPlanner. A plain outcome ladder says *search scored higher*. This says **it is the
backtracking, not the token spend** — which is the page's actual thesis, and the exact
mechanism the reader just operated in figure 1. Nothing else found in the search does that.

Everybody knows what a crossword is. Game of 24 is never mentioned.

---

## 2. Figure 1 — the new interactive

### The state space

- A **thought** = one committed group of four, with the category claimed and a one-line
  rationale. Example node text:
  - *"Shades of red — CHERRY · RUBY · ROSE · BLOOD. cherry red, ruby red, rose red, blood red:
    all four are stock phrases."* — 5/5
  - *"Shades of red — CHERRY · RUBY · BRICK · WINE. brick red and wine red are real, just less
    common."* — 3/5
- A **branch** = the sequence of groups committed so far. Depth 1 = one group locked,
  depth 4 = solved.
- The **evaluator** = a 0–5 confidence rating in the model's own voice: *"how sure am I that
  these four belong together?"* It scores only how tight the category sounds **in isolation**.
  It never looks at what the group leaves behind. A reader produces the same ratings unprompted
  — that is the point. It is identical across all five strategies and is never consulted for
  correctness.
- Every card also shows the twelve (then eight, then four) words still loose, greyed beneath it.
  **That leftover strip is what makes the trap visible.**

### Measured behaviour — as built, and pinned by tests

Every figure below was produced by running `search()` over the shipped instance. The space has
**32 states** (7 candidate groups, 1 goal, 5 dead ends).

| Strategy | Thoughts scored | Outcome |
| --- | --- | --- |
| Greedy | **11** | **fails** at depth 3 |
| Beam b=1 | **11** | **fails** — *identical to greedy; the page says so* |
| Beam b=2 | **15** | **fails** — spends both slots inside the trap |
| Beam b=3 | **21** | **solves** — the cheapest width that works |
| Beam b=4 / b=5 | **24 / 26** | solve, at a strictly higher bill |
| MCTS | **21** | **solves** — matches the best beam, without being told a width |
| DFS | **23** | solves, after a visible backtrack |
| BFS | **31** | solves, most expensive |

Two things this buys that the current map does not have:

- **Three beam regimes** (fail / fail / cheapest-that-works), so the slider teaches something
  at every position. Today it has two.
- **A true cost ordering** MCTS < beam-3 < DFS < BFS, with BFS at 2–3× beam-3. Today MCTS and
  DFS are tied at 16.

The structural recipe that produces this, and which the authored instance must satisfy:

- Branching factor 4–5 at the root tapering to 2–3; depth 4. (Depth 3 is too squat for DFS's
  backtrack to read as a shape; depth 5+ blows the authoring budget.)
- The evaluator's ranking of the root's children must be **rank 1 = the deep trap, rank 2 = a
  second wrong branch that dies shallow, rank 3 = the true branch.** That ranking, and only
  that, produces the three beam regimes.
- The rank-1 trap must survive **at least two flawless-looking moves** before dying. A trap that
  dies at depth 1 makes greedy look stupid rather than seduced.
- The trap subtree must be the **largest** in the space — that is what makes DFS expensive and
  gives it the screen shape worth rendering: long confident dive, red leaf, visible climb back.
- Every wrong branch must end in a node with **zero children**. Otherwise DFS never returns and
  the `maxNodes` ceiling does the work instead of the instance, which would be dishonest.

### Plain-CoT contrast (keep this beat — it works)

> 1. Four of these are shades of red: cherry, ruby, rose, blood.
> 2. Four are parts of the eye: pupil, lens, retina, iris.
> 3. Flowers next: lily, violet, heather and… brick? No.
> 4. I'll put brick and wine with the flowers and call it done.

4 thoughts, wrong, and — the good detail — **it does not stop when it fails, it fudges.** That
is what a single chain does under a constraint it cannot satisfy.

### Rendering

Column-per-depth: four columns left to right, each a vertical stack of ~180px cards on a **fixed
row pitch**, so the SVG connectors are pure arithmetic and no DOM measurement is needed.

Card = category label (semibold) · the four words in mono caps · a 5-dot confidence rating ·
a greyed strip of the words still loose.

Colour tokens are unchanged from today: examined = `compute`, on the solution path = `correct`,
dead leaf = `wrong` with a one-line autopsy (*"three flowers, three oranges, and BRICK and WINE
with nowhere to go"*), pruned = `surface-raised` outline, untouched = a 6px stub. The compute
counter keeps its shape — big mono number, "thoughts scored", "the compute bill".

---

## 3. Figure 2 — what search buys

Keep the section title and the premise; replace the data and drop the slider coupling.

- **Five static bars**, the table in §D2. Not driven by figure 1's beam width — the map's *b*
  and Yao's *b* are different quantities, and today's page silently conflates them.
- New data file `web/data/tot-crosswords.json`, with a `provenance` string naming Table 3, the
  metric (% of words filled correctly), the model (GPT-4) and the sample (20 puzzles).
  **Leave `tree-of-thoughts.json` alone** — page 11 still consumes it (see §7).
- The copy's job is the two middle bars: turning **pruning** off costs 18.5 points; turning
  **backtracking** off costs 40. That is the handoff line from figure 1 — *you just watched a
  branch die and a search climb back out of it; here is what that climb is worth.*
- `CitationBadge` stays, on Yao et al. 2023 / NeurIPS 2023.

---

## 4. Sidenotes

Delete the sticky `<aside>` at `Page10.tsx:476-508` — the "How to read this page" list, the
References block, and the keyboard-arrows item (boilerplate the Page 1 style drops).

Adopt the local `Note` component verbatim from `Page1.tsx:13-21` / `Page6.tsx:58-63`, and the
alternating grid from `Page1.tsx:91`:

```tsx
<div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
```

Three notes, each beside the subsection it belongs to. Terse — Page 1's `"Sort it"` note is two
short lines and that is the target register.

**Beside step 1** (two stacked notes in one cell, wrapped in `flex flex-col gap-6`):

```tsx
<Note kicker="Try it">
  <p>Greedy first, then Beam at width 3.</p>
  <p>Watch the thoughts-scored counter change. That is the bill.</p>
</Note>

<Note kicker="Authored, not live">
  <p>The sixteen words, every grouping and every confidence score are written by hand.</p>
  <p>The search over them is real: the picker re-runs it, and the counter is the true number
     of thoughts scored.</p>
  <p>Asked to do this live, a model recites a search algorithm it read in training — the one
     thing this figure is not about.</p>
</Note>
```

That second note is the disclosure the brief asks for. If three lines is one too many, drop the
third into the foot provenance paragraph.

**Beside step 2:**

```tsx
<Note kicker="References">
  <p>Yao et al. 2023, <em>Tree of Thoughts</em> (NeurIPS 2023) — 5×5 mini crosswords, GPT-4.</p>
  <p>Percentage of words filled correctly, over 20 puzzles.</p>
</Note>
```

References appear **only** here, at the subsection where they are used. The caveat travels
inline with the citation rather than hiding in the small print — the page is already disclosing
that figure 1 is authored, and it reads as more credible, not less, if figure 2 is equally
candid about its source.

**Foot provenance** (replacing `Page10.tsx:514-525`):

> the thought tree, the groupings and their scores are authored teaching content, not a model
> transcript; the search across them, the pruning and the thoughts-scored counter are produced
> by a real search running in your browser, and the outcome of every strategy is re-asserted in
> the test suite

---

## 5. Implementation

### Engine — `src/lib/routing.ts` → `src/lib/thoughtSearch.ts`

Roughly 60–70% survives verbatim. Both consumers are page-10-only, so this is a replacement,
not a migration.

**Keep unchanged:** the whole `Trace` class (`id`/`parentId`/`depth`/`order`/`kept`/`examined`/
`exhausted`/`finish` and path reconstruction), the entire five-branch `search()` switch
including the PUCT loop, `expand()`, `createRng`, `RouteOptions`, and the plain-CoT constant.

**Relabel (~15%):** `RouteMap`/`Town` → `ThoughtSpace`/`Thought`. `milesToGo()` stops computing
geometry and becomes a lookup of an authored score in `[0,1]`. The `deadEnd` structural oracle
becomes an authored `children.length === 0 && !isGoal` flag — still viz-only, still never
consulted by a strategy. `routeSteps`/`routeMiles` become the ordered list of committed thoughts.

**Delete (~15%):** `distance()`, `analyse()`'s coordinate span, the `x`/`y` fields.

**Keep the `visited` set.** One correction to the ideation agent's reasoning: it argued the
set-valued state space makes the space a DAG and that this is why *"breadth-first genuinely
explodes."* Dedup **shrinks** the count, it does not explode it — `expand()` adds each child to
a single global `visited` at scoring time, so a state reachable two ways is scored once. That is
the *correct* accounting (you do not pay twice to score the same thought) and it keeps the
counter honest, but the copy must not claim the DAG is what makes BFS expensive. **BFS is
expensive because it refuses to prune.** The authored data must therefore give each distinct
*set* of commitments a canonical id, so the dedup lands on states rather than on paths.

### Authored content — `src/lib/authored.ts`

Replace `ROUTE_MAP` with `THOUGHT_SPACE`: ~36–42 nodes. Level 1 = 5 candidate groups; level 2 =
~3 per surviving level-1 node (~15); level 3 = ~2 each (~12); level 4 is forced. Each node is
4 words + a category label + a ~12-word rationale + a score — roughly 800 words total.

The children of a node are *"the k groupings the model proposed"*, legitimately non-exhaustive.
That is what ToT does anyway, and it is what caps the fan-out.

### Tests

- `src/lib/act2routing.test.ts` → `act2thoughts.test.ts`, same shape: pin **every** strategy
  outcome and cost on the chosen instance, including all five beam widths and the full ordering
  MCTS < beam-3 < DFS < BFS. This file is what stops the copy going stale — it is why the false
  MCTS claim in §0.1 is worth fixing structurally, not just editing.
- `Page10.test.tsx`: rewrite the five cases against the new labels.
- `tests-e2e/act2verifiers.spec.ts:32-40`: fix the stale assertions.
- `src/lib/act2search.test.ts`: add a case for the new crosswords data file; leave the existing
  `tree-of-thoughts` case for page 11.

### Sequencing

1. Author `THOUGHT_SPACE` as data. Nothing else.
2. Port the engine, run it over the instance, **print the real counts.**
3. Tune scores until the three beam regimes and the cost ordering hold. **This step is the
   job.** Every number in §2 is currently a guess.
4. Write `act2thoughts.test.ts` against the *measured* values.
5. Build the renderer.
6. Write copy — with the numbers read from the engine, never typed by hand.
7. Sidenotes, foot provenance, figure 2 data file.
8. Fix the stale e2e test.

Steps 1–4 are load-bearing and cheap. If the instance will not tune, that is discovered before
any renderer exists — and the word-square runner-up shares this entire pipeline, so switching
costs only the authored data.

---

## 6. What changed when it met the engine

Both changes were forced by measurement. Recording them because the *reason* matters more than
the edit: this is the discipline the old page skipped, and skipping it is what put a false
sentence on screen.

**1. MCTS was rewarded for finding the trap.** The ported engine inherited `routing.ts`'s
rollout reward, `node.isDestination ? 1 : node.score` — a stranded run scores by the evaluator's
opinion of where it stopped. On a road map that is merely odd; on a thought space it is
backwards, because **the trap is exactly where the evaluator is most confident.** The first
build had MCTS strand-and-be-rewarded at 0.865 and tie DFS at 18 thoughts — the identical defect
this rewrite exists to fix. The fix is a principled reward, not a tuned constant: a trial is
worth *the fraction of the puzzle it actually finished* (`node.depth / goalDepth`), so a run
that stalls two groups in is worth half of one that sorts all sixteen. This reads only what the
search observed — it ran out of continuations — and never the `deadEnd` oracle.

**2. The first trap had nothing to get lost in.** With the red-idiom group as rank 1, its
subtree was two nodes, both dead. DFS escaped it for free, so DFS and MCTS cost the same and the
beam dial had no third regime. The plan's own clause — *the trap subtree must be the largest in
the space* — was the part that had not been checked. Rebuilding the group set around the
flowers/names/eye tangle gave the trap a subtree worth exploring and produced the three beam
regimes and the cost ordering on their own.

A third finding did **not** get papered over. The plan predicted MCTS would be the strictly
cheapest successful strategy; measured, it **ties beam-3 at 21**. So the page does not claim it
is cheaper. It claims the true and more interesting thing: *beam-3 only wins because we told it
3; MCTS found the same answer for the same price with no width to set* — which is also the
cleaner handoff to the AlphaGo interlude. Likewise BFS is 1.5× beam-3, not the 2–3× the plan
hoped, so no copy claims a multiple.

**Also corrected in passing:** the shared `act2search.test.ts` labelled the Game-of-24 curve
"Page 10"; it is page 11's data now and is relabelled. `tree-of-thoughts.json` is untouched.

## 7. Open decisions

These need a call before or during implementation. My recommendation is given, but each is a
genuine choice.

1. **Does page 11 change too?** Page 11 is a *b* = 1..5 slider over a pruned search tree using
   the same Game-of-24 data. After this rewrite, page 10's figure 1 is a *b* = 1..5 slider over
   a pruned thought tree — a closer collision than the "maze" the brief warned about, and Game
   of 24 survives on page 11 three times over. The brief's own reasoning ("nobody knows what it
   is") does not stop at page 10. *Recommendation: treat as a follow-up, but decide now whether
   the beam slider stays on page 10 or moves entirely to page 11.*

2. **Must figures 1 and 2 share a task?** Word-grouping and crosswords are both word puzzles but
   not the same puzzle. The word-square concept would make figure 1 literally figure 2's task at
   4×4 instead of 5×5 — an unusually tight mechanism-to-measurement handoff. It costs the
   positive dead end, which is the strongest thing about D1. *Recommendation: take the looser
   pairing and buy the better figure 1; the bridge is "generation under constraints where a
   locally perfect choice forecloses the rest", and the ablation bars carry it.*

3. **Is a puzzle the right register at all?** The brief warns against making a puzzle-solving
   point. The framing copy has to work to say *this is what any hard generation-under-constraints
   problem looks like.* Worth a review pass on the intro paragraph specifically.

4. **Branding.** The puzzle must be original — do not lift an NYT grid — and probably should not
   be called "Connections" on the page.

5. **A third subsection?** Pages 1 and 6 both run three sections. Page 10 would have two. A short
   closing that states the takeaway and hands off to the AlphaGo interlude would match the house
   shape. Not required by the brief.
