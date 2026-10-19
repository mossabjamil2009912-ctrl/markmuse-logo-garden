/** Short product benefits, without repeating the specification table. */
export function productBenefitNarration(p: { uses?: string[]; suitableFor?: string; features?: string[] }) {
  const clean = (s: string) =>
    (s.replace(/\([^)]*\)/g, "").split(/[،.]/)[0] ?? "")
      .replace(/[\d٠-٩%]+/g, "").replace(/[A-Za-z+\-/]+/g, "")
      .replace(/\s+(حتى|بجهد|بقدرة|بسعة|و)\s*$/g, "").replace(/\s{2,}/g, " ").trim();
  const words = (s: string) => s.split(" ").length;
  const use = (p.uses ?? []).map(clean).find((u) => u.length > 4 && words(u) <= 8) ?? "";
  const feature = (p.features ?? []).filter((f) => !/[\d٠-٩A-Za-z×:]/.test(f.split(/[،.]/)[0] ?? ""))
    .map(clean).find((f) => f.length > 6 && words(f) <= 7) ?? "";
  if (use) return `مناسب لـ ${use}.`;
  return feature ? `من أبرز مزاياه: ${feature}.` : "";
}