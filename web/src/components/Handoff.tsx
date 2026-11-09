/**
 * The Manilla card: the style guide's pull-quote stock, an eyebrow title in the
 * mono, and the text in the heading serif, set apart from the pages' bordered
 * info boxes. Two uses share it so they always match:
 *   - Handoff: the box every story page closes on, its takeaway and hand-off to
 *     the next page (on page 16, to the end of the story), titled
 *     "Where this leaves us";
 *   - PullQuote: a question posed to the reader, titled "Open question".
 *
 * `className` carries only layout from the page (a grid column, min-w-0); `demo`
 * tags the box as a presentation-mode stop (see lib/demo.ts).
 */
export const HANDOFF_TITLE = "Where this leaves us";

export function Callout({
  title,
  children,
  className = "",
  demo,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  demo?: string;
}) {
  return (
    <aside
      aria-label={title}
      data-demo={demo}
      className={`flex flex-col gap-2 rounded-xl bg-quote px-6 py-5 ${className}`}
    >
      <p className="font-eyebrow text-xs font-semibold uppercase tracking-wide text-ink">
        {title}
      </p>
      <div className="font-heading text-lg leading-snug text-ink [&>*+*]:mt-2">{children}</div>
    </aside>
  );
}

export function Handoff({
  children,
  className,
  demo,
}: {
  children: React.ReactNode;
  className?: string;
  demo?: string;
}) {
  return (
    <Callout title={HANDOFF_TITLE} className={className} demo={demo}>
      {children}
    </Callout>
  );
}
