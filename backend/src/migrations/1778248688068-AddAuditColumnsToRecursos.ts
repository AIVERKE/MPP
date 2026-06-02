import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditColumnsToRecursos1778248688068 implements MigrationInterface {
  name = 'AddAuditColumnsToRecursos1778248688068';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sistema_informacion" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "sistema_informacion" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "sistema_informacion" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "Riesgo" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "Riesgo" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "Riesgo" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "Requisitos" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "Requisitos" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "Requisitos" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipos" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipos" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "equipos" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "Control" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "Control" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "Control" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "documento_referencia" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "documento_referencia" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "documento_referencia" ADD "deleted_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "documento_referencia" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documento_referencia" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documento_referencia" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(`ALTER TABLE "Control" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "Control" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "Control" DROP COLUMN "created_at"`);
    await queryRunner.query(`ALTER TABLE "equipos" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "equipos" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "equipos" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "Requisitos" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Requisitos" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Requisitos" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(`ALTER TABLE "Riesgo" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "Riesgo" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "Riesgo" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "sistema_informacion" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sistema_informacion" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sistema_informacion" DROP COLUMN "created_at"`,
    );
  }
}
