/**
 * Anclas y rutas ortogonales para el diagrama de flujo MPP.
 * Las formas usan getBoundingClientRect (AABB); el rombo rotado
 * tiene vértices en los centros de los lados del AABB.
 */

/** Separación mínima para que la punta del marker repose en el borde, no dentro. */
const TIP_GAP = 2;

/**
 * @param {{ cx: number, cy: number, w: number, h: number, shape?: string }} point
 * @param {'top' | 'bottom' | 'left' | 'right'} side
 * @returns {{ x: number, y: number }}
 */
export function getShapeAnchor(point, side) {
  const shape = point.shape || 'rectangulo';
  const { cx, cy, w, h } = point;
  const inset = 1.5;
  const rx = Math.max(4, w / 2 - inset);
  const ry = Math.max(4, h / 2 - inset);

  if (shape === 'triangulo') {
    if (side === 'top') return { x: cx, y: cy - ry };
    if (side === 'bottom') return { x: cx, y: cy + ry };
    if (side === 'left') return { x: cx - rx * 0.55, y: cy + ry * 0.25 };
    return { x: cx + rx * 0.55, y: cy + ry * 0.25 };
  }

  if (shape === 'paralelogramo') {
    const skew = w * 0.18;
    if (side === 'top') return { x: cx + skew * 0.35, y: cy - ry };
    if (side === 'bottom') return { x: cx - skew * 0.35, y: cy + ry };
    if (side === 'left') return { x: cx - rx + skew * 0.5, y: cy };
    return { x: cx + rx - skew * 0.5, y: cy };
  }

  if (shape === 'hexagono') {
    if (side === 'top') return { x: cx, y: cy - ry };
    if (side === 'bottom') return { x: cx, y: cy + ry };
    if (side === 'left') return { x: cx - rx * 0.92, y: cy };
    return { x: cx + rx * 0.92, y: cy };
  }

  // rectangulo, rombo, circulo, elipse: centros de lados del AABB
  if (side === 'top') return { x: cx, y: cy - ry };
  if (side === 'bottom') return { x: cx, y: cy + ry };
  if (side === 'left') return { x: cx - rx, y: cy };
  return { x: cx + rx, y: cy };
}

/**
 * Acorta el extremo del segmento para que la punta del marker
 * quede sobre el borde de la figura (no dentro).
 */
function shortenEnd(fromX, fromY, toX, toY, gap = TIP_GAP) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.hypot(dx, dy);
  if (len < gap + 1) return { x: toX, y: toY };
  const ratio = (len - gap) / len;
  return { x: fromX + dx * ratio, y: fromY + dy * ratio };
}

/**
 * @param {{ cx: number, cy: number, w: number, h: number, shape?: string }} start
 * @param {{ cx: number, cy: number, w: number, h: number, shape?: string }} end
 * @param {{ type?: 'sequential' | 'return' | 'if' | 'else', isEditor?: boolean }} options
 */
export function buildOrthogonalPath(start, end, options = {}) {
  const { type = 'sequential', isEditor = false } = options;
  const prefix = isEditor ? 'editor-' : '';

  let color = '#4f46e5';
  let markerEnd = `url(#${prefix}arrow)`;
  let isReturn = false;

  if (type === 'return') {
    color = '#ef4444';
    markerEnd = `url(#${prefix}arrow-return)`;
    isReturn = true;
  } else if (type === 'if') {
    color = '#16a34a';
    markerEnd = `url(#${prefix}arrow-if)`;
  } else if (type === 'else') {
    color = '#dc2626';
    markerEnd = `url(#${prefix}arrow-else)`;
  }

  if (type === 'return') {
    const a = getShapeAnchor(start, 'right');
    const b = getShapeAnchor(end, 'right');
    const xRight = Math.max(a.x, b.x) + 40;
    const tip = shortenEnd(xRight, b.y, b.x, b.y);
    const path = `M ${a.x} ${a.y} L ${xRight} ${a.y} L ${xRight} ${b.y} L ${tip.x} ${tip.y}`;
    return { path, color, isReturn, markerEnd };
  }

  if (type === 'if' || type === 'else') {
    const sideOut = type === 'if' ? 'left' : 'right';
    const a = getShapeAnchor(start, sideOut);
    const b = getShapeAnchor(end, 'top');
    const sidePad = 28;
    const xDetour =
      type === 'if' ? Math.min(a.x, b.x) - sidePad : Math.max(a.x, b.x) + sidePad;
    // Último tramo siempre vertical hacia el borde superior
    const approachY = b.y - Math.max(14, TIP_GAP + 4);
    const tip = shortenEnd(b.x, approachY, b.x, b.y);
    const path =
      Math.abs(a.x - b.x) < 8
        ? `M ${a.x} ${a.y} L ${b.x} ${approachY} L ${tip.x} ${tip.y}`
        : `M ${a.x} ${a.y} L ${xDetour} ${a.y} L ${xDetour} ${approachY} L ${b.x} ${approachY} L ${tip.x} ${tip.y}`;
    return { path, color, isReturn, markerEnd };
  }

  // sequential: salida inferior → llegada superior, siempre con aproximación vertical
  const a = getShapeAnchor(start, 'bottom');
  const b = getShapeAnchor(end, 'top');
  const minDrop = 18;
  let yMid = a.y + Math.max(minDrop, (b.y - a.y) / 2);

  // Evitar que el tramo medio quede por debajo del destino (flecha "subiendo" al borde)
  if (yMid >= b.y - TIP_GAP - 4) {
    yMid = Math.min(a.y + minDrop, Math.max(a.y + 8, b.y - TIP_GAP - 10));
  }

  const tip = shortenEnd(b.x, yMid, b.x, b.y);
  let path = '';
  if (Math.abs(a.x - b.x) < 8) {
    path = `M ${a.x} ${a.y} L ${tip.x} ${tip.y}`;
  } else {
    path = `M ${a.x} ${a.y} L ${a.x} ${yMid} L ${b.x} ${yMid} L ${tip.x} ${tip.y}`;
  }

  return { path, color, isReturn, markerEnd };
}
