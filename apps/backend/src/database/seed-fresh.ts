import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import { AppDataSource } from './data-source';
import { User, UserRole } from '../modules/auth/entities/user.entity';
import { OtpUser } from '../modules/auth/entities/otp-user.entity';
import { Driver } from '../modules/driver/entities/driver.entity';
import { DriverAssignment } from '../modules/driver/entities/driver-assignment.entity';
import { Customer } from '../modules/customer/entities/customer.entity';
import { Vehicle, VehicleType, YesNo } from '../modules/vehicle/entities/vehicle.entity';
import { Diesel } from '../modules/vehicle/entities/diesel.entity';
import { TripSheet } from '../modules/trip/entities/trip-sheet.entity';
import { Trip } from '../modules/trip/entities/trip.entity';
import { Attendance, AttendanceStatus } from '../modules/attendance/entities/attendance.entity';
import { ApprovalStatus, DriverAdvance } from '../modules/billing/entities/driver-advance.entity';
import { Leave } from '../modules/billing/entities/leave.entity';
import { EmployeeRecord } from '../modules/tracker/entities/employee-record.entity';
import { Schedule } from '../modules/tracker/entities/schedule.entity';
import { Fill } from '../modules/tracker/entities/fill.entity';
import { OdometerEntry } from '../modules/tracker/entities/odometer-entry.entity';
import { Escalation, EscalationSeverity, EscalationStatus } from '../modules/tracker/entities/escalation.entity';
import { VehicleLocation } from '../modules/tracking/entities/vehicle-location.entity';
import { VehicleHistory } from '../modules/tracking/entities/vehicle-history.entity';

const log = (msg: string): void => {
  // eslint-disable-next-line no-console
  console.log(msg);
};

const RESET_TABLES = [
  'sendo.notifications',
  'sendo.device_tokens',
  'sendo.gps_pings',
  'sendo.vehicle_history',
  'sendo.vehicle_parking',
  'sendo.vehicle_locations',
  'sendo.tracker_escalations',
  'sendo.tracker_odometer_entries',
  'sendo.tracker_fills',
  'sendo.tracker_schedules',
  'sendo.tracker_employees',
  'sendo.timesheets',
  'sendo.attendances',
  'sendo.salary_payments',
  'sendo.driver_payouts',
  'sendo.driver_advances',
  'sendo.leaves',
  'sendo.deductions',
  'sendo.diesel_entries',
  'sendo.trip_sheets',
  'sendo.trips',
  'sendo.driver_assignments',
  'sendo.vehicle_documents',
  'sendo.vehicles',
  'sendo.drivers',
  'sendo.otp_users',
  'sendo.customers',
  'sendo.users',
];

interface VehicleSeed {
  number: string;
  type: VehicleType;
  registerName: string;
  fuelType: string;
  litresPerFill: number;
  kmPerLitre: number;
  intervalDays: number;
}

const VEHICLES: VehicleSeed[] = [
  { number: 'KA-01-AE-1234', type: VehicleType.TRUCK_20FT, registerName: 'Sendo Logistics Pvt Ltd', fuelType: 'Diesel', litresPerFill: 150, kmPerLitre: 4, intervalDays: 7 },
  { number: 'KA-05-MJ-7842', type: VehicleType.TRUCK_17FT, registerName: 'Sendo Logistics Pvt Ltd', fuelType: 'Diesel', litresPerFill: 120, kmPerLitre: 4.5, intervalDays: 7 },
  { number: 'KA-03-BC-5566', type: VehicleType.TRUCK_407, registerName: 'Sendo Logistics Pvt Ltd', fuelType: 'Diesel', litresPerFill: 60, kmPerLitre: 8, intervalDays: 5 },
  { number: 'KA-04-PQ-3321', type: VehicleType.PICKUP_TRUCK, registerName: 'Sendo Logistics Pvt Ltd', fuelType: 'Diesel', litresPerFill: 40, kmPerLitre: 12, intervalDays: 4 },
  { number: 'MH-12-XR-8899', type: VehicleType.TRUCK_20FT, registerName: 'Sendo Logistics Pvt Ltd', fuelType: 'Diesel', litresPerFill: 150, kmPerLitre: 3.8, intervalDays: 7 },
  { number: 'TN-22-AK-4477', type: VehicleType.TRUCK_17FT, registerName: 'Sendo Logistics Pvt Ltd', fuelType: 'Diesel', litresPerFill: 120, kmPerLitre: 4.4, intervalDays: 7 },
];

