import { expect, test, type Page } from "@playwright/test";

// The installable shell (issue #5, ADR 0006): manifest, icons, offline reload,
// same-origin requests only, and a service worker that never takes over open pages.

async function waitForServiceWorker(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
}

test("links a manifest that makes the app installable", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const manifestHref = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href");
  expect(manifestHref).toBeTruthy();

  const manifestResponse = await request.get(manifestHref!);
  expect(manifestResponse.ok()).toBe(true);
  const manifest = (await manifestResponse.json()) as {
    name: string;
    short_name: string;
    display: string;
    icons: { src: string; sizes: string; purpose?: string }[];
  };
  expect(manifest.name).toBe("Readalez");
  expect(manifest.short_name).toBe("Readalez");
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.map((icon) => icon.sizes)).toEqual(
    expect.arrayContaining(["192x192", "512x512"]),
  );
  expect(manifest.icons.some((icon) => icon.purpose === "maskable")).toBe(true);

  const appleTouchIcon = await page
    .locator('link[rel="apple-touch-icon"]')
    .getAttribute("href");
  const iconUrls = [...manifest.icons.map((icon) => icon.src), appleTouchIcon!];
  for (const url of iconUrls) {
    const response = await request.get(url);
    expect(response.ok(), url).toBe(true);
    expect(response.headers()["content-type"], url).toMatch(/^image\//);
  }
});

test("reloads with the network off after one visit", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await waitForServiceWorker(page);

  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { level: 1, name: "Readalez" }),
  ).toBeVisible();
});

test("requests only the app's own origin", async ({ page, context }) => {
  const urls: string[] = [];
  context.on("request", (request) => urls.push(request.url()));

  await page.goto("/");
  await waitForServiceWorker(page);
  await page.reload();
  await expect(
    page.getByRole("heading", { level: 1, name: "Readalez" }),
  ).toBeVisible();

  const origin = new URL(page.url()).origin;
  expect(urls.length).toBeGreaterThan(0);
  expect(urls.filter((url) => new URL(url).origin !== origin)).toEqual([]);
});

test("the service worker never skips waiting or claims open pages", async ({
  request,
}) => {
  const worker = await (await request.get("/sw.js")).text();
  // Workbox's prompt mode adds a listener that skips waiting only when a page
  // posts SKIP_WAITING. The app never posts it (tests/tooling/service-worker.test.ts),
  // so a new version still waits for the next launch.
  const promptListener =
    /self\.addEventListener\("message",(\w+)=>\{\1\.data&&"SKIP_WAITING"===\1\.data\.type&&self\.skipWaiting\(\)\}\)/;
  const rest = worker.replace(promptListener, "");

  const runtimeFiles = [...worker.matchAll(/"\.\/(workbox-[\w-]+)"/g)].map(
    (match) => `/${match[1]}.js`,
  );
  expect(runtimeFiles.length).toBeGreaterThan(0);
  const runtimes = await Promise.all(
    runtimeFiles.map(async (file) => (await request.get(file)).text()),
  );

  for (const code of [rest, ...runtimes]) {
    expect(code).not.toMatch(/skipWaiting|clientsClaim|clients\.claim/);
  }
});
