import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Startup update card for the offline Windows/Android shells; "not now" only lasts until the next launch. */
export function UpdatePrompt() {
  const [state, setState] = useState<"hidden" | "ask" | "updating" | "failed">("hidden");

  useEffect(() => {
    if (window.location.hostname !== "127.0.0.1") return;
    fetch("/desktop-update-status", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { available?: boolean }) => { if (d.available) setState("ask"); })
      .catch(() => {});
  }, []);

  const update = async () => {
    setState("updating");
    try {
      const res = await fetch("/desktop-update-apply", { method: "POST", cache: "no-store" });
      if (!res.ok) throw new Error();
      window.location.reload();
    } catch { setState("failed"); }
  };

  if (state === "hidden") return null;
  const busy = state === "updating";
  return (
    <div dir="rtl" role="alertdialog" aria-modal="true" aria-labelledby="update-title" className="fixed inset-0 z-[9999] grid place-items-center bg-foreground/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-gold/60 bg-card p-6 text-center shadow-2xl">
        <div className="mx-auto mb-3 grid size-14 place-items-center rounded-full bg-navy text-navy-foreground">
          {busy ? <Loader2 className="size-7 animate-spin" /> : <Download className="size-7" />}
        </div>
        <h2 id="update-title" className="text-lg font-black text-navy">هناك تحديث جديد</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {busy ? "جارٍ تنزيل التحديث وحفظه على جهازك… لا تغلق التطبيق."
            : state === "failed" ? "تعذر التحديث الآن، تأكد من الإنترنت وحاول مجددًا."
            : "سيُحفظ التحديث على جهازك ويعمل بدون إنترنت."}
        </p>
        <div className="mt-5 flex gap-3">
          <Button type="button" onClick={update} disabled={busy} className="flex-1 bg-navy text-navy-foreground hover:bg-navy/90">تحديث</Button>
          <Button type="button" variant="outline" onClick={() => setState("hidden")} disabled={busy} className="flex-1">ليس الآن</Button>
        </div>
      </div>
    </div>
  );
}
