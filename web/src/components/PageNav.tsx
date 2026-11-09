import Link from "next/link";
import { PAGES, pageHref } from "@/lib/pages";

/** A small bordered pill button (author, 2026-11-08), so the way on reads as a control rather than as a caption. */
const button =
  "flex min-w-0 max-w-[48%] items-center gap-1 whitespace-nowrap rounded-full border border-grid bg-surface px-4 py-1.5 text-sm font-semibold text-ink hover:border-chrome hover:bg-chrome/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-chrome";

/** "4. From Reasoning to Inference-Time Scaling": a page as its heading numbers it. */
const titled = (n: number) => `${n}. ${PAGES.find((p) => p.n === n)?.title ?? ""}`;

/**
 * Shared previous/next navigation for every story page: two small bordered
 * buttons naming the pages either side, "← 4. From Reasoning to…" and
 * "6. Thinking Longer →" (2026-11-08; they were grey "← Page 4" text links). Each
 * pill is one line and at most half the row: a title too long for it ends in an
 * ellipsis (on a phone), the arrow always shows, and the full title stays in the
 * text, so the accessible name is whole ("← 4. From Reasoning to…", arrow and
 * all; the space between the spans keeps the name readable and a flex row
 * ignores it).
 * The buttons are the site's frame, not the page's copy, so page 3's ban on
 * "inference" does not reach them (Page3.test.tsx leaves them out).
 * Page 1's previous goes home; the last page ends on "The End".
 *
 * Each page renders it at its foot. TopPageNav renders it again at the top, at
 * every width; that copy is its own landmark, so it carries its own name.
 */
export function PageNav({ n, top = false }: { n: number; top?: boolean }) {
  const prev = n > 1 ? n - 1 : null;
  const next = n < PAGES.length ? n + 1 : null;
  return (
    <nav
      className={`flex items-center justify-between gap-3 ${top ? "mb-6" : "mt-8"}`}
      aria-label={top ? "Previous and next page" : "Page navigation"}
    >
      {prev ? (
        <Link href={pageHref(prev)} className={button}>
          <span>←</span>{" "}
          <span className="truncate">{titled(prev)}</span>
        </Link>
      ) : (
        <Link href="/" className={button}>
          <span>←</span> <span>Home</span>
        </Link>
      )}
      {next ? (
        <Link href={pageHref(next)} className={`${button} ml-auto`}>
          <span className="truncate">{titled(next)}</span>{" "}
          <span>→</span>
        </Link>
      ) : (
        <span className="text-sm text-ink-muted">The End</span>
      )}
    </nav>
  );
}
