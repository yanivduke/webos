/**
 * Color Palettes - Retro computer color palettes
 * Includes Amiga, Commodore 64, CGA, EGA, and more
 */

export interface ColorPalette {
  name: string;
  colors: string[];
  description?: string;
}

/**
 * Amiga OCS - Original Chip Set (32 colors)
 */
export const AmigaOCS: ColorPalette = {
  name: 'Amiga OCS',
  description: 'Original Amiga chipset palette (32 colors)',
  colors: [
    '#000000', '#ffffff', '#888888', '#bbbbbb',
    '#cc0000', '#ee1111', '#cc7777', '#ee9999',
    '#cc6600', '#ee8811', '#ccaa77', '#eecc99',
    '#cccc00', '#eeee11', '#cccc77', '#eeee99',
    '#00cc00', '#11ee11', '#77cc77', '#99ee99',
    '#00cccc', '#11eeee', '#77cccc', '#99eeee',
    '#0055aa', '#0077dd', '#7799cc', '#99bbee',
    '#cc00cc', '#ee11ee', '#cc77cc', '#ee99ee'
  ]
};

/**
 * Amiga ECS - Enhanced Chip Set (64 colors)
 */
export const AmigaECS: ColorPalette = {
  name: 'Amiga ECS',
  description: 'Enhanced Amiga chipset palette (64 colors)',
  colors: [
    '#000000', '#111111', '#222222', '#333333', '#444444', '#555555', '#666666', '#777777',
    '#888888', '#999999', '#aaaaaa', '#bbbbbb', '#cccccc', '#dddddd', '#eeeeee', '#ffffff',
    '#880000', '#aa0000', '#cc0000', '#ee0000', '#ff2222', '#ff4444', '#ff6666', '#ff8888',
    '#884400', '#aa5500', '#cc6600', '#ee7700', '#ff8822', '#ffaa44', '#ffcc66', '#ffee88',
    '#888800', '#aaaa00', '#cccc00', '#eeee00', '#ffff22', '#ffff44', '#ffff66', '#ffff88',
    '#008800', '#00aa00', '#00cc00', '#00ee00', '#22ff22', '#44ff44', '#66ff66', '#88ff88',
    '#008888', '#00aaaa', '#00cccc', '#00eeee', '#22ffff', '#44ffff', '#66ffff', '#88ffff',
    '#000088', '#0000aa', '#0000cc', '#0000ee', '#2222ff', '#4444ff', '#6666ff', '#8888ff'
  ]
};

/**
 * Commodore 64 - Classic 16 color palette
 */
export const Commodore64: ColorPalette = {
  name: 'Commodore 64',
  description: 'Classic C64 16-color palette',
  colors: [
    '#000000', // Black
    '#ffffff', // White
    '#880000', // Red
    '#aaffee', // Cyan
    '#cc44cc', // Purple
    '#00cc55', // Green
    '#0000aa', // Blue
    '#eeee77', // Yellow
    '#dd8855', // Orange
    '#664400', // Brown
    '#ff7777', // Light Red
    '#333333', // Dark Grey
    '#777777', // Grey
    '#aaff66', // Light Green
    '#0088ff', // Light Blue
    '#bbbbbb'  // Light Grey
  ]
};

/**
 * CGA - Color Graphics Adapter (16 colors)
 */
export const CGA: ColorPalette = {
  name: 'CGA',
  description: 'IBM CGA 16-color palette',
  colors: [
    '#000000', '#0000aa', '#00aa00', '#00aaaa',
    '#aa0000', '#aa00aa', '#aa5500', '#aaaaaa',
    '#555555', '#5555ff', '#55ff55', '#55ffff',
    '#ff5555', '#ff55ff', '#ffff55', '#ffffff'
  ]
};

/**
 * CGA Palette 0 - High intensity (4 colors)
 */
export const CGAPalette0High: ColorPalette = {
  name: 'CGA Palette 0 High',
  description: 'CGA 4-color palette 0 (high intensity)',
  colors: ['#000000', '#55ffff', '#ff55ff', '#ffffff']
};

/**
 * CGA Palette 0 - Low intensity (4 colors)
 */
export const CGAPalette0Low: ColorPalette = {
  name: 'CGA Palette 0 Low',
  description: 'CGA 4-color palette 0 (low intensity)',
  colors: ['#000000', '#00aaaa', '#aa00aa', '#aaaaaa']
};

