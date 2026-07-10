import Link from "next/link";
import { ACTS, PAGES, pageHref, type Act } from "@/lib/pages";

export default function Home() {
  const acts: Act[] = [1, 2, 3];
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold text-ink">The Story of Inference-Time Scaling</h1>
        <p className="max-w-2xl text-lg text-ink-muted">
          A language model can get dramatically better answers by{" "}
          <span className="text-compute">thinking longer at answer time</span> — not only by being
          retrained or made larger. This extra thinking follows measurable, sometimes
          counter-intuitive, scaling laws. Play with each one.
        </p>
        <Link
          href={pageHref(1)}
          className="w-fit rounded bg-compute px-5 py-2.5 font-semibold text-canvas"
        >
          Start reading →
        </Link>
      </header>

      <div className="grid gap-6">
        {acts.map((act) => (
          <section key={act} className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
              Act {act} · {ACTS[act].title}{" "}
              <span className="font-normal text-ink-muted">({ACTS[act].range})</span>
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {PAGES.filter((p) => p.act === act).map((p) => (
                <li key={p.n}>
                  <Link
                    href={pageHref(p.n)}
                    className="flex items-baseline gap-3 rounded border border-grid bg-surface p-3 hover:border-compute"
                  >
                    <span className="font-mono text-ink-muted">{p.n}</span>
                    <span>
                      <span className="font-medium text-ink">{p.title}</span>
                      <span className="block text-sm text-ink-muted">{p.concept}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
