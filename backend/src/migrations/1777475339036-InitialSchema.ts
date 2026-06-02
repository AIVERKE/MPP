import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1777475339036 implements MigrationInterface {
  name = 'InitialSchema1777475339036';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "cargo" ("id_cargo" SERIAL NOT NULL, "nombre" character varying NOT NULL, "descripcion" text, CONSTRAINT "PK_701fe6d4275d459e4e9ca55fb8d" PRIMARY KEY ("id_cargo"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "Unidad" ("id_unidad" SERIAL NOT NULL, "nombre" character varying NOT NULL, "sigla" character varying, "nivel" character varying, "tipo_unidad" character varying, CONSTRAINT "PK_9f1f986baed6dad3f3cc020bca4" PRIMARY KEY ("id_unidad"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "cargo_proceso" ("id" SERIAL NOT NULL, "id_cargo" integer NOT NULL, "id_proceso" integer NOT NULL, "es_responsable_principal" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_9ebbf779a27da8ebccf2af97098" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "Proceso" ("id_proceso" SERIAL NOT NULL, "codigo" character varying, "nombre" character varying NOT NULL, "descripcion" text, CONSTRAINT "UQ_75079283623b04db41bd365c7b5" UNIQUE ("codigo"), CONSTRAINT "PK_7e48ffb3800c4cfb1ca83f40d35" PRIMARY KEY ("id_proceso"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "Procedimiento" ("id_procedimiento" SERIAL NOT NULL, "id_proceso" integer NOT NULL, "codigo" character varying, "nombre" character varying NOT NULL, "objetivos" text, "alcance" text, "periodicidad" character varying, "version" character varying, "estado" character varying, CONSTRAINT "UQ_66011474ff425c245570c8912f9" UNIQUE ("codigo"), CONSTRAINT "PK_0f965dd426285059c124578d3e4" PRIMARY KEY ("id_procedimiento"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "sistema_informacion" ("id_sistema_informacion" SERIAL NOT NULL, "nombre" character varying NOT NULL, "version" character varying, CONSTRAINT "PK_a0fcec43f6c187dffeab62563bb" PRIMARY KEY ("id_sistema_informacion"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "Rol" ("id_rol" SERIAL NOT NULL, "nombre" character varying NOT NULL, "descripcion" text, CONSTRAINT "PK_73d233526ce22d6e7fcaa12d7ec" PRIMARY KEY ("id_rol"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "Usuario" ("id_usuario" SERIAL NOT NULL, "username" character varying NOT NULL, "password" character varying NOT NULL, "correo" character varying NOT NULL, "activo" boolean NOT NULL DEFAULT true, "creado_en" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fc2564b581e02a535b31470a008" UNIQUE ("username"), CONSTRAINT "UQ_631bf87f4acdcb87c6ff8648c37" UNIQUE ("correo"), CONSTRAINT "PK_bba91c47ac2937456c51de1d029" PRIMARY KEY ("id_usuario"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "operacion_cargo" ("id" SERIAL NOT NULL, "id_operacion" integer NOT NULL, "id_cargo" integer NOT NULL, "tipo_participacion" character varying, CONSTRAINT "PK_3b53fd8cb54998f2e6079741b36" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "Accion" ("id_accion" SERIAL NOT NULL, "nombre_accion" character varying NOT NULL, CONSTRAINT "PK_6ff672b720767204a368b7b0a52" PRIMARY KEY ("id_accion"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "Tarea" ("id_tarea" SERIAL NOT NULL, "id_actividad" integer NOT NULL, "id_accion" integer NOT NULL, "descripcion" text NOT NULL, "orden" integer, CONSTRAINT "PK_76bd95be91eab0dcd6629865b59" PRIMARY KEY ("id_tarea"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "Actividad" ("id_actividad" SERIAL NOT NULL, "id_operaciones" integer NOT NULL, "descripcion" text NOT NULL, "orden" integer, CONSTRAINT "PK_6b5df053fa3f848910bacd3d340" PRIMARY KEY ("id_actividad"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "Operacion" ("id_operaciones" SERIAL NOT NULL, "id_procedimiento" integer NOT NULL, "orden" integer, "salida" text, "plazo" double precision, CONSTRAINT "PK_b398b2098bf0ddb4efe05bcf12e" PRIMARY KEY ("id_operaciones"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "Riesgo" ("id_riesgo" SERIAL NOT NULL, "id_operacion" integer NOT NULL, "descripcion" text, "nivel" character varying, CONSTRAINT "PK_74eca20db047d7224c5313fc9b2" PRIMARY KEY ("id_riesgo"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "Requisitos" ("id_requisitos" SERIAL NOT NULL, "id_operacion" integer NOT NULL, "descripcion" text, "tipo_entrada" character varying, CONSTRAINT "PK_a0117db2586028a59a997b5a8a3" PRIMARY KEY ("id_requisitos"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "documento_referencia" ("id_documento_referencia" SERIAL NOT NULL, "codigo" character varying, "nombre" character varying NOT NULL, "tipo" character varying, CONSTRAINT "PK_e6e0eb6d777134b05f8c48d7da7" PRIMARY KEY ("id_documento_referencia"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "Control" ("id_control" SERIAL NOT NULL, "id_operacion" integer NOT NULL, "descripcion" text, "tipo_control" character varying, CONSTRAINT "PK_4206674358b09510463a4907ff7" PRIMARY KEY ("id_control"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "equipos" ("id_equipos" SERIAL NOT NULL, "nombre" character varying NOT NULL, "descripcion" character varying, CONSTRAINT "PK_35b44f373a2a8e73abec822a315" PRIMARY KEY ("id_equipos"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "Normativa" ("id_normativa" SERIAL NOT NULL, "codigo" character varying, "nombre" character varying NOT NULL, "descripcion" text, "url" text, "fecha_emision" date, CONSTRAINT "PK_193b74774182bb621d810c07582" PRIMARY KEY ("id_normativa"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "Indicador" ("id_indicador" SERIAL NOT NULL, "denominacion" character varying NOT NULL, "descripcion" text, "formula" text, "unidad_medida" character varying, "fuente_datos" character varying, "metodo_verificacion" text, "meta" character varying, "frecuencia" character varying, CONSTRAINT "PK_bea784399df3463cd368daf7726" PRIMARY KEY ("id_indicador"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "unidad_cargos" ("id_unidad" integer NOT NULL, "id_cargo" integer NOT NULL, CONSTRAINT "PK_174313d1e35950363803aa237e1" PRIMARY KEY ("id_unidad", "id_cargo"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e6b8be1137c714f5c31c5565b7" ON "unidad_cargos" ("id_unidad") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_65d83c03f3e84b46b606b7b233" ON "unidad_cargos" ("id_cargo") `,
    );
    await queryRunner.query(
      `CREATE TABLE "proceso_unidad" ("id_proceso" integer NOT NULL, "id_unidad" integer NOT NULL, CONSTRAINT "PK_6425fa0f6b1bb52a5addb51b9a6" PRIMARY KEY ("id_proceso", "id_unidad"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_33d646beb5ed6860782bb9f40e" ON "proceso_unidad" ("id_proceso") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e7481de8dc81e9aaae594c333a" ON "proceso_unidad" ("id_unidad") `,
    );
    await queryRunner.query(
      `CREATE TABLE "procedimiento_instalacion" ("id_procedimiento" integer NOT NULL, "id_unidad" integer NOT NULL, CONSTRAINT "PK_b0d2b4a0b1d73ec5793b0a64569" PRIMARY KEY ("id_procedimiento", "id_unidad"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_48ab8a9c039f4eaaa5a39640e2" ON "procedimiento_instalacion" ("id_procedimiento") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_04df8efc4d0658a912dfabd58d" ON "procedimiento_instalacion" ("id_unidad") `,
    );
    await queryRunner.query(
      `CREATE TABLE "procedimiento_sistema_informacion" ("id_sistema_informacion" integer NOT NULL, "id_procedimiento" integer NOT NULL, CONSTRAINT "PK_25609aa1c8df1006fd6ec10a93f" PRIMARY KEY ("id_sistema_informacion", "id_procedimiento"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d81f52826d6bd6e408b4c4d0b0" ON "procedimiento_sistema_informacion" ("id_sistema_informacion") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bcbbb9ab1cb413f4cec40c58b5" ON "procedimiento_sistema_informacion" ("id_procedimiento") `,
    );
    await queryRunner.query(
      `CREATE TABLE "usuario_rol" ("id_usuario" integer NOT NULL, "id_rol" integer NOT NULL, CONSTRAINT "PK_cc28ffbe77be599168e1ec8670a" PRIMARY KEY ("id_usuario", "id_rol"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6adca3617fc69b2864e67196f2" ON "usuario_rol" ("id_usuario") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_96d2a6ecb2ad0931416610845c" ON "usuario_rol" ("id_rol") `,
    );
    await queryRunner.query(
      `CREATE TABLE "operacion_documento_referencia" ("id_documento_referencia" integer NOT NULL, "id_operacion" integer NOT NULL, CONSTRAINT "PK_334d2d0aef0697e7cdf62f670d8" PRIMARY KEY ("id_documento_referencia", "id_operacion"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a0d951be2f8ac1a527551241cb" ON "operacion_documento_referencia" ("id_documento_referencia") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_066be7dfbb019dcfb31e2b2784" ON "operacion_documento_referencia" ("id_operacion") `,
    );
    await queryRunner.query(
      `CREATE TABLE "equipos_procedimientos" ("id_equipo" integer NOT NULL, "id_procedimiento" integer NOT NULL, CONSTRAINT "PK_34e09409faf4bace59a889a953b" PRIMARY KEY ("id_equipo", "id_procedimiento"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_109b228858972643af651804a2" ON "equipos_procedimientos" ("id_equipo") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e3073cf15212055674dc6c54fc" ON "equipos_procedimientos" ("id_procedimiento") `,
    );
    await queryRunner.query(
      `CREATE TABLE "normativa_procedimiento" ("id_normativa" integer NOT NULL, "id_procedimiento" integer NOT NULL, CONSTRAINT "PK_d993ed7628b1538a1887e9637bb" PRIMARY KEY ("id_normativa", "id_procedimiento"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_644e9f36507e24e170d5a68c23" ON "normativa_procedimiento" ("id_normativa") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_db2fce6b08593874f5957fe9be" ON "normativa_procedimiento" ("id_procedimiento") `,
    );
    await queryRunner.query(
      `CREATE TABLE "procedimiento_indicador" ("id_indicador" integer NOT NULL, "id_procedimiento" integer NOT NULL, CONSTRAINT "PK_1d78b5ef2f8f8bccc5d1ecc5877" PRIMARY KEY ("id_indicador", "id_procedimiento"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ac1f797babb9fa811d787bd2d7" ON "procedimiento_indicador" ("id_indicador") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f13ff59d722d275d4872acc0b8" ON "procedimiento_indicador" ("id_procedimiento") `,
    );
    await queryRunner.query(
      `ALTER TABLE "cargo_proceso" ADD CONSTRAINT "FK_f795040eac5a2e64ffc92c44b03" FOREIGN KEY ("id_cargo") REFERENCES "cargo"("id_cargo") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cargo_proceso" ADD CONSTRAINT "FK_d4d3810ae550b62b6df1da95679" FOREIGN KEY ("id_proceso") REFERENCES "Proceso"("id_proceso") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Procedimiento" ADD CONSTRAINT "FK_7386065930119afb7adbc23daea" FOREIGN KEY ("id_proceso") REFERENCES "Proceso"("id_proceso") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "operacion_cargo" ADD CONSTRAINT "FK_069d171cbaac52a6973811880ea" FOREIGN KEY ("id_operacion") REFERENCES "Operacion"("id_operaciones") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "operacion_cargo" ADD CONSTRAINT "FK_b1d878b5e12a6b64c143734f6ea" FOREIGN KEY ("id_cargo") REFERENCES "cargo"("id_cargo") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Tarea" ADD CONSTRAINT "FK_ebc70a70cea6cb6abfb342f41f8" FOREIGN KEY ("id_actividad") REFERENCES "Actividad"("id_actividad") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Tarea" ADD CONSTRAINT "FK_3e1477e1f192a3e4a7d3b028bea" FOREIGN KEY ("id_accion") REFERENCES "Accion"("id_accion") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Actividad" ADD CONSTRAINT "FK_abcaaafea856fbcbffb437c6234" FOREIGN KEY ("id_operaciones") REFERENCES "Operacion"("id_operaciones") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Operacion" ADD CONSTRAINT "FK_3f8d16a0a3b3af04be95e348887" FOREIGN KEY ("id_procedimiento") REFERENCES "Procedimiento"("id_procedimiento") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Riesgo" ADD CONSTRAINT "FK_5072d00c917d489ac67c25b2b6b" FOREIGN KEY ("id_operacion") REFERENCES "Operacion"("id_operaciones") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Requisitos" ADD CONSTRAINT "FK_25891d876dddf3de3df97f0febd" FOREIGN KEY ("id_operacion") REFERENCES "Operacion"("id_operaciones") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Control" ADD CONSTRAINT "FK_650b6ae5b56d60b8a367bf7a53f" FOREIGN KEY ("id_operacion") REFERENCES "Operacion"("id_operaciones") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "unidad_cargos" ADD CONSTRAINT "FK_e6b8be1137c714f5c31c5565b70" FOREIGN KEY ("id_unidad") REFERENCES "Unidad"("id_unidad") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "unidad_cargos" ADD CONSTRAINT "FK_65d83c03f3e84b46b606b7b2330" FOREIGN KEY ("id_cargo") REFERENCES "cargo"("id_cargo") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "proceso_unidad" ADD CONSTRAINT "FK_33d646beb5ed6860782bb9f40e6" FOREIGN KEY ("id_proceso") REFERENCES "Proceso"("id_proceso") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "proceso_unidad" ADD CONSTRAINT "FK_e7481de8dc81e9aaae594c333a4" FOREIGN KEY ("id_unidad") REFERENCES "Unidad"("id_unidad") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedimiento_instalacion" ADD CONSTRAINT "FK_48ab8a9c039f4eaaa5a39640e20" FOREIGN KEY ("id_procedimiento") REFERENCES "Procedimiento"("id_procedimiento") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedimiento_instalacion" ADD CONSTRAINT "FK_04df8efc4d0658a912dfabd58da" FOREIGN KEY ("id_unidad") REFERENCES "Unidad"("id_unidad") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedimiento_sistema_informacion" ADD CONSTRAINT "FK_d81f52826d6bd6e408b4c4d0b07" FOREIGN KEY ("id_sistema_informacion") REFERENCES "sistema_informacion"("id_sistema_informacion") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedimiento_sistema_informacion" ADD CONSTRAINT "FK_bcbbb9ab1cb413f4cec40c58b5e" FOREIGN KEY ("id_procedimiento") REFERENCES "Procedimiento"("id_procedimiento") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuario_rol" ADD CONSTRAINT "FK_6adca3617fc69b2864e67196f2a" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuario_rol" ADD CONSTRAINT "FK_96d2a6ecb2ad0931416610845cf" FOREIGN KEY ("id_rol") REFERENCES "Rol"("id_rol") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "operacion_documento_referencia" ADD CONSTRAINT "FK_a0d951be2f8ac1a527551241cbb" FOREIGN KEY ("id_documento_referencia") REFERENCES "documento_referencia"("id_documento_referencia") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "operacion_documento_referencia" ADD CONSTRAINT "FK_066be7dfbb019dcfb31e2b2784f" FOREIGN KEY ("id_operacion") REFERENCES "Operacion"("id_operaciones") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipos_procedimientos" ADD CONSTRAINT "FK_109b228858972643af651804a24" FOREIGN KEY ("id_equipo") REFERENCES "equipos"("id_equipos") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipos_procedimientos" ADD CONSTRAINT "FK_e3073cf15212055674dc6c54fc5" FOREIGN KEY ("id_procedimiento") REFERENCES "Procedimiento"("id_procedimiento") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "normativa_procedimiento" ADD CONSTRAINT "FK_644e9f36507e24e170d5a68c239" FOREIGN KEY ("id_normativa") REFERENCES "Normativa"("id_normativa") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "normativa_procedimiento" ADD CONSTRAINT "FK_db2fce6b08593874f5957fe9be2" FOREIGN KEY ("id_procedimiento") REFERENCES "Procedimiento"("id_procedimiento") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedimiento_indicador" ADD CONSTRAINT "FK_ac1f797babb9fa811d787bd2d7d" FOREIGN KEY ("id_indicador") REFERENCES "Indicador"("id_indicador") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedimiento_indicador" ADD CONSTRAINT "FK_f13ff59d722d275d4872acc0b82" FOREIGN KEY ("id_procedimiento") REFERENCES "Procedimiento"("id_procedimiento") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "procedimiento_indicador" DROP CONSTRAINT "FK_f13ff59d722d275d4872acc0b82"`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedimiento_indicador" DROP CONSTRAINT "FK_ac1f797babb9fa811d787bd2d7d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "normativa_procedimiento" DROP CONSTRAINT "FK_db2fce6b08593874f5957fe9be2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "normativa_procedimiento" DROP CONSTRAINT "FK_644e9f36507e24e170d5a68c239"`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipos_procedimientos" DROP CONSTRAINT "FK_e3073cf15212055674dc6c54fc5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipos_procedimientos" DROP CONSTRAINT "FK_109b228858972643af651804a24"`,
    );
    await queryRunner.query(
      `ALTER TABLE "operacion_documento_referencia" DROP CONSTRAINT "FK_066be7dfbb019dcfb31e2b2784f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "operacion_documento_referencia" DROP CONSTRAINT "FK_a0d951be2f8ac1a527551241cbb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuario_rol" DROP CONSTRAINT "FK_96d2a6ecb2ad0931416610845cf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuario_rol" DROP CONSTRAINT "FK_6adca3617fc69b2864e67196f2a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedimiento_sistema_informacion" DROP CONSTRAINT "FK_bcbbb9ab1cb413f4cec40c58b5e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedimiento_sistema_informacion" DROP CONSTRAINT "FK_d81f52826d6bd6e408b4c4d0b07"`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedimiento_instalacion" DROP CONSTRAINT "FK_04df8efc4d0658a912dfabd58da"`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedimiento_instalacion" DROP CONSTRAINT "FK_48ab8a9c039f4eaaa5a39640e20"`,
    );
    await queryRunner.query(
      `ALTER TABLE "proceso_unidad" DROP CONSTRAINT "FK_e7481de8dc81e9aaae594c333a4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "proceso_unidad" DROP CONSTRAINT "FK_33d646beb5ed6860782bb9f40e6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "unidad_cargos" DROP CONSTRAINT "FK_65d83c03f3e84b46b606b7b2330"`,
    );
    await queryRunner.query(
      `ALTER TABLE "unidad_cargos" DROP CONSTRAINT "FK_e6b8be1137c714f5c31c5565b70"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Control" DROP CONSTRAINT "FK_650b6ae5b56d60b8a367bf7a53f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Requisitos" DROP CONSTRAINT "FK_25891d876dddf3de3df97f0febd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Riesgo" DROP CONSTRAINT "FK_5072d00c917d489ac67c25b2b6b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Operacion" DROP CONSTRAINT "FK_3f8d16a0a3b3af04be95e348887"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Actividad" DROP CONSTRAINT "FK_abcaaafea856fbcbffb437c6234"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Tarea" DROP CONSTRAINT "FK_3e1477e1f192a3e4a7d3b028bea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Tarea" DROP CONSTRAINT "FK_ebc70a70cea6cb6abfb342f41f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "operacion_cargo" DROP CONSTRAINT "FK_b1d878b5e12a6b64c143734f6ea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "operacion_cargo" DROP CONSTRAINT "FK_069d171cbaac52a6973811880ea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Procedimiento" DROP CONSTRAINT "FK_7386065930119afb7adbc23daea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cargo_proceso" DROP CONSTRAINT "FK_d4d3810ae550b62b6df1da95679"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cargo_proceso" DROP CONSTRAINT "FK_f795040eac5a2e64ffc92c44b03"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f13ff59d722d275d4872acc0b8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ac1f797babb9fa811d787bd2d7"`,
    );
    await queryRunner.query(`DROP TABLE "procedimiento_indicador"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_db2fce6b08593874f5957fe9be"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_644e9f36507e24e170d5a68c23"`,
    );
    await queryRunner.query(`DROP TABLE "normativa_procedimiento"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e3073cf15212055674dc6c54fc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_109b228858972643af651804a2"`,
    );
    await queryRunner.query(`DROP TABLE "equipos_procedimientos"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_066be7dfbb019dcfb31e2b2784"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a0d951be2f8ac1a527551241cb"`,
    );
    await queryRunner.query(`DROP TABLE "operacion_documento_referencia"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_96d2a6ecb2ad0931416610845c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6adca3617fc69b2864e67196f2"`,
    );
    await queryRunner.query(`DROP TABLE "usuario_rol"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bcbbb9ab1cb413f4cec40c58b5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d81f52826d6bd6e408b4c4d0b0"`,
    );
    await queryRunner.query(`DROP TABLE "procedimiento_sistema_informacion"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_04df8efc4d0658a912dfabd58d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_48ab8a9c039f4eaaa5a39640e2"`,
    );
    await queryRunner.query(`DROP TABLE "procedimiento_instalacion"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e7481de8dc81e9aaae594c333a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_33d646beb5ed6860782bb9f40e"`,
    );
    await queryRunner.query(`DROP TABLE "proceso_unidad"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_65d83c03f3e84b46b606b7b233"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e6b8be1137c714f5c31c5565b7"`,
    );
    await queryRunner.query(`DROP TABLE "unidad_cargos"`);
    await queryRunner.query(`DROP TABLE "Indicador"`);
    await queryRunner.query(`DROP TABLE "Normativa"`);
    await queryRunner.query(`DROP TABLE "equipos"`);
    await queryRunner.query(`DROP TABLE "Control"`);
    await queryRunner.query(`DROP TABLE "documento_referencia"`);
    await queryRunner.query(`DROP TABLE "Requisitos"`);
    await queryRunner.query(`DROP TABLE "Riesgo"`);
    await queryRunner.query(`DROP TABLE "Operacion"`);
    await queryRunner.query(`DROP TABLE "Actividad"`);
    await queryRunner.query(`DROP TABLE "Tarea"`);
    await queryRunner.query(`DROP TABLE "Accion"`);
    await queryRunner.query(`DROP TABLE "operacion_cargo"`);
    await queryRunner.query(`DROP TABLE "Usuario"`);
    await queryRunner.query(`DROP TABLE "Rol"`);
    await queryRunner.query(`DROP TABLE "sistema_informacion"`);
    await queryRunner.query(`DROP TABLE "Procedimiento"`);
    await queryRunner.query(`DROP TABLE "Proceso"`);
    await queryRunner.query(`DROP TABLE "cargo_proceso"`);
    await queryRunner.query(`DROP TABLE "Unidad"`);
    await queryRunner.query(`DROP TABLE "cargo"`);
  }
}
