/**
 * The box every story page closes on: the page's takeaway and its hand-off to
 * the next page (on page 16, to the end of the story). One component, so every
 * page titles and sets it the same way: a Manilla card (the style guide's
 * pull-quote stock), the eyebrow "Where this leaves us", and the text in the
 * heading serif, set apart from the pages' info boxes.
 *
 * `className` carries only layout from the page (a grid column, min-w-0).
 */
export const HANDOFF_TITLE = "Where this leaves us";

export function Handoff({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <aside
      aria-label={HANDOFF_TITLE}
      className={`flex flex-col gap-2 rounded-xl bg-quote px-6 py-5 ${className}`}
    >
      <p className="font-eyebrow text-xs font-semibold uppercase tracking-wide text-compute-ink">
        {HANDOFF_TITLE}
      </p>
      <div className="font-heading text-lg leading-snug text-ink [&>*+*]:mt-2">{children}</div>
    </aside>
  );
}
