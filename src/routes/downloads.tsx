import { TamkeenBrand } from "@/components/tamkeen-brand";
import windowsAsset from "@/assets/TAMKEEN-Windows-x64-v5.zip.asset.json";
import androidAsset from "@/assets/TAMKEEN-Android-v7.apk.asset.json";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/downloads")({
  head: () => ({
    meta: [
      { title: "تحميل تطبيق TAMKEEN لويندوز" },
      {
        name: "description",
        content: "نسخة TAMKEEN لويندوز مع الصور والكتالوجات المحلية للاستخدام دون إنترنت.",
      },
      { property: "og:title", content: "تحميل تطبيق TAMKEEN لويندوز" },
      {
        property: "og:description",
        content: "نسخة ويندوز بملفات محلية للاستخدام دون إنترنت؛ تم إيقاف النسخة القديمة المتصلة بالموقع.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DownloadsPage,
});

function DownloadsPage() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-background text-foreground flex items-center justify-center p-6"
    >
      <div className="w-full max-w-xl p-8 sm:p-10">
        <div className="flex items-center gap-4 mb-6">
          <TamkeenBrand compact />
          <div>
            <h1 className="text-2xl font-bold">تطبيق TAMKEEN لويندوز</h1>
            <p className="text-sm text-muted-foreground mt-1">نسخة سطح المكتب — 64 بت</p>
          </div>
        </div>

        <ul className="space-y-2 text-sm text-muted-foreground mb-8">
          <li>• تم إيقاف النسخة القديمة التي تحتاج اتصالًا لفتح الموقع.</li>
          <li>• النسخة الجديدة تضم الملفات محليًا وتُسلَّم كملف مستقل.</li>
          <li>• إرسال الطلبات ومراجعة الدفع والتواصل تحتاج اتصالًا بالإنترنت.</li>
        </ul>

        <div className="grid gap-3">
          <a href={windowsAsset.url} download className="rounded-md bg-primary px-4 py-3 text-center font-bold text-primary-foreground">تحميل نسخة ويندوز (v5)</a>
          <a href={androidAsset.url} download="TAMKEEN-Android-v7.apk" className="rounded-md border border-border px-4 py-3 text-center font-bold">تحميل نسخة أندرويد (v7 — 3.7 ميجابايت)</a>
        </div>

        <p className="text-xs text-muted-foreground mt-6 text-center">
          بعد استلام النسخة الجديدة، فُكّ ضغط الملف كاملًا ثم شغّل <span className="font-mono">ArshSmartTech.exe</span>
        </p>
      </div>
    </main>
  );
}
