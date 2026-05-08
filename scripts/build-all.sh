#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"

echo "▶ Building backend"
( cd "${REPO_DIR}/apps/backend" && npm run build )

for app in admin driver supervisor; do
  echo "▶ Building ${app}"
  ( cd "${REPO_DIR}/apps/${app}" && npm run build )
done

echo "✓ All builds complete."
