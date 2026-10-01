export type CodigoFigura =
  | 'circulo'
  | 'rectangulo'
  | 'rombo'
  | 'elipse'
  | 'paralelogramo'
  | 'triangulo'
  | 'hexagono';

export interface CarrilDemo {
  key: string;
  unidad: string;
  cargo: string;
}

export interface PasoDemo {
  carril: string;
  figura: CodigoFigura;
  actividad: string;
  tarea: string;
  /** El frontend interpreta "ir a paso N" / "vuelve a paso N" como salto. */
  textoFigura: string;
  requisito: string;
  solicitante: string;
  referencia: { codigo: string; nombre: string; tipo: string };
  riesgo: { descripcion: string; nivel: 'Alto' | 'Medio' | 'Bajo' };
  control: {
    descripcion: string;
    tipo: 'Preventivo' | 'Detectivo' | 'Correctivo';
  };
  salida: string;
  plazo: number;
  /** Solo para figura rombo: números de paso destino de cada rama. */
  decision?: { expresion: string; si: number; no: number };
}

export interface ProcedimientoDemo {
  proceso: {
    codigo: string;
    nombre: string;
    descripcion: string;
    tipo_proceso: 'Sustantivo' | 'Apoyo' | 'Estratégico';
  };
  codigo: string;
  nombre: string;
  objetivos: string;
  alcance: string;
  periodicidad: string;
  version: string;
  estado_version: 'Borrador' | 'En revisión' | 'Aprobado' | 'Renovado';
  carriles: CarrilDemo[];
  /** Claves de carril cuyas unidades se registran como instalaciones. */
  instalaciones: string[];
  pasos: PasoDemo[];
  indicadores: Array<{
    denominacion: string;
    descripcion: string;
    formula: string;
    unidad_medida: string;
    fuente_datos: string;
    metodo_verificacion: string;
    meta: string;
    frecuencia: string;
  }>;
  normativas: Array<{
    codigo: string;
    nombre: string;
    descripcion: string;
    url?: string;
    fecha_emision: string;
  }>;
  sistemas: Array<{ nombre: string; version: string }>;
  equipos: Array<{ nombre: string; descripcion: string }>;
}

const SECRETARIA_GENERAL: CarrilDemo = {
  key: 'SG',
  unidad: 'SECRETARÍA GENERAL',
  cargo: 'SECRETARIO/A GENERAL',
};

const ARCHIVO: CarrilDemo = {
  key: 'ARCH',
  unidad: 'DIVISIÓN DE DOCUMENTOS Y ARCHIVO',
  cargo: 'JEFE DE DIVISIÓN',
};

