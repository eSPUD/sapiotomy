import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Act 3 is pages 12 to 15. The 2026-08-10 cut removed the scoreboard,
 * economics, faithfulness and frontier pages, made old 17 ("When Reasoning
 * Breaks") 15 and added a wrap-up as 16; the 2026-11-04 merge of 13 and 14
 * moved both down one, to 14 and 15. The FrontierMath courtroom test that used
 * to lead this file went with its page.
 */
test.describe("Act 3 (pages 12–15)", () => {
  test("Page 14 turns the dial over, then hands forward", async ({ page }) => {
    await page.goto("/p/14");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("When Reasoning Breaks");
    await expect(page.getByText(/For thirteen pages the dial has mostly pointed one way/)).toBeVisible();
    await expect(page.getByRole("link", { name: /^Page 15 →/ })).toBeVisible();
  });

  test("Page 15 closes the deck: one axis, ten questions, scrambled options", async ({ page }) => {
    await page.goto("/p/15");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Wrap-Up");
    await expect(page.getByRole("group", { name: /of 10/ })).toHaveCount(10);

    // The check grades as it goes: answering one question resolves it in place.
    const first = page.getByRole("group", { name: /^1 of 10/ });
    await first.getByRole("radio").first().check();
    await expect(first.getByText(/Right\.|Not quite\./)).toBeVisible();

    // The story's last page: the next page is the glossary appendix, page 16.
    await expect(page.getByRole("link", { name: "Page 16 →" })).toHaveAttribute("href", "/p/16");
  });

  /**
   * The options are re-scrambled on every load. This is the one assertion that
   * needs a real browser: jsdom can confirm the effect runs, but only a genuine
   * reload sequence shows that a reader who refreshes gets a different order.
   *
   * Reloading a handful of times and requiring the order to change at least once
   * keeps it from being flaky: four options have 24 orders, so ten independent
   * loads all landing on the authored one is not something that happens.
   */
  test("Page 15 re-scrambles the quiz options on every load", async ({ page }) => {
    const readFirstQuestion = async () => {
      await page.goto("/p/15");
      const first = page.getByRole("group", { name: /^1 of 10/ });
      await expect(first).toBeVisible();
      return (await first.getByRole("radio").all()).length > 0
        ? (await first.locator("label").allInnerTexts()).join("|")
        : "";
    };
    const seen = new Set<string>();
    for (let i = 0; i < 10; i++) seen.add(await readFirstQuestion());
    expect(seen.size).toBeGreaterThan(1);
  });

  test("references carry no preprint tag", async ({ page }) => {
    for (const n of [15, 16]) {
      await page.goto(`/p/${n}`);
      await expect(page.getByText("preprint", { exact: true })).toHaveCount(0);
    }
  });

  for (const n of [15, 16]) {
    test(`Page ${n} has no serious/critical accessibility violations`, async ({ page }) => {
      await page.goto(`/p/${n}`);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(serious).toEqual([]);
    });
  }
});
