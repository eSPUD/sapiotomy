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
      className="sticky top-0 z-10 border-b border-grid bg-compute"
    >
      <ScrollProgress />
      <div className="mx-auto flex max-w-[80%] items-center justify-between gap-3 px-4 pt-3 pb-5">
        <Link href="/" className="group flex flex-col leading-tight">
          <span className="text-lg font-semibold text-canvas group-hover:underline">
            The Story of Inference-Time Scaling
          </span>
          <span className="text-sm text-canvas/80">
            and the training-time loop behind it
          </span>
        </Link>
        <div className="hidden flex-col items-end text-right leading-tight sm:flex">
          <span className="text-lg text-canvas/80">
            An interactive AI explainable
          </span>
          <span className="text-xs text-canvas/80">
            9th Workshop on Visualization for AI Explainability (VISxAI) at IEEE VIS 2026
          </span>
        </div>
      </div>
    </nav>
  );
}
