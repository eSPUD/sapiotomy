"use client";

import { useState } from "react";

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

/** The BibTeX block under its heading, with the Copy and Download-.bib actions
 *  at the top right, on the heading's row. */
export function CiteBlock({
  citation,
  filename = "citation.bib",
  heading,
}: {
  citation: string;
  filename?: string;
  heading: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard may be unavailable (e.g. insecure context) — ignore
    }
  };

  const download = () => {
    const blob = new Blob([citation], { type: "application/x-bibtex" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold text-ink">{heading}</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copy}
            className="rounded bg-chrome px-3 py-1.5 text-xs font-semibold text-canvas transition-opacity hover:opacity-90"
          >
            {copied ? "Copied ✓" : "Copy citation"}
          </button>
          <button
            type="button"
            onClick={download}
            className="rounded border border-chrome px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-chrome/5"
          >
            Download .bib
          </button>
        </div>
      </div>
      <pre
        className="whitespace-pre-wrap break-words rounded bg-surface p-4 text-[0.65rem] leading-relaxed text-ink"
        style={{ fontFamily: MONO }}
      >
        <code>{citation}</code>
      </pre>
    </div>
  );
}
