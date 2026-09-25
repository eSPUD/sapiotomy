import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

// No motion or timers to stub: Page 2 is a cutoff slider plus prose.
const mm = (q: string) => ({
  matches: false,
  media: q,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  onchange: null,
  dispatchEvent: () => false,
});
vi.stubGlobal("matchMedia", mm);

import { Page2 } from "./Page2";
import { SPAIN_SYSTEM2_TRACE, SPAIN_WORLD_CUPS } from "@/lib/authored";

const WC = SPAIN_WORLD_CUPS;

describe("Page 2 (Thinking in Reality): a model training data cutoff slider", () => {
  it("shows the question and the cutoff slider, answering one short by default", () => {
    render(<Page2 />);
    // A chat: a user icon with the question, a model icon with the reply, and the
    // cutoff slider underneath the conversation. Icons replace the text labels.
    expect(screen.getByRole("img", { name: "User" })).toBeInTheDocument();
    // One model icon in the chat, one on the ideal answer in section 2.
    expect(screen.getAllByRole("img", { name: "Model" })).toHaveLength(2);
    expect(screen.queryByText(/the user asks|the model answers/i)).toBeNull();
    expect(screen.getByTestId("user-question")).toHaveTextContent(WC.question);
    expect(
      screen.getByTestId("model-reply").compareDocumentPosition(screen.getByRole("slider", { name: /model training data cutoff/i })) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByRole("slider", { name: /model training data cutoff/i })).toBeInTheDocument();
    expect(screen.getByText("model training data cutoff:")).toBeInTheDocument();
    // At the default cutoff (Jan 2026) it answers off a memory that predates the July final.
    const reply = () => screen.getByTestId("model-reply");
    expect(reply()).toHaveTextContent(/won the FIFA World Cup once, in 2010/i);
    // The count is highlighted.
    expect(reply().querySelector('mark[data-pair="count"]')).toHaveTextContent("once");
    // No status pill: the highlighted count carries the answer.
    expect(screen.queryByText(/one short/i)).toBeNull();
    // Matching words share a highlight across question and reply.
    const q = screen.getByTestId("user-question");
    expect(q.querySelector('mark[data-pair="count"]')).toHaveTextContent("How many");
    expect(q.querySelector('mark[data-pair="cup"]')).toHaveTextContent("FIFA World Cups");
    expect(q.querySelector('mark[data-pair="country"]')).toHaveTextContent("Spain");
    expect(reply().querySelector('mark[data-pair="country"]')).toHaveTextContent("Spain");
    expect(reply().querySelector('mark[data-pair="cup"]')).toHaveTextContent("FIFA World Cup");
    expect(q.querySelector('mark[data-pair="count"]')!.className).toBe(
      reply().querySelector('mark[data-pair="count"]')!.className,
    );
    expect(q.className).toMatch(/font-code/);
    expect(reply().className).toMatch(/font-code/);
    // The pedagogically critical property: the stale reply never names 2026.
    expect(reply().textContent).not.toMatch(
      /2026/,
    );
  });

  it("the cutoff slider changes the recalled answer", () => {
    render(<Page2 />);
    const slider = screen.getByRole("slider", { name: /model training data cutoff/i });
    // Past the 2026 final, the training data catches up and names both men's titles.
    fireEvent.change(slider, { target: { value: String(2026 * 12 + 8) } });
    expect(screen.getByTestId("model-reply")).toHaveTextContent(/twice, in 2010 and 2026/i);
    expect(screen.getByTestId("model-reply").querySelector('mark[data-pair="count"]')).toHaveTextContent("twice");
    expect(screen.queryByText(/within cutoff|✓ current/)).toBeNull();
  });

  it("runs the slider across 2026 only, starting at Jan 2026", () => {
    render(<Page2 />);
    const slider = screen.getByRole("slider", { name: /model training data cutoff/i });
    expect(slider).toHaveAttribute("min", String(2026 * 12));
    expect(slider).toHaveAttribute("max", String(2026 * 12 + 11));
    expect(slider).toHaveAttribute("aria-valuetext", "Jan 2026");
  });

  it("section 2 shows the bias: the question never said men's", () => {
    render(<Page2 />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/The question never said men's/i);
    // The ideal answer is set like the chat reply in section 1, naming both teams.
    const ideal = screen.getByRole("region", { name: /The ideal answer/i });
    expect(within(ideal).getByText(/men's team in 2010 and 2026, and the women's team in 2023/i))
      .toBeInTheDocument();
    expect(within(ideal).getByRole("img", { name: "Model" })).toBeInTheDocument();
    expect(within(ideal).getByTestId("ideal-reply").className).toMatch(/font-code/);
    expect(within(ideal).getByTestId("ideal-reply").querySelector('mark[data-pair="count"]')).toHaveTextContent("three");
    // The point that makes it a DIFFERENT failure from the knowledge gap.
    expect(body).toMatch(/The women's 2023 win came before the cutoff and was widely covered/i);
    expect(body).toMatch(/We call this a\s*knowledge bias/i);
    expect(body).toMatch(
      /With a knowledge gap, the fact is\s*missing\. With a knowledge bias, the fact is there, but the model overlooks it\./i,
    );
  });


  it("section 3 walks a System 2 trace that lands on three titles", () => {
    render(<Page2 />);
    const body = document.body.textContent ?? "";
    // Every authored step is on screen, named and numbered.
    const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    SPAIN_SYSTEM2_TRACE.steps.forEach((step, i) => {
      expect(screen.getByText(`Step #${i + 1}`)).toBeInTheDocument();
      expect(screen.getByText(step.name)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(esc(step.text.slice(0, 40)), "i"))).toBeInTheDocument();
    });
    expect(body).toMatch(/Three\./);
  });

  it("is honest that rereading settles the bias but a lookup closes the gap", () => {
    render(<Page2 />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/fixes the\s*bias\s*on its own,\s*with no new information/i);
    expect(body).toMatch(/so rereading won't help/i);
    expect(body).toMatch(/spot the\s*gap and then fix it with a lookup/i);
    // ...and that the model itself did not change, only the time and compute it spent.
    expect(body).toMatch(/The only difference is that it spent more time to reason and\s*reference\./i);
  });

  it("panel 2 says the training data ends, not that training was sealed", () => {
    render(<Page2 />);
    expect(screen.getByText(/My training data ends in early 2026\. A newer final could be missing\./)).toBeInTheDocument();
    expect(document.body.textContent ?? "").not.toMatch(/training was sealed/);
  });

  it("keeps author-year citations out of the prose", () => {
    render(<Page2 />);
    // Claims carry numbers; the works themselves live in the sidenotes.
    expect(document.body.textContent ?? "").not.toMatch(/\[[A-Z][a-z]+ et al\.,? \d{4}\]/);
  });

  it("numbers every citation inline and lists the same numbers in the sidenotes", () => {
    const { container } = render(<Page2 />);
    const marks = Array.from(container.querySelectorAll("sup"));
    expect(marks).toHaveLength(1);
    // The one marker is a Cite anchor into the References sidenote.
    expect(marks[0].querySelector("a")?.getAttribute("href")).toMatch(/^#ref-1$/);
    expect(document.body.textContent ?? "").toMatch(/1\.\s*Zhao et al/);
    // The HHH citation left with the old lede.
    expect(document.body.textContent ?? "").not.toMatch(/Askell/);
  });

  it("cites the bias source", () => {
    render(<Page2 />);
    expect(document.body.textContent ?? "").toMatch(/Gender Bias in Coreference Resolution/i);
  });

  it("keeps Act 1's em-dash-free copy rule", () => {
    render(<Page2 />);
    expect(document.body.textContent ?? "").not.toMatch(/\u2014/);
    // ...including after the cutoff has passed the final.
    fireEvent.change(screen.getByRole("slider", { name: /model training data cutoff/i }), {
      target: { value: String(2026 * 12 + 8) },
    });
    expect(document.body.textContent ?? "").not.toMatch(/\u2014/);
  });

  it("opens on System 1 in the real world and closes on the retrain question", () => {
    render(<Page2 />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/What happens when an LLM answers with System 1 thinking in the real world\?/);
    expect(body).not.toMatch(/That is inference-time scaling/);
    expect(body).toMatch(/Why not just retrain the model on newer\s*data instead\?/);
  });

  it("does not render the removed stepper, roads, or guess controls", () => {
    render(<Page2 />);
    expect(screen.queryByRole("button", { name: /next ▸/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /▶ play/i })).toBeNull();
    expect(screen.queryByRole("group", { name: /recall path/i })).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
