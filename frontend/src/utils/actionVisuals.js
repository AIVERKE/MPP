import { getFiguraVisuals } from '@/utils/figuras';

/** Paleta suave y única por verbo (legible con texto blanco en el flujo). */
const ACCION_PALETTE = [
  { match: ['inicio', 'empezar', 'comenzar', 'start'], color: 'success', colorHex: '#34d399' },
  { match: ['fin', 'terminar', 'concluir', 'archivar', 'end'], color: 'error', colorHex: '#f87171' },
  { match: ['notificar'], color: 'deep-purple', colorHex: '#a78bfa' },
  { match: ['enviar'], color: 'indigo', colorHex: '#818cf8' },
  { match: ['recibir'], color: 'cyan', colorHex: '#22d3ee' },
  { match: ['aprob'], color: 'teal', colorHex: '#2dd4bf' },
  { match: ['revisar'], color: 'amber', colorHex: '#fbbf24' },
  { match: ['analiz'], color: 'orange', colorHex: '#fb923c' },
  { match: ['verificar', 'validar'], color: 'blue', colorHex: '#60a5fa' },
  { match: ['registrar'], color: 'violet', colorHex: '#c084fc' },
  { match: ['ejecutar'], color: 'blue-grey', colorHex: '#94a3b8' },
  { match: ['control'], color: 'pink', colorHex: '#f472b6' },
  { match: ['decisión', 'decid'], color: 'amber-darken-2', colorHex: '#f59e0b' },
];

const FALLBACK_HEX = [
  '#818cf8',
  '#38bdf8',
  '#2dd4bf',
  '#a3e635',
  '#fbbf24',
  '#fb923c',
  '#f87171',
  '#f472b6',
  '#c084fc',
  '#94a3b8',
];

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * @param {{ id_accion?: number, nombre_accion?: string, figura?: { codigo?: string } } | null | undefined} accion
 * @returns {{ icon: string, color: string, colorHex: string, codigoFigura: string }}
 */
export function getActionVisualsFromAccion(accion) {
  if (!accion || !accion.figura) {
    return {
      icon: 'mdi-checkbox-blank-circle',
      color: 'primary',
      colorHex: '#6366f1',
      codigoFigura: 'rectangulo',
    };
  }

  const figura = getFiguraVisuals(accion.figura.codigo);
  const { icon, codigo: codigoFigura } = figura;
  const nombreAccion = (accion.nombre_accion || '').toLowerCase().trim();

  for (const entry of ACCION_PALETTE) {
    if (entry.match.some((token) => nombreAccion.includes(token))) {
      return { icon, color: entry.color, colorHex: entry.colorHex, codigoFigura };
    }
  }

  if (figura.colorHex) {
    return {
      icon,
      color: figura.color,
      colorHex: figura.colorHex,
      codigoFigura,
    };
  }

  const idx = hashString(nombreAccion || String(accion.id_accion || 0)) % FALLBACK_HEX.length;
  return {
    icon,
    color: 'primary',
    colorHex: FALLBACK_HEX[idx],
    codigoFigura,
  };
}

/**
 * @param {Array<{ id_accion: number, nombre_accion?: string, figura?: { codigo?: string } }>} acciones
 * @param {number | string | null | undefined} accionId
 */
export function resolveActionVisuals(acciones, accionId) {
  const id = Number(accionId);
  const accion = (acciones || []).find((a) => Number(a.id_accion) === id);
  return getActionVisualsFromAccion(accion);
}
