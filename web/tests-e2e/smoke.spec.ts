import { expect, test } from "@playwright/test";

test.describe("M0 smoke", () => {
  test("app boots and shows the title", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "The Story of Inference-Time Scaling",
    );
  });

  test("progress rail renders on a story page", async ({ page }) => {
    await page.goto("/p/6");
    const rail = page.getByRole("navigation", { name: "Story progress" });
    await expect(rail).toBeVisible();
    // The current page marker (6) is aria-current.
    await expect(page.locator('[aria-current="page"]')).toHaveText("6");
  });

  test("navigation between two stub routes works", async ({ page }) => {
    await page.goto("/p/1");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Think Fast, Think Slow");
    await page.getByRole("link", { name: "Page 2 →" }).click();
    await expect(page).toHaveURL(/\/p\/2$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Two Systems");
  });
});
