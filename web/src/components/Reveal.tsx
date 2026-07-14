"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Purposeful, reduced-motion-aware fade/rise. When the reader prefers reduced
 * motion, content appears instantly (no transform) — motion is never gratuitous.
 */
export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  // Animate transform only (not opacity): a purposeful "rise" that never reduces
  // text contrast mid-animation (keeps axe green).
  return (
    <motion.div initial={{ y: 8 }} animate={{ y: 0 }} transition={{ duration: 0.35, delay }}>
      {children}
    </motion.div>
  );
}
