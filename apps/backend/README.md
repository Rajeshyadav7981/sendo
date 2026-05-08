# sendo-backend-nest

NestJS 11 + Fastify + **TypeORM** + PostgreSQL + Redis port of the legacy Express/Mongo `sendo-backend`.

## Stack
- **Framework:** NestJS 11 with the Fastify HTTP adapter
- **Database:** PostgreSQL 16 via **TypeORM 0.3** (entity-per-class, native enums, JSONB)
- **Cache / OTP / sessions:** Redis (ioredis)
- **Auth:** JWT in `httpOnly; secure; sameSite=strict` cookie, Passport JWT strategy
- **Validation:** `class-validator` + global `ValidationPipe`
- **Logging:** Pino structured logs
- **Realtime:** Socket.IO via `@nestjs/websockets`
- **Files:** `@fastify/multipart` (S3 adapter ready in `common/utils/storage`)
- **Background jobs:** BullMQ (added per-module as needed)

## Default DB connection (matches `docker-compose.yml`)
```
host:     localhost
port:     54322
user:     demo
password: demo
database: demo
```

## Folder layout
```
src/
  main.ts                       # bootstrap (Fastify, global pipes/filters, Swagger)
  app.module.ts                 # root module — wires DatabaseModule + features
  common/                       # filters, guards, interceptors, pipes, decorators, redis, utils
  config/                       # @nestjs/config namespaces (app, database, redis, jwt, mail, twilio, otp)
  database/
    data-source.ts              # CLI-friendly TypeORM DataSource (used by migrations + seed)
    database.module.ts          # TypeOrmModule.forRootAsync wired from ConfigService
    seed.ts                     # idempotent admin user seed
    migrations/                 # generated migration files
  modules/
    auth/
      entities/                 # User, OtpUser
      ...                       # service, controller, JWT strategy, guards, OTP store
    driver/
      entities/                 # Driver
      ...
    vehicle/
      entities/                 # Vehicle, Diesel, OilService, SparePart, Expense, OtherExpense, TruckMaintenance, TyreReplacement
      services/                 # one service per sub-resource
      ...
    vendor/   entities/Vendor
    customer/ entities/Customer, CustomerInvoice, CustomerPayment, Agreement, GstEntry
    attendance/ entities/Attendance, Timesheet
    trip/     entities/Trip, TripSheet
    billing/  entities/DriverAdvance, Leave, DriverPayout, SalaryPayment, Deduction, VendorAdvance, VendorDeduction, VendorPayment
    tracking/ entities/VehicleLocation, VehicleHistory, VehicleParking + Socket.IO gateway
    notification/                # MailService + SmsService
    health/                      # /health (DataSource ping + Redis ping)
```

## Local dev
```bash
cp .env.example .env             # fill in JWT_SECRET, COOKIE_SECRET, EMAIL_*, TWILIO_*
npm install
docker compose -f docker/docker-compose.yml up -d   # postgres on 54322, redis on 6379
npm run schema:sync              # one-shot: create all tables from entities (dev only)
# OR for production-style migrations:
npm run migration:generate -- src/database/migrations/Init
npm run migration:run

npm run seed                     # creates an admin@sendo.local user
npm run start:dev                # http://localhost:5001 (Swagger /docs)
```

## TypeORM CLI shortcuts
```bash
npm run migration:generate -- src/database/migrations/<Name>   # diff entities → migration
npm run migration:run                                          # apply pending migrations
npm run migration:revert                                       # roll back the last
npm run schema:sync                                            # sync schema without writing a migration (dev only)
npm run schema:drop                                            # drop all tables (DANGEROUS)
```

## Migration mapping (Express → Nest)
| Legacy file                                 | New module                |
|---------------------------------------------|---------------------------|
| `Routers/AuthRouter.js`                     | `modules/auth`            |
| `Routers/otpRouter.js`                      | `modules/otp`             |
| `Routers/OnboardingRouters.js` (driver)     | `modules/driver`          |
| `Routers/OnboardingRouters.js` (vehicle)    | `modules/vehicle`         |
| `Routers/OnboardingRouters.js` (vendor)     | `modules/vendor`          |
| `Routers/OnboardingRouters.js` (timesheet)  | `modules/attendance`      |
| `Routers/VehicleRoute.js`                   | `modules/vehicle/*`       |
| `Routers/TripRouter.js`                     | `modules/trip`            |
| `Routers/AttendanceRoute.js`                | `modules/attendance`      |
| `Routers/AdvanceApproval.js`                | `modules/billing`         |
| `Routers/CustomerRouter.js`                 | `modules/customer`        |
| `Routers/Home.js` + Socket.IO in server2    | `modules/tracking`        |
| `DriverRoute.js` (deductions)               | `modules/billing`         |
| `Middlewares/userAuth.js`                   | `modules/auth/guards`     |

## Notes on TypeORM types
- All `decimal`/`numeric` columns are typed as `string | null` because the `pg`
  driver returns numerics as strings to preserve precision. Convert via
  `Number(...)` only at the boundary of math-heavy code paths.
- Native PostgreSQL enums are used for stable, finite sets (`UserRole`,
  `VehicleType`, `YesNo`, `AttendanceStatus`, `ApprovalStatus`,
  `MaintenanceType`, `SparePartCategory`, `ExpenseType`, `PaymentMethod`,
  `VendorSite`).
- Sparse fields with high cardinality and irregular shape (e.g. truck
  maintenance subtype-specific data, document version history) live in
  `jsonb` columns instead of being modelled as 80+ optional columns.
