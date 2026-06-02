import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditColumnsToProcesos1777572951889 implements MigrationInterface {
  name = 'AddAuditColumnsToProcesos1777572951889';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cargo_proceso" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "cargo_proceso" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "cargo_proceso" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "Proceso" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "Proceso" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "Proceso" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "Procedimiento" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "Procedimiento" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "Procedimiento" ADD "deleted_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Procedimiento" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Procedimiento" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Procedimiento" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(`ALTER TABLE "Proceso" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "Proceso" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "Proceso" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "cargo_proceso" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cargo_proceso" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cargo_proceso" DROP COLUMN "created_at"`,
    );
  }
}
