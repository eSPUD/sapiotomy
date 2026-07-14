import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Act 1 (pages 1–5)", () => {
  test("traverses Act 1 in order", async ({ page }) => {
    await page.goto("/p/1");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Two Speeds of Thinking");
    for (let n = 2; n <= 5; n++) {
      await page.getByRole("link", { name: `Page ${n} →` }).click();
      await expect(page).toHaveURL(new RegExp(`/p/${n}$`));
    }
  });

  test("Page 3 predict → reveal chain-of-thought jump", async ({ page }) => {
    await page.goto("/p/3");
    await page.getByRole("button", { name: /lock in prediction/i }).click();
    await expect(page.getByRole("switch", { name: /show your work/i })).toBeVisible();
    await expect(page.getByText(/\+39\.0 points/i)).toBeVisible();
  });

  for (const n of [1, 2, 3, 4, 5]) {
    test(`Page ${n} has no serious/critical accessibility violations`, async ({ page }) => {
      await page.goto(`/p/${n}`);
      if (n === 3) {
        await page.getByRole("button", { name: /lock in prediction/i }).click();
      }
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(serious).toEqual([]);
    });
  }
});