/**
 * CGA Palette 1 - High intensity (4 colors)
 */
export const CGAPalette1High: ColorPalette = {
  name: 'CGA Palette 1 High',
  description: 'CGA 4-color palette 1 (high intensity)',
  colors: ['#000000', '#55ff55', '#ff5555', '#ffff55']
};

/**
 * CGA Palette 1 - Low intensity (4 colors)
 */
export const CGAPalette1Low: ColorPalette = {
  name: 'CGA Palette 1 Low',
  description: 'CGA 4-color palette 1 (low intensity)',
  colors: ['#000000', '#00aa00', '#aa0000', '#aa5500']
};

/**
 * EGA - Enhanced Graphics Adapter (16 colors)
 */
export const EGA: ColorPalette = {
  name: 'EGA',
  description: 'IBM EGA 16-color palette',
  colors: [
    '#000000', '#0000aa', '#00aa00', '#00aaaa',
    '#aa0000', '#aa00aa', '#aa5500', '#aaaaaa',
    '#555555', '#5555ff', '#55ff55', '#55ffff',
    '#ff5555', '#ff55ff', '#ffff55', '#ffffff'
  ]
};

/**
 * VGA - Video Graphics Array (256 colors - showing representative 32)
 */
export const VGA: ColorPalette = {
  name: 'VGA',
  description: 'VGA representative colors',
  colors: [
    '#000000', '#0000aa', '#00aa00', '#00aaaa', '#aa0000', '#aa00aa', '#aa5500', '#aaaaaa',
    '#555555', '#5555ff', '#55ff55', '#55ffff', '#ff5555', '#ff55ff', '#ffff55', '#ffffff',
    '#000000', '#202020', '#404040', '#606060', '#808080', '#a0a0a0', '#c0c0c0', '#e0e0e0',
    '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff', '#000000'
  ]
};

/**
 * Apple II - 16 color palette
 */
export const AppleII: ColorPalette = {
  name: 'Apple II',
  description: 'Apple II 16-color palette',
  colors: [
    '#000000', '#dd0033', '#885500', '#ff6600', '#220099', '#555555', '#0099ff', '#66aaff',
    '#114411', '#88ee00', '#aaaaaa', '#ffaa88', '#ff1199', '#ffee66', '#99ffcc', '#ffffff'
  ]
};

/**
 * ZX Spectrum - 16 color palette
 */
export const ZXSpectrum: ColorPalette = {
  name: 'ZX Spectrum',
  description: 'Sinclair ZX Spectrum 16-color palette',
  colors: [
    '#000000', '#0000d7', '#d70000', '#d700d7', '#00d700', '#00d7d7', '#d7d700', '#d7d7d7',
    '#000000', '#0000ff', '#ff0000', '#ff00ff', '#00ff00', '#00ffff', '#ffff00', '#ffffff'
  ]
};

/**
 * MSX - 16 color palette
 */
export const MSX: ColorPalette = {
  name: 'MSX',
  description: 'MSX computer 16-color palette',
  colors: [
    '#000000', '#000000', '#3eb849', '#74d07d', '#5955e0', '#8076f1', '#b95e51', '#65dbef',
    '#db6559', '#ff897d', '#ccc35e', '#ded087', '#3aa241', '#b766b5', '#cccccc', '#ffffff'
  ]
};

/**
 * Gameboy - 4 shades of green
 */
export const Gameboy: ColorPalette = {
  name: 'Gameboy',
  description: 'Nintendo Gameboy 4-color palette',
  colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f']
};

/**
 * Gameboy Pocket - Grayscale
 */
export const GameboyPocket: ColorPalette = {
  name: 'Gameboy Pocket',
  description: 'Gameboy Pocket grayscale palette',
  colors: ['#000000', '#555555', '#aaaaaa', '#ffffff']
};

/**
 * NES - Nintendo Entertainment System (54 colors)
 */
