import Link from "next/link";
import { pageHref } from "@/lib/pages";

/** Shared previous/next navigation used by every story page. */
export function PageNav({ n }: { n: number }) {
  const prev = n > 1 ? n - 1 : null;
  const next = n < 20 ? n + 1 : null;
  return (
    <nav className="mt-8 flex items-center justify-between text-sm" aria-label="Page navigation">
      {prev ? (
        <Link href={pageHref(prev)} className="text-ink-muted hover:text-ink">
          ← Page {prev}
        </Link>
      ) : (
        <Link href="/" className="text-ink-muted hover:text-ink">
          ← Home
        </Link>
      )}
      {next ? (
        <Link href={pageHref(next)} className="text-ink-muted hover:text-ink">
          Page {next} →
        </Link>
      ) : (
        <span className="text-ink-muted">The End</span>
      )}
    </nav>
  );
}
