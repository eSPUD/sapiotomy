"use client";

import type { Citation } from "@/lib/data";

export interface CitationBadgeProps {
  citation: Citation;
}

/**
 * Per-page source chip — what separates an explainer from a toy. Preprint /
 * non-peer-reviewed sources are visibly flagged (task_list.md guardrail).
 */
export function CitationBadge({ citation }: CitationBadgeProps) {
  return (
    <a
      href={citation.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-grid bg-surface px-3 py-1 text-xs text-ink-muted hover:text-ink"
    >
      <span className="font-medium text-ink">{citation.ref}</span>
      <span className="text-ink-muted">· {citation.venue}</span>
      {citation.preprint ? (
        <span className="rounded bg-wrong/20 px-1.5 py-0.5 font-semibold text-wrong">
          preprint
        </span>
      ) : null}
    </a>
  );
}
