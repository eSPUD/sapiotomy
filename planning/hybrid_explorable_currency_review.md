# Currency & Freshness Review — *"Watch It Think · Change Its Mind · Watch It Break"*

**Question this doc answers:** does the explorable represent inference-time scaling as it works **today (mid-2026)**, or is it a 2024 time capsule? Which claims are timeless mechanism vs. time-stamped snapshot, and how do we tune the fragile ones **without deviating from the explainable**?

**Date:** 2026-07-13 · **Companion to:** [`hybrid_explorable_proposal.md`](hybrid_explorable_proposal.md) (Rev 2), [`hybrid_tasklist.md`](hybrid_tasklist.md), [`../pages/page-11-the-bill-arrives.md`](../pages/page-11-the-bill-arrives.md)

> **Verification status.** The 2026 figures below were surfaced via a July-2026 web-search pass (sources in §3). Model names and prices post-date the primary corpus and **some are blog/secondary**. Treat every number here as *lead, not locked* — run it through the deck's existing provenance discipline (`data/PROVENANCE.md`, primary-source rule) before it touches a chart.

---

## 0. Headline: the explainable survives — the decay is in the *snapshots*, not the *mechanism*

The thesis — *you trade inference compute for accuracy, in lawful, measurable, sometimes counter-intuitive ways, until it breaks* — is **more central in 2026 than in 2024** (inference is projected to exceed training compute ~118× by 2026; test-time scaling is now the dominant paradigm, not a curiosity). Every **mechanism** page (voting, coverage, verifiers, search, overthinking, the cliff) teaches a law that does not decay.

What decays is **any present-tense claim about a specific model, price, or capability.** There are exactly two places where such a claim is *load-bearing* — and both are the same claim:

- **Page 1 stake:** *"…the frontier bills you for it, sometimes thousands of dollars per task."*
- **Page 11 payoff:** o3 at 87.5% for thousands/task.

Both rest on the **Dec-2024 o3-on-ARC-AGI-1** data point, which is now ~18 months stale and **factually wrong as present tense** (that capability is now cheap). This is the single biggest freshness liability in the deck, and it sits on the two highest-visibility beats (the opening hook and its bookend payoff).

**The fix is not a rewrite — it's a recalibration**, because the current frontier tells the *same story with live numbers* (§1). The deck already owns a device for exactly this — the **"rewind to 2022" time-telescope** on page 3 — so making time an explicit axis is *native to the explainable, not a deviation from it.*

---

## 1. The reframe principle (applies deck-wide)

**Separate the durable law from the dated snapshot, and timestamp every snapshot.**

| | Durable (teach this) | Dated (illustrate with this, stamped "as of") |
|---|---|---|
| **What** | the *shape*: marginal cost of the last accuracy points explodes; coverage is log-linear; more thinking eventually backfires | the *level*: this model, this price, this benchmark, this month |
| **Decays?** | No — recurs at every frontier | Yes — ~10× cheaper per year; benchmarks ratchet |
| **Example** | "the last few points cost 10–40× the first many" | "o3, Dec 2024, ARC-AGI-1, ~$20 → thousands" |

Three concrete disciplines fall out of this:

1. **"As of" everywhere.** Every model-specific or price-specific claim carries a visible date/benchmark stamp (a small `as of Dec 2024` chip). This alone converts most "dated" reads into "historical, on purpose."
2. **Own the movement.** Add a light recurring motif: *the frontier slides down-and-right every year; the curve's shape doesn't.* This turns the deck's biggest weakness (it will keep aging) into a stated theme. It reuses the page-3 time-telescope treatment — no new visual language.
3. **Anchor hooks on shape, not level.** The page-1 stake and page-11 payoff must be phrased so that a reader in 2027 still nods. "The last points cost exponentially more" survives; "thousands per task" does not.

---

## 2. Per-page decay audit

Risk = how badly the page reads as dated / wrong in mid-2026. **Mechanism pages are almost all fine** — the concentration of risk is small and fixable.

