/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
