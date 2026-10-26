import QRCode from 'qrcode';

import type { ModuleShape } from '../types';

export interface QrMatrix {
  size: number;
  /** Row-major matrix; false means an empty (light) module. */
  data: boolean[];
}

export function createQrMatrix(value: string): QrMatrix | null {
  if (!value) return null;
  try {
    const code = QRCode.create(value, { errorCorrectionLevel: 'H' });
    const size = code.modules.size;
    const data: boolean[] = [];
    for (let row = 0; row < size; row += 1) {
      for (let column = 0; column < size; column += 1) {
        data.push(Boolean(code.modules.get(row, column)));
      }
    }
    return { size, data };
  } catch {
    return null;
  }
}

function circlePath(cx: number, cy: number, radius: number) {
  return `M${cx} ${cy - radius}a${radius} ${radius} 0 1 0 0 ${radius * 2}a${radius} ${radius} 0 1 0 0 ${-radius * 2}`;
}

function roundedPath(x: number, y: number, side: number, radius: number) {
  const end = x + side;
  const bottom = y + side;
  return [
    `M${x + radius} ${y}`,
    `H${end - radius}`,
    `A${radius} ${radius} 0 0 1 ${end} ${y + radius}`,
    `V${bottom - radius}`,
    `A${radius} ${radius} 0 0 1 ${end - radius} ${bottom}`,
    `H${x + radius}`,
    `A${radius} ${radius} 0 0 1 ${x} ${bottom - radius}`,
    `V${y + radius}`,
    `A${radius} ${radius} 0 0 1 ${x + radius} ${y}`,
    'Z',
  ].join('');
}

function buildPath(
  matrix: QrMatrix,
  margin: number,
  shape: ModuleShape,
) {
  const segments: string[] = [];
  for (let row = 0; row < matrix.size; row += 1) {
    for (let column = 0; column < matrix.size; column += 1) {
      if (!matrix.data[row * matrix.size + column]) continue;
      const x = column + margin;
      const y = row + margin;
      if (shape === 'dots') {
        segments.push(circlePath(x + 0.5, y + 0.5, 0.46));
      } else if (shape === 'rounded') {
        segments.push(roundedPath(x + 0.04, y + 0.04, 0.92, 0.3));
      } else {
        segments.push(`M${x} ${y}h1v1h-1z`);
      }
    }
  }
  return segments.join('');
}

interface SvgOptions {
  value: string;
  color: string;
  backgroundColor: string;
  shape: ModuleShape;
  size?: number;
  margin?: number;
}

export function buildQrSvg({
  value,
  color,
  backgroundColor,
  shape,
  size = 1024,
  margin = 4,
}: SvgOptions): string | null {
  const matrix = createQrMatrix(value);
  if (!matrix) return null;

  const total = matrix.size + margin * 2;
  const path = buildPath(matrix, margin, shape);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${total} ${total}"${shape === 'square' ? ' shape-rendering="crispEdges"' : ''}>`,
    `<rect width="${total}" height="${total}" fill="${backgroundColor}"/>`,
    `<path d="${path}" fill="${color}"/>`,
    '</svg>',
  ].join('\n');
}