interface DriverSeed {
  driverId: string;
  firstName: string;
  surname: string;
  phone: string;
  vehicle: string;
  shiftA?: boolean;
  shiftB?: boolean;
  basicPayment: number;
}

const DRIVERS: DriverSeed[] = [
  { driverId: 'DR-001', firstName: 'Rakesh',  surname: 'Naidu',   phone: '7981212220', vehicle: 'KA-01-AE-1234', shiftA: true, basicPayment: 28000 },
  { driverId: 'DR-002', firstName: 'Suresh',  surname: 'Reddy',   phone: '9844112233', vehicle: 'KA-05-MJ-7842', shiftA: true, basicPayment: 26000 },
  { driverId: 'DR-003', firstName: 'Mahesh',  surname: 'Patil',   phone: '9900445566', vehicle: 'KA-03-BC-5566', shiftA: true, basicPayment: 22000 },
  { driverId: 'DR-004', firstName: 'Ramesh',  surname: 'Kumar',   phone: '9876543210', vehicle: 'KA-04-PQ-3321', shiftB: true, basicPayment: 20000 },
  { driverId: 'DR-005', firstName: 'Vinod',   surname: 'Shetty',  phone: '9123456780', vehicle: 'MH-12-XR-8899', shiftA: true, basicPayment: 30000 },
  { driverId: 'DR-006', firstName: 'Praveen', surname: 'Iyer',    phone: '9000111222', vehicle: 'TN-22-AK-4477', shiftB: true, basicPayment: 27000 },
];

const CUSTOMERS = [
  { companyName: 'Bangalore Cement Co',     state: 'Karnataka',  poc: 'Anil Hegde',     phone: '8050001111', gst: '29ABCDE1111F1Z5' },
  { companyName: 'Hyderabad Steel Works',   state: 'Telangana',  poc: 'Lakshmi Devi',   phone: '9000002222', gst: '36ABCDE2222F1Z5' },
  { companyName: 'Mumbai Goods Pvt Ltd',    state: 'Maharashtra', poc: 'Sandeep Joshi',  phone: '9820003333', gst: '27ABCDE3333F1Z5' },
];

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@sendo.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe!123';
const MANAGER_EMAIL = process.env.SEED_MANAGER_EMAIL ?? 'manager@sendo.local';
const MANAGER_PASSWORD = process.env.SEED_MANAGER_PASSWORD ?? 'ChangeMe!123';

async function truncateAll(): Promise<void> {
  log('🧹 Truncating existing data…');
  await AppDataSource.query(`TRUNCATE TABLE ${RESET_TABLES.join(', ')} RESTART IDENTITY CASCADE`);
  log(`   • cleared ${RESET_TABLES.length} tables`);
}

async function seedUsers(): Promise<void> {
  const repo = AppDataSource.getRepository(User);
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const managerHash = await bcrypt.hash(MANAGER_PASSWORD, 12);
  await repo.save([
    repo.create({
      email: ADMIN_EMAIL,
      fullName: 'Rajesh Kumar (Super Admin)',
      password: adminHash,
      role: UserRole.ADMIN,
    }),
    repo.create({
      email: MANAGER_EMAIL,
      fullName: 'Priya Sharma (Manager)',
      password: managerHash,
      role: UserRole.MANAGER,
    }),
  ]);
  log(`✅ Users: admin=${ADMIN_EMAIL}, manager=${MANAGER_EMAIL}`);
}

async function seedCustomers(): Promise<void> {
  const repo = AppDataSource.getRepository(Customer);
  await repo.save(
    CUSTOMERS.map((c) =>
      repo.create({
        companyName: c.companyName,
        address: `${c.companyName} HQ`,
        pointOfContact: c.poc,
        state: c.state,
        phoneNumber: c.phone,
        emailId: `contact@${c.companyName.toLowerCase().replace(/\s+/g, '')}.local`,
        gstNumber: c.gst,
        rateCard: 'standard',
      }),
    ),
  );
  log(`✅ Customers: ${CUSTOMERS.length}`);
}

