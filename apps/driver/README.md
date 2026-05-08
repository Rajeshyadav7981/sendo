# vehicleApp-vite

Vite + React 18 + TypeScript port of the legacy `vehicleApp` (CRA) driver app, with PWA / offline support.

## Stack
- **Bundler:** Vite 5 + `vite-plugin-pwa` (auto-update service worker, runtime caching for `/api` and `/uploads`)
- **UI:** React 18, antd 5 (yellow + black theme), Tailwind 3
- **State:** TanStack Query 5 (server) + Zustand (auth, trip)
- **HTTP:** axios (`withCredentials: true`, 401 → /login)
- **Offline writes:** `idb-keyval` based offline queue (`shared/lib/offline-queue.ts`) — service worker syncs when online
- **Auth:** Twilio phone OTP (legacy parity)

## Folder layout
```
src/
  app/                  # bootstrap, providers, routes
  config/env.ts
  features/             # one folder per feature
    auth/               # LoginWithOTP, OTPsent
    trips/              # VehicleDropdown, StartTrip, hooks/api
    attendance/         # DriverAttendance + approval
    advance/            # DriverAdvance request flow
    payout/             # DriverPayout summary
    leave/              # LeaveRequest
    documents/          # DriverDocument
    onboarding/         # DriverVehicleOnboarding
    diesel/             # DieselTracking
    profile/            # MyProfile, Logout
    settings/           # Settings
    refer/              # Refer & Earn
    help/               # Help, Legal subpages
  shared/
    api/                # axios client, query client, error helpers
    components/common/  # ProtectedRoute, OfflineBanner, PageLoader, StubPage
    hooks/              # useOnline
    layouts/            # AppLayout, AuthLayout, Navbar
    lib/                # toast, offline-queue
    types/              # API envelope types
  store/                # Zustand auth + trip stores (persisted)
  styles/               # tailwind.css + index.css
  main.tsx
```

## Local dev
```bash
cp .env.example .env       # set VITE_API_BASE
npm install
npm run dev                # http://localhost:3001
```

## PWA
Install via the browser "Add to Home Screen" / "Install app" prompt. The service
worker caches the static shell; API responses use NetworkFirst with a 5-second
timeout, so the app remains usable on flaky networks.

## Migration status
- ✅ Auth (phone OTP via Twilio backend)
- ✅ Trip flow (start / stop with persisted state via Zustand)
- ✅ Attendance list (typed against new Nest endpoints)
- ✅ Payout summary (consumes `/advance/payout/:driverId/:month`)
- ✅ My Profile + Logout
- ✅ PWA shell + offline banner + offline write queue helper
- 🟡 The remaining screens (Advance form, Leave, Document upload, Diesel,
  Vehicle Onboarding, Settings, Refer & Earn, Help, Legal) are routed and
  rendered as `<StubPage>` — port the legacy JSX into the matching
  `features/<area>/pages/*.tsx` and replace the `Component: stub(...)` entry
  in `src/app/routes.tsx`.

## Build
```bash
npm run build              # tsc -b && vite build
npm run preview            # serve dist/ (PWA service worker active)
```
