/** Desktop is served from a loopback server; this never changes hosted narration. */
export function isOfflineDesktop() {
  return import.meta.env["VITE_OFFLINE_DESKTOP"] === "true";
}

export type OfflineVoicePhrase = { text: string; key: string; lang: string };

export function matchOfflineVoice(text: string, lang: string, phrases: OfflineVoicePhrase[]) {
  const normalize = (s: string) => s.replace(/[\u064B-\u0652.,،。!?؟]/g, "").replace(/\s+/g, " ").trim();
  const input = normalize(text);
  return phrases
    .filter((p) => p.lang === lang && (input === normalize(p.text) || input.startsWith(`${normalize(p.text)} `)))
    .sort((a, b) => b.text.length - a.text.length)[0]?.key ?? null;
}