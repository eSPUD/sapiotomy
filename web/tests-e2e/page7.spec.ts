import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Page 7 — self-consistency", () => {
  test("predict → interact → observe", async ({ page }) => {
    await page.goto("/p/7");
    // Predict-Observe-Explain: commit a prediction first.
    await page.getByRole("button", { name: /lock in prediction/i }).click();
    // Slider is keyboard operable.
    const slider = page.getByRole("slider", { name: /votes/i });
    await expect(slider).toBeVisible();
    await slider.focus();
    await slider.press("Home"); // jump to 1 vote
    await expect(page.getByText(/majority accuracy at 1 vote/i)).toBeVisible();
    // The accuracy chart is present and labelled for screen readers.
    await expect(
      page.getByRole("img", { name: /majority-vote accuracy versus number of votes/i }),
    ).toBeVisible();
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
