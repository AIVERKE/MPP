import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditoriaCambios1779900000000 implements MigrationInterface {
  name = 'AddAuditoriaCambios1779900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "Auditoria_Cambios" (
        "id_auditoria" SERIAL NOT NULL,
        "tabla_afectada" character varying NOT NULL,
        "id_registro_original" integer NOT NULL,
        "accion" character varying NOT NULL,
        "datos_anteriores" json NOT NULL,
        "datos_nuevos" json,
        "id_usuario" integer,
        "fecha_cambio" TIMESTAMP NOT NULL DEFAULT now(),
        "motivo_cambio" text,
        CONSTRAINT "PK_auditoria_cambios_id" PRIMARY KEY ("id_auditoria")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "Auditoria_Cambios" ADD CONSTRAINT "FK_auditoria_cambios_usuario" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Auditoria_Cambios" DROP CONSTRAINT "FK_auditoria_cambios_usuario"`,
    );
    await queryRunner.query(`DROP TABLE "Auditoria_Cambios"`);
  }
}
