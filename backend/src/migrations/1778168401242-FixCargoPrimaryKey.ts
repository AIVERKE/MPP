import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixCargoPrimaryKey1778168401242 implements MigrationInterface {
  name = 'FixCargoPrimaryKey1778168401242';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "unidad_cargos" DROP CONSTRAINT "FK_65d83c03f3e84b46b606b7b2330"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cargo_proceso" DROP CONSTRAINT "FK_f795040eac5a2e64ffc92c44b03"`,
    );
    await queryRunner.query(
      `ALTER TABLE "operacion_cargo" DROP CONSTRAINT "FK_b1d878b5e12a6b64c143734f6ea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cargo" ALTER COLUMN "id_cargo" DROP DEFAULT`,
    );
    await queryRunner.query(`DROP SEQUENCE "cargo_id_cargo_seq"`);
    await queryRunner.query(
      `ALTER TABLE "cargo_proceso" ADD CONSTRAINT "FK_f795040eac5a2e64ffc92c44b03" FOREIGN KEY ("id_cargo") REFERENCES "cargo"("id_cargo") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "operacion_cargo" ADD CONSTRAINT "FK_b1d878b5e12a6b64c143734f6ea" FOREIGN KEY ("id_cargo") REFERENCES "cargo"("id_cargo") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "unidad_cargos" ADD CONSTRAINT "FK_65d83c03f3e84b46b606b7b2330" FOREIGN KEY ("id_cargo") REFERENCES "cargo"("id_cargo") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "unidad_cargos" DROP CONSTRAINT "FK_65d83c03f3e84b46b606b7b2330"`,
    );
    await queryRunner.query(
      `ALTER TABLE "operacion_cargo" DROP CONSTRAINT "FK_b1d878b5e12a6b64c143734f6ea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cargo_proceso" DROP CONSTRAINT "FK_f795040eac5a2e64ffc92c44b03"`,
    );
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "cargo_id_cargo_seq" OWNED BY "cargo"."id_cargo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cargo" ALTER COLUMN "id_cargo" SET DEFAULT nextval('"cargo_id_cargo_seq"')`,
    );
    await queryRunner.query(
      `ALTER TABLE "operacion_cargo" ADD CONSTRAINT "FK_b1d878b5e12a6b64c143734f6ea" FOREIGN KEY ("id_cargo") REFERENCES "cargo"("id_cargo") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cargo_proceso" ADD CONSTRAINT "FK_f795040eac5a2e64ffc92c44b03" FOREIGN KEY ("id_cargo") REFERENCES "cargo"("id_cargo") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "unidad_cargos" ADD CONSTRAINT "FK_65d83c03f3e84b46b606b7b2330" FOREIGN KEY ("id_cargo") REFERENCES "cargo"("id_cargo") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }
}
