"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACTS, STORY_PAGES, pageHref, type Act, type StoryPage } from "@/lib/pages";

const acts: Act[] = [1, 2, 3];

/**
 * The act-page index as a left menu beside every story page, set like the
 * landing's three-column index. It sticks under the masthead and scrolls on its
 * own when it is taller than the window. The current page is marked with
 * aria-current and a rule in the compute hue. The glossary is not listed: it is
 * reached from inside the pages (and from page 16's next link).
 */
export function ChapterMenu() {
  const pathname = usePathname();
  const match = pathname.match(/^\/p\/(\d+)/);
  const current = match ? Number(match[1]) : 0;

  const item = (p: StoryPage) => {
    const here = p.n === current;
    return (
      <li key={p.n}>
        <Link
          href={pageHref(p.n)}
          aria-current={here ? "page" : undefined}
          className={`group flex items-baseline gap-2 border-l-2 py-0.5 pl-2 text-sm ${
            here ? "border-compute" : "border-transparent"
          }`}
        >
          <span className="tabular-nums text-ink-muted">{String(p.n).padStart(2, "0")}</span>
          <span
            className={
              here ? "font-semibold text-compute" : "text-ink group-hover:underline"
            }
          >
            {p.title}
          </span>
        </Link>
      </li>
    );
  };

  return (
    <nav
      aria-label="Chapters"
      className="sticky top-28 flex max-h-[calc(100vh-8rem)] flex-col gap-5 overflow-y-auto pb-4"
    >
      {acts.map((act) => (
        <div key={act} className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-muted">
            Act {act} · {ACTS[act].title}
          </h2>
          <ol className="flex flex-col gap-1">
            {STORY_PAGES.filter((p) => p.act === act).map(item)}
          </ol>
        </div>
      ))}
    </nav>
  );
}
