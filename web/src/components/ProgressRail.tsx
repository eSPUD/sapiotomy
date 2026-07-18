"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACTS, PAGES, pageHref, type Act } from "@/lib/pages";

/**
 * Persistent three-Act progress rail (Nicky Case's narrative spine). Shows the
 * current page and lets the reader jump between the 20 pages.
 */
export function ProgressRail() {
  const pathname = usePathname();
  const currentN = (() => {
    const m = pathname.match(/^\/p\/(\d+)/);
    return m ? Number(m[1]) : null;
  })();

  const acts: Act[] = [1, 2, 3];

  // Pages 1-4 withhold the machine names until Page 4's in-article tile flip
  // performs the reveal; the sticky rail must not leak them beforehand (a
  // reader arrives on Page 4 pre-flip), so those routes get a neutral site
  // mark and the full title returns from Page 5 onward.
  const preReveal = currentN !== null && currentN <= 4;

  return (
    <nav aria-label="Story progress" className="sticky top-0 z-10 border-b border-grid bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-2">
        <div className="flex items-center gap-2 text-xs">
          <Link href="/" className="font-semibold text-ink hover:text-compute">
            {preReveal ? "The Story of Machine Thinking" : "The Story of Inference-Time Scaling"}
          </Link>
        </div>
        <ol className="flex flex-wrap items-center gap-x-1 gap-y-2">
          {acts.map((act) => (
            <li key={act} className="flex items-center gap-1">
              <span className="mr-1 text-[10px] uppercase tracking-wide text-ink-muted">
                Act {act}: {ACTS[act].title}
              </span>
              {PAGES.filter((p) => p.act === act).map((p) => {
                const active = p.n === currentN;
                return (
                  <Link
                    key={p.n}
                    href={pageHref(p.n)}
                    aria-current={active ? "page" : undefined}
                    title={p.title}
                    className={`flex h-6 w-6 items-center justify-center rounded text-[11px] font-mono ${
                      active
                        ? "bg-compute text-canvas"
                        : "bg-surface-raised text-ink-muted hover:text-ink"
                    }`}
                  >
                    {p.n}
                  </Link>
                );
              })}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
