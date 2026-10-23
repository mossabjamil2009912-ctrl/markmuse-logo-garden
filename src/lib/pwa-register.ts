// The only place the offline service worker is registered (published website / Android app only).
// A new version installs (fully cached) in the background, then "tamkeen:update-ready" asks the user.
let waitingWorker: ServiceWorker | null = null;

export function applyOfflineUpdate() {
  const w = waitingWorker;
  if (!w) return false;
  navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), { once: true });
  w.postMessage({ type: "SKIP_WAITING" });
  return true;
}

function announce(w: ServiceWorker) {
  waitingWorker = w;
  window.dispatchEvent(new Event("tamkeen:update-ready"));
}

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
  navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((reg) => {
    const hadController = !!navigator.serviceWorker.controller;
    if (reg.waiting && hadController) announce(reg.waiting);
    reg.addEventListener("updatefound", () => {
      const nw = reg.installing;
      nw?.addEventListener("statechange", () => {
        if (nw.state === "installed" && navigator.serviceWorker.controller) announce(nw);
      });
    });
    reg.update().catch(() => {});
  }).catch(() => {});
}
