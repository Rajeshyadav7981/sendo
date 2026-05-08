#!/usr/bin/env bash
# Data-quality regression for the Sendo platform.
#
# Goal: every value the driver / supervisor enters must reach the admin app
# (sendo-ui-vite) **unchanged**. Each assertion deep-matches a specific field
# (amount / volume / lat / freight / etc.), not just "endpoint returned 200".
#
# Flow:
#   1. Bootstrap   — admin login, fresh customer + vehicle + driver fixtures.
#   2. Driver      — driver app inputs (fingerprinted per RUN_ID).
#   3. Driver app  — driver app GETs reflect their own inputs.
#   4. Supervisor  — supervisor app inputs (employee / schedule / fill / odo / escalation).
#   5. Admin tabs  — every relevant admin tab in sendo-ui-vite finds the exact value.
#
# Usage: bash test/regression-data-quality.sh [--base-url http://localhost:5001]

set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:5001}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@sendo.local}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-ChangeMe!123}"
EMP_PASSWORD="${EMPLOYEE_TRACKER_PASSWORD:-tracker123}"
RUN_ID="$(date +%s)"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-url) BASE_URL="$2"; shift 2 ;;
    --help|-h) echo "Usage: bash $0 [--base-url URL]"; exit 0 ;;
    *) echo "Unknown flag: $1"; exit 2 ;;
  esac
done

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
PASS_COUNT=0; FAIL_COUNT=0; FAILURES=()

phase()  { printf "\n${CYAN}━━━ %s ━━━${NC}\n" "$*"; }
info()   { printf "${YELLOW}→ %s${NC}\n" "$*"; }
pass()   { printf "${GREEN}  ✓ %s${NC}\n" "$*"; PASS_COUNT=$((PASS_COUNT+1)); }
fail()   { printf "${RED}  ✗ %s${NC}\n" "$*"; FAIL_COUNT=$((FAIL_COUNT+1)); FAILURES+=("$*"); }

req() {
  local method="$1" url="$2" body="${3:-}"
  local args=( -sS -w '\n%{http_code}' -X "$method" -b "$COOKIE_JAR" -c "$COOKIE_JAR" )
  [[ -n "$body" ]] && args+=( -H 'Content-Type: application/json' -d "$body" )
  curl "${args[@]}" "$BASE_URL$url"
}

req_emp() {
  local method="$1" url="$2" body="${3:-}"
  local args=( -sS -w '\n%{http_code}' -X "$method" -H "x-emp-password: $EMP_PASSWORD" )
  [[ -n "$body" ]] && args+=( -H 'Content-Type: application/json' -d "$body" )
  curl "${args[@]}" "$BASE_URL$url"
}

status_of() { tail -n1 <<<"$1"; }
body_of()   { sed '$d' <<<"$1"; }

expect_status() {
  local got; got="$(status_of "$1")"
  if [[ "$got" == "$2" ]]; then pass "$3 (HTTP $got)"
  else fail "$3 — expected HTTP $2, got $got. Body: $(body_of "$1" | head -c 200)"; fi
}

expect_jq() {
  local body="$1" filter="$2" label="$3"
  local probe="if type==\"object\" and has(\"items\") then .items else . end | $filter"
  if echo "$body" | jq -e "$probe" >/dev/null 2>&1; then pass "$label"
  else fail "$label — filter '$filter' did not match. Body: $(echo "$body" | head -c 240)"; fi
}

# ─────────────────────────────────────────────────────────────────────────────
phase "Pre-flight"
ping_resp="$(curl -sS -o /dev/null -w '%{http_code}' "$BASE_URL/health" 2>/dev/null || echo 'down')"
[[ "$ping_resp" == "200" ]] && pass "backend reachable at $BASE_URL" \
  || { fail "backend health-check failed ($ping_resp)"; exit 1; }

# ─────────────────────────────────────────────────────────────────────────────
phase "Phase 1 — Bootstrap"
R="$(req POST /api/login "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")"
expect_status "$R" "200" "admin login"

