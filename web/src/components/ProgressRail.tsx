"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Slim masthead — the app title on every story page. The landing has none: its
 * own hero carries the title. The scroll progress bar that sat under it was
 * removed; readers move with the chapter menu beside story pages and the
 * prev/next links at each page's foot.
 */
export function ProgressRail() {
  if (usePathname() === "/") return null;
  return (
    <nav
      aria-label="Story progress"
      className="sticky top-0 z-10 border-b border-grid bg-compute"
    >
      <div className="mx-auto flex max-w-[min(90%,2048px)] items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="group flex flex-col leading-tight">
          <span className="text-lg font-semibold text-ink group-hover:underline">
            The Story of Inference-Time Scaling
          </span>
          <span className="text-sm text-ink">
            and the training-time loop behind it
          </span>
        </Link>
        <div className="hidden flex-col items-end text-right leading-tight sm:flex">
          <span className="text-lg text-ink">
            An interactive AI explainable
          </span>
          <span className="text-xs text-ink">
            9th Workshop on Visualization for AI Explainability (VISxAI) at IEEE VIS 2026
          </span>
        </div>
      </div>
    </nav>
  );
}