const compraBienes: ProcedimientoDemo = {
  proceso: {
    codigo: 'PROC-DEMO-01',
    nombre: 'Gestión de Adquisiciones (Demo)',
    descripcion:
      'Proceso de apoyo para la provisión de bienes y servicios a las unidades académicas y administrativas.',
    tipo_proceso: 'Apoyo',
  },
  codigo: 'PRC-DEMO-001',
  nombre: 'Adquisición de bienes por contratación menor',
  objetivos:
    'Atender de forma oportuna y transparente los requerimientos de bienes de las unidades solicitantes, garantizando la disponibilidad presupuestaria y el cumplimiento de la normativa de contrataciones.',
  alcance:
    'Inicia con el requerimiento de la unidad solicitante y concluye con el ingreso de los bienes a inventario y el archivo del expediente. Aplica a contrataciones menores de toda la institución.',
  periodicidad: 'A demanda',
  version: '1.0',
  estado_version: 'Aprobado',
  carriles: [
    {
      key: 'SEC',
      unidad: 'FCPN-DIRECCIÓN DE CARRERA INFORMÁTICA',
      cargo: 'SECRETARIA',
    },
    {
      key: 'DIR',
      unidad: 'FCPN-DIRECCIÓN DE CARRERA INFORMÁTICA',
      cargo: 'DIRECTOR/A DE CARRERA',
    },
    {
      key: 'PRES',
      unidad: 'DEPARTAMENTO DE PRESUPUESTO Y PLANIFICACIÓN FINANCIERA',
      cargo: 'JEFE DE DEPARTAMENTO',
    },
    {
      key: 'ADQ',
      unidad: 'DIVISIÓN DE ADQUISICIONES',
      cargo: 'JEFE DE DIVISIÓN',
    },
    {
      key: 'DAF',
      unidad: 'DIRECCIÓN ADMINISTRATIVA FINANCIERA',
      cargo: 'DIRECTOR ADMINISTRATIVO FINANCIERO',
    },
    {
      key: 'BIEN',
      unidad: 'DIVISIÓN DE BIENES E INVENTARIOS',
      cargo: 'JEFE DE DIVISIÓN',
    },
  ],
  instalaciones: ['DIR', 'ADQ'],
  pasos: [
    {
      carril: 'SEC',
      figura: 'circulo',
      actividad: 'Recepción del requerimiento',
      tarea: 'Recibe el requerimiento de bienes del personal de la carrera.',
      textoFigura: 'Inicio: recibe requerimiento',
      requisito: 'Nota de requerimiento firmada por el personal solicitante',
      solicitante: 'Personal docente o administrativo de la carrera',
      referencia: {
        codigo: 'FOR-ADQ-01',
        nombre: 'Formulario de requerimiento de bienes',
        tipo: 'Formulario',
      },
      riesgo: {
        descripcion: 'Requerimiento incompleto o sin justificación de la necesidad',
        nivel: 'Medio',
      },
      control: {
        descripcion: 'Verificación de campos obligatorios del formulario',
        tipo: 'Preventivo',
      },
      salida: 'Requerimiento registrado en hoja de ruta',
      plazo: 0.5,
    },
    {
      carril: 'DIR',
      figura: 'rectangulo',
      actividad: 'Elaboración de la solicitud de compra',
      tarea: 'Elabora y firma la solicitud de compra con especificaciones técnicas.',
      textoFigura: 'Elabora solicitud con especificaciones técnicas',
      requisito: 'Requerimiento registrado y especificaciones técnicas',
      solicitante: 'Secretaria de la carrera',
      referencia: {
        codigo: 'GUIA-ADQ-02',
        nombre: 'Guía para la elaboración de especificaciones técnicas',
        tipo: 'Guía',
      },
      riesgo: {
        descripcion: 'Especificaciones técnicas direccionadas a un proveedor',
        nivel: 'Alto',
      },
      control: {
        descripcion: 'Revisión de especificaciones genéricas sin marcas',
        tipo: 'Preventivo',
      },
      salida: 'Solicitud de compra firmada',
      plazo: 1,
    },
    {
      carril: 'PRES',
      figura: 'rombo',
      actividad: 'Verificación presupuestaria',
      tarea: 'Verifica la disponibilidad presupuestaria en la partida correspondiente.',
      textoFigura: '¿Existe presupuesto?',
      requisito: 'Solicitud de compra firmada',
      solicitante: 'Director/a de carrera',
      referencia: {
        codigo: 'POA-2026',
        nombre: 'Programa Operativo Anual y presupuesto de la gestión',
        tipo: 'Plan',
      },
      riesgo: {
        descripcion: 'Certificación sobre una partida sin saldo suficiente',
        nivel: 'Alto',
      },
      control: {
        descripcion: 'Consulta de saldo en el sistema presupuestario antes de certificar',
        tipo: 'Preventivo',
      },
      salida: 'Certificación presupuestaria o informe de no disponibilidad',
      plazo: 1,
      decision: {
        expresion: 'Saldo de la partida >= monto estimado de la compra',
        si: 4,
        no: 9,
      },
    },
    {
      carril: 'ADQ',
      figura: 'hexagono',
      actividad: 'Preparación del proceso de contratación',
      tarea: 'Prepara el proceso y solicita al menos tres cotizaciones a proveedores.',
      textoFigura: 'Prepara proceso y solicita cotizaciones',
      requisito: 'Certificación presupuestaria',
      solicitante: 'Jefe del Departamento de Presupuesto',
      referencia: {
        codigo: 'DS-0181',
        nombre: 'Normas Básicas del Sistema de Administración de Bienes y Servicios',
        tipo: 'Norma',
      },
      riesgo: {
        descripcion: 'Cotizaciones insuficientes o de proveedores vinculados',
        nivel: 'Alto',
      },
      control: {
        descripcion: 'Registro de al menos tres cotizaciones independientes',
        tipo: 'Detectivo',
      },
      salida: 'Cuadro comparativo de cotizaciones',
      plazo: 3,
    },
    {
      carril: 'ADQ',
      figura: 'rombo',
      actividad: 'Evaluación del monto de la contratación',
      tarea: 'Evalúa si el monto adjudicado supera el límite de autorización de la División.',
      textoFigura: '¿Monto supera Bs 20.000?',
      requisito: 'Cuadro comparativo de cotizaciones',
      solicitante: 'Jefe de la División de Adquisiciones',
      referencia: {
        codigo: 'RES-DAF-05',
        nombre: 'Resolución de niveles de autorización de gastos',
        tipo: 'Resolución',
      },
      riesgo: {
        descripcion: 'Fraccionamiento de compras para evitar autorización superior',
        nivel: 'Alto',
      },
      control: {
        descripcion: 'Comparación con compras del mismo objeto en la gestión',
        tipo: 'Detectivo',
      },
      salida: 'Informe de recomendación de adjudicación',
      plazo: 0.5,
      decision: {
        expresion: 'Monto adjudicado > Bs 20.000',
        si: 6,
        no: 7,
      },
    },
    {
      carril: 'DAF',
      figura: 'rectangulo',
      actividad: 'Autorización de la contratación',
      tarea: 'Revisa el informe de recomendación y autoriza la contratación.',
      textoFigura: 'Autoriza la contratación',
      requisito: 'Informe de recomendación de adjudicación',
      solicitante: 'Jefe de la División de Adquisiciones',
      referencia: {
        codigo: 'LEY-1178',
        nombre: 'Ley de Administración y Control Gubernamentales (SAFCO)',
        tipo: 'Ley',
      },
      riesgo: {
        descripcion: 'Demora en la autorización que retrasa la provisión',
        nivel: 'Medio',
      },
      control: {
        descripcion: 'Seguimiento de plazos en la hoja de ruta',
        tipo: 'Detectivo',
      },
      salida: 'Autorización de contratación firmada',
      plazo: 1,
    },
    {
      carril: 'ADQ',
      figura: 'paralelogramo',
      actividad: 'Emisión de la orden de compra',
      tarea: 'Emite la orden de compra y la notifica al proveedor adjudicado.',
      textoFigura: 'Emite orden de compra',
      requisito: 'Adjudicación autorizada',
      solicitante: 'Director Administrativo Financiero',
      referencia: {
        codigo: 'FOR-ADQ-03',
        nombre: 'Formato de orden de compra',
        tipo: 'Formulario',
      },
      riesgo: {
        descripcion: 'Orden de compra con datos distintos a la cotización adjudicada',
        nivel: 'Medio',
      },
      control: {
        descripcion: 'Cotejo de la orden con la cotización adjudicada',
        tipo: 'Preventivo',
      },
      salida: 'Orden de compra notificada',
      plazo: 1,
    },
    {
      carril: 'BIEN',
      figura: 'rectangulo',
      actividad: 'Recepción e ingreso a inventario',
      tarea: 'Recepciona los bienes, verifica su conformidad y los registra en inventario.',
      textoFigura: 'Recepciona bienes e ingresa a inventario (ir a paso 10)',
      requisito: 'Orden de compra y nota de entrega del proveedor',
      solicitante: 'Proveedor adjudicado',
      referencia: {
        codigo: 'REG-BIE-01',
        nombre: 'Reglamento de administración de bienes e inventarios',
        tipo: 'Reglamento',
      },
      riesgo: {
        descripcion: 'Recepción de bienes que no cumplen las especificaciones',
        nivel: 'Alto',
      },
      control: {
        descripcion: 'Acta de conformidad firmada por la comisión de recepción',
        tipo: 'Detectivo',
      },
      salida: 'Acta de recepción y registro de alta en inventario',
      plazo: 2,
    },
    {
      carril: 'SEC',
      figura: 'paralelogramo',
      actividad: 'Notificación de falta de presupuesto',
      tarea: 'Notifica a la unidad solicitante que no existe disponibilidad presupuestaria.',
      textoFigura: 'Notifica falta de presupuesto',
      requisito: 'Informe de no disponibilidad presupuestaria',
      solicitante: 'Jefe del Departamento de Presupuesto',
      referencia: {
        codigo: 'FOR-ADQ-04',
        nombre: 'Modelo de nota de notificación',
        tipo: 'Formulario',
      },
      riesgo: {
        descripcion: 'El solicitante no es informado y reitera el requerimiento',
        nivel: 'Bajo',
      },
      control: {
        descripcion: 'Constancia de recepción de la notificación',
        tipo: 'Detectivo',
      },
      salida: 'Nota de notificación con cargo de recepción',
      plazo: 0.5,
    },
    {
      carril: 'SEC',
      figura: 'triangulo',
      actividad: 'Archivo del expediente',
      tarea: 'Archiva el expediente completo de la contratación.',
      textoFigura: 'Archiva expediente',
      requisito: 'Expediente completo de la contratación',
      solicitante: 'Jefe de la División de Bienes e Inventarios',
      referencia: {
        codigo: 'MAN-ARC-01',
        nombre: 'Manual de gestión documental y archivo',
        tipo: 'Manual',
      },
      riesgo: {
        descripcion: 'Pérdida de documentos de respaldo del expediente',
        nivel: 'Medio',
      },
      control: {
        descripcion: 'Foliado y registro en el índice de archivo',
        tipo: 'Preventivo',
      },
      salida: 'Expediente archivado y foliado',
      plazo: 0.5,
    },
    {
      carril: 'SEC',
      figura: 'circulo',
      actividad: 'Conclusión del procedimiento',
      tarea: 'Da por concluido el procedimiento.',
      textoFigura: 'Fin',
      requisito: 'Expediente archivado',
      solicitante: 'Secretaria de la carrera',
      referencia: {
        codigo: 'MAN-ARC-01',
        nombre: 'Manual de gestión documental y archivo',
        tipo: 'Manual',
      },
      riesgo: {
        descripcion: 'Cierre del trámite sin registro en la hoja de ruta',
        nivel: 'Bajo',
      },
      control: {
        descripcion: 'Registro de conclusión en la hoja de ruta',
        tipo: 'Detectivo',
      },
      salida: 'Hoja de ruta concluida',
      plazo: 0,
    },
  ],
  indicadores: [
    {
      denominacion: 'Tiempo promedio de atención de compras menores (Demo)',
      descripcion: 'Mide los días hábiles entre el requerimiento y el ingreso a inventario.',
      formula: 'Σ(días de atención por compra) / N° de compras atendidas',
      unidad_medida: 'Días hábiles',
      fuente_datos: 'Hojas de ruta y actas de recepción',
      metodo_verificacion: 'Revisión trimestral de expedientes concluidos',
      meta: '<= 15 días',
      frecuencia: 'Trimestral',
    },
    {
      denominacion: 'Porcentaje de compras con tres cotizaciones (Demo)',
      descripcion: 'Mide el cumplimiento de la competencia mínima en compras menores.',
      formula: '(Compras con 3 o más cotizaciones / Total de compras) x 100',
      unidad_medida: 'Porcentaje',
      fuente_datos: 'Cuadros comparativos de la División de Adquisiciones',
      metodo_verificacion: 'Muestreo de expedientes por auditoría interna',
      meta: '100%',
      frecuencia: 'Semestral',
    },
  ],
  normativas: [
    {
      codigo: 'LEY-1178',
      nombre: 'Ley N° 1178 de Administración y Control Gubernamentales (SAFCO)',
      descripcion: 'Regula los sistemas de administración y control de los recursos del Estado.',
      fecha_emision: '1990-07-20',
    },
    {
      codigo: 'DS-0181',
      nombre: 'D.S. N° 0181 Normas Básicas del Sistema de Administración de Bienes y Servicios',
      descripcion: 'Establece las modalidades y procedimientos de contratación de bienes y servicios.',
      fecha_emision: '2009-06-28',
    },
  ],
  sistemas: [
    { nombre: 'Sistema de Gestión Presupuestaria (Demo)', version: '2.3' },
    { nombre: 'Sistema de Activos Fijos (Demo)', version: '1.8' },
  ],
  equipos: [
    {
      nombre: 'Computadora de escritorio - Adquisiciones (Demo)',
      descripcion: 'Equipo para la elaboración de cuadros comparativos y órdenes de compra.',
    },
    {
      nombre: 'Lector de código de barras - Inventarios (Demo)',
      descripcion: 'Equipo para el registro y etiquetado de bienes en inventario.',
    },
  ],
};

