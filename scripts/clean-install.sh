#!/usr/bin/env bash
# 変更を取り込んでクリーンインストールする
# 別ターミナルで: cd /path/to/we-ne && ./scripts/clean-install.sh
# または: cd /path/to/we-ne && git pull && ./scripts/clean-install.sh

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "📂 Repo root: $REPO_ROOT"
echo ""

# オプション: 第一引数が --pull なら git pull を実行
if [ "${1:-}" = "--pull" ]; then
  echo "🔄 git pull..."
  git pull
  echo ""
fi

echo "🧹 Cleaning..."
rm -rf "$REPO_ROOT/node_modules"
rm -rf "$REPO_ROOT/wene-mobile/node_modules"
rm -rf "$REPO_ROOT/wene-mobile/.expo"
rm -rf "$REPO_ROOT/wene-mobile/node_modules/.cache"
rm -rf "$REPO_ROOT/wene-mobile/.metro"
echo "   ✓ Removed node_modules and caches"
echo ""

echo "📦 Installing root..."
npm install
echo ""

echo "📦 Installing wene-mobile..."
(cd wene-mobile && npm install --legacy-peer-deps)
echo ""

echo "🏥 Running doctor (build repair)..."
(cd wene-mobile && npm run doctor:build-repair)
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Clean install done."
echo ""
echo "Next: cd wene-mobile && npm start"
echo ""
