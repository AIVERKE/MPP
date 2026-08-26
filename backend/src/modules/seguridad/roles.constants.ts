/**
 * Catálogo operativo de roles MPP (canvas de definición de roles).
 * Los nombres son strings estables usados en guards, seeds y UI.
 */
export const ROLES_MPP = {
  CONSULTOR: 'Consultor',
  ELABORADOR: 'Elaborador',
  VALIDADOR_PLANIFICACION: 'Validador de Planificación',
  VALIDADOR_TECNICO: 'Validador Técnico',
  SUPER_ADMIN: 'Super admin',
} as const;

export type RolMppNombre = (typeof ROLES_MPP)[keyof typeof ROLES_MPP];

export const ROLES_MPP_CATALOG: ReadonlyArray<{
  nombre: RolMppNombre;
  descripcion: string;
}> = [
  {
    nombre: ROLES_MPP.CONSULTOR,
    descripcion:
      'Consulta procedimientos publicados/autorizados. No crea, modifica, observa ni valida.',
  },
  {
    nombre: ROLES_MPP.ELABORADOR,
    descripcion:
      'Crea, modifica y envía borradores de procedimientos de sus unidades asignadas. No puede validar técnicamente el mismo procedimiento que elaboró.',
  },
  {
    nombre: ROLES_MPP.VALIDADOR_PLANIFICACION,
    descripcion:
      'Revisa metodología, estructura y coherencia formal. Puede observar o enviar a visto bueno técnico. No certifica el contenido técnico.',
  },
  {
    nombre: ROLES_MPP.VALIDADOR_TECNICO,
    descripcion:
      'Revisa el contenido técnico de procedimientos de sus unidades. Puede observar o otorgar el visto bueno técnico final.',
  },
  {
    nombre: ROLES_MPP.SUPER_ADMIN,
    descripcion:
      'Administra usuarios, roles, catálogos y parámetros del sistema. Intervenciones excepcionales sobre procedimientos quedan auditadas.',
  },
];

/** Roles que requieren alcance por unidad organizativa. */
export const ROLES_CON_ALCANCE_UNIDAD: ReadonlyArray<RolMppNombre> = [
  ROLES_MPP.CONSULTOR,
  ROLES_MPP.ELABORADOR,
  ROLES_MPP.VALIDADOR_TECNICO,
];

/** Roles que exigen al menos una unidad al asignarlos. */
export const ROLES_ALCANCE_OBLIGATORIO: ReadonlyArray<RolMppNombre> = [
  ROLES_MPP.ELABORADOR,
  ROLES_MPP.VALIDADOR_TECNICO,
];

export const ESTADOS_PUBLICADOS: ReadonlyArray<string> = [
  'Aprobado',
  'Renovado',
];

/** Nombre legacy del Super admin en seeds anteriores. */
export const ROL_ADMIN_LEGACY = 'Administrador';
