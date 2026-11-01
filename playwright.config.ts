import { defineConfig, devices } from "@playwright/test";

const port = 4173;

// Browsers come from the dev container image (ADR 0004, ADR 0005), or from
// `npx playwright install --with-deps --only-shell chromium webkit` in CI.
export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Closest automated stand-in for iPhone Safari; it doesn't replace device checks.
    { name: "webkit-iphone", use: { ...devices["iPhone 16"] } },
  ],
  // Tests run against the production build.
  webServer: {
    command: `npm run build && npm run preview -- --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    // Never reuse a server already on the port: it may serve an old build.
    reuseExistingServer: false,
  },
});
