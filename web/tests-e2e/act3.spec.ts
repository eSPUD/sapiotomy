import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Act 3 (pages 15–20)", () => {
  test("Page 15: the scoreboard surfaces the FrontierMath dispute dot by dot", async ({ page }) => {
    await page.goto("/p/15");
    // Opens on GSM8K with the latest score's receipt.
    await expect(page.getByText(/reported in: Anthropic 2024/)).toBeVisible();
    await page.getByRole("button", { name: "FrontierMath", exact: true }).click();
    await page.getByRole("button", { name: /o3 — OpenAI, internal, Dec 2024: 25\.2%/ }).click();
    await expect(page.getByText(/180-problem 2024-11 version/)).toBeVisible();
    await page.getByRole("button", { name: /Epoch AI eval, Apr 2025: 10%/ }).click();
    await expect(page.getByText(/290-problem 2025-02 set/)).toBeVisible();
  });

  test("Page 20: verdict flips between scoring modes at high N", async ({ page }) => {
    await page.goto("/p/20");
    const disks = page.getByRole("slider", { name: /disks/i });
    await disks.focus();
    await disks.press("End"); // N = 12 → collapse under enumeration
    await expect(page.getByText("COLLAPSE", { exact: true })).toBeVisible();
    await page.getByRole("switch", { name: /scoring rule/i }).click();
    await expect(page.getByText("SOLVED", { exact: true })).toBeVisible();
  });

  test("preprint sources are visibly flagged", async ({ page }) => {
    for (const n of [15, 17, 18, 19, 20]) {
      await page.goto(`/p/${n}`);
      await expect(page.getByText("preprint", { exact: true }).first()).toBeVisible();
    }
  });

  for (const n of [15, 16, 17, 18, 19, 20]) {
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