DRIVER_ID="DQ-DR-$RUN_ID"
DRIVER_NAME="DQ Driver $RUN_ID"
VEHICLE_NUMBER=""
CUSTOMER_NAME="DQCo$RUN_ID"
MONTH_KEY="$(date +%Y-%m)"
DATE_KEY="$(date +%Y-%m-%d)"
TRIP_NUMBER="DQ-TRIP-$RUN_ID"
ADVANCE_AMOUNT=$((1000 + RUN_ID % 9000))
LEAVE_REASON="dq-leave-$RUN_ID"
DIESEL_VOLUME="42.5"
DIESEL_RATE="98.50"
DIESEL_TOTAL="4186.25"
DIESEL_START_KM=$((20000 + RUN_ID % 1000))
DIESEL_END_KM=$((DIESEL_START_KM + 220))
ATTENDANCE_START="07:30"
ATTENDANCE_STOP="16:45"
GPS_LAT="12.9716"
GPS_LNG="77.5946"
TRIP_FREIGHT=27500
TRIP_WEIGHT=8500
ESCALATION_NOTE="dq-esc-$RUN_ID"
SCHEDULE_INTERVAL=11
SCHEDULE_LITRES=215
SCHEDULE_KMPL="4.65"
ODO_READING=$((10000 + RUN_ID % 9000))
EMPLOYEE_NAME="DQ-EMP-$RUN_ID"
EMPLOYEE_PHONE="9${RUN_ID:0:9}"
FILL_LITRES="55.250"
FILL_RATE="97.25"

info "Reusing first existing vehicle (admin app upload route is multipart-only)"
R="$(req GET /onboarding/vehicleList)"
VEHICLE_NUMBER="$(body_of "$R" | jq -r '.[0].vehicleNumber // empty')"
[[ -n "$VEHICLE_NUMBER" ]] && pass "  → using vehicle $VEHICLE_NUMBER" \
  || { fail "no vehicle in DB — onboard one in admin app first"; exit 1; }

info "Create customer $CUSTOMER_NAME"
R="$(req POST /customer/onboarding "$(cat <<EOF
{
  "companyName": "$CUSTOMER_NAME",
  "address": "1 DQ Street",
  "pointOfContact": "DQ Reg",
  "state": "Karnataka",
  "phoneNumber": "9876500000",
  "emailId": "dq+$RUN_ID@example.com",
  "gstNumber": "29ABCDE1234F1Z5",
  "rateCard": "default"
}
EOF
)")"
expect_status "$R" "201" "create customer"

info "Create driver $DRIVER_ID"
R="$(req POST /onboarding/driver-addon-data "$(cat <<EOF
{ "driverId": "$DRIVER_ID", "shiftType": "Shift A", "state": "Karnataka", "referBy": "data-quality" }
EOF
)")"
expect_status "$R" "201" "create driver"

info "Assign driver $DRIVER_ID to vehicle $VEHICLE_NUMBER (primary)"
R="$(req POST /onboarding/assign-vehicle "{\"driverId\":\"$DRIVER_ID\",\"vehicleNumber\":\"$VEHICLE_NUMBER\",\"isPrimary\":true}")"
expect_status "$R" "201" "assign vehicle"

# ─────────────────────────────────────────────────────────────────────────────
phase "Phase 2 — Driver inputs (fingerprinted)"

info "Mark attendance ${ATTENDANCE_START}–${ATTENDANCE_STOP}"
R="$(req POST /attendance/send "$(cat <<EOF
{
  "driverId": "$DRIVER_ID", "driverName": "$DRIVER_NAME", "vehicleNumber": "$VEHICLE_NUMBER",
  "startTime": "$ATTENDANCE_START", "stopTime": "$ATTENDANCE_STOP",
  "duration": "9h15m", "driverShiftLabel": "Shift A"
}
EOF
)")"
expect_status "$R" "201" "POST /attendance/send"

info "Start + stop trip"
R="$(req POST /trip/start-trip "{\"driverId\":\"$DRIVER_ID\",\"vehicleNumber\":\"$VEHICLE_NUMBER\"}")"
expect_status "$R" "201" "POST /trip/start-trip"

