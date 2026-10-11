"use client";

import { usePathname } from "next/navigation";

/** The foot of every page. Story pages carry the workshop acceptance line; the
 *  landing carries the how-to-explore note instead, since its hero already
 *  names the venue. */
export function SubmissionFooter() {
  const landing = usePathname() === "/";
  return (
    <footer className="mx-auto max-w-[90%] px-4 pb-10">
      <div className="border-t border-grid pt-4 text-sm text-ink-muted">
        {landing ? (
          <p>
            Read in order, or jump to any chapter. Every figure is interactive: drag the sliders,
            click the diagrams. Some chapters come with a Python notebook of their code and data.
          </p>
        ) : (
          <p>
            Accepted at the 9th Workshop on Visualization for AI Explainability (
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
        )}
      </div>
    </footer>
  );
}
