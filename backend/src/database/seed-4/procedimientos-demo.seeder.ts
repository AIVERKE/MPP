import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource, EntityManager } from 'typeorm';
import { Proceso } from '../../modules/procesos/entities/proceso.entity';
import { Procedimiento } from '../../modules/procesos/entities/procedimiento.entity';
import { CargoProceso } from '../../modules/procesos/entities/cargo-proceso.entity';
import { Unidad } from '../../modules/estructura-organizacional/entities/unidad.entity';
import { Cargo } from '../../modules/estructura-organizacional/entities/cargo.entity';
import { Figura } from '../../modules/flujo/entities/figura.entity';
import { Accion } from '../../modules/flujo/entities/accion.entity';
import { Operacion } from '../../modules/flujo/entities/operacion.entity';
import { Actividad } from '../../modules/flujo/entities/actividad.entity';
import { Tarea } from '../../modules/flujo/entities/tarea.entity';
import { OperacionCargo } from '../../modules/flujo/entities/operacion-cargo.entity';
import { CondicionTarea } from '../../modules/flujo/entities/condicion-tarea.entity';
import { Requisitos } from '../../modules/recursos/entities/requisitos.entity';
import { Riesgo } from '../../modules/recursos/entities/riesgo.entity';
import { Control } from '../../modules/recursos/entities/control.entity';
import { DocumentoReferencia } from '../../modules/recursos/entities/documento-referencia.entity';
import { SistemaInformacion } from '../../modules/recursos/entities/sistema-informacion.entity';
import { Equipo } from '../../modules/recursos/entities/equipo.entity';
import { Indicador } from '../../modules/calidad/entities/indicador.entity';
import { Normativa } from '../../modules/calidad/entities/normativa.entity';
import { Usuario } from '../../modules/seguridad/entities/usuario.entity';
import {
  CarrilDemo,
  CodigoFigura,
  PROCEDIMIENTOS_DEMO,
  ProcedimientoDemo,
} from './procedimientos-demo.data';

const FIGURAS_OFICIALES: Record<CodigoFigura, string> = {
  circulo: 'Círculo',
  rectangulo: 'Rectángulo',
  rombo: 'Rombo',
  elipse: 'Elipse',
  paralelogramo: 'Paralelogramo',
  triangulo: 'Triángulo',
  hexagono: 'Hexágono',
};

const ACCION_POR_FIGURA: Record<CodigoFigura, string> = {
  circulo: 'Inicio / Fin',
  rectangulo: 'Ejecutar',
  rombo: 'Decidir',
  elipse: 'Entregar / Conectar',
  paralelogramo: 'Registrar documento',
  triangulo: 'Archivar documento',
  hexagono: 'Preparar',
};

interface CarrilResuelto {
  unidad: Unidad;
  cargo: Cargo;
}

const normalizar = (texto: string) =>
  (texto || '').replace(/\s+/g, ' ').trim().toUpperCase();

/**
 * Crea 3 procedimientos de ejemplo completos (matriz, figuras, decisiones
 * IF/ELSE e Información Complementaria) reutilizando unidades y cargos del MOF.
 * Idempotente: identifica los procedimientos por código (PRC-DEMO-00x) y
 * regenera su contenido en cada ejecución.
 */
