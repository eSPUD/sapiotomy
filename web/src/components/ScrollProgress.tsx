"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PAGES } from "@/lib/pages";

const TOTAL = PAGES.length; // 20 chapters

/**
 * Whole-app reading progress, shown at the bottom edge of the sticky header.
 * The bar is split into one small segment per page: pages already read are
 * filled solid, the current page's segment fills with the accent colour as the
 * reader scrolls it, and pages ahead stay empty. Decorative (aria-hidden).
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
    <div aria-hidden="true" className="absolute inset-x-0 bottom-0 flex h-1 gap-px">
      {Array.from({ length: TOTAL }, (_, i) => {
        const page = i + 1;
        const fill = currentPage > page ? 1 : currentPage === page ? scrollFrac : 0;
        return (
          <div key={page} className="relative flex-1 overflow-hidden bg-grid">
            <div className="h-full bg-compute" style={{ width: `${fill * 100}%` }} />
          </div>
        );
      })}
    </div>
  );
}
