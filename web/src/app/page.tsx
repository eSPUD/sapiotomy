import Link from "next/link";
import { CiteBlock } from "@/components/CiteBlock";
import { Reveal } from "@/components/Reveal";
import { ACTS, GLOSSARY, STORY_PAGES, pageHref, type Act } from "@/lib/pages";

const CITATION = `@misc{bangalorelakshman2026its,
  title  = {The Story of Inference-Time Scaling and the Training-Time loop behind it},
  author = {Bangalore Lakshman, Shashank and Eiers, Scott Lawrence},
  year   = {2026},
  note   = {Preprint. Submitted to the VISxAI Workshop at IEEE VIS; not yet peer-reviewed.},
  url    = {https://sapiotomy.vercel.app}
}`;

export default function Home() {
  const acts: Act[] = [1, 2, 3];
  return (
    <div className="flex flex-col">
      {/* Hero, with How to explore beside it on wide screens (below it otherwise) */}
      <section className="xl:grid xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start xl:gap-10">
        <Reveal>
          <div className="flex flex-col gap-5 pt-4 pb-6">
            {/* The venue line the story-page masthead carries, which the landing has none of.
                Equal visible space above it and below it, down to the title's capitals (~48px). */}
            <p className="mb-6 text-sm text-ink-faint">
              An interactive AI explainable.
              <br />
              The 9th Workshop on Visualization for AI Explainability (VISxAI), IEEE VIS 2026.
            </p>
            <div>
              <h1 className="text-3xl font-bold leading-[1.05] text-ink sm:text-5xl">
                The Story of{" "}
                <span className="text-compute">Inference-Time Scaling</span>
              </h1>
              <p className="mt-2 text-2xl text-ink-muted sm:text-3xl">
                and the training-time loop behind it
              </p>
            </div>

            <p className="text-lg text-ink-muted">
              A language model can get dramatically better answers by{" "}
              <span className="italic text-ink">thinking longer at answer time</span>, not only by
              being retrained or made larger.
            </p>
          </div>
        </Reveal>

        <aside
          aria-labelledby="how-to-explore"
          className="mt-6 flex flex-col gap-3 rounded-lg border border-grid bg-surface p-5 xl:mt-4"
        >
          <h2 id="how-to-explore" className="text-lg font-bold text-ink">
            How to explore
          </h2>
          <ul className="flex list-disc flex-col gap-2 pl-4 text-sm text-ink-muted">
            <li>Read in order, or jump to any chapter.</li>
            <li>Every figure is interactive: drag the sliders, click the diagrams.</li>
            <li>Some chapters come with a Python notebook of their code and data.</li>
          </ul>
        </aside>
      </section>

      {/* Contents */}
      <section aria-label="Contents" className="mt-8 flex flex-col gap-6">
        {/* three columns, one per Act */}
        <div className="grid gap-8 md:grid-cols-3">
          {acts.map((act) => (
            <div key={act} className="flex flex-col gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-muted">
                Act {act} · {ACTS[act].title}
              </h2>
              <ol className="flex flex-col gap-2.5">
                {STORY_PAGES.filter((p) => p.act === act).map((p) => (
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

        {/* The glossary is page 17 but belongs to no act, so it sits apart from
            the three columns rather than at the foot of Act 3. */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-muted">
            Appendix
          </h2>
          <ol className="flex flex-col gap-2.5">
            <li>
              <Link href={pageHref(GLOSSARY.n)} className="group flex items-baseline gap-2 text-sm">
                <span className="tabular-nums text-ink-muted">
                  {String(GLOSSARY.n).padStart(2, "0")}
                </span>
                <span className="text-ink group-hover:underline">{GLOSSARY.title}</span>
              </Link>
            </li>
          </ol>
        </div>

        <div className="h-px w-full bg-ink" />
      </section>

      {/* About the series */}
      <section className="mt-16 flex flex-col gap-8">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-bold text-ink">Authors</h2>
            <ol className="flex flex-col gap-4 text-sm text-ink-muted">
              <li className="flex flex-col gap-0.5">
                <span className="font-semibold text-ink">
                  Shashank Bangalore Lakshman
                  <sup aria-hidden="true" className="text-compute">*&dagger;</sup>
                </span>
                <span>Graduate Student, M.S. in Artificial Intelligence</span>
                <span>Department of Computer Science, The University of Texas at Austin</span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-semibold text-ink">
                  Scott Lawrence Eiers
                  <sup aria-hidden="true" className="text-compute">&dagger;</sup>
                </span>
                <span>Undergraduate Student, B.S. in Computer Science</span>
                <span>Western Governors University</span>
              </li>
            </ol>
            <div className="flex flex-col gap-1 text-xs text-ink-muted">
              <p>
                <span className="text-compute">*</span> Corresponding author.
              </p>
              <p>
                <span className="text-compute">&dagger;</span> These authors contributed equally.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-bold text-ink">Cite this work</h2>
            <CiteBlock citation={CITATION} filename="inference-time-scaling.bib" />
          </div>
        </div>
      </section>
    </div>
  );
}
