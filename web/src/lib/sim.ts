/**
 * Core simulation primitives shared by the app (via Web Workers) and the tests.
 *
 * Keeping the math in pure, importable functions means the Web Worker is a thin
 * wrapper and every result is unit-testable deterministically with a seeded RNG.
 */
import { bernoulli, createRng } from "./rng";

/**
 * Closed-form coverage: probability that AT LEAST ONE of n independent samples
 * (each correct with probability p) is correct. Introduced on Page 5.
 */
export function coverageAtLeastOne(p: number, n: number): number {
  if (n <= 0) return 0;
  return 1 - Math.pow(1 - p, n);
}

/**
 * Seeded Monte Carlo estimate of the same coverage, used to demonstrate that
 * the "live" simulation converges to the closed form. Deterministic per seed.
 */
export function coverageMonteCarlo(
  p: number,
  n: number,
  trials: number,
  seed: number,
): number {
  const rng = createRng(seed);
  let solved = 0;
  for (let t = 0; t < trials; t++) {
    let any = false;
    for (let i = 0; i < n; i++) {
      if (bernoulli(rng, p)) {
        any = true;
      }
    }
    if (any) solved++;
  }
  return solved / trials;
}
