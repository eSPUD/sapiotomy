# The Story of Inference-Time Scaling — web app

An interactive explorable explanation (20 pages, three Acts) that teaches how a
language model gets better answers by *thinking longer at inference time*.
Built for submission to VISxAI 2026. See `../planning/task_list.md` for the
milestone plan and `../planning/InferenceTimeScaling_Explainable.md` for the
design spec.

## Stack

Next.js (App Router) · React · TypeScript (strict) · Tailwind CSS · Zustand ·
Framer Motion · D3. Simulations are pre-computed published curves + client-side
Monte Carlo (in Web Workers) — free to serve, offline-capable, no API spend.

## Develop

```bash
cd web
npm install
npm run dev        # http://localhost:3000
```

## Quality gates (run before every commit)

```bash
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
npm test           # vitest (unit + data-fidelity)
npm run build      # next build
npm run test:e2e   # playwright (needs: npx playwright install chromium)
```

## Layout

```
src/
  app/            App Router routes: home + p/1..p/19 (per-route code splitting)
  components/     Shared primitives (Slider, Toggle, Stepper, BigNumber,
                  ChartFrame, PredictBar, CitationBadge) + ProgressRail
  lib/            tokens, rng (seeded), sim (pure Monte Carlo), data (schema),
                  pages (route map)
  store/          Zustand global sim/settings store
  workers/        Web Worker wrappers around lib/sim
data/             Pre-computed curve JSON + PROVENANCE.md (audit trail)
tests-e2e/        Playwright smoke/integration/a11y specs
```

## Deploy

See `../VERCEL_DEPLOY.md`. In short: import the repo into Vercel with
**Root Directory = `web`**; framework auto-detects as Next.js.
