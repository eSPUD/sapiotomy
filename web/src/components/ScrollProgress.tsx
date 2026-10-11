"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PAGES, pageHref } from "@/lib/pages";

const TOTAL = PAGES.length; // 16 chapters since the 2026-08-10 cut and wrap-up, plus the glossary (17)

/**
 * Whole-app reading progress + quick navigation, at the bottom of the header.
 * The bar is one small clickable segment per page: read pages are filled solid,
 * the current page's segment fills as it's scrolled, pages ahead stay empty.
 * Clicking a segment jumps to that page (clicking the current page scrolls to
 * its top); hovering (or focusing) a segment shows the page title in a popup.
 */
export function ScrollProgress() {
  const pathname = usePathname();
  const match = pathname.match(/^\/p\/(\d+)/);
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

  return (
    <div className="absolute inset-x-0 bottom-0 flex h-2 gap-px">
      {PAGES.map((p) => {
        const page = p.n;
        const fill = currentPage > page ? 1 : currentPage === page ? scrollFrac : 0;
        const isCurrent = currentPage === page;
        // Keep edge tooltips inside the viewport.
        const tipAlign =
          page <= 2 ? "left-0" : page >= TOTAL - 1 ? "right-0" : "left-1/2 -translate-x-1/2";
        return (
          <Link
            key={page}
            href={pageHref(page)}
            aria-label={`Chapter ${page}: ${p.title}`}
            onClick={
              isCurrent
                ? (e) => {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                : undefined
            }
            className="group relative block flex-1"
          >
            <div className="h-full overflow-hidden bg-grid transition-colors group-hover:bg-wrong">
              <div
                className="h-full bg-compute-bright transition-colors group-hover:bg-wrong"
                style={{ width: `${fill * 100}%` }}
              />
            </div>
            <span
              className={`pointer-events-none absolute top-full z-20 mt-1 whitespace-nowrap rounded bg-ink px-2 py-1 text-[11px] font-medium text-canvas opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 ${tipAlign}`}
            >
              {page}. {p.title}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
