# Make the app smaller (target ~40 MB instead of ~100 MB)

## Where the size is now
```text
Catalog PDF files (English + Arabic)   ~56 MB
Voice clips                            ~26 MB
Catalog page pictures (what you see)   ~12 MB
Product photos + brand                 ~9 MB
```
The catalog viewer already shows the page pictures, so the PDF files are mostly duplicate copies of the same pages.

## Steps
1. **Keep PDFs out of the installed app:** the viewer keeps showing the page pictures with no internet. Only the "download PDF / share PDF" button fetches the PDF from the internet (shows "internet not available" offline, like other online actions). Saves ~56 MB.
2. **Compress voice clips:** re-save them as small mono speech quality (voice stays clear). Saves ~15 MB.
3. **Compress product photos** that are larger than needed for the screen. Saves ~3-5 MB.
4. Check that catalogs open offline, voice plays, and photos look sharp; report the new size.
5. Build new Windows and Android versions afterwards if you want them.

## Technical details
- Exclude `/catalogs/**/*.pdf` from desktop-release.json snapshot (tools/desktop-release-plugin.ts) and the Android bundled snapshot; PDFs remain on the published site. Viewer fallback to pdf.js only when online.
- Catalog download/share uses `requireInternet()`.
- Audio: ffmpeg re-encode to mono 32 kbps MP3, same filenames so public/audio/index.json is unchanged.
- Photos: re-encode oversized media images to WebP/JPEG at display size, same paths.
