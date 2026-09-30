export const FORMAS_SOPORTADAS = [
  {
    codigo: 'circulo',
    nombre: 'Círculo',
    icon: 'mdi-circle',
    color: 'success',
    colorHex: '#6ee7b7',
  },
  {
    codigo: 'rectangulo',
    nombre: 'Rectángulo',
    icon: 'mdi-rectangle',
    color: 'indigo',
    colorHex: '#818cf8',
  },
  {
    codigo: 'rombo',
    nombre: 'Rombo',
    icon: 'mdi-rhombus',
    color: 'amber',
    colorHex: '#fbbf24',
  },
  {
    codigo: 'elipse',
    nombre: 'Elipse',
    icon: 'mdi-ellipse',
    color: 'cyan',
    colorHex: '#67e8f9',
  },
  {
    codigo: 'paralelogramo',
    nombre: 'Paralelogramo',
    icon: 'mdi-rhombus-split',
    color: 'teal',
    colorHex: '#5eead4',
  },
  {
    codigo: 'triangulo',
    nombre: 'Triángulo',
    icon: 'mdi-triangle',
    color: 'pink',
    colorHex: '#f9a8d4',
  },
  {
    codigo: 'hexagono',
    nombre: 'Hexágono',
    icon: 'mdi-hexagon',
    color: 'deep-purple',
    colorHex: '#c4b5fd',
  },
];

const BY_CODIGO = Object.fromEntries(
  FORMAS_SOPORTADAS.map((f) => [f.codigo, f]),
);

/**
 * @param {string | null | undefined} codigo
 * @returns {{ icon: string, codigo: string, color: string, colorHex: string, nombre: string }}
 */
export function getFiguraVisuals(codigo) {
  const resolved =
    codigo && BY_CODIGO[codigo] ? codigo : 'rectangulo';
  const forma = BY_CODIGO[resolved] || BY_CODIGO.rectangulo;
  return {
    icon: forma.icon,
    codigo: resolved,
    color: forma.color,
    colorHex: forma.colorHex,
    nombre: forma.nombre,
  };
}
