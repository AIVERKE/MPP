import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../../modules/seguridad/entities/usuario.entity';
import { Rol } from '../../modules/seguridad/entities/rol.entity';
import { Unidad } from '../../modules/estructura-organizacional/entities/unidad.entity';
import { Cargo } from '../../modules/estructura-organizacional/entities/cargo.entity';
import { Proceso } from '../../modules/procesos/entities/proceso.entity';
import { Procedimiento } from '../../modules/procesos/entities/procedimiento.entity';
import { Actividad } from '../../modules/flujo/entities/actividad.entity';
import { Operacion } from '../../modules/flujo/entities/operacion.entity';
import { Accion } from '../../modules/flujo/entities/accion.entity';
import { Figura } from '../../modules/flujo/entities/figura.entity';
import { Tarea } from '../../modules/flujo/entities/tarea.entity';
import { Requisitos } from '../../modules/recursos/entities/requisitos.entity';
import { Riesgo } from '../../modules/recursos/entities/riesgo.entity';
import { Control } from '../../modules/recursos/entities/control.entity';
import { Equipo } from '../../modules/recursos/entities/equipo.entity';
import { SistemaInformacion } from '../../modules/recursos/entities/sistema-informacion.entity';
import { Normativa } from '../../modules/calidad/entities/normativa.entity';
import { Indicador } from '../../modules/calidad/entities/indicador.entity';

