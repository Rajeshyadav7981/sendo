#!/usr/bin/env bash
set -euo pipefail

for pidfile in /tmp/sendo-*.pid; do
  [ -f "$pidfile" ] || continue
  pid=$(cat "$pidfile")
  if kill -0 "$pid" 2>/dev/null; then
    echo "killing $(basename "$pidfile" .pid) (pid $pid)"
    kill "$pid" || true
  fi
  rm -f "$pidfile"
done
echo "stopped."
