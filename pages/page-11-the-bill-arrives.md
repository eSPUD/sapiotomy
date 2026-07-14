# Page 11 — "The bill arrives" (economics dashboard)

| Field | Value |
|---|---|
| **Page id** | `11` · route stub `/act-3/the-bill-arrives` *(naming TBC with scaffold — see §9)* |
| **Act / beat** | Act 3 opener — the first "break": the cost bill for everything Act 2 taught |
| **Status** | **[MVP]** ★ — wow #3b (the economics-shock half of signature interaction 3) |
| **Milestone** | M5 (build) · data digitized in M1 · never cut (task-list gate 6) |
| **Effort** | Cheapest build in the deck (proposal §7.1): static digitized points, no simulation, no trace, no workers |
| **Source docs** | Proposal §5 p11 row, §6.4 anchor rows 11 · Task list M5 + Data Anchor Reference row 11 · **[`../planning/hybrid_explorable_currency_review.md`](../planning/hybrid_explorable_currency_review.md) §5 (this page re-anchored to current data)** |

**The one idea (one per page, Mayer):** the last few points of accuracy cost far more than the first many — **at every frontier, in every era.** The absolute prices fall each year; the *shape* of the curve does not.

> **Currency note (updated 2026-07-13 — confirmed landscape).** Re-anchored from the stale Dec-2024 o3 snapshot to the **current** benchmark **ARC-AGI-2 (2026)**, with **o3/2024 as an explicit *historical* layer** and an **ARC-AGI-3** callout. The confirmed landscape *inverts* the old shock: the best model (**GPT-5.6 Sol**) scores **92.5% for $1.44/task**, and the *expensive* models are the *worse* ones. So the payoff is **inversion-shock, not sticker-shock** — the price collapsed ~1000× since o3, but the *shape* (diminishing returns) and the *ratchet* (a harder benchmark is already here) hold. Numbers are confirmed-landscape leads; **verify against the live ARC Prize leaderboard at M1.** Working prototype: [`../prototypes/page-11/`](../prototypes/page-11/). See the currency review §5.

---

## 1. Narrative role

