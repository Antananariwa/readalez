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
    // Why WebKit: ADR 0005.
    { name: "webkit-iphone", use: { ...devices["iPhone 16"] } },
    // Android Chrome by emulation, a narrow and a wide phone: ADR 0010.
    { name: "android-small", use: { ...devices["Galaxy S24"] } },
    { name: "android-large", use: { ...devices["Pixel 7"] } },
  ],
  // Tests run against the production build.
  webServer: {
    command: `npm run build && npm run preview -- --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    // Never reuse a server already on the port: it may serve an old build.
    reuseExistingServer: false,
  },
});
