import { describe, expect, it, vi, afterEach } from "vitest";
import { requireInternet, OFFLINE_MESSAGE } from "../lib/network";
afterEach(() => vi.unstubAllGlobals());
describe("internet required submissions", () => {
  it("blocks submissions when internet is unavailable", async () => {
    vi.stubGlobal("navigator", { onLine: false });
    await expect(requireInternet()).rejects.toThrow(OFFLINE_MESSAGE);
  });
  it("checks real connectivity instead of trusting the desktop online hint", async () => {
    vi.stubGlobal("navigator", { onLine: true });
    vi.stubGlobal("window", { location: { hostname: "127.0.0.1", port: "41234" } });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 503 })));
    await expect(requireInternet()).rejects.toThrow(OFFLINE_MESSAGE);
  });
});