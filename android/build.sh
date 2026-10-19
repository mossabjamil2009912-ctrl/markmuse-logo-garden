#!/usr/bin/env bash
set -euo pipefail
# SDK/JDK, NanoHTTPD and a public-only app snapshot are supplied externally.
: "${ANDROID_SDK_ROOT:?Set Android SDK root}"
: "${JAVA_HOME:?Set JDK path}"
: "${PUBLIC_SNAPSHOT:?Set public-only snapshot folder with index.html}"
: "${NANOHTTPD_JAR:?Set NanoHTTPD 2.3.1 jar}"
: "${ANDROID_KEYSTORE:?Set persistent signing keystore}"
: "${ANDROID_KEYSTORE_PASSWORD:?Set keystore password}"
: "${APP_ICON:?Set bundled app icon PNG}"
ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT="${ANDROID_OUTPUT:-/tmp/tamkeen-android/package}"
BT="$ANDROID_SDK_ROOT/build-tools/35.0.0"
PLATFORM="$ANDROID_SDK_ROOT/platforms/android-35/android.jar"
export PATH="$JAVA_HOME/bin:$PATH"
mkdir -p "$OUT/classes" "$OUT/dex" "$OUT/res/drawable" "$OUT/res/xml" "$OUT/assets/web"
cp "$ROOT/res/xml/network_security_config.xml" "$OUT/res/xml/"
cp "$APP_ICON" "$OUT/res/drawable/app_icon.png"
cp -a "$PUBLIC_SNAPSHOT/." "$OUT/assets/web/"
# Refuse common private/build artifacts before packaging.
if test -n "$(rg --files --hidden "$OUT/assets" | rg '/(server|node_modules|\.env|\.git)/|\.map$' || true)"; then echo 'Snapshot contains forbidden entries'; exit 1; fi
javac --release 11 -cp "$PLATFORM:$NANOHTTPD_JAR" -d "$OUT/classes" "$ROOT/MainActivity.java" "$ROOT/ReleaseStore.java"
jar cf "$OUT/classes.jar" -C "$OUT/classes" .
"$BT/d8" --min-api 29 --lib "$PLATFORM" --output "$OUT/dex" "$OUT/classes.jar" "$NANOHTTPD_JAR"
"$BT/aapt2" compile --dir "$OUT/res" -o "$OUT/resources.zip"
"$BT/aapt2" link -o "$OUT/unsigned.apk" --manifest "$ROOT/AndroidManifest.xml" -I "$PLATFORM" -A "$OUT/assets" "$OUT/resources.zip"
python3 - "$OUT" <<'PY'
import sys,zipfile
from pathlib import Path
out=Path(sys.argv[1])
with zipfile.ZipFile(out/'unsigned.apk','a',compression=zipfile.ZIP_DEFLATED) as z:
    for dex in (out/'dex').glob('*.dex'): z.write(dex,dex.name)
PY
"$BT/zipalign" -f -p 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"
"$BT/apksigner" sign --ks "$ANDROID_KEYSTORE" --ks-key-alias tamkeen --ks-pass env:ANDROID_KEYSTORE_PASSWORD --out "$OUT/TAMKEEN-Android.apk" "$OUT/aligned.apk"
"$BT/apksigner" verify --verbose "$OUT/TAMKEEN-Android.apk"
"$BT/aapt2" dump badging "$OUT/TAMKEEN-Android.apk" | head -12