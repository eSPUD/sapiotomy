/**
 * Composite model for the Page-20 Grand Sandbox: every lever from the story
 * feeds one live accuracy/cost readout. Pure function of the levers, so it is
 * deterministic and unit-testable, and each lever moves accuracy in the same
 * direction the reader learned on its own page.
 */
import type { SandboxLevers } from "@/store/useStore";

export interface SandboxOutcome {
  accuracy: number; // %
  cost: number; // relative compute units
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const VERIFIER_BONUS: Record<SandboxLevers["verifier"], number> = {
  random: 0,
  majority: 4,
  verifier: 10,
};

export function sandboxOutcome(l: SandboxLevers): SandboxOutcome {
  // Base: chain-of-thought on/off, echoing the CoT page (≈18% → ≈57%).
  const base = l.cotEnabled ? 57 : 18;

  // Repeated sampling: self-consistency-style diminishing returns.
  const sampleGain = 17 * (1 - 1 / Math.sqrt(Math.max(1, l.samples)));

  // Selection method: verifier > majority > random.
  const verifierBonus = VERIFIER_BONUS[l.verifier];

  // Tree search: wider branching helps (bounded).
  const treeGain = 4 * (clamp(l.treeBranching, 1, 5) - 1);

  // Budget forcing: helps, then OVER-thinks past a point (inverse-U).
  const bf = clamp(l.budgetForcing, 0, 8);
  const bfGain = 7 * (1 - Math.exp(-0.6 * bf)) - 0.9 * Math.max(0, bf - 4);

  // Extra compute budget: modest logarithmic gain.
  const computeGain = 3 * Math.log2(clamp(l.computeBudget, 1, 16) + 1);

  const accuracy = clamp(base + sampleGain + verifierBonus + treeGain + bfGain + computeGain, 0, 99);

  // Cost scales with everything compute-related.
  const cost =
    l.samples *
    (1 + 0.5 * (clamp(l.treeBranching, 1, 5) - 1)) *
    (1 + 0.4 * bf) *
    clamp(l.computeBudget, 1, 16) *
    (l.cotEnabled ? 1.2 : 1);

  return { accuracy, cost: Math.round(cost * 10) / 10 };
}
