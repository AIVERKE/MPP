import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeletedAtToUsuario1784800000000 implements MigrationInterface {
  name = 'AddDeletedAtToUsuario1784800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Usuario" ADD "deleted_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Usuario" DROP COLUMN "deleted_at"`,
    );
  }
}
