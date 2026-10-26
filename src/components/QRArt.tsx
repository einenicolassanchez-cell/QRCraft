import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

import type { ModuleShape } from '../types';
import { createQrMatrix } from '../utils/qrSvg';

export interface QRArtHandle {
  toBase64: (options?: { width?: number; height?: number }) => Promise<string>;
}

interface QRArtProps {
  value: string;
  color: string;
  backgroundColor: string;
  shape: ModuleShape;
  size: number;
  quietZone?: number;
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
  matrix: { size: number; data: boolean[] },
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

export const QRArt = forwardRef<QRArtHandle, QRArtProps>(function QRArt(
  { value, color, backgroundColor, shape, size, quietZone = 4 },
  ref,
) {
  const svgRef = useRef<React.ComponentRef<typeof Svg>>(null);
  const matrix = useMemo(() => createQrMatrix(value), [value]);
  const path = useMemo(
    () => (matrix ? buildPath(matrix, quietZone, shape) : ''),
    [matrix, quietZone, shape],
  );

  useImperativeHandle(
    ref,
    () => ({
      toBase64: (options) =>
        new Promise<string>((resolve, reject) => {
          const node = svgRef.current;
          if (!node || typeof node.toDataURL !== 'function') {
            reject(new Error('La exportación de imagen no está disponible.'));
            return;
          }
          try {
            node.toDataURL(
              (base64) => {
                if (base64) {
                  resolve(base64.replace(/^data:image\/\w+;base64,/, ''));
                } else {
                  reject(new Error('No se pudo generar la imagen.'));
                }
              },
              { width: size, height: size, ...options },
            );
          } catch (error) {
            reject(error);
          }
        }),
    }),
    [size],
  );

  if (!matrix) return null;

  const total = matrix.size + quietZone * 2;

  return (
    <Svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox={`0 0 ${total} ${total}`}
      accessibilityRole="image"
      accessibilityLabel="Código QR generado"
    >
      <Rect
        x={0}
        y={0}
        width={total}
        height={total}
        fill={backgroundColor}
      />
      <Path d={path} fill={color} />
    </Svg>
  );
});
