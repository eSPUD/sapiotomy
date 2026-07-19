import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function expectAxeClean(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(serious, JSON.stringify(serious.map((v) => v.id))).toEqual([]);
}

/**
 * Drive page 2's blurt ladder through the crack: three asks (each answer types
 * in at ~45ms/char), the prediction gate, then the last rung's wrong verdict
 * (a 500ms beat, typing, then a 700ms beat before the row flips).
 */
async function crackPage2(page: Page) {
  const ask = page.getByRole("button", { name: /ask it/i });
  const rightRows = page.getByText(/✓ instant, right\./);
  for (let k = 1; k <= 3; k++) {
    await ask.click();
    await expect(rightRows).toHaveCount(k, { timeout: 10_000 });
  }
  await expect(page.getByText("Before the last one, a prediction")).toBeVisible();
  await page.getByRole("button", { name: "It cracks" }).click();
  await expect(page.getByText(/✗ wrong\./)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Nothing on the surface changed\./)).toBeVisible();
}

/** Page 4's full arc: flip both tiles, vote, then vote again on the bills. */
async function revealPage4(page: Page) {
  await page.getByRole("button", { name: /seen this one/i }).click();
  await page.getByRole("button", { name: /work it out/i }).click();
  await page
    .getByRole("group", { name: /first vote/i })
    .getByRole("button", { name: /feed the factory/i })
    .click();
  await page
    .getByRole("group", { name: /second vote/i })
    .getByRole("button", { name: /buy more thinking/i })
    .click();
  await expect(page.getByText(/^the marginal dollar moved to thinking\.$/i)).toBeVisible();
}

test.describe("Act 1 (pages 1–5)", () => {
  test("traverses Act 1 in order", async ({ page }) => {
    await page.goto("/p/1");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Think Fast, Think Slow");
    for (let n = 2; n <= 5; n++) {
      await page.getByRole("link", { name: `Page ${n} →` }).click();
      await expect(page).toHaveURL(new RegExp(`/p/${n}$`));
    }
  });

  test("Page 2: the blurt ladder cracks, then the trace catches it", async ({ page }) => {
    await page.goto("/p/2");
    await crackPage2(page);
    await expect(page.getByText(/Off by exactly 10,000/)).toBeVisible();
    // Skip the word-by-word playback and land the final answer + after-section.
    await page.getByRole("button", { name: /jump to end/i }).click();
    await expect(
      page.getByText(/The blurt said 28,793,796\. Six steps of checking caught it\./),
    ).toBeVisible();
    await expect(page.getByText("Honesty note")).toBeVisible();
    await expect(page.getByText(/Next page: match night\./)).toBeVisible();
  });

  test("Page 3: three picks cascade to the two shelves", async ({ page }) => {
    await page.goto("/p/3");
    await page.getByRole("button", { name: "The favorite" }).click();
    await expect(page.getByText("Thinking pays.")).toBeVisible();
    await expect(page.getByText("Breaking, an hour before kickoff")).toBeVisible();
    await page.getByRole("button", { name: "Switch" }).click();
    await expect(page.getByText("Thinking pays again.")).toBeVisible();
    // The injury news strikes the dead form-guide line and swaps in the news.
    await expect(page.locator("s")).toHaveText("full squad fit");
    await expect(page.getByText("star striker out")).toBeVisible();
    await expect(page.getByText("One more question", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "I've got nothing" }).click();
    await expect(page.getByText(/An hour would not help/)).toBeVisible();
    await expect(page.getByText("Familiar", { exact: true })).toBeVisible();
    await expect(page.getByText("Unfamiliar", { exact: true })).toBeVisible();
    await expect(page.getByText(/already in there, or it is nowhere/)).toBeVisible();
  });

  test("Page 4: names hidden until the flip, then the bills land the verdict", async ({ page }) => {
    await page.goto("/p/4");
    // Neither AI word may appear before the tiles are flipped.
    expect(await page.locator("article").innerText()).not.toMatch(/training|inference/i);
    await page.getByRole("button", { name: /seen this one/i }).click();
    await page.getByRole("button", { name: /work it out/i }).click();
    await expect(page.getByText("Training", { exact: true })).toBeVisible();
    await expect(page.getByText("Inference", { exact: true })).toBeVisible();
    await page
      .getByRole("group", { name: /first vote/i })
      .getByRole("button", { name: /feed the factory/i })
      .click();
    await expect(page.getByText(/training burns like building the factory/i)).toBeVisible();
    // Climb all four rungs of the energy ladder.
    const climb = page.getByRole("button", { name: /climb a rung/i });
    for (let i = 0; i < 4; i++) {
      await climb.click();
    }
    await expect(page.getByRole("button", { name: /top of the ladder/i })).toBeDisabled();
    await page
      .getByRole("group", { name: /second vote/i })
      .getByRole("button", { name: /buy more thinking/i })
      .click();
    await expect(page.getByText(/^the marginal dollar moved to thinking\.$/i)).toBeVisible();
    // The three-row strip: three problems, two machines, one line each.
    await expect(page.getByText("thinking's job")).toBeVisible();
    await expect(page.getByText("only thinking arrives in time")).toBeVisible();
    await expect(page.getByText("only the factory puts it in there")).toBeVisible();
  });

  for (const n of [1, 2, 3, 4, 5]) {
    test(`Page ${n} has no serious/critical accessibility violations`, async ({ page }) => {
      await page.goto(`/p/${n}`);
      await expectAxeClean(page);
    });
  }

  test("Page 2 post-crack state has no serious/critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/p/2");
    await crackPage2(page);
    await expectAxeClean(page);
  });

  test("Page 4 post-reveal state has no serious/critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/p/4");
    await revealPage4(page);
    await expectAxeClean(page);
  });
});