async function seedVehicles(): Promise<void> {
  const repo = AppDataSource.getRepository(Vehicle);
  const today = new Date();
  const future = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate());
  await repo.save(
    VEHICLES.map((v) =>
      repo.create({
        vehicleNumber: v.number,
        registerName: v.registerName,
        vehicleType: v.type,
        grossVehicleWeight: '12000',
        registrationDate: '2024-01-01',
        fitnessValidUpto: future.toISOString().slice(0, 10),
        taxValidUpto: future.toISOString().slice(0, 10),
        insuranceValidUpto: future.toISOString().slice(0, 10),
        pollutionValidUpto: future.toISOString().slice(0, 10),
        nationalPermit: YesNo.YES,
        temporaryPermit: YesNo.NO,
        statePermit: YesNo.NO,
        fuelType: v.fuelType,
        scheduleInterval: v.intervalDays,
        scheduleLitres: String(v.litresPerFill),
        scheduleKmPerLitre: String(v.kmPerLitre),
        scheduleKmPerFill: String(Math.round(v.litresPerFill * v.kmPerLitre)),
        isActive: true,
      }),
    ),
  );
  log(`✅ Vehicles: ${VEHICLES.length}`);
}

async function seedDrivers(): Promise<void> {
  const driverRepo = AppDataSource.getRepository(Driver);
  const otpRepo = AppDataSource.getRepository(OtpUser);
  const assignRepo = AppDataSource.getRepository(DriverAssignment);
  const country = process.env.TWILIO_DEFAULT_COUNTRY_CODE ?? '+91';

  for (const d of DRIVERS) {
    await driverRepo.save(
      driverRepo.create({
        driverId: d.driverId,
        firstName: d.firstName,
        surname: d.surname,
        contactNumber: d.phone,
        emergencyContact: d.phone,
        state: 'Karnataka',
        joiningDate: '2024-01-01',
        basicPayment: String(d.basicPayment),
        shiftA: !!d.shiftA,
        shiftB: !!d.shiftB,
        shiftType: d.shiftA ? 'Shift A' : 'Shift B',
        isActive: true,
        isDriver: true,
        assignedVehicleNumber: d.vehicle,
      }),
    );
    await assignRepo.save(
      assignRepo.create({
        driverId: d.driverId,
        vehicleNumber: d.vehicle,
        isPrimary: true,
        assignedFrom: new Date(),
      }),
    );
    const formattedPhone = d.phone.startsWith('+') ? d.phone : `${country}${d.phone}`;
    const stale = await otpRepo.findOne({ where: { phone: formattedPhone } });
    if (stale) await otpRepo.remove(stale);
  }
  log(`✅ Drivers: ${DRIVERS.length} (each with a primary vehicle assignment)`);
}

async function seedTrackerEmployees(): Promise<void> {
  const repo = AppDataSource.getRepository(EmployeeRecord);
  await repo.save([
    repo.create({ name: 'Amit Verma',     role: 'Supervisor', phone: '9876500001' }),
    repo.create({ name: 'Sunita Pillai',  role: 'Mechanic',   phone: '9876500002' }),
    repo.create({ name: 'Karan Bose',     role: 'Helper',     phone: '9876500003' }),
  ]);
  log('✅ Tracker employees: 3 (supervisor + mechanic + helper)');
}

