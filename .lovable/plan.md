# Remove unused images, catalogs and products

## What was found (first scan)
- Product photos not used anywhere: 5 Pylontech batteries, 2 Hithium Legend, one LiPower 1.6kW photo (~1 MB).
- Unused logos/images: two large old logo files and a duplicate white logo, plus 3 small placeholder product images (~1.3 MB).
- Old download pointers for previous app versions (Windows v1/v2, Android v1/v2) — replaced by the newer versions.
- Official catalogs (Arabic + English, ~90 MB): many are exact duplicates — the same catalog stored once per model (e.g. 16k and 20k copies of one file). Keep one copy per catalog and point all models of that series to it.
- No video files remain in the app.

## Steps
1. Confirm each candidate is truly unused, including file names built in code (catalog names made from model + size), the catalog page list, the desktop/Android update list and the products list. Anything referenced stays.
2. Delete confirmed-unused images, logos and old download pointers (the old download files are removed from online storage too).
3. Merge duplicate catalogs: keep one file per series, update the product list to share it, regenerate the catalog page images list if affected.
4. Remove old products only if they no longer appear in the products list or any catalog (none deleted without being unreferenced).
5. Check the products screen, catalog viewer and quote screen still show every photo and catalog; report the size saved.

## Not touched
Voice clips, fonts, screens in use, current Windows v3 / Android v3 downloads.

## Technical details
- Reference scan: rg over src, electron, android, tools by basename and by name patterns in products-data.ts.
- Duplicates detected by sha256; manifest.json in catalogs/pages updated if a removed PDF had pages.
- Old .asset.json pointers deleted with lovable-assets delete.
