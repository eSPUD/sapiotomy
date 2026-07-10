import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for E2E / integration + accessibility smoke tests.
 * Builds and serves the production app, then runs the specs in tests-e2e/.
 */
export default defineConfig({
  testDir: "./tests-e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL: "http://localhost:3210",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Dedicated port to avoid colliding with other locally-running apps.
    command: "npm run build && npx next start -p 3210",
    url: "http://localhost:3210",
    timeout: 180_000,
    reuseExistingServer: false,
  },
});
