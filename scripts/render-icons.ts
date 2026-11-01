// Renders the PNG app icons in public/ from public/icon.svg with Playwright's
// Chromium, so no image library is needed. Run `npm run icons` after editing the SVG.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const publicDir = new URL("../public/", import.meta.url);
const sizes: Record<string, number> = {
  "icon-192.png": 192,
  "icon-512.png": 512,
  "apple-touch-icon.png": 180,
};

const svg = await readFile(new URL("icon.svg", publicDir), "utf8");
const browser = await chromium.launch();
try {
  for (const [file, size] of Object.entries(sizes)) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
    });
    await page.setContent(
      `<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
    );
    await page.screenshot({ path: fileURLToPath(new URL(file, publicDir)) });
    await page.close();
    console.log(`public/${file} (${size}x${size})`);
  }
} finally {
  await browser.close();
}
