import type { PvsystStudyResult } from "./pvsyst-engine";
import {
  LIFETIME_YEARS,
  type CashFlowRow,
  type EconomicsResult,
  type Scenario,
} from "./pvsyst-economics";
const actesLogoPlain = { url: "/media/actes-logo-plain.png" };

/**
 * تقرير دراسة الجدوى الاقتصادية والوفر البيئي — مستند رسمي مستقل بهوية TAMKEEN
 * يحوي المؤشرات المالية، منحنى التدفق النقدي، مقارنة التكلفة المتراكمة،
 * جدول الـ 25 سنة، تحليل السيناريوهات، والأثر البيئي.
 */

function esc(value: unknown) {
  return String(value ?? "").replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
  );
}

const nf = (n: number, d = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

type Equivalents = { oilBarrels: number; carKm: number; trees: number };

export function downloadEconomicReport(
  study: PvsystStudyResult,
  eco: EconomicsResult,
  rows: CashFlowRow[],
  scenarios: Scenario[],
  equiv: Equivalents,
  escalation: number,
) {
  if (typeof window === "undefined") return;

  const logo = window.location.origin + actesLogoPlain.url;
  const now = new Date();
  const dstr = now.toLocaleDateString("en-GB");
  const project = study.customer || "TAMKEEN Project";
  const s = study.system;

  // ==== منحنى التدفق النقدي ====
  const W = 700;
  const H = 230;
  const PAD = { t: 12, r: 12, b: 24, l: 58 };
  const cumVals = rows.map((r) => r.cumulative).concat([-eco.capex, 0]);
  const cMax = Math.max(...cumVals, 1);
  const cMin = Math.min(...cumVals, 0);
  const cx = (i: number) => PAD.l + ((W - PAD.l - PAD.r) * i) / Math.max(1, rows.length);
  const cy = (v: number) => PAD.t + (H - PAD.t - PAD.b) * (1 - (v - cMin) / Math.max(1, cMax - cMin));
  const cashPath = [`M ${cx(0)} ${cy(-eco.capex)}`, ...rows.map((r, i) => `L ${cx(i + 1)} ${cy(r.cumulative)}`)].join(" ");
  const zeroY = cy(0);
  const pbX = eco.paybackYears ? cx(eco.paybackYears) : null;

  const compMax = Math.max(...rows.map((r) => Math.max(r.baselineCumulative, r.solarCumulative)), 1);
  const py = (v: number) => PAD.t + (H - PAD.t - PAD.b) * (1 - v / compMax);
  const basePath = rows.map((r, i) => `${i ? "L" : "M"} ${cx(i + 1)} ${py(r.baselineCumulative)}`).join(" ");
  const solarPath = [`M ${cx(0)} ${py(eco.capex)}`, ...rows.map((r, i) => `L ${cx(i + 1)} ${py(r.solarCumulative)}`)].join(" ");

  const gridLines = (fn: (f: number) => { y: number; label: string }) =>
    [0, 0.25, 0.5, 0.75, 1]
      .map((f) => {
        const g = fn(f);
        return `<line x1="${PAD.l}" y1="${g.y}" x2="${W - PAD.r}" y2="${g.y}" stroke="#b9c0cf" stroke-dasharray="3 3"/>
      <text x="${PAD.l - 6}" y="${g.y + 3}" text-anchor="end" font-size="9" fill="#555">${g.label}</text>`;
      })
      .join("");

  const xTicks = rows
    .filter((r) => r.year % 5 === 0)
    .map((r) => `<text x="${cx(r.year)}" y="${H - 8}" text-anchor="middle" font-size="9" fill="#555">${r.year}</text>`)
    .join("");

  const cashSvg = `<svg viewBox="0 0 ${W} ${H}" width="100%">
    <rect x="${PAD.l}" y="${PAD.t}" width="${W - PAD.l - PAD.r}" height="${H - PAD.t - PAD.b}" fill="#fff" stroke="#b9c0cf"/>
    <defs><linearGradient id="cfg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15803d" stop-opacity=".28"/><stop offset="1" stop-color="#15803d" stop-opacity="0"/></linearGradient></defs>
    <path d="${cashPath} L ${cx(rows.length)} ${zeroY} L ${cx(0)} ${zeroY} Z" fill="url(#cfg)"/>
    ${gridLines((f) => { const v = cMin + (cMax - cMin) * f; return { y: cy(v), label: nf(Math.round(v)) }; })}
    <line x1="${PAD.l}" y1="${zeroY}" x2="${W - PAD.r}" y2="${zeroY}" stroke="#333"/>
    <path d="${cashPath}" fill="none" stroke="#15803d" stroke-width="2.2"/>
    ${pbX !== null ? `<line x1="${pbX}" y1="${PAD.t}" x2="${pbX}" y2="${H - PAD.b}" stroke="#d4a72c" stroke-width="1.6" stroke-dasharray="5 3"/>
      <circle cx="${pbX}" cy="${zeroY}" r="5" fill="#c0392b" stroke="#fff" stroke-width="1.5"/>
      <rect x="${pbX + 6}" y="${PAD.t + 4}" width="150" height="18" rx="9" fill="#c0392b"/>
      <text x="${pbX + 81}" y="${PAD.t + 16.5}" text-anchor="middle" font-size="10" fill="#fff" font-weight="bold">نقطة كسر التعادل: ${nf(eco.paybackYears!, 1)} سنة</text>` : ""}
    ${xTicks}
  </svg>`;

  const compSvg = `<svg viewBox="0 0 ${W} ${H}" width="100%">
    <rect x="${PAD.l}" y="${PAD.t}" width="${W - PAD.l - PAD.r}" height="${H - PAD.t - PAD.b}" fill="#fff" stroke="#b9c0cf"/>
    ${gridLines((f) => ({ y: py(compMax * f), label: nf(Math.round(compMax * f)) }))}
    <path d="${basePath}" fill="none" stroke="#c0392b" stroke-width="2.2"/>
    <path d="${solarPath}" fill="none" stroke="#15803d" stroke-width="2.2"/>
    ${xTicks}
  </svg>`;

  const kpi = (t: string, v: string, c = "") => `<div class="kpi ${c}"><span>${esc(t)}</span><b>${esc(v)}</b></div>`;

  const cashRows = rows
    .map(
      (r) => `<tr>
      <td>${r.year}</td><td>${nf(r.energy)}</td><td>${nf(r.tariff, 3)}</td>
      <td>${nf(r.saving)}</td><td>${nf(r.om)}</td><td>${nf(r.net)}</td>
      <td class="${r.cumulative >= 0 ? "pos" : "neg"}">${nf(r.cumulative)}</td>
    </tr>`,
    )
    .join("");

  const scRows = scenarios
    .map(
      (sc) => `<tr${sc.key === "base" ? ' class="base"' : ""}>
      <td>${esc(sc.label)}</td><td>${esc(sc.note)}</td><td>${nf(sc.tariff, 3)}</td>
      <td>${sc.result ? nf(sc.result.annualSaving) : "—"}</td>
      <td>${sc.result?.paybackYears ? `${nf(sc.result.paybackYears, 1)} y` : "—"}</td>
      <td>${sc.result ? nf(sc.result.lifetimeNet) : "—"}</td>
    </tr>`,
    )
    .join("");

  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8" />
<title>${esc(`دراسة الجدوى الاقتصادية — ${project}`)}</title>
<style>
  *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{margin:0;font-family:"Segoe UI",Tahoma,Arial,sans-serif;color:#111;font-size:9.5pt;background:#fff}
  .page{width:190mm;min-height:270mm;padding:0 0 10mm;margin:0 auto;page-break-after:always}
  .page:last-child{page-break-after:auto}
  .head{display:flex;align-items:center;justify-content:space-between;gap:5mm;border-radius:4mm;padding:6mm 7mm;margin-top:3mm;color:#fff;background:linear-gradient(120deg,#0b1f4d,#3a2a5a 70%,#b3262d);border-bottom:1.6mm solid #d4a72c}
  .head img{width:30mm;background:#fff;border-radius:2mm;padding:1.5mm}
  .head h1{margin:0;font-size:18pt;color:#fff}
  .head p{margin:1.5mm 0 0;font-size:9pt;color:#fff;opacity:.9}
  .head .k{margin:0 0 1mm;color:#d4a72c;font-weight:bold;font-size:9pt;opacity:1}
  h2{margin:7mm 0 2mm;padding:2mm 4mm;border-radius:2.5mm 2.5mm 0 0;background:#0b1f4d;color:#fff;font-size:11pt;border-right:1.2mm solid #d4a72c}
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm}
  .kpi{border:.5pt solid #d5dae4;border-top:1.2mm solid #c0392b;border-radius:3mm;padding:3.5mm;text-align:center;background:#fff}
  .kpi span{display:block;font-size:8pt;color:#667;font-weight:bold}
  .kpi b{display:block;margin-top:1.5mm;font-size:13pt;color:#0b1f4d}
  .kpi.g{border-top-color:#15803d}.kpi.y{border-top-color:#d4a72c}
  .hero{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin-top:5mm}
  .hero .kpi b{font-size:15pt}
  table{width:100%;border-collapse:collapse;font-size:8.2pt}
  th,td{border:.5pt solid #b9c0cf;padding:1.1mm 1.5mm;text-align:center}
  th{background:#dfe4ee;font-size:8pt}
  tr.base{background:#eef3ff;font-weight:bold}
  .pos{color:#15803d;font-weight:bold}.neg{color:#c0392b}
  .legend{text-align:center;font-size:8.5pt;margin-top:1mm}
  .legend b{margin:0 3mm}
  .note{margin-top:4mm;font-size:8pt;line-height:1.8;color:#444;border-top:.5pt solid #b9c0cf;padding-top:2.5mm}
  .foot{margin-top:5mm;font-size:8pt;color:#666;display:flex;justify-content:space-between;border-top:.5pt solid #b9c0cf;padding-top:2mm}
</style></head><body>

<div class="page">
  <div class="head">
    <div><p class="k">الملخص التنفيذي — TAMKEEN</p><h1>دراسة الجدوى الاقتصادية والوفر البيئي</h1>
      <p>المرجع: ${esc(study.reference)} — العميل: ${esc(project)} — الموقع: ${esc(study.city || "—")} — التاريخ: ${dstr}</p></div>
    <img src="${logo}" alt="TAMKEEN" />
  </div>

  <div class="hero">
    ${kpi("فترة الاسترداد", eco.paybackYears ? `${nf(eco.paybackYears, 1)} سنة` : "—", "g")}
    ${kpi("الوفر السنوي", `${nf(eco.annualSaving)} $`, "y")}
    ${kpi("تكلفة الكيلوواط LCOE", eco.lcoe ? `${nf(eco.lcoe, 3)} $/kWh` : "—")}
    ${kpi("العائد ROI", eco.roi !== null ? `${nf(eco.roi)} %` : "—", "g")}
  </div>

  <h2>منحنى التدفق النقدي التراكمي ونقطة كسر التعادل</h2>
  ${cashSvg}
  <div class="legend">المحور الأفقي: السنوات — المحور الرأسي: الرصيد التراكمي بالدولار — تكلفة المنظومة ${nf(eco.capex)} $</div>

  <h2>بيانات المنظومة</h2>
  <div class="kpis">
    ${kpi("قدرة الألواح", s.kwp ? `${nf(s.kwp, 2)} kWp` : "—")}
    ${kpi("قدرة الإنفرتر", s.invTotalKw ? `${nf(s.invTotalKw, 1)} kW` : "—")}
    ${kpi("سعة التخزين", s.batteryKwh ? `${nf(s.batteryKwh, 1)} kWh` : "—")}
    ${kpi("الإنتاج السنوي", `${nf(study.annualEnergy ?? 0)} kWh`)}
  </div>

  <h2>المؤشرات المالية الرئيسية</h2>
  <div class="kpis">
    ${kpi("تكلفة المنظومة", `${nf(eco.capex)} $`)}
    ${kpi("الوفر السنوي", `${nf(eco.annualSaving)} $`)}
    ${kpi("الوفر الشهري", `${nf(eco.monthlySaving)} $`)}
    ${kpi("فترة الاسترداد", eco.paybackYears ? `${nf(eco.paybackYears, 1)} سنة` : "—")}
    ${kpi(`صافي الوفر ${LIFETIME_YEARS} سنة`, `${nf(eco.lifetimeNet)} $`)}
    ${kpi("LCOE", eco.lcoe ? `${nf(eco.lcoe, 3)} $/kWh` : "—")}
    ${kpi("العائد على الاستثمار", eco.roi !== null ? `${nf(eco.roi)} %` : "—")}
    ${kpi("إنتاج العمر التشغيلي", `${nf(eco.lifetimeEnergy)} kWh`)}
  </div>

  <h2>مقارنة التكلفة المتراكمة</h2>
  ${compSvg}
  <div class="legend"><b style="color:#c0392b">■ الديزل والشبكة</b><b style="color:#15803d">■ منظومة TAMKEEN</b></div>

  <div class="foot"><span>TAMKEEN Energy Systems &amp; Solutions</span><span>صفحة 1/2</span></div>
</div>

<div class="page">
  <div class="head">
    <div><h1>جدول التدفق النقدي وتحليل الحساسية</h1>
      <p>المرجع: ${esc(study.reference)} — ${esc(project)}</p></div>
    <img src="${logo}" alt="TAMKEEN" />
  </div>

  <h2>تحليل الحساسية — ثلاثة سيناريوهات</h2>
  <table><thead><tr>
    <th>السيناريو</th><th>الفرضية</th><th>التعرفة $/kWh</th><th>الوفر السنوي $</th><th>الاسترداد</th><th>صافي ${LIFETIME_YEARS} سنة $</th>
  </tr></thead><tbody>${scRows}</tbody></table>

  <h2>جدول التدفق النقدي لـ ${LIFETIME_YEARS} سنة</h2>
  <table><thead><tr>
    <th>السنة</th><th>الإنتاج kWh</th><th>التعرفة $/kWh</th><th>الوفر $</th><th>الصيانة $</th><th>الصافي $</th><th>التراكمي $</th>
  </tr></thead><tbody>${cashRows}</tbody></table>

  <h2>الأثر البيئي والمكافئات</h2>
  <div class="kpis">
    ${kpi("خفض CO₂ سنوياً", `${nf(eco.co2PerYear, 1)} طن`)}
    ${kpi(`خفض CO₂ خلال ${LIFETIME_YEARS} سنة`, `${nf(eco.co2Lifetime, 1)} طن`)}
    ${kpi("الديزل الموفّر", `${nf(eco.dieselLitersPerYear)} لتر/سنة`)}
    ${kpi("تكلفة الديزل المتفاداة", `${nf(eco.dieselCostPerYear)} $/سنة`)}
    ${kpi("مكافئ الأشجار", `${nf(equiv.trees)} شجرة/سنة`)}
    ${kpi("براميل نفط موفّرة", `${nf(equiv.oilBarrels)} برميل/سنة`)}
    ${kpi("كيلومترات عوادم متفاداة", `${nf(equiv.carKm)} كم/سنة`)}
    ${kpi("معامل الانبعاث", "0.75 kgCO₂/kWh")}
  </div>

  <div class="note">
    الفرضيات: عمر تشغيلي ${LIFETIME_YEARS} سنة، تدهور أداء الألواح 0.5% سنوياً، تكلفة تشغيل وصيانة 1% من قيمة المنظومة سنوياً،
    تصاعد تعرفة الطاقة ${nf(escalation * 100, 1)}% سنوياً، معدل خصم 6%، استهلاك مولد الديزل 0.33 لتر لكل كيلوواط ساعة،
    وسعر لتر الديزل ${nf(eco.dieselPrice, 2)} دولار. الأرقام تقديرية أُعدّت بواسطة القسم الهندسي — تمكين للحلول التقنية والهندسية.
  </div>

  <div class="foot"><span>TAMKEEN Energy Systems &amp; Solutions</span><span>صفحة 2/2</span></div>
</div>

<script>window.onload=function(){window.focus();setTimeout(function(){window.print();},350);};</script>
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
}
