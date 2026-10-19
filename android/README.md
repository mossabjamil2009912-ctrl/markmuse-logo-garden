# Android offline shell

This wraps the existing public TanStack application, not a second frontend.
Android 10+ is required. Public media is bundled; no server modules or secrets enter the APK.

`build.sh` uses Android SDK 35/build-tools 35.0.0, JDK 17, NanoHTTPD 2.3.1, an existing public snapshot including SSR-produced `index.html`, and a persistent private signing keystore. Build dependencies, generated output and APKs stay outside the repository. Reuse the signing keystore for installable APK upgrades; never commit it.

The local port is chosen once and persisted. Published `desktop-release.json` updates are checksum-verified, staged and activated atomically. Existing WebView storage stays at the same origin. Website text, images and audio update in-place. Native launcher icon, Android permissions and shell code require a newly signed APK; Android does not allow arbitrary website files to replace these.

Administration verifies against the cloud online, then caches only the successfully verified hash for offline login. The packaged default hash is used before the first online verification. Reset and orders require internet; no service credentials are bundled. The last known password remains valid offline until the device next successfully verifies the changed password online.

Known verification boundary: this sandbox has no Android device or accelerated emulator. APK signatures and public assets can be inspected, release integrity tests run on the JVM, and the bundled web app can be exercised in Chromium; installation, Android WebView printing and real on-device recovery still need a physical-device check.