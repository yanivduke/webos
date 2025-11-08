/**
 * Paint Tools - Advanced drawing algorithms and utilities
 * Inspired by Deluxe Paint for Amiga
 */

export interface Point {
  x: number;
  y: number;
}

export interface BrushShape {
  type: 'circle' | 'square' | 'custom';
  size: number;
  pattern?: boolean[][];
}

/**
 * Bresenham's Line Algorithm - Efficient line drawing
 */
export function bresenhamLine(x0: number, y0: number, x1: number, y1: number): Point[] {
  const points: Point[] = [];

  x0 = Math.floor(x0);
  y0 = Math.floor(y0);
  x1 = Math.floor(x1);
  y1 = Math.floor(y1);

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let x = x0;
  let y = y0;

  while (true) {
    points.push({ x, y });

    if (x === x1 && y === y1) break;

    const e2 = 2 * err;

    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }

    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }

  return points;
}

/**
 * Midpoint Circle Algorithm - Efficient circle drawing
 */
export function midpointCircle(centerX: number, centerY: number, radius: number): Point[] {
  const points: Point[] = [];

  centerX = Math.floor(centerX);
  centerY = Math.floor(centerY);
  radius = Math.floor(radius);

  let x = 0;
  let y = radius;
  let d = 1 - radius;

  const addOctants = (cx: number, cy: number, x: number, y: number) => {
    points.push({ x: cx + x, y: cy + y });
    points.push({ x: cx - x, y: cy + y });
    points.push({ x: cx + x, y: cy - y });
    points.push({ x: cx - x, y: cy - y });
    points.push({ x: cx + y, y: cy + x });
    points.push({ x: cx - y, y: cy + x });
    points.push({ x: cx + y, y: cy - x });
    points.push({ x: cx - y, y: cy - x });
  };

  addOctants(centerX, centerY, x, y);

  while (x < y) {
    x++;

    if (d < 0) {
      d += 2 * x + 1;
    } else {
      y--;
      d += 2 * (x - y) + 1;
    }

    addOctants(centerX, centerY, x, y);
  }

  return points;
}

/**
 * Filled Circle - Scanline algorithm
 */
export function filledCircle(centerX: number, centerY: number, radius: number): Point[] {
  const points: Point[] = [];

  centerX = Math.floor(centerX);
  centerY = Math.floor(centerY);
  radius = Math.floor(radius);

  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      if (x * x + y * y <= radius * radius) {
        points.push({ x: centerX + x, y: centerY + y });
      }
    }
  }

  return points;
}

/**
 * Rectangle outline
 */
export function rectangleOutline(x: number, y: number, width: number, height: number, lineWidth: number = 1): Point[] {
  const points: Point[] = [];

  // Top edge
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < lineWidth; j++) {
      points.push({ x: x + i, y: y + j });
    }
  }

  // Bottom edge
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < lineWidth; j++) {
      points.push({ x: x + i, y: y + height - lineWidth + j });
    }
  }

  // Left edge
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < lineWidth; j++) {
      points.push({ x: x + j, y: y + i });
    }
  }

  // Right edge
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < lineWidth; j++) {
      points.push({ x: x + width - lineWidth + j, y: y + i });
    }
  }

  return points;
}

/**
 * Filled Rectangle
 */
export function filledRectangle(x: number, y: number, width: number, height: number): Point[] {
  const points: Point[] = [];

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      points.push({ x: x + j, y: y + i });
    }
  }

  return points;
}

/**
 * Ellipse using Bresenham's algorithm
 */
export function ellipse(centerX: number, centerY: number, radiusX: number, radiusY: number): Point[] {
  const points: Point[] = [];

  centerX = Math.floor(centerX);
  centerY = Math.floor(centerY);
  radiusX = Math.floor(radiusX);
  radiusY = Math.floor(radiusY);

  let x = 0;
  let y = radiusY;

  let rx2 = radiusX * radiusX;
  let ry2 = radiusY * radiusY;
  let twoRx2 = 2 * rx2;
  let twoRy2 = 2 * ry2;

  let p;
  let px = 0;
  let py = twoRx2 * y;

  const addPoints = (cx: number, cy: number, x: number, y: number) => {
    points.push({ x: cx + x, y: cy + y });
    points.push({ x: cx - x, y: cy + y });
    points.push({ x: cx + x, y: cy - y });
    points.push({ x: cx - x, y: cy - y });
  };

  // Region 1
  addPoints(centerX, centerY, x, y);
  p = Math.round(ry2 - (rx2 * radiusY) + (0.25 * rx2));

  while (px < py) {
    x++;
    px += twoRy2;

    if (p < 0) {
      p += ry2 + px;
    } else {
      y--;
      py -= twoRx2;
      p += ry2 + px - py;
    }

    addPoints(centerX, centerY, x, y);
  }

  // Region 2
  p = Math.round(ry2 * (x + 0.5) * (x + 0.5) + rx2 * (y - 1) * (y - 1) - rx2 * ry2);

  while (y > 0) {
    y--;
    py -= twoRx2;

    if (p > 0) {
      p += rx2 - py;
    } else {
      x++;
      px += twoRy2;
      p += rx2 - py + px;
    }

    addPoints(centerX, centerY, x, y);
  }

  return points;
}

/**
 * Filled Ellipse
 */
export function filledEllipse(centerX: number, centerY: number, radiusX: number, radiusY: number): Point[] {
  const points: Point[] = [];

  centerX = Math.floor(centerX);
  centerY = Math.floor(centerY);
  radiusX = Math.floor(radiusX);
  radiusY = Math.floor(radiusY);

  for (let y = -radiusY; y <= radiusY; y++) {
    for (let x = -radiusX; x <= radiusX; x++) {
      if ((x * x) / (radiusX * radiusX) + (y * y) / (radiusY * radiusY) <= 1) {
        points.push({ x: centerX + x, y: centerY + y });
      }
    }
  }

  return points;
}

/**
 * Spray Paint Effect - Random distribution
 */
export function sprayPaint(centerX: number, centerY: number, radius: number, density: number = 0.5): Point[] {
  const points: Point[] = [];
  const area = Math.PI * radius * radius;
  const numPoints = Math.floor(area * density);

  for (let i = 0; i < numPoints; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    const x = Math.floor(centerX + Math.cos(angle) * distance);
    const y = Math.floor(centerY + Math.sin(angle) * distance);
    points.push({ x, y });
  }

  return points;
}

/**
 * Gradient calculation - Linear
 */
export function linearGradient(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color1: string,
  color2: string,
  steps: number
): Array<{ x: number; y: number; color: string }> {
  const result: Array<{ x: number; y: number; color: string }> = [];

  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return result;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;

    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);

    result.push({ x, y, color: rgbToHex(r, g, b) });
  }

  return result;
}

/**
 * Radial Gradient
 */
export function radialGradient(
  centerX: number,
  centerY: number,
  radius: number,
  color1: string,
  color2: string
): Array<{ x: number; y: number; color: string }> {
  const result: Array<{ x: number; y: number; color: string }> = [];

  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return result;

  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      const distance = Math.sqrt(x * x + y * y);
      if (distance <= radius) {
        const t = distance / radius;
        const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
        const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
        const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);

        result.push({
          x: centerX + x,
          y: centerY + y,
          color: rgbToHex(r, g, b)
        });
      }
    }
  }

  return result;
}

/**
 * Brush patterns
 */
