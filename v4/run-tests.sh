#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"
node --check model.js
node --check test_v4.js
node --check test_browser_smoke.js
node --check fid.js
node --check test_fid.js
node test_v4.js
node test_browser_smoke.js
node test_fid.js
echo "GeoMesh V4.4: model, UI, and conditional complex FID regressions passed."
