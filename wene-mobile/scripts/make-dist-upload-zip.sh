#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[make-dist-upload-zip] building..."
npm run export:web

echo "[make-dist-upload-zip] checking dist/_redirects..."
test -f dist/_redirects || { echo "[ERROR] dist/_redirects not found"; exit 1; }

echo "----- dist/_redirects -----"
cat dist/_redirects
echo "---------------------------"

echo "[make-dist-upload-zip] zipping dist -> dist-upload.zip"
rm -f dist-upload.zip
( cd dist && zip -qr ../dist-upload.zip . )

echo "[make-dist-upload-zip] verifying zip includes _redirects at root..."
unzip -l dist-upload.zip | grep -q ' _redirects$' || { echo "[ERROR] dist-upload.zip does not include _redirects"; exit 1; }

echo "[OK] wrote dist-upload.zip and verified it includes _redirects"
