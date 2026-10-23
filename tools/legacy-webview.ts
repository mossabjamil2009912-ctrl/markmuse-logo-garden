import type { Plugin } from "vite";

/** Oldest built-in Android browser (WebView/Chrome) the app must start on.
 * Android 10/11 phones without Play updates ship WebView 74–83; modern syntax there causes a blank screen. */
export const LEGACY_BROWSERS = ["chrome74", "safari14", "firefox78", "edge88"];

/** Unwrap cascade layers (Chrome < 99 drops @layer blocks entirely) and add vh fallbacks for dvh/svh/lvh. */
export function flattenLegacyCss(css: string): string {
  let out = "";
  let i = 0;
  while (i < css.length) {
    if (css.startsWith("@layer", i)) {
      let j = i + 6;
      while (j < css.length && css[j] !== "{" && css[j] !== ";") j++;
      if (css[j] === ";") { i = j + 1; continue; }
      // find matching brace
      let depth = 1, k = j + 1, quote = "";
      while (k < css.length && depth > 0) {
        const c = css[k];
        if (quote) { if (c === "\\") k++; else if (c === quote) quote = ""; }
        else if (c === '"' || c === "'") quote = c;
        else if (c === "{") depth++;
        else if (c === "}") depth--;
        k++;
      }
      out += flattenLegacyCss(css.slice(j + 1, k - 1));
      i = k;
      continue;
    }
    out += css[i++];
  }
  return out
    .replace(/([{;])\s*([a-z-]+)\s*:([^;{}]*\b\d*\.?\d+[dsl]vh\b[^;{}]*)(?=[;}])/gi, (_m, sep, prop, value) => {
      const fallback = value.replace(/(\d*\.?\d+)[dsl]vh\b/gi, "$1vh");
      // With var() an unsupported unit only fails at use time and would erase the fallback, so keep vh alone.
      return /var\(/.test(value) || prop.startsWith("--") ? `${sep}${prop}:${fallback}` : `${sep}${prop}:${fallback};${prop}:${value}`;
    })
    // Media range syntax (width>=40rem) needs Chrome 104; rewrite to min-/max- features.
    .replace(/\(\s*(width|height)\s*(>=|<=|>|<)\s*([^)\s]+)\s*\)/g, (_m, feature, op, value) =>
      `(${op[0] === ">" ? "min" : "max"}-${feature}:${op.length === 1 ? `calc(${value} ${op === ">" ? "+" : "-"} .02px)` : value})`,
    );
}

export function legacyWebviewPlugin(): Plugin {
  return {
    name: "tamkeen-legacy-webview",
    enforce: "post",
    config() {
      return { environments: { client: { build: { target: LEGACY_BROWSERS, cssTarget: LEGACY_BROWSERS } } } };
    },
    generateBundle(_options, bundle) {
      if (this.environment?.name && this.environment.name !== "client") return;
      for (const file of Object.values(bundle)) {
        if (file.type === "asset" && file.fileName.endsWith(".css")) {
          const text = typeof file.source === "string" ? file.source : new TextDecoder().decode(file.source);
          file.source = flattenLegacyCss(text);
        }
      }
    },
  };
}
