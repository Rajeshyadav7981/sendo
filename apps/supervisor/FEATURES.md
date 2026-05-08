# superviser-app-vite — Supervisor App Feature Reference

The supervisor app is a focused fleet-performance tool for middle managers. Tiny: **3 routes**, but each opens onto a rich dashboard. Authentication is **password-only** (`x-emp-password` header), shared employee password — by design, supervisors don't need full JWT identity.

> See `/Users/rajeshyadav/Documents/learn/PRODUCT_GUIDE.md` for the cross-app overview.

## 0. Auth

| Route | Page | What it does | Backend |
|---|---|---|---|
| `/login` | LoginPage | Single password input. On submit: `POST /api/auth/employee { password }`. If `{ ok: true }`, store password in `sessionStorage` (zustand persist) and redirect to `/dashboard`. | `POST /api/auth/employee` |

The stored password is auto-attached to every subsequent tracker call as `x-emp-password` header by the `trackerClient` axios instance. 401 anywhere clears session and redirects to `/login`.

> **Default password is `tracker123`.** Override in backend `.env` with `EMPLOYEE_TRACKER_PASSWORD=<secret>`.

---

## 1. Dashboard

| Route | Page | What you see |
|---|---|---|
| `/dashboard` | DashboardPage | Top-level KPI overview. Components: stat cards (total fleet / active today / escalations open / monthly fuel burn), date-range filters, recharts bar+pie of vehicle-vs-budget, and a vehicle performance table. |
| `/employee-dashboard` | EmployeeDashboardPage | Vehicle-detail dashboard reached by clicking a row in the main dashboard. The richest screen in the app. |

---

## 2. Employee Dashboard sub-components (the workhorse)

`EmployeeDashboardPage` composes 12 sub-components in `src/features/dashboard/components/`. Each handles a slice of the supervisor's daily review:

| Component | Purpose | Backend |
|---|---|---|
| **EmployeeNavbar** | Top bar with selected vehicle, logout | — |
| **EmployeeSidebar** | Vehicle list nav (selectable) | `GET /api/vehicles`, `GET /onboarding/all-vehicles` |
| **EmpVehicleHeader** | Selected vehicle's identity card (number, type, fuel scheme) | `GET /onboarding/vehicle/:vehicleNumber` |
| **EmployeeStatCards** | 4 KPI cards for the selected vehicle: this-month litres, this-month km, kmpL, schedule adherence% | `GET /api/fills/month/:month` |
| **VehicleMonthFilters** | Month picker + vehicle filter chips | — |
| **FillCalendarStrip** | Calendar of last 30 days, each day green if fill recorded, red if missed | `GET /api/fills/month/:month` |
| **FillsTable** | Editable table of fills for the selected month. Columns: date, start km, end km, totalKm (computed), litres, rate, totalAmount (computed), photo. Inline edit; bulk save. | `GET /api/fills/:monthKey`, `POST /api/fills/bulk` |
| **DoubleFillsSection** | Detector for two fills on the same day (anomaly) | computed client-side |
| **ScheduleStatusMini** | Mini badge: "On schedule" / "Behind" / "Ahead" | `GET /api/schedule/:vehicle` |
| **ScheduleConfigBadges** | Read-only badges for current schedule (interval days / litres / km/L) | `GET /api/schedule/:vehicle` |
| **MileageScheduleSection** | Historical schedule changes (audit log) | `GET /api/schedule/:vehicle` (versioned) |
| **OdometerForm** | Single-input form to log today's odometer reading | `GET /api/odometer/:vehicle`, `POST /api/odometer/:vehicle` |
| **EscalationForm** | Raise a concern: vehicle (auto), category select, severity (low/medium/high), note. Submit → list refreshes. | `POST /api/escalations`, `GET /api/escalations` (filtered by vehicle) |

---

## 3. Supervisor's typical flow

