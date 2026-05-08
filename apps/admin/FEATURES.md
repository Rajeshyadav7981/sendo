# sendo-ui-vite — Admin Feature Reference

The admin app is the back-office cockpit. **76 routes** organised into **8 modules**, accessed via the left sidebar.

> See `/Users/rajeshyadav/Documents/learn/PRODUCT_GUIDE.md` for the cross-app overview.

## 0. Auth pages (no sidebar)

| Route | Page | What it does | Backend |
|---|---|---|---|
| `/login` | LoginPage | Phone/email + password → JWT | `POST /api/login` |
| `/sign-in` | SignInPage | New-user sign-up | `POST /api/signup` |
| `/forgot-password` | ForgotPasswordPage | Email → OTP → reset (3 internal steps in one component) | `POST /send-otp/email`, `POST /send-otp/verify` |
| `/reset-password` | ResetPasswordPage | New password (after OTP) | `POST /api/reset-password` |

JWT stored in zustand auth store (`src/store/auth.store.ts`) with localStorage persist. 401 on any call clears store + redirects to `/login`.

---

## 1. Dashboard module

| Route | Page | Purpose |
|---|---|---|
| `/home` | HomePage | Top-level dashboard: fleet snapshot table, driver snapshot table, stat cards, live-GPS pie chart |
| `/dashboard-reports` | DashboardReportsPage | Financial KPIs: 6 stat tiles + recharts pie + bar + summary table; reads `/trip/trip-sheet`, `/vehicle/expenses`, `/onboarding/drivers`, `/onboarding/all-vehicles` |
| `/notification` | NotificationPage | 4 tabs (Eicher Live+ / After Market / Payments / Consent) with per-tab filters |
| `/my-profile` | MyProfilePage | Logged-in user's profile (Basic / Contact / Application sections + WhatsApp opt-in radio) |
| `/help-support` | HelpSupportPage | Quick-action grid + contact info + FAQ accordion |
| `/my-requests` | MyRequestPage | User's own outgoing requests with status badges |

---

## 2. Vehicle Management