export default class InitialSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    _factoryManager: SeederFactoryManager,
  ): Promise<any> {
    // Limpiar tablas (Trunca con CASCADE para manejar las FK)
    const entities = dataSource.entityMetadatas;
    const tableNames = entities
      .map((entity) => `"${entity.tableName}"`)
      .join(', ');
    await dataSource.query(`TRUNCATE ${tableNames} RESTART IDENTITY CASCADE;`);

    const passwordHash = await bcrypt.hash('password123', 10);

    // ==========================================
    // 1. ROLES Y USUARIOS
    // ==========================================
    const rolRepo = dataSource.getRepository(Rol);
    const roles = await rolRepo.save([
      { nombre: 'Administrador', descripcion: 'Acceso total al sistema' },
      {
        nombre: 'Analista de Procesos',
        descripcion: 'Gestión de flujos y procedimientos',
      },
      { nombre: 'Auditor', descripcion: 'Consulta y verificación de calidad' },
      { nombre: 'Gerente', descripcion: 'Aprobación y revisión estratégica' },
      { nombre: 'Operador', descripcion: 'Ejecución de tareas' },
      { nombre: 'Soporte', descripcion: 'Mantenimiento técnico' },
      { nombre: 'RRHH', descripcion: 'Gestión de cargos y personal' },
      { nombre: 'Calidad', descripcion: 'Gestión de normativas e indicadores' },
      { nombre: 'Invitado', descripcion: 'Acceso de solo lectura' },
      { nombre: 'Coordinador', descripcion: 'Gestión de equipos' },
    ] as any[]);

    const userRepo = dataSource.getRepository(Usuario);
    const usuarios = [];
    for (let i = 1; i <= 10; i++) {
      const user = await userRepo.save({
        username: `user${i}`,
        password: passwordHash,
        correo: `user${i}@mpp.com`,
        activo: true,
        roles: [roles[i - 1]],
      });
      usuarios.push(user);
    }

    // ==========================================
    // 2. ESTRUCTURA ORGANIZACIONAL
    // ==========================================
    const cargoRepo = dataSource.getRepository(Cargo);
    const cargos = await cargoRepo.save([
      {
        id_cargo: 1,
        nombre: 'Director General',
        descripcion: 'Máxima autoridad',
      },
      {
        id_cargo: 2,
        nombre: 'Jefe de Desarrollo',
        descripcion: 'Lidera equipo técnico',
      },
      { id_cargo: 3, nombre: 'Analista QA', descripcion: 'Asegura la calidad' },
      {
        id_cargo: 4,
        nombre: 'Especialista en Procesos',
        descripcion: 'Documenta flujos',
      },
      {
        id_cargo: 5,
        nombre: 'Asistente Administrativo',
        descripcion: 'Apoyo operativo',
      },
      {
        id_cargo: 6,
        nombre: 'Consultor Externo',
        descripcion: 'Asesoría técnica',
      },
      {
        id_cargo: 7,
        nombre: 'Técnico de Soporte',
        descripcion: 'Hardware y redes',
      },
      {
        id_cargo: 8,
        nombre: 'Auditor Interno',
        descripcion: 'Revisión de normas',
      },
      {
        id_cargo: 9,
        nombre: 'Secretario Ejecutivo',
        descripcion: 'Gestión de agenda',
      },
      {
        id_cargo: 10,
        nombre: 'Líder de Proyecto',
        descripcion: 'Gestión de tiempos y recursos',
      },
    ] as any[]);

    const isProd = process.env.NODE_ENV === 'production';

    const unidadRepo = dataSource.getRepository(Unidad);
    if (!isProd) {
      await unidadRepo.save([
        {
          id_unidad: 1,
          nombre: 'Dirección de Tecnología',
          sigla: 'DT',
          nivel: '1',
          tipo_unidad: 'Sustantiva',
          cargos: [cargos[1], cargos[2]],
        },
        {
          id_unidad: 2,
          nombre: 'Gerencia de Finanzas',
          sigla: 'GF',
          nivel: '1',
          tipo_unidad: 'Apoyo',
          cargos: [cargos[4]],
        },
        {
          id_unidad: 3,
          nombre: 'Departamento de Calidad',
          sigla: 'DC',
          nivel: '2',
          tipo_unidad: 'Asesoría',
          cargos: [cargos[7]],
        },
        {
          id_unidad: 4,
          nombre: 'Unidad de Procesos',
          sigla: 'UP',
          nivel: '2',
          tipo_unidad: 'Sustantiva',
          cargos: [cargos[3]],
        },
        {
          id_unidad: 5,
          nombre: 'Recursos Humanos',
          sigla: 'RRHH',
          nivel: '1',
          tipo_unidad: 'Apoyo',
          cargos: [cargos[8]],
        },
        {
          id_unidad: 6,
          nombre: 'Auditoría Interna',
          sigla: 'AI',
          nivel: '1',
          tipo_unidad: 'Control',
          cargos: [cargos[7]],
        },
        {
          id_unidad: 7,
          nombre: 'Mantenimiento',
          sigla: 'MANT',
          nivel: '2',
          tipo_unidad: 'Apoyo',
          cargos: [cargos[6]],
        },
        {
          id_unidad: 8,
          nombre: 'Ventas',
          sigla: 'VNT',
          nivel: '1',
          tipo_unidad: 'Sustantiva',
          cargos: [cargos[9]],
        },
        {
          id_unidad: 9,
          nombre: 'Logística',
          sigla: 'LOG',
          nivel: '2',
          tipo_unidad: 'Sustantiva',
          cargos: [cargos[5]],
        },
        {
          id_unidad: 10,
          nombre: 'Comunicación',
          sigla: 'COM',
          nivel: '2',
          tipo_unidad: 'Asesoría',
          cargos: [cargos[0]],
        },
      ] as any[]);
    } else {
      console.log(
        'Entorno de producción: se omite el seeding de unidades locales. El servicio MOF se encargará de la sincronización oficial.',
      );
    }

    // ==========================================
    // 3. PROCESOS Y PROCEDIMIENTOS
    // ==========================================
    const procesoRepo = dataSource.getRepository(Proceso);
    const procesos = await procesoRepo.save([
      {
        nombre: 'Gestión de Desarrollo',
        descripcion: 'Ciclo de vida del software',
        tipo_proceso: 'Sustantivo',
      },
      {
        nombre: 'Contratación de Personal',
        descripcion: 'Ingreso de nuevos talentos',
        tipo_proceso: 'Apoyo',
      },
      {
        nombre: 'Auditoría Anual',
        descripcion: 'Revisión general de cumplimiento',
        tipo_proceso: 'Estratégico',
      },
      {
        nombre: 'Soporte Técnico',
        descripcion: 'Atención a incidentes',
        tipo_proceso: 'Apoyo',
      },
      {
        nombre: 'Planificación Estratégica',
        descripcion: 'Metas a largo plazo',
        tipo_proceso: 'Estratégico',
      },
      {
        nombre: 'Compras Menores',
        descripcion: 'Adquisición de insumos',
        tipo_proceso: 'Apoyo',
      },
      {
        nombre: 'Gestión de Calidad',
        descripcion: 'Monitoreo de estándares',
        tipo_proceso: 'Sustantivo',
      },
      {
        nombre: 'Atención al Cliente',
        descripcion: 'Resolución de dudas',
        tipo_proceso: 'Sustantivo',
      },
      {
        nombre: 'Mantenimiento de Redes',
        descripcion: 'Infraestructura IT',
        tipo_proceso: 'Apoyo',
      },
      {
        nombre: 'Desarrollo de Mercado',
        descripcion: 'Expansión comercial',
        tipo_proceso: 'Estratégico',
      },
    ] as any[]);

    const procedimientoRepo = dataSource.getRepository(Procedimiento);
    const procedimientos = await procedimientoRepo.save([
      {
        nombre: 'Despliegue en Producción',
        codigo: 'PROC-IT-001',
        objetivos: 'Llevar código a prod',
        alcance: 'Toda el área IT',
        proceso: procesos[0],
      },
      {
        nombre: 'Entrevista Técnica',
        codigo: 'PROC-RH-002',
        objetivos: 'Evaluar candidatos',
        alcance: 'RRHH e IT',
        proceso: procesos[1],
      },
      {
        nombre: 'Checklist de Auditoría',
        codigo: 'PROC-AI-003',
        objetivos: 'Verificar normas',
        alcance: 'Toda la empresa',
        proceso: procesos[2],
      },
      {
        nombre: 'Reemplazo de Hardware',
        codigo: 'PROC-ST-004',
        objetivos: 'Cambiar equipos fallidos',
        alcance: 'Soporte',
        proceso: procesos[3],
      },
      {
        nombre: 'Definición de KPIs',
        codigo: 'PROC-PE-005',
        objetivos: 'Establecer métricas',
        alcance: 'Gerencia',
        proceso: procesos[4],
      },
      {
        nombre: 'Solicitud de Cotización',
        codigo: 'PROC-CO-006',
        objetivos: 'Obtener precios',
        alcance: 'Compras',
        proceso: procesos[5],
      },
      {
        nombre: 'Control de Documentos',
        codigo: 'PROC-GC-007',
        objetivos: 'Organizar archivos',
        alcance: 'Calidad',
        proceso: procesos[6],
      },
      {
        nombre: 'Registro de Ticket',
        codigo: 'PROC-AC-008',
        objetivos: 'Atender reclamos',
        alcance: 'Atención Cliente',
        proceso: procesos[7],
      },
      {
        nombre: 'Backup de Base de Datos',
        codigo: 'PROC-RED-009',
        objetivos: 'Resguardar info',
        alcance: 'Infraestructura',
        proceso: procesos[8],
      },
      {
        nombre: 'Análisis de Competencia',
        codigo: 'PROC-DM-010',
        objetivos: 'Estudiar mercado',
        alcance: 'Comercial',
        proceso: procesos[9],
      },
    ] as any[]);

    // ==========================================
    // 4. FLUJO (OPERACIONES, ACTIVIDADES, ACCIONES, TAREAS)
    // ==========================================
    const operacionRepo = dataSource.getRepository(Operacion);
    const operaciones = await operacionRepo.save([
      {
        nombre: 'Revisión de Código',
        orden: 1,
        procedimiento: procedimientos[0],
      },
      {
        nombre: 'Preparación de Sala',
        orden: 1,
        procedimiento: procedimientos[1],
      },
      {
        nombre: 'Revisión de Documentos',
        orden: 1,
        procedimiento: procedimientos[2],
      },
      {
        nombre: 'Diagnóstico Inicial',
        orden: 1,
        procedimiento: procedimientos[3],
      },
      {
        nombre: 'Taller de Lluvia de Ideas',
        orden: 1,
        procedimiento: procedimientos[4],
      },
      {
        nombre: 'Búsqueda de Proveedores',
        orden: 1,
        procedimiento: procedimientos[5],
      },
      {
        nombre: 'Clasificación de Normas',
        orden: 1,
        procedimiento: procedimientos[6],
      },
      {
        nombre: 'Recepción de Llamada',
        orden: 1,
        procedimiento: procedimientos[7],
      },
      {
        nombre: 'Cierre de Sesiones',
        orden: 1,
        procedimiento: procedimientos[8],
      },
      {
        nombre: 'Recolección de Datos',
        orden: 1,
        procedimiento: procedimientos[9],
      },
    ] as any[]);

    const actividadRepo = dataSource.getRepository(Actividad);
    const actividades = await actividadRepo.save(
      operaciones.map((op: any, i: number) => ({
        descripcion: `Actividad ${i + 1}`,
        orden: 1,
        operacion: op,
      })) as any[],
    );

    const figuraRepo = dataSource.getRepository(Figura);
    const figuras = await figuraRepo.save([
      { nombre: 'Círculo', codigo: 'circulo' },
      { nombre: 'Rectángulo', codigo: 'rectangulo' },
      { nombre: 'Rombo', codigo: 'rombo' },
    ] as any[]);

    const figuraRectangulo = figuras.find(
      (f: any) => f.codigo === 'rectangulo',
    );
    const figuraCirculo = figuras.find((f: any) => f.codigo === 'circulo');
    const figuraRombo = figuras.find((f: any) => f.codigo === 'rombo');

    const accionRepo = dataSource.getRepository(Accion);
    const acciones = await accionRepo.save([
      { nombre_accion: 'Verificar', figura: figuraRectangulo },
      { nombre_accion: 'Registrar', figura: figuraRectangulo },
      { nombre_accion: 'Aprobar', figura: figuraRectangulo },
      { nombre_accion: 'Revisar', figura: figuraRombo },
      { nombre_accion: 'Enviar', figura: figuraRectangulo },
      { nombre_accion: 'Recibir', figura: figuraRectangulo },
      { nombre_accion: 'Analizar', figura: figuraRombo },
      { nombre_accion: 'Ejecutar', figura: figuraRectangulo },
      { nombre_accion: 'Notificar', figura: figuraRectangulo },
      { nombre_accion: 'Archivar', figura: figuraCirculo },
    ] as any[]);

    const tareaRepo = dataSource.getRepository(Tarea);
    await tareaRepo.save(
      actividades.map((act: any, i: number) => ({
        descripcion: `Descripción de tarea ${i + 1}`,
        texto_figura: `Tarea ${i + 1}`,
        orden: 1,
        actividad: act,
        accion: acciones[i % 10],
      })) as any[],
    );

    // ==========================================
    // 5. REQUISITOS, RIESGOS, CONTROLES
    // ==========================================
    const reqRepo = dataSource.getRepository(Requisitos);
    await reqRepo.save(
      operaciones.map((op: any, i: number) => ({
        nombre: `Requisito ${i + 1}`,
        descripcion: 'Obligatorio',
        operacion: op,
      })) as any[],
    );

    const riesgoRepo = dataSource.getRepository(Riesgo);
    await riesgoRepo.save(
      operaciones.map((op: any, i: number) => ({
        nombre: `Riesgo ${i + 1}`,
        impacto: 'Alto',
        probabilidad: 'Media',
        operacion: op,
      })) as any[],
    );

    const controlRepo = dataSource.getRepository(Control);
    await controlRepo.save(
      operaciones.map((op: any, i: number) => ({
        nombre: `Control ${i + 1}`,
        descripcion: 'Mitigación automática',
        operacion: op,
      })) as any[],
    );

    // ==========================================
    // 6. RECURSOS
    // ==========================================
    const equipoRepo = dataSource.getRepository(Equipo);
    const equipos = await equipoRepo.save([
      {
        nombre: 'Laptop Dell XPS',
        codigo: 'EQ-001',
        descripcion: 'Para desarrollo',
      },
      {
        nombre: 'Servidor ProLiant',
        codigo: 'EQ-002',
        descripcion: 'Host de BD',
      },
      { nombre: 'Switch Cisco', codigo: 'EQ-003', descripcion: 'Red Core' },
      {
        nombre: 'Monitor 27"',
        codigo: 'EQ-004',
        descripcion: 'Doble pantalla',
      },
      { nombre: 'Impresora Laser', codigo: 'EQ-005', descripcion: 'RRHH' },
      {
        nombre: 'Router Ubiquiti',
        codigo: 'EQ-006',
        descripcion: 'WiFi Oficina',
      },
      { nombre: 'Tablet iPad', codigo: 'EQ-007', descripcion: 'Diseño' },
      { nombre: 'UPS 3KVA', codigo: 'EQ-008', descripcion: 'Respaldo energía' },
      { nombre: 'Scanner 3D', codigo: 'EQ-009', descripcion: 'Prototipado' },
      { nombre: 'Cámara 4K', codigo: 'EQ-010', descripcion: 'Videollamadas' },
    ] as any[]);

    const siRepo = dataSource.getRepository(SistemaInformacion);
    const sis = await siRepo.save([
      { nombre: 'Jira', version: '8.0', descripcion: 'Gestión de tickets' },
      { nombre: 'GitHub', version: 'Cloud', descripcion: 'Repositorios' },
      { nombre: 'Slack', version: '4.2', descripcion: 'Comunicación' },
      { nombre: 'Confluence', version: '7.1', descripcion: 'Wiki' },
      { nombre: 'Figma', version: 'Desktop', descripcion: 'Diseño UI' },
      { nombre: 'Zoom', version: '5.0', descripcion: 'Reuniones' },
      { nombre: 'PostgreSQL', version: '15', descripcion: 'Motor de BD' },
      { nombre: 'Redis', version: '7', descripcion: 'Cache' },
      { nombre: 'Docker', version: '24', descripcion: 'Contenedores' },
      { nombre: 'VS Code', version: '1.80', descripcion: 'IDE' },
    ] as any[]);

    // Relaciones adicionales M:N desde el lado que tiene el JoinTable
    equipos[0].procedimientos = [procedimientos[0]];
    await equipoRepo.save(equipos[0]);

    sis[0].procedimientos = [procedimientos[0]];
    await siRepo.save(sis[0]);

    // ==========================================
    // 7. CALIDAD
    // ==========================================
    const normativaRepo = dataSource.getRepository(Normativa);
    await normativaRepo.save([
      { nombre: 'ISO 9001', descripcion: 'Gestión de Calidad' },
      { nombre: 'ISO 27001', descripcion: 'Seguridad de Info' },
      { nombre: 'GDPR', descripcion: 'Privacidad de Datos' },
      { nombre: 'ISO 14001', descripcion: 'Gestión Ambiental' },
      { nombre: 'ISO 45001', descripcion: 'Salud y Seguridad' },
      { nombre: 'SOC2', descripcion: 'Cumplimiento Cloud' },
      { nombre: 'PCI DSS', descripcion: 'Pagos con Tarjeta' },
      { nombre: 'HIPAA', descripcion: 'Salud USA' },
      { nombre: 'COBIT', descripcion: 'Gobierno IT' },
      { nombre: 'ITIL v4', descripcion: 'Servicios IT' },
    ] as any[]);

    const indicadorRepo = dataSource.getRepository(Indicador);
    await indicadorRepo.save([
      { denominacion: 'Tiempo de Respuesta', formula: 'T2 - T1', meta: '2h' },
      {
        denominacion: 'Disponibilidad',
        formula: 'Uptime / Total',
        meta: '99.9%',
      },
      { denominacion: 'Satisfacción', formula: 'Promedio CSAT', meta: '4.5' },
      { denominacion: 'Bugs en Prod', formula: 'Count(Bugs)', meta: '< 5' },
      {
        denominacion: 'Tiempo de Contratación',
        formula: 'Dias Totales',
        meta: '15d',
      },
      {
        denominacion: 'Costo por Ticket',
        formula: 'Presupuesto / Tickets',
        meta: '$10',
      },
      {
        denominacion: 'Tasa de Rebote',
        formula: 'Visitas sin acción',
        meta: '< 20%',
      },
      {
        denominacion: 'Retention Rate',
        formula: 'Clientes activos',
        meta: '> 90%',
      },
      { denominacion: 'Velocidad de Carga', formula: 'MS carga', meta: '< 2s' },
      {
        denominacion: 'Cobertura de Tests',
        formula: 'Lineas cubiertas',
        meta: '> 80%',
      },
    ] as any[]);

    console.log('Seed-1 completado con éxito! 🚀');
  }
}