| Page | Claim / anchor | Risk | Verdict & tuning |
|---|---|---|---|
| **1 · stake** | "thousands of dollars per task" | **HIGH** | Wrong as present tense. Reframe to the durable shape (§4). The single most important fix in the deck. |
| 1 · trace reveal | R1 `<think>` on Game-of-24 | LOW | Mechanism demo, not a frontier claim. R1 is now old (V4 exists) but that's fine — optionally call it "an open reasoning model." |
| 2 · anatomy | plan/compute/check/backtrack | none | Timeless. |
| **3 · rewind 2022** | Wei GSM8K 17.9→56.9 | **immune** | Explicitly historical — the model for how to date a snapshot. |
| 4 · budget knob | s1-32B 50→57 AIME24 | LOW–MOD | Lever timeless. s1 is a 2025 recipe — reframe as "an early open recipe"; note **effort/thinking-budget is now a standard product control** (this *strengthens* the "thinking is a product" thesis). |
| 5 · vote | self-consistency +17.9 GSM8K | LOW | Mechanism; GSM8K saturation is irrelevant to teaching voting. |
| 6 · coverage | SWE-bench Lite 15.9→56, log-linear | LOW–MOD | Law is timeless. SWE-bench Lite is now saturated — keep as a dated illustration; stamp it. |
| 7 · verifier betrayal | BoN > majority; error bounds it | none | Mechanism. |
| 8 · PRM vs ORM | 78.2 / 72.4 / 69.6 | LOW | Mechanism; MATH saturated but the judge concept holds. |
| 9 · search tree | ToT Game-of-24 b=1→45, b=5→74 | none | Mechanism + home base. |
| 10 · allocation | Snell "**beats a 14× larger model**" | **MOD** | Principle (compute-optimal allocation) holds. But "beats a bigger model" was a 2024 headline since complicated — training also got cheaper, and the win is task-dependent. Add a one-line nuance; don't state it as a standing law. |
| **11 · economics** | o3 75.7%@$20 → 87.5%@thousands | **HIGH** | Dated snapshot on a now-cheap benchmark. Re-anchor to **ARC-AGI-2 (2026)** and keep o3 as an explicit *historical* layer (§5). Story gets richer, not weaker. |
| 12 · overthinking | inverse-U | none / **stronger** | Confirmed current (2026 "When More Thinking Hurts" work). Overthinking in reasoning models is now a mainstream concern. |
| 13 · complexity cliff | Hanoi collapse (Illusion of Thinking) | **MOD** | The debate has *synthesized*, not resolved: failures are **partly** token/format artifacts **and partly** genuine (models still stumble ~8 disks even with programmatic answers allowed). Update the "contested" chip to this nuance (§6). |
| 14 · faithfulness | Claude 3.7 25% / R1 39% | MOD–HIGH | Phenomenon timeless; models dated. Date-stamp ("as measured early 2025") or refresh to current models. Tier 2, so lower urgency. |
| **15 · illusion debate** | Apple "collapse" vs **Lawsen rebuttal** | **HIGH (accuracy)** | **Lawsen has since called his "Illusion of the Illusion" paper "a joke filled with errors," not a genuine rebuttal.** Framing it as the serious counsel for the defense is now *wrong*. Re-anchor the defense on the real synthesis literature (§6). Tier 2, but factually broken as written. |
| 16 · bookend | synthesizes; echoes the stake | LOW | Inherits the stake reframe; fold "the frontier moves, the law doesn't" into the honest answer (§4). |

**Net:** 2 high-risk hooks (same claim), 1 high-risk accuracy bug (Lawsen), 3 moderate, the rest fine. This is a **currency pass, not a redesign.**

---

## 3. Current ground truth (mid-2026) — *leads, verify before locking*

For the economics/allocation/cliff pages. **All figures pending primary-source verification per the deck's provenance rule.**

