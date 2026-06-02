import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditColumnsToEstructura1777482964703 implements MigrationInterface {
  name = 'AddAuditColumnsToEstructura1777482964703';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cargo" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "cargo" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "cargo" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "Unidad" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "Unidad" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "Unidad" ADD "deleted_at" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Unidad" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "Unidad" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "Unidad" DROP COLUMN "created_at"`);
    await queryRunner.query(`ALTER TABLE "cargo" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "cargo" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "cargo" DROP COLUMN "created_at"`);
  }
}
