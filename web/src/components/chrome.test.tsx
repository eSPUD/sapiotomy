import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

let pathname = "/p/5";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

import { ProgressRail } from "./ProgressRail";
import { ChapterMenu } from "./ChapterMenu";
import { PageNav } from "./PageNav";
import { Handoff } from "./Handoff";
import { SubmissionFooter } from "./SubmissionFooter";
import { KeyboardHint } from "./KeyboardHint";
import { NotebookDownload } from "./NotebookDownload";
import { CiteBlock } from "./CiteBlock";
import { ModelIcon } from "./ChatIcons";
import { Slider } from "./Slider";

/**
 * Option A (2026-11-09): the site's frame is drawn in the chrome (ink), so the
 * orange "compute" hue means compute and nothing else. None of the frame's
 * pieces may use a data hue: compute, correct or wrong.
 */
const DATA_HUE = /(^|\s)([\w-]+:)*(bg|border|text|ring|outline|accent|fill|stroke)-(compute|correct|wrong)(-[\w]+)?(\/\d+)?(?=\s|$)/;

describe("the frame keeps out of the data hues", () => {
  it.each([
    ["masthead", () => <ProgressRail />],
    ["chapter menu", () => <ChapterMenu />],
    ["page navigation", () => <PageNav n={5} />],
    ["closing box", () => <Handoff>closing</Handoff>],
    ["story footer", () => <SubmissionFooter />],
    ["keyboard hint", () => <KeyboardHint />],
    ["notebook download", () => <NotebookDownload href="/x.ipynb" size="1 MB" />],
    ["citation block", () => <CiteBlock citation="@misc{x}" heading="Cite this work" />],
    ["model icon", () => <ModelIcon />],
    ["slider", () => <Slider label="dial" min={0} max={1} step={1} value={0} onChange={() => {}} />],
  ])("%s", (_, ui) => {
    pathname = "/p/5";
    const { container } = render(ui());
    const offenders = [...container.querySelectorAll("*")]
      .map((el) => el.getAttribute("class") ?? "")
      .filter((c) => DATA_HUE.test(c));
    expect(offenders).toEqual([]);
  });

  it("draws the masthead in the chrome, with ivory type", () => {
    pathname = "/p/5";
    const { container } = render(<ProgressRail />);
    expect(container.querySelector("nav")).toHaveClass("bg-chrome");
  });
});
