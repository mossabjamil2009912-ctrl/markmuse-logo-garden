import type { SldModel } from "./sld-engine";
import type { CableCalc } from "./sld-annotations";
const logoAsset = { url: "/media/actes-logo-sld.png" };

/**
 * يصدّر المخطط الأحادي كلوحة هندسية رسمية A4 عرضية:
 * إطار الرسم + كتلة بيانات اللوحة (Title Block) بشعار تمكين للحلول التقنية والهندسية + جدول الكابلات
 * وحصر الأصناف والملاحظات. يعتمد على نفس الرسم الظاهر في الشاشة.
 */
const LOGO = (typeof window !== "undefined" ? window.location.origin : "") + logoAsset.url;

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** يقرأ الرسم المتجهي المعروض حالياً في الشاشة. */
function currentSvg(): string {
  if (typeof document === "undefined") return "";
  const el = document.querySelector('svg[aria-label="Single Line Diagram"]');
  if (!el) return "";
  const clone = el.cloneNode(true) as SVGElement;
  clone.removeAttribute("style");
  clone.setAttribute("width", "100%");
  clone.setAttribute("height", "auto");
  return clone.outerHTML;
}

export function downloadSldSheet(
  m: SldModel,
  number?: string,
  calcs?: CableCalc[] | undefined,
): void {
  const drawing = currentSvg();
  const ref = number || m.title.ref || "—";
  const t = m.title;

  const titleBlock = (page: string) => `
  <div class="tb">
    <div class="tb-logo"><img src="${LOGO}" alt="TAMKEEN"/><span>TAMKEEN SMART TECH SOLUTIONS</span></div>
    <table class="tb-grid">
      <tr><th>PROJECT</th><td colspan="3">${esc(t.project)}</td></tr>
      <tr><th>CLIENT</th><td>${esc(t.customer || "—")}</td><th>LOCATION</th><td>${esc(t.city || "—")}</td></tr>
      <tr><th>SYSTEM</th><td>${esc(t.system)}</td><th>SUPPLY</th><td>${esc(t.phase)}</td></tr>
      <tr><th>DRAWING</th><td>SINGLE LINE DIAGRAM</td><th>DRAWING No.</th><td>${esc(ref)}</td></tr>
      <tr><th>DESIGNED BY</th><td>${esc(t.designer)}</td><th>DATE</th><td>${esc(t.date)}</td></tr>
      <tr><th>REV</th><td>01</td><th>SHEET</th><td>${esc(page)}</td></tr>
    </table>
  </div>`;

  const calcOf = (tag: string) => calcs?.find((c) => c.tag === tag);
  const anyCustom = Boolean(calcs?.some((c) => c.custom || c.customArea));

  const cables = m.cables.length
    ? `<table class="dt">
        <thead><tr><th>TAG</th><th>ROUTE</th><th>CABLE / CONDUCTOR</th><th style="width:16mm">LENGTH</th><th style="width:16mm">V-DROP</th></tr></thead>
        <tbody>${m.cables
          .map((c) => {
            const k = calcOf(c.tag);
            const len = k ? `${k.length} m${k.custom ? " *" : ""}` : "—";
            const dv = k && k.dropPct !== null ? `${k.dropPct}%` : "—";
            const warn =
              k && k.dropPct !== null && k.dropPct > 3
                ? ' style="color:#b4231f;font-weight:700"'
                : "";
            return `<tr><td class="c b">${esc(c.tag)}</td><td>${esc(c.route)}</td><td>${esc(k?.spec || c.spec)}${k?.awg ? ` — ${esc(k.awg)}` : ""}</td><td class="c">${esc(len)}</td><td class="c"${warn}>${esc(dv)}</td></tr>`;
          })
          .join("")}</tbody>
       </table>
       <p style="font-size:7pt;margin:1.5mm 0 0">${
         anyCustom
           ? "* Length measured on site and entered by the designer. Voltage drop limit 3% (IEC)."
           : "Lengths are typical design values pending site survey. Voltage drop limit 3% (IEC)."
       }</p>`
    : "";

  const bom = m.bom.length
    ? `<table class="dt">
        <thead><tr><th style="width:8mm">#</th><th>SYSTEM ITEM — أصناف المنظومة</th><th style="width:26mm">QTY</th></tr></thead>
        <tbody>${m.bom
          .map(
            (r, i) =>
              `<tr><td class="c">${i + 1}</td><td dir="rtl">${esc(r.name)}</td><td class="c b">${esc(r.qty)} ${esc(r.unit)}</td></tr>`,
          )
          .join("")}</tbody>
       </table>`
    : "";

  const notes = m.notes.length
    ? `<ul class="notes">${m.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>`
    : "";

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<title>TAMKEEN — Single Line Diagram ${esc(ref)}</title>
<style>
  @page{size:A4 landscape;margin:8mm}
  *{box-sizing:border-box}
  body{margin:0;font-family:'Segoe UI',Tahoma,sans-serif;color:#111;background:#fff;font-size:9pt}
  .sheet{position:relative;width:281mm;min-height:194mm;border:1.2pt solid #111;padding:4mm;margin:0 auto;page-break-after:always;display:flex;flex-direction:column}
  .sheet:last-child{page-break-after:auto}
  .hd{display:flex;align-items:center;justify-content:space-between;border-bottom:.8pt solid #111;padding-bottom:2mm}
  .hd h1{margin:0;font-size:12pt;letter-spacing:.5px}
  .hd .r{font-size:8pt;text-align:right;line-height:1.5}
  .draw{flex:1;padding:3mm 0;display:flex;align-items:flex-start}
  .draw svg{width:100%;height:auto}
  .legend{display:flex;gap:6mm;font-size:7.5pt;border-top:.5pt solid #111;padding-top:1.5mm}
  .legend span{display:flex;align-items:center;gap:1.5mm}
  .sw{width:9mm;height:0;border-top:2pt solid #000}
  .tb{margin-top:2mm;border:.8pt solid #111;display:flex}
  .tb-logo{width:52mm;border-right:.8pt solid #111;padding:2mm;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1mm}
  .tb-logo img{width:38mm}
  .tb-logo span{font-size:6.2pt;font-weight:700;text-align:center;letter-spacing:.3px}
  .tb-grid{flex:1;border-collapse:collapse;font-size:7.4pt}
  .tb-grid th{background:#eef2f7;border:.5pt solid #111;padding:.9mm 1.5mm;text-align:left;width:22mm;white-space:nowrap}
  .tb-grid td{border:.5pt solid #111;padding:.9mm 1.5mm;font-weight:700}
  .cols{display:flex;gap:5mm;align-items:flex-start}
  .cols>div{flex:1}
  h2{font-size:9.5pt;margin:0 0 1.5mm;border-bottom:.5pt solid #111;padding-bottom:.8mm}
  .dt{width:100%;border-collapse:collapse;font-size:7.6pt}
  .dt th{background:#eef2f7;border:.5pt solid #111;padding:1mm;text-align:left}
  .dt td{border:.5pt solid #111;padding:.9mm 1mm}
  .dt .c{text-align:center}
  .dt .b{font-weight:700}
  .notes{margin:2mm 0 0;padding-inline-start:5mm;font-size:7.6pt;line-height:1.6}
  *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .bn{display:flex;align-items:center;justify-content:space-between;gap:4mm;padding:3mm 4mm;border-radius:2mm;color:#fff;background:linear-gradient(120deg,#0b1f45 0%,#13306a 65%,#b4231f 100%);border-bottom:1.2mm solid #c9a24a}
  .bn small{color:#e7c873;font-weight:700;font-size:7pt;letter-spacing:.5px}
  .bn h1{margin:.5mm 0 0;font-size:12pt}
  .bn .r{font-size:7.6pt;text-align:right;line-height:1.5}
  .kp{display:grid;grid-template-columns:repeat(4,1fr);gap:2.5mm;margin-top:2mm}
  .kp div{border:.5pt solid #d5dbe6;border-top:.9mm solid #b4231f;border-radius:1.5mm;padding:1.3mm 2.5mm;display:flex;flex-direction:column}
  .kp span{font-size:6.5pt;color:#55607a;font-weight:700}
  .kp b{font-size:11pt;color:#0b1f45}
  .kp i{font-style:normal;font-size:6.5pt;color:#6b7280}
</style></head><body>

<div class="sheet">
  <div class="bn">
    <div><small>TAMKEEN — Single Line Diagram</small><h1>SINGLE LINE DIAGRAM — ${esc(t.system)}</h1></div>
    <div class="r"><b>${esc(t.project)}</b><br/>${esc(t.customer || "")} ${t.city ? "— " + esc(t.city) : ""}<br/>Drawing No. ${esc(ref)} — ${esc(t.date)}</div>
  </div>
  <div class="kp">
    <div><span>PV ARRAY</span><b>${m.pv ? `${m.pv.kwp.toFixed(2)} kWp` : "—"}</b><i>${m.pv ? `${m.pv.strings} × ${m.pv.perString} modules` : ""}</i></div>
    <div><span>INVERTER</span><b>${m.inverter ? `${m.inverter.qty} × ${m.inverter.kw} kW` : "—"}</b><i>${m.inverter ? (m.inverter.phase3 ? "Three phase 400 V" : "Single phase 230 V") : ""}</i></div>
    <div><span>STRING Voc / Isc</span><b>${m.pv?.strVoc ? `${Math.round(m.pv.strVoc)} V` : "—"}</b><i>${m.pv?.isc ? `Isc ${m.pv.isc} A` : ""}</i></div>
    <div><span>AC PROTECTION</span><b>${m.acBox ? `${m.acBox.breakerA} A` : "—"}</b><i>${m.battery ? `Battery ${m.battery.totalKwh} kWh` : ""}</i></div>
  </div>
  <div class="draw">${drawing || '<p style="font-size:9pt">Diagram unavailable.</p>'}</div>
  <div class="legend">
    <span><i class="sw" style="border-color:#b4231f"></i> DC circuit</span>
    <span><i class="sw" style="border-color:#0f3f9e"></i> AC circuit</span>
    <span><i class="sw" style="border-color:#1a8a2a;border-top-style:dashed"></i> Earth / bonding</span>
    <span>Symbols to IEC 60617 — drawn to the client's supplied system items only.</span>
  </div>
  ${titleBlock("1 / 2")}
</div>

<div class="sheet">
  <div class="hd">
    <h1>CABLE SCHEDULE &amp; SYSTEM ITEMS</h1>
    <div class="r"><b>${esc(t.project)}</b><br/>Drawing No. ${esc(ref)}</div>
  </div>
  <div class="draw" style="display:block">
    <div class="cols">
      <div><h2>Cable schedule</h2>${cables}</div>
      <div><h2>System items</h2>${bom}</div>
    </div>
    <h2 style="margin-top:4mm">Engineering notes</h2>
    ${notes}
  </div>
  ${titleBlock("2 / 2")}
</div>

<script>window.onload=function(){setTimeout(function(){window.print()},350)}</script>
</body></html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}
