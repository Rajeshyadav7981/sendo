#!/usr/bin/env bash
# Cross-app regression test for the Sendo platform.
#
# Phases:
#   1. Bootstrap   — login as admin, ensure customer + vehicle + driver exist.
#   2. Driver      — every action a driver performs in vehicleApp-vite.
#   3. Admin       — assert the driver's data is visible in sendo-ui-vite GETs.
#   4. Supervisor  — every action a supervisor performs in superviser-app-vite.
#   5. Cross-check — admin sees supervisor's tracker data; supervisor sees admin's vehicles.
#   6. Realtime    — quick GPS ping smoke test.
#   7. Upload      — global /upload + /upload/url smoke test.
#
# Usage:  bash test/regression-e2e.sh [--base-url http://localhost:5001]
#
# Requirements: backend running, jq, curl. Postgres reachable from the backend.

set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:5001}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@sendo.local}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-ChangeMe!123}"
EMP_PASSWORD="${EMPLOYEE_TRACKER_PASSWORD:-tracker123}"
RUN_ID="$(date +%s)"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

# Parse flags
while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-url) BASE_URL="$2"; shift 2 ;;
    --help|-h)
      echo "Usage: bash $0 [--base-url URL]"; exit 0 ;;
    *) echo "Unknown flag: $1"; exit 2 ;;
  esac
done

# ── Pretty print helpers ─────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
PASS_COUNT=0
FAIL_COUNT=0
FAILURES=()

phase()  { printf "\n${CYAN}━━━ %s ━━━${NC}\n" "$*"; }
info()   { printf "${YELLOW}→ %s${NC}\n" "$*"; }
pass()   { printf "${GREEN}  ✓ %s${NC}\n" "$*"; PASS_COUNT=$((PASS_COUNT+1)); }
fail()   { printf "${RED}  ✗ %s${NC}\n" "$*"; FAIL_COUNT=$((FAIL_COUNT+1)); FAILURES+=("$*"); }

# ── HTTP helpers ─────────────────────────────────────────────────────────────
# All requests go through these so the cookie jar / headers stay consistent.

req() {
  # req METHOD URL [JSON_BODY] [EXTRA_CURL_ARGS...]
  local method="$1" url="$2" body="${3:-}"
  shift 3 2>/dev/null || shift $#
  local args=( -sS -w '\n%{http_code}' -X "$method" -b "$COOKIE_JAR" -c "$COOKIE_JAR" )
  if [[ -n "$body" ]]; then
    args+=( -H 'Content-Type: application/json' -d "$body" )
  fi
  args+=( "$@" )
  curl "${args[@]}" "$BASE_URL$url"
}

req_emp() {
  # tracker endpoint with x-emp-password header (no cookies)
  local method="$1" url="$2" body="${3:-}"
  local args=( -sS -w '\n%{http_code}' -X "$method"
               -H "x-emp-password: $EMP_PASSWORD" )
  if [[ -n "$body" ]]; then
    args+=( -H 'Content-Type: application/json' -d "$body" )
  fi
  curl "${args[@]}" "$BASE_URL$url"
}

# Split a `req` response into status + body.
status_of() { tail -n1 <<<"$1"; }
body_of()   { sed '$d' <<<"$1"; }

# Assertions
expect_status() {
  # expect_status RESPONSE EXPECTED_CODE LABEL
  local got
  got="$(status_of "$1")"
  if [[ "$got" == "$2" ]]; then
    pass "$3 (HTTP $got)"
  else
    fail "$3 — expected HTTP $2, got $got. Body: $(body_of "$1" | head -c 200)"
  fi
}

expect_jq() {
  # expect_jq BODY JQ_FILTER LABEL
  # Auto-unwraps {items: [...]} paginated shape so list filters keep working.
  local body="$1" filter="$2" label="$3"
  local probe="if type==\"object\" and has(\"items\") then .items else . end | $filter"
  if echo "$body" | jq -e "$probe" >/dev/null 2>&1; then
    pass "$label"
  else
    fail "$label — filter '$filter' did not match. Body: $(echo "$body" | head -c 200)"
  fi
}

