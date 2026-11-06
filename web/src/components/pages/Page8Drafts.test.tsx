/**
 * Tests for the temporary figure 2 drafts. Delete with `Page8Drafts.tsx`.
 */
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { PILE8 } from "@/lib/page08Pile";
import { Page8Drafts } from "./Page8Drafts";

const N = PILE8.nChains;
const some = PILE8.rows.filter((r) => r.n_correct > 0 && r.n_correct < N);

describe("Page 8 figure 2 drafts", () => {
  it("draws the remaining drafts under one removable section", () => {
    render(<Page8Drafts />);
    const root = screen.getByLabelText("Drafts for figure 2");
    expect(within(root).getAllByRole("heading", { level: 3 })).toHaveLength(7);
  });

  it("A: draws one problem from each group, and a redraw keeps to the pools", () => {
    render(<Page8Drafts />);
    const a = screen.getByLabelText(/^Draft A/);
    const pools = () => within(a).getAllByText(/drawn from \d+/).map((e) => e.textContent);
    expect(pools()).toEqual([
      `every chain right · drawn from ${PILE8.bands.all}`,
      `some right · drawn from ${PILE8.bands.mixed}`,
      `none right · drawn from ${PILE8.bands.none}`,
    ]);
    fireEvent.click(within(a).getByRole("button", { name: "Draw three more" }));
    expect(pools()).toHaveLength(3);
    expect(within(a).getByText(/the kept chain is right on/).textContent).toContain(
      `${PILE8.bands.mixed} problems`,
    );
  });

  it("C: the split adds up to every problem", () => {
    render(<Page8Drafts />);
    const bar = within(screen.getByLabelText(/^Draft C/)).getByRole("img");
    const ns = [...bar.getAttribute("aria-label")!.matchAll(/: (\d+)/g)].map((m) => +m[1]);
    expect(ns.reduce((t, n) => t + n, 0)).toBe(PILE8.rows.length);
    expect(ns[1]).toBe(PILE8.bands.mixedKeptRight);
  });

  it("D: a tile opens its problem's ranked chains", () => {
    render(<Page8Drafts />);
    const d = screen.getByLabelText(/^Draft D/);
    expect(within(d).getAllByRole("button", { name: /^problem \d+:/ })).toHaveLength(PILE8.rows.length);
    fireEvent.click(within(d).getByRole("button", { name: /^problem 1:/ }));
    expect(within(d).getAllByRole("button", { name: /^(kept chain|chain rated)/ })).toHaveLength(N);
  });

  it("E: ranks a problem drawn from the some-right pool and names the kept chain", () => {
    render(<Page8Drafts />);
    const e = screen.getByLabelText(/^Draft E/);
    fireEvent.click(within(e).getByRole("button", { name: "Rank by the judge" }));
    const verdict = within(e).getByText(/Best of \d+ keeps/);
    const q = some.find((r) => within(e).queryByText(r.question.slice(0, 20), { exact: false }));
    expect(q).toBeDefined();
    expect(verdict.textContent).toContain(q!.chains[0].c ? "right" : "wrong");
  });

  it("F: puts a right chain first on every all-right problem plus the judge's finds", () => {
    render(<Page8Drafts />);
    const f = within(screen.getByLabelText(/^Draft F/)).getByRole("img");
    expect(f.getAttribute("aria-label")).toContain(
      `ranked one first on ${PILE8.bands.all + PILE8.bands.mixedKeptRight}`,
    );
  });
});
