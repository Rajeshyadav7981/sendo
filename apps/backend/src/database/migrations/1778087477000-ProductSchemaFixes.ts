import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Wave 1 schema fixes — product-driven gaps identified in the audit.
 *
 *   New tables:
 *     - vehicle_documents      doc-expiry watchdog (PRODUCT_GUIDE §4.3)
 *     - notifications          per-user inbox (push notifications ⚠ in §6)
 *     - device_tokens          FCM/web-push registration
 *     - gps_pings              append-only GPS log (§4.1 live tracking)
 *     - driver_assignments     driver↔vehicle history (driver app needs it)
 *
 *   Column additions:
 *     - attendances.lat/lng/accuracy_m + approved_by/approved_at
 *     - driver_advances.reason + rejected_reason
 *     - leaves.approved_by/approved_at
 *     - trip_sheets.customer_id/driver_id/vehicle_id + pod_url + loading_slip_url
 *     - drivers.is_active + assigned_vehicle_id
 *     - vehicles.is_active
 *     - tracker_employees.email + password_hash
 *
 *   Enum:
 *     - users_role_enum += 'SUPERVISOR'
 */
export class ProductSchemaFixes1778087477000 implements MigrationInterface {
  name = 'ProductSchemaFixes1778087477000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Enum: add SUPERVISOR role ────────────────────────────────────────
    await queryRunner.query(
      `ALTER TYPE "sendo"."users_role_enum" ADD VALUE IF NOT EXISTS 'SUPERVISOR'`,
    );

    // ── notification_type, notification_channel, audit_action enums ──────
    await queryRunner.query(
      `CREATE TYPE "sendo"."notifications_type_enum" AS ENUM (
        'advance_requested','advance_approved','advance_rejected',
        'leave_requested','leave_approved','leave_rejected',
        'attendance_approved','attendance_rejected',
        'document_expiring','document_expired',
        'trip_assigned','trip_started','trip_ended',
        'escalation_raised','escalation_resolved',
        'salary_approved','salary_paid',
        'system'
      )`,
    );
    await queryRunner.query(
      `CREATE TYPE "sendo"."device_token_platform_enum" AS ENUM ('web','ios','android')`,
    );
    await queryRunner.query(
      `CREATE TYPE "sendo"."vehicle_document_type_enum" AS ENUM (
        'registration_certificate','insurance','pollution_certificate',
        'fitness_certificate','road_tax','permit','state_permit',
        'temporary_permit','national_permit','other'
      )`,
    );
    await queryRunner.query(
      `CREATE TYPE "sendo"."attendances_type_enum" AS ENUM ('Full','Half','Absent','Holiday')`,
    );

