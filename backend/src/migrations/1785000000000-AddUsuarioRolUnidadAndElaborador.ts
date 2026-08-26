import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsuarioRolUnidadAndElaborador1785000000000
  implements MigrationInterface
{
  name = 'AddUsuarioRolUnidadAndElaborador1785000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "usuario_rol_unidad" (
        "id" SERIAL NOT NULL,
        "id_usuario" integer NOT NULL,
        "id_rol" integer NOT NULL,
        "id_unidad" integer NOT NULL,
        CONSTRAINT "PK_usuario_rol_unidad" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_usuario_rol_unidad" UNIQUE ("id_usuario", "id_rol", "id_unidad"),
        CONSTRAINT "FK_uru_usuario" FOREIGN KEY ("id_usuario")
          REFERENCES "Usuario"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_uru_rol" FOREIGN KEY ("id_rol")
          REFERENCES "Rol"("id_rol") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_uru_unidad" FOREIGN KEY ("id_unidad")
          REFERENCES "Unidad"("id_unidad") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "Procedimiento"
      ADD "id_elaborador" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "Procedimiento"
      ADD CONSTRAINT "FK_procedimiento_elaborador"
      FOREIGN KEY ("id_elaborador") REFERENCES "Usuario"("id_usuario")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "Procedimiento" DROP CONSTRAINT "FK_procedimiento_elaborador"
    `);
    await queryRunner.query(`
      ALTER TABLE "Procedimiento" DROP COLUMN "id_elaborador"
    `);
    await queryRunner.query(`DROP TABLE "usuario_rol_unidad"`);
  }
}
