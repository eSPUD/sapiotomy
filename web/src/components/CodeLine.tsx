/**
 * One line of a pseudocode listing: numbered code on the left, intuition on the
 * right. On narrow screens the annotation stacks under the code. Shared by page
 * 12 (STaR) and page 13 (GRPO), so the two listings read alike.
 */
export function CodeLine({
  n,
  indent,
  code,
  note,
}: {
  n: number;
  indent: number;
  code: React.ReactNode;
  note?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 py-0.5 sm:min-h-[3rem] sm:grid-cols-[auto_minmax(0,20rem)_minmax(0,1fr)] sm:items-start sm:content-start sm:gap-x-4">
      <span
        className="w-5 select-none text-right font-code text-xs tabular-nums text-ink-muted"
        aria-hidden="true"
      >
        {n}
      </span>
      <span className="flex items-baseline font-code text-sm text-ink">
        {/* Tab-width indentation, each level marked by an editor-style arrow guide. */}
        {indent > 0 ? (
          <span className="flex select-none" aria-hidden="true">
            {Array.from({ length: indent }, (_, j) => (
              <span key={j} className="w-[3ch] text-grid">
                →
              </span>
            ))}
          </span>
        ) : null}
        <code className="whitespace-pre">{code}</code>
      </span>
      {note ? (
        <span className="col-start-2 text-xs text-ink-muted sm:col-start-3">
          {note}
        </span>
      ) : null}
    </div>
  );
}
