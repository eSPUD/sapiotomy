"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
 * the `:target` highlight RefItem carries. Hovering or focusing a number also
 * shows that entry in a popover, so the reader need not leave the sentence.
 */
export function Cite({ n }: { n: number | readonly number[] }) {
  const ns = typeof n === "number" ? [n] : n;
  return (
    <sup className="ml-0.5 font-semibold">
      {ns.map((k, i) => (
        <span key={k}>
          {i > 0 ? <span aria-hidden="true">,</span> : null}
          <CiteNumber k={k} />
        </span>
      ))}
    </sup>
  );
}

const POPOVER_WIDTH = 320;
const EDGE = 12;

/**
 * One number in a marker, with its popover. The popover's content is read from
 * the page's own References entry (`#ref-{k}`) at the moment it opens, so the
 * text a reader sees on hover is exactly the entry the margin note shows, and
 * no page has to pass its references twice. It is placed under the number,
 * clamped to the viewport, and stays open while the pointer moves into it.
 */
function CiteNumber({ k }: { k: number }) {
  const anchor = useRef<HTMLAnchorElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [popover, setPopover] = useState<{ html: string; top: number; left: number } | null>(null);
  const id = useId();

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };

  const open = useCallback(() => {
    cancelClose();
    const entry = document.getElementById(`ref-${k}`);
    const a = anchor.current;
    if (!entry || !a) return;
    // The entry minus its leading "k." label: the popover carries the number itself.
    const body = entry.cloneNode(true) as HTMLElement;
    body.firstElementChild?.remove();
    const r = a.getBoundingClientRect();
    const left = Math.min(
      Math.max(EDGE, r.left + r.width / 2 - POPOVER_WIDTH / 2),
      window.innerWidth - POPOVER_WIDTH - EDGE,
    );
    setPopover({ html: body.innerHTML, top: r.bottom + 6, left });
  }, [k]);

  const close = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setPopover(null), 120);
  }, []);

  // Escape dismisses; scrolling would leave a fixed popover behind, so it closes too.
  useEffect(() => {
    if (!popover) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPopover(null);
    const onScroll = () => setPopover(null);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, [popover]);

  useEffect(() => cancelClose, []);

  return (
    <>
      <a
        ref={anchor}
        href={`#ref-${k}`}
        aria-describedby={popover ? id : undefined}
        onMouseEnter={open}
        onMouseLeave={close}
        onFocus={open}
        onBlur={close}
        className="text-compute no-underline hover:underline focus-visible:underline"
      >
        {/* Without this a screen reader announces a bare digit mid-sentence. */}
        <span className="sr-only">reference </span>
        {k}
      </a>
      {popover
        ? createPortal(
            <div
              id={id}
              role="tooltip"
              onMouseEnter={cancelClose}
              onMouseLeave={close}
              style={{ top: popover.top, left: popover.left, width: POPOVER_WIDTH }}
              className="fixed z-50 flex gap-2 rounded-lg border border-grid bg-canvas p-3 text-left text-sm font-normal leading-snug text-ink-muted shadow-xl shadow-ink/15"
            >
              <span className="font-semibold text-compute">{k}.</span>
              {/* The page's own References entry, cloned: app-authored markup, not user input. */}
              <div className="min-w-0" dangerouslySetInnerHTML={{ __html: popover.html }} />
            </div>,
            document.body,
          )
        : null}
    </>
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
      // The number keeps its own column and the entry wraps beside it (a hanging
      // indent), so the two always start on the same line.
      className="flex gap-1.5 scroll-mt-24 -mx-1.5 rounded px-1.5 py-0.5 transition-colors target:bg-compute/10"
    >
      <span className="shrink-0 font-semibold text-compute">{n}.</span>
      <span className="min-w-0 break-words">
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
          <>
            {" "}
            <span className="inline-block rounded bg-wrong/20 px-1.5 text-[10px] font-semibold text-wrong">
              preprint
            </span>
          </>
        ) : null}
      </span>
    </p>
  );
}
