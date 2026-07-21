"use client";

import { useState } from "react";

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

/** The BibTeX block with Copy and Download-.bib actions. */
export function CiteBlock({ citation, filename = "citation.bib" }: { citation: string; filename?: string }) {
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
    <div className="flex flex-col gap-2">
      <pre
        className="whitespace-pre-wrap break-words rounded bg-surface p-4 text-xs leading-relaxed text-ink"
        style={{ fontFamily: MONO }}
      >
        <code>{citation}</code>
      </pre>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copy}
          className="rounded bg-compute px-3 py-1.5 text-xs font-semibold text-canvas transition-opacity hover:opacity-90"
        >
          {copied ? "Copied ✓" : "Copy citation"}
        </button>
        <button
          type="button"
          onClick={download}
          className="rounded border border-compute px-3 py-1.5 text-xs font-semibold text-compute transition-colors hover:bg-compute/10"
        >
          Download .bib
        </button>
      </div>
    </div>
  );
}
