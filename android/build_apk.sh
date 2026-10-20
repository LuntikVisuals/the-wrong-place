#!/bin/bash
# Builds a signed offline WebView APK from ../dist/the-wrong-place.html. Touches only android/ (out in android/out) and reads the key from /workspace/wrongplace-keys.
set -euo pipefail
export JAVA_HOME=/home/box/tools/jdk-17.0.20.1+1; export PATH=$JAVA_HOME/bin:$PATH
cd "$(dirname "$0")"
SDK=/home/box/tools/android-sdk;BT=$SDK/build-tools/34.0.0;JAR=$SDK/platforms/android-34/android.jar
KP=/workspace/wrongplace-keys/keystore.properties
prop(){ grep "^$1=" "$KP"|cut -d= -f2-; }
VER=$(grep -o 'versionName="[^"]*"' AndroidManifest.xml|cut -d'"' -f2)
rm -rf out;mkdir -p out/gen out/classes out/dex out/assets
python3 ../build.py >/dev/null
cp ../dist/the-wrong-place.html out/assets/index.html
python3 tools/make_icon.py res
"$BT/aapt2" compile --dir res -o out/res.zip
"$BT/aapt2" link -I "$JAR" --manifest AndroidManifest.xml -A out/assets --min-sdk-version 24 --target-sdk-version 34 --version-code 1 --version-name "$VER" --java out/gen -o out/base.apk out/res.zip --auto-add-overlay
javac -source 8 -target 8 -nowarn -bootclasspath "$JAR" -classpath "$JAR" -d out/classes $(find src out/gen -name '*.java') 2>&1|grep -v "warning\|^Note" || true
"$BT/d8" --release --min-api 24 --lib "$JAR" --output out/dex $(find out/classes -name '*.class')
cp out/base.apk out/unsigned.apk;python3 -c "import zipfile;z=zipfile.ZipFile('out/unsigned.apk','a',zipfile.ZIP_DEFLATED);z.write('out/dex/classes.dex','classes.dex');z.close()"
"$BT/zipalign" -f -p 4 out/unsigned.apk out/aligned.apk
NAME=the-wrong-place-v$VER.apk
"$BT/apksigner" sign --ks "$(prop storeFile)" --ks-key-alias "$(prop alias)" --ks-pass "pass:$(prop storePassword)" --key-pass "pass:$(prop keyPassword)" --out "out/$NAME" out/aligned.apk
rm -f out/unsigned.apk out/aligned.apk out/base.apk out/res.zip
echo "built android/out/$NAME"
