"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DEMO_STOPS, requestDemoSelect } from "@/lib/demo";
import { pageHref } from "@/lib/pages";

/** The stop survives a reload, so a presenter who refreshes stays in the demo. */
const STORAGE_KEY = "demo-mode-step";
const ACTIVE = "data-demo-active";

/** True when the keystroke belongs to a focused control, as KeyboardNav decides it. */
function typingInControl(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable) return true;
  const role = el.getAttribute("role");
  return role === "textbox";
}

const clearSpotlight = () =>
  document.querySelectorAll(`[${ACTIVE}]`).forEach((el) => el.removeAttribute(ACTIVE));

/**
 * Presentation mode (2026-11-09). P enters it at the first stop and each further
 * P moves to the next, looping round; Q leaves. Each stop opens its page, scrolls
 * its widget into view and spotlights it (globals.css dims everything else), and
 * a badge says where the presenter is. The widgets stay fully interactive.
 *
 * Mounted once in the root layout, so it lives across page changes. Keystrokes
 * with a modifier, or typed into a text control, are left alone.
 */
export function DemoMode() {
  const router = useRouter();
  const pathname = usePathname();
  const [step, setStep] = useState<number | null>(null);
  const stepRef = useRef(step);
  stepRef.current = step;

  useEffect(() => {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (saved !== null && DEMO_STOPS[Number(saved)]) setStep(Number(saved));
  }, []);

  useEffect(() => {
    if (step === null) window.sessionStorage.removeItem(STORAGE_KEY);
    else window.sessionStorage.setItem(STORAGE_KEY, String(step));
  }, [step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || typingInControl()) return;
      const key = e.key.toLowerCase();
      if (key === "p") {
        e.preventDefault();
        const cur = stepRef.current;
        const next = cur === null ? 0 : (cur + 1) % DEMO_STOPS.length;
        setStep(next);
        // Only P travels: the arrow keys still move freely between pages mid-demo.
        const href = pageHref(DEMO_STOPS[next].page);
        if (window.location.pathname !== href) router.push(href);
      } else if (key === "q" && stepRef.current !== null) {
        e.preventDefault();
        setStep(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  // On the stop's page, find its widget (the page may still be rendering), ask it
  // for its problem, scroll to it and spotlight it. Off that page (the presenter
  // used the arrow keys), nothing is spotlit until the next P.
  useEffect(() => {
    clearSpotlight();
    if (step === null) return;
    const stop = DEMO_STOPS[step];
    if (pathname !== pageHref(stop.page)) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      const el = document.querySelector<HTMLElement>(`[data-demo="${stop.target}"]`);
      if (!el && ++tries < 100) return;
      window.clearInterval(timer);
      if (!el) return;
      if (stop.problem) requestDemoSelect(stop.target, stop.problem);
      el.setAttribute(ACTIVE, "true");
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      // A widget taller than the window is read from its top; a shorter one is centred.
      const tall = el.getBoundingClientRect().height > window.innerHeight * 0.8;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: tall ? "start" : "center" });
    }, 50);
    return () => window.clearInterval(timer);
  }, [step, pathname]);

  useEffect(() => clearSpotlight, []);

  if (step === null) return null;
  const stop = DEMO_STOPS[step];
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Presentation mode"
      className="fixed left-1/2 top-3 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-compute bg-canvas px-4 py-1.5 text-sm text-ink shadow-lg print:hidden"
    >
      <span className="font-eyebrow text-xs uppercase tracking-wide text-compute-ink">
        Demo {step + 1} / {DEMO_STOPS.length}
      </span>
      <span className="font-semibold">
        Page {stop.page} · {stop.title}
        {stop.problem ? ` · problem ${stop.problem}` : ""}
      </span>
      <span className="text-xs text-ink-muted">P next · Q quit</span>
    </div>
  );
}
