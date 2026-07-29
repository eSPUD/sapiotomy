/**
 * Numbered citations, shared by the story pages.
 *
 * A page declares its own reference numbers once (in order of first appearance)
 * and feeds the same constants to both the inline markers and the References
 * margin note, so a number can never drift from the work it points at. Repeating
 * a number is fine and expected when one work supports two claims.
 */

/** A superscript citation marker, e.g. the 1 in "...a voice is angry.1" */
export function Cite({ n }: { n: number }) {
  return (
    <sup className="ml-0.5 font-semibold text-compute">
      {/* Without this a screen reader announces a bare digit mid-sentence. */}
      <span className="sr-only">reference </span>
      {n}
    </sup>
  );
}

/**
 * One numbered entry in a References margin note.
 *
 * Pass `href` for anything with a canonical page (arXiv abstract, DOI, lab
 * post). The entry then becomes a link that opens in a new tab, permanently
 * underlined: axe flags underline-on-hover-only links inside text blocks, and
 * the reader needs to see it is clickable without hovering. Entries without a
 * stable URL, printed books for instance, stay plain text.
 */
export function RefItem({
  n,
  href,
  children,
}: {
  n: number;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <p className="flex gap-1.5">
      <span className="font-semibold text-compute">{n}.</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-grid underline-offset-2 hover:text-ink"
        >
          {children}
        </a>
      ) : (
        <span>{children}</span>
      )}
    </p>
  );
}
