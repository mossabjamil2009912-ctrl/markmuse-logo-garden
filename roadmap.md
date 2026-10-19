# Roadmap

## Current request: comprehensive reference-matched TAMKEEN redesign
- [x] Inventory content/API routes and 96 workflow state literals; map seven approved references in screen-review.md.
- [x] Unify reference colors, typography, surfaces and shared controls without changing functional logic.
- [x] Apply reference-based presentation to start, home, projects, catalog categories/list/detail and quote.
- [x] Apply shared presentation to engineering, forms, orders, notifications, account, settings and administration.
- [x] Verify sampled mobile and desktop layouts; preserve the existing offline Electron shell.
- [x] Run all 6 existing regression tests; exercise catalog search/detail/catalog and residential quote flow.
- [x] Record actual verified coverage and Windows status in screen-review.md.
- [ ] Finish exact visual reconciliation and exhaustive review of all workflow states, engineering reports and downloads.
- [ ] Verify saved orders, payment approval and administration with an authorized real account (account access required).
- [ ] Build updated Windows archive and verify it on Windows; existing archive predates this redesign.

## Current request: replacement offline Windows app
- [x] Remove all product videos and video players as requested.
- [x] Remove obsolete online-only desktop distribution.
- [x] Package local app, media and 451 offline female narration clips for Windows.
- [x] Verify offline browsing, product photos and audio playback in all three languages; deliver Windows ZIP.
- [ ] Complete the three fixed narration phrases rejected by the speech service (external recording-service blocker); personalized result narration remains unavailable offline.

- [x] Add interactive cable cross-section selection with mm²/AWG alternatives and live recalculation.
- [x] Add live voltage-drop status badges on SLD cable paths.
- [x] Correct animated day, night, and grid-outage energy-flow scenarios.
- [x] Expand the SLD canvas to 1560px and redistribute drawing elements.
- [x] Verify calculations, build health, and responsive desktop/mobile rendering.

- [x] Catalogs: per-value highlight of shown model (EN + AR official PDFs)
- [x] Home partners strip: real Li-Power logo + each partner links to official site
- [x] Rebuild Arabic official catalogs with accurate engineering translation and correct RTL
- [x] Remove model highlighting from all catalogs (user cancelled it)

## Arabic catalogs polish (rebuild from English layout, tools/catalog-ar)
- [x] Suntech 595W, Suntech 720W, Solis 5-8K (6K + 8K)
- [ ] Solis 12-20K, 29.9-50K, 75-125K
- [ ] Deye 3-6K, 7.6-12K, 14-20K, 29.9-50K, 60-80K
- [ ] Batteries (Pylontech UF5000, Optimus A300, Hithium NeoPower 4) + numbered catalog-*.pdf

- [x] Arabic catalog alignment: Suntech 595 done (tools/catalog-ar/fix595.py)
- [ ] Arabic catalog alignment: remaining catalogs (await user go-ahead)
- [x] Reconnect GitHub API in the new workspace and verify account access.

- [x] Connect GitHub API in new workspace
- [x] Upload approved-only Arabic catalog zips + links

- [x] Offline Windows desktop app + new app icon + offline Arabic voice
- [x] Pylontech AR site: original order, ACTES logo
- [x] Reconnect GitHub API in the new workspace and verify access.
- [x] صور المنتجات بدون خلفية
- [x] شعار رأس صور المنتجات: «عرش الهندسة» باللون الأبيض
- [x] PVsyst: زوايا الميلان مع الأحمال، أول دراسة مجانية بعد 3 دقائق، الدفع عبر جيب وتأكيد الإدارة (بدون اسم الحساب)

- [x] Switch narrator to a female voice (live + offline Arabic clips)
- [x] Remove old manufacturer pages, products, videos, catalogs (Pylontech/Suntech/Hithium/Lipower)
- [ ] English translation batch 1 (home, menus, wizard)

## Current request: inverter detail English verification
- [x] Correct remaining inverter suitability translations and shared summaries.
- [x] Recheck all 11 inverter detail pages, specifications, compatibility, sharing, and available English datasheets (125 kW has no attached datasheet).
- [x] استبدال الهوية بشعار واسم «تمكين للحلول التقنية الذكية»

- [x] تلوين حرف T في شعار تمكين بالأزرق (شاشة البدء وكل المواضع)
- [x] خلفية وترويسة شاشة البدء والشاشة الرئيسية بأزرق/ذهبي شعار تمكين — معتمدة من المستخدم
- [x] ترويسة الشاشة الرئيسية: خلفية أزرق/ذهبي معتمدة + شعار تمكين في الوسط (عربي/إنجليزي/صيني)
- [ ] إعادة بناء حزمة الويندوز الأوفلاين لتشمل الترويسة وخلفيات شاشة البدء الجديدة (الحزمة الحالية Tamkeen-win-v5 أقدم منها)
