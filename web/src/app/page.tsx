import Link from "next/link";
import { CiteBlock } from "@/components/CiteBlock";
import { Reveal } from "@/components/Reveal";
import { ACTS, STORY_PAGES, pageHref, type Act } from "@/lib/pages";

const CITATION = `@misc{bangalorelakshman2026its,
  title  = {The Story of Inference-Time Scaling and the Training-Time loop behind it},
  author = {Bangalore Lakshman, Shashank and Eiers, Scott Lawrence},
  year   = {2026},
  note   = {Accepted at the 9th Workshop on Visualization for AI Explainability (VISxAI), IEEE VIS 2026.},
  url    = {https://inferencetimescaling.espud.org}
}`;

export default function Home() {
  const acts: Act[] = [1, 2, 3];
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section>
        <Reveal>
          <div className="flex flex-col gap-5 pb-6">
            {/* The venue line the story-page masthead carries, which the landing has none of. */}
            <p className="-mb-2 font-eyebrow text-xs uppercase leading-relaxed tracking-wide text-ink-faint">
              An interactive AI explainable.
              <br />
              The 9th Workshop on Visualization for AI Explainability (VISxAI), IEEE VIS 2026.
            </p>
            <div>
              <h1 className="text-3xl font-bold leading-[1.05] text-ink sm:text-5xl">
                The Story of{" "}
                <span className="text-ink">Inference-Time Scaling</span>
              </h1>
              <p className="mt-2 text-2xl text-ink-muted sm:text-3xl">
                &hellip;and the training-time loop behind it
              </p>
            </div>

            <p className="max-w-4xl italic leading-relaxed text-ink-muted">
              Same model, same weights, better answers: just let it{" "}
              <span className="not-italic text-ink">think longer</span>. Have it reason out loud,
              sample many answers and vote, let a judge pick the best, or search through its options:
              each one trades compute at answer time for accuracy. Then the frontier labs trained
              models to do this on their own. How far can thinking take a model, and when does more of
              it make things worse?
            </p>
          </div>
        </Reveal>
      </section>

      {/* Contents */}
      <section aria-label="Contents" className="mt-2 flex flex-col gap-6">
        {/* three cards, one per Act */}
        <div className="grid gap-6 md:grid-cols-3">
          {acts.map((act) => (
            <div
              key={act}
              className="flex flex-col overflow-hidden rounded-lg border border-grid bg-surface shadow-xl shadow-ink/15"
            >
              {/* The act's name on a band of the chrome, across the card's top. */}
              <h2 className="bg-chrome px-5 py-3 text-sm font-semibold font-eyebrow uppercase tracking-[0.15em] text-canvas">
                Act {act} · {ACTS[act].title}
              </h2>
              <ol className="flex flex-col gap-2.5 p-5">
                {STORY_PAGES.filter((p) => p.act === act).map((p) => (
                  <li key={p.n}>
                    <Link
                      href={pageHref(p.n)}
                      className="group flex items-baseline gap-2 text-sm"
                    >
                      <span className="tabular-nums text-ink-muted group-hover:font-semibold group-hover:text-ink group-focus-visible:font-semibold group-focus-visible:text-ink">
                        {String(p.n).padStart(2, "0")}
                      </span>
                      <span className="text-ink group-hover:font-semibold group-focus-visible:font-semibold">{p.title}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

      </section>

      {/* About the series */}
      <section className="mt-8 flex flex-col gap-8">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-bold text-ink">Authors</h2>
            <ol className="flex flex-col gap-4 text-sm text-ink-muted">
              <li className="flex flex-col gap-0.5">
                <span className="font-semibold text-ink">
                  Shashank Bangalore Lakshman
                  <sup aria-hidden="true" className="text-ink">*</sup>
                </span>
                {/* Name, then role and degree, then department and university (author,
                    2026-11-09). */}
                <span>Graduate Student, M.S. in Artificial Intelligence</span>
                <span>Department of Computer Science, The University of Texas at Austin</span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-semibold text-ink">
                  Scott Lawrence Eiers
                </span>
                <span>Undergraduate Student, B.S. in Computer Science</span>
                <span>Western Governors University</span>
              </li>
            </ol>
            <div className="flex flex-col gap-1 text-xs text-ink-muted">
              <p>
                <span className="text-ink">*</span> Corresponding author.
              </p>
            </div>
          </div>

          <CiteBlock
            citation={CITATION}
            filename="inference-time-scaling.bib"
            heading="Cite this work"
          />
        </div>
      </section>
    </div>
  );
}