# Pre-flight
command -v jq >/dev/null || { echo "jq required (brew install jq)"; exit 2; }
phase "Pre-flight"
ping_resp="$(curl -sS -o /dev/null -w '%{http_code}' "$BASE_URL/health" || echo 'down')"
if [[ "$ping_resp" == "200" ]]; then
  pass "backend reachable at $BASE_URL"
else
  fail "backend health-check failed ($ping_resp). Start it with: cd sendo-backend-nest && npm run start:dev"
  echo
  echo "Aborting — backend is not running."
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# Phase 1 — Bootstrap
# ─────────────────────────────────────────────────────────────────────────────
phase "Phase 1 — Bootstrap (login, fixtures)"

R="$(req POST /api/login "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")"
expect_status "$R" "200" "admin login"
expect_jq "$(body_of "$R")" '.user.role == "ADMIN"' "login response includes admin user"

# Fixtures — created with run-id suffix so reruns don't collide.
DRIVER_ID="DR$RUN_ID"
DRIVER_NAME="Test Driver $RUN_ID"
VEHICLE_NUMBER="TST-$RUN_ID"
CUSTOMER_NAME="TestCo$RUN_ID"
MONTH_KEY="$(date +%Y-%m)"
DATE_KEY="$(date +%Y-%m-%d)"

info "Creating customer ($CUSTOMER_NAME)"
R="$(req POST /customer/onboarding "$(cat <<EOF
{
  "companyName": "$CUSTOMER_NAME",
  "address": "1 Test Lane",
  "pointOfContact": "Reg Test",
  "state": "Karnataka",
  "phoneNumber": "9876543210",
  "emailId": "test+$RUN_ID@example.com",
  "gstNumber": "29ABCDE1234F1Z5",
  "rateCard": "default"
}
EOF
)")"
expect_status "$R" "201" "create customer"

info "Creating vehicle ($VEHICLE_NUMBER)"
R="$(req POST /onboarding/vehicle "$(cat <<EOF
{
  "vehicleNumber": "$VEHICLE_NUMBER",
  "registerName": "Test Owner",
  "vehicleType": "Truck",
  "grossVehicleWeight": "12000",
  "registrationDate": "2024-01-01",
  "fitnessValidUpto": "2027-01-01",
  "taxValidUpto": "2027-01-01",
  "insuranceValidUpto": "2027-01-01",
  "pollutionValidUpto": "2027-01-01",
  "nationalPermit": "Yes",
  "temporaryPermit": "No",
  "statePermit": "No"
}
EOF
)")"
# vehicle endpoint is multipart-only in onboarding; if it 415s we fall back to skip
VEHICLE_STATUS="$(status_of "$R")"
if [[ "$VEHICLE_STATUS" == "201" || "$VEHICLE_STATUS" == "200" ]]; then
  pass "create vehicle (HTTP $VEHICLE_STATUS)"
else
  info "vehicle onboarding returned $VEHICLE_STATUS (likely multipart-only) — using existing vehicle if any"
  R2="$(req GET /onboarding/vehicleList)"
  EXISTING_VEHICLE="$(body_of "$R2" | jq -r '.[0].vehicleNumber // empty' 2>/dev/null)"
  if [[ -n "$EXISTING_VEHICLE" ]]; then
    VEHICLE_NUMBER="$EXISTING_VEHICLE"
    pass "reusing existing vehicle: $VEHICLE_NUMBER"
  else
    fail "no vehicle available — create one in admin app first"
  fi
fi

info "Creating driver ($DRIVER_ID via JSON addon endpoint)"
R="$(req POST /onboarding/driver-addon-data "$(cat <<EOF
{
  "driverId": "$DRIVER_ID",
  "shiftType": "Shift A",
  "state": "Karnataka",
  "referBy": "regression-test"
}
EOF
)")"
expect_status "$R" "201" "create driver"

info "Assigning driver $DRIVER_ID to vehicle $VEHICLE_NUMBER"
R="$(req POST /onboarding/assign-vehicle "{\"driverId\":\"$DRIVER_ID\",\"vehicleNumber\":\"$VEHICLE_NUMBER\",\"isPrimary\":true}")"
expect_status "$R" "201" "assign vehicle"

