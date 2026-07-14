# Formative user-testing protocol (M8)

> **Status: instrumentation ready; human sessions pending.**
> The engagement + learning-gain metrics are implemented and unit-tested
> (`src/lib/analytics.ts`). Running the study requires real participants and
> **cannot be completed by an automated agent** — this document is the protocol
> to execute with 5–8 undergraduates before the VISxAI submission.

## Participants
- **5–8 first/second-year engineering undergraduates**, high-school algebra +
  probability, **no ML background** (the target audience).

## Method — moderated think-aloud
1. **Pre-quiz** (already built into Page 20): capture baseline on the three
   conceptual items (log-axis reading, verifier-vs-vote, overthinking).
2. **Free traversal 1 → 20**, thinking aloud. Moderator observes silently,
   noting where readers hesitate, skip a simulation, or misread a chart.
3. **Post-quiz** (Page 20): capture the learning-gain delta.
4. **Confidence + clarity survey** (Likert 1–5) mapped to the six learning
   objectives from the design spec.

## Metrics (instrumented)
| Metric | Source |
|---|---|
| Per-page manipulation rate | `engagementReport().manipulationRate` |
| Did the reader touch each sim (not just scroll) | store `interactions[page] > 0` |
| Pages below 50% manipulation | `engagementReport().underThresholdPages` |
| Completion / drop-off | reached Page 20; per-page last-seen |
| Pre/post learning gain | `learningGain(pre, post)` |

## Change triggers (act on these)
- **< 50% of participants manipulate a given simulation** → redesign that page so
  the control is the first thing they touch (Case's "start on the ground"), then
  re-test the affected page.
- **A conceptual item shows no pre→post gain across the cohort** → revisit that
  page's framing / Predict-Observe-Explain prompt.
- **Cognitive-overload signals** (readers verbalize confusion, backtrack) → apply
  Mayer coherence: cut extraneous elements, enforce one-idea-per-page.

## Exit criteria (from task_list.md M8)
- Meaningful positive conceptual pre→post shift across the cohort.
- No simulation below the 50% manipulation threshold after iteration.
- Overload hotspots resolved.

## How to collect the data
The store already counts genuine interactions. For a session, export
`useStore.getState().interactions` at the end; aggregate `perPageManipulators`
across participants and feed both into `engagementReport(...)`. Record pre/post
quiz scores shown on Page 20.
