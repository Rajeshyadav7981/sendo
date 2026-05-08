# vehicleApp-vite — Driver App Feature Reference

The driver app is the single tool a truck driver uses on their phone. Mobile-first, low-data, single-task screens. **19 routes**, mostly accessed from a tile-grid home screen.

> See `/Users/rajeshyadav/Documents/learn/PRODUCT_GUIDE.md` for the cross-app overview.

## 0. Auth

| Route | Page | What it does | Backend |
|---|---|---|---|
| `/login` | LoginPage | Phone number entry → triggers OTP send → navigate to OTP page | `POST /send-otp/phone` |
| `/otp-sent` | OtpSentPage | 6-digit OTP entry (`react-otp-input`) → verify → JWT issued → navigate `/start-trip` | `POST /send-otp/verify` |
| `/logout` | LogoutPage | Clear auth store, clear tripStore, navigate `/login` | `POST /api/logout` |

JWT stored in zustand auth store. Driver also has a `tripStore` (zustand) holding the active vehicle number once a trip starts — used by Documents and Diesel screens to pre-fill.

---

## 1. Trip module — the core driver loop

| Route | Page | What you do | Backend |
|---|---|---|---|
| `/start-trip` | StartTripPage | Driver's home screen. 6-tile grid: **Vehicle Select**, **Mark Attendance**, **Diesel**, **Documents**, **Advance**, **Settings**. Greeting card with driver name + photo. | reads from auth store |
| `/vehicle-select` | VehicleSelectPage | Searchable dropdown of trucks the driver is allowed to drive. On select: writes vehicle number to tripStore + posts trip-start event. | `GET /onboarding/vehicle-list-for-driver/:driverId`, `POST /trip/start` |
| `/driver-vehicle-onboarding` | DriverVehicleOnboardingPage | Vehicle detail card (vehicle number, type, last service km, next service due). Schedule date history modal showing past schedule changes. | `GET /onboarding/vehicle/:vehicleNumber` |

---

## 2. Attendance

| Route | Page | What you do | Backend |
|---|---|---|---|
| `/driver-attendance` | DriverAttendancePage | Single-tap **Mark Attendance** button + history list of last 10 marks with status badge | `GET /attendance/:driverId`, `POST /attendance/send` |
| `/driver-attendance-approval` | DriverAttendanceApprovalPage | (For drivers who are also team-leads — rare) Pending attendance Approve/Reject + search + manual refresh | `GET /attendance/pending`, `PUT /attendance/:id { status }` |

The base `/driver-attendance` is the typical driver path. The approval variant is gated by role.

---

## 3. Diesel & Documents

| Route | Page | What you do | Backend |
|---|---|---|---|
| `/diesel-tracking` | DieselTrackingPage | 19-column searchable table of past fills with derived metrics (km/litre, ₹/km, kmDiff). Read-only — fill entry happens in admin/supervisor app. | `GET /vehicle/diesel`, `GET /vehicle/diesel/by-month/:monthKey` |
| `/driver-document` | DriverDocumentPage | Toggle list (RC / Insurance / PUC / Tax / Fitness / Permit). Tapping a row opens an image preview overlay. Reads vehicleNumber from `tripStore` (set by `/vehicle-select`); fallback to `auth.driver.vehicleNumber`. | `GET /onboarding/vehicle-documents/:vehicleNumber` |

> **Note** — driver does not upload documents. Admin uploads them from `/vehicle-documents` in the admin app, driver only views them.

---

## 4. Advance & Leave & Payout

| Route | Page | What you do | Backend |
|---|---|---|---|
| `/driver-advance` | DriverAdvancePage | Request form (amount + reason) + history table of past requests with status. Submitting shows an optimistic "Pending" row before backend confirms. | `GET /advance/approved/:driverId`, `POST /advance/request` |
| `/driver-leave-request` | LeaveRequestPage | Form (start date / end date / reason) + history of past leaves with status | `GET /advance/leaves/:driverId`, `POST /advance/leaves` |
| `/driver-payout` | DriverPayoutPage | Read-only monthly payout summary: base salary + advances + deductions = net. Month picker. | `GET /advance/payout/:driverId/:month` |

---

## 5. Profile, Help, Refer, Settings

| Route | Page | What you do |
|---|---|---|
| `/my-profile` | MyProfilePage | View driver's own profile (name, phone, address, DL, bank). Read-only — admin edits. |
| `/setting` | SettingsPage | Profile banner + menu list (notifications toggle, language placeholder, logout, legal) |
| `/notification` | NotificationsPage | Empty-state placeholder (notifications feature is wired but not yet sending) |
| `/help` | HelpPage | FAQ accordion + contact card (call / WhatsApp the office) |
| `/refer-earn` | ReferAndEarnPage | Referral code + WhatsApp share button + earn-bonus copy |
| `/legal` | LegalPage | Index of legal sections (Terms / Privacy / Refund) |
| `/legal/:section` | LegalSectionPage | Dynamic-section page reused for every legal sub-route |

---

## Driver's typical flow (in order of taps)

1. Open app → `/login` → enter phone → tap **Send OTP**
2. `/otp-sent` → enter 6 digits → land on `/start-trip` (home)
3. Tap **Mark Attendance** → `/driver-attendance` → big green button → done, return to home
4. Tap **Vehicle Select** → `/vehicle-select` → pick truck → tripStore updated
5. (If checking documents) → tap **Documents** → `/driver-document` → preview each as image
6. (Mid-day, after fueling, if entering diesel from driver app) — but **driver app currently does NOT have a diesel-write path; admin/supervisor enters fills**. The diesel-tracking page is read-only.
7. (Mid-day) tap **Advance** → `/driver-advance` → request ₹500 → optimistic pending row appears
8. Wait for admin approval (push notification — when wired)
9. (Once a month) tap **Payout** → `/driver-payout` → see settled salary

---

## Adding data from the driver app

The driver app is **mostly read-from-backend / write-narrow-things**. Endpoints the driver app POSTs to:

| Endpoint | When |
|---|---|
| `POST /send-otp/phone`, `POST /send-otp/verify` | Login |
| `POST /attendance/send` | Mark attendance |
| `POST /advance/request` | Request advance |
| `POST /advance/leaves` | Request leave |
| `POST /trip/start` | Vehicle select (trip start event) |

Everything else is GET. This is intentional — drivers should not be entering complex data on a phone in the cab.

---

## How to add a new feature

1. Decide if it's a new tile on `/start-trip` or a sub-page of an existing module
2. Create the page at `src/features/<module>/pages/<Name>Page.tsx`
3. Add the route in `src/app/routes.tsx`
4. If new endpoint needed: add `<module>.api.ts` + `<module>.hooks.ts`
5. Add the tile on `StartTripPage` if top-level

## Common gotchas

- **`tripStore.vehicleNumber` is null until `/vehicle-select`** — pages that depend on it (Documents, Diesel) must guard against the null state
- **Geolocation requires HTTPS** — `npm run dev` over plain HTTP works on `localhost` only; deploying needs HTTPS
- **OTP expiry** — backend OTP module has a 5-min TTL; user sees "OTP expired" if they wait too long
- **Push notifications not yet wired** — driver currently has to refresh manually to see admin's advance approval
