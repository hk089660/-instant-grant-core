#!/usr/bin/env bash
# エミュレータが起動していなければ起動する
#
# 起動済みの場合は何もしない。
# 未起動の場合: 利用可能な AVD の最初の1つを起動（バックグラウンド）
#
# 使い方:
#   ./scripts/emulator-start.sh
#   ./scripts/emulator-start.sh -n Pixel_8_API_36  # 特定 AVD を指定
#
# 環境変数:
#   ANDROID_HOME, ANDROID_SDK_ROOT … SDK パス
#   WENE_AVD_NAME                   … 起動する AVD 名（-n より優先）

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# 既に起動済みか
if bash "$SCRIPT_DIR/emulator-check.sh" 2>/dev/null; then
  echo "エミュレータは既に起動しています。"
  exit 0
fi

# emulator コマンドのパス
get_emulator() {
  local ah="${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
  ah="${ah:-/opt/homebrew/share/android-commandlinetools}"
  ah="${ah:-$HOME/Library/Android/sdk}"
  local emu="$ah/emulator/emulator"
  if [[ -x "$emu" ]]; then
    echo "$emu"
    return
  fi
  # commandlinetools のみの場合、別のパス
  local alt="$ah/cmdline-tools/latest/bin/emulator"
  [[ -x "$alt" ]] && echo "$alt" || echo "emulator"
}

EMULATOR="$(get_emulator)"
if [[ "$EMULATOR" == "emulator" ]] && ! command -v emulator &>/dev/null; then
  echo "エラー: emulator コマンドが見つかりません。" >&2
  echo "" >&2
  echo "Android Studio の SDK Manager で以下をインストールしてください:" >&2
  echo "  - Android SDK Platform-Tools" >&2
  echo "  - Android Emulator" >&2
  echo "" >&2
  echo "ANDROID_HOME を設定してください（例: export ANDROID_HOME=\$HOME/Library/Android/sdk）" >&2
  exit 1
fi

# AVD 名を決定
AVD_NAME="${WENE_AVD_NAME}"
while getopts "n:" opt; do
  case $opt in
    n) AVD_NAME="$OPTARG" ;;
  esac
done

if [[ -z "$AVD_NAME" ]]; then
  # 利用可能な AVD の最初の1つ
  AVD_NAME="$("$EMULATOR" -list-avds 2>/dev/null | head -1)"
  if [[ -z "$AVD_NAME" ]]; then
    echo "エラー: 利用可能な AVD がありません。" >&2
    echo "" >&2
    echo "Android Studio → Device Manager で AVD を作成してください。" >&2
    echo "例: Pixel 8, API 36 (UpsideDownCake)" >&2
    "$EMULATOR" -list-avds 2>&1 || true
    exit 1
  fi
  echo "AVD: $AVD_NAME（自動選択）"
else
  echo "AVD: $AVD_NAME"
fi

echo "エミュレータを起動しています…（数十秒かかることがあります）"
echo "起動後、adb devices で emulator-5554 等が表示されることを確認してください。"
echo ""

# -gpu auto: GPU  acceleration を自動選択（Mac でよく動く）
# -no-snapshot-load が必要な場合は手動で追加
"$EMULATOR" -avd "$AVD_NAME" -gpu auto &