# ─────────────────────────────────────────────────────────────────────────────
# Phase 2 — Driver actions (vehicleApp-vite calls these)
# ─────────────────────────────────────────────────────────────────────────────
phase "Phase 2 — Driver actions"

info "Driver: GET /onboarding/vehicle-list-for-driver/:driverId (driver app loads this on home)"
R="$(req GET "/onboarding/vehicle-list-for-driver/$DRIVER_ID")"
expect_status "$R" "200" "driver fetches assigned vehicle list"
expect_jq "$(body_of "$R")" ".vehicles | map(.vehicleNumber) | index(\"$VEHICLE_NUMBER\") != null" \
  "  → response contains the assigned vehicle"

info "Driver: POST /attendance/send (Mark Attendance)"
R="$(req POST /attendance/send "$(cat <<EOF
{
  "driverId": "$DRIVER_ID",
  "driverName": "$DRIVER_NAME",
  "vehicleNumber": "$VEHICLE_NUMBER",
  "startTime": "09:00",
  "stopTime": "18:00",
  "duration": "9h",
  "driverShiftLabel": "Shift A"
}
EOF
)")"
expect_status "$R" "201" "mark attendance"
ATT_ID="$(body_of "$R" | jq -r '._id // empty')"

info "Driver: POST /trip/start-trip (Start Trip)"
R="$(req POST /trip/start-trip "{\"driverId\":\"$DRIVER_ID\",\"vehicleNumber\":\"$VEHICLE_NUMBER\"}")"
expect_status "$R" "201" "start trip"

info "Driver: POST /vehicle/diesel (Diesel Tracking)"
R="$(req POST /vehicle/diesel "$(cat <<EOF
{
  "date": "${DATE_KEY}T08:00:00.000Z",
  "vehicleNumber": "$VEHICLE_NUMBER",
  "driverName": "$DRIVER_NAME",
  "pumpName": "Test Pump",
  "fuelType": "Diesel",
  "volume": 50,
  "ratePerLiter": 95,
  "totalAmount": 4750,
  "amount": 4750,
  "startKm": 10000,
  "endKm": 10250,
  "totalKm": 250,
  "mileage": 5,
  "paymentMode": "Cash",
  "paidBy": "Driver"
}
EOF
)")"
expect_status "$R" "201" "submit diesel entry"

info "Driver: POST /advance/request (Request Advance ₹500)"
R="$(req POST /advance/request "$(cat <<EOF
{
  "driverId": "$DRIVER_ID",
  "driverName": "$DRIVER_NAME",
  "month": "$MONTH_KEY",
  "requestedAmount": 500
}
EOF
)")"
expect_status "$R" "201" "request advance"
ADVANCE_ID="$(body_of "$R" | jq -r '.data.id // empty')"

info "Driver: POST /advance/leaves (Request Leave)"
R="$(req POST /advance/leaves "$(cat <<EOF
{
  "driverId": "$DRIVER_ID",
  "startDate": "$DATE_KEY",
  "endDate": "$DATE_KEY",
  "reason": "regression test leave"
}
EOF
)")"
expect_status "$R" "201" "request leave"

info "Driver: POST /trip/trip-sheet (submit Trip Sheet with POD/loading slip key)"
R="$(req POST /trip/trip-sheet "$(cat <<EOF
{
  "tripNumber": "TRIP-$RUN_ID",
  "vehicleNumber": "$VEHICLE_NUMBER",
  "driverName": "$DRIVER_NAME",
  "origin": "Bangalore",
  "destination": "Hyderabad",
  "loadingDate": "${DATE_KEY}T07:00:00.000Z",
  "unloadingDate": "${DATE_KEY}T19:00:00.000Z",
  "material": "Cement",
  "weight": 8000,
  "freight": 25000,
  "advancePaid": 5000,
  "balanceFreight": 20000
}
EOF
)")"
expect_status "$R" "201" "submit trip sheet"

info "Driver: POST /home/ping (GPS update — new realtime endpoint)"
R="$(req POST /home/ping "$(cat <<EOF
{
  "vehicleNumber": "$VEHICLE_NUMBER",
  "driverId": "$DRIVER_ID",
  "lat": 12.9716,
  "lng": 77.5946,
  "speedKmph": 42,
  "ignitionOn": true
}
EOF
)")"
expect_status "$R" "201" "GPS ping"

