import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFillAuditCols1778087480000 implements MigrationInterface {
  name = 'AddFillAuditCols1778087480000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sendo"."tracker_fills" ADD COLUMN IF NOT EXISTS "paid_by" character varying(200)`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendo"."tracker_fills" ADD COLUMN IF NOT EXISTS "time_key" character varying(5)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sendo"."tracker_fills" DROP COLUMN IF EXISTS "time_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sendo"."tracker_fills" DROP COLUMN IF EXISTS "paid_by"`,
    );
  }
}
