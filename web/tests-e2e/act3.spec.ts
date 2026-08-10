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

  test("Page 16 closes the deck: one axis, twelve questions, two open items", async ({ page }) => {
    await page.goto("/p/16");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Wrap-Up");
    await expect(page.getByRole("group", { name: /of 12/ })).toHaveCount(12);

    // The check grades as it goes: answering one question resolves it in place.
    const first = page.getByRole("group", { name: /^1 of 12/ });
    await first.getByRole("radio").first().check();
    await expect(first.getByText(/Right\.|Not quite\./)).toBeVisible();

    // Last page: PageNav offers no next link. `exact` matters here: two of the
    // quiz options open with "The end of..." and Playwright's default text
    // match is a case-insensitive substring.
    await expect(page.getByRole("link", { name: /^Page 17 →/ })).toHaveCount(0);
    await expect(page.getByText("The End", { exact: true })).toBeVisible();
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
