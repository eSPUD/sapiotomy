import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

import { SubmissionFooter } from "./SubmissionFooter";

const DISCLOSURE =
  "AI usage disclosure: AI coding assistants, including Claude Code, were used to develop this AI explainable and its Python notebooks.";

describe("SubmissionFooter", () => {
  it("carries the AI usage disclosure on the landing, under the how-to-explore note", () => {
    pathname = "/";
    render(<SubmissionFooter />);
    const footer = screen.getByRole("contentinfo");
    expect(footer.textContent?.replace(/\s+/g, " ")).toContain(DISCLOSURE);
    const paras = [...footer.querySelectorAll("p")].map((p) => p.textContent ?? "");
    expect(paras[0].replace(/\s+/g, " ")).toMatch(
      /^How to explore: Interact with the AI explainable to build intuition\. Download the Python notebooks and run your own experiments! We ran the experiment notebooks on Google Colab\/RunPod with an NVIDIA A100 GPU with 80 GB of memory\.$/,
    );
    // Both notes open on a bold label.
    expect([...footer.querySelectorAll("p strong")].map((b) => b.textContent)).toEqual([
      "How to explore:",
      "AI usage disclosure:",
    ]);
    // The disclosure is the AI use alone; the hardware sits in How to explore.
    expect(paras[1].replace(/\s+/g, " ").trim()).toBe(DISCLOSURE);
    // Both left-aligned (author, 2026-11-08), not centred.
    const box = footer.querySelector("p")!.parentElement!;
    expect(box).toHaveClass("text-left", "items-start");
    expect(box.className).not.toMatch(/text-center|items-center/);
    // The same small font size: both take the box's text-xs, neither sets its own.
    expect(box).toHaveClass("text-xs");
    for (const p of footer.querySelectorAll("p")) expect(p.className).not.toMatch(/text-(xs|sm|base|lg)/);
  });

  it("keeps story pages to the acceptance line and the credit", () => {
    pathname = "/p/5";
    render(<SubmissionFooter />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveTextContent("Built with Claude Code");
    expect(footer).not.toHaveTextContent(/AI usage disclosure/);
  });
});
