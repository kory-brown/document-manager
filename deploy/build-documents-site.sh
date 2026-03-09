#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# build-documents-site.sh
# Packages the Documents viewer site into a ready-to-deploy ZIP bundle.
#
# Usage:
#   cd /path/to/documentation-manager
#   ./deploy/build-documents-site.sh
#
# Output:
#   deploy/dist/documents-site-[YYYY-MM-DD].zip
# ─────────────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
WEB_DIR="$ROOT_DIR/web"
DATE=$(date +%Y-%m-%d)
OUT_DIR="$SCRIPT_DIR/dist/documents-site"
ZIP_NAME="documents-site-$DATE.zip"

echo "→ Cleaning output directory..."
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR/images"

echo "→ Copying index.html..."
cp "$WEB_DIR/documents.html" "$OUT_DIR/index.html"

echo "→ Copying images..."
cp -r "$WEB_DIR/images/." "$OUT_DIR/images/"

echo "→ Creating placeholder manifest.json..."
cat > "$OUT_DIR/manifest.json" << 'EOF'
[]
EOF

echo "→ Copying server guide..."
cp "$SCRIPT_DIR/DOCUMENTS-SITE-SERVER-GUIDE.md" "$OUT_DIR/SERVER-GUIDE.md"

echo "→ Creating ZIP bundle..."
mkdir -p "$SCRIPT_DIR/dist"
cd "$SCRIPT_DIR/dist"
zip -r "$ZIP_NAME" "documents-site/" --quiet

echo ""
echo "✓ Bundle ready: deploy/dist/$ZIP_NAME"
echo ""
echo "Contents:"
unzip -l "$SCRIPT_DIR/dist/$ZIP_NAME" | tail -n +4 | head -n -2