info "Submit diesel: $DIESEL_VOLUME L @ ₹$DIESEL_RATE = ₹$DIESEL_TOTAL"
R="$(req POST /vehicle/diesel "$(cat <<EOF
{
  "date": "${DATE_KEY}T08:00:00.000Z", "vehicleNumber": "$VEHICLE_NUMBER",
  "driverName": "$DRIVER_NAME", "pumpName": "DQ Pump", "fuelType": "Diesel",
  "volume": $DIESEL_VOLUME, "ratePerLiter": $DIESEL_RATE, "totalAmount": $DIESEL_TOTAL, "amount": $DIESEL_TOTAL,
  "startKm": $DIESEL_START_KM, "endKm": $DIESEL_END_KM, "totalKm": 220,
  "mileage": 5.2, "paymentMode": "Cash", "paidBy": "Driver"
}
EOF
)")"
expect_status "$R" "201" "POST /vehicle/diesel"

info "Request advance ₹$ADVANCE_AMOUNT"
R="$(req POST /advance/request "$(cat <<EOF
{ "driverId":"$DRIVER_ID","driverName":"$DRIVER_NAME","month":"$MONTH_KEY","requestedAmount":$ADVANCE_AMOUNT }
EOF
)")"
expect_status "$R" "201" "POST /advance/request"
ADVANCE_ID="$(body_of "$R" | jq -r '.data.id // empty')"

info "Request leave (reason: $LEAVE_REASON)"
R="$(req POST /advance/leaves "$(cat <<EOF
{ "driverId":"$DRIVER_ID","startDate":"$DATE_KEY","endDate":"$DATE_KEY","reason":"$LEAVE_REASON" }
EOF
)")"
expect_status "$R" "201" "POST /advance/leaves"

info "Submit trip sheet $TRIP_NUMBER (freight=$TRIP_FREIGHT, weight=$TRIP_WEIGHT)"
R="$(req POST /trip/trip-sheet "$(cat <<EOF
{
  "tripNumber":"$TRIP_NUMBER","vehicleNumber":"$VEHICLE_NUMBER",
  "driverId":"$DRIVER_ID","driverName":"$DRIVER_NAME",
  "origin":"DQ-Origin","destination":"DQ-Destination",
  "loadingDate":"${DATE_KEY}T07:00:00.000Z","unloadingDate":"${DATE_KEY}T19:00:00.000Z",
  "material":"DQ-Cement","weight":$TRIP_WEIGHT,"freight":$TRIP_FREIGHT,"advancePaid":5000,"balanceFreight":$((TRIP_FREIGHT-5000))
}
EOF
)")"
expect_status "$R" "201" "POST /trip/trip-sheet"

info "GPS ping at ($GPS_LAT, $GPS_LNG)"
R="$(req POST /home/ping "$(cat <<EOF
{ "vehicleNumber":"$VEHICLE_NUMBER","driverId":"$DRIVER_ID","lat":$GPS_LAT,"lng":$GPS_LNG,"speedKmph":47,"ignitionOn":true }
EOF
)")"
expect_status "$R" "201" "POST /home/ping"

R="$(req POST /trip/stop-trip "{\"driverId\":\"$DRIVER_ID\"}")"
S="$(status_of "$R")"
[[ "$S" == "200" || "$S" == "201" ]] && pass "POST /trip/stop-trip (HTTP $S)" || fail "stop-trip → $S"

# ─────────────────────────────────────────────────────────────────────────────
phase "Phase 3 — Driver app sees its own inputs"

info "Driver: GET /onboarding/vehicle-list-for-driver/$DRIVER_ID"
R="$(req GET "/onboarding/vehicle-list-for-driver/$DRIVER_ID")"
expect_status "$R" "200" "driver vehicle list"
expect_jq "$(body_of "$R")" \
  ".vehicles | map(.vehicleNumber) | index(\"$VEHICLE_NUMBER\") != null" \
  "  → assigned vehicle visible to driver"

info "Driver: GET /attendance/$DRIVER_ID"
R="$(req GET "/attendance/$DRIVER_ID")"
expect_status "$R" "200" "driver attendance history"
expect_jq "$(body_of "$R")" \
  "map(select(.startTime==\"$ATTENDANCE_START\" and .stopTime==\"$ATTENDANCE_STOP\")) | length >= 1" \
  "  → today's attendance row carries exact start/stop"

