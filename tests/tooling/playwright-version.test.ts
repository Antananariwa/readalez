// The dev container image bakes in the browsers for one Playwright version
// (PLAYWRIGHT_VERSION in .devcontainer/devcontainer.json). @playwright/test only
// finds them if package.json pins exactly the same version. To bump it, change
// both to the same exact version in one commit, run `npm install` to update the
// lockfile, and ask the owner to rebuild the dev container. Until the rebuild,
// `npm run e2e` can't find the new browsers.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = new URL("../../", import.meta.url);
const readJson = (path: string) =>
  JSON.parse(readFileSync(new URL(path, root), "utf8"));

const pinned: string =
  readJson("package.json").devDependencies["@playwright/test"];
const image: string = readJson(".devcontainer/devcontainer.json").build.args
  .PLAYWRIGHT_VERSION;

describe("Playwright version", () => {
  it("is pinned exactly in package.json", () => {
    expect(pinned).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("matches the browsers baked into the dev container image", () => {
    expect(image).toBe(pinned);
  });
});
