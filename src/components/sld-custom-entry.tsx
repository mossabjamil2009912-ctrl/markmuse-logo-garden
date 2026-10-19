import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Network } from "lucide-react";
import SldDiagram from "@/components/sld-diagram";
import { FreeStudyNote, StudyPayment } from "@/components/pvsyst-gate";
import { sldAccess } from "@/lib/pvsyst-access";
import type { SldParams } from "@/lib/sld-engine";

type Form = { project: string; city: string; nPan: string; wp: string; nStr: string; nInv: string; invKw: string; nBat: string; batKwh: string; phase3: boolean };

const num = (v: string) => { const n = Number(String(v).replace(/[^\d.]/g, "")); return Number.isFinite(n) && n > 0 ? n : 0; };

/** اسم العميل المسجّل في الجهاز (عند غياب الاسم من الجلسة). */
export function savedClientName(): string {
  try { return String(JSON.parse(localStorage.getItem("actes.client") || "{}").name || ""); } catch { return ""; }
}

/** يحوّل بيانات العميل إلى معاملات المخطط. البطاريات اختيارية. */
export function buildCustomSldParams(f: Form, customer: string): SldParams {
  const nPan = num(f.nPan), wp = num(f.wp), nStr = Math.max(1, num(f.nStr) || 1);
  const nInv = Math.max(1, num(f.nInv) || 1), invKw = num(f.invKw);
  const nBat = num(f.nBat), batKwh = num(f.batKwh);
  const hasBat = nBat > 0 && batKwh > 0;
  return {
    panel: { model: `PV Module ${wp} Wp`, wp },
    inv: { model: `${hasBat ? "Hybrid" : "Grid-Tie"} Inverter ${invKw} kW`, kwac: invKw },
    ...(hasBat ? { bat: { model: `Battery ${batKwh} kWh`, kwh: batKwh } } : {}),
    nPan, nStr, perStr: Math.round(nPan / nStr), nInv, nBat: hasBat ? nBat : 0,
    kWp: (nPan * wp) / 1000, phase3: f.phase3 || invKw * nInv > 12,
    sysMode: hasBat ? "hybrid" : "ongrid",
    ...(customer || savedClientName() ? { customer_name: customer || savedClientName() } : {}), ...(f.project ? { project: f.project } : {}), ...(f.city ? { city_en: f.city } : {}),
    ref: `ACT-SLD-${Date.now().toString().slice(-6)}`, date: new Date().toISOString().slice(0, 10),
  };
}

export function SldCustomEntry({ customer, city, onDone }: { customer: string; city: string; onDone?: () => void }) {
  const access = sldAccess.useAccess();
  const [f, setF] = useState<Form>({ project: "", city, nPan: "", wp: "", nStr: "", nInv: "1", invKw: "", nBat: "", batKwh: "", phase3: false });
  const [params, setParams] = useState<SldParams | null>(null);
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: k === "phase3" ? e.target.checked : e.target.value });

  if (params) return <SldDiagram params={params as Record<string, unknown>} number={params.ref} />;
  if (access.kind === "pay" || access.kind === "review") return <StudyPayment kind="sld" status={access} customer={customer} city={city} />;

  const valid = num(f.nPan) > 0 && num(f.wp) > 0 && num(f.invKw) > 0 && num(f.nStr) > 0 && num(f.nStr) <= num(f.nPan);
  const field = (k: keyof Form, label: string, hint?: string) => (
    <label className="flex flex-col gap-1 text-xs font-bold">
      {label}
      <input inputMode={hint ? "decimal" : "text"} value={String(f[k])} onChange={set(k)} placeholder={hint} className="rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold" />
    </label>
  );
  const generate = () => {
    if (!valid) return;
    const p = buildCustomSldParams(f, customer);
    // "waiting" تعني أن المخطط المجاني لم يُستهلك بعد فترة الانتظار — نعتبره مستخدماً ونمنع الثاني
    if (access.kind === "waiting" || !sldAccess.startStudy(p.ref || "SLD", p)) return;
    sldAccess.markOpened();
    setParams(p);
    onDone?.();
  };

  return (
    <div className="space-y-4">
      {access.kind === "free" && <FreeStudyNote kind="sld" />}
      {access.kind === "waiting" && <p className="rounded-lg border border-border bg-muted px-3 py-2 text-xs font-bold">استخدمت المخطط المجاني — يمكنك طلب مخطط جديد بعد دقائق.</p>}
      <section className="space-y-2"><p className="text-sm font-black">الألواح الشمسية</p>
        <div className="grid grid-cols-3 gap-2">{field("nPan", "عدد الألواح", "24")}{field("wp", "قدرة اللوح (W)", "635")}{field("nStr", "عدد المجموعات", "2")}</div></section>
      <section className="space-y-2"><p className="text-sm font-black">الإنفرترات</p>
        <div className="grid grid-cols-2 gap-2">{field("nInv", "عدد الإنفرترات", "1")}{field("invKw", "قدرة الإنفرتر (kW)", "12")}</div>
        <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={f.phase3} onChange={set("phase3")} /> ثلاثي الطور (3 فاز)</label></section>
      <section className="space-y-2"><p className="text-sm font-black">البطاريات <span className="text-muted-foreground">(اختياري)</span></p>
        <div className="grid grid-cols-2 gap-2">{field("nBat", "عدد البطاريات", "0")}{field("batKwh", "سعة البطارية (kWh)", "5")}</div></section>
      <section className="grid grid-cols-2 gap-2">{field("project", "اسم المشروع")}{field("city", "المدينة")}</section>
      <Button variant="presentation" size="presentation" type="button" disabled={!valid || access.kind === "waiting"} onClick={generate} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
        <Network className="size-4" /> إنشاء المخطط
      </Button>
    </div>
  );
}
