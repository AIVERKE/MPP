import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInstalacion1779800000000 implements MigrationInterface {
  name = 'AddInstalacion1779800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "Instalacion" ("id_instalacion" SERIAL NOT NULL, "nombre" character varying NOT NULL, "descripcion" text, "id_unidad" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_instalacion_id" PRIMARY KEY ("id_instalacion"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "Instalacion" ADD CONSTRAINT "FK_instalacion_unidad" FOREIGN KEY ("id_unidad") REFERENCES "Unidad"("id_unidad") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Instalacion" DROP CONSTRAINT "FK_instalacion_unidad"`,
    );
    await queryRunner.query(`DROP TABLE "Instalacion"`);
  }
}
