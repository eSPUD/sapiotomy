import Link from "next/link";

/**
 * Slim masthead — the app title on every page (Broadsheet nav-brand). The
 * numbered page index was removed; readers move with the prev/next links at the
 * foot of each page.
 */
export function ProgressRail() {
  return (
    <nav
      aria-label="Story progress"
      className="sticky top-0 z-10 border-b border-grid bg-canvas/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl items-center px-4 py-2.5">
        <Link href="/" className="text-sm font-semibold text-ink hover:text-compute">
          The Story of Inference-Time Scaling
        </Link>
      </div>
    </nav>
  );
}
