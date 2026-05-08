# Sendo Supervisor (Vite)

Replaces the legacy CRA `superviser-app`. Hooks to `sendo-backend-nest` via `VITE_API_BASE`.

## Quick start

```bash
npm install
cp .env.example .env       # set VITE_API_BASE=http://localhost:5001
npm run dev                # http://localhost:3001
```

## Auth

Single shared employee password (legacy `COMMON_EMP_PASSWORD`). The password is
stored in `sessionStorage` (cleared on tab close) and sent on every tracker
request as `x-emp-password`. Login posts to `POST /api/auth/employee` with
`{ password }`.

## Backend endpoints used

Tracker (`/api/*`):
- `POST /api/auth/employee`
- `GET /api/health`
- `GET /api/fills/months`
- `GET /api/fills` (params: vehicle, month, date)
- `GET /api/fills/month/:monthKey`
- `GET /api/schedule`
- `GET /api/schedule/:vehicle`
- `GET /api/odometer/:vehicle`
- `POST /api/odometer`
- `GET /api/escalations`
- `POST /api/escalations`
- `GET /api/vehicles` (fallback only)

Onboarding pass-through:
- `GET /onboarding/vehicleList`
- `GET /onboarding/all-vehicles`

> The tracker endpoints (`/api/*`) are NOT yet implemented in `sendo-backend-nest`;
> the only matching module today is `tracking` (vehicle GPS only). Onboarding
> endpoints exist via `vehicle` module. Build a `tracker` module on the backend
> to serve the missing routes.
