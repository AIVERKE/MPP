import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTipoProcesoToProceso1785100000000
  implements MigrationInterface
{
  name = 'AddTipoProcesoToProceso1785100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "Proceso"
      ADD "tipo_proceso" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "Proceso" DROP COLUMN "tipo_proceso"
    `);
  }
}