| Route | Page | What you do | Backend |
|---|---|---|---|
| `/vehicle-management` | VehicleManagementPage | Tile launcher (6 tiles) | — |
| `/vehicle-onboarding` | VehicleOnboardingPage | Add a truck. Fields: vehicle no, make, model, year, type (HMV/LMV/MMV), permit (national / state / both), 8 doc uploads (RC/Insurance/PUC/Fitness/Permit/Tax/Pollution/Photo) + diesel schedule (interval/litres/km-per-litre/auto-km/actual-km). Inline records table + edit-schedule modal + CSV export. | `POST /onboarding/vehicle` (multipart), `GET /onboarding/all-vehicles`, `PATCH /onboarding/vehicle/:id/schedule` |
| `/vehicle-confirm` | VehicleConfirmationPage | Read-only review screen reached from onboarding before submit | submits via above |
| `/vehicle-documents` | VehicleDocumentsPage | Document list per vehicle. Filters (vehicle / doc type / month / year / status). Per-row Renew (replace file + new dates) + History modal. Status tag: Valid / Expiring / Expired. | `GET /onboarding/vehicle-documents`, `POST /onboarding/vehicle-document/renew` (multipart), `GET /onboarding/vehicle-document/:id/history` |
| `/diesel` | DieselPage | Daily diesel entries. Form auto-fills (start km from vehicle's last reading, totalKm computed, totalAmount = volume × rate). Slip photo upload with preview. Filter modes: all / day / month / year / range / vehicle. | `GET /vehicle/diesel`, `POST /vehicle/diesel` (multipart), `GET /vehicle/diesel/by-month/:monthKey`, `GET /vehicle/diesel/csv` |
| `/diesel-confirmation` | DieselConfirmationPage | Review screen with photo preview before submit | — |
| `/truck-maintenance` | TruckMaintenancePage | 8-tab maintenance hub: Regular Maintenance, Oil, Tyre, Battery, RTO, Spare, Inventory, Loan. Each tab has its own form schema + chip multi-select for service-type/positions/categories + conditional payment block (Cash / Credit / UPI / Card with mode + bank + txn-ref). Records table + search. | `POST /vehicle/maintenance`, `GET /vehicle/maintenance` |
| `/oil-confirmation`, `/spare-confirmation`, `/vehicleTyre-confirmation`, `/expense-confirmation` | confirmation pages | Final review before posting maintenance sub-records | submits to maintenance endpoints |
| `/live-fleet-tracking` | LiveFleetTrackingPage | Leaflet map with moving/stopped truck icons + popups + stats (Moving / Stopped / Total). Polls every 30s. | `GET /home/fetch-locations` (Wheelseye proxy) |
| `/expenses` | VehicleExpensesPage | Vehicle-specific expense entry (fuel-adjacent costs). Form (8 fields), summary cards (total / count / unique vehicles), search, sortable table. | `GET /vehicle/expenses`, `POST /vehicle/expenses` |

---

## 3. Driver Management

| Route | Page | What you do | Backend |
|---|---|---|---|
| `/driver-management` | DriverManagementPage | 9-tile dashboard | — |
| `/driver-onboarding` | DriverOnboardingPage | Add a driver. Multi-section form (Driver Details / Shift / Bank / Documents). Auto-incrementing driver ID (`DE0001`). 5 file uploads (profile pic / Aadhar / PAN / DL / passbook). Edit + delete + CSV download on the records table. 10-digit phone validation, file-type checks. | `POST /onboarding/driver` (multipart), `GET /onboarding/drivers`, `GET /onboarding/latest-driver-id`, `PUT /onboarding/driver/:id`, `DELETE /onboarding/drivers/:driverId` |
| `/driver-confirm` | DriverConfirmationPage | Review screen read from `useLocation().state.formData` | — |
| `/driver-onboarding-shift` | DriverShiftPage | Add-on shift override (different shift type than default) | `POST /onboarding/driver-addon-data` |
| `/driver-attendance-approval` | AttendanceApprovalPage | Pending attendance with inline Approve/Reject. Filter row (driver / date / status). Custom date parser. Status badges. CSV download. | `GET /attendance/pending`, `PUT /attendance/:id { status }` |
| `/attendance-records` | AttendanceRecordsPage | All attendance (any status). Status + attendance-type badges. CSV download. | `GET /attendance/all` |
| `/driver-leave-admin` | LeaveRequestPage | Pending + Processed split sections. Inline Approve/Reject with leave-type select. Edit-mode for reason. Delete confirm. | `GET /advance/leaves`, `PUT /advance/leaves/:id`, `DELETE /advance/leaves/:id` |
| `/driver-advance` | DriverAdvancePage | Pending advance requests with InputNumber-confirm modal (admin can edit approved amount). Manual advance entry form (admin-initiated, not driver-requested). Records table. | `GET /advance/pending`, `GET /advance/records`, `PUT /advance/:id { status, approvedAmount }`, `POST /advance/manual` |
| `/driver-deduction` | DriverDeductionPage | Two-step entry → confirmation flow. 11 fields. FleetVehicleSelect dropdown. | `GET /driver/deductions`, `POST /driver/deductions`, `DELETE /driver/deductions/:id` |
| `/driver-salary` | SalaryPage | Driver+month picker → payout summary card (base + advances + deductions = net) → **Approve Salary**. 18-column salary table with status filter + date range. | `GET /advance/payout/:driverId/:month`, `GET /advance/payout/all/:month`, `GET /advance/approve/:driverId/:month` |
| `/driver-timeSheet` | DriverTimeSheetPage | Duty timer with 1s tick. Start/Stop. Posts entry to timesheet. | `POST /onboarding/timesheet`, `GET /onboarding/timesheet` |
| `/driver-liveTracking` | DriverLiveTrackingPage | Per-driver geolocation history (last 15 entries, first row highlighted) | `navigator.geolocation.watchPosition` (browser-side) |
| `/vehicle-GPSIntegration` | VehicleGpsIntegrationPage | Polls every 5s, last-10 location history per vehicle | `GET /home/fetch-locations` |
| `/driver-vehicleTracking` | DriverVehicleTrackingPage | Multi-vehicle grid with selectable card detail view | `GET /home/fetch-locations`, `GET /home/history/:vehicleNumber` |

---

## 4. Vendor Management

| Route | Page | What you do | Backend |
|---|---|---|---|
| `/vendor-management` | VendorListPage | Tile-hub navigation + searchable Vendor table (PAN / IFSC / account / branch / PIN columns) | `GET /onboarding/vendors` |
| `/vendor-onboarding` | VendorOnboardingPage | Multi-section form: Basic / Address / Tax & Legal / Notes / Bank. 18 fields. Regex validation for PAN / IFSC / PIN / phone / email / supplier name. Navigates to `/vendor-confirm`. | `POST /onboarding/vendor` |
| `/vendor-confirm` | VendorConfirmationPage | Read-only review of all 18 fields. Submit posts to backend. | — |
| `/trip-sheet` | TripSheetPage | Inline 14-field form. Auto-calculated balance freight. Status badges (green/blue/red/gold). Search. | `GET /trip/trip-sheet`, `POST /trip/trip-sheet` |
| `/advance` | VendorAdvancePage | Vendor advance entry (advance type, payment mode, status). Status badges. Record count. | `POST /advance/vendor-advance`, `GET /advance/vendor-advance` |
| `/deduction` | VendorDeductionPage | Vendor deduction (deduction type select). | `POST /advance/vendor-deduction`, `GET /advance/vendor-deduction` |
| `/payment` | VendorPaymentPage | 12-field form with auto-calculated net amount. Payment-mode + status selects with full options. | `POST /advance/vendor-payment`, `GET /advance/vendor-payment` |

---

## 5. Customer Management

| Route | Page | What you do | Backend |
|---|---|---|---|
| `/customer-management` | CustomerListPage | Customer table with Rate-card column. Search by company / contact / GST. | `GET /customer/list` |
| `/customer-onboarding` | CustomerOnboardingPage | Multi-section (Company / Tax). Validation regex for alphanumeric, alpha, phone, email, GST, rate. Clear / Continue → `/customer-confirm`. | `POST /customer/onboarding` |
| `/customer-confirm` | CustomerConfirmationPage | Two-step flow target. Posts to backend on Submit. | — |
| `/agreement` | AgreementPage | Add-agreement form (9 fields + terms textarea). Agreement-type + status selects. Status badges. | `GET /customer/agreements`, `POST /customer/agreements` |
| `/invoice` | InvoicePage | Form with tripFrom/tripTo, auto-totalAmount calc, status select. Table with 11 legacy columns + status badges. | `GET /customer/invoices`, `POST /customer/invoices` |
| `/payment-status` | PaymentStatusPage | 3 summary cards (invoiced / received / pending). Form with auto-balance, payment mode + status selects, remarks/UTR. | `GET /customer/payment-status`, `POST /customer/payment-status` |
| `/gst-file` | GstFilePage | 3 summary cards (GST collected / total entries / filed-ratio). Auto totalGST + totalAmount. Filing-status select. | `GET /customer/gst`, `POST /customer/gst` |
| `/mis` | MisPage | Customer-side MIS reports (read-only) | `GET /customer/mis` |

---

## 6. Expense Management

| Route | Page | What you do |
|---|---|---|
| `/expenses-management` | ExpensesManagementPage | Overview tile grid: Vehicle Expenses + Other Expenses |
| `/vehicle-expenses` | VehicleExpensesPage | Same as `/expenses` — fuel-adjacent vehicle costs |
| `/others` | OtherExpensesPage | Category-driven non-vehicle expenses (office, salary advance, misc) |

Both use `GET/POST /vehicle/expenses` with a `category` discriminator.

---

## 7. Employee Management

13 routes covering back-office staff (the people who use the supervisor app, not drivers).

| Route | Page | What you do | Backend |
|---|---|---|---|
| `/employee-management` | EmployeeManagementPage | 12-tile dashboard | — |
| `/employee-list` | EmployeeListPage | Search / edit / delete + CSV download | `GET /api/employees`, `PUT /api/employees/:name`, `DELETE /api/employees/:name` |
| `/employee-add` | AddEmployeePage | Form (name / password / role / phone / email) | `POST /api/employees` |
| `/employee-passwords` | EmployeePasswordsPage | Common-password mode + per-employee inline password set | `PUT /api/employees/:name { password }` |
| `/employee-attendance` | EmployeeAttendancePage | Pending with Approve/Reject + filters + CSV | `GET /attendance/all` (filtered) |
| `/employee-att-records` | EmployeeAttendanceRecordsPage | All records | `GET /attendance/all` |
| `/employee-leave` | EmployeeLeaveRequestsPage | Pending + processed split tables, leave-type select, edit/delete | `GET /advance/leaves` |
| `/employee-advance` | EmployeeAdvancePage | Pending with InputNumber-confirm approve modal + records + manual form | `GET /advance/pending`, `POST /advance/manual` |
| `/employee-salary` | EmployeeSalaryPage | Month picker, single-driver detail card, all-employees table, approve | `GET /advance/payout/all/:month` |
| `/employee-deduction` | EmployeeDeductionPage | Form + table + delete | `GET /advance/deductions`, `POST /advance/deductions`, `DELETE /advance/deductions/:id` |
| `/employee-escalations` | EmployeeEscalationsPage | Vehicle/status filters, add form with multi-tag select, list cards, mark-resolved/reopen/delete | `GET /api/escalations`, `POST /api/escalations`, `PATCH /api/escalations/:id`, `DELETE /api/escalations/:id` |
| `/employee-schedule` | EmployeeScheduleConfigPage | 48-vehicle inline-editable table with localStorage cache, save-all/clear-all | `GET /api/schedule`, `POST /api/schedule/bulk` |
| `/employee-timesheet` | EmployeeTimesheetPage | Live timer with start/stop/save, records table | `POST /onboarding/timesheet` |

---

## 8. Tracker Admin module

Power-user data-entry screens that overlap with the supervisor app — same `/api/*` backend endpoints.

| Route | Page | What you do | Backend |
|---|---|---|---|
| `/tracker-admin` | TrackerAdminPage | 4-tab admin panel: Data Management (Add Entry / Migration / Schedule / Employees) + Escalations + Vehicle Performance | `/api/fills`, `/api/employees`, `/api/escalations` |
| `/tracker-dashboard` | TrackerDashboardPage | Fleet overview: 5 stat cards, filters, recharts bar+pie, vehicle performance table | `/api/fills/all`, `/onboarding/all-vehicles` |
| `/monthly-data-entry` | MonthlyDataEntryPage | Excel-like editable grid (18 cols, formula-derived totalKm/actualKmL/expKm/actualKm/kmDiff). Undo/redo. Sortable headers. CSV export with column picker. Excel import via dynamic XLSX CDN. | `GET /api/fills/:monthKey`, `POST /api/fills/bulk` |

---

## How to add a new feature

1. Add route in `src/app/routes.tsx` (lazy-import the page)
2. Create page at `src/features/<module>/pages/<Name>Page.tsx`
3. If new endpoint needed, add to `src/features/<module>/<module>.api.ts` (function) + `<module>.hooks.ts` (TanStack Query hook)
4. Add sidebar link in `src/shared/layouts/sidebar-config.ts`
5. Add smoke-test entry in `src/tests/smoke/routes.smoke.test.tsx` (often automatic via the route enumeration)

## Common gotchas

- **Form submits raw `''` strings to backend** — use `Object.fromEntries(Object.entries(form).filter(([_, v]) => v !== ''))` before posting, otherwise NestJS validation rejects empty optional fields
- **antd `<Select>` doesn't fire `onChange` for empty value** — pass `allowClear` and handle `undefined` explicitly
- **antd `<DatePicker>` returns Dayjs, not Date** — call `.toISOString()` or `.format('YYYY-MM-DD')` before posting
- **Multipart upload** — use `apiClient.postForm()`, not `apiClient.post()`, otherwise `Content-Type` is wrong