async function seedSchedules(): Promise<void> {
  const repo = AppDataSource.getRepository(Schedule);
  await repo.save(
    VEHICLES.map((v) =>
      repo.create({
        vehicle: v.number,
        intervalDays: v.intervalDays,
        litres: v.litresPerFill,
        kmPerLitre: String(v.kmPerLitre),
        kmPerFill: Math.round(v.litresPerFill * v.kmPerLitre),
        actualKm: Math.round(v.litresPerFill * v.kmPerLitre * 0.92),
      }),
    ),
  );
  log(`✅ Tracker schedules: ${VEHICLES.length}`);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

async function seedFillsAndOdometer(): Promise<void> {
  const fillRepo = AppDataSource.getRepository(Fill);
  const odoRepo = AppDataSource.getRepository(OdometerEntry);
  const dieselRepo = AppDataSource.getRepository(Diesel);

  const today = new Date();

  const fillRows: Fill[] = [];
  const dieselRows: Diesel[] = [];
  const odoRows: OdometerEntry[] = [];

  const featuredVehicleNumber = VEHICLES[0].number;

  for (const v of VEHICLES) {
    let runningKm = 50000 + Math.floor(Math.random() * 20000);
    const historyDays = v.number === featuredVehicleNumber ? 60 : today.getDate();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (historyDays - 1));

    for (let offset = 0; offset < historyDays; offset++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + offset);
      const dateKey = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
      const monthKey = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
      const dailyKm = 80 + Math.floor(Math.random() * 120);
      runningKm += dailyKm;
      odoRows.push(
        odoRepo.create({ vehicle: v.number, dateKey, reading: runningKm }),
      );

      if ((offset + 1) % v.intervalDays === 0) {
        const startKm = runningKm - v.litresPerFill * v.kmPerLitre - 50;
        const endKm = runningKm;
        const litres = v.litresPerFill + (Math.random() * 10 - 5);
        const rate = 95 + Math.random() * 6;
        const totalAmount = +(litres * rate).toFixed(2);
        const driver = DRIVERS.find((dr) => dr.vehicle === v.number);
        const driverName = driver
          ? `${driver.firstName} ${driver.surname}`
          : 'Unknown';
        const fillHour = 8 + (offset % 9);
        const fillMin = (offset * 7) % 60;
        const timeKey = `${pad(fillHour)}:${pad(fillMin)}`;
        const paidByOptions = ['Driver', 'Supervisor', 'Office'];
        const paidBy = paidByOptions[offset % paidByOptions.length] ?? 'Driver';
        fillRows.push(
          fillRepo.create({
            monthKey,
            vehicle: v.number,
            dateKey,
            startKm: Math.round(startKm),
            endKm: Math.round(endKm),
            totalKm: Math.max(0, Math.round(endKm - startKm)),
            litres: litres.toFixed(2),
            rate: rate.toFixed(2),
            totalAmount: totalAmount.toFixed(2),
            enteredBy: driverName,
            paidBy,
            timeKey,
          }),
        );
        const totalKm = Math.max(0, Math.round(endKm - startKm));
        const mileage = litres > 0 ? +(totalKm / litres).toFixed(2) : 0;
        dieselRows.push(
          dieselRepo.create({
            date,
            vehicleNumber: v.number,
            vehicleType: v.type,
            ownerName: v.registerName,
            driverName: driver ? driverName : null,
            pumpName: 'Indian Oil',
            fuelType: 'Diesel',
            volume: litres.toFixed(2),
            ratePerLiter: rate.toFixed(2),
            totalAmount: totalAmount.toFixed(2),
            amount: totalAmount.toFixed(2),
            startKm: String(Math.round(startKm)),
            endKm: String(Math.round(endKm)),
            totalKm: String(totalKm),
            mileage: String(mileage),
            paymentMode: paidBy === 'Office' ? 'Card' : 'Cash',
            paymentType: paidBy === 'Office' ? 'Card' : 'Cash',
            paidBy,
          }),
        );
      }
    }
  }

  await fillRepo.save(fillRows);
  await dieselRepo.save(dieselRows);
  await odoRepo.save(odoRows);
  log(`✅ Fills (tracker): ${fillRows.length} · Diesel entries: ${dieselRows.length} · Odometer rows: ${odoRows.length}`);
}

