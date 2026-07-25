import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Page 7 — frequency voting", () => {
  test("the chamber and curve are live before any prediction", async ({ page }) => {
    await page.goto("/p/7");
    // No gate: the interactive is usable from first paint. An earlier build hid
    // everything behind the PredictBar and swapped the whole page on commit.
    const chains = page.getByRole("slider", { name: /chains sampled/i });
    await expect(chains).toBeVisible();
    await chains.focus();
    await chains.press("Home"); // jump to 1 chain
    const temp = page.getByRole("slider", { name: /temperature/i });
    await expect(temp).toBeVisible();
    await expect(
      page.getByRole("img", {
        name: /majority-vote accuracy versus number of sampled chains/i,
      }),
    ).toBeVisible();
    // The prediction is offered alongside, not in front of, the data.
    await expect(page.getByRole("button", { name: /lock in prediction/i })).toBeVisible();
  });

  test("committing a prediction swaps only the strip, not the page", async ({ page }) => {
    await page.goto("/p/7");
    const chains = page.getByRole("slider", { name: /chains sampled/i });
    await expect(chains).toBeVisible();
    await page.getByRole("button", { name: /lock in prediction/i }).click();
    // Same controls still mounted and usable — nothing was replaced.
    await expect(chains).toBeVisible();
    await expect(page.getByRole("slider", { name: /temperature/i })).toBeVisible();
    await expect(
      page.getByRole("img", {
        name: /majority-vote accuracy versus number of sampled chains/i,
      }),
    ).toBeVisible();
    // Only the predict strip changed.
    await expect(page.getByText(/it is the dashed line on the curve/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /lock in prediction/i })).toHaveCount(0);
  });

  test("temperature zero collapses the vote to one opinion", async ({ page }) => {
    await page.goto("/p/7");
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
