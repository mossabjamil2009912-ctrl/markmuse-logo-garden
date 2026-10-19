import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("admin reset delivery", () => {
  it("sends recovery codes to the approved lowercase recipient", () => {
    const source = readFileSync(new URL("../lib/admin.functions.ts", import.meta.url), "utf8");
    const recipient = source.match(/const RESET_EMAIL = "([^"]+)"/)?.[1];
    expect(recipient).toBe("sufiyangamilali77@gmail.com");
  });
});