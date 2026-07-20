import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEstadoVersionToProcedimiento1784508641280 implements MigrationInterface {
    name = 'AddEstadoVersionToProcedimiento1784508641280'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Instalacion" DROP CONSTRAINT "FK_instalacion_unidad"`);
        await queryRunner.query(`ALTER TABLE "Auditoria_Cambios" DROP CONSTRAINT "FK_auditoria_cambios_usuario"`);
        await queryRunner.query(`ALTER TABLE "Procedimiento" ADD "estado_version" character varying NOT NULL DEFAULT 'Borrador'`);
        await queryRunner.query(`ALTER TABLE "Instalacion" ADD CONSTRAINT "FK_6355a197810e347eed4d3c62bba" FOREIGN KEY ("id_unidad") REFERENCES "Unidad"("id_unidad") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Auditoria_Cambios" ADD CONSTRAINT "FK_4cba8151fd386ae9854081646b6" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Auditoria_Cambios" DROP CONSTRAINT "FK_4cba8151fd386ae9854081646b6"`);
        await queryRunner.query(`ALTER TABLE "Instalacion" DROP CONSTRAINT "FK_6355a197810e347eed4d3c62bba"`);
        await queryRunner.query(`ALTER TABLE "Procedimiento" DROP COLUMN "estado_version"`);
        await queryRunner.query(`ALTER TABLE "Auditoria_Cambios" ADD CONSTRAINT "FK_auditoria_cambios_usuario" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Instalacion" ADD CONSTRAINT "FK_instalacion_unidad" FOREIGN KEY ("id_unidad") REFERENCES "Unidad"("id_unidad") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
