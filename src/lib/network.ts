export const OFFLINE_MESSAGE = "الإنترنت غير متوفر أو تعذر الاتصال؛ لم يتم الإرسال. اتصل بالشبكة ثم حاول مجدداً.";

export async function requireInternet() {
  if (!navigator.onLine) throw new Error(OFFLINE_MESSAGE);
  if (["127.0.0.1", "localhost"].includes(window.location.hostname) && window.location.port !== "8080") {
    try {
      const response = await fetch("/desktop-online", { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(OFFLINE_MESSAGE);
    } catch { throw new Error(OFFLINE_MESSAGE); }
  }
}