import { createServerFn } from "@tanstack/react-start";
import { createHash, timingSafeEqual } from "node:crypto";

function matches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export const verifyAdminPassword = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => ({ password: String(data?.password ?? "") }))
  .handler(async ({ data }) => {
    if (!data.password) return { ok: false as const };
    const expected = process.env["ADMIN_PASSWORD"];
    if (expected) return { ok: matches(data.password, expected) };
    // Offline desktop: Electron injects only a SHA-256 hash from a packaged file.
    const hash = process.env["ADMIN_PASSWORD_SHA256"]?.trim().toLowerCase();
    if (!hash || !/^[0-9a-f]{64}$/.test(hash)) return { ok: false as const };
    const a = createHash("sha256").update(data.password, "utf8").digest();
    return { ok: timingSafeEqual(a, Buffer.from(hash, "hex")) };
  });
