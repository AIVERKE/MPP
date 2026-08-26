import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Rol } from '../../modules/seguridad/entities/rol.entity';
import { Usuario } from '../../modules/seguridad/entities/usuario.entity';
import {
  ROLES_MPP,
  ROLES_MPP_CATALOG,
} from '../../modules/seguridad/roles.constants';
import { Cargo } from '../../modules/estructura-organizacional/entities/cargo.entity';
import { Unidad } from '../../modules/estructura-organizacional/entities/unidad.entity';
import { Instalacion } from '../../modules/estructura-organizacional/entities/instalacion.entity';
import { Proceso } from '../../modules/procesos/entities/proceso.entity';
import { Procedimiento } from '../../modules/procesos/entities/procedimiento.entity';
import { CargoProceso } from '../../modules/procesos/entities/cargo-proceso.entity';
import { Operacion } from '../../modules/flujo/entities/operacion.entity';
import { Actividad } from '../../modules/flujo/entities/actividad.entity';
import { Figura } from '../../modules/flujo/entities/figura.entity';
import { Accion } from '../../modules/flujo/entities/accion.entity';
import { Tarea } from '../../modules/flujo/entities/tarea.entity';
import { OperacionCargo } from '../../modules/flujo/entities/operacion-cargo.entity';
import { Requisitos } from '../../modules/recursos/entities/requisitos.entity';
import { Riesgo } from '../../modules/recursos/entities/riesgo.entity';
import { Control } from '../../modules/recursos/entities/control.entity';
import { Equipo } from '../../modules/recursos/entities/equipo.entity';
import { SistemaInformacion } from '../../modules/recursos/entities/sistema-informacion.entity';
import { DocumentoReferencia } from '../../modules/recursos/entities/documento-referencia.entity';
import { Normativa } from '../../modules/calidad/entities/normativa.entity';
import { Indicador } from '../../modules/calidad/entities/indicador.entity';

