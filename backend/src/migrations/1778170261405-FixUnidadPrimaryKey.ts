import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixUnidadPrimaryKey1778170261405 implements MigrationInterface {
  name = 'FixUnidadPrimaryKey1778170261405';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "proceso_unidad" DROP CONSTRAINT "FK_e7481de8dc81e9aaae594c333a4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedimiento_instalacion" DROP CONSTRAINT "FK_04df8efc4d0658a912dfabd58da"`,
    );
    await queryRunner.query(
      `ALTER TABLE "unidad_cargos" DROP CONSTRAINT "FK_e6b8be1137c714f5c31c5565b70"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Unidad" ALTER COLUMN "id_unidad" DROP DEFAULT`,
    );
    await queryRunner.query(`DROP SEQUENCE "Unidad_id_unidad_seq"`);
    await queryRunner.query(
      `ALTER TABLE "unidad_cargos" ADD CONSTRAINT "FK_e6b8be1137c714f5c31c5565b70" FOREIGN KEY ("id_unidad") REFERENCES "Unidad"("id_unidad") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "proceso_unidad" ADD CONSTRAINT "FK_e7481de8dc81e9aaae594c333a4" FOREIGN KEY ("id_unidad") REFERENCES "Unidad"("id_unidad") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedimiento_instalacion" ADD CONSTRAINT "FK_04df8efc4d0658a912dfabd58da" FOREIGN KEY ("id_unidad") REFERENCES "Unidad"("id_unidad") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "procedimiento_instalacion" DROP CONSTRAINT "FK_04df8efc4d0658a912dfabd58da"`,
    );
    await queryRunner.query(
      `ALTER TABLE "proceso_unidad" DROP CONSTRAINT "FK_e7481de8dc81e9aaae594c333a4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "unidad_cargos" DROP CONSTRAINT "FK_e6b8be1137c714f5c31c5565b70"`,
    );
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "Unidad_id_unidad_seq" OWNED BY "Unidad"."id_unidad"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Unidad" ALTER COLUMN "id_unidad" SET DEFAULT nextval('"Unidad_id_unidad_seq"')`,
    );
    await queryRunner.query(
      `ALTER TABLE "unidad_cargos" ADD CONSTRAINT "FK_e6b8be1137c714f5c31c5565b70" FOREIGN KEY ("id_unidad") REFERENCES "Unidad"("id_unidad") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedimiento_instalacion" ADD CONSTRAINT "FK_04df8efc4d0658a912dfabd58da" FOREIGN KEY ("id_unidad") REFERENCES "Unidad"("id_unidad") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "proceso_unidad" ADD CONSTRAINT "FK_e7481de8dc81e9aaae594c333a4" FOREIGN KEY ("id_unidad") REFERENCES "Unidad"("id_unidad") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }
}
