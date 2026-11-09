"use client";

import { usePathname } from "next/navigation";
import { PageNav } from "@/components/PageNav";
import { PAGES } from "@/lib/pages";

/**
 * The previous/next buttons again at the top of a story page, below xl only: the
 * chapter menu is hidden there, so without this a reader on a phone or tablet
 * sees no way around until the page's foot (author, 2026-11-08). From xl up the
 * chapter menu does this job, so the top copy is hidden.
 */
export function TopPageNav() {
  const match = usePathname().match(/^\/p\/(\d+)/);
  const n = match ? Number(match[1]) : 0;
  if (!PAGES.some((p) => p.n === n)) return null;
  return (
    <div className="xl:hidden">
      <PageNav n={n} top />
    </div>
  );
}
