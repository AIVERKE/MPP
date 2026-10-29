/**
 * ==============================================================================
 * ARCHIVO MAESTRO DE DISEÑO (DESIGN SYSTEM MASTER) - PROYECTO MPP (TIC-FCPN)
 * ==============================================================================
 * Fuente única de la verdad para tokens, paleta institucional (Modo Claro y Oscuro),
 * modos de accesibilidad daltónica, tipografía Urbanist, botones M3 y defaults de Vuetify.
 * Homologado con el estándar oficial de TIC-FCPN / MOF.
 */

// 1. Tokens de Modo Claro (Light Mode) - Paleta Institucional
export const LIGHT_THEME_TOKENS = {
  // Capas de Profundidad
  canvas: '#EFF3EC', // Capa 0: Fondo general de pantalla (Marfil Suave armonizado)
  surface: '#FFFFFF', // Capa 1: Superficie general de tarjetas
  border: '#3C6893', // Borde perimetral (Azul Acero)
  borderRgba: 'rgba(60, 104, 147, 0.20)',

  // Navegación (Header y Sidebar)
  headerBg: '#E2EBE3', // Header institucional contrastado
  headerText: '#0C232B', // Texto y botones oscuros nítidos
  sidebarBg: '#E2EBE3', // Menú lateral
  sidebarText: '#1C3B4A', // Texto oscuro legible (sin plomos)
  sidebarTextActive: '#FFFFFF',
  sidebarActiveBg: '#028191', // Ítem activo en turquesa institucional
  sidebarAppendBg: '#D6E2D8', // Pie de perfil de usuario

  // Tablas Tonalizadas y Matriz de Procedimientos
  tableBg: '#F4F7F2', // Fondo acorde al tono canvas/marfil
  tableCardBg: '#F5F8F3', // Contenedor de tarjeta suave para tablas
  tableHeadBg: '#E1EBE0', // Cabecera de tabla con tono marfil-petróleo sutil
  tableRowBg: '#FAFDF8', // Fila uniforme suave
  tableHover: 'rgba(2, 129, 145, 0.12)', // Hover turquesa sutil
  tableBorder: 'rgba(60, 104, 147, 0.18)',

  // Colores Institucionales y de Acción
  petroleo: '#1A4756', // Azul Petróleo (Títulos, navegación, botones estándar)
  turquesa: '#028191', // Turquesa (Interacción, foco, enlaces, tabs activas)
  marfil: '#E4F1DD', // Marfil / Crema suave
  acero: '#3C6893', // Azul Acero (Subtítulos, bordes, cancelar)
  coral: '#F04D65', // Coral (CTA Principal: Guardar / Crear / Badges de conteo)

  // Feedback y Estados
  rojo: '#D93852', // Rojo Sobrio (Peligro, eliminar, errores críticos)
  verde: '#2E8B57', // Verde Esmeralda (Éxito, activo, switches habilitados)
  ambar: '#E69F00', // Ámbar (Advertencias, pendientes)
  ambarBg: '#FFF3E0', // Fondo ámbar suave para chips
  ambarText: '#B45309', // Texto ámbar oscuro legible

  // Tipografía de Alto Contraste (Cero Plomo)
  titleColor: '#0C232B', // Títulos en petróleo ultra profundo
  subtitleColor: '#153B4D', // Subtítulos nítidos de alto contraste
  textMain: '#0B1920', // Slate negro profundo (Cuerpo de texto, lectura nítida)
  textMuted: '#1C3B4A', // Petróleo oscuro legible (Adiós plomo/gris lavado)
  placeholder: '#5A7584', // Placeholder legible
  gridline: 'rgba(60, 104, 147, 0.16)', // Cuadrícula armónica para diagramas
};

// 2. Tokens de Modo Oscuro Institucional (Dark Mode - Petróleo Noche)
export const DARK_THEME_TOKENS = {
  // Capas de Profundidad
  canvas: '#0A1920', // Capa 0: Pizarra Petróleo Profundo (descanso visual nocturno)
  surface: '#132630', // Capa 1: Superficie elevada de tarjetas en petróleo noche
  border: '#5C8BB8', // Borde perimetral nocturno
  borderRgba: 'rgba(112, 153, 194, 0.25)',

  // Navegación Nocturna
  headerBg: '#08151B',
  headerText: '#FFFFFF',
  sidebarBg: '#061217',
  sidebarText: '#CBD5E1',
  sidebarTextActive: '#FFFFFF',
  sidebarActiveBg: '#028191',
  sidebarAppendBg: '#040C10',

  // Tablas Nocturnas y Matriz
  tableBg: '#0F212A',
  tableCardBg: '#132630',
  tableHeadBg: 'rgba(30, 56, 69, 0.95)',
  tableRowBg: '#11242E',
  tableRowEven: '#0E1D25',
  tableHover: 'rgba(2, 129, 145, 0.22)',
  tableBorder: 'rgba(112, 153, 194, 0.22)',

  // Colores Institucionales y de Acción Nocturnos
  petroleo: '#3BA3B8', // Versión luminosa del azul petróleo
  turquesa: '#00BCD4', // Turquesa brillante accesible
  marfil: 'rgba(228, 241, 221, 0.12)', // Tint marfil sutil para hovers
  acero: '#82A7CD', // Azul Acero luminoso para subtítulos
  coral: '#F45D74', // Coral vibrante M3 para CTA nocturno

  // Feedback y Estados
  rojo: '#F87171', // Rojo legible sobre oscuro
  verde: '#34D399', // Verde esmeralda luminoso
  ambar: '#FBBF24', // Ámbar accesible
  ambarBg: 'rgba(245, 158, 11, 0.15)',
  ambarText: '#FCD34D',

  // Tipografía y Neutrales
  titleColor: '#E4F1DD', // Marfil ilumina los títulos nocturnos con calidez
  subtitleColor: '#A5C4E5',
  textMain: '#F8FAFC',
  textMuted: '#CBD5E1',
  placeholder: '#94A3B8',
  gridline: '#1E3845',
};

// Alias por defecto
export const THEME_COLORS = LIGHT_THEME_TOKENS;

// 3. Secuencia Estricta de 5 Colores para Gráficos
export const SERIES_COLORS = [
  '#1A4756', // Serie 1 (Categoría Principal)
  '#028191', // Serie 2 (Segunda categoría / Comparativa)
  '#F04D65', // Serie 3 (Categoría destacada, alerta o meta)
  '#3C6893', // Serie 4 (Categoría complementaria / Histórico)
  '#2E8B57', // Serie 5 (Categoría exitosa / Aprobados)
];

// 4. Defaults Globales para Vuetify 3 (Material Design 3)
export const vuetifyDefaults = {
  VCard: {
    elevation: 0,
    rounded: 'xl', // Radio de 16px para tarjetas
    color: 'surface',
  },
  VBtn: {
    rounded: 'lg', // Bordes redondeados M3
    elevation: 0,
  },
  VTextField: {
    variant: 'outlined',
    density: 'comfortable',
    color: 'accent', // Foco en turquesa
  },
  VSelect: {
    variant: 'outlined',
    density: 'comfortable',
    color: 'accent',
  },
  VAutocomplete: {
    variant: 'outlined',
    density: 'comfortable',
    color: 'accent',
  },
  VTooltip: {
    color: '#1A4756', // Tooltip oscuro petróleo
  },
  VProgressLinear: {
    color: 'accent',
    rounded: true,
  },
  VProgressCircular: {
    color: 'primary',
  },
};
