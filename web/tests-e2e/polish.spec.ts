import AxeBuilder from "@axe-core/playwright";
import { expect, test, devices } from "@playwright/test";

const ALL = ["/", ...Array.from({ length: 20 }, (_, i) => `/p/${i + 1}`)];

test.describe("M7 polish — accessibility across every page", () => {
  for (const path of ALL) {
    test(`${path}: axe clean (no serious/critical)`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(serious, JSON.stringify(serious.map((v) => v.id))).toEqual([]);
    });
  }
});

test.describe("M7 polish — no console errors", () => {
  for (const path of ["/", "/p/6", "/p/12", "/p/16", "/p/19", "/p/20"]) {
    test(`${path}: no console errors on load`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      expect(errors).toEqual([]);
    });
  }
});

test.describe("M7 polish — mobile viewport", () => {
  test.use({ viewport: devices["Pixel 5"].viewport });
  test("story pages render and remain navigable on a narrow screen", async ({ page }) => {
    await page.goto("/p/6");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // The narrative + simulation stack (single column) — the sim controls are reachable.
    await page.getByRole("button", { name: /lock in prediction/i }).click();
    await expect(page.getByRole("slider", { name: /votes/i })).toBeVisible();
  });
});

test.describe("M7 polish — reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("respects prefers-reduced-motion without breaking content", async ({ page }) => {
    await page.goto("/p/4");
    await page.getByRole("button", { name: /seen this one/i }).click();
    await page.getByRole("button", { name: /work it out/i }).click();
    // The tiles flip instantly; both machine names are on screen.
    await expect(page.getByText("Training", { exact: true })).toBeVisible();
    await expect(page.getByText("Inference", { exact: true })).toBeVisible();
  });
});
