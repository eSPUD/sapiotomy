"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PAGES, pageHref } from "@/lib/pages";

const LAST = PAGES.length;

/**
 * Global keyboard navigation between pages:
 *   ArrowRight / PageDown  → next page (from the landing → page 1)
 *   ArrowLeft  / PageUp    → previous page (from page 1 → landing)
 *
 * Guarded so it never hijacks a focused control (inputs, textareas, selects,
 * sliders, contenteditable) or a modified keystroke — those keep their native
 * behaviour (e.g. arrow keys still move a slider).
 */
export function KeyboardNav() {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      const el = document.activeElement as HTMLElement | null;
      if (el) {
        const tag = el.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable) return;
        const role = el.getAttribute("role");
        if (role === "slider" || role === "textbox" || role === "radio") return;
      }

      const forward = e.key === "ArrowRight" || e.key === "PageDown";
      const back = e.key === "ArrowLeft" || e.key === "PageUp";
      if (!forward && !back) return;

      // Read the LIVE url at keypress (avoids any stale-closure race on rapid keys).
      const m = window.location.pathname.match(/^\/p\/(\d+)/);
      const cur = m ? Number(m[1]) : 0; // 0 = landing
      const target = forward ? Math.min(LAST, cur + 1) : cur - 1; // back from page 1 → landing (0)
      if (target < 0 || target === cur) return;

      e.preventDefault();
      router.push(target === 0 ? "/" : pageHref(target));
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return null;
}
