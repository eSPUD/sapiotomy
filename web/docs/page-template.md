# Page template — how every story page is built

**Page 6 (Self-Consistency)** is the reference implementation. Every other page
copies this structure. Files involved:

```
data/<page>.json                     Cited, provenance-tagged anchor data
src/lib/curves.ts                    Register + validate the JSON at load time
src/lib/sim.ts                       Pure, seeded simulation math (testable)
src/lib/mcProtocol.ts                Worker request/response contract + handler
src/workers/monteCarlo.worker.ts     Thin worker glue (self.onmessage → handler)
src/lib/use<Page>.ts                 Client hook: worker + synchronous fallback
src/components/pages/Page<N>.tsx     "use client" page: narrative + interaction
src/app/p/<N>/page.tsx               Route that renders the page component
```

## The recipe (mirrors the "page is done" checklist)

1. **Lock the data first.** Add `data/<page>.json` with `citation` + `provenance`;
   record digitization in `PROVENANCE.md`. Never build UI around an unsourced number.
2. **Write the simulation as pure functions** in `lib/sim.ts`, driven by the shared
   seeded RNG (`lib/rng.ts`) so results are deterministic and unit-testable.
3. **Run heavy compute in the Web Worker** via `mcProtocol.ts`; the hook falls back
   to synchronous compute when `Worker` is unavailable (SSR / older browsers).
4. **Build the page** with the shared primitives (`Slider`, `Toggle`, `Stepper`,
   `BigNumber`, `ChartFrame`/`LineChart`, `PredictBar`, `CitationBadge`, `PageNav`).
   Include at least one live control and a Predict-Observe-Explain prompt.
5. **Accessibility:** meaning never by colour alone (colour + label/shape); charts
   carry an `aria-label`; controls are keyboard-operable; honour reduced motion.
6. **Tests:**
   - simulation unit test (endpoints within ±1.0 pp, monotonicity/shape, determinism)
   - data-fidelity test (JSON endpoints match the paper + citation/provenance present)
   - worker-contract test (`handleRequest` returns the expected shape)
   - component test (predict → interact → observe)
   - E2E + axe spec in `tests-e2e/` (zero serious/critical violations)
7. **Register** the page in `src/lib/pages.ts` (already listed) — it appears in the
   progress rail automatically.

## Gates (run before committing a milestone)

```bash
npm run typecheck && npm run lint && npm test && npm run build && npm run test:e2e
```
