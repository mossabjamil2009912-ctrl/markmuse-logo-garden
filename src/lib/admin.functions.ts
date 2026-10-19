import { createServerFn } from "@tanstack/react-start";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";

// Default admin password hash (SHA-256 only; plaintext never stored). A reset stores a new hash in the database.
export const DEFAULT_ADMIN_HASH = "a7a2ae458dfd820589f0af06418f27885ca30999f1d8fc429286c67c63b38be1";
const RESET_EMAIL = "sufiyangamilali77@gmail.com";
const ROW_ID = "main";

const sha = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");
const eqHex = (a: string, b: string) => {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && timingSafeEqual(x, y);
};

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function currentHash(): Promise<string> {
  try {
    const supabase = await db();
    const { data } = await supabase.from("admin_credentials").select("password_hash").eq("id", ROW_ID).maybeSingle();
    if (data?.password_hash) return data.password_hash;
  } catch {
    // Offline desktop: no database reachable — fall back to packaged hash or default.
  }
  const packaged = process.env["ADMIN_PASSWORD_SHA256"]?.trim().toLowerCase();
  if (packaged && /^[0-9a-f]{64}$/.test(packaged)) return packaged;
  return DEFAULT_ADMIN_HASH;
}

export async function isAdminPassword(password: string): Promise<boolean> {
  if (!password) return false;
  return eqHex(sha(password), await currentHash());
}

export const verifyAdminPassword = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => ({ password: String(data?.password ?? "") }))
  .handler(async ({ data }) => ({ ok: await isAdminPassword(data.password) }));

export const requestAdminReset = createServerFn({ method: "POST" }).handler(async () => {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  if (!lovableKey || !resendKey) return { ok: false as const, error: "خدمة البريد غير مفعّلة بعد" };
  const supabase = await db();
  const { data: row } = await supabase.from("admin_credentials").select("reset_expires_at").eq("id", ROW_ID).maybeSingle();
  // Throttle: one code per 60 seconds.
  if (row?.reset_expires_at && new Date(row.reset_expires_at).getTime() - 9 * 60_000 > Date.now()) {
    return { ok: false as const, error: "انتظر دقيقة قبل طلب رمز جديد" };
  }
  const code = String(randomInt(100000, 1000000));
  const expires = new Date(Date.now() + 10 * 60_000).toISOString();
  const { error: upErr } = await supabase.from("admin_credentials").upsert({
    id: ROW_ID, reset_code_hash: sha(code), reset_expires_at: expires, reset_attempts: 0, updated_at: new Date().toISOString(),
  });
  if (upErr) return { ok: false as const, error: "تعذر إنشاء الرمز" };
  const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": resendKey },
    body: JSON.stringify({
      from: "TAMKEEN <onboarding@resend.dev>",
      to: [RESET_EMAIL],
      subject: "رمز استعادة كلمة مرور الإدارة",
      html: `<div dir="rtl" style="font-family:Arial;padding:20px"><h2>رمز التحقق</h2><p>رمز استعادة كلمة مرور الإدارة:</p><p style="font-size:32px;font-weight:bold;letter-spacing:6px">${code}</p><p>صالح لمدة 10 دقائق.</p></div>`,
    }),
  });
  if (!res.ok) {
    console.error("reset email failed", res.status, await res.text());
    return { ok: false as const, error: "تعذر إرسال البريد" };
  }
  return { ok: true as const };
});

export const confirmAdminReset = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; newPassword: string }) => ({ code: String(d?.code ?? "").trim(), newPassword: String(d?.newPassword ?? "") }))
  .handler(async ({ data }) => {
    if (data.newPassword.length < 6) return { ok: false as const, error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" };
    const supabase = await db();
    const { data: row } = await supabase.from("admin_credentials").select("*").eq("id", ROW_ID).maybeSingle();
    if (!row?.reset_code_hash || !row.reset_expires_at || new Date(row.reset_expires_at).getTime() < Date.now()) {
      return { ok: false as const, error: "الرمز منتهي، اطلب رمزاً جديداً" };
    }
    if (row.reset_attempts >= 5) return { ok: false as const, error: "محاولات كثيرة، اطلب رمزاً جديداً" };
    if (!/^\d{6}$/.test(data.code) || !eqHex(sha(data.code), row.reset_code_hash)) {
      await supabase.from("admin_credentials").update({ reset_attempts: row.reset_attempts + 1 }).eq("id", ROW_ID);
      return { ok: false as const, error: "الرمز غير صحيح" };
    }
    await supabase.from("admin_credentials").update({
      password_hash: sha(data.newPassword), reset_code_hash: null, reset_expires_at: null, reset_attempts: 0, updated_at: new Date().toISOString(),
    }).eq("id", ROW_ID);
    return { ok: true as const };
  });
