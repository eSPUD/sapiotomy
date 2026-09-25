/**
 * Numbered citations, shared by the story pages.
 *
 * A page declares its own reference numbers once (in order of first appearance)
 * and feeds the same constants to both the inline markers and the References
 * margin note, so a number can never drift from the work it points at. Repeating
 * a number is fine and expected when one work supports two claims.
 */

/**
 * A superscript citation marker, e.g. the 1 in "...a voice is angry.1"
 *
 * Several works supporting one claim go in one marker, comma separated
 * ("...feasible.1,2"): pass an array rather than placing two markers side by
 * side, which would run the numbers together.
 *
 * Each number is an in-page anchor to its References entry (`#ref-{n}`): clicking
 * or activating it jumps to that entry in the margin note, which lights up via
 * the `:target` highlight RefItem carries. Pure anchor behaviour, no script.
 */
export function Cite({ n }: { n: number | readonly number[] }) {
  const ns = typeof n === "number" ? [n] : n;
  return (
    <sup className="ml-0.5 font-semibold">
      {ns.map((k, i) => (
        <span key={k}>
          {i > 0 ? <span aria-hidden="true">,</span> : null}
          <a
            href={`#ref-${k}`}
            className="text-compute no-underline hover:underline focus-visible:underline"
          >
            {/* Without this a screen reader announces a bare digit mid-sentence. */}
            <span className="sr-only">reference </span>
            {k}
          </a>
        </span>
      ))}
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
  preprint = false,
  children,
}: {
  n: number;
  href?: string;
  /** Flag non-peer-reviewed sources, the guardrail the citation chips carried
   *  before references moved into the sidenotes. */
  preprint?: boolean;
  children: React.ReactNode;
}) {
  return (
    <p
      id={`ref-${n}`}
      // scroll-mt clears the sticky header when jumped to; the -mx/px pair
      // reserves room for the :target tint so nothing shifts when it appears.
      className="flex flex-wrap gap-1.5 scroll-mt-24 -mx-1.5 rounded px-1.5 py-0.5 transition-colors target:bg-compute/10"
    >
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
      {preprint ? (
        <span className="rounded bg-wrong/20 px-1.5 text-[10px] font-semibold text-wrong">
          preprint
        </span>
      ) : null}
    </p>
  );
}
