import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIdUnidadToCargoProceso1784900000000 implements MigrationInterface {
  name = 'AddIdUnidadToCargoProceso1784900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cargo_proceso" ADD "id_unidad" integer NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "cargo_proceso" ADD CONSTRAINT "FK_cargo_proceso_unidad" FOREIGN KEY ("id_unidad") REFERENCES "Unidad"("id_unidad") ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cargo_proceso" DROP CONSTRAINT "FK_cargo_proceso_unidad"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cargo_proceso" DROP COLUMN "id_unidad"`,
    );
  }
}
