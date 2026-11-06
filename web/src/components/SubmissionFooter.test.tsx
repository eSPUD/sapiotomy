import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

import { SubmissionFooter } from "./SubmissionFooter";

const DISCLOSURE =
  "AI usage disclosure: AI coding assistants, including Claude Code, were used to develop this AI explainable and its Python notebooks. The notebooks' experiments were run on Google Colab with an NVIDIA A100 GPU with 80 GB of memory.";

describe("SubmissionFooter", () => {
  it("carries the AI usage disclosure on the landing, under the how-to-explore note", () => {
    pathname = "/";
    render(<SubmissionFooter />);
    const footer = screen.getByRole("contentinfo");
    expect(footer.textContent?.replace(/\s+/g, " ")).toContain(DISCLOSURE);
    const paras = [...footer.querySelectorAll("p")].map((p) => p.textContent ?? "");
    expect(paras[0]).toMatch(/^Read in order/);
    expect(paras[1]).toMatch(/^AI usage disclosure:/);
  });

  it("keeps story pages to the acceptance line and the credit", () => {
    pathname = "/p/5";
    render(<SubmissionFooter />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveTextContent("Built with Claude Code");
    expect(footer).not.toHaveTextContent(/AI usage disclosure/);
  });
});
