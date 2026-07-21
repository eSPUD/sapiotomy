import { expect, test } from "@playwright/test";

test.describe("M0 smoke", () => {
  test("app boots and shows the title", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "The Story of Inference-Time Scaling",
    );
  });

  test("masthead renders the title on a story page", async ({ page }) => {
    await page.goto("/p/6");
    const rail = page.getByRole("navigation", { name: "Story progress" });
    await expect(rail).toBeVisible();
    await expect(
      rail.getByRole("link", { name: "The Story of Inference-Time Scaling" }),
    ).toBeVisible();
  });

  test("scroll progress bar fills as the reader scrolls", async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 500 });
    await page.goto("/p/20");
    const fill = page.locator('nav[aria-label="Story progress"] div.bg-compute');
    await expect(fill).toHaveCSS("width", /.+/);
    const before = await fill.evaluate((el) => (el as HTMLElement).getBoundingClientRect().width);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(250);
    const after = await fill.evaluate((el) => (el as HTMLElement).getBoundingClientRect().width);
    expect(after).toBeGreaterThan(before);
  });

  test("navigation between two stub routes works", async ({ page }) => {
    await page.goto("/p/1");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Think Fast, Think Slow");
    await page.getByRole("link", { name: "Page 2 →" }).click();
    await expect(page).toHaveURL(/\/p\/2$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Two Systems");
  });
});
