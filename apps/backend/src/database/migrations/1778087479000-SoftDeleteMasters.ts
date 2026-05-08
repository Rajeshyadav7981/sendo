import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Soft-delete on the four master tables that didn't get it in Wave 1.
 * Adds a nullable deleted_at; entities use @DeleteDateColumn so TypeORM
 * filters soft-deleted rows from default `find()` queries.
 */
export class SoftDeleteMasters1778087479000 implements MigrationInterface {
  name = 'SoftDeleteMasters1778087479000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tables = ['customers', 'vendors', 'trip_sheets', 'tracker_employees'];
    for (const t of tables) {
      await queryRunner.query(
        `ALTER TABLE "sendo"."${t}" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = ['tracker_employees', 'trip_sheets', 'vendors', 'customers'];
    for (const t of tables) {
      await queryRunner.query(`ALTER TABLE "sendo"."${t}" DROP COLUMN IF EXISTS "deleted_at"`);
    }
  }
}
