import Link from "next/link";
import { ScrollProgress } from "@/components/ScrollProgress";

/**
 * Slim masthead — the app title on every page (Broadsheet nav-brand). The
 * numbered page index was removed; readers move with the prev/next links at the
 * foot of each page.
 */
export function ProgressRail() {
  return (
    <nav
      aria-label="Story progress"
      className="sticky top-0 z-10 border-b border-grid bg-canvas"
    >
      <ScrollProgress />
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-5">
        <Link href="/" className="group flex flex-col leading-tight">
          <span className="text-sm font-semibold text-ink group-hover:text-compute">
            The Story of Inference-Time Scaling
          </span>
          <span className="text-xs italic text-ink-muted">
            and the training-time loop behind it
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs uppercase tracking-[0.2em] text-ink-muted sm:inline">
            An interactive explorable
          </span>
          <span className="rounded bg-wrong/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-wrong">
            Pre-print
          </span>
        </div>
      </div>
    </nav>
  );
}
