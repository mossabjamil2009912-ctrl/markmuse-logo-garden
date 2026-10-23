import { describe, expect, it } from "vitest";
import { flattenLegacyCss } from "../../tools/legacy-webview";

// Older Android phones (built-in browser 74–83) must still read the app styles.
describe("legacy Android style conversion", () => {
  it("unwraps cascade layers so old browsers keep the rules", () => {
    expect(flattenLegacyCss("@layer theme,base;@layer base{.a{color:red}}")).toBe(".a{color:red}");
  });
  it("rewrites screen-size rules to min-width/max-width", () => {
    expect(flattenLegacyCss("@media (width>=64rem){.b{display:none}}")).toBe("@media (min-width:64rem){.b{display:none}}");
  });
  it("converts oklch colours to rgb", () => {
    expect(flattenLegacyCss(":root{--w:oklch(1 0 0)}")).toBe(":root{--w:rgb(255,255,255)}");
  });
  it("keeps a vh fallback before dvh", () => {
    expect(flattenLegacyCss(".c{height:100dvh}")).toBe(".c{height:100vh;height:100dvh}");
  });
});
