// @vitest-environment node
import { createRequire } from "node:module";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { describe, it, expect, vi, afterEach } from "vitest";
const require = createRequire(import.meta.url);
const { syncRelease, savedRelease, validEntry } = require("../../electron/updates.cjs");
afterEach(() => vi.unstubAllGlobals());
describe("persistent desktop updates", () => {
  it("stores updated images and audio for offline restarts and retains the complete version on interrupted updates", async () => {
    const root = await mkdtemp(join(tmpdir(), "tamkeen-update-"));
    const content: Record<string, string> = { "/assets/app.js": "app-v2", "/media/photo.webp": "new-photo", "/audio/voice.mp3": "new-voice" };
    const version = "a".repeat(64);
    const files = Object.entries(content).map(([path, data]) => ({ path, size: Buffer.byteLength(data), sha256: createHash("sha256").update(data).digest("hex") }));
    vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response(url.endsWith("desktop-release.json") ? JSON.stringify({ version, files }) : url.endsWith("/") ? '<script src="/assets/app.js"></script>' : content[new URL(url).pathname])));
    try {
      const dir = await syncRelease(root, "https://example.test");
      expect(await readFile(join(dir, "media/photo.webp"), "utf8")).toBe("new-photo");
      expect(await readFile(join(dir, "audio/voice.mp3"), "utf8")).toBe("new-voice");
      vi.stubGlobal("fetch", vi.fn(async (url: string) => {
        if (url.endsWith("desktop-release.json")) return new Response(JSON.stringify({ version: "b".repeat(64), files: [...files, { path: "/assets/missing.js", sha256: "c".repeat(64), size: 7 }] }));
        throw new Error("offline");
      }));
      await expect(syncRelease(root, "https://example.test")).rejects.toThrow();
      expect(await savedRelease(root)).toBe(dir);
      expect(await readFile(join(dir, "audio/voice.mp3"), "utf8")).toBe("new-voice");
    } finally { await rm(root, { recursive: true, force: true }); }
  });
  it("rejects paths outside the public media and client inventory", () => {
    expect(validEntry({ path: "/assets/../../server/secret", size: 1, sha256: "a".repeat(64) })).toBe(false);
    expect(validEntry({ path: "/server/index.mjs", size: 1, sha256: "a".repeat(64) })).toBe(false);
  });
});