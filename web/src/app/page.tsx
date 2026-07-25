import Link from "next/link";
import { CiteBlock } from "@/components/CiteBlock";
import { Reveal } from "@/components/Reveal";
import { ACTS, PAGES, pageHref, type Act } from "@/lib/pages";

const CITATION = `@article{bangalorelakshman2026its,
  title  = {The Story of Inference-Time Scaling},
  author = {Bangalore Lakshman, Shashank and Eiers, Scott Lawrence},
  journal = {VISxAI Workshop at IEEE VIS},
  year   = {2026},
  url    = {https://example.org/inference-time-scaling}
}`;

export default function Home() {
  const acts: Act[] = [1, 2, 3];
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section>
        <Reveal>
          <div className="flex max-w-3xl flex-col gap-5 pt-12 pb-6">
            <h1 className="text-4xl font-bold leading-[1.05] text-ink sm:text-6xl">
              The Story of{" "}
              <span className="block whitespace-nowrap text-compute">Inference-Time Scaling</span>
            </h1>

            <p className="max-w-xl text-lg text-ink-muted">
              A language model can get dramatically better answers by{" "}
              <span className="italic text-ink">thinking longer at answer time</span>, not only by
              being retrained or made larger.
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
      <section aria-label="Contents" className="mt-8 flex flex-col gap-6">
        {/* thick–thin rule pair (newspaper furniture) */}
        <div>
          <div className="h-[3px] w-full bg-ink" />
          <div className="mt-1 h-px w-full bg-ink" />
        </div>

        {/* three columns, one per Act */}
        <div className="grid gap-8 md:grid-cols-3">
          {acts.map((act) => (
            <div key={act} className="flex flex-col gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-muted">
                Act {act} · {ACTS[act].title}
              </h2>
              <ol className="flex flex-col gap-2.5">
                {PAGES.filter((p) => p.act === act).map((p) => (
                  <li key={p.n}>
                    <Link
                      href={pageHref(p.n)}
                      className="group flex items-baseline gap-2 text-sm"
                    >
                      <span className="tabular-nums text-ink-muted">
                        {String(p.n).padStart(2, "0")}
                      </span>
                      <span className="text-ink group-hover:underline">{p.title}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        <div className="h-px w-full bg-ink" />
      </section>

      {/* About the series */}
      <section className="mt-16 flex flex-col gap-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-bold text-ink">Authors</h2>
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
              available; canned transcripts otherwise.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-bold text-ink">Cite this work</h2>
            <CiteBlock citation={CITATION} filename="inference-time-scaling.bib" />
          </div>
        </div>

        <p className="border-t border-grid pt-4 text-sm text-ink-muted">
          Submitted to the Workshop on Visualization for AI Explainability (
          <a
            href="https://visxai.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-compute underline"
          >
            VISxAI
          </a>
          ), IEEE VIS 2026.
        </p>
      </section>
    </div>
  );
}
