#!/usr/bin/env bash
set -euo pipefail
cd /workspace/snacks-match-raohe
node -e 'if (Number(process.versions.node.split(".")[0]) < 24) throw new Error("Snacks Match – Raohe requires Node.js 24 or later")'
npm ci --cache /workspace/.npm-cache --no-audit --no-fund
npm run build
