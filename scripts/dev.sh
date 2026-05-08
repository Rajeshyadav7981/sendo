#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"

start() {
  local name="$1"; shift
  local cwd="$1"; shift
  local logfile="/tmp/sendo-${name}.log"
  echo "▶ starting ${name} (logs: ${logfile})"
  ( cd "$cwd" && "$@" >"$logfile" 2>&1 ) &
  echo $! > "/tmp/sendo-${name}.pid"
}

start backend    "${REPO_DIR}/apps/backend"    npm run start:dev
start admin      "${REPO_DIR}/apps/admin"      npm run dev
start driver     "${REPO_DIR}/apps/driver"     npm run dev
start supervisor "${REPO_DIR}/apps/supervisor" npm run dev

cat <<EOF
Started.
  backend       → http://localhost:5001/api/health
  admin (dev)   → http://localhost:3000/admin/
  driver (dev)  → http://localhost:3001/driver/
  supervisor    → http://localhost:3001/supervisor/   (driver/supervisor share dev port; check the Vite log to confirm)
PIDs: /tmp/sendo-*.pid    Logs: /tmp/sendo-*.log

Stop everything: bash scripts/dev-stop.sh
EOF
