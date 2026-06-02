import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFiguraToAccionAndTarea1779660290327
  implements MigrationInterface
{
  name = 'AddFiguraToAccionAndTarea1779660290327';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "Figura" ("id_figura" SERIAL NOT NULL, "nombre" character varying NOT NULL, "codigo" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_ff6ff9e8e1e32e29c03cd9fa890" UNIQUE ("codigo"), CONSTRAINT "PK_3b22eeb87237d41d62fab52f94b" PRIMARY KEY ("id_figura"))`,
    );

    await queryRunner.query(`
      INSERT INTO "Figura" ("nombre", "codigo")
      VALUES
        ('Círculo', 'circulo'),
        ('Rectángulo', 'rectangulo'),
        ('Rombo', 'rombo')
    `);

    await queryRunner.query(`ALTER TABLE "Accion" ADD "id_figura" integer`);

    await queryRunner.query(`
      UPDATE "Accion"
      SET "id_figura" = (
        SELECT "id_figura" FROM "Figura" WHERE "codigo" = 'rectangulo'
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "Accion" ALTER COLUMN "id_figura" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "Tarea" ADD "texto_figura" character varying`,
    );

    await queryRunner.query(`
      UPDATE "Tarea" SET "texto_figura" = "descripcion"
    `);

    await queryRunner.query(
      `ALTER TABLE "Tarea" ALTER COLUMN "texto_figura" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "Accion" ADD CONSTRAINT "FK_25e9339029f5295fcd42156eddb" FOREIGN KEY ("id_figura") REFERENCES "Figura"("id_figura") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Accion" DROP CONSTRAINT "FK_25e9339029f5295fcd42156eddb"`,
    );
    await queryRunner.query(`ALTER TABLE "Tarea" DROP COLUMN "texto_figura"`);
    await queryRunner.query(`ALTER TABLE "Accion" DROP COLUMN "id_figura"`);
    await queryRunner.query(`DROP TABLE "Figura"`);
  }
}
