"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ACTS, PAGES, pageHref } from "@/lib/pages";

/** Chapter navigation with a persistent current-page marker and reading progress. */
export function ScrollProgress() {
  const pathname = usePathname();
  const match = pathname.match(/^\/p\/(\d+)\/?$/);
  const currentPage = match ? Number(match[1]) : 0; // 0 on the landing / other routes
  const [scrollFrac, setScrollFrac] = useState(0);

  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      // A page short enough not to scroll counts as fully read.
      setScrollFrac(max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 1);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  const current = PAGES.find((p) => p.n === currentPage);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-3">
      <p className="mb-2 text-sm text-ink" aria-live="polite" aria-atomic="true">
        {current
          ? `Act ${current.act} · ${ACTS[current.act].title} — ${current.n} / ${PAGES.length}: ${current.title}`
          : "Explore the chapters"}
      </p>
      <div className="grid grid-cols-8 gap-1 sm:grid-cols-[repeat(16,minmax(0,1fr))]">
        {PAGES.map((p) => {
          const page = p.n;
          const fill = currentPage > page ? 1 : currentPage === page ? scrollFrac : 0;
          const isCurrent = currentPage === page;
          return (
            <Link
              key={page}
              href={pageHref(page)}
              aria-label={`Chapter ${page}: ${p.title}`}
              aria-current={isCurrent ? "page" : undefined}
              title={`Chapter ${page}: ${p.title}`}
              scroll={true}
              onClick={
                isCurrent
                  ? (e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: "instant" });
                    }
                  : undefined
              }
              className={`group relative flex min-h-[44px] items-center justify-center rounded border text-sm tabular-nums focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-compute ${
                isCurrent
                  ? "border-compute bg-compute font-bold text-canvas"
                  : "border-grid bg-surface text-ink hover:border-compute hover:text-compute"
              }`}
            >
              <span aria-hidden="true">{String(page).padStart(2, "0")}</span>
              <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 overflow-hidden bg-grid">
                <div className="h-full bg-compute" style={{ width: `${fill * 100}%` }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
