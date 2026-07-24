import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Page 7 — frequency voting", () => {
  test("predict → interact → observe", async ({ page }) => {
    await page.goto("/p/7");
    // Predict-Observe-Explain: commit a prediction first.
    await page.getByRole("button", { name: /lock in prediction/i }).click();
    // The chamber's two dials appear and are keyboard operable.
    const chains = page.getByRole("slider", { name: /chains sampled/i });
    await expect(chains).toBeVisible();
    await chains.focus();
    await chains.press("Home"); // jump to 1 chain
    const temp = page.getByRole("slider", { name: /temperature/i });
    await expect(temp).toBeVisible();
    // The accuracy chart is present and labelled for screen readers.
    await expect(
      page.getByRole("img", {
        name: /majority-vote accuracy versus number of sampled chains/i,
      }),
    ).toBeVisible();
  });

  test("temperature zero collapses the vote to one opinion", async ({ page }) => {
    await page.goto("/p/7");
    await page.getByRole("button", { name: /lock in prediction/i }).click();
    const temp = page.getByRole("slider", { name: /temperature/i });
    await temp.focus();
    await temp.press("Home");
    await expect(page.getByText(/every chain is the same chain/i)).toBeVisible();
  });

  test("has no serious or critical accessibility violations", async ({ page }) => {
    await page.goto("/p/7");
    await page.getByRole("button", { name: /lock in prediction/i }).click();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious).toEqual([]);
  });
});
