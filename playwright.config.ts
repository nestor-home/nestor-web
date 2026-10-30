import { defineConfig, devices } from "@playwright/test";

/**
 * The built site, in a real browser: `pnpm build && pnpm e2e` (the preview server is started if
 * needed), or `E2E_BASE=http://localhost:4330 pnpm e2e` against a server already running.
 */
const base = process.env.E2E_BASE ?? "http://localhost:4380";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: base, trace: "on-first-retry" },
  projects: [
    { name: "light", use: { ...devices["Desktop Chrome"], colorScheme: "light" } },
    { name: "dark", use: { ...devices["Desktop Chrome"], colorScheme: "dark" } },
  ],
  ...(process.env.E2E_BASE
    ? {}
    : {
        webServer: {
          command: "pnpm astro preview --port 4380 --ignore-lock",
          url: base,
          reuseExistingServer: !process.env.CI,
        },
      }),
});