export const BrushPatterns = {
  circle: (size: number): boolean[][] => {
    const pattern: boolean[][] = [];
    const center = Math.floor(size / 2);
    const radius = size / 2;

    for (let y = 0; y < size; y++) {
      pattern[y] = [];
      for (let x = 0; x < size; x++) {
        const dx = x - center;
        const dy = y - center;
        pattern[y][x] = (dx * dx + dy * dy) <= (radius * radius);
      }
    }

    return pattern;
  },

  square: (size: number): boolean[][] => {
    const pattern: boolean[][] = [];
    for (let y = 0; y < size; y++) {
      pattern[y] = [];
      for (let x = 0; x < size; x++) {
        pattern[y][x] = true;
      }
    }
    return pattern;
  },

  diamond: (size: number): boolean[][] => {
    const pattern: boolean[][] = [];
    const center = Math.floor(size / 2);

    for (let y = 0; y < size; y++) {
      pattern[y] = [];
      for (let x = 0; x < size; x++) {
        const dx = Math.abs(x - center);
        const dy = Math.abs(y - center);
        pattern[y][x] = (dx + dy) <= center;
      }
    }

    return pattern;
  },

  star: (size: number): boolean[][] => {
    const pattern: boolean[][] = [];
    const center = Math.floor(size / 2);

    for (let y = 0; y < size; y++) {
      pattern[y] = [];
      for (let x = 0; x < size; x++) {
        const dx = x - center;
        const dy = y - center;
        const angle = Math.atan2(dy, dx);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const points = 5;
        const radius = size / 2;
        const innerRadius = radius / 2;

        let currentRadius = radius;
        for (let i = 0; i < points * 2; i++) {
          const a = (i * Math.PI) / points;
          if (Math.abs(angle - a) < Math.PI / points / 2) {
            currentRadius = i % 2 === 0 ? radius : innerRadius;
            break;
          }
        }

        pattern[y][x] = distance <= currentRadius;
      }
    }

    return pattern;
  },

  cross: (size: number): boolean[][] => {
    const pattern: boolean[][] = [];
    const center = Math.floor(size / 2);
    const thickness = Math.max(1, Math.floor(size / 5));

    for (let y = 0; y < size; y++) {
      pattern[y] = [];
      for (let x = 0; x < size; x++) {
        const onVertical = Math.abs(x - center) < thickness;
        const onHorizontal = Math.abs(y - center) < thickness;
        pattern[y][x] = onVertical || onHorizontal;
      }
    }

    return pattern;
  }
};

/**
 * Dithering patterns for retro effects
 */
export const DitherPatterns = {
  bayer2x2: [
    [0, 2],
    [3, 1]
  ],

  bayer4x4: [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
  ],

  bayer8x8: [
    [0, 32, 8, 40, 2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21]
  ]
};

/**
 * Apply dithering to image data
 */
export function applyDithering(
  imageData: ImageData,
  pattern: number[][] = DitherPatterns.bayer4x4
): ImageData {
  const result = new ImageData(imageData.width, imageData.height);
  const patternSize = pattern.length;
  const threshold = (patternSize * patternSize) / 2;

  for (let y = 0; y < imageData.height; y++) {
    for (let x = 0; x < imageData.width; x++) {
      const index = (y * imageData.width + x) * 4;
      const patternValue = pattern[y % patternSize][x % patternSize];

      const gray = (imageData.data[index] + imageData.data[index + 1] + imageData.data[index + 2]) / 3;
      const value = gray > (patternValue / (patternSize * patternSize)) * 255 ? 255 : 0;

      result.data[index] = value;
      result.data[index + 1] = value;
      result.data[index + 2] = value;
      result.data[index + 3] = imageData.data[index + 3];
    }
  }

  return result;
}

/**
 * Color utilities
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = max === 0 ? 0 : delta / max;
  let v = max;

  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / delta + 2) / 6;
    } else {
      h = ((r - g) / delta + 4) / 6;
    }
  }

  return { h: h * 360, s: s * 100, v: v * 100 };
}

export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  h = h / 360;
  s = s / 100;
  v = v / 100;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r, g, b;

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
    default: r = 0; g = 0; b = 0;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Image effects
 */
export function adjustBrightness(imageData: ImageData, value: number): ImageData {
  const result = new ImageData(imageData.width, imageData.height);

  for (let i = 0; i < imageData.data.length; i += 4) {
    result.data[i] = Math.max(0, Math.min(255, imageData.data[i] + value));
    result.data[i + 1] = Math.max(0, Math.min(255, imageData.data[i + 1] + value));
    result.data[i + 2] = Math.max(0, Math.min(255, imageData.data[i + 2] + value));
    result.data[i + 3] = imageData.data[i + 3];
  }

  return result;
}