1. Open app → `/login` → enter shared password → land on `/dashboard`
2. Skim the fleet KPI cards. Spot a vehicle with low km/L this month → click row → `/employee-dashboard?vehicle=XYZ`
3. **EmployeeDashboard** opens, FillCalendarStrip immediately shows the gap days
4. Click into FillsTable → edit a missing day's litres + km → Save → row added via `POST /api/fills/bulk`
5. Notice the kmpL is still off → check OdometerForm history, log today's reading
6. Conclude something is wrong with the engine → fill EscalationForm: category=Engine, severity=high, note="Sudden 15% drop in mileage Mar 1-10"
7. Escalation row appears in admin app's `/employee-escalations` (admin can mark resolved when fixed)

---

## 4. Backend dependency

The supervisor app speaks to **two** axios instances:

| Instance | Base URL | Purpose | Auth |
|---|---|---|---|
| `trackerClient` | `${VITE_API_BASE}/api` | All `/api/*` tracker routes (most of the app) | `x-emp-password` header |
| `backendClient` | `${VITE_API_BASE}` | `/onboarding/*` (vehicle list / vehicle detail) | none — public list endpoints |

Both live in `src/shared/api/client.ts`. **Do not bypass them with raw axios.**

If `VITE_API_BASE=http://localhost:5001`, then:
- `trackerClient` hits `http://localhost:5001/api/*`
- `backendClient` hits `http://localhost:5001/*` (e.g. `/onboarding/all-vehicles`)

---

## 5. Adding data from the supervisor app

| Endpoint | When | Triggered by |
|---|---|---|
| `POST /api/fills` | Single fill entry | (rare — usually bulk) |
| `POST /api/fills/bulk` | Save edited FillsTable | FillsTable Save button |
| `POST /api/schedule/bulk` | Update per-vehicle schedule defaults | (admin-side; supervisor app reads only) |
| `POST /api/escalations` | Raise a concern | EscalationForm |
| `PATCH /api/escalations/:id` | Mark resolved / reopen | (admin-side `/employee-escalations` — supervisor app reads list) |
| `POST /api/employees` | Add a tracker employee record | (admin-side `/employee-add`) |
| `POST /api/odometer/:vehicle` | Log daily odometer | OdometerForm |

The supervisor app is mostly READ + a few targeted WRITE flows on the employee dashboard.

---

## How to add a new feature

1. If it's a new dashboard widget: create the component at `src/features/dashboard/components/<Name>.tsx` and slot it into `EmployeeDashboardPage`
2. If it's a new top-level page: add route in `src/app/routes.tsx` + create page in `src/features/<area>/pages/`
3. If new tracker endpoint needed: add to `src/features/tracker/tracker.api.ts` + `tracker.hooks.ts` AND add the corresponding endpoint to `sendo-backend-nest/src/modules/tracker/tracker.controller.ts`
4. Update `EmployeeSidebar` if it should be navigable

## Common gotchas

- **`x-emp-password` is plain text in the header** — fine on HTTPS, dangerous on plain HTTP. The dev server is on localhost only; production must terminate TLS at CloudFront/ALB.
- **`trackerClient` baseURL is `${apiBase}/api`** — when adding endpoints, the controller path is just the part after `/api/` (e.g. `@Controller('api')` + `@Get('foo')` → call `trackerClient.get('/foo')`)
- **`/api/auth/employee` does not return a JWT** — it just confirms the password. The same password is then used as the auth header on every call.
- **Session persists in `sessionStorage`, not `localStorage`** — closing the tab logs the supervisor out (intentional, since it's a shared password)
- **No JWT means no per-user audit trail** — the backend cannot distinguish "supervisor A" from "supervisor B"; all writes look like "the supervisor". If you need per-person audit, switch this app to JWT.

---

## Possible future enhancements (not in scope today)

- Per-supervisor JWT (replace shared password)
- Push notifications when an escalation is resolved
- Export FillsTable as CSV / Excel directly from the dashboard
- Charts for monthly fuel cost trends per vehicle (simple recharts addition)
- Mobile-responsive layout (currently desktop-first; supervisors don't typically use mobile but would be nice for spot-checks)