export const NES: ColorPalette = {
  name: 'NES',
  description: 'Nintendo Entertainment System palette',
  colors: [
    '#7c7c7c', '#0000fc', '#0000bc', '#4428bc', '#940084', '#a80020', '#a81000', '#881400',
    '#503000', '#007800', '#006800', '#005800', '#004058', '#000000', '#000000', '#000000',
    '#bcbcbc', '#0078f8', '#0058f8', '#6844fc', '#d800cc', '#e40058', '#f83800', '#e45c10',
    '#ac7c00', '#00b800', '#00a800', '#00a844', '#008888', '#000000', '#000000', '#000000',
    '#f8f8f8', '#3cbcfc', '#6888fc', '#9878f8', '#f878f8', '#f85898', '#f87858', '#fca044',
    '#f8b800', '#b8f818', '#58d854', '#58f898', '#00e8d8', '#787878', '#000000', '#000000',
    '#fcfcfc', '#a4e4fc', '#b8b8f8', '#d8b8f8', '#f8b8f8', '#f8a4c0', '#f0d0b0', '#fce0a8',
    '#f8d878', '#d8f878', '#b8f8b8', '#b8f8d8', '#00fcfc', '#f8d8f8', '#000000', '#000000'
  ]
};

/**
 * PICO-8 - Fantasy console palette (16 colors)
 */
export const PICO8: ColorPalette = {
  name: 'PICO-8',
  description: 'PICO-8 fantasy console palette',
  colors: [
    '#000000', '#1d2b53', '#7e2553', '#008751', '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8',
    '#ff004d', '#ffa300', '#ffec27', '#00e436', '#29adff', '#83769c', '#ff77a8', '#ffccaa'
  ]
};

/**
 * Web Safe Colors (216 colors - showing representative 36)
 */
export const WebSafe: ColorPalette = {
  name: 'Web Safe',
  description: 'Web-safe 216 color palette (representative)',
  colors: [
    '#000000', '#000033', '#000066', '#000099', '#0000cc', '#0000ff',
    '#003300', '#003333', '#003366', '#003399', '#0033cc', '#0033ff',
    '#006600', '#006633', '#006666', '#006699', '#0066cc', '#0066ff',
    '#009900', '#009933', '#009966', '#009999', '#0099cc', '#0099ff',
    '#00cc00', '#00cc33', '#00cc66', '#00cc99', '#00cccc', '#00ccff',
    '#00ff00', '#00ff33', '#00ff66', '#00ff99', '#00ffcc', '#00ffff'
  ]
};

/**
 * Grayscale - 16 shades
 */
export const Grayscale16: ColorPalette = {
  name: 'Grayscale 16',
  description: '16 shades of gray',
  colors: [
    '#000000', '#111111', '#222222', '#333333', '#444444', '#555555', '#666666', '#777777',
    '#888888', '#999999', '#aaaaaa', '#bbbbbb', '#cccccc', '#dddddd', '#eeeeee', '#ffffff'
  ]
};

/**
 * Grayscale - 8 shades
 */
export const Grayscale8: ColorPalette = {
  name: 'Grayscale 8',
  description: '8 shades of gray',
  colors: [
    '#000000', '#242424', '#484848', '#6d6d6d', '#919191', '#b6b6b6', '#dadada', '#ffffff'
  ]
};

/**
 * Pastel - 16 colors
 */
export const Pastel: ColorPalette = {
  name: 'Pastel',
  description: 'Soft pastel colors',
  colors: [
    '#ffd1dc', '#ffb7c5', '#ffaec9', '#ffc0cb', '#ffb6c1', '#ffa07a', '#ffdab9', '#ffe4b5',
    '#fff8dc', '#fffacd', '#fafad2', '#d8f8d8', '#b0e0e6', '#add8e6', '#e6e6fa', '#f0e6f0'
  ]
};

/**
 * All available palettes
 */
export const AllPalettes: ColorPalette[] = [
  AmigaOCS,
  AmigaECS,
  Commodore64,
  CGA,
  CGAPalette0High,
  CGAPalette0Low,
  CGAPalette1High,
  CGAPalette1Low,
  EGA,
  VGA,
  AppleII,
  ZXSpectrum,
  MSX,
  Gameboy,
  GameboyPocket,
  NES,
  PICO8,
  WebSafe,
  Grayscale16,
  Grayscale8,
  Pastel
];

/**
 * Palette Manager Class
 */
export class PaletteManager {
  private palettes: Map<string, ColorPalette> = new Map();
  private customPalettes: Map<string, ColorPalette> = new Map();
  private currentPalette: ColorPalette;

