# Deploying to Vercel

The explorable is a **static, pre-computed Next.js app** — no GPU, no database, no
API keys required for the MVP. It fits comfortably in Vercel's Hobby tier (note:
Hobby is non-commercial use only) and costs nothing to serve.

The Next.js project lives in the **`web/`** subdirectory of this repo, so the one
setting that matters is **Root Directory = `web`**.

---

## Option A — Vercel dashboard (recommended, gives preview deploys per PR)

1. Go to <https://vercel.com/new> and **Import** the Git repository
   `eSPUD/sapiotomy` (authorize GitHub if prompted).
2. In the configure screen:
   - **Root Directory** → click *Edit* → select **`web`**. _(critical)_
   - **Framework Preset** → auto-detects **Next.js**. Leave it.
   - **Build Command** → default (`next build`).
   - **Output Directory** → default (`.next`).
   - **Install Command** → default (`npm install`).
   - **Environment Variables** → none needed for the MVP. Leave empty.
3. Click **Deploy**. First build takes ~1–2 min.
4. After it succeeds:
   - **Production** deploys automatically on every push to **`main`**.
   - **Preview** deploys automatically for every pull request / non-main branch —
     so each milestone branch (`milestone/m0-foundations`, `milestone/m1-…`, …)
     gets its own shareable preview URL.

That's it. Visit the assigned `*.vercel.app` URL.

---

## Option B — Vercel CLI (one-off deploy from your machine)

```bash
npm i -g vercel            # install the CLI
cd web                     # the Next.js project root
vercel login               # authenticate
vercel link                # link this folder to a Vercel project (creates one)
vercel                     # deploy a PREVIEW build → prints a URL
vercel --prod              # promote to PRODUCTION
```

When `vercel link` asks for the root directory, it is already `web` because you
`cd`'d into it. If you link from the repo root instead, set the root to `web` in
**Project → Settings → General → Root Directory**.

---

## Settings worth confirming (Project → Settings)

- **General → Root Directory:** `web`.
- **General → Node.js Version:** 20.x or 22.x (matches CI).
- **Git → Production Branch:** `main`.
- **Deployment Protection:** optional; enable "Vercel Authentication" for preview
  URLs if you want reviewer-only access before the VISxAI submission is public.

## When optional live inference lands (milestone M9)

The pre-computed app never needs secrets. If the optional in-browser WebGPU demo
(transformers.js / WebLLM) is enabled, it still runs **client-side** — no server
env vars. Only if a hosted model route is added later would you set a provider key
as a **Sensitive** environment variable (never exposed to the client) and add
rate limiting. That is out of scope for the MVP submission.

## Custom domain (optional, for the submission link)

Project → Settings → **Domains** → add a domain (or use the free `*.vercel.app`
URL). VISxAI accepts a hosted URL as the submission artifact.
