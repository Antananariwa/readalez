import { describe, expect, it } from "vitest";
import { APP_NAME } from "./appName.ts";

describe("APP_NAME", () => {
  it("is Readalez", () => {
    expect(APP_NAME).toBe("Readalez");
  });
});
