import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Act 3 is pages 12 to 16 since the 2026-08-10 cut. The scoreboard, economics,
 * faithfulness and frontier pages were removed; old 17 ("When Reasoning
 * Breaks") became 15, and a wrap-up was written as 16 to close the deck. The
 * FrontierMath courtroom test that used to lead this file went with its page.
 */
test.describe("Act 3 (pages 12–16)", () => {
  test("Page 15 turns the dial over, then hands forward", async ({ page }) => {
    await page.goto("/p/15");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("When Reasoning Breaks");
    await expect(page.getByText(/For fourteen pages the dial has mostly pointed one way/)).toBeVisible();
    await expect(page.getByRole("link", { name: /^Page 16 →/ })).toBeVisible();
  });

  test("Page 16 closes the deck: one axis, ten questions, scrambled options", async ({ page }) => {
    await page.goto("/p/16");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Wrap-Up");
    await expect(page.getByRole("group", { name: /of 10/ })).toHaveCount(10);

    // The check grades as it goes: answering one question resolves it in place.
    const first = page.getByRole("group", { name: /^1 of 10/ });
    await first.getByRole("radio").first().check();
    await expect(first.getByText(/Right\.|Not quite\./)).toBeVisible();

    // Last page: PageNav offers no next link. `exact` matters here: two of the
    // quiz options open with "The end of..." and Playwright's default text
    // match is a case-insensitive substring.
    await expect(page.getByRole("link", { name: /^Page 17 →/ })).toHaveCount(0);
    await expect(page.getByText("The End", { exact: true })).toBeVisible();
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
  test("Page 16 re-scrambles the quiz options on every load", async ({ page }) => {
    const readFirstQuestion = async () => {
      await page.goto("/p/16");
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

  test("preprint sources are visibly flagged", async ({ page }) => {
    for (const n of [15]) {
      await page.goto(`/p/${n}`);
      await expect(page.getByText("preprint", { exact: true }).first()).toBeVisible();
    }
    // Page 16 draws only the deck's own runs, so it carries no preprint chip.
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
