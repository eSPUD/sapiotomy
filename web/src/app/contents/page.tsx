import type { Metadata } from "next";
import Link from "next/link";
import { ACTS, PAGES, pageHref, type Act } from "@/lib/pages";

export const metadata: Metadata = {
  title: "Contents · The Story of Inference-Time Scaling",
};

export default function Contents() {
  const acts: Act[] = [1, 2, 3];
  return (
    <div className="flex max-w-3xl flex-col gap-10 py-6">
      <header className="flex flex-col gap-4">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Contents</p>
        <div className="h-[3px] w-full bg-ink" />
        <h1 className="text-4xl font-bold text-ink sm:text-5xl">The Story of Inference-Time Scaling</h1>
        <div className="h-px w-full bg-ink" />
      </header>

      {acts.map((act) => (
        <section key={act} className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Act {act} · {ACTS[act].title}{" "}
            <span className="font-normal">({ACTS[act].range})</span>
          </h2>
          <ol className="flex flex-col gap-5">
            {PAGES.filter((p) => p.act === act).map((p) => (
              <li key={p.n} className="flex gap-4">
                <span className="w-7 shrink-0 pt-0.5 text-right tabular-nums text-ink-muted">{p.n}</span>
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

      <Link href={pageHref(1)} className="w-fit rounded bg-compute px-6 py-2.5 font-semibold text-canvas shadow-md transition-opacity hover:opacity-90">
        Begin the story →
      </Link>
    </div>
  );
}
