export const FORMAS_SOPORTADAS = [
  { codigo: 'circulo', nombre: 'Círculo', icon: 'mdi-circle' },
  { codigo: 'rectangulo', nombre: 'Rectángulo', icon: 'mdi-rectangle' },
  { codigo: 'rombo', nombre: 'Rombo', icon: 'mdi-rhombus' },
  { codigo: 'elipse', nombre: 'Elipse', icon: 'mdi-ellipse' },
  { codigo: 'paralelogramo', nombre: 'Paralelogramo', icon: 'mdi-rhombus-split' },
  { codigo: 'triangulo', nombre: 'Triángulo', icon: 'mdi-triangle' },
  { codigo: 'hexagono', nombre: 'Hexágono', icon: 'mdi-hexagon' },
];

const ICON_BY_CODIGO = Object.fromEntries(
  FORMAS_SOPORTADAS.map((f) => [f.codigo, f.icon]),
);

/**
 * @param {string | null | undefined} codigo
 * @returns {{ icon: string, codigo: string }}
 */
export function getFiguraVisuals(codigo) {
  const resolved = codigo && ICON_BY_CODIGO[codigo] ? codigo : 'rectangulo';
  return {
    icon: ICON_BY_CODIGO[resolved] || 'mdi-rectangle',
    codigo: resolved,
  };
}