async function seedAttendanceAdvanceLeave(): Promise<void> {
  const att = AppDataSource.getRepository(Attendance);
  const adv = AppDataSource.getRepository(DriverAdvance);
  const lv = AppDataSource.getRepository(Leave);

  const today = new Date();
  const dateKey = today.toISOString().slice(0, 10);
  const monthKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}`;

  const attRows: Attendance[] = DRIVERS.map((d, i) =>
    att.create({
      driverId: d.driverId,
      driverName: `${d.firstName} ${d.surname}`,
      vehicleNumber: d.vehicle,
      startTime: '08:00',
      stopTime: '17:30',
      duration: '9h30m',
      driverShiftLabel: d.shiftA ? 'Shift A' : 'Shift B',
      status: i % 3 === 0 ? AttendanceStatus.PENDING : AttendanceStatus.APPROVED,
    }),
  );

  const featured = DRIVERS[0];
  for (let offset = 1; offset <= 45; offset++) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    if (day.getDay() === 0) continue;
    const startHour = 7 + (offset % 2);
    const stopHour = 16 + (offset % 3);
    const status =
      offset % 7 === 0
        ? AttendanceStatus.REJECTED
        : offset % 4 === 0
          ? AttendanceStatus.PENDING
          : AttendanceStatus.APPROVED;
    attRows.push(
      att.create({
        driverId: featured.driverId,
        driverName: `${featured.firstName} ${featured.surname}`,
        vehicleNumber: featured.vehicle,
        startTime: `${pad(startHour)}:${offset % 2 === 0 ? '00' : '30'}`,
        stopTime: `${pad(stopHour)}:${offset % 3 === 0 ? '15' : '45'}`,
        duration: `${stopHour - startHour}h${offset % 2 === 0 ? '00' : '30'}m`,
        driverShiftLabel: featured.shiftA ? 'Shift A' : 'Shift B',
        status,
        createdAt: day,
      }),
    );
  }

  const advRows: DriverAdvance[] = DRIVERS.slice(0, 4).map((d, i) =>
    adv.create({
      driverId: d.driverId,
      driverName: `${d.firstName} ${d.surname}`,
      month: monthKey,
      requestedAmount: String(2000 + i * 500),
      approvalStatus: i === 1 ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING,
      approvedAmount: i === 1 ? String(2000 + i * 500) : '0',
      reason: 'Family expense',
    }),
  );

  for (let monthsBack = 1; monthsBack <= 4; monthsBack++) {
    const d = new Date(today.getFullYear(), today.getMonth() - monthsBack, 12);
    const mKey = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    const requested = 1500 + monthsBack * 750;
    const approved = monthsBack % 2 === 0;
    advRows.push(
      adv.create({
        driverId: featured.driverId,
        driverName: `${featured.firstName} ${featured.surname}`,
        month: mKey,
        requestedAmount: String(requested),
        approvalStatus: approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
        approvedAmount: approved ? String(requested) : '0',
        reason: monthsBack === 1 ? 'School fees' : 'Medical',
        requestedAt: d,
      }),
    );
  }

  const lvRows: Leave[] = DRIVERS.slice(2, 5).map((d) =>
    lv.create({
      driverId: d.driverId,
      startDate: dateKey,
      endDate: dateKey,
      reason: 'Personal',
      status: ApprovalStatus.PENDING,
    }),
  );

  for (let monthsBack = 1; monthsBack <= 3; monthsBack++) {
    const start = new Date(today.getFullYear(), today.getMonth() - monthsBack, 5 + monthsBack);
    const end = new Date(start);
    end.setDate(start.getDate() + monthsBack);
    lvRows.push(
      lv.create({
        driverId: featured.driverId,
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        reason: monthsBack === 1 ? 'Health Issue' : monthsBack === 2 ? 'Family Emergency' : 'Personal Reason',
        status:
          monthsBack === 1
            ? ApprovalStatus.APPROVED
            : monthsBack === 2
              ? ApprovalStatus.REJECTED
              : ApprovalStatus.PENDING,
      }),
    );
  }

  await att.save(attRows);
  await adv.save(advRows);
  await lv.save(lvRows);
  log(`✅ Attendance: ${attRows.length} · Advances: ${advRows.length} · Leaves: ${lvRows.length}`);
}

async function seedTripsAndLocations(): Promise<void> {
  const tripRepo = AppDataSource.getRepository(Trip);
  const sheetRepo = AppDataSource.getRepository(TripSheet);
  const locRepo = AppDataSource.getRepository(VehicleLocation);
  const histRepo = AppDataSource.getRepository(VehicleHistory);

  const now = new Date();
  const featured = DRIVERS[0];
  for (let offset = 1; offset <= 45; offset += 2) {
    const start = new Date(now);
    start.setDate(now.getDate() - offset);
    start.setHours(7, 30, 0, 0);
    const stop = new Date(start);
    stop.setHours(start.getHours() + 8 + (offset % 4));
    await tripRepo.save(
      tripRepo.create({
        driverId: featured.driverId,
        vehicleNumber: featured.vehicle,
        startTime: start,
        isRunning: false,
        stopTime: stop,
      }),
    );
  }
  for (const d of DRIVERS) {
    await tripRepo.save(
      tripRepo.create({
        driverId: d.driverId,
        vehicleNumber: d.vehicle,
        startTime: new Date(now.getTime() - 4 * 3600_000),
        isRunning: false,
        stopTime: now,
      }),
    );
    await sheetRepo.save(
      sheetRepo.create({
        tripNumber: `TRIP-${d.driverId}-${now.getTime()}`,
        vehicleNumber: d.vehicle,
        driverId: d.driverId,
        driverName: `${d.firstName} ${d.surname}`,
        origin: 'Bangalore',
        destination: 'Hyderabad',
        loadingDate: new Date(now.getTime() - 24 * 3600_000),
        unloadingDate: now,
        material: 'Cement',
        weight: '8000',
        freight: '32000',
        advancePaid: '5000',
        balanceFreight: '27000',
        status: 'Completed',
      }),
    );
    await locRepo.save(
      locRepo.create({
        vehicleNumber: d.vehicle,
        lat: '12.9716',
        lng: '77.5946',
        speed: '0',
        recordedAt: now,
      }),
    );
    await histRepo.save(
      histRepo.create({
        vehicleNumber: d.vehicle,
        time: now.toISOString(),
        location: '12.9716,77.5946',
      }),
    );
  }
  log(`✅ Trips/sheets/locations: ${DRIVERS.length} of each`);
}

async function seedEscalations(): Promise<void> {
  const repo = AppDataSource.getRepository(Escalation);
  const featured = VEHICLES[0].number;
  const now = new Date();
  const daysAgo = (n: number): Date => {
    const d = new Date(now);
    d.setDate(now.getDate() - n);
    return d;
  };
  await repo.save([
    repo.create({
      vehicle: featured,
      category: 'Brake check',
      severity: EscalationSeverity.HIGH,
      note: 'Pedal feels soft',
      raisedBy: 'Amit Verma',
      status: EscalationStatus.OPEN,
      createdAt: daysAgo(1),
    }),
    repo.create({
      vehicle: featured,
      category: 'Fuel',
      severity: EscalationSeverity.MEDIUM,
      note: 'Mismatch on 17th — claimed 145L but receipt was 130L',
      raisedBy: 'Amit Verma',
      status: EscalationStatus.RESOLVED,
      createdAt: daysAgo(12),
      resolvedAt: daysAgo(9),
      resolvedBy: 'Manager',
    }),
    repo.create({
      vehicle: featured,
      category: 'Schedule',
      severity: EscalationSeverity.LOW,
      note: 'Skipped scheduled service window',
      raisedBy: 'Sunita Pillai',
      status: EscalationStatus.REOPENED,
      createdAt: daysAgo(28),
    }),
    repo.create({
      vehicle: featured,
      category: 'DoubleFill',
      severity: EscalationSeverity.HIGH,
      note: 'Two fills logged within 2 hours',
      raisedBy: 'Amit Verma',
      status: EscalationStatus.OPEN,
      createdAt: daysAgo(40),
    }),
    repo.create({
      vehicle: VEHICLES[2].number,
      category: 'Tyre wear',
      severity: EscalationSeverity.MEDIUM,
      note: 'Front-left near limit',
      raisedBy: 'Sunita Pillai',
      status: EscalationStatus.OPEN,
    }),
  ]);
  log(`✅ Escalations: 5 (4 on ${featured}, 1 on ${VEHICLES[2].number})`);
}

async function run(): Promise<void> {
  await AppDataSource.initialize();
  try {
    await truncateAll();
    await seedUsers();
    await seedCustomers();
    await seedVehicles();
    await seedDrivers();
    await seedTrackerEmployees();
    await seedSchedules();
    await seedFillsAndOdometer();
    await seedAttendanceAdvanceLeave();
    await seedTripsAndLocations();
    await seedEscalations();

    log('');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('Login credentials');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log(`  Super Admin   ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    log(`                Rajesh Kumar`);
    log(`  Manager       ${MANAGER_EMAIL} / ${MANAGER_PASSWORD}`);
    log(`                Priya Sharma`);
    log(`  Supervisor    x-emp-password header = tracker123`);
    log(`                (tracker employee row: Amit Verma)`);
    log('');
    log('Drivers (OTP via /send-otp/sended → backend logs the code if no Twilio):');
    DRIVERS.forEach((d) =>
      log(`  ${d.driverId}  ${d.firstName} ${d.surname}  ${d.phone}  → ${d.vehicle}`),
    );
    log('');
    log('Vehicles:');
    VEHICLES.forEach((v) =>
      log(`  ${v.number}  ${v.type}  (${v.kmPerLitre} km/L target, ${v.litresPerFill} L/fill)`),
    );
    log('');
  } finally {
    await AppDataSource.destroy();
  }
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
