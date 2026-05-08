import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Append-only change log written by the AuditLogInterceptor on every
 * non-GET request that names an entity. Diff payloads stay small (hashes
 * + a few key fields) so this table can run for years without bloating.
 */
export class AuditLog1778087478000 implements MigrationInterface {
  name = 'AuditLog1778087478000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "sendo"."audit_log_action_enum" AS ENUM ('create','update','delete','approve','reject','login','logout','other')`,
    );
    await queryRunner.query(`
      CREATE TABLE "sendo"."audit_log" (
        "id" uuid NOT NULL DEFAULT public.uuid_generate_v4(),
        "action" "sendo"."audit_log_action_enum" NOT NULL,
        "entity_type" character varying(64),
        "entity_id" character varying(64),
        "actor_user_id" uuid,
        "actor_driver_id" character varying(32),
        "actor_label" character varying(200),
        "actor_role" character varying(32),
        "method" character varying(8),
        "route" character varying(256),
        "status_code" integer,
        "ip_address" character varying(64),
        "user_agent" character varying(256),
        "before" jsonb,
        "after" jsonb,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_log" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_log_entity" ON "sendo"."audit_log" ("entity_type","entity_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_log_actor_user" ON "sendo"."audit_log" ("actor_user_id","created_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_log_actor_driver" ON "sendo"."audit_log" ("actor_driver_id","created_at" DESC) WHERE "actor_driver_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_log_created_at" ON "sendo"."audit_log" ("created_at" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "sendo"."IDX_audit_log_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "sendo"."IDX_audit_log_actor_driver"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "sendo"."IDX_audit_log_actor_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "sendo"."IDX_audit_log_entity"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sendo"."audit_log"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sendo"."audit_log_action_enum"`);
  }
}
