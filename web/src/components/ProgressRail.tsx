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
      <div className="mx-auto flex max-w-[80%] items-center justify-between gap-3 px-4 py-5">
        <Link href="/" className="group flex flex-col leading-tight">
          <span className="text-lg font-semibold text-compute group-hover:text-compute-bright">
            The Story of Inference-Time Scaling
          </span>
          <span className="text-sm text-ink-muted">
            and the training-time loop behind it
          </span>
        </Link>
        <div className="hidden flex-col items-end text-right leading-tight sm:flex">
          <span className="text-lg text-ink-faint">
            An interactive AI explainable
          </span>
          <span className="text-xs text-ink-faint">
            9th Workshop on Visualization for AI Explainability (VISxAI) at IEEE VIS 2026
          </span>
        </div>
      </div>
    </nav>
  );
}