  constructor() {
    // Load default palettes
    for (const palette of AllPalettes) {
      this.palettes.set(palette.name, palette);
    }

    this.currentPalette = AmigaOCS;
  }

  getPalette(name: string): ColorPalette | undefined {
    return this.palettes.get(name) || this.customPalettes.get(name);
  }

  getAllPaletteNames(): string[] {
    return [
      ...Array.from(this.palettes.keys()),
      ...Array.from(this.customPalettes.keys())
    ];
  }

  getAllPalettes(): ColorPalette[] {
    return [
      ...Array.from(this.palettes.values()),
      ...Array.from(this.customPalettes.values())
    ];
  }

  setCurrentPalette(name: string): boolean {
    const palette = this.getPalette(name);
    if (palette) {
      this.currentPalette = palette;
      return true;
    }
    return false;
  }

  getCurrentPalette(): ColorPalette {
    return this.currentPalette;
  }

  createCustomPalette(name: string, colors: string[], description?: string): ColorPalette {
    const palette: ColorPalette = {
      name,
      colors,
      description
    };

    this.customPalettes.set(name, palette);
    return palette;
  }

  deleteCustomPalette(name: string): boolean {
    return this.customPalettes.delete(name);
  }

  /**
   * Find the closest color in the current palette to a given color
   */
  findClosestColor(targetColor: string): string {
    const target = this.hexToRgb(targetColor);
    if (!target) return this.currentPalette.colors[0];

    let closestColor = this.currentPalette.colors[0];
    let minDistance = Infinity;

    for (const color of this.currentPalette.colors) {
      const rgb = this.hexToRgb(color);
      if (!rgb) continue;

      const distance = Math.sqrt(
        Math.pow(rgb.r - target.r, 2) +
        Math.pow(rgb.g - target.g, 2) +
        Math.pow(rgb.b - target.b, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestColor = color;
      }
    }

    return closestColor;
  }

  /**
   * Reduce an image to the current palette (color quantization)
   */
  reduceImageToPalette(imageData: ImageData): ImageData {
    const result = new ImageData(imageData.width, imageData.height);

    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const a = imageData.data[i + 3];

      const hex = this.rgbToHex(r, g, b);
      const closestColor = this.findClosestColor(hex);
      const rgb = this.hexToRgb(closestColor)!;

      result.data[i] = rgb.r;
      result.data[i + 1] = rgb.g;
      result.data[i + 2] = rgb.b;
      result.data[i + 3] = a;
    }

    return result;
  }

  /**
   * Generate a gradient between two colors
   */
  generateGradient(color1: string, color2: string, steps: number): string[] {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) return [];

    const gradient: string[] = [];

    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
      const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
      const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);

      gradient.push(this.rgbToHex(r, g, b));
    }

    return gradient;
  }

  /**
   * Mix two colors
   */
  mixColors(color1: string, color2: string, ratio: number = 0.5): string {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) return color1;

    const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
    const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
    const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);

    return this.rgbToHex(r, g, b);
  }

  /**
   * Export palette to JSON
   */
  exportToJSON(paletteName: string): string | null {
    const palette = this.getPalette(paletteName);
    if (!palette) return null;

    return JSON.stringify(palette, null, 2);
  }

  /**
   * Import palette from JSON
   */
  importFromJSON(json: string): ColorPalette | null {
    try {
      const palette = JSON.parse(json) as ColorPalette;
      if (palette.name && palette.colors && Array.isArray(palette.colors)) {
        this.customPalettes.set(palette.name, palette);
        return palette;
      }
    } catch (e) {
      // Invalid JSON
    }
    return null;
  }

  /**
   * Export palette to Adobe Color Table (.act) format
   */
  exportToACT(paletteName: string): Uint8Array | null {
    const palette = this.getPalette(paletteName);
    if (!palette) return null;

    // ACT files are 768 bytes (256 RGB triplets)
    const data = new Uint8Array(768);

    for (let i = 0; i < Math.min(palette.colors.length, 256); i++) {
      const rgb = this.hexToRgb(palette.colors[i]);
      if (rgb) {
        data[i * 3] = rgb.r;
        data[i * 3 + 1] = rgb.g;
        data[i * 3 + 2] = rgb.b;
      }
    }

    return data;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null;
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
}

/**
 * Create a default palette manager instance
 */
export const defaultPaletteManager = new PaletteManager();
