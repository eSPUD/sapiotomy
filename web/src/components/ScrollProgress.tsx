"use client";

import { useEffect, useState } from "react";

/**
 * Reading-progress bar that fills with the accent colour as the reader scrolls
 * the page. Rendered at the bottom edge of the sticky header. Decorative
 * (aria-hidden) — it mirrors scroll position, which assistive tech already has.
 */
export function ScrollProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setPct(max > 0 ? Math.min(100, Math.max(0, (el.scrollTop / max) * 100)) : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-transparent">
      <div className="h-full bg-compute" style={{ width: `${pct}%` }} />
    </div>
  );
}