info "Driver: POST /trip/stop-trip"
R="$(req POST /trip/stop-trip "{\"driverId\":\"$DRIVER_ID\"}")"
# stop-trip can return 200 or 201 depending on how the controller decorates it
S="$(status_of "$R")"
if [[ "$S" == "200" || "$S" == "201" ]]; then pass "stop trip (HTTP $S)"
else fail "stop trip — got $S"; fi

# ─────────────────────────────────────────────────────────────────────────────
# Phase 3 — Admin sees driver's data (sendo-ui-vite GETs)
# ─────────────────────────────────────────────────────────────────────────────
phase "Phase 3 — Admin sees driver's data"

info "Admin: GET /attendance/all"
R="$(req GET /attendance/all)"
expect_status "$R" "200" "list attendance"
expect_jq "$(body_of "$R")" \
  "map(select(.driverId == \"$DRIVER_ID\")) | length >= 1" \
  "  → attendance for $DRIVER_ID is in the list"

info "Admin: GET /attendance/pending"
R="$(req GET /attendance/pending)"
expect_status "$R" "200" "list pending attendance"
expect_jq "$(body_of "$R")" \
  "map(select(.driverId == \"$DRIVER_ID\")) | length >= 1" \
  "  → pending attendance includes $DRIVER_ID"

info "Admin: GET /advance/pending"
R="$(req GET /advance/pending)"
expect_status "$R" "200" "list pending advances"
expect_jq "$(body_of "$R")" \
  "map(select(.driverId == \"$DRIVER_ID\")) | length >= 1" \
  "  → pending advance for $DRIVER_ID present"

info "Admin: GET /advance/leaves"
R="$(req GET /advance/leaves)"
expect_status "$R" "200" "list leave requests"
expect_jq "$(body_of "$R")" \
  "map(select(.driverId == \"$DRIVER_ID\")) | length >= 1" \
  "  → leave for $DRIVER_ID present"

info "Admin: GET /vehicle/diesel"
R="$(req GET /vehicle/diesel)"
expect_status "$R" "200" "list diesel entries"
expect_jq "$(body_of "$R")" \
  "map(select(.vehicleNumber == \"$VEHICLE_NUMBER\")) | length >= 1" \
  "  → diesel entry for $VEHICLE_NUMBER present"

info "Admin: GET /trip/trip-sheet"
R="$(req GET /trip/trip-sheet)"
expect_status "$R" "200" "list trip sheets"
expect_jq "$(body_of "$R")" \
  "map(select(.tripNumber == \"TRIP-$RUN_ID\")) | length >= 1" \
  "  → trip sheet TRIP-$RUN_ID present"

info "Admin: GET /home/fetch-locations (live fleet map data)"
R="$(req GET /home/fetch-locations)"
expect_status "$R" "200" "fetch live locations"
expect_jq "$(body_of "$R")" \
  "map(select(.vehicleNumber == \"$VEHICLE_NUMBER\")) | length >= 1" \
  "  → live location for $VEHICLE_NUMBER present"

info "Admin: GET /onboarding/drivers (driver appears in roster)"
R="$(req GET /onboarding/drivers)"
expect_status "$R" "200" "list drivers"
expect_jq "$(body_of "$R")" \
  "map(select(.driverId == \"$DRIVER_ID\")) | length >= 1" \
  "  → driver $DRIVER_ID appears in roster"

# Admin approves the advance — verifies the approval flow round-trips.
if [[ -n "$ADVANCE_ID" ]]; then
  info "Admin: POST /advance/approve (approve the driver's advance)"
  R="$(req POST /advance/approve "$(cat <<EOF
{
  "advanceId": "$ADVANCE_ID",
  "status": "Approved",
  "approvedAmount": 400,
  "adminName": "Reg Test"
}
EOF
)")"
  expect_status "$R" "201" "approve advance"

  info "Driver: GET /advance/approved/:driverId (driver sees the approval)"
  R="$(req GET "/advance/approved/$DRIVER_ID")"
  expect_status "$R" "200" "driver fetches approved advances"
  expect_jq "$(body_of "$R")" \
    'map(select(.approvalStatus == "Approved" and (.approvedAmount | tonumber) >= 400)) | length >= 1' \
    "  → approval round-trips back to the driver"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Phase 4 — Supervisor actions (superviser-app-vite calls these)
