"use client";

import { usePathname } from "next/navigation";
import { PageNav } from "@/components/PageNav";
import { PAGES } from "@/lib/pages";

/**
 * The previous/next buttons again at the top of a story page, at every width
 * (author, 2026-11-08). Below xl the chapter menu is hidden, so without this a
 * reader on a phone or tablet sees no way around until the page's foot; from xl
 * up it sits beside the menu as the quick way to the next page.
 */
export function TopPageNav() {
  const match = usePathname().match(/^\/p\/(\d+)/);
  const n = match ? Number(match[1]) : 0;
  if (!PAGES.some((p) => p.n === n)) return null;
  return <PageNav n={n} top />;
}