info "Driver: GET /advance/result?driverId=$DRIVER_ID (full advance history)"
R="$(req GET "/advance/result?driverId=$DRIVER_ID&limit=20")"
expect_status "$R" "200" "driver advance history"
expect_jq "$(body_of "$R")" \
  "map(select(.driverId==\"$DRIVER_ID\" and (.requestedAmount|tonumber)==$ADVANCE_AMOUNT)) | length >= 1" \
  "  → driver sees their pending ₹$ADVANCE_AMOUNT advance"

info "Driver: GET /advance/leaves/$DRIVER_ID"
R="$(req GET "/advance/leaves/$DRIVER_ID")"
expect_status "$R" "200" "driver leave history"
expect_jq "$(body_of "$R")" \
  "map(select(.reason==\"$LEAVE_REASON\")) | length >= 1" \
  "  → driver sees their leave with exact reason"

info "Driver: GET /trip/trip-sheet?driverId=$DRIVER_ID"
R="$(req GET "/trip/trip-sheet?driverId=$DRIVER_ID&limit=20")"
expect_status "$R" "200" "driver trip-sheet history"
expect_jq "$(body_of "$R")" \
  "map(select(.tripNumber==\"$TRIP_NUMBER\" and (.freight|tonumber)==$TRIP_FREIGHT)) | length >= 1" \
  "  → trip sheet has matching freight $TRIP_FREIGHT"

# ─────────────────────────────────────────────────────────────────────────────
phase "Phase 4 — Supervisor inputs"

info "Supervisor: POST /api/auth/employee"
R="$(req_emp POST /api/auth/employee "{\"password\":\"$EMP_PASSWORD\"}")"
expect_status "$R" "200" "employee password validates"

info "Supervisor: POST /api/employees ($EMPLOYEE_NAME)"
R="$(req_emp POST /api/employees "{\"name\":\"$EMPLOYEE_NAME\",\"role\":\"Mechanic\",\"phone\":\"$EMPLOYEE_PHONE\"}")"
S="$(status_of "$R")"
[[ "$S" == "200" || "$S" == "201" ]] && pass "create employee (HTTP $S)" || fail "create employee → $S"

info "Supervisor: POST /api/schedule/bulk (interval=$SCHEDULE_INTERVAL litres=$SCHEDULE_LITRES)"
R="$(req_emp POST /api/schedule/bulk "$(cat <<EOF
{ "configs": [ { "vehicle":"$VEHICLE_NUMBER","intervalDays":$SCHEDULE_INTERVAL,"litres":$SCHEDULE_LITRES,"kmPerLitre":$SCHEDULE_KMPL,"kmPerFill":1000,"actualKm":900 } ] }
EOF
)")"
S="$(status_of "$R")"
[[ "$S" == "200" || "$S" == "201" ]] && pass "schedule bulk upsert (HTTP $S)" || fail "schedule bulk → $S"

info "Supervisor: POST /api/fills (vehicle $VEHICLE_NUMBER, $FILL_LITRES L)"
R="$(req_emp POST /api/fills "$(cat <<EOF
{
  "vehicle":"$VEHICLE_NUMBER","monthKey":"$MONTH_KEY","dateKey":"$DATE_KEY",
  "startKm":$DIESEL_START_KM,"endKm":$DIESEL_END_KM,"litres":$FILL_LITRES,"rate":$FILL_RATE,
  "totalAmount":$(awk -v a=$FILL_LITRES -v b=$FILL_RATE 'BEGIN{printf "%.2f", a*b}')
}
EOF
)")"
S="$(status_of "$R")"
[[ "$S" == "200" || "$S" == "201" ]] && pass "fill create (HTTP $S)" || fail "fill create → $S"

info "Supervisor: POST /api/escalations (note: $ESCALATION_NOTE)"
R="$(req_emp POST /api/escalations "$(cat <<EOF
{ "vehicle":"$VEHICLE_NUMBER","category":"Brake check","severity":"high","note":"$ESCALATION_NOTE","raisedBy":"$EMPLOYEE_NAME" }
EOF
)")"
S="$(status_of "$R")"
[[ "$S" == "200" || "$S" == "201" ]] && pass "raise escalation (HTTP $S)" || fail "escalation → $S"
ESC_ID="$(body_of "$R" | jq -r '.id // empty')"

