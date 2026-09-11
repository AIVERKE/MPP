import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandFigurasCatalog1785200000000 implements MigrationInterface {
  name = 'ExpandFigurasCatalog1785200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "Figura"
      ADD "es_oficial" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE "Figura"
      DROP CONSTRAINT IF EXISTS "UQ_ff6ff9e8e1e32e29c03cd9fa890"
    `);

    await queryRunner.query(`
      UPDATE "Figura"
      SET "deleted_at" = now()
      WHERE "codigo" LIKE 'figura_custom_%'
        AND "deleted_at" IS NULL
    `);

    const oficiales: Array<{ nombre: string; codigo: string }> = [
      { nombre: 'Círculo', codigo: 'circulo' },
      { nombre: 'Rectángulo', codigo: 'rectangulo' },
      { nombre: 'Rombo', codigo: 'rombo' },
      { nombre: 'Elipse', codigo: 'elipse' },
      { nombre: 'Paralelogramo', codigo: 'paralelogramo' },
      { nombre: 'Triángulo', codigo: 'triangulo' },
      { nombre: 'Hexágono', codigo: 'hexagono' },
    ];

    for (const figura of oficiales) {
      await queryRunner.query(
        `
        INSERT INTO "Figura" ("nombre", "codigo", "es_oficial")
        SELECT $1, $2, true
        WHERE NOT EXISTS (
          SELECT 1 FROM "Figura"
          WHERE "codigo" = $2 AND "deleted_at" IS NULL
        )
        `,
        [figura.nombre, figura.codigo],
      );

      await queryRunner.query(
        `
        UPDATE "Figura"
        SET "es_oficial" = true, "nombre" = $1
        WHERE "codigo" = $2 AND "deleted_at" IS NULL
        `,
        [figura.nombre, figura.codigo],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "Figura" DROP COLUMN "es_oficial"
    `);

    await queryRunner.query(`
      ALTER TABLE "Figura"
      ADD CONSTRAINT "UQ_ff6ff9e8e1e32e29c03cd9fa890" UNIQUE ("codigo")
    `);
  }
}