| Fact (as surfaced, Jul 2026) | Use | Source (verify) |
|---|---|---|
| **ARC-AGI-2**: Gemini 3 Pro **$30.57/task @ 54%**; GPT-5.2 Pro **$15.72 @ 54%**; Claude Opus 4.5 **~$60/task**; frontier tops **83–85%** (GPT-5.4 Pro, Gemini 3.1 Deep Think) at hundreds/task; **human ~$17/task** | Page 11 primary layer | [ARC Prize 2025 results](https://arcprize.org/blog/arc-prize-2025-results-analysis) · [ARC-AGI-2 paper](https://arxiv.org/pdf/2505.11831) · [leaderboard cost analysis](https://sanj.dev/post/arcprize-leaderboard/) |
| **Within-model curve, live**: Gemini 3 Pro refinement **31% @ $0.81/task → 54% @ $31/task** (~38× for +23 pts) | Page 11 hero comparison (replaces o3 172×) | ARC Prize 2025 results (above) |
| Inference cost fell **~95% in two years**; o3 post-cut **$2/$8 per Mtok**; DeepSeek V4-Flash **$0.28/Mtok** | The "frontier slides down-and-right" motif; page-1 stake context | [inference cost drop](https://valueaddvc.com/blog/how-ai-inference-costs-have-dropped-95-in-two-years-and-what-happens-next) |
| Hidden reasoning tokens inflate real per-task cost **3–10×** over headline token price | Page 11 nuance; page 4 "effort is metered" | [o3 hidden-token pricing](https://tokenmix.ai/blog/openai-o3-pricing) |
| Inference to exceed training compute **~118× by 2026**; ~75% of AI compute by 2030 | Page 1 / page 16 "this is the paradigm now" | [inference-time scaling survey](https://arxiv.org/pdf/2504.09037) |
| Illusion-of-Thinking **synthesis**: collapse is partly artifact (token/format limits) **and** partly real (~8-disk stumble persists); Lawsen rebuttal self-described as a joke | Pages 13, 15 | [Rethinking the Illusion of Thinking](https://arxiv.org/abs/2507.01231) · [VentureBeat debate](https://venturebeat.com/ai/do-reasoning-models-really-think-or-not-apple-research-sparks-lively-debate-response) |
| Overthinking confirmed as current phenomenon | Page 12 | [When More Thinking Hurts (2026)](https://arxiv.org/html/2604.10739v1) |

> Note on "Sol 5.6": the search pass didn't surface a model by that exact name — the 2026 frontier names that came up are GPT-5.4 Pro, Gemini 3.1 Deep Think, Claude Opus 4.5, DeepSeek V4. Whatever the specific model, the landscape **confirms the directional point**: cheap 2026 models now match/beat Dec-2024 o3 at a fraction of the cost. The argument doesn't depend on the name.

---

## 4. Concrete rewrite — Page 1 stake (the highest-leverage fix)

**Now (decayed):**
> "Thinking time is now a product. Frontier systems bill you for it — sometimes thousands of dollars a task. Is machine thinking worth buying, and can you trust what you're paying for?"

**Proposed (durable):**
> "Thinking time is now a product. Frontier systems bill you for it — by the token, by the 'effort level,' and the last few points of accuracy can cost tens of times more than the first many. Is machine thinking worth buying, and can you trust what you're paying for?"

Why it's durable: it names the **shape** (marginal cost explodes), not a **level** (a dollar figure). It's *more* true in 2026 than 2024 — effort levels and metered reasoning tokens are now standard billing, which is the literal realization of "thinking is a product." The two questions (worth buying? trustworthy?) are unchanged, so pages 11 and 14 still pay them off.

---

## 5. Concrete rewrite — Page 11 (economics), preserving the beat structure

The **one idea, the POE flow, the log-$ axis, the dollar-shock, the ★ wow, the zoom-back, the stake callback all stay.** Only the data layer and one reveal change. This is edited directly into [`../pages/page-11-the-bill-arrives.md`](../pages/page-11-the-bill-arrives.md) on approval.

- **Primary layer → ARC-AGI-2, 2026 (current).** Hero within-model comparison: **31% @ $0.81/task → 54% @ $31/task** (~38× compute for +23 pts) — the live 2026 version of the marginal-cost explosion. Frontier ceiling **83–85% at hundreds/task**. Human **~$17/task**. Every point stamped "ARC-AGI-2 · 2026."
- **Historical layer → o3, Dec 2024, ARC-AGI-1 (now a dated anchor, not the headline).** 75.7% @ ~$20 → 87.5% @ thousands (172×), stamped "Dec 2024 · ARC-AGI-1." Rendered in the same 🔭 field frame but visibly *older* (the deck's time-telescope treatment).
- **The recalibrated shock (the new, better one-idea):** *the bill keeps arriving — it just moves to the next hard test.* In 2024 the top ARC-AGI-1 score cost thousands; that's now cheap, so the field built ARC-AGI-2 and the bill came back (tens–hundreds/task vs. $17 for a human). And within any single model, the last points still cost exponentially more. This is a **sharper, more honest** payoff than a static price shock, and it's self-aware about the very datedness you flagged.
- **`<BigNumber>` spotlight:** keep the multiple (now ~38×, or the 172× on the historical layer) — the *ratio* is the durable star, not the absolute dollars.
- **Stake callback (C4):** update to the shape framing so it echoes the new page-1 stake.

**One-idea guard:** the time layer is a *secondary sequenced reveal reinforcing the same idea* (the law recurs), not a second idea — consistent with the deck's "two reveals, one surface" pattern for merged pages. If it feels heavy in build, the historical o3 layer is the cut (keep the 2026 primary).

---

## 6. Accuracy corrections (independent of freshness — fix regardless)

1. **Page 15 — the Lawsen framing is now wrong.** Alex Lawsen has publicly characterized "The Illusion of the Illusion of Thinking" as a joke written with errors, not a serious rebuttal. Presenting it as the defense's case misrepresents the literature. **Re-anchor the defense** on the genuine synthesis work (e.g. "Rethinking the Illusion of Thinking," arXiv:2507.01231) and the community's actual position: the collapse is **partly** an evaluation artifact (token/format limits) **and partly** a real capability wall (~8-disk stumble persists even with programmatic answers). The "verdict flips on the scoring rule" interaction still works — it's just scored against the real methodological critique, not the joke paper.
2. **Page 13 — upgrade the "contested" chip** from "Apple says collapse, Lawsen disagrees" to the synthesis: *contested — the collapse is partly a test-setup artifact and partly real; see page 15.* More accurate, and still honest that it's a live question.
3. **Page 10 — soften "beats a 14× larger model"** to a dated, task-specific finding ("in Snell 2024, on their setup, compute-optimal TTS matched a 14× larger model") rather than a standing law — the stronger-form claim has been complicated since.
4. **Page 14 — date-stamp the faithfulness numbers** (Claude 3.7 / R1 are early-2025 models); refresh to current models for camera-ready if data exists.

---

## 7. Proposed additions to the task list

Small, gate-shaped, consistent with the existing M0–M10 structure:

- **New global convention — "as-of stamping":** every model/price/capability claim carries a visible date + benchmark stamp; a copy test asserts it (mirrors the existing preprint-flag test). Add to *Global conventions → Data fidelity*.
- **New story-QA gate — the currency gate:** *no page states a model-specific capability or price in the present tense without an "as of" stamp; the page-1 stake and page-11 payoff are phrased on shape, not on an absolute price.* Add as gate #7 (release invariant).
- **New M1 data task:** digitize the **ARC-AGI-2 2026 cost/accuracy points** (§3) into `data/arc-agi-2-cost.json`, alongside the existing `data/arc-agi-cost.json` (now the historical layer). Both stamped and provenance-logged.
- **Anchor-table update (Data Anchor Reference):** page 11 row gains the 2026 ARC-AGI-2 layer as primary, o3/2024 demoted to historical; page 15 row swaps the Lawsen citation for the synthesis paper; page 10 row gets the "task-specific, 2024" qualifier.
- **New recurring motif in §6.3 (visual identity):** a light "you are here (2026) / history" time treatment, reusing the page-3 telescope frame — the "frontier moves, law persists" thread.

---

## 8. What does **NOT** change (the explainable is preserved)

To be explicit, since the ask was to tune without deviating:

- **The spine:** watch it think → you change its mind → watch it break → the honest answer. Untouched.
- **The hero object:** the real R1 `<think>` trace on Game-of-24; inspect, re-run, operate on it. Untouched.
- **The four levers, the three signature wows, the branch bank, precompute-only architecture.** Untouched.
- **Every mechanism page's interaction.** Untouched — only some anchor numbers get date stamps.
- **The learning-science scaffolding** (Victor/Case/Mayer/POE) and the venue strategy. Untouched.

The "Watch a Model Think" idea is intact. This review changes **numbers, stamps, and two hooks' phrasing** — and *adds* a time-awareness thread that the deck was already halfway to (page 3). If anything, owning the frontier's movement makes the explorable read as *more* authoritative and harder to date.

---

## 9. Recommended next actions

1. **Approve the two hook rewrites** (§4 page-1 stake, §5 page-11) — highest leverage, unblocks page-11 fine-tuning immediately.
2. **Apply the accuracy fixes** (§6) — these are correctness, not taste; safe to do now (pages 13/15 are Tier 2 but the corpus should be right).
3. **Fold §7 into the proposal + task list** — the currency gate and as-of convention institutionalize freshness so this doesn't recur.
4. **Verify §3 numbers against primary sources** during M1 digitization before anything is locked.
