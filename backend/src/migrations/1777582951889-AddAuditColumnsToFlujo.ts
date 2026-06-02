import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditColumnsToFlujo1777582951889 implements MigrationInterface {
  name = 'AddAuditColumnsToFlujo1777582951889';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Accion" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "Accion" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "Accion" ADD "deleted_at" TIMESTAMP`);

    await queryRunner.query(
      `ALTER TABLE "Actividad" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "Actividad" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "Actividad" ADD "deleted_at" TIMESTAMP`,
    );

    await queryRunner.query(
      `ALTER TABLE "Operacion" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "Operacion" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "Operacion" ADD "deleted_at" TIMESTAMP`,
    );

    await queryRunner.query(
      `ALTER TABLE "operacion_cargo" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "operacion_cargo" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "operacion_cargo" ADD "deleted_at" TIMESTAMP`,
    );

    await queryRunner.query(
      `ALTER TABLE "Tarea" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "Tarea" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "Tarea" ADD "deleted_at" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Tarea" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "Tarea" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "Tarea" DROP COLUMN "created_at"`);

    await queryRunner.query(
      `ALTER TABLE "operacion_cargo" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "operacion_cargo" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "operacion_cargo" DROP COLUMN "created_at"`,
    );

    await queryRunner.query(`ALTER TABLE "Operacion" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "Operacion" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "Operacion" DROP COLUMN "created_at"`);

    await queryRunner.query(`ALTER TABLE "Actividad" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "Actividad" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "Actividad" DROP COLUMN "created_at"`);

    await queryRunner.query(`ALTER TABLE "Accion" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "Accion" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "Accion" DROP COLUMN "created_at"`);
  }
}
