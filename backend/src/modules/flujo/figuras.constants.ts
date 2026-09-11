export const FORMAS_SOPORTADAS = [
  'circulo',
  'rectangulo',
  'rombo',
  'elipse',
  'paralelogramo',
  'triangulo',
  'hexagono',
] as const;

export type FormaSoportada = (typeof FORMAS_SOPORTADAS)[number];

export const CATALOGO_FIGURAS_OFICIALES: ReadonlyArray<{
  nombre: string;
  codigo: FormaSoportada;
}> = [
  { nombre: 'Círculo', codigo: 'circulo' },
  { nombre: 'Rectángulo', codigo: 'rectangulo' },
  { nombre: 'Rombo', codigo: 'rombo' },
  { nombre: 'Elipse', codigo: 'elipse' },
  { nombre: 'Paralelogramo', codigo: 'paralelogramo' },
  { nombre: 'Triángulo', codigo: 'triangulo' },
  { nombre: 'Hexágono', codigo: 'hexagono' },
];

export function esFormaSoportada(codigo: string): codigo is FormaSoportada {
  return (FORMAS_SOPORTADAS as readonly string[]).includes(codigo);
}
