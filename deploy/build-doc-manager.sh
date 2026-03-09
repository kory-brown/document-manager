#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# build-doc-manager.sh
# Builds the Documentation Manager web app and packages it into a
# ready-to-deploy ZIP bundle.
#
# Requirements:
#   Node.js 18+ and npm must be installed on the machine running this script.
#
# Usage:
#   cd /path/to/documentation-manager
#   ./deploy/build-doc-manager.sh
#
# Output:
#   deploy/dist/doc-manager-[YYYY-MM-DD].zip
# ─────────────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
WEB_DIR="$ROOT_DIR/web"
DATE=$(date +%Y-%m-%d)
ZIP_NAME="doc-manager-$DATE.zip"

# ── Check Node.js ─────────────────────────────────────────────────────────────
if ! command -v node &> /dev/null; then
    echo "✗ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -e "process.exit(parseInt(process.version.slice(1)) < 18 ? 1 : 0)" 2>/dev/null && echo "ok" || echo "old")
if [ "$NODE_VERSION" = "old" ]; then
    echo "✗ Node.js 18 or higher is required. Current version: $(node --version)"
    exit 1
fi

echo "→ Node.js $(node --version) detected"

# ── Install dependencies ───────────────────────────────────────────────────────
echo "→ Installing dependencies..."
cd "$WEB_DIR"
npm install --silent

# ── Build ─────────────────────────────────────────────────────────────────────
echo "→ Building app..."
npm run build

# ── Package ───────────────────────────────────────────────────────────────────
echo "→ Packaging bundle..."
mkdir -p "$SCRIPT_DIR/dist"
cd "$WEB_DIR/dist"
zip -r "$SCRIPT_DIR/dist/$ZIP_NAME" . --quiet

echo ""
echo "✓ Bundle ready: deploy/dist/$ZIP_NAME"
echo ""
echo "Contents:"
unzip -l "$SCRIPT_DIR/dist/$ZIP_NAME" | tail -n +4 | head -n -2
