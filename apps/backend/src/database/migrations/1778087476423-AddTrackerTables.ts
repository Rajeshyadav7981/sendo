import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTrackerTables1778087476423 implements MigrationInterface {
    name = 'AddTrackerTables1778087476423'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sendo"."tracker_schedules" ("vehicle" character varying(64) NOT NULL, "interval_days" integer NOT NULL DEFAULT '0', "litres" integer NOT NULL DEFAULT '0', "km_per_litre" numeric(8,2) NOT NULL DEFAULT '0', "km_per_fill" integer NOT NULL DEFAULT '0', "actual_km" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_40987f41b2439397573269f6c53" PRIMARY KEY ("vehicle"))`);
        await queryRunner.query(`CREATE TABLE "sendo"."tracker_odometer_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "vehicle" character varying(64) NOT NULL, "date_key" character varying(10) NOT NULL, "reading" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a19140352800510c3449d363e93" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_474331b6aaa2ff763380ea13c9" ON "sendo"."tracker_odometer_entries" ("vehicle") `);
        await queryRunner.query(`CREATE TABLE "sendo"."tracker_fills" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "month_key" character varying(7) NOT NULL, "vehicle" character varying(64) NOT NULL, "date_key" character varying(10) NOT NULL, "start_km" integer NOT NULL DEFAULT '0', "end_km" integer NOT NULL DEFAULT '0', "total_km" integer NOT NULL DEFAULT '0', "litres" numeric(10,3) NOT NULL DEFAULT '0', "rate" numeric(10,2) NOT NULL DEFAULT '0', "total_amount" numeric(12,2) NOT NULL DEFAULT '0', "photo_url" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "uq_tracker_fills_vehicle_date_month" UNIQUE ("vehicle", "date_key", "month_key"), CONSTRAINT "PK_78e64e3a43d3e6e320c64f82e3e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1774965ac1c111113c85213998" ON "sendo"."tracker_fills" ("vehicle") `);
        await queryRunner.query(`CREATE INDEX "IDX_beaec7a65da6d959ed619ab0e5" ON "sendo"."tracker_fills" ("month_key") `);
        await queryRunner.query(`CREATE TABLE "sendo"."tracker_employees" ("name" character varying(200) NOT NULL, "role" character varying(100), "phone" character varying(32), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_59b331e820ca99dd0711bc555af" PRIMARY KEY ("name"))`);
        await queryRunner.query(`CREATE TYPE "sendo"."tracker_escalations_severity_enum" AS ENUM('low', 'medium', 'high')`);
        await queryRunner.query(`CREATE TYPE "sendo"."tracker_escalations_status_enum" AS ENUM('open', 'resolved', 'reopened')`);
        await queryRunner.query(`CREATE TABLE "sendo"."tracker_escalations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "vehicle" character varying(64) NOT NULL, "category" character varying(100) NOT NULL, "severity" "sendo"."tracker_escalations_severity_enum" NOT NULL DEFAULT 'medium', "note" text, "raised_by" character varying(200), "status" "sendo"."tracker_escalations_status_enum" NOT NULL DEFAULT 'open', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bc120535de2568814d92da93864" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a7894165d94f77eab1c9975f58" ON "sendo"."tracker_escalations" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_39b9d5628711d43965bf361d93" ON "sendo"."tracker_escalations" ("vehicle") `);
        await queryRunner.query(`ALTER TABLE "sendo"."truck_maintenances" ALTER COLUMN "details" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "sendo"."truck_maintenances" ALTER COLUMN "uploaded_documents" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "sendo"."vehicles" ALTER COLUMN "schedule_date_history" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "sendo"."vehicles" ALTER COLUMN "document_history" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "sendo"."driver_payouts" ALTER COLUMN "attendance_data" SET DEFAULT '[]'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sendo"."driver_payouts" ALTER COLUMN "attendance_data" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "sendo"."vehicles" ALTER COLUMN "document_history" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "sendo"."vehicles" ALTER COLUMN "schedule_date_history" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "sendo"."truck_maintenances" ALTER COLUMN "uploaded_documents" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "sendo"."truck_maintenances" ALTER COLUMN "details" SET DEFAULT '{}'`);
        await queryRunner.query(`DROP INDEX "sendo"."IDX_39b9d5628711d43965bf361d93"`);
        await queryRunner.query(`DROP INDEX "sendo"."IDX_a7894165d94f77eab1c9975f58"`);
        await queryRunner.query(`DROP TABLE "sendo"."tracker_escalations"`);
        await queryRunner.query(`DROP TYPE "sendo"."tracker_escalations_status_enum"`);
        await queryRunner.query(`DROP TYPE "sendo"."tracker_escalations_severity_enum"`);
        await queryRunner.query(`DROP TABLE "sendo"."tracker_employees"`);
        await queryRunner.query(`DROP INDEX "sendo"."IDX_beaec7a65da6d959ed619ab0e5"`);
        await queryRunner.query(`DROP INDEX "sendo"."IDX_1774965ac1c111113c85213998"`);
        await queryRunner.query(`DROP TABLE "sendo"."tracker_fills"`);
        await queryRunner.query(`DROP INDEX "sendo"."IDX_474331b6aaa2ff763380ea13c9"`);
        await queryRunner.query(`DROP TABLE "sendo"."tracker_odometer_entries"`);
        await queryRunner.query(`DROP TABLE "sendo"."tracker_schedules"`);
    }

}
