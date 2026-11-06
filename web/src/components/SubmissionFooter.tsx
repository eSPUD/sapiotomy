"use client";

import { usePathname } from "next/navigation";

/** The foot of every page. Story pages carry the workshop acceptance line and,
 *  right-aligned, the "Built with Claude Code" credit; the landing carries the
 *  how-to-explore note, since its hero already names the venue, and under it the
 *  AI usage disclosure (author, 2026-11-06). */
export function SubmissionFooter() {
  const landing = usePathname() === "/";
  return (
    <footer className={`mx-auto max-w-[min(90%,2048px)] px-4 ${landing ? "pb-4" : "pb-10"}`}>
      {landing ? (
        // The landing's note sits centred, with no rule and no credit. The AI usage
        // disclosure sits under it, smaller: what AI was used for, and the hardware
        // the notebooks ran on.
        <div className="-mt-4 flex flex-col items-center gap-3 text-center text-sm text-ink-muted">
          <p>
            Read in order, or jump to any chapter. Every figure is interactive: drag the sliders,
            click the diagrams. Some chapters come with a Python notebook of their code and data.
          </p>
          <p className="max-w-3xl text-xs">
            <strong className="font-semibold text-ink">AI usage disclosure:</strong> AI coding
            assistants, including Claude Code, were used to develop this AI explainable and its
            Python notebooks. The notebooks&apos; experiments were run on Google Colab with an NVIDIA
            A100 GPU with 80 GB of memory.
          </p>
        </div>
      ) : (
        // Story pages keep the rule above their acceptance line; the credit sits at its right.
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-grid pt-4 text-sm text-ink-muted">
          <p>
            Accepted at the 9th Workshop on Visualization for AI Explainability (
            <a
              href="https://visxai.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-compute-ink underline"
            >
              VISxAI
            </a>
            ), IEEE VIS 2026.
          </p>
          <p className="whitespace-nowrap">Built with Claude Code</p>
        </div>
      )}
    </footer>
  );
}
