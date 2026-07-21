import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { ACTS, PAGES, pageHref, type Act } from "@/lib/pages";

const CITATION = `@article{bangalorelakshman2026inference,
  title  = {The Story of Inference-Time Scaling},
  author = {Bangalore Lakshman, Shashank and Eiers, Scott Lawrence},
  journal = {VISxAI Workshop at IEEE VIS},
  year   = {2026},
  url    = {https://example.org/inference-time-scaling}
}`;

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

export default function Home() {
  const acts: Act[] = [1, 2, 3];
  return (
    <div className="flex flex-col gap-16">
      {/* Hero */}
      <section>
        <Reveal>
          <div className="flex max-w-3xl flex-col gap-5 py-12">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
              An interactive explorable · VISxAI 2026
            </p>

            <h1 className="text-5xl font-bold leading-[1.05] text-ink sm:text-7xl">
              The Story of{" "}
              <span className="block text-compute">Inference-Time Scaling</span>
            </h1>

            <p className="max-w-xl text-lg text-ink-muted">
              A language model can get dramatically better answers by{" "}
              <span className="italic text-ink">thinking longer at answer time</span> — not only by
              being retrained or made larger. Watch each scaling law appear, hold, and sometimes
              break.
            </p>

            <Link
              href={pageHref(1)}
              className="w-fit rounded bg-compute px-8 py-3 text-lg font-semibold text-canvas shadow-md transition-opacity hover:opacity-90"
            >
              Begin the story →
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Contents */}
      <section className="flex flex-col gap-8">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Contents</p>
        {acts.map((act) => (
          <section key={act} className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
              Act {act} · {ACTS[act].title} <span className="font-normal">({ACTS[act].range})</span>
            </h2>
            <ol className="flex flex-col gap-5">
              {PAGES.filter((p) => p.act === act).map((p) => (
                <li key={p.n} className="flex gap-4">
                  <span className="w-7 shrink-0 pt-0.5 text-right tabular-nums text-ink-muted">
                    {p.n}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <Link
                      href={pageHref(p.n)}
                      className="w-fit text-lg font-semibold text-compute hover:underline"
                    >
                      {p.title}
                    </Link>
                    <p className="text-ink-muted">{p.concept}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </section>

      {/* About the series */}
      <section className="flex flex-col gap-8">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">About the series</p>

        <div className="grid gap-10 md:grid-cols-3">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-bold text-ink">Who writes it</h2>
            <p className="text-justify hyphens-auto text-ink-muted">
              <span className="text-ink">Shashank Bangalore Lakshman</span>, Graduate Student (M.S.
              in Artificial Intelligence), Department of Computer Science, The University of Texas at
              Austin, and <span className="text-ink">Scott Lawrence Eiers</span>, Undergraduate
              Student (B.S. in Computer Science), Department of Computer Science, Western Governors
              University. The two authors contributed equally. Correspondence to{" "}
              <a href="mailto:shashankbl@utexas.edu" className="text-compute underline">
                shashankbl@utexas.edu
              </a>{" "}
              (corresponding author).
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-bold text-ink">How to read it</h2>
            <p className="text-justify hyphens-auto text-ink-muted">
              Chapters stand alone but build in order. Every figure is live: sliders re-derive the
              curves, diagrams answer clicks, and the demos sample from a real model when one is
              available — canned transcripts otherwise.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-bold text-ink">Cite the series</h2>
            <pre
              className="whitespace-pre-wrap break-words rounded bg-surface p-4 text-xs leading-relaxed text-ink"
              style={{ fontFamily: MONO }}
            >
              <code>{CITATION}</code>
            </pre>
          </div>
        </div>

        <p className="border-t border-grid pt-4 text-sm text-ink-muted">
          Submitted to the Workshop on Visualization for AI Explainability (VISxAI), IEEE VIS 2026 ·
          Acknowledgments, funding, and conflict-of-interest statements go here.
        </p>
      </section>
    </div>
  );
}