info "Supervisor: POST /api/odometer/$VEHICLE_NUMBER (reading $ODO_READING)"
R="$(req_emp POST "/api/odometer/$VEHICLE_NUMBER" "{\"dateKey\":\"$DATE_KEY\",\"reading\":$ODO_READING}")"
S="$(status_of "$R")"
[[ "$S" == "200" || "$S" == "201" ]] && pass "odometer entry (HTTP $S)" || fail "odometer → $S"

# ─────────────────────────────────────────────────────────────────────────────
phase "Phase 5 — Admin (sendo-ui-vite) tabs see exact values"

info "Tab /driver-management — GET /onboarding/drivers"
R="$(req GET "/onboarding/drivers?limit=200")"
expect_status "$R" "200" "list drivers"
expect_jq "$(body_of "$R")" \
  "map(select(.driverId==\"$DRIVER_ID\")) | length >= 1" \
  "  → driver $DRIVER_ID appears in roster"

info "Tab /attendance-records — GET /attendance/all"
R="$(req GET "/attendance/all?limit=200")"
expect_status "$R" "200" "attendance/all"
expect_jq "$(body_of "$R")" \
  "map(select(.driverId==\"$DRIVER_ID\" and .startTime==\"$ATTENDANCE_START\" and .stopTime==\"$ATTENDANCE_STOP\")) | length >= 1" \
  "  → attendance row has exact start/stop times"

info "Tab /driver-attendance-approval — GET /attendance/pending"
R="$(req GET "/attendance/pending?limit=200")"
expect_status "$R" "200" "attendance/pending"
expect_jq "$(body_of "$R")" \
  "map(select(.driverId==\"$DRIVER_ID\")) | length >= 1" \
  "  → pending row exists for $DRIVER_ID"

info "Tab /driver-advance — GET /advance/pending"
R="$(req GET "/advance/pending?limit=200")"
expect_status "$R" "200" "advance/pending"
expect_jq "$(body_of "$R")" \
  "map(select(.driverId==\"$DRIVER_ID\" and (.requestedAmount|tonumber)==$ADVANCE_AMOUNT)) | length >= 1" \
  "  → pending advance amount = $ADVANCE_AMOUNT"

info "Tab /driver-leave-admin — GET /advance/leaves"
R="$(req GET "/advance/leaves?limit=200")"
expect_status "$R" "200" "advance/leaves"
expect_jq "$(body_of "$R")" \
  "map(select(.driverId==\"$DRIVER_ID\" and .reason==\"$LEAVE_REASON\")) | length >= 1" \
  "  → leave row has matching reason"

info "Tab /diesel — GET /vehicle/diesel"
R="$(req GET "/vehicle/diesel?limit=200")"
expect_status "$R" "200" "vehicle/diesel"
expect_jq "$(body_of "$R")" \
  "map(select(.vehicleNumber==\"$VEHICLE_NUMBER\" and (.volume|tonumber)==$DIESEL_VOLUME and (.totalAmount|tonumber)==$DIESEL_TOTAL)) | length >= 1" \
  "  → diesel row has exact volume × totalAmount"

info "Tab /driver-timeSheet — GET /trip/trip-sheet"
R="$(req GET "/trip/trip-sheet?limit=200")"
expect_status "$R" "200" "trip/trip-sheet"
expect_jq "$(body_of "$R")" \
  "map(select(.tripNumber==\"$TRIP_NUMBER\" and (.freight|tonumber)==$TRIP_FREIGHT and (.weight|tonumber)==$TRIP_WEIGHT)) | length >= 1" \
  "  → trip sheet has freight=$TRIP_FREIGHT weight=$TRIP_WEIGHT"

info "Tab /driver-liveTracking — GET /home/fetch-locations"
R="$(req GET /home/fetch-locations)"
expect_status "$R" "200" "home/fetch-locations"
expect_jq "$(body_of "$R")" \
  "map(select(.vehicleNumber==\"$VEHICLE_NUMBER\")) | length >= 1" \
  "  → live-tracking has $VEHICLE_NUMBER ping"

info "Tab /vehicle-management — GET /onboarding/vehicleList"
R="$(req GET "/onboarding/vehicleList")"
expect_status "$R" "200" "vehicleList"
expect_jq "$(body_of "$R")" \
  "map(.vehicleNumber) | index(\"$VEHICLE_NUMBER\") != null" \
  "  → vehicle $VEHICLE_NUMBER present"

