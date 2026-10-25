#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"
node --check model.js
node --check test_v4.js
node --check test_browser_smoke.js
node test_v4.js
node test_browser_smoke.js
echo "GeoMesh V4.1: model + 90mm UI regression checks passed."