const diplomaAcademico: ProcedimientoDemo = {
  proceso: {
    codigo: 'PROC-DEMO-02',
    nombre: 'Gestión de Títulos y Grados (Demo)',
    descripcion:
      'Proceso sustantivo para la emisión de diplomas y títulos a los graduados de la institución.',
    tipo_proceso: 'Sustantivo',
  },
  codigo: 'PRC-DEMO-002',
  nombre: 'Emisión de Diploma Académico',
  objetivos:
    'Emitir el Diploma Académico a los egresados que concluyeron su plan de estudios, verificando la autenticidad y completitud de su expediente.',
  alcance:
    'Inicia con la solicitud del egresado en la carrera y concluye con la entrega del diploma y el archivo de su copia legalizada. Aplica a todas las carreras de la institución.',
  periodicidad: 'Permanente',
  version: '1.0',
  estado_version: 'Borrador',
  carriles: [
    {
      key: 'SEC',
      unidad: 'FCPN-DIRECCIÓN DE CARRERA ESTADÍSTICA',
      cargo: 'SECRETARIA',
    },
    {
      key: 'DIR',
      unidad: 'FCPN-DIRECCIÓN DE CARRERA ESTADÍSTICA',
      cargo: 'DIRECTOR/A DE CARRERA',
    },
    {
      key: 'TIT',
      unidad: 'DIVISIÓN DE TÍTULOS Y DIPLOMAS',
      cargo: 'JEFE DE DIVISIÓN',
    },
    SECRETARIA_GENERAL,
    ARCHIVO,
  ],
  instalaciones: ['DIR', 'TIT'],
  pasos: [
    {
      carril: 'SEC',
      figura: 'circulo',
      actividad: 'Recepción de la solicitud',
      tarea: 'Recibe la solicitud de Diploma Académico del egresado.',
      textoFigura: 'Inicio: recibe solicitud',
      requisito: 'Solicitud escrita del egresado',
      solicitante: 'Egresado de la carrera',
      referencia: {
        codigo: 'REG-TIT-01',
        nombre: 'Reglamento de Títulos y Grados',
        tipo: 'Reglamento',
      },
      riesgo: {
        descripcion: 'Solicitud presentada por persona no habilitada',
        nivel: 'Bajo',
      },
      control: {
        descripcion: 'Verificación de identidad con cédula de identidad',
        tipo: 'Preventivo',
      },
      salida: 'Solicitud registrada con número de trámite',
      plazo: 0.5,
    },
    {
      carril: 'SEC',
      figura: 'rectangulo',
      actividad: 'Verificación documental',
      tarea: 'Verifica certificado de notas, acta de defensa y depósito bancario.',
      textoFigura: 'Verifica requisitos documentales',
      requisito: 'Certificado de notas, acta de defensa y depósito bancario',
      solicitante: 'Egresado de la carrera',
      referencia: {
        codigo: 'LIST-TIT-02',
        nombre: 'Lista de verificación de requisitos para Diploma Académico',
        tipo: 'Lista de verificación',
      },
      riesgo: {
        descripcion: 'Aceptación de documentos falsificados o incompletos',
        nivel: 'Alto',
      },
      control: {
        descripcion: 'Contraste con el kardex académico de la carrera',
        tipo: 'Detectivo',
      },
      salida: 'Lista de verificación llenada',
      plazo: 1,
    },
    {
      carril: 'SEC',
      figura: 'rombo',
      actividad: 'Evaluación de completitud del expediente',
      tarea: 'Determina si el expediente cumple todos los requisitos.',
      textoFigura: '¿Expediente completo?',
      requisito: 'Lista de verificación llenada',
      solicitante: 'Secretaria de la carrera',
      referencia: {
        codigo: 'LIST-TIT-02',
        nombre: 'Lista de verificación de requisitos para Diploma Académico',
        tipo: 'Lista de verificación',
      },
      riesgo: {
        descripcion: 'Criterio inconsistente al evaluar expedientes',
        nivel: 'Medio',
      },
      control: {
        descripcion: 'Uso obligatorio de la lista de verificación estándar',
        tipo: 'Preventivo',
      },
      salida: 'Expediente aceptado u observado',
      plazo: 0.5,
      decision: {
        expresion: 'Todos los requisitos de la lista están presentes y vigentes',
        si: 5,
        no: 4,
      },
    },
    {
      carril: 'SEC',
      figura: 'paralelogramo',
      actividad: 'Devolución del expediente observado',
      tarea: 'Devuelve el expediente al egresado con las observaciones para subsanar.',
      textoFigura: 'Devuelve expediente observado (vuelve a paso 2)',
      requisito: 'Expediente observado',
      solicitante: 'Secretaria de la carrera',
      referencia: {
        codigo: 'FOR-TIT-03',
        nombre: 'Formulario de observaciones al expediente',
        tipo: 'Formulario',
      },
      riesgo: {
        descripcion: 'Observaciones poco claras que generan reprocesos',
        nivel: 'Bajo',
      },
      control: {
        descripcion: 'Detalle escrito de cada observación en el formulario',
        tipo: 'Correctivo',
      },
      salida: 'Formulario de observaciones entregado',
      plazo: 0.5,
    },
    {
      carril: 'DIR',
      figura: 'rectangulo',
      actividad: 'Conformidad de la carrera',
      tarea: 'Revisa y firma el informe de conclusión de estudios y lo remite a Títulos.',
      textoFigura: 'Firma informe de conclusión de estudios',
      requisito: 'Expediente completo',
      solicitante: 'Secretaria de la carrera',
      referencia: {
        codigo: 'REG-TIT-01',
        nombre: 'Reglamento de Títulos y Grados',
        tipo: 'Reglamento',
      },
      riesgo: {
        descripcion: 'Firma sin revisión del expediente',
        nivel: 'Medio',
      },
      control: {
        descripcion: 'Visto bueno de la secretaria en el informe antes de la firma',
        tipo: 'Preventivo',
      },
      salida: 'Informe de conclusión de estudios firmado',
      plazo: 2,
    },
    {
      carril: 'TIT',
      figura: 'hexagono',
      actividad: 'Preparación del diploma',
      tarea: 'Prepara el diploma y registra los datos en el sistema de títulos.',
      textoFigura: 'Prepara diploma y registra en sistema',
      requisito: 'Informe de conclusión de estudios firmado',
      solicitante: 'Director/a de carrera',
      referencia: {
        codigo: 'MAN-TIT-04',
        nombre: 'Manual de usuario del Sistema de Títulos',
        tipo: 'Manual',
      },
      riesgo: {
        descripcion: 'Errores de transcripción en nombres o fechas',
        nivel: 'Alto',
      },
      control: {
        descripcion: 'Doble verificación de datos contra la cédula de identidad',
        tipo: 'Detectivo',
      },
      salida: 'Diploma impreso y registro en el sistema',
      plazo: 3,
    },
    {
      carril: 'TIT',
      figura: 'rombo',
      actividad: 'Control de calidad del diploma',
      tarea: 'Verifica que los datos impresos coincidan con el expediente.',
      textoFigura: '¿Datos verificados sin observaciones?',
      requisito: 'Diploma impreso',
      solicitante: 'Jefe de la División de Títulos y Diplomas',
      referencia: {
        codigo: 'LIST-TIT-05',
        nombre: 'Lista de control de calidad de diplomas',
        tipo: 'Lista de verificación',
      },
      riesgo: {
        descripcion: 'Diploma emitido con errores que obliga a reimpresión',
        nivel: 'Medio',
      },
      control: {
        descripcion: 'Revisión por un segundo funcionario de la División',
        tipo: 'Detectivo',
      },
      salida: 'Diploma validado u observado',
      plazo: 0.5,
      decision: {
        expresion: 'Los datos del diploma coinciden con el expediente',
        si: 8,
        no: 6,
      },
    },
    {
      carril: 'SG',
      figura: 'rectangulo',
      actividad: 'Firma del diploma',
      tarea: 'Firma el Diploma Académico y lo devuelve a la División de Títulos.',
      textoFigura: 'Firma el Diploma Académico',
      requisito: 'Diploma validado',
      solicitante: 'Jefe de la División de Títulos y Diplomas',
      referencia: {
        codigo: 'EST-ORG-01',
        nombre: 'Estatuto Orgánico de la Universidad',
        tipo: 'Estatuto',
      },
      riesgo: {
        descripcion: 'Retraso en la firma por acumulación de trámites',
        nivel: 'Medio',
      },
      control: {
        descripcion: 'Agenda semanal de firmas de diplomas',
        tipo: 'Preventivo',
      },
      salida: 'Diploma Académico firmado',
      plazo: 2,
    },
    {
      carril: 'TIT',
      figura: 'elipse',
      actividad: 'Entrega del diploma',
      tarea: 'Entrega el diploma al titulado y registra la entrega.',
      textoFigura: 'Entrega diploma al titulado',
      requisito: 'Diploma firmado y cédula de identidad del titulado',
      solicitante: 'Titulado',
      referencia: {
        codigo: 'FOR-TIT-06',
        nombre: 'Libro de registro de entrega de diplomas',
        tipo: 'Registro',
      },
      riesgo: {
        descripcion: 'Entrega del diploma a una persona no autorizada',
        nivel: 'Alto',
      },
      control: {
        descripcion: 'Firma del titulado en el libro de entregas con verificación de identidad',
        tipo: 'Preventivo',
      },
      salida: 'Registro de entrega firmado',
      plazo: 0.5,
    },
    {
      carril: 'ARCH',
      figura: 'triangulo',
      actividad: 'Archivo de la copia legalizada',
      tarea: 'Archiva la copia legalizada del diploma junto al expediente.',
      textoFigura: 'Archiva copia legalizada',
      requisito: 'Copia legalizada y expediente',
      solicitante: 'Jefe de la División de Títulos y Diplomas',
      referencia: {
        codigo: 'MAN-ARC-01',
        nombre: 'Manual de gestión documental y archivo',
        tipo: 'Manual',
      },
      riesgo: {
        descripcion: 'Extravío del expediente en el archivo central',
        nivel: 'Medio',
      },
      control: {
        descripcion: 'Registro del expediente en el índice digital del archivo',
        tipo: 'Preventivo',
      },
      salida: 'Expediente archivado',
      plazo: 1,
    },
    {
      carril: 'ARCH',
      figura: 'circulo',
      actividad: 'Conclusión del procedimiento',
      tarea: 'Da por concluido el procedimiento.',
      textoFigura: 'Fin',
      requisito: 'Expediente archivado',
      solicitante: 'Jefe de la División de Documentos y Archivo',
      referencia: {
        codigo: 'MAN-ARC-01',
        nombre: 'Manual de gestión documental y archivo',
        tipo: 'Manual',
      },
      riesgo: {
        descripcion: 'Trámite no cerrado en el sistema',
        nivel: 'Bajo',
      },
      control: {
        descripcion: 'Cierre del trámite en el sistema de títulos',
        tipo: 'Detectivo',
      },
      salida: 'Trámite concluido',
      plazo: 0,
    },
  ],
  indicadores: [
    {
      denominacion: 'Tiempo promedio de emisión de diplomas (Demo)',
      descripcion: 'Mide los días hábiles desde la solicitud hasta la entrega del diploma.',
      formula: 'Σ(días por trámite) / N° de diplomas entregados',
      unidad_medida: 'Días hábiles',
      fuente_datos: 'Sistema de Títulos',
      metodo_verificacion: 'Reporte mensual del sistema',
      meta: '<= 20 días',
      frecuencia: 'Mensual',
    },
    {
      denominacion: 'Porcentaje de diplomas reimpresos por error (Demo)',
      descripcion: 'Mide la calidad de la preparación de diplomas.',
      formula: '(Diplomas reimpresos / Diplomas emitidos) x 100',
      unidad_medida: 'Porcentaje',
      fuente_datos: 'Registro de control de calidad de la División',
      metodo_verificacion: 'Conteo trimestral de reimpresiones',
      meta: '<= 2%',
      frecuencia: 'Trimestral',
    },
  ],
  normativas: [
    {
      codigo: 'EST-ORG-01',
      nombre: 'Estatuto Orgánico de la Universidad',
      descripcion: 'Norma institucional que define atribuciones de autoridades y unidades.',
      fecha_emision: '2015-03-10',
    },
    {
      codigo: 'REG-TIT-01',
      nombre: 'Reglamento de Títulos y Grados',
      descripcion: 'Establece requisitos y procedimientos para la emisión de diplomas y títulos.',
      fecha_emision: '2019-08-15',
    },
  ],
  sistemas: [{ nombre: 'Sistema de Títulos y Diplomas (Demo)', version: '3.1' }],
  equipos: [
    {
      nombre: 'Impresora de seguridad para diplomas (Demo)',
      descripcion: 'Impresora para papel de seguridad con hologramas.',
    },
    {
      nombre: 'Escáner documental - Archivo (Demo)',
      descripcion: 'Escáner para la digitalización de expedientes archivados.',
    },
  ],
};

