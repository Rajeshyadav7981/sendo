# Sendo Platform

Monorepo containing the four pieces of the Sendo logistics stack:

```
sendo-platform/
├── apps/
│   ├── backend/      NestJS + Fastify + TypeORM + Postgres (port 5001)
│   ├── admin/        Vite + React + AntD  →  /admin/...
│   ├── driver/       Vite + React + Tailwind (PWA)  →  /driver/...
│   └── supervisor/   Vite + React + AntD  →  /supervisor/...
├── nginx/            Single-host reverse-proxy config
├── scripts/          db-init.sql + setup-vm.sh + build-all.sh + dev.sh
├── package.json      npm workspaces glue
└── .env.example      Documented env vars across all apps
```

All three frontends share **one host** in production:

| URL                                  | Served by                   |
|--------------------------------------|-----------------------------|
| `https://<host>/admin/`              | `apps/admin` static build   |
| `https://<host>/driver/`             | `apps/driver` static build  |
| `https://<host>/supervisor/`         | `apps/supervisor` static build |
| `https://<host>/api/...`             | `apps/backend` (proxied)    |
| `https://<host>/uploads/...`         | `apps/backend` static files |
| `https://<host>/socket.io/...`       | `apps/backend` (WebSocket)  |

## Local development

```bash
# 1. Fill in the env files (see .env.example)
cp apps/backend/.env apps/backend/.env.local        # if you want to override
# admin/driver/supervisor each have their own .env (already pointing at http://localhost:5001/api)

# 2. Install (one shot, all apps)
npm install --workspaces --include-workspace-root

# 3. Start local Postgres on port 5432 (or edit DB_PORT in apps/backend/.env)
#    For a fresh DB: psql -U postgres -f scripts/db-init.sql
#    Then run migrations + optional seed:
npm run migration:run
npm run seed:fresh                                  # optional demo data

# 4. Start everything
npm run dev                                         # backend + 3 frontends in parallel
# Stop:
npm run dev:stop
```

In dev each frontend runs on its own Vite port and the Vite dev server **does not** serve through nginx — they hit `http://localhost:5001/api` directly.

## Production deploy on a fresh GCP Ubuntu VM

```bash
# On the VM (after `git clone …`):
cd sendo-platform
bash scripts/setup-vm.sh
```

That single script:

1. Installs Node 20, PostgreSQL 15, nginx, and pm2.
2. Bootstraps the database (creates `sendo` role + `sendo` database + `sendo` schema + `uuid-ossp` extension).
3. `npm ci` for backend + 3 frontends.
4. Builds all four apps.
5. Runs TypeORM migrations.
6. Publishes the three static builds to `/var/www/sendo/{admin,driver,supervisor}/`.
7. Drops `nginx/sendo.conf` into `/etc/nginx/sites-enabled/` and reloads nginx.
8. Starts the backend under pm2 (`pm2 startup` + `pm2 save` so it survives reboots).

After the script finishes, browse to the VM's external IP — the root path redirects to `/admin/`.

### Re-deploying after a code update

```bash
git pull
npm run build
sudo rsync -a --delete apps/admin/dist/      /var/www/sendo/admin/
sudo rsync -a --delete apps/driver/dist/     /var/www/sendo/driver/
sudo rsync -a --delete apps/supervisor/dist/ /var/www/sendo/supervisor/
npm run migration:run                          # if there are new migrations
pm2 restart sendo-backend --update-env
```

## How the routing works

- **Vite `base`** is set per app (`base: '/admin/'` etc.) so every static asset URL is automatically prefixed.
- **React Router `basename`** reads `import.meta.env.BASE_URL`, so client-side routes also live under the same prefix.
- **Backend `setGlobalPrefix('api')`** in `apps/backend/src/main.ts` puts every controller under `/api/...`. The `/health` route is excluded so load balancers can hit `/health` raw.
- **Frontend axios `baseURL`** is `/api` in production (set in each app's `.env.production`); in dev it is `http://localhost:5001/api`.
- **The supervisor app's tracker client** auto-detects whether `apiBase` already ends in `/api` (via the helper in `apps/supervisor/src/shared/api/client.ts`) so it never double-prefixes.

## Database

- Connection details live in `apps/backend/.env`.
- Schema lives in the `sendo` schema (not `public`).
- Migrations: `apps/backend/src/database/migrations/*.ts` — run with `npm run migration:run`.
- Seed: `apps/backend/src/database/seed-fresh.ts` — run with `npm run seed:fresh` (truncates + reseeds; dev-only).

## Test login (after seed:fresh)

| Role        | How to log in                                                |
|-------------|--------------------------------------------------------------|
| Admin       | `admin@sendo.local` / `ChangeMe!123`                         |
| Manager     | `manager@sendo.local` / `ChangeMe!123`                       |
| Supervisor  | header `x-emp-password: tracker123`                          |
| Driver      | phone `7981212220` (DR-001) — OTP printed in backend log     |

## Auth + sessions

JWT cookies + refresh tokens. Cookie domain is host-only so all three frontends share the same backend session as long as they're served under the same hostname (which the unified host enforces).

## Notes for the GCP VM

- Open ports **80** (and 443 if you add TLS).
- Database can stay local on the same VM (default) or point `DB_HOST` at Cloud SQL.
- For TLS, put a Google-managed certificate in front via Cloud Load Balancer, or use certbot on the VM. The nginx config ignores TLS specifics intentionally.
- Backend writes uploads to `apps/backend/uploads/`; mount a persistent disk if you don't want to lose files on VM rebuild.