# ─────────────────────────────────────────────────────────────────────────────
phase "Phase 4 — Supervisor actions"

info "Supervisor: POST /api/auth/employee (validate employee password)"
R="$(req_emp POST /api/auth/employee "{\"password\":\"$EMP_PASSWORD\"}")"
expect_status "$R" "200" "employee password auth"

info "Supervisor: POST /api/employees (create employee record)"
EMP_NAME="Sup$RUN_ID"
R="$(req_emp POST /api/employees "{\"name\":\"$EMP_NAME\",\"role\":\"manager\",\"phone\":\"9876543210\"}")"
S="$(status_of "$R")"
if [[ "$S" == "201" || "$S" == "200" ]]; then pass "create employee record (HTTP $S)"
else fail "create employee record — got $S"; fi

info "Supervisor: POST /api/schedule/bulk (per-vehicle fuel schedule)"
R="$(req_emp POST /api/schedule/bulk "$(cat <<EOF
{
  "configs": [
    {
      "vehicle": "$VEHICLE_NUMBER",
      "intervalDays": 7,
      "litres": 200,
      "kmPerLitre": 4.5,
      "kmPerFill": 900,
      "actualKm": 850
    }
  ]
}
EOF
)")"
expect_status "$R" "201" "upsert schedule"

info "Supervisor: POST /api/fills (single fill entry)"
R="$(req_emp POST /api/fills "$(cat <<EOF
{
  "monthKey": "$MONTH_KEY",
  "vehicle": "$VEHICLE_NUMBER",
  "dateKey": "$DATE_KEY",
  "startKm": 10000,
  "endKm": 10250,
  "litres": 50.5,
  "rate": 95,
  "totalAmount": 4798
}
EOF
)")"
expect_status "$R" "201" "create fill"

info "Supervisor: POST /api/escalations (raise concern about vehicle)"
R="$(req_emp POST /api/escalations "$(cat <<EOF
{
  "vehicle": "$VEHICLE_NUMBER",
  "category": "Engine",
  "severity": "high",
  "note": "Engine knocking — regression run $RUN_ID",
  "raisedBy": "Reg Test"
}
EOF
)")"
expect_status "$R" "201" "create escalation"
ESC_ID="$(body_of "$R" | jq -r '.id // empty')"

info "Supervisor: POST /api/odometer/:vehicle (daily odometer)"
R="$(req_emp POST "/api/odometer/$VEHICLE_NUMBER" "{\"dateKey\":\"$DATE_KEY\",\"reading\":10250}")"
expect_status "$R" "201" "create odometer entry"

# ─────────────────────────────────────────────────────────────────────────────
# Phase 5 — Supervisor sees own data + admin sees tracker data
# ─────────────────────────────────────────────────────────────────────────────
phase "Phase 5 — Supervisor reads back, admin sees tracker data"

info "Supervisor: GET /api/employees"
R="$(req_emp GET /api/employees)"
expect_status "$R" "200" "list employees"
expect_jq "$(body_of "$R")" \
  "map(select(.name == \"$EMP_NAME\")) | length >= 1" \
  "  → $EMP_NAME present in employee list"

info "Supervisor: GET /api/schedule"
R="$(req_emp GET /api/schedule)"
expect_status "$R" "200" "list schedule"
expect_jq "$(body_of "$R")" \
  "map(select(.vehicle == \"$VEHICLE_NUMBER\")) | length >= 1" \
  "  → schedule for $VEHICLE_NUMBER present"

info "Supervisor: GET /api/fills/all"
R="$(req_emp GET /api/fills/all)"
expect_status "$R" "200" "list all fills"
expect_jq "$(body_of "$R")" \
  "map(select(.vehicle == \"$VEHICLE_NUMBER\" and .monthKey == \"$MONTH_KEY\")) | length >= 1" \
  "  → fill for $VEHICLE_NUMBER/$MONTH_KEY present"