const reclamos: ProcedimientoDemo = {
  proceso: {
    codigo: 'PROC-DEMO-03',
    nombre: 'Defensa de los Derechos Universitarios (Demo)',
    descripcion:
      'Proceso estratégico para la atención y resolución de reclamos de la comunidad universitaria.',
    tipo_proceso: 'Estratégico',
  },
  codigo: 'PRC-DEMO-003',
  nombre: 'Atención de reclamos de la comunidad universitaria',
  objetivos:
    'Atender y resolver los reclamos de estudiantes, docentes y administrativos de manera imparcial, fundamentada y dentro de plazos razonables.',
  alcance:
    'Inicia con la recepción del reclamo en la Defensoría y concluye con la notificación de la resolución y el archivo del caso. Aplica a toda la comunidad universitaria.',
  periodicidad: 'A demanda',
  version: '1.0',
  estado_version: 'Borrador',
  carriles: [
    {
      key: 'DEF',
      unidad: 'DEFENSORÍA DE LOS DERECHOS UNIVERSITARIOS',
      cargo: 'DEFENSOR/A UNIVERSITARIO',
    },
    {
      key: 'JUR',
      unidad: 'DEPARTAMENTO DE ASESORÍA JURÍDICA',
      cargo: 'JEFE DE DEPARTAMENTO',
    },
    {
      key: 'AUD',
      unidad: 'DEPARTAMENTO DE AUDITORIA INTERNA',
      cargo: 'JEFE DE DEPARTAMENTO',
    },
    {
      key: 'PJ',
      unidad: 'SECCIÓN DE PROCESOS JUDICIALES Y DEFENSA INSTITUCIONAL',
      cargo: 'JEFE DE SECCIÓN',
    },
    SECRETARIA_GENERAL,
    ARCHIVO,
  ],
  instalaciones: ['DEF', 'JUR'],
  pasos: [
    {
      carril: 'DEF',
      figura: 'circulo',
      actividad: 'Recepción del reclamo',
      tarea: 'Recibe el reclamo verbal o escrito del miembro de la comunidad universitaria.',
      textoFigura: 'Inicio: recibe reclamo',
      requisito: 'Reclamo escrito o declaración verbal',
      solicitante: 'Estudiante, docente o administrativo',
      referencia: {
        codigo: 'REG-DDU-01',
        nombre: 'Reglamento de la Defensoría de los Derechos Universitarios',
        tipo: 'Reglamento',
      },
      riesgo: {
        descripcion: 'Reclamo no registrado por falta de formalidad',
        nivel: 'Medio',
      },
      control: {
        descripcion: 'Registro obligatorio de todo reclamo recibido',
        tipo: 'Preventivo',
      },
      salida: 'Reclamo recibido',
      plazo: 0.5,
    },
    {
      carril: 'DEF',
      figura: 'paralelogramo',
      actividad: 'Registro del caso',
      tarea: 'Registra el reclamo y asigna un número de caso.',
      textoFigura: 'Registra reclamo y asigna número de caso',
      requisito: 'Reclamo recibido',
      solicitante: 'Reclamante',
      referencia: {
        codigo: 'FOR-DDU-02',
        nombre: 'Formulario de registro de reclamos',
        tipo: 'Formulario',
      },
      riesgo: {
        descripcion: 'Duplicidad de casos por el mismo hecho',
        nivel: 'Bajo',
      },
      control: {
        descripcion: 'Búsqueda de casos previos por reclamante y hecho',
        tipo: 'Detectivo',
      },
      salida: 'Formulario de registro de reclamo',
      plazo: 0.5,
    },
    {
      carril: 'DEF',
      figura: 'rombo',
      actividad: 'Análisis de competencia',
      tarea: 'Determina si el reclamo es de competencia de la Defensoría.',
      textoFigura: '¿Es competencia de la Defensoría?',
      requisito: 'Formulario de registro de reclamo',
      solicitante: 'Defensor/a universitario',
      referencia: {
        codigo: 'REG-DDU-01',
        nombre: 'Reglamento de la Defensoría de los Derechos Universitarios',
        tipo: 'Reglamento',
      },
      riesgo: {
        descripcion: 'Rechazo indebido de reclamos de competencia propia',
        nivel: 'Alto',
      },
      control: {
        descripcion: 'Criterios de competencia documentados en el reglamento',
        tipo: 'Preventivo',
      },
      salida: 'Decisión de admisión o derivación',
      plazo: 1,
      decision: {
        expresion: 'El hecho reclamado vulnera derechos universitarios',
        si: 5,
        no: 4,
      },
    },
    {
      carril: 'DEF',
      figura: 'paralelogramo',
      actividad: 'Derivación del reclamo',
      tarea: 'Deriva el reclamo a la instancia competente y notifica al reclamante.',
      textoFigura: 'Deriva a la instancia competente (ir a paso 11)',
      requisito: 'Decisión de derivación',
      solicitante: 'Defensor/a universitario',
      referencia: {
        codigo: 'FOR-DDU-03',
        nombre: 'Modelo de nota de derivación',
        tipo: 'Formulario',
      },
      riesgo: {
        descripcion: 'Derivación a una instancia equivocada',
        nivel: 'Medio',
      },
      control: {
        descripcion: 'Consulta del organigrama y del MOF vigente',
        tipo: 'Preventivo',
      },
      salida: 'Nota de derivación y notificación al reclamante',
      plazo: 1,
    },
    {
      carril: 'JUR',
      figura: 'rectangulo',
      actividad: 'Análisis legal',
      tarea: 'Analiza el reclamo y emite un informe legal preliminar.',
      textoFigura: 'Analiza y emite informe legal preliminar',
      requisito: 'Caso admitido con antecedentes',
      solicitante: 'Defensor/a universitario',
      referencia: {
        codigo: 'LEY-2341',
        nombre: 'Ley de Procedimiento Administrativo',
        tipo: 'Ley',
      },
      riesgo: {
        descripcion: 'Informe legal sin fundamento normativo suficiente',
        nivel: 'Alto',
      },
      control: {
        descripcion: 'Revisión del informe por un segundo abogado',
        tipo: 'Detectivo',
      },
      salida: 'Informe legal preliminar',
      plazo: 5,
    },
    {
      carril: 'JUR',
      figura: 'rombo',
      actividad: 'Determinación de inspección',
      tarea: 'Determina si el caso requiere una inspección o verificación de auditoría.',
      textoFigura: '¿Requiere inspección?',
      requisito: 'Informe legal preliminar',
      solicitante: 'Jefe del Departamento de Asesoría Jurídica',
      referencia: {
        codigo: 'GUIA-AUD-01',
        nombre: 'Guía de verificaciones especiales de auditoría',
        tipo: 'Guía',
      },
      riesgo: {
        descripcion: 'Omisión de verificación en casos que la requieren',
        nivel: 'Medio',
      },
      control: {
        descripcion: 'Criterios de derivación a auditoría en la guía',
        tipo: 'Preventivo',
      },
      salida: 'Solicitud de inspección o continuidad del caso',
      plazo: 0.5,
      decision: {
        expresion: 'El reclamo involucra manejo de recursos o documentos',
        si: 7,
        no: 8,
      },
    },
    {
      carril: 'AUD',
      figura: 'hexagono',
      actividad: 'Inspección especial',
      tarea: 'Realiza la inspección o verificación y emite un informe técnico.',
      textoFigura: 'Realiza inspección y emite informe técnico',
      requisito: 'Solicitud de inspección',
      solicitante: 'Jefe del Departamento de Asesoría Jurídica',
      referencia: {
        codigo: 'NAG-01',
        nombre: 'Normas de Auditoría Gubernamental',
        tipo: 'Norma',
      },
      riesgo: {
        descripcion: 'Conflicto de interés del auditor asignado',
        nivel: 'Alto',
      },
      control: {
        descripcion: 'Declaración de independencia del auditor',
        tipo: 'Preventivo',
      },
      salida: 'Informe técnico de inspección',
      plazo: 5,
    },
    {
      carril: 'PJ',
      figura: 'rectangulo',
      actividad: 'Proyecto de resolución',
      tarea: 'Consolida los antecedentes y elabora el proyecto de resolución.',
      textoFigura: 'Elabora proyecto de resolución',
      requisito: 'Informe legal preliminar e informe técnico (si corresponde)',
      solicitante: 'Jefe del Departamento de Asesoría Jurídica',
      referencia: {
        codigo: 'LEY-2341',
        nombre: 'Ley de Procedimiento Administrativo',
        tipo: 'Ley',
      },
      riesgo: {
        descripcion: 'Resolución que omite antecedentes relevantes',
        nivel: 'Medio',
      },
      control: {
        descripcion: 'Lista de antecedentes adjunta al proyecto',
        tipo: 'Detectivo',
      },
      salida: 'Proyecto de resolución',
      plazo: 3,
    },
    {
      carril: 'SG',
      figura: 'rectangulo',
      actividad: 'Emisión de la resolución',
      tarea: 'Revisa y firma la resolución del caso.',
      textoFigura: 'Firma la resolución',
      requisito: 'Proyecto de resolución',
      solicitante: 'Jefe de la Sección de Procesos Judiciales',
      referencia: {
        codigo: 'EST-ORG-01',
        nombre: 'Estatuto Orgánico de la Universidad',
        tipo: 'Estatuto',
      },
      riesgo: {
        descripcion: 'Firma de resolución fuera de plazo',
        nivel: 'Medio',
      },
      control: {
        descripcion: 'Control de plazos del caso en el sistema de correspondencia',
        tipo: 'Detectivo',
      },
      salida: 'Resolución firmada',
      plazo: 2,
    },
    {
      carril: 'DEF',
      figura: 'elipse',
      actividad: 'Notificación de la resolución',
      tarea: 'Notifica la resolución al reclamante y a las partes involucradas.',
      textoFigura: 'Notifica resolución a las partes',
      requisito: 'Resolución firmada',
      solicitante: 'Secretario/a General',
      referencia: {
        codigo: 'FOR-DDU-04',
        nombre: 'Formulario de notificación',
        tipo: 'Formulario',
      },
      riesgo: {
        descripcion: 'Notificación no recibida por alguna de las partes',
        nivel: 'Medio',
      },
      control: {
        descripcion: 'Constancia de notificación firmada por cada parte',
        tipo: 'Detectivo',
      },
      salida: 'Constancias de notificación',
      plazo: 1,
    },
    {
      carril: 'ARCH',
      figura: 'triangulo',
      actividad: 'Archivo del caso',
      tarea: 'Archiva el expediente del caso.',
      textoFigura: 'Archiva expediente del caso',
      requisito: 'Expediente del caso concluido',
      solicitante: 'Defensor/a universitario',
      referencia: {
        codigo: 'MAN-ARC-01',
        nombre: 'Manual de gestión documental y archivo',
        tipo: 'Manual',
      },
      riesgo: {
        descripcion: 'Acceso no autorizado a expedientes confidenciales',
        nivel: 'Alto',
      },
      control: {
        descripcion: 'Archivo en sección reservada con registro de consultas',
        tipo: 'Preventivo',
      },
      salida: 'Expediente archivado',
      plazo: 1,
    },
    {
      carril: 'ARCH',
      figura: 'circulo',
      actividad: 'Conclusión del procedimiento',
      tarea: 'Da por concluido el procedimiento.',
      textoFigura: 'Fin',
      requisito: 'Expediente archivado',
      solicitante: 'Jefe de la División de Documentos y Archivo',
      referencia: {
        codigo: 'MAN-ARC-01',
        nombre: 'Manual de gestión documental y archivo',
        tipo: 'Manual',
      },
      riesgo: {
        descripcion: 'Caso no cerrado en el registro de la Defensoría',
        nivel: 'Bajo',
      },
      control: {
        descripcion: 'Cierre del caso en el registro de la Defensoría',
        tipo: 'Detectivo',
      },
      salida: 'Caso concluido',
      plazo: 0,
    },
  ],
  indicadores: [
    {
      denominacion: 'Porcentaje de reclamos resueltos en plazo (Demo)',
      descripcion: 'Mide la oportunidad en la atención de reclamos admitidos.',
      formula: '(Reclamos resueltos en 30 días / Reclamos admitidos) x 100',
      unidad_medida: 'Porcentaje',
      fuente_datos: 'Registro de casos de la Defensoría',
      metodo_verificacion: 'Reporte semestral del registro de casos',
      meta: '>= 85%',
      frecuencia: 'Semestral',
    },
    {
      denominacion: 'Número de reclamos recibidos (Demo)',
      descripcion: 'Mide la demanda de atención de la Defensoría.',
      formula: 'Conteo de reclamos registrados en el periodo',
      unidad_medida: 'Reclamos',
      fuente_datos: 'Formularios de registro de reclamos',
      metodo_verificacion: 'Conteo mensual del registro',
      meta: 'Seguimiento (sin meta fija)',
      frecuencia: 'Mensual',
    },
  ],
  normativas: [
    {
      codigo: 'LEY-2341',
      nombre: 'Ley N° 2341 de Procedimiento Administrativo',
      descripcion: 'Regula la actividad administrativa y el procedimiento administrativo.',
      fecha_emision: '2002-04-23',
    },
    {
      codigo: 'REG-DDU-01',
      nombre: 'Reglamento de la Defensoría de los Derechos Universitarios',
      descripcion: 'Define la competencia y el procedimiento de atención de reclamos.',
      fecha_emision: '2018-05-02',
    },
  ],
  sistemas: [
    { nombre: 'Sistema de Correspondencia y Hoja de Ruta (Demo)', version: '4.0' },
    { nombre: 'Registro Digital de Casos de la Defensoría (Demo)', version: '1.2' },
  ],
  equipos: [
    {
      nombre: 'Computadora portátil - Defensoría (Demo)',
      descripcion: 'Equipo para el registro de reclamos en atención presencial.',
    },
    {
      nombre: 'Grabadora de audio - Entrevistas (Demo)',
      descripcion: 'Equipo para el registro de declaraciones verbales con consentimiento.',
    },
  ],
};

export const PROCEDIMIENTOS_DEMO: ProcedimientoDemo[] = [
  compraBienes,
  diplomaAcademico,
  reclamos,
];
