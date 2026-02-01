#!/usr/bin/env bash
# ADB をエミュレータ専用で実行するラッパー
#
# emulator-xxxx のみを対象とする。実機（Pixel等）は意図的に除外。
# GrapheneOS 等でワイヤレス ADB が制限されている環境向け。
#
# 使い方:
#   ./scripts/emulator-adb.sh devices
#   ./scripts/emulator-adb.sh install app.apk
#   WENE_EMULATOR_ONLY=1 ./scripts/deploy-via-adb.sh  # deploy から呼ばれる
#
# 環境変数:
#   WENE_EMULATOR_ONLY=1  … エミュレータのみ対象（デフォルト: 1 でこのスクリプト使用時）
#   WENE_ADB_SERIAL       … 特定のデバイスを指定（例: emulator-5554）

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# ADB パス解決
get_adb() {
  if command -v adb &>/dev/null; then
    echo "adb"
    return
  fi
  local ah="${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
  ah="${ah:-/opt/homebrew/share/android-commandlinetools}"
  ah="${ah:-$HOME/Library/Android/sdk}"
  if [[ -x "$ah/platform-tools/adb" ]]; then
    echo "$ah/platform-tools/adb"
    return
  fi
  echo "adb"
}

ADB="$(get_adb)"

# エミュレータのシリアルを取得（最初の1台）
# 注: adb devices は serial と state をスペース区切りで出力（Android 公式仕様）
get_emulator_serial() {
  "$ADB" devices -l 2>/dev/null | awk '/^emulator-[0-9]+[[:space:]]+device/ {print $1; exit}'
}

# エミュレータが1台以上あるか確認
check_emulator() {
  local serial
  serial="$(get_emulator_serial)"
  if [[ -z "$serial" ]]; then
    echo "エラー: 起動中の Android エミュレータが見つかりません。" >&2
    echo "" >&2
    echo "対処:" >&2
    echo "  1. Android Studio → Device Manager でエミュレータを起動" >&2
    echo "  2. または: emulator -list-avds で AVD 一覧確認後、emulator -avd <名前> &" >&2
    echo "  3. 起動後: adb devices で emulator-5554 等が表示されることを確認" >&2
    echo "" >&2
    "$ADB" devices -l >&2
    return 1
  fi
  echo "$serial"
}

# メイン: -s <serial> 付きで adb を実行
run_adb() {
  local serial=""
  if [[ -n "$WENE_ADB_SERIAL" ]]; then
    serial="$WENE_ADB_SERIAL"
  else
    serial="$(check_emulator)" || exit 1
  fi
  if [[ -n "$serial" ]]; then
    exec "$ADB" -s "$serial" "$@"
  else
    exec "$ADB" "$@"
  fi
}

run_adb "$@"