- **Pays off the page-1 stake.** Page 1 seeds *"thinking time is now a product — billed by the token and the 'effort level,' with the last points costing far more than the first — worth buying? trustworthy?"* This page is where the price list arrives. The stake callback is a **required, copy-tested string** (task list M5).
- **Position:** follows page 10 (the allocation "boss" — the reader has just spent a compute budget *well*), precedes page 12 (overthinking). Beat sequence into Act 3: *you learned to spend compute → now see what compute costs in dollars → then see it backfire → then hit the wall.*
- **Log-axis literacy is already established** — page 6 taught the reader to read log axes (the straightening). The causal-chain gate is satisfied: this page may assume log-axis reading, nothing else new.
- **Feeds page 16.** The bookend's honest answer includes *"…you should watch the bill … the prices fall every year and the frontier keeps moving, but the shape of the trade-off doesn't."* That clause is earned here.
- **Carries the deck's time-awareness motif.** This is where the "you are here (2026) / history" treatment (proposal §6.3) does its most important work: the current layer vs. the o3/2024 layer *is* the motif.
- **M7 asset:** the teaser GIF list includes "P11 dollar axis" — the **Reveal-1 collapse** ($1.44 landing beside 2024's thousands-per-task o3 layer) should be screen-recordable as a self-contained loop.

This is a 🔭 **telescope page**: all data is off-spine published field data (ARC-AGI), so the entire chart renders inside `<FieldDataFrame>` with the standard zoom-back affordance to the Game-of-24 home base (telescope gate).

---

## 2. Reader experience (Predict → Observe → Explain)

Sequenced reveals on one interaction surface. **The current-frontier data leads; the o3/2024 layer and the ARC-AGI-3 callout reinforce the same idea** (the shape holds and the frontier ratchets) — the deck's "two reveals, one surface" pattern, so this stays one idea.

1. **Predict** (`<PredictBar>`): *"In 2026, the best AI model scores 92.5% on ARC-AGI-2 — a hard reasoning benchmark. Guess what one task costs it in compute."* Choices span the (2024-primed) shock range: **$1.44 · ~$50 · ~$500 · $5,000+**. Most readers **overshoot** — two years of headlines trained them to.
2. **Reveal 1 — the collapse.** Answering drops in **GPT-5.6 Sol: 92.5% @ $1.44/task**, beside the **historical** o3 layer (Dec 2024: 87.5% for *thousands*/task — a *lower* score). A `<BigNumber>` spotlights **$1.44** with the subline *"a lower score cost thousands 18 months ago — a ~1000× collapse."* Copy: the price of frontier thinking cratered.
3. **Reveal 2 — the shape held.** The rest of the current cluster fills in: the **GPT-5.6 family curve** (Luna $0.67→59.5%, Terra $1.09→83.9%, Sol $1.44→92.5% — *the last 8.6 points cost nearly as much as the previous 24*; diminishing returns drawn as a connected curve), plus **Gemini 3.1 Pro $40 @ 77.1%** sitting up-and-right (paying 30× more for a *worse* score — cost≠value, shown visually, no separate copy beat), and the **human** point (100% @ ~$17). `<BigNumber>` → **×30**.
4. **Reveal 3 — the frontier already moved.** An **ARC-AGI-3** callout (not a plotted point — different scoring scale): the same best model scores **7.8%**; humans **100%**. `<BigNumber>` → **7.8%**. Copy: the next bill is already forming.
5. **Explain + zoom back.** The law in plain words: *the absolute price collapsed, but the shape (last points cost most), the cost≠value trap, and the ratchet (a harder test always follows) all held.* Zoom-back to the home base: every "Wait…" you injected on page 4 was metered tokens — the knob was always attached to a meter, even when it reads $1.44. Stake callback lands here (§6, C4).

**Reduced motion:** reveals render instantly (no animated transitions); the sequence becomes discrete steps via the same "next" affordance.

---

## 3. Interaction spec

**Required (page-done: ≥1 live control, Victor):**
- The **staged reveal control** — reader-driven (button/scroll-step), not autoplay. Predict must be answered (or explicitly skipped) before Reveal 1.
- **Era toggle (current ↔ +history).** A single control adds/removes the o3/2024 historical layer — this *is* the "you are here / history" motif made interactive, and it lets the reader feel the frontier slide down-and-right. Keyboard-operable; default = current only, history revealed at Reveal 4.
- **Per-point hover/focus tooltips** — each point is keyboard-focusable; tooltip shows system name, **era/benchmark stamp**, accuracy, cost (with "estimate" tag where flagged), and source note. Hit target ≥ **24px** (transparent halo), never just the painted dot. Same content on `:focus` as on hover; tooltips *enhance, never gate* — everything is also in the table view.
- **Table view** — a toggleable data table (system · benchmark · era · accuracy · cost/task · estimate? · source) directly below the chart. Doubles as the accessibility fallback and the "never color alone" relief channel.

**Recommended (fine-tuning candidates — decide during build, not blockers):**
- **Linear ↔ log dollar-axis toggle.** Rhymes with page 6's straightening, inverted: there, log made the curve lawful; here, flipping to *linear* rams the high-compute points off into absurdity (or compresses everything else to zero width). *Default view: log.*
- **"What would you pay?" budget line** — a draggable vertical line on the dollar axis; points left of it light up as "affordable at your price." Directly operationalizes the stake question. Cut first if the page feels busy (one idea per page beats a second control).

**Explicitly out of scope:** no Monte Carlo, no seeded RNG, no Web Worker, no Zustand global state (all state local), no trace/branch-bank access, no live pricing APIs.

---

## 4. Visual spec (per the `dataviz` skill)

- **Form:** scatter / dot plot — the job is the *relationship* between two measures per entity, and the spatial gap IS the story. ~5–8 points across both eras; every point is story-bearing.
- **Axes:** **one y-axis** (accuracy, linear 0–100%, clean ticks) and one x-axis (cost per task, **log scale**, decade ticks: $1 · $10 · $100 · $1,000 · $10,000 — comma'd, no scientific notation). Never dual-axis. Gridlines hairline, solid, recessive.
- **Marks:** dots ≥ 8px with a **2px surface ring** (legibility over gridlines). **Estimate-flagged cost ranges render as a horizontal bar** through the dot (e.g., o3-high spanning $3K–$30K), not a false-precision point — the honest-uncertainty principle (proposal §6.2 #6) made visible. The **GPT-5.6 family** (Luna→Terra→Sol) draws as a connected cost/accuracy curve so the "spend more, gain less at the top" (diminishing-returns) reading is unmistakable.
- **The era layers (the time motif):**
  - **Current (2026, ARC-AGI-2):** full-strength marks in the compute/energy hue; the reader's default view.
  - **Historical (Dec 2024, ARC-AGI-1):** same hue but a **de-emphasized/"aged" treatment** (lower opacity + a dashed connector + a visible `as of Dec 2024 · ARC-AGI-1` stamp), reusing the deck's `FieldDataFrame` time treatment. Never a *new hue* for "old" — that would spend the identity channel; age reads through opacity + stamp + label.
- **Color (project 3-hue grammar, from the M0 design tokens — no raw hex):**
  - AI-system points → the **compute/energy** hue (they are compute purchases; this hue already means "spend" everywhere in the app).
  - Human baseline → a **distinct hue + distinct shape** (e.g., diamond vs circle) + direct label — identity is never color-alone.
  - Do **not** color points by accuracy or by era — the y-axis encodes accuracy; opacity+stamp encode era; color does identity only.
- **Validation:** once the mentor's tokens exist, run the dataviz validator on the chart's hue set in **both modes** with `--pairs all` (scatter rule: any two marks can be adjacent). Confirm the aged/current opacity split still clears contrast against the surface. Dark mode is its own validated selection, not an auto-flip. Record the run in the page's PR.
- **Labels:** every point gets a **name + era stamp**; numeric values live on the axes, tooltips, and table — except the one spotlighted number in the `<BigNumber>` (per reveal: **$1.44** the collapse → **×30** cost≠value → **7.8%** the next frontier). Labels wear text tokens, never the series color. Two identity classes (AI vs human) → legend present, direct labels supplement it.
- **Estimate marking:** flagged points carry a small "est." suffix on their label and the range bar; the `<CitationBadge>` carries the page-level blog/leaderboard-estimate flag.
- **Responsive:** chart scrolls inside its own container on narrow screens (never page-level horizontal scroll); labels re-measured, never clipped.

---

## 5. Data spec

**Two files, both passing the M0 loader schema** (`points` + mandatory `citation {ref, url, venue, preprint}` + mandatory `provenance` string). Digitization is an **M1 task** (no model runs — transcription only). Each point carries an explicit `era` + `benchmark` + `asOf` stamp (the currency discipline).

**File A — `data/arc-agi-2-cost.json` (current, primary layer):**

```jsonc
{
  "benchmark": "ARC-AGI-2",
  "evalSet": "semi-private",          // pin the eval set; never mix public/semi-private
  "asOf": "2026",
  "points": [
    { "id": "gpt-5-6-luna",  "label": "GPT-5.6 Luna",  "kind": "model", "era": "current", "family": "gpt-5.6",
      "accuracyPct": 59.5, "costUSD": { "point": 0.67, "estimate": true }, "note": "Max Reasoning · lightweight" },
    { "id": "gpt-5-6-terra", "label": "GPT-5.6 Terra", "kind": "model", "era": "current", "family": "gpt-5.6",
      "accuracyPct": 83.9, "costUSD": { "point": 1.09, "estimate": true }, "note": "Max Reasoning · balanced" },
    { "id": "gpt-5-6-sol",   "label": "GPT-5.6 Sol",   "kind": "model", "era": "current", "family": "gpt-5.6",
      "accuracyPct": 92.5, "costUSD": { "point": 1.44, "estimate": true }, "note": "Max Reasoning · current SOTA on ARC-AGI-2" },
    { "id": "gemini-3-1-pro","label": "Gemini 3.1 Pro (Preview)","kind": "model", "era": "current",
      "accuracyPct": 77.1, "costUSD": { "point": 40, "estimate": true }, "note": "strong baseline, steep per-task cost (cost≠value)" },
    { "id": "human",         "label": "Human panel",   "kind": "human", "era": "current",
      "accuracyPct": 100, "costUSD": { "point": 17, "estimate": true, "resolve": true },
      "note": "100% on ARC-AGI-2; per-task $ is an ARC Prize estimate — VERIFY (open item 1)" }
  ],
  // GPT-5.6 family (shared "family" key) → drawn as a connected curve: the diminishing-returns shape.
  // Cost-only context (no published ARC-AGI-2 score → NOT plotted, cited in copy): GPT-5.4 ~$95, Claude Opus 4.6 ~$160.
  "arcAgi3Callout": { "model": "GPT-5.6 Sol", "modelScorePct": 7.8, "humanScorePct": 100,
    "note": "newest benchmark; different scoring scale — a callout, not a plotted point" },
  "citation": { "ref": "ARC Prize 2025 Results & Analysis / ARC-AGI-2 leaderboard", "url": "https://arcprize.org/blog/arc-prize-2025-results-analysis", "venue": "blog/leaderboard", "preprint": true },
  "provenance": "Transcribed from the ARC Prize 2025 results post + public leaderboard; costs are reported/estimated per-task figures; see data/PROVENANCE.md."
}
```

**File B — `data/arc-agi-1-cost-history.json` (historical layer):**

```jsonc
{
  "benchmark": "ARC-AGI-1",
  "evalSet": "semi-private",
  "asOf": "2024-12",
  "points": [
    { "id": "o3-low",  "label": "o3 (low compute)",  "kind": "model", "era": "historical",
      "accuracyPct": 75.7, "costUSD": { "low": 17, "high": 20, "estimate": true } },
    { "id": "o3-high", "label": "o3 (172× compute)", "kind": "model", "era": "historical",
      "accuracyPct": 87.5, "costUSD": { "low": 3000, "high": 30000, "estimate": true }, "computeMultiple": 172 }
  ],
  "citation": { "ref": "ARC Prize — 'OpenAI o3 breakthrough' (Dec 2024)", "url": "…", "venue": "blog", "preprint": true },
  "provenance": "Transcribed from the ARC Prize o3 announcement (Dec 2024); costs are the post's estimates; o3 tested on ~75% of ARC-AGI-1 public training set (disclosed). See data/PROVENANCE.md."
}
```

**Anchor values (locked before UI, per the golden rule) — all `as of` stamped:**
- **Current (ARC-AGI-2, 2026):** GPT-5.6 Luna **59.5% @ $0.67** · Terra **83.9% @ $1.09** · Sol (SOTA) **92.5% @ $1.44** · Gemini 3.1 Pro **77.1% @ $40** · human **100% @ ~$17** *(cost estimate — verify)*. Cost-only context (unplotted): GPT-5.4 ~$95, Opus 4.6 ~$160.
- **ARC-AGI-3 callout (not plotted, different scale):** GPT-5.6 Sol **7.8%**, humans **100%**.
- **Historical (ARC-AGI-1, Dec 2024):** o3 **75.7% @ ~$20** → **87.5% @ 172× compute** (est. $3K–$30K/task).

Tolerance for the data-fidelity test: **exact match** to the JSON (digitized points, no simulation — stricter than the default ±1.0 pp).

**Open data items — resolve during M1 digitization, log in `data/PROVENANCE.md`:**
1. **Human accuracy on ARC-AGI-2** — the chart needs a y-coordinate for the human point; use ARC Prize's stated human baseline for *ARC-AGI-2 specifically* (it differs from ARC-AGI-1) and record which population it describes. *Never invent it.*
2. **Verify every 2026 figure against the live ARC Prize leaderboard** at transcription time — these are search-surfaced leads. Confirm cost/task definitions (some entries mix retail API price vs. compute-cost estimates — pin one and note it).
3. **ARC-AGI-3 scoring unit** — confirm "7.8%" is a percentage vs. another scale (interactive/agentic benchmark); keep it a **callout, not a plotted point**, regardless.
4. **Frontier beyond GPT-5.6 (e.g. Claude Fable 5).** GPT-5.6 Sol is confirmed and plotted as current SOTA; any *newer* model gets added **only if a clean, citable ARC-AGI-2 cost/accuracy point exists** — the page must not depend on any single newest model (the GPT-5.6 family + Gemini + human + history already carry the idea).
5. **Pin the eval set** — all accuracies from the **semi-private** eval; never mix with public-eval numbers.
6. **Disclosure footnote:** the o3 variant was trained on ~75% of the ARC-AGI-1 public training set (disclosed). Goes in the page footnote (§6, C7).

---

## 6. Copy blocks (v0 drafts — author fine-tunes; ★ = required, copy-tested string)

Aligned to the prototype's beats ([`../prototypes/page-11/index.html`](../prototypes/page-11/index.html)).

- **C1 · Headline:** *The bill arrives.*
- **C2 · Lede:** You've spent ten pages learning to buy accuracy with compute. Nobody mentioned the currency. Time to look at the receipt.
- **C3 · Predict prompt:** see §2 step 1.
- **C4 · ★ Collapse beat (Reveal 1):** *It's $1.44. Eighteen months ago, the top score on the previous ARC-AGI cost thousands of dollars per task — for a lower score. The price of frontier thinking didn't just fall. It cratered — roughly a thousand-fold.*
- **C5 · Shape beat (Reveal 2):** *But the shape never left. Spend less, get less — the same family runs $0.67 → 59.5% (Luna), $1.09 → 83.9% (Terra), $1.44 → 92.5% (Sol): the last 8.6 points cost nearly as much as the previous 24. And paying more doesn't buy more — Gemini 3.1 Pro costs $40 a task for 77.1%, thirty times Terra's price for a worse score.*
- **C6 · ★ ARC-AGI-3 callout (Reveal 3):** *So is reasoning solved and cheap? The field already answered. On ARC-AGI-3 — the newest test — that same best model scores just 7.8%. Humans score 100%. The frontier moved, and the next bill is already forming.*
- **C7 · ★ Stake callback (Explain beat):** *On page 1 we asked whether machine thinking is worth buying. The honest answer: astonishingly, yes — the price collapsed a thousand-fold in eighteen months. But you still pay for the last points, you can still overpay, and the moment one benchmark falls, a harder one takes its place. The absolute price falls; the shape of the trade does not.*
- **C8 · ★ Estimate disclaimer:** *Costs are reported or estimated per-task compute figures from the ARC Prize leaderboard and announcements (blog/leaderboard sources, not peer-reviewed); "cost" mixes retail pricing and compute estimates, and the human per-task figure is an ARC Prize panel estimate still being verified — see the sources note.*
- **C9 · Disclosure footnote:** o3 trained-on-public-training-set note (§5 item 6).
- **C10 · Zoom-back line:** *Back at our puzzle: every "Wait…" you injected on page 4 was tokens, and tokens are metered. The knob was always attached to a meter — even when it reads $1.44.*
- **C11 · Citation chip:** `based on: ARC Prize / ARC-AGI-2 leaderboard 2026 + o3 Dec 2024 — blog/leaderboard estimate` (estimate flag ON).

---

## 7. Stack (inherited — do not diverge from the scaffold)

Per task-list **Global conventions** (the mentor's M0 defines all of this; this page consumes it):

| Layer | Choice | This page's usage |
|---|---|---|
| Framework | Next.js (App Router) + React + **TypeScript strict** | one route, statically rendered; no server code |
| Styling | Tailwind + **design-token layer** (3-hue grammar; no-raw-hex lint) | all color via tokens (§4) |
| Charts | **D3** for bespoke, visx/Recharts for standard | scatter is near-standard, but the log axis + staged reveals + range bars + connected family curve + era layers suggest **D3 inside `<ChartFrame>`**; follow whatever the page-4 template (M2, `docs/page-template.md`) establishes |
| State | Zustand for global sim state | **not needed** — local component state only |
| Motion | Framer Motion, purposeful only | the Reveal-1 collapse + era-toggle transition; collapses under `prefers-reduced-motion` |
| Data | `data/*.json` + typed loader (citation/provenance-enforcing) | `data/arc-agi-2-cost.json` + `data/arc-agi-1-cost-history.json` (§5) |
| Tests | Vitest + RTL · Playwright · `@axe-core/playwright` | §10 |
| Workers/RNG | Web Worker harness + seeded RNG | **not needed** (no simulation) |

---

## 8. Dependencies

**Upstream — mentor's scaffold (M0/M2). Blockers for integration, NOT for prototyping:**
- `<ChartFrame>` (axis/legend grammar) · `<FieldDataFrame>` (🔭 frame + zoom-back — this page lives entirely inside it; also supplies the "aged/history" time treatment) · `<PredictBar>` (POE) · `<CitationBadge>` (estimate flag) · `<BigNumber>` (the $1.44 / ×30 / 7.8% spotlights) · `<Toggle>` (era toggle; linear/log if kept)
- Design tokens (the 3 hues + text tokens), the **"you are here / history" time treatment** (proposal §6.3 — confirm it's a shared primitive), Acts-rail registration, route map slot, data loader + schema
- The **page-4 reference template** (M2 exit artifact `docs/page-template.md`) — this page copies its layout skeleton verbatim

**Upstream — data (M1):** the two digitization tasks in §5. No API budget, no GPU, no hero trace.

**Narrative:** page 1's final stake wording (C4 should echo it — keep the stake phrase in one shared copy constant if the scaffold supports it); page 6 shipped (log-axis literacy, and the toggle rhyme); page 4 shipped (C8 references the budget knob).

**Downstream:** page 16's bookend clause ("watch the bill … the frontier keeps moving, but the shape doesn't"); M7 teaser GIF; M6 E2E ("P11 log-axis shock renders").

**Explicit non-dependencies (why this page is safe to build early):** TraceNavigator, branch bank, entropy data, Monte-Carlo workers, seeded RNG, Zustand store, any R1/API output.

---

## 9. Interface points to confirm with the mentor (before integration)

1. Exact prop APIs for `<ChartFrame>`, `<FieldDataFrame>`, `<PredictBar>`, `<CitationBadge>`, `<BigNumber>` — this spec assumes only their task-list descriptions.
2. **Is the "you are here / history" time treatment a shared primitive?** It debuts here and recurs wherever a snapshot is dated; it should be a scaffold component, not page-local, so pages 3/14/16 reuse it.
3. Route + file naming convention for pages (`/act-3/the-bill-arrives` vs numbered routes) and where page copy lives (inline vs `content/page-11.md`).
4. Token names for the 3 hues + the human-point's distinct hue (4th identity color? or neutral + shape?). Run the palette validator (`--pairs all`, both modes) once tokens are fixed — confirm the aged-layer opacity still clears contrast.
5. Whether the linear↔log toggle is a shared component with page 6 (it should look identical there and here).
6. Whether the table-view pattern is a shared primitive (it will recur on data-bearing pages) or per-page.

**Until then:** prototype standalone in `prototypes/page-11/` (plain HTML + hand-rolled SVG, placeholder tokens — **built; see the folder + its README**) — everything in §§2–6 is portable; only §9's seams change.

---

## 10. Acceptance criteria (maps to task-list M5 + the page-done checklist)

**Unit (Vitest):**
- [ ] Rendered scatter points match `arc-agi-2-cost.json` + `arc-agi-1-cost-history.json` exactly (positions derived from the anchor values; no invented points).
- [ ] Dollar axis is log-scale (assert tick values are decades); accuracy axis linear.
- [ ] Estimate-flagged points render the range bar + "est." tag; non-flagged don't. The GPT-5.6 family renders as a connected curve through (0.67, 59.5%), (1.09, 83.9%), (1.44, 92.5%).
- [ ] **Era stamps present:** every point renders its `benchmark` + `asOf` stamp; historical points render in the aged treatment; current points don't. (Currency gate.)
- [ ] ★ Copy test: C8 estimate disclaimer renders. · ★ Copy test: C7 stake callback renders. · ★ Copy test: C4 collapse beat ($1.44) renders. · ★ Copy test: C6 ARC-AGI-3 callout renders.
- [ ] Both data files pass the loader schema (citation + provenance present) — automatic via the shared loader test.

**E2E (Playwright):**
- [ ] Predict → Reveal 1 (collapse: Sol $1.44 beside 2024 o3; `<BigNumber>` shows **$1.44**) → Reveal 2 (family curve + Gemini; `<BigNumber>` **×30**) → Reveal 3 (ARC-AGI-3 callout; `<BigNumber>` **7.8%**) sequence.
- [ ] Era toggle adds/removes the historical layer; keyboard-operable.
- [ ] Tooltip content (incl. era stamp) reachable by keyboard focus on every point; table view exposes all values + eras without hover.
- [ ] `prefers-reduced-motion`: no axis/era animation; content complete.

**Accessibility / page-done:**
- [ ] axe: zero serious/critical. Keyboard-only full traversal. Never color alone (human point = shape + label; estimates = tag, not tint; era = opacity + stamp + label, not hue).
- [ ] `<CitationBadge>` estimate flag ON (preprint-flag test lists page 11).
- [ ] Registered in Acts rail (Act 3); chart inside `<FieldDataFrame>` with zoom-back (telescope gate); ≥1 live control; PredictBar precedes reveal (POE).
- [ ] Payload: two static JSON files, well under budget; no worker; route code-split.
