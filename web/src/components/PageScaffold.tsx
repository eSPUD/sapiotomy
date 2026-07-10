import Link from "next/link";
import { getPage, pageHref, ACTS } from "@/lib/pages";

/**
 * Shared stub for a story page. Each of the 20 routes renders this with its
 * page number in M0; later milestones replace the body with the real simulation
 * while keeping the per-route file (so each page code-splits independently).
 */
export function PageScaffold({ n }: { n: number }) {
  const page = getPage(n);
  if (!page) {
    return <p className="text-wrong">Unknown page: {n}</p>;
  }
  const prev = n > 1 ? n - 1 : null;
  const next = n < 20 ? n + 1 : null;

  return (
    <article className="flex flex-col gap-4">
      <p className="text-xs uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>
      <p className="max-w-2xl text-lg text-ink-muted">{page.concept}</p>

      <div className="rounded-lg border border-dashed border-grid bg-surface p-6 text-ink-muted">
        <p>
          Simulation for this page is built in milestone{" "}
          <span className="font-mono text-compute">{page.milestone}</span>.
        </p>
      </div>

      <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Page navigation">
        {prev ? (
          <Link href={pageHref(prev)} className="text-ink-muted hover:text-ink">
            ← Page {prev}
          </Link>
        ) : (
          <Link href="/" className="text-ink-muted hover:text-ink">
            ← Home
          </Link>
        )}
        {next ? (
          <Link href={pageHref(next)} className="text-ink-muted hover:text-ink">
            Page {next} →
          </Link>
        ) : (
          <span className="text-ink-muted">The End</span>
        )}
      </nav>
    </article>
  );
}
