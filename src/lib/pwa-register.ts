// The only place the offline service worker is registered (published website / Android app only).
export function registerOfflineApp() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const host = window.location.hostname;
  let inFrame = true;
  try { inFrame = window.self !== window.top; } catch { /* cross-origin frame */ }
  const refused =
    !import.meta.env.PROD ||
    inFrame ||
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "127.0.0.1" ||
    host === "localhost" ||
    /(^|\.)lovableproject(-dev)?\.com$/.test(host) ||
    /(^|\.)beta\.lovable\.dev$/.test(host) ||
    new URLSearchParams(window.location.search).has("sw");
  if (refused) {
    navigator.serviceWorker.getRegistrations().then((regs) =>
      regs.forEach((r) => { if (r.active?.scriptURL.endsWith("/sw.js")) r.unregister(); }),
    ).catch(() => {});
    return;
  }
  navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
}
