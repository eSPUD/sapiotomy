# Page 10 — restructuring "Searching Through Thoughts"

Three problems were raised: figure 1 reads as a pathfinding algorithm, figure 2 rests on Game
of 24 which nobody knows, and the sidenotes are too verbose. This plan resolves all three.
It is the output of a literature search, a concept-ideation pass, and an adversarial
verification pass, plus direct measurement of the engine that ships today.

> **STATUS: BUILT (second attempt).** The first build used a sixteen-word grouping puzzle.
> It shipped, and it was confusing: the puzzle was as hard as the lesson, and the tree drew
> 31 nodes bearing five distinct labels. It was replaced by a mini crossword. See **§6**.
> Everything in §2 is a *measurement*, asserted in `src/lib/act2crossword.test.ts`.

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
| D1 | **Figure 1 = a 3×3 mini crossword**, searched by the model | Zero rules to explain, the grid makes every state self-describing, and the failure is checkable by eye |
| D2 | **A thought = one clue answered**, and the model picks which clue to attack | The only form in which the crossword is a real search problem at all (§6) |
| D3 | **Figure 2 = Yao et al. 2023, Table 3, mini crosswords**, with the two ablation bars | Same paper already in the repo, peer-reviewed, and figure 1 is now literally the same task one size down |
| D4 | **Page 1 / Page 6 `Note` pattern**; the sticky aside is deleted | The house style the brief asks for |
| D5 | **Author-and-measure before writing any copy** | Vindicated three times over — see §6 |

### D1/D2 — the puzzle

```
      1D  2D  3D              1A  Bottle top      LID / CAP
  1A   C   A   P              1D  Camp bed        BED / COT
  2A   O   R   E              2A  Mined rock      ORE / GEM
  3A   T   E   N              3A  Perfect score   TEN / ACE
                              2D  Exist           ARE
                              3D  Writing tool    PEN
```

A **thought** is one line of the model's chain: *"1-Across, 'Bottle top' — LID."* So it is a
pair of (which clue to answer next, which answer to write), and a **state** is the grid so far.
The model may answer the clues in any order and checks each answer only against the letters
already on the grid — which is all a chain of thought does. It cannot see what an answer
forecloses.

**The trap.** "Bottle top" is LID before it is CAP, for anybody, and the model agrees: LID is
its most confident answer anywhere on the board. Writing it is not stupid, and the grid does
not object. Three thoughts later the grid reads **LID / ORE / TEN** — which is *full*, and
spells LOT, IRE and DEN going down. All three are real words. None answers its clue: 1-Down is
"Camp bed", 2-Down is "Exist", 3-Down is "Writing tool".

That is the most familiar sensation in crosswords — **the letters work, the clues don't** — and
the reader can check it against the clue list without trusting us. "Camp bed" is the same trick
again: BED outranks COT, and any grid containing it jams too.

The evaluator is the model's confidence in each answer, shown as dots beside every candidate so
the reader forms their own view first. Its single blindness: it judges an answer against its own
clue and the letters already there, never against what the answer rules out.

## 2. Measured behaviour — pinned by tests

73 states, 8 dead ends, 10 thoughts available at the root. Every figure below was produced by
running `search()` over the shipped instance.

| Strategy | Thoughts scored | Outcome |
| --- | --- | --- |
| Greedy | **16** | **jams** — writes LID |
| Beam b=1 | **16** | **jams** — identical to greedy; the page says so |
| Beam b=2 / b=3 | **19 / 26** | **jam** — both slots still go to the traps |
| Beam b=4 | **35** | **finishes** — the cheapest width that works |
| Beam b=5 | **41** | finishes, at a strictly higher bill |
| MCTS | **30** | **finishes — the cheapest strategy of all** |
| DFS | **31** | finishes, after backtracking out of the trap |
| BFS | **48** | finishes, **3× greedy's bill** |

Greedy is the honest framing of plain chain-of-thought: one line, scored, with no way back. The
"solve with plain CoT" button lands in the same grid with the scoring removed.

## 3. Figure 2 — what search buys

Unchanged from the first build, and now tighter because figure 1 is the same task. Five static
bars from Table 3 (% of words filled, GPT-4, 20 puzzles): IO 14%, CoT 15.6%, **ToT with
backtracking off 20%**, **ToT with pruning off 41.5%**, full ToT 60%. Data in
`web/data/tot-crosswords.json`; `tree-of-thoughts.json` is untouched for page 11.

The copy's job is the two middle bars: removing pruning costs 18.5 points, removing backtracking
costs 40. *What search buys is not more thinking, it is the ability to take a thought back.*

## 4. Sidenotes

`Note` component from `Page1.tsx:13-21`, one per subsection: **Try it** (two lines), **Authored,
not live** (the disclosure), **References** (with its caveat inline). Sticky aside and the
keyboard-arrows boilerplate are gone.

## 5. Implementation

- `src/lib/thoughtSearch.ts` — the engine, now display-agnostic. It takes a `SearchSpace`
  (states with a score, successors, `deadEnd`, `isGoal`) and knows nothing about crosswords.
- `src/lib/crossword.ts` — derives the whole lattice from the authored spec. Nothing about the
  tree is hand-placed.
- `src/lib/authored.ts` — `CROSSWORD_SPEC`, `CROSSWORD_PLAIN_COT`.
- `src/lib/act2crossword.test.ts` — 22 tests pinning every cost and outcome above.
- Deleted: `routing.ts`, `act2routing.test.ts`, `act2thoughts.test.ts`.

**Rendering.** The tree draws the thoughts a strategy *kept* as labelled boxes and collapses the
ones it scored and dropped into a `+N pruned` chip under the parent that proposed them. Measured
kept-nodes per column: greedy 1, beam-4 4, MCTS 5, DFS 7, **BFS 26**. So every strategy is
readable and BFS visibly explodes; the box scrolls, and BFS is the one you have to scroll. The
counter above always reports the larger, true number.

## 6. What the measurements overruled

Three findings, each of which killed a design I would otherwise have written copy for.

**1. A crossword filled in a fixed order is not a search problem.** Filling top-to-bottom
collapses the space to **8–9 states**; every wrong answer dies in one move and *every* solving
strategy costs an identical 7–8. I tested five fill orders and fatter word lists. When every
letter is checked by a crossing, there is nothing left to search. This is structural.

**2. It only works if the model chooses which clue to attack next** — which is also what real
solvers and Yao's ToT do. That makes the *order* part of the search, which is where strategies
diverge. Two sub-fixes: the goal must require every entry to read as a real answer (otherwise
the board can be filled with a mutually-consistent wrong set, and the puzzle has no unique
solution), and the model must be *allowed* to make the mistake. My first builder refused to
generate stranding moves, which made the model incapable of error — 0 dead ends, and greedy
always won.

**3. A 4×4 was too big to draw.** Well-posed with good separation it needed all 8 entries open:
228 states, and a 56-node column. The 3×3 gives the same story at a drawable size.

Two predictions from the first build were also wrong and were *not* papered over: MCTS had been
inheriting a rollout reward that paid it for stranding (`isDestination ? 1 : node.score`), which
on a thought space is backwards, because the trap is where the evaluator is most confident. It
now scores a trial by how much of the grid it filled. And the beam threshold is **b=4**, not
b=3: under a mean-of-confidences evaluator, if the trap is the highest-confidence root thought
then its children always outrank the pure-true states, so b=3 *cannot* work. That is a proof,
not a tuning failure, and the copy says four.

## 7. Open decisions

1. **Page 11** still duplicates the old figure 2 and keeps Game of 24 alive three times. Out of
   scope by instruction — it is to be overwritten later.
2. **Pre-existing failures**, both confirmed on a clean tree and untouched here:
   `Page1.test.tsx` (11 tests) and the Page 8 e2e verifier test.
