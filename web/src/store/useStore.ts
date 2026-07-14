/**
 * Global simulation / settings store (Zustand).
 *
 * Holds the shared "levers" that the Page-20 Grand Sandbox will later read from,
 * plus lightweight interaction analytics (did the reader manipulate a sim, not
 * just scroll — a VISxAI engagement metric).
 */
import { create } from "zustand";

export type VerifierType = "random" | "majority" | "verifier";

export interface SandboxLevers {
  cotEnabled: boolean;
  samples: number;
  verifier: VerifierType;
  treeBranching: number;
  budgetForcing: number;
  computeBudget: number;
}

export const DEFAULT_LEVERS: SandboxLevers = {
  cotEnabled: false,
  samples: 1,
  verifier: "random",
  treeBranching: 1,
  budgetForcing: 0,
  computeBudget: 1,
};

export interface AppState {
  levers: SandboxLevers;
  setLever: <K extends keyof SandboxLevers>(key: K, value: SandboxLevers[K]) => void;
  resetLevers: () => void;

  /** Per-page interaction counts (one per genuine manipulation). */
  interactions: Record<number, number>;
  recordInteraction: (page: number) => void;
}

export const useStore = create<AppState>((set) => ({
  levers: { ...DEFAULT_LEVERS },
  setLever: (key, value) =>
    set((state) => ({ levers: { ...state.levers, [key]: value } })),
  resetLevers: () => set({ levers: { ...DEFAULT_LEVERS } }),

  interactions: {},
  recordInteraction: (page) =>
    set((state) => ({
      interactions: {
        ...state.interactions,
        [page]: (state.interactions[page] ?? 0) + 1,
      },
    })),
}));
