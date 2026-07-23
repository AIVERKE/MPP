import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCondicionTarea1784700000000 implements MigrationInterface {
  name = 'AddCondicionTarea1784700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "CondicionTarea" (
        "id_condicion" SERIAL NOT NULL,
        "id_tarea" integer NOT NULL,
        "tipo_condicion" character varying NOT NULL,
        "expresion_condicion" text NOT NULL,
        "id_tarea_siguiente_if" integer,
        "id_tarea_siguiente_else" integer,
        "orden" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_CondicionTarea" PRIMARY KEY ("id_condicion")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "CondicionTarea"
      ADD CONSTRAINT "FK_CondicionTarea_tarea"
      FOREIGN KEY ("id_tarea") REFERENCES "Tarea"("id_tarea")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "CondicionTarea"
      ADD CONSTRAINT "FK_CondicionTarea_tarea_siguiente_if"
      FOREIGN KEY ("id_tarea_siguiente_if") REFERENCES "Tarea"("id_tarea")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "CondicionTarea"
      ADD CONSTRAINT "FK_CondicionTarea_tarea_siguiente_else"
      FOREIGN KEY ("id_tarea_siguiente_else") REFERENCES "Tarea"("id_tarea")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "CondicionTarea" DROP CONSTRAINT "FK_CondicionTarea_tarea_siguiente_else"`,
    );
    await queryRunner.query(
      `ALTER TABLE "CondicionTarea" DROP CONSTRAINT "FK_CondicionTarea_tarea_siguiente_if"`,
    );
    await queryRunner.query(
      `ALTER TABLE "CondicionTarea" DROP CONSTRAINT "FK_CondicionTarea_tarea"`,
    );
    await queryRunner.query(`DROP TABLE "CondicionTarea"`);
  }
}