info "Supervisor: GET /api/escalations"
R="$(req_emp GET /api/escalations)"
expect_status "$R" "200" "list escalations"
expect_jq "$(body_of "$R")" \
  "map(select(.vehicle == \"$VEHICLE_NUMBER\" and .severity == \"high\")) | length >= 1" \
  "  → high-severity escalation for $VEHICLE_NUMBER present"

info "Supervisor: GET /api/odometer/:vehicle"
R="$(req_emp GET "/api/odometer/$VEHICLE_NUMBER")"
expect_status "$R" "200" "list odometer entries"
expect_jq "$(body_of "$R")" \
  "map(select(.dateKey == \"$DATE_KEY\" and .reading == 10250)) | length >= 1" \
  "  → odometer reading for $DATE_KEY present"

# Admin's tracker module hits the same endpoints with the employee password,
# so we re-verify that the just-created escalation is queryable from there.
info "Admin tracker module: GET /api/escalations (with emp password) sees new escalation"
R="$(req_emp GET /api/escalations)"
expect_status "$R" "200" "admin tracker GET /api/escalations"
expect_jq "$(body_of "$R")" \
  "map(select(.vehicle == \"$VEHICLE_NUMBER\")) | length >= 1" \
  "  → admin tracker page sees the supervisor's escalation"

info "Resolve the escalation"
if [[ -n "$ESC_ID" ]]; then
  R="$(req_emp PATCH "/api/escalations/$ESC_ID" '{"status":"resolved","note":"resolved by regression"}')"
  S="$(status_of "$R")"
  if [[ "$S" == "200" || "$S" == "201" ]]; then pass "resolve escalation (HTTP $S)"
  else fail "resolve escalation — got $S"; fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Phase 6 — Realtime smoke (gateway accepts an admin connection)
# ─────────────────────────────────────────────────────────────────────────────
phase "Phase 6 — Realtime gateway handshake"

# Socket.IO speaks an HTTP polling handshake at /socket.io/?EIO=4&transport=polling
HANDSHAKE_URL="$BASE_URL/socket.io/?EIO=4&transport=polling"
R_RAW="$(curl -sS -o /dev/null -w '%{http_code}' "$HANDSHAKE_URL" || echo 'down')"
if [[ "$R_RAW" == "200" ]]; then
  pass "socket.io handshake reachable (HTTP 200)"
else
  fail "socket.io handshake — expected 200, got $R_RAW"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Phase 7 — Global upload API
# ─────────────────────────────────────────────────────────────────────────────
phase "Phase 7 — Global upload + URL resolution"

TMP_FILE="$(mktemp)"
echo "regression test payload $RUN_ID" > "$TMP_FILE"
R="$(curl -sS -w '\n%{http_code}' -X POST "$BASE_URL/upload?subdir=regression" -F "file=@$TMP_FILE;filename=test.txt")"
expect_status "$R" "201" "upload single file"
KEY="$(body_of "$R" | jq -r '.files[0].key // empty')"
if [[ -n "$KEY" ]]; then
  pass "  → got storage key: $KEY"
else
  fail "  → /upload returned no key"
fi

if [[ -n "$KEY" ]]; then
  R="$(curl -sS -w '\n%{http_code}' "$BASE_URL/upload/url?key=$(printf %s "$KEY" | sed 's/ /%20/g')")"
  expect_status "$R" "200" "resolve URL for stored key"
  expect_jq "$(body_of "$R")" '.url != null and (.url | test("^https?://"))' \
    "  → resolved URL has a scheme"
fi
rm -f "$TMP_FILE"

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
phase "Summary"
echo "Run ID:      $RUN_ID"
echo "Driver:      $DRIVER_ID"
echo "Vehicle:     $VEHICLE_NUMBER"
echo "Trip:        TRIP-$RUN_ID"
echo "Customer:    $CUSTOMER_NAME"
echo "Employee:    $EMP_NAME"
echo
printf "${GREEN}PASSED: %d${NC}    ${RED}FAILED: %d${NC}\n" "$PASS_COUNT" "$FAIL_COUNT"
if (( FAIL_COUNT > 0 )); then
  echo
  echo "Failures:"
  for f in "${FAILURES[@]}"; do printf "  ${RED}•${NC} %s\n" "$f"; done
  exit 1
fi
echo
echo "All checks passed."
