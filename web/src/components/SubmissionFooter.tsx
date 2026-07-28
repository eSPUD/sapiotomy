/** The workshop submission line, shown at the foot of every page. */
export function SubmissionFooter() {
  return (
    <footer className="mx-auto max-w-5xl px-4 pb-10">
      <p className="border-t border-grid pt-4 text-sm text-ink-muted">
        Submitted to the Workshop on Visualization for AI Explainability (
        <a
          href="https://visxai.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-compute underline"
        >
          VISxAI
        </a>
        ), IEEE VIS 2026.
      </p>
    </footer>
  );
}
