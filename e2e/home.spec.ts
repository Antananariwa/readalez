import { expect, test } from "@playwright/test";

test("shows the app name as the page heading", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Readalez" }),
  ).toBeVisible();
});
