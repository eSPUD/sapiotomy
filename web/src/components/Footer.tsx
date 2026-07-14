/**
 * Global footer — the in-app ethics/limitations statement required for the
 * VISxAI submission, present on every page.
 */
export function Footer() {
  return (
    <footer className="mt-12 border-t border-grid px-4 py-6 text-xs text-ink-muted">
      <div className="mx-auto flex max-w-5xl flex-col gap-1">
        <p>
          <strong className="text-ink">Illustrative, not predictive.</strong> These simulations
          reproduce the published <em>shapes and endpoints</em> of real results; they are not a
          predictor of any specific model&apos;s behaviour. Preprints and estimates are flagged.
        </p>
        <p>
          Every number traces to a cited primary source (see each page&apos;s citation chip and{" "}
          <code>data/PROVENANCE.md</code>). Built as an explorable explanation for VISxAI 2026.
        </p>
      </div>
    </footer>
  );
}
