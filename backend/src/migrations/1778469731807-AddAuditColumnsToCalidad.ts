import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditColumnsToCalidad1778469731807 implements MigrationInterface {
  name = 'AddAuditColumnsToCalidad1778469731807';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Normativa" ADD "creado_en" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "Normativa" ADD "creado_por" integer`);
    await queryRunner.query(
      `ALTER TABLE "Normativa" ADD "modificado_en" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "Normativa" ADD "modificado_por" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "Normativa" ADD "eliminado_en" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "Indicador" ADD "creado_en" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "Indicador" ADD "creado_por" integer`);
    await queryRunner.query(
      `ALTER TABLE "Indicador" ADD "modificado_en" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "Indicador" ADD "modificado_por" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "Indicador" ADD "eliminado_en" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Indicador" DROP COLUMN "eliminado_en"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Indicador" DROP COLUMN "modificado_por"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Indicador" DROP COLUMN "modificado_en"`,
    );
    await queryRunner.query(`ALTER TABLE "Indicador" DROP COLUMN "creado_por"`);
    await queryRunner.query(`ALTER TABLE "Indicador" DROP COLUMN "creado_en"`);
    await queryRunner.query(
      `ALTER TABLE "Normativa" DROP COLUMN "eliminado_en"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Normativa" DROP COLUMN "modificado_por"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Normativa" DROP COLUMN "modificado_en"`,
    );
    await queryRunner.query(`ALTER TABLE "Normativa" DROP COLUMN "creado_por"`);
    await queryRunner.query(`ALTER TABLE "Normativa" DROP COLUMN "creado_en"`);
  }
}