export default class ProcedimientosDemoSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    _factoryManager: SeederFactoryManager,
  ): Promise<any> {
    await dataSource.transaction(async (manager) => {
      const acciones = await this.asegurarAcciones(manager);
      const elaborador = await manager
        .getRepository(Usuario)
        .findOne({ where: { username: 'admin' } });

      for (const demo of PROCEDIMIENTOS_DEMO) {
        console.log(`\n> ${demo.codigo} - ${demo.nombre}`);
        const carriles = await this.resolverCarriles(manager, demo.carriles);
        const proceso = await this.asegurarProceso(manager, demo, carriles);
        const procedimiento = await this.asegurarProcedimiento(
          manager,
          demo,
          proceso,
          carriles,
          elaborador?.id_usuario ?? null,
        );
        await this.limpiarFlujo(manager, procedimiento.id_procedimiento);
        await this.crearFlujo(manager, demo, procedimiento, carriles, acciones);
        await this.enlazarComplementaria(manager, demo, procedimiento);
      }
    });
  }

  private async asegurarAcciones(
    manager: EntityManager,
  ): Promise<Record<CodigoFigura, Accion>> {
    const figuraRepo = manager.getRepository(Figura);
    const accionRepo = manager.getRepository(Accion);
    const resultado = {} as Record<CodigoFigura, Accion>;

    for (const codigo of Object.keys(FIGURAS_OFICIALES) as CodigoFigura[]) {
      let figura = await figuraRepo.findOne({
        where: { codigo, es_oficial: true },
      });
      if (!figura) {
        figura = await figuraRepo.save(
          figuraRepo.create({
            codigo,
            nombre: FIGURAS_OFICIALES[codigo],
            es_oficial: true,
          }),
        );
        console.log(`  + Figura creada: ${figura.nombre}`);
      }

      const nombre_accion = ACCION_POR_FIGURA[codigo];
      let accion = await accionRepo.findOne({
        where: { nombre_accion, id_figura: figura.id_figura },
      });
      if (!accion) {
        accion = await accionRepo.save(
          accionRepo.create({ nombre_accion, id_figura: figura.id_figura }),
        );
        console.log(`  + Acción creada: ${nombre_accion} (${codigo})`);
      }
      resultado[codigo] = accion;
    }
    return resultado;
  }

  private async resolverCarriles(
    manager: EntityManager,
    carriles: CarrilDemo[],
  ): Promise<Map<string, CarrilResuelto>> {
    const unidadRepo = manager.getRepository(Unidad);
    const cargoRepo = manager.getRepository(Cargo);
    const unidades = await unidadRepo.find({ relations: ['cargos'] });
    const resueltos = new Map<string, CarrilResuelto>();

    for (const carril of carriles) {
      let unidad = unidades.find(
        (u) => normalizar(u.nombre) === normalizar(carril.unidad),
      );
      if (!unidad) {
        const { max } = await unidadRepo
          .createQueryBuilder('u')
          .withDeleted()
          .select('COALESCE(MAX(u.id_unidad), 0)', 'max')
          .getRawOne();
        unidad = await unidadRepo.save(
          unidadRepo.create({
            id_unidad: Number(max) + 1,
            nombre: carril.unidad,
            sigla: 'DEMO',
            cargos: [],
          }),
        );
        unidades.push(unidad);
        console.log(`  + Unidad DEMO creada: ${unidad.nombre}`);
      }

      let cargo = (unidad.cargos || []).find(
        (c) => normalizar(c.nombre) === normalizar(carril.cargo),
      );
      if (!cargo) {
        const { max } = await cargoRepo
          .createQueryBuilder('c')
          .withDeleted()
          .select('COALESCE(MAX(c.id_cargo), 0)', 'max')
          .getRawOne();
        cargo = await cargoRepo.save(
          cargoRepo.create({
            id_cargo: Number(max) + 1,
            nombre: carril.cargo,
            descripcion: 'DEMO - creado por el seeder de procedimientos de ejemplo',
          }),
        );
        unidad.cargos = [...(unidad.cargos || []), cargo];
        await unidadRepo.save(unidad);
        console.log(`  + Cargo DEMO creado: ${cargo.nombre} en ${unidad.nombre}`);
      }

      resueltos.set(carril.key, { unidad, cargo });
    }
    return resueltos;
  }

  private async asegurarProceso(
    manager: EntityManager,
    demo: ProcedimientoDemo,
    carriles: Map<string, CarrilResuelto>,
  ): Promise<Proceso> {
    const procesoRepo = manager.getRepository(Proceso);
    const cargoProcesoRepo = manager.getRepository(CargoProceso);

    const existente = await procesoRepo.findOne({
      where: { codigo: demo.proceso.codigo },
      withDeleted: true,
    });

    const unidadesUnicas = [
      ...new Map(
        [...carriles.values()].map((c) => [c.unidad.id_unidad, c.unidad]),
      ).values(),
    ];
    const proceso = await procesoRepo.save({
      ...(existente ?? {}),
      ...demo.proceso,
      unidades: unidadesUnicas,
      deletedAt: null as unknown as Date,
    });

    await cargoProcesoRepo
      .createQueryBuilder()
      .delete()
      .where('id_proceso = :id', { id: proceso.id_proceso })
      .execute();
    let principal = true;
    for (const { unidad, cargo } of carriles.values()) {
      await cargoProcesoRepo.save(
        cargoProcesoRepo.create({
          id_proceso: proceso.id_proceso,
          id_cargo: cargo.id_cargo,
          id_unidad: unidad.id_unidad,
          es_responsable_principal: principal,
        }),
      );
      principal = false;
    }
    console.log(`  ~ Proceso ${proceso.codigo} con ${carriles.size} carriles`);
    return proceso;
  }

  private async asegurarProcedimiento(
    manager: EntityManager,
    demo: ProcedimientoDemo,
    proceso: Proceso,
    carriles: Map<string, CarrilResuelto>,
    idElaborador: number | null,
  ): Promise<Procedimiento> {
    const repo = manager.getRepository(Procedimiento);
    const existente = await repo.findOne({
      where: { codigo: demo.codigo },
      withDeleted: true,
    });

    const instalaciones = [
      ...new Map(
        demo.instalaciones
          .map((key) => carriles.get(key)!.unidad)
          .map((u) => [u.id_unidad, u]),
      ).values(),
    ];

    return repo.save({
      ...(existente ?? {}),
      id_proceso: proceso.id_proceso,
      codigo: demo.codigo,
      nombre: demo.nombre,
      objetivos: demo.objetivos,
      alcance: demo.alcance,
      periodicidad: demo.periodicidad,
      version: demo.version,
      estado: 'Vigente',
      estado_version: demo.estado_version,
      id_elaborador: idElaborador,
      instalaciones,
      deletedAt: null as unknown as Date,
    });
  }

  private async limpiarFlujo(manager: EntityManager, idProcedimiento: number) {
    const operaciones: Array<{ id: number }> = await manager.query(
      'SELECT id_operaciones AS id FROM "Operacion" WHERE id_procedimiento = $1',
      [idProcedimiento],
    );
    const opIds = operaciones.map((o) => o.id);
    if (!opIds.length) return;

    const tareas: Array<{ id: number }> = await manager.query(
      `SELECT t.id_tarea AS id FROM "Tarea" t
         JOIN "Actividad" a ON a.id_actividad = t.id_actividad
        WHERE a.id_operaciones = ANY($1)`,
      [opIds],
    );
    const tareaIds = tareas.map((t) => t.id);
    if (tareaIds.length) {
      await manager.query(
        `DELETE FROM "CondicionTarea"
          WHERE id_tarea = ANY($1)
             OR id_tarea_siguiente_if = ANY($1)
             OR id_tarea_siguiente_else = ANY($1)`,
        [tareaIds],
      );
      await manager.query('DELETE FROM "Tarea" WHERE id_tarea = ANY($1)', [
        tareaIds,
      ]);
    }

    await manager.query(
      `DELETE FROM documento_referencia
        WHERE id_documento_referencia IN (
          SELECT id_documento_referencia FROM operacion_documento_referencia
           WHERE id_operacion = ANY($1))`,
      [opIds],
    );
    for (const tabla of [
      '"Actividad"',
      'operacion_cargo',
      '"Requisitos"',
      '"Riesgo"',
      '"Control"',
    ]) {
      const columna = tabla === '"Actividad"' ? 'id_operaciones' : 'id_operacion';
      await manager.query(`DELETE FROM ${tabla} WHERE ${columna} = ANY($1)`, [
        opIds,
      ]);
    }
    await manager.query(
      'DELETE FROM "Operacion" WHERE id_operaciones = ANY($1)',
      [opIds],
    );
    console.log(`  - Flujo anterior eliminado (${opIds.length} operaciones)`);
  }

  private async crearFlujo(
    manager: EntityManager,
    demo: ProcedimientoDemo,
    procedimiento: Procedimiento,
    carriles: Map<string, CarrilResuelto>,
    acciones: Record<CodigoFigura, Accion>,
  ) {
    const tareaPorPaso = new Map<number, number>();

    for (const [index, paso] of demo.pasos.entries()) {
      const nro = index + 1;
      const carril = carriles.get(paso.carril);
      if (!carril) {
        throw new Error(`${demo.codigo} paso ${nro}: carril "${paso.carril}" no definido`);
      }

      const operacion = await manager.save(
        manager.create(Operacion, {
          id_procedimiento: procedimiento.id_procedimiento,
          orden: nro,
          salida: paso.salida,
          plazo: paso.plazo,
        }),
      );
      const actividad = await manager.save(
        manager.create(Actividad, {
          id_operaciones: operacion.id_operaciones,
          descripcion: paso.actividad,
          orden: 1,
        }),
      );
      const tarea = await manager.save(
        manager.create(Tarea, {
          id_actividad: actividad.id_actividad,
          id_accion: acciones[paso.figura].id_accion,
          descripcion: paso.tarea,
          texto_figura: paso.textoFigura,
          orden: 1,
        }),
      );
      tareaPorPaso.set(nro, tarea.id_tarea);

      await manager.save(
        manager.create(OperacionCargo, {
          id_operacion: operacion.id_operaciones,
          id_cargo: carril.cargo.id_cargo,
          tipo_participacion: 'Responsable',
        }),
      );
      await manager.save([
        manager.create(Requisitos, {
          id_operacion: operacion.id_operaciones,
          descripcion: paso.requisito,
          tipo_entrada: 'entrada',
        }),
        manager.create(Requisitos, {
          id_operacion: operacion.id_operaciones,
          descripcion: paso.solicitante,
          tipo_entrada: 'solicitante',
        }),
      ]);
      await manager.save(
        manager.create(Riesgo, {
          id_operacion: operacion.id_operaciones,
          descripcion: paso.riesgo.descripcion,
          nivel: paso.riesgo.nivel,
        }),
      );
      await manager.save(
        manager.create(Control, {
          id_operacion: operacion.id_operaciones,
          descripcion: paso.control.descripcion,
          tipo_control: paso.control.tipo,
        }),
      );
      await manager.save(
        manager.create(DocumentoReferencia, {
          ...paso.referencia,
          operaciones: [operacion],
        }),
      );
    }

    let decisiones = 0;
    for (const [index, paso] of demo.pasos.entries()) {
      if (!paso.decision) continue;
      const nro = index + 1;
      const destinoSi = tareaPorPaso.get(paso.decision.si);
      const destinoNo = tareaPorPaso.get(paso.decision.no);
      if (paso.figura !== 'rombo' || !destinoSi || !destinoNo) {
        throw new Error(`${demo.codigo} paso ${nro}: decisión mal definida`);
      }
      await manager.save(
        manager.create(CondicionTarea, {
          id_tarea: tareaPorPaso.get(nro)!,
          tipo_condicion: 'if',
          expresion_condicion: paso.decision.expresion,
          id_tarea_siguiente_if: destinoSi,
          id_tarea_siguiente_else: destinoNo,
          orden: 1,
        }),
      );
      decisiones++;
    }
    console.log(
      `  + Flujo creado: ${demo.pasos.length} operaciones, ${decisiones} decisiones`,
    );
  }

  private async enlazarComplementaria(
    manager: EntityManager,
    demo: ProcedimientoDemo,
    procedimiento: Procedimiento,
  ) {
    const enlazar = async <T extends { procedimientos: Procedimiento[] }>(
      entidad: new () => T,
      campoClave: keyof T & string,
      items: Array<Partial<T>>,
    ) => {
      const repo = manager.getRepository(entidad);
      for (const item of items) {
        const existente = await repo.findOne({
          where: { [campoClave]: item[campoClave] } as any,
          relations: ['procedimientos'],
        });
        const actuales = (existente?.procedimientos || []).filter(
          (p) => p.id_procedimiento !== procedimiento.id_procedimiento,
        );
        await repo.save({
          ...(existente ?? {}),
          ...item,
          procedimientos: [...actuales, procedimiento],
        } as any);
      }
    };

    await enlazar(Indicador, 'denominacion', demo.indicadores);
    await enlazar(
      Normativa,
      'nombre',
      demo.normativas.map((n) => ({
        ...n,
        fecha_emision: new Date(n.fecha_emision),
      })),
    );
    await enlazar(SistemaInformacion, 'nombre', demo.sistemas);
    await enlazar(Equipo, 'nombre', demo.equipos);

    console.log(
      `  + Complementaria: ${procedimiento.instalaciones.length} instalaciones, ` +
        `${demo.indicadores.length} KPIs, ${demo.normativas.length} normativas, ` +
        `${demo.sistemas.length} sistemas, ${demo.equipos.length} equipos`,
    );
  }
}
