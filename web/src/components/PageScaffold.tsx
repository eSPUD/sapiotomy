import { getPage, ACTS } from "@/lib/pages";
import { PageNav } from "./PageNav";

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
  return (
    <article className="flex flex-col gap-4">
      <p className="text-xs uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>
      <p className="text-lg text-ink-muted">{page.concept}</p>

      <div className="rounded-lg border border-dashed border-grid bg-surface p-6 text-ink-muted">
        <p>
          Simulation for this page is built in milestone{" "}
          <span className="font-mono text-compute">{page.milestone}</span>.
        </p>
      </div>

      <PageNav n={n} />
    </article>
  );
}
