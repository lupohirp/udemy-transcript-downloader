#!/bin/bash
set -e

# Change to project root directory
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

VERSION=$(grep '"version"' manifest.json | head -1 | awk -F: '{ print $2 }' | sed 's/[", ]//g')
DIST_DIR="$DIR/dist"
ZIP_FILE="$DIST_DIR/udemy-transcript-downloader-v${VERSION}.zip"

mkdir -p "$DIST_DIR"
rm -f "$ZIP_FILE"

echo "📦 Packaging Udemy Transcript Downloader v${VERSION} for Chrome Web Store..."

zip -r "$ZIP_FILE" \
  manifest.json \
  background/ \
  content/ \
  popup/ \
  utils/ \
  icons/ \
  -x "*.DS_Store" "*__pycache__*"

echo "✅ Package created successfully:"
echo "   $ZIP_FILE"
ls -lh "$ZIP_FILE"
