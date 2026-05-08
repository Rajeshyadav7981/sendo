#!/usr/bin/env bash
set -euo pipefail

# Provision a fresh Ubuntu/Debian GCP VM to run the Sendo platform.
# Usage: bash scripts/setup-vm.sh
#
# Idempotent: each step checks state before acting. Re-run after pulling new code.

REPO_DIR="${REPO_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
NODE_MAJOR="${NODE_MAJOR:-20}"
PG_VERSION="${PG_VERSION:-15}"

log() { printf '\n\033[1;33m▶\033[0m %s\n' "$*"; }

require_sudo() {
  if [ "$EUID" -ne 0 ] && ! command -v sudo >/dev/null; then
    echo "This script needs sudo. Install sudo or run as root."
    exit 1
  fi
}

run() {
  if [ "$EUID" -eq 0 ]; then "$@"; else sudo "$@"; fi
}

require_sudo

log "Updating apt"
run apt-get update -y

log "Installing base packages"
run apt-get install -y curl ca-certificates gnupg build-essential git nginx

if ! command -v node >/dev/null || [[ "$(node -v 2>/dev/null)" != v${NODE_MAJOR}* ]]; then
  log "Installing Node.js ${NODE_MAJOR}.x"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | run bash -
  run apt-get install -y nodejs
fi

if ! command -v pg_isready >/dev/null; then
  log "Installing PostgreSQL ${PG_VERSION}"
  run apt-get install -y "postgresql-${PG_VERSION}" "postgresql-client-${PG_VERSION}"
  run systemctl enable --now postgresql
fi

if ! command -v pm2 >/dev/null; then
  log "Installing pm2 globally"
  run npm install -g pm2
fi

log "Bootstrapping database (sendo / sendo)"
run -u postgres psql -v ON_ERROR_STOP=1 -f "${REPO_DIR}/scripts/db-init.sql"

log "Installing backend dependencies"
( cd "${REPO_DIR}/apps/backend" && npm ci )

log "Installing frontend dependencies"
( cd "${REPO_DIR}/apps/admin" && npm ci )
( cd "${REPO_DIR}/apps/driver" && npm ci )
( cd "${REPO_DIR}/apps/supervisor" && npm ci )

log "Building everything"
bash "${REPO_DIR}/scripts/build-all.sh"

log "Running database migrations"
( cd "${REPO_DIR}/apps/backend" && npm run migration:run )

log "Publishing static SPAs to /var/www/sendo"
run mkdir -p /var/www/sendo
run rsync -a --delete "${REPO_DIR}/apps/admin/dist/"      /var/www/sendo/admin/
run rsync -a --delete "${REPO_DIR}/apps/driver/dist/"     /var/www/sendo/driver/
run rsync -a --delete "${REPO_DIR}/apps/supervisor/dist/" /var/www/sendo/supervisor/

log "Installing nginx site config"
run cp "${REPO_DIR}/nginx/sendo.conf" /etc/nginx/sites-available/sendo.conf
run ln -sf /etc/nginx/sites-available/sendo.conf /etc/nginx/sites-enabled/sendo.conf
run rm -f /etc/nginx/sites-enabled/default
run nginx -t
run systemctl reload nginx

log "Starting backend with pm2"
( cd "${REPO_DIR}/apps/backend" \
  && pm2 start dist/main.js --name sendo-backend --update-env \
  || pm2 restart sendo-backend --update-env )
pm2 save
pm2 startup systemd -u "$(whoami)" --hp "$HOME" >/dev/null || true

log "Done. Browse to /admin, /driver, /supervisor on this VM's IP."