    // ── Table: vehicle_documents ─────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "sendo"."vehicle_documents" (
        "id" uuid NOT NULL DEFAULT public.uuid_generate_v4(),
        "vehicle_id" uuid,
        "vehicle_number" character varying(32) NOT NULL,
        "type" "sendo"."vehicle_document_type_enum" NOT NULL,
        "document_number" character varying(100),
        "issue_date" date,
        "expiry_date" date,
        "issuing_authority" character varying(200),
        "file_url" text NOT NULL,
        "uploaded_by" character varying(200),
        "supersedes_id" uuid,
        "is_current" boolean NOT NULL DEFAULT true,
        "deleted_at" timestamp with time zone,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vehicle_documents" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_vehicle_documents_vehicle_type" ON "sendo"."vehicle_documents" ("vehicle_number","type") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vehicle_documents_expiry" ON "sendo"."vehicle_documents" ("expiry_date") WHERE "is_current" = true AND "deleted_at" IS NULL`,
    );

    // ── Table: notifications ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "sendo"."notifications" (
        "id" uuid NOT NULL DEFAULT public.uuid_generate_v4(),
        "recipient_user_id" uuid,
        "recipient_driver_id" character varying(32),
        "recipient_role" character varying(32),
        "type" "sendo"."notifications_type_enum" NOT NULL,
        "title" character varying(200) NOT NULL,
        "body" text,
        "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "entity_type" character varying(64),
        "entity_id" character varying(64),
        "read_at" timestamp with time zone,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_recipient_user_unread" ON "sendo"."notifications" ("recipient_user_id","read_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_recipient_driver_unread" ON "sendo"."notifications" ("recipient_driver_id","read_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_created_at" ON "sendo"."notifications" ("created_at")`,
    );

    // ── Table: device_tokens ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "sendo"."device_tokens" (
        "id" uuid NOT NULL DEFAULT public.uuid_generate_v4(),
        "user_id" uuid,
        "driver_id" character varying(32),
        "platform" "sendo"."device_token_platform_enum" NOT NULL,
        "token" text NOT NULL,
        "device_label" character varying(200),
        "last_seen_at" timestamp with time zone NOT NULL DEFAULT now(),
        "revoked_at" timestamp with time zone,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "PK_device_tokens" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_device_tokens_token" ON "sendo"."device_tokens" ("token") WHERE "revoked_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_device_tokens_user" ON "sendo"."device_tokens" ("user_id") WHERE "revoked_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_device_tokens_driver" ON "sendo"."device_tokens" ("driver_id") WHERE "revoked_at" IS NULL`,
    );

    // ── Table: gps_pings ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "sendo"."gps_pings" (
        "id" uuid NOT NULL DEFAULT public.uuid_generate_v4(),
        "vehicle_number" character varying(32) NOT NULL,
        "driver_id" character varying(32),
        "lat" numeric(10,6) NOT NULL,
        "lng" numeric(10,6) NOT NULL,
        "speed_kmph" numeric(8,2),
        "bearing" numeric(6,2),
        "accuracy_m" numeric(8,2),
        "ignition_on" boolean,
        "battery_pct" numeric(5,2),
        "recorded_at" timestamp with time zone NOT NULL DEFAULT now(),
        "received_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "PK_gps_pings" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_gps_pings_vehicle_recorded" ON "sendo"."gps_pings" ("vehicle_number","recorded_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_gps_pings_driver_recorded" ON "sendo"."gps_pings" ("driver_id","recorded_at" DESC) WHERE "driver_id" IS NOT NULL`,
    );

    // ── Table: driver_assignments ────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "sendo"."driver_assignments" (
        "id" uuid NOT NULL DEFAULT public.uuid_generate_v4(),
        "driver_id" character varying(32) NOT NULL,
        "vehicle_number" character varying(32) NOT NULL,
        "assigned_from" timestamp with time zone NOT NULL DEFAULT now(),
        "assigned_until" timestamp with time zone,
        "is_primary" boolean NOT NULL DEFAULT true,
        "assigned_by" character varying(200),
        "notes" text,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "PK_driver_assignments" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_driver_assignments_driver_active" ON "sendo"."driver_assignments" ("driver_id") WHERE "assigned_until" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_driver_assignments_vehicle_active" ON "sendo"."driver_assignments" ("vehicle_number") WHERE "assigned_until" IS NULL`,
    );

    // ── ALTERs: drivers ──────────────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "sendo"."drivers" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendo"."drivers" ADD COLUMN IF NOT EXISTS "assigned_vehicle_number" character varying(32)`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendo"."drivers" ADD COLUMN IF NOT EXISTS "fcm_token" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendo"."drivers" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone`,
    );

    // ── ALTERs: vehicles ─────────────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "sendo"."vehicles" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendo"."vehicles" ADD COLUMN IF NOT EXISTS "current_driver_id" character varying(32)`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendo"."vehicles" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone`,
    );

    // ── ALTERs: attendances ──────────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "sendo"."attendances" ADD COLUMN IF NOT EXISTS "lat" numeric(10,6)`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendo"."attendances" ADD COLUMN IF NOT EXISTS "lng" numeric(10,6)`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendo"."attendances" ADD COLUMN IF NOT EXISTS "accuracy_m" numeric(8,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendo"."attendances" ADD COLUMN IF NOT EXISTS "approved_by" character varying(200)`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendo"."attendances" ADD COLUMN IF NOT EXISTS "approved_at" timestamp with time zone`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendo"."attendances" ADD COLUMN IF NOT EXISTS "attendance_type" "sendo"."attendances_type_enum"`,
    );

    // ── ALTERs: driver_advances ──────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "sendo"."driver_advances" ADD COLUMN IF NOT EXISTS "reason" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendo"."driver_advances" ADD COLUMN IF NOT EXISTS "rejected_reason" text`,
    );

    // ── ALTERs: leaves ───────────────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "sendo"."leaves" ADD COLUMN IF NOT EXISTS "approved_by" character varying(200)`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendo"."leaves" ADD COLUMN IF NOT EXISTS "approved_at" timestamp with time zone`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendo"."leaves" ADD COLUMN IF NOT EXISTS "rejected_reason" text`,
    );

    // ── ALTERs: trip_sheets ──────────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "sendo"."trip_sheets" ADD COLUMN IF NOT EXISTS "customer_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendo"."trip_sheets" ADD COLUMN IF NOT EXISTS "customer_name" character varying(200)`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendo"."trip_sheets" ADD COLUMN IF NOT EXISTS "driver_id" character varying(32)`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendo"."trip_sheets" ADD COLUMN IF NOT EXISTS "pod_url" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendo"."trip_sheets" ADD COLUMN IF NOT EXISTS "loading_slip_url" text`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_trip_sheets_customer" ON "sendo"."trip_sheets" ("customer_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_trip_sheets_driver" ON "sendo"."trip_sheets" ("driver_id")`,
    );

    // ── ALTERs: trips (link to trip_sheets) ──────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "sendo"."trips" ADD COLUMN IF NOT EXISTS "trip_sheet_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendo"."trips" ADD COLUMN IF NOT EXISTS "start_lat" numeric(10,6)`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendo"."trips" ADD COLUMN IF NOT EXISTS "start_lng" numeric(10,6)`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendo"."trips" ADD COLUMN IF NOT EXISTS "end_lat" numeric(10,6)`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendo"."trips" ADD COLUMN IF NOT EXISTS "end_lng" numeric(10,6)`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendo"."trips" ADD COLUMN IF NOT EXISTS "start_km" numeric(12,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendo"."trips" ADD COLUMN IF NOT EXISTS "end_km" numeric(12,2)`,
    );

    // ── ALTERs: tracker_employees ────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "sendo"."tracker_employees" ADD COLUMN IF NOT EXISTS "email" character varying(200)`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendo"."tracker_employees" ADD COLUMN IF NOT EXISTS "password_hash" character varying(255)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_tracker_employees_email" ON "sendo"."tracker_employees" ("email") WHERE "email" IS NOT NULL`,
    );

    // ── ALTERs: tracker_escalations (resolved_by/at) ─────────────────────
    await queryRunner.query(
      `ALTER TABLE "sendo"."tracker_escalations" ADD COLUMN IF NOT EXISTS "resolved_by" character varying(200)`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendo"."tracker_escalations" ADD COLUMN IF NOT EXISTS "resolved_at" timestamp with time zone`,
    );

    // ── ALTERs: tracker_fills (entered_by) ───────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "sendo"."tracker_fills" ADD COLUMN IF NOT EXISTS "entered_by" character varying(200)`,
    );

    // ── ALTERs: tracker_odometer_entries ─────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "sendo"."tracker_odometer_entries" ADD COLUMN IF NOT EXISTS "entered_by" character varying(200)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_tracker_odometer_vehicle_date" ON "sendo"."tracker_odometer_entries" ("vehicle","date_key")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes that aren't auto-dropped with their tables
    await queryRunner.query(`DROP INDEX IF EXISTS "sendo"."UQ_tracker_odometer_vehicle_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "sendo"."UQ_tracker_employees_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "sendo"."IDX_trip_sheets_driver"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "sendo"."IDX_trip_sheets_customer"`);

    // Drop columns
    const stripCols: Array<[string, string[]]> = [
      ['tracker_odometer_entries', ['entered_by']],
      ['tracker_fills', ['entered_by']],
      ['tracker_escalations', ['resolved_at', 'resolved_by']],
      ['tracker_employees', ['password_hash', 'email']],
      ['trips', ['end_km', 'start_km', 'end_lng', 'end_lat', 'start_lng', 'start_lat', 'trip_sheet_id']],
      ['trip_sheets', ['loading_slip_url', 'pod_url', 'driver_id', 'customer_name', 'customer_id']],
      ['leaves', ['rejected_reason', 'approved_at', 'approved_by']],
      ['driver_advances', ['rejected_reason', 'reason']],
      ['attendances', ['attendance_type', 'approved_at', 'approved_by', 'accuracy_m', 'lng', 'lat']],
      ['vehicles', ['deleted_at', 'current_driver_id', 'is_active']],
      ['drivers', ['deleted_at', 'fcm_token', 'assigned_vehicle_number', 'is_active']],
    ];
    for (const [table, cols] of stripCols) {
      for (const col of cols) {
        await queryRunner.query(
          `ALTER TABLE "sendo"."${table}" DROP COLUMN IF EXISTS "${col}"`,
        );
      }
    }

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "sendo"."driver_assignments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sendo"."gps_pings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sendo"."device_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sendo"."notifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sendo"."vehicle_documents"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "sendo"."attendances_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sendo"."vehicle_document_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sendo"."device_token_platform_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sendo"."notifications_type_enum"`);
    // SUPERVISOR enum value cannot be removed in Postgres without recreating the enum.
  }
}
