"use client";

import { useState } from "react";

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-grid bg-surface px-1.5 py-0.5 font-mono text-[11px] text-ink">
      {children}
    </kbd>
  );
}

/** A small fixed button that explains the app's keyboard navigation. */
export function KeyboardHint() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-4 right-4 z-30 flex flex-col items-end print:hidden">
      {open ? (
        <div className="mb-2 w-72 rounded-lg border border-grid bg-canvas p-4 text-sm shadow-lg">
          <p className="mb-2 font-semibold text-ink">Keyboard navigation</p>
          <ul className="flex flex-col gap-2 text-ink-muted">
            <li>
              <Kbd>→</Kbd> / <Kbd>Page Down</Kbd>: next page
            </li>
            <li>
              <Kbd>←</Kbd> / <Kbd>Page Up</Kbd>: previous page
            </li>
            <li>
              <Kbd>Tab</Kbd> then <Kbd>Enter</Kbd>: jump to any chapter via the progress bar
            </li>
          </ul>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="rounded-full border border-grid bg-surface px-2 py-0.5 text-[10px] font-medium text-ink shadow-sm transition-colors hover:border-compute"
      >
        <span aria-hidden="true">⌨</span> Keyboard shortcuts
      </button>
    </div>
  );
}