export function adjustContrast(imageData: ImageData, value: number): ImageData {
  const result = new ImageData(imageData.width, imageData.height);
  const factor = (259 * (value + 255)) / (255 * (259 - value));

  for (let i = 0; i < imageData.data.length; i += 4) {
    result.data[i] = Math.max(0, Math.min(255, factor * (imageData.data[i] - 128) + 128));
    result.data[i + 1] = Math.max(0, Math.min(255, factor * (imageData.data[i + 1] - 128) + 128));
    result.data[i + 2] = Math.max(0, Math.min(255, factor * (imageData.data[i + 2] - 128) + 128));
    result.data[i + 3] = imageData.data[i + 3];
  }

  return result;
}

export function invertColors(imageData: ImageData): ImageData {
  const result = new ImageData(imageData.width, imageData.height);

  for (let i = 0; i < imageData.data.length; i += 4) {
    result.data[i] = 255 - imageData.data[i];
    result.data[i + 1] = 255 - imageData.data[i + 1];
    result.data[i + 2] = 255 - imageData.data[i + 2];
    result.data[i + 3] = imageData.data[i + 3];
  }

  return result;
}

export function grayscale(imageData: ImageData): ImageData {
  const result = new ImageData(imageData.width, imageData.height);

  for (let i = 0; i < imageData.data.length; i += 4) {
    const gray = imageData.data[i] * 0.299 + imageData.data[i + 1] * 0.587 + imageData.data[i + 2] * 0.114;
    result.data[i] = gray;
    result.data[i + 1] = gray;
    result.data[i + 2] = gray;
    result.data[i + 3] = imageData.data[i + 3];
  }

  return result;
}

export function sepia(imageData: ImageData): ImageData {
  const result = new ImageData(imageData.width, imageData.height);

  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];

    result.data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
    result.data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
    result.data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
    result.data[i + 3] = imageData.data[i + 3];
  }

  return result;
}

export function pixelate(imageData: ImageData, blockSize: number): ImageData {
  const result = new ImageData(imageData.width, imageData.height);

  for (let y = 0; y < imageData.height; y += blockSize) {
    for (let x = 0; x < imageData.width; x += blockSize) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;

      // Calculate average color in block
      for (let by = 0; by < blockSize && y + by < imageData.height; by++) {
        for (let bx = 0; bx < blockSize && x + bx < imageData.width; bx++) {
          const i = ((y + by) * imageData.width + (x + bx)) * 4;
          r += imageData.data[i];
          g += imageData.data[i + 1];
          b += imageData.data[i + 2];
          a += imageData.data[i + 3];
          count++;
        }
      }

      r /= count;
      g /= count;
      b /= count;
      a /= count;

      // Fill block with average color
      for (let by = 0; by < blockSize && y + by < imageData.height; by++) {
        for (let bx = 0; bx < blockSize && x + bx < imageData.width; bx++) {
          const i = ((y + by) * imageData.width + (x + bx)) * 4;
          result.data[i] = r;
          result.data[i + 1] = g;
          result.data[i + 2] = b;
          result.data[i + 3] = a;
        }
      }
    }
  }

  return result;
}

export function blur(imageData: ImageData, radius: number = 1): ImageData {
  const result = new ImageData(imageData.width, imageData.height);
  const kernelSize = radius * 2 + 1;

  for (let y = 0; y < imageData.height; y++) {
    for (let x = 0; x < imageData.width; x++) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;

      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const px = x + kx;
          const py = y + ky;

          if (px >= 0 && px < imageData.width && py >= 0 && py < imageData.height) {
            const i = (py * imageData.width + px) * 4;
            r += imageData.data[i];
            g += imageData.data[i + 1];
            b += imageData.data[i + 2];
            a += imageData.data[i + 3];
            count++;
          }
        }
      }

      const i = (y * imageData.width + x) * 4;
      result.data[i] = r / count;
      result.data[i + 1] = g / count;
      result.data[i + 2] = b / count;
      result.data[i + 3] = a / count;
    }
  }

  return result;
}
