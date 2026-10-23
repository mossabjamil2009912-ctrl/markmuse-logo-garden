// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";
import { desktopReleasePlugin } from "./tools/desktop-release-plugin";
import { legacyWebviewPlugin } from "./tools/legacy-webview";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      legacyWebviewPlugin(),
      desktopReleasePlugin(),
      VitePWA({
        strategies: "generateSW",
        registerType: "prompt",
        injectRegister: null,
        manifest: false,
        devOptions: { enabled: false },
        filename: "sw.js",
        outDir: "dist/client",
        workbox: {
          globPatterns: ["assets/**/*.{js,css,woff2,webp,png,svg}", "fonts/**/*", "polyfills.js", "*.png", "manifest.webmanifest"],
          globIgnores: ["**/*.pdf", "**/*.apk", "**/*.zip"],
          maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
          navigateFallback: null,
          cleanupOutdatedCaches: true,
          clientsClaim: false,
          skipWaiting: false,
          runtimeCaching: [
            {
              urlPattern: ({ request, url }) => request.mode === "navigate" && !url.pathname.startsWith("/~oauth"),
              handler: "NetworkFirst",
              options: { cacheName: "tamkeen-pages", networkTimeoutSeconds: 4 },
            },
            {
              urlPattern: ({ url, sameOrigin }) =>
                sameOrigin && /^\/(audio|catalogs\/pages|media|brand|fonts|videos)\//.test(url.pathname),
              handler: "CacheFirst",
              options: { cacheName: "tamkeen-media", expiration: { maxEntries: 2000 } },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        // qrcode's node entry pulls fs/pngjs and triggers createRequire(import.meta.url)
        // which crashes the Cloudflare worker at boot (import.meta.url is undefined there).
        qrcode: `${process.cwd()}/node_modules/qrcode/lib/browser.js`,
      },
    },
  },
});
