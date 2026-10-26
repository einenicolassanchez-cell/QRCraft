#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

if ! command -v node >/dev/null 2>&1 || ! command -v npx >/dev/null 2>&1; then
  echo "Error: instala Node.js y npm antes de actualizar la app." >&2
  exit 1
fi

if [[ -z "${ANDROID_HOME:-}" && -z "${ANDROID_SDK_ROOT:-}" ]]; then
  if [[ -d "$HOME/Android/Sdk" ]]; then
    export ANDROID_HOME="$HOME/Android/Sdk"
  elif [[ -d "$HOME/Library/Android/sdk" ]]; then
    export ANDROID_HOME="$HOME/Library/Android/sdk"
  else
    echo "Error: no se encontró Android SDK. Configura ANDROID_HOME." >&2
    exit 1
  fi
fi
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"

jdk_candidates=()
if [[ -n "${JAVA_HOME:-}" ]]; then
  jdk_candidates+=("$JAVA_HOME")
fi
for candidate in "$HOME"/.gradle/jdks/* "$HOME"/.jdks/* /opt/android-studio/jbr /usr/lib/jvm/*; do
  [[ -d "$candidate" ]] && jdk_candidates+=("$candidate")
done

selected_jdk=""
fallback_jdk=""
for candidate in "${jdk_candidates[@]}"; do
  javac_path="$candidate/bin/javac"
  [[ -x "$javac_path" ]] || continue
  java_version="$("$javac_path" -version 2>&1 | awk '{print $2}' | cut -d. -f1)"
  case "$java_version" in
    17)
      selected_jdk="$candidate"
      break
      ;;
    21)
      [[ -n "$fallback_jdk" ]] || fallback_jdk="$candidate"
      ;;
  esac
done
selected_jdk="${selected_jdk:-$fallback_jdk}"
if [[ -z "$selected_jdk" ]]; then
  echo "Error: se necesita un JDK 17 o 21 completo (incluido javac)." >&2
  exit 1
fi
export JAVA_HOME="$selected_jdk"
export PATH="$JAVA_HOME/bin:$PATH"

connected_devices=()
if command -v adb >/dev/null 2>&1; then
  adb start-server >/dev/null
  mapfile -t connected_devices < <(adb devices | awk 'NR > 1 && $2 == "device" { print $1 }')
fi

mkdir -p build
signing_key="build/debug.keystore"
if [[ -f android/app/debug.keystore && ! -f "$signing_key" ]]; then
  cp android/app/debug.keystore "$signing_key"
fi

echo "Preparando el proyecto Android..."
npx expo prebuild --platform android --no-install

if [[ -f "$signing_key" ]]; then
  cp "$signing_key" android/app/debug.keystore
fi

echo "Compilando APK autónomo para móviles ARM de 32 y 64 bits..."
./android/gradlew -p android assembleRelease \
  -PreactNativeArchitectures=armeabi-v7a,arm64-v8a \
  -Pandroid.enableMinifyInReleaseBuilds=false \
  -Pandroid.enableShrinkResourcesInReleaseBuilds=false

apk="build/QRCraft.apk"
cp android/app/build/outputs/apk/release/app-release.apk "$apk"
if [[ ! -f "$signing_key" ]]; then
  cp android/app/debug.keystore "$signing_key"
fi

if [[ "${#connected_devices[@]}" -eq 1 ]]; then
  device="${connected_devices[0]}"
  echo "Instalando QRCraft en el dispositivo conectado $device..."
  adb -s "$device" install -r "$apk"
  adb -s "$device" shell monkey -p com.einenicolassanchez.qrcraft \
    -c android.intent.category.LAUNCHER 1
  echo "QRCraft se instaló y abrió en el dispositivo."
elif [[ "${#connected_devices[@]}" -gt 1 ]]; then
  echo "Hay varios dispositivos conectados; no instalé automáticamente para evitar elegir el equivocado."
  adb devices -l
  echo "Instala el APK manualmente en el teléfono deseado."
else
  echo "No hay un teléfono conectado. El APK quedó listo para copiar e instalar en cualquier móvil Android compatible."
fi

echo "APK: $PROJECT_ROOT/$apk"
ls -lh "$apk"
