#!/usr/bin/env bash
# エミュレータの起動状態を確認
#
#  exit 0: エミュレータが1台以上起動している
#  exit 1: エミュレータが起動していない
#
# 使い方:
#   ./scripts/emulator-check.sh && echo "OK" || echo "起動してください"

set -e

get_adb() {
  if command -v adb &>/dev/null; then echo "adb"; return; fi
  local ah="${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
  ah="${ah:-/opt/homebrew/share/android-commandlinetools}"
  ah="${ah:-$HOME/Library/Android/sdk}"
  [[ -x "$ah/platform-tools/adb" ]] && echo "$ah/platform-tools/adb" || echo "adb"
}

ADB="$(get_adb)"
SERIAL="$("$ADB" devices -l 2>/dev/null | awk '/^emulator-[0-9]+[[:space:]]+device/ {print $1; exit}')"

if [[ -z "$SERIAL" ]]; then
  echo "エミュレータ未起動"
  exit 1
fi

echo "エミュレータ検出: $SERIAL"
exit 0