export default class MassiveSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    _factoryManager: SeederFactoryManager,
  ): Promise<any> {
    // 1. Limpieza selectiva (TRUNCATE con CASCADE)
    const tables = [
      'Indicador',
      'Normativa',
      'cargo',
      'Instalacion',
      'Unidad',
      'Accion',
      'Actividad',
      'Figura',
      'operacion_cargo',
      'Operacion',
      'Tarea',
      'cargo_proceso',
      'Procedimiento',
      'Proceso',
      'Control',
      'documento_referencia',
      'equipos',
      'Requisitos',
      'Riesgo',
      'sistema_informacion',
      'Rol',
      'Usuario',
    ];
    const quotedTables = tables.map((t) => `"${t}"`).join(', ');
    await dataSource.query(`TRUNCATE ${quotedTables} RESTART IDENTITY CASCADE;`);

    // 2. Hashear contraseñas una sola vez en memoria para evitar sobrecarga de CPU
    const passwordHash = await bcrypt.hash('password123', 10);
    const adminHash = await bcrypt.hash('admin123', 10);

    // 3. ROLES (catálogo operativo MPP — 5 roles)
    const rolRepo = dataSource.getRepository(Rol);
    const roles = await rolRepo.save(
      ROLES_MPP_CATALOG.map((r) => ({ ...r })),
    );

    // 4. CARGOS (50)
    const cargoRepo = dataSource.getRepository(Cargo);
    const predefinedCargos = [
      'Director General',
      'Jefe de Desarrollo',
      'Analista QA',
      'Especialista en Procesos',
      'Asistente Administrativo',
      'Consultor Externo',
      'Técnico de Soporte',
      'Auditor Interno',
      'Secretario Ejecutivo',
      'Líder de Proyecto',
    ];
    const cargosData = Array.from({ length: 50 }, (_, i) => {
      const nombre = i < predefinedCargos.length ? predefinedCargos[i] : `Cargo Operativo ${i + 1}`;
      return {
        id_cargo: i + 1,
        nombre,
        descripcion: `Descripcion del cargo ${nombre}`,
      };
    });
    const cargos = await cargoRepo.save(cargosData);

    // 5. UNIDADES (50)
    const unidadRepo = dataSource.getRepository(Unidad);
    const predefinedUnidades = [
      { nombre: 'Dirección de Tecnología', sigla: 'DT', nivel: '1', tipo_unidad: 'Sustantiva' },
      { nombre: 'Gerencia de Finanzas', sigla: 'GF', nivel: '1', tipo_unidad: 'Apoyo' },
      { nombre: 'Departamento de Calidad', sigla: 'DC', nivel: '2', tipo_unidad: 'Asesoría' },
      { nombre: 'Unidad de Procesos', sigla: 'UP', nivel: '2', tipo_unidad: 'Sustantiva' },
      { nombre: 'Recursos Humanos', sigla: 'RRHH', nivel: '1', tipo_unidad: 'Apoyo' },
      { nombre: 'Auditoría Interna', sigla: 'AI', nivel: '1', tipo_unidad: 'Control' },
      { nombre: 'Mantenimiento', sigla: 'MANT', nivel: '2', tipo_unidad: 'Apoyo' },
      { nombre: 'Ventas', sigla: 'VNT', nivel: '1', tipo_unidad: 'Sustantiva' },
      { nombre: 'Logística', sigla: 'LOG', nivel: '2', tipo_unidad: 'Sustantiva' },
      { nombre: 'Comunicación', sigla: 'COM', nivel: '2', tipo_unidad: 'Asesoría' },
    ];
    const unidadesData = Array.from({ length: 50 }, (_, i) => {
      const base = i < predefinedUnidades.length ? predefinedUnidades[i] : {
        nombre: `Unidad de Operacion ${i + 1}`,
        sigla: `UO${i + 1}`,
        nivel: '2',
        tipo_unidad: 'Apoyo',
      };
      const cargo1 = cargos[i % cargos.length];
      const cargo2 = cargos[(i + 1) % cargos.length];
      return {
        id_unidad: i + 1,
        ...base,
        cargos: [cargo1, cargo2],
      };
    });
    const unidades = await unidadRepo.save(unidadesData);

    // 6. INSTALACIONES (50)
    const instalacionRepo = dataSource.getRepository(Instalacion);
    const instalacionesData = Array.from({ length: 50 }, (_, i) => {
      const unidad = unidades[i % unidades.length];
      return {
        nombre: `Instalacion Central ${i + 1}`,
        descripcion: `Descripcion de la instalacion ${i + 1}`,
        id_unidad: unidad.id_unidad,
      };
    });
    const instalaciones = await instalacionRepo.save(instalacionesData);

    // 7. USUARIOS (50)
    const userRepo = dataSource.getRepository(Usuario);
    const usuariosData = Array.from({ length: 50 }, (_, i) => {
      if (i === 0) {
        return {
          username: 'admin',
          password: adminHash,
          correo: 'admin@mpp.com',
          activo: true,
          roles: [roles.find((r) => r.nombre === ROLES_MPP.SUPER_ADMIN) ?? roles[roles.length - 1]],
        };
      }
      const rol = roles[i % roles.length];
      return {
        username: `user${i}`,
        password: passwordHash,
        correo: `user${i}@mpp.com`,
        activo: true,
        roles: [rol],
      };
    });
    const usuarios = await userRepo.save(usuariosData);

    // 8. PROCESOS (50)
    const procesoRepo = dataSource.getRepository(Proceso);
    const tiposProceso = ['Sustantivo', 'Apoyo', 'Estratégico'];
    const procesosData = Array.from({ length: 50 }, (_, i) => {
      const tipo = tiposProceso[i % tiposProceso.length];
      const u1 = unidades[i % unidades.length];
      const u2 = unidades[(i + 5) % unidades.length];
      return {
        codigo: `PROC-SEC-${100 + i}`,
        nombre: `Proceso Masivo de Negocio ${i + 1}`,
        descripcion: `Descripcion detallada para el proceso masivo ${i + 1}`,
        tipo_proceso: tipo as 'Sustantivo' | 'Apoyo' | 'Estratégico',
        unidades: [u1, u2],
      };
    });
    const procesos = await procesoRepo.save(procesosData);

    // 9. PROCEDIMIENTOS (50)
    const procedimientoRepo = dataSource.getRepository(Procedimiento);
    const procedimientosData = Array.from({ length: 50 }, (_, i) => {
      const proceso = procesos[i % procesos.length];
      const instUnidades = [
        unidades[i % unidades.length],
        unidades[(i + 3) % unidades.length],
      ];
      return {
        nombre: `Procedimiento Operativo ${i + 1}`,
        codigo: `PROC-OP-${200 + i}`,
        objetivos: `Objetivo general del procedimiento ${i + 1}`,
        alcance: `Alcance para el procedimiento operativo ${i + 1}`,
        periodicidad: 'Mensual',
        version: '1.0',
        estado: 'Vigente',
        proceso: proceso,
        instalaciones: instUnidades,
      };
    });
    const procedimientos = await procedimientoRepo.save(procedimientosData);

    // 10. CARGO PROCESOS (50)
    const cargoProcesoRepo = dataSource.getRepository(CargoProceso);
    const cargoProcesosData = Array.from({ length: 50 }, (_, i) => {
      const cargo = cargos[i % cargos.length];
      const proceso = procesos[i % procesos.length];
      return {
        id_cargo: cargo.id_cargo,
        id_proceso: proceso.id_proceso,
        es_responsable_principal: i % 5 === 0,
      };
    });
    await cargoProcesoRepo.save(cargoProcesosData);

    // 11. FIGURAS (50)
    const figuraRepo = dataSource.getRepository(Figura);
    const predefinedFiguras = ['circulo', 'rectangulo', 'rombo'];
    const figurasData = Array.from({ length: 50 }, (_, i) => {
      const codigo = i < predefinedFiguras.length ? predefinedFiguras[i] : `figura_custom_${i + 1}`;
      const nombre = codigo.charAt(0).toUpperCase() + codigo.slice(1);
      return {
        nombre,
        codigo,
      };
    });
    const figuras = await figuraRepo.save(figurasData);

    // 12. ACCIONES (50)
    const accionRepo = dataSource.getRepository(Accion);
    const predefinedAcciones = [
      'Verificar',
      'Registrar',
      'Aprobar',
      'Revisar',
      'Enviar',
      'Recibir',
      'Analizar',
      'Ejecutar',
      'Notificar',
      'Archivar',
    ];
    const accionesData = Array.from({ length: 50 }, (_, i) => {
      const nombre = i < predefinedAcciones.length ? predefinedAcciones[i] : `Accion Ejecutiva ${i + 1}`;
      const figura = figuras[i % figuras.length];
      return {
        nombre_accion: nombre,
        figura: figura,
      };
    });
    const acciones = await accionRepo.save(accionesData);

    // 13. OPERACIONES (50)
    const operacionRepo = dataSource.getRepository(Operacion);
    const operacionesData = Array.from({ length: 50 }, (_, i) => {
      const procedimiento = procedimientos[i % procedimientos.length];
      return {
        nombre: `Operacion de Control ${i + 1}`,
        orden: (i % 3) + 1,
        procedimiento: procedimiento,
      };
    });
    const operaciones = await operacionRepo.save(operacionesData);

    // 14. ACTIVIDADES (50)
    const actividadRepo = dataSource.getRepository(Actividad);
    const actividadesData = Array.from({ length: 50 }, (_, i) => {
      const operacion = operaciones[i % operaciones.length];
      return {
        descripcion: `Actividad de Monitoreo ${i + 1}`,
        orden: (i % 2) + 1,
        operacion: operacion,
      };
    });
    const actividades = await actividadRepo.save(actividadesData);

    // 15. TAREAS (50)
    const tareaRepo = dataSource.getRepository(Tarea);
    const tareasData = Array.from({ length: 50 }, (_, i) => {
      const actividad = actividades[i % actividades.length];
      const accion = acciones[i % acciones.length];
      return {
        descripcion: `Descripción de la tarea masiva ${i + 1}`,
        texto_figura: `Tarea ${i + 1}`,
        orden: 1,
        actividad: actividad,
        accion: accion,
      };
    });
    const tareas = await tareaRepo.save(tareasData);

    // 16. OPERACION CARGOS (50)
    const operacionCargoRepo = dataSource.getRepository(OperacionCargo);
    const operacionCargosData = Array.from({ length: 50 }, (_, i) => {
      const operacion = operaciones[i % operaciones.length];
      const cargo = cargos[i % cargos.length];
      return {
        id_operacion: operacion.id_operaciones,
        id_cargo: cargo.id_cargo,
        tipo_participacion: i % 2 === 0 ? 'Responsable' : 'Colaborador',
      };
    });
    await operacionCargoRepo.save(operacionCargosData);

    // 17. REQUISITOS (50)
    const requisitosRepo = dataSource.getRepository(Requisitos);
    const requisitosData = Array.from({ length: 50 }, (_, i) => {
      const operacion = operaciones[i % operaciones.length];
      return {
        nombre: `Requisito Operacional ${i + 1}`,
        descripcion: `Descripción del requisito de cumplimiento ${i + 1}`,
        operacion: operacion,
      };
    });
    await requisitosRepo.save(requisitosData);

    // 18. RIESGOS (50)
    const riesgoRepo = dataSource.getRepository(Riesgo);
    const impactos = ['Alto', 'Medio', 'Bajo'];
    const probabilidades = ['Alta', 'Media', 'Baja'];
    const riesgosData = Array.from({ length: 50 }, (_, i) => {
      const operacion = operaciones[i % operaciones.length];
      return {
        nombre: `Riesgo de Negocio ${i + 1}`,
        impacto: impactos[i % impactos.length],
        probabilidad: probabilidades[i % probabilidades.length],
        operacion: operacion,
      };
    });
    await riesgoRepo.save(riesgosData);

    // 19. CONTROLES (50)
    const controlRepo = dataSource.getRepository(Control);
    const controlesData = Array.from({ length: 50 }, (_, i) => {
      const operacion = operaciones[i % operaciones.length];
      return {
        nombre: `Control de Mitigación ${i + 1}`,
        descripcion: `Mitigación y revisión del control ${i + 1}`,
        operacion: operacion,
      };
    });
    await controlRepo.save(controlesData);

    // 20. EQUIPOS (50)
    const equipoRepo = dataSource.getRepository(Equipo);
    const equiposData = Array.from({ length: 50 }, (_, i) => {
      const procedimiento = procedimientos[i % procedimientos.length];
      return {
        nombre: `Equipo Tecnico ${i + 1}`,
        codigo: `EQ-MAS-${300 + i}`,
        descripcion: `Descripcion de hardware o equipo masivo ${i + 1}`,
        procedimientos: [procedimiento],
      };
    });
    const equipos = await equipoRepo.save(equiposData);

    // 21. SISTEMAS DE INFORMACION (50)
    const siRepo = dataSource.getRepository(SistemaInformacion);
    const siData = Array.from({ length: 50 }, (_, i) => {
      const procedimiento = procedimientos[i % procedimientos.length];
      return {
        nombre: `Sistema Informatico ${i + 1}`,
        version: `v${(i % 5) + 1}.0`,
        procedimientos: [procedimiento],
      };
    });
    const sis = await siRepo.save(siData);

    // 22. DOCUMENTOS DE REFERENCIA (50)
    const docRepo = dataSource.getRepository(DocumentoReferencia);
    const docData = Array.from({ length: 50 }, (_, i) => {
      const operacion = operaciones[i % operaciones.length];
      return {
        codigo: `DOC-REF-${400 + i}`,
        nombre: `Manual de Operacion y Guia ${i + 1}`,
        tipo: i % 2 === 0 ? 'Manual' : 'Poliza',
        operaciones: [operacion],
      };
    });
    await docRepo.save(docData);

    // 23. NORMATIVAS (50)
    const normativaRepo = dataSource.getRepository(Normativa);
    const normativasData = Array.from({ length: 50 }, (_, i) => {
      const proc = procedimientos[i % procedimientos.length];
      return {
        nombre: `Norma Reguladora ${i + 1}`,
        descripcion: `Descripcion de la norma masiva ${i + 1}`,
        procedimientos: [proc],
      };
    });
    await normativaRepo.save(normativasData);

    // 24. INDICADORES (50)
    const indicadorRepo = dataSource.getRepository(Indicador);
    const indicadoresData = Array.from({ length: 50 }, (_, i) => {
      const proc = procedimientos[i % procedimientos.length];
      return {
        denominacion: `Indicador de KPI ${i + 1}`,
        formula: `Métrica ${(i % 3) + 1} / Total`,
        meta: `${(i % 10) * 10}%`,
        procedimientos: [proc],
      };
    });
    await indicadorRepo.save(indicadoresData);

    console.log('Seeder masivo (seed-2) completado con éxito! 🚀');
  }
}
