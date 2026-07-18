import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("M6 — full journey + sandbox + quiz", () => {
  test("traverses all 20 pages 1 → 20 via the next links", async ({ page }) => {
    await page.goto("/p/1");
    for (let n = 2; n <= 20; n++) {
      const link = page.getByRole("link", { name: `Page ${n} →` });
      await link.scrollIntoViewIfNeeded();
      await link.click();
      await expect(page).toHaveURL(new RegExp(`/p/${n}$`));
    }
  });

  test("Page 20: pre-quiz → sandbox → post-quiz reports a learning gain", async ({ page }) => {
    await page.goto("/p/20");
    // Pre-quiz: answer every question (correctly) and submit.
    await answerAll(page);
    await page.getByRole("button", { name: /submit predictions/i }).click();

    // Sandbox now visible: exercise a lever.
    await expect(page.getByRole("heading", { name: /the control panel/i })).toBeVisible();
    await page.getByRole("switch", { name: /chain-of-thought/i }).click();

    // Post-quiz: answer + submit → delta reported.
    await answerAll(page);
    await page.getByRole("button", { name: /submit answers/i }).click();
    await expect(page.getByText(/learning gain/i)).toBeVisible();
  });

  test("Page 20 has no serious/critical accessibility violations", async ({ page }) => {
    await page.goto("/p/20");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious).toEqual([]);
  });
});

// Choose the correct radio for each of the three quiz questions.
async function answerAll(page: import("@playwright/test").Page) {
  await page.getByRole("radio", { name: /About \+17 points again/i }).last().check();
  await page.getByRole("radio", { name: /can pick a correct answer even when it is a minority/i }).last().check();
  await page.getByRole("radio", { name: /Increase accuracy, then decrease it past a peak/i }).last().check();
}
