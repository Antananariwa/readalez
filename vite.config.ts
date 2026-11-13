/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Placeholder colours until the visual style is decided (SPEC.md, Open questions).
const themeColor = "#1f2937";
const backgroundColor = "#ffffff";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Service worker and web app manifest (ADR 0006).
    VitePWA({
      // skipWaiting and clientsClaim stay off, so an update never applies while you
      // read (SPEC.md feature 12); #46 saw a new version wait while the page was open.
      // The page registers the worker itself (src/ui/registerServiceWorker.ts), so
      // workbox-window isn't bundled.
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["icon.svg", "apple-touch-icon.png"],
      workbox: {
        // Workbox's default, plus the built-in books, so they open offline
        // after the first visit (SPEC.md feature 3, ADR 0013). Each is under
        // Workbox's default limit of 2 MiB per file
        // (`maximumFileSizeToCacheInBytes`, in workbox-build's schema).
        globPatterns: ["**/*.{js,wasm,css,html}", "books/*.epub"],
        skipWaiting: false,
        clientsClaim: false,
        navigateFallback: "/index.html",
      },
      manifest: {
        name: "Readalez",
        short_name: "Readalez",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: themeColor,
        background_color: backgroundColor,
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          // Also listed as maskable (ADR 0006).
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  test: {
    // Unit tests run in plain Node, with no DOM emulation, to keep `npm run check` fast.
    environment: "node",
    // Only folders a tsconfig project typechecks, so no test runs unchecked.
    include: [
      "src/core/**/*.test.ts",
      "src/ui/**/*.test.ts",
      "tests/**/*.test.ts",
    ],
  },
});