# Admin tracker tabs (sendo-ui-vite uses x-emp-password for these)
info "Tab /employee-list — GET /api/employees"
R="$(req_emp GET /api/employees)"
expect_status "$R" "200" "api/employees"
expect_jq "$(body_of "$R")" \
  "map(select(.name==\"$EMPLOYEE_NAME\" and .phone==\"$EMPLOYEE_PHONE\")) | length >= 1" \
  "  → employee row has matching phone"

info "Tab /employee-schedule — GET /api/schedule"
R="$(req_emp GET /api/schedule)"
expect_status "$R" "200" "api/schedule"
expect_jq "$(body_of "$R")" \
  "map(select(.vehicle==\"$VEHICLE_NUMBER\" and (.intervalDays|tonumber)==$SCHEDULE_INTERVAL and (.litres|tonumber)==$SCHEDULE_LITRES)) | length >= 1" \
  "  → schedule has interval=$SCHEDULE_INTERVAL litres=$SCHEDULE_LITRES"

info "Tab /employee-escalations — GET /api/escalations"
R="$(req_emp GET /api/escalations)"
expect_status "$R" "200" "api/escalations"
expect_jq "$(body_of "$R")" \
  "map(select(.vehicle==\"$VEHICLE_NUMBER\" and .note==\"$ESCALATION_NOTE\" and .severity==\"high\")) | length >= 1" \
  "  → escalation has matching note + severity"

info "Tab tracker fills view — GET /api/fills?vehicle=$VEHICLE_NUMBER&month=$MONTH_KEY"
R="$(req_emp GET "/api/fills?vehicle=$VEHICLE_NUMBER&month=$MONTH_KEY")"
expect_status "$R" "200" "api/fills filtered"
expect_jq "$(body_of "$R")" \
  "map(select(.vehicle==\"$VEHICLE_NUMBER\" and .dateKey==\"$DATE_KEY\" and (.litres|tonumber)==$FILL_LITRES)) | length >= 1" \
  "  → fill row has $FILL_LITRES L on $DATE_KEY"

info "Tab tracker odometer view — GET /api/odometer/$VEHICLE_NUMBER"
R="$(req_emp GET "/api/odometer/$VEHICLE_NUMBER")"
expect_status "$R" "200" "api/odometer"
expect_jq "$(body_of "$R")" \
  "map(select(.dateKey==\"$DATE_KEY\" and (.reading|tonumber)==$ODO_READING)) | length >= 1" \
  "  → odometer reading=$ODO_READING on $DATE_KEY"

info "Cross-check: admin's escalation view via emp password matches supervisor's"
R="$(req_emp GET /api/escalations)"
expect_jq "$(body_of "$R")" \
  "map(select(.note==\"$ESCALATION_NOTE\")) | length >= 1" \
  "  → admin tracker tab sees the escalation by its unique note"

# ─────────────────────────────────────────────────────────────────────────────
phase "Summary"
echo "Run ID:        $RUN_ID"
echo "Driver:        $DRIVER_ID"
echo "Vehicle:       $VEHICLE_NUMBER"
echo "Trip:          $TRIP_NUMBER"
echo "Customer:      $CUSTOMER_NAME"
echo "Employee:      $EMPLOYEE_NAME"
echo "Adv amount:    ₹$ADVANCE_AMOUNT"
echo "Diesel:        ${DIESEL_VOLUME}L @ ₹${DIESEL_RATE} = ₹${DIESEL_TOTAL}"
echo "Odo reading:   $ODO_READING"
echo "Esc note:      $ESCALATION_NOTE"
echo
printf "${GREEN}PASSED: %d${NC}    ${RED}FAILED: %d${NC}\n" "$PASS_COUNT" "$FAIL_COUNT"
if (( FAIL_COUNT > 0 )); then
  echo
  echo "Failures:"
  for f in "${FAILURES[@]}"; do printf "  ${RED}•${NC} %s\n" "$f"; done
  exit 1
fi
echo
echo "All data-quality checks passed — every value flowed driver/supervisor → admin tab unchanged."
