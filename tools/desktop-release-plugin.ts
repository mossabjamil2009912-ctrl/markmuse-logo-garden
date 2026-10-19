import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";

/** Publish a checksum inventory of public files, never server code or secrets. */
export function desktopReleasePlugin(): Plugin {
  return {
    name: "tamkeen-desktop-release",
    apply: "build",
    enforce: "post",
    closeBundle: {
      sequential: true,
      order: "post",
      handler() {
        const roots = ["dist/client", ".output/public", "dist/public", "dist-electron/public"].filter(existsSync);
        const files = new Map<string, { path: string; sha256: string; size: number }>();
        function scan(root: string, relative = "") {
          for (const name of readdirSync(join(root, relative))) {
            const rel = relative ? `${relative}/${name}` : name;
            const full = join(root, rel);
            if (statSync(full).isDirectory()) scan(root, rel);
            else if (!rel.endsWith(".map") && !rel.startsWith(".") && rel !== "desktop-release.json") {
              const bytes = readFileSync(full);
              files.set(`/${rel}`, { path: `/${rel}`, sha256: createHash("sha256").update(bytes).digest("hex"), size: bytes.length });
            }
          }
        }
        scan("public");
        for (const root of roots) scan(root);
        if (![...files.keys()].some((p) => p.startsWith("/assets/"))) return;
        const entries = [...files.values()].sort((a, b) => a.path.localeCompare(b.path));
        const version = createHash("sha256").update(JSON.stringify(entries)).digest("hex");
        for (const root of roots) writeFileSync(join(root, "desktop-release.json"), JSON.stringify({ version, files: entries }));
      },
    },
  };
}