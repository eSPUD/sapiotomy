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
      className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-grid bg-surface px-3 py-1 text-xs text-ink-muted hover:text-ink"
    >
      {/* A name is one token to a reader, so "Muennighoff et al. 2025" never
          breaks across lines; in a narrow margin the chip wraps between its
          parts instead, which is why the corner is a radius and not a pill. */}
      <span className="whitespace-nowrap font-medium text-ink">{citation.ref}</span>
      <span className="whitespace-nowrap text-ink-muted">· {citation.venue}</span>
      {citation.preprint ? (
        <span className="rounded bg-wrong/20 px-1.5 py-0.5 font-semibold text-wrong">
          preprint
        </span>
      ) : null}
    </a>
  );
}
