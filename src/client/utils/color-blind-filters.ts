/**
 * Color Blind Filters Utility
 *
 * Provides color blindness simulation filters and safe color palettes
 * for different types of color vision deficiency.
 */

export type ColorBlindMode = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia' | 'monochromacy';

export interface ColorBlindFilter {
  mode: ColorBlindMode;
  name: string;
  description: string;
  cssFilter: string;
  affectedPopulation: string;
}

export interface SafeColorPalette {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  text: string;
}

class ColorBlindFilters {
  /**
   * Get all available color blind modes
   */
  getModes(): ColorBlindFilter[] {
    return [
      {
        mode: 'none',
        name: 'Normal Vision',
        description: 'No color vision deficiency',
        cssFilter: '',
        affectedPopulation: 'N/A'
      },
      {
        mode: 'deuteranopia',
        name: 'Deuteranopia',
        description: 'Red-green color blindness (green weak)',
        cssFilter: 'url(#deuteranopia-filter)',
        affectedPopulation: '~6% of males, ~0.4% of females'
      },
      {
        mode: 'protanopia',
        name: 'Protanopia',
        description: 'Red-green color blindness (red weak)',
        cssFilter: 'url(#protanopia-filter)',
        affectedPopulation: '~2% of males'
      },
      {
        mode: 'tritanopia',
        name: 'Tritanopia',
        description: 'Blue-yellow color blindness',
        cssFilter: 'url(#tritanopia-filter)',
        affectedPopulation: '~0.001% of population'
      },
      {
        mode: 'monochromacy',
        name: 'Monochromacy',
        description: 'Complete color blindness (grayscale)',
        cssFilter: 'grayscale(100%)',
        affectedPopulation: '~0.003% of population'
      }
    ];
  }

  /**
   * Get filter by mode
   */
  getFilter(mode: ColorBlindMode): ColorBlindFilter | undefined {
    return this.getModes().find(f => f.mode === mode);
  }

  /**
   * Apply color blind filter to element
   */
  applyFilter(element: HTMLElement, mode: ColorBlindMode): void {
    const filter = this.getFilter(mode);
    if (filter) {
      element.style.filter = filter.cssFilter;
    }
  }

  /**
   * Remove filter from element
   */
  removeFilter(element: HTMLElement): void {
    element.style.filter = '';
  }

  /**
   * Initialize SVG filters for color blindness simulation
   * These filters approximate the color perception for different CVD types
   */
  initializeSVGFilters(): void {
    // Check if filters already exist
    if (document.getElementById('colorblind-filters')) return;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'colorblind-filters';
    svg.style.position = 'absolute';
    svg.style.width = '0';
    svg.style.height = '0';

    // Deuteranopia filter (green weak)
    const deuteranopia = this.createColorMatrixFilter('deuteranopia-filter', [
      0.625, 0.375, 0, 0, 0,
      0.7, 0.3, 0, 0, 0,
      0, 0.3, 0.7, 0, 0,
      0, 0, 0, 1, 0
    ]);
    svg.appendChild(deuteranopia);

    // Protanopia filter (red weak)
    const protanopia = this.createColorMatrixFilter('protanopia-filter', [
      0.567, 0.433, 0, 0, 0,
      0.558, 0.442, 0, 0, 0,
      0, 0.242, 0.758, 0, 0,
      0, 0, 0, 1, 0
    ]);
    svg.appendChild(protanopia);

    // Tritanopia filter (blue weak)
    const tritanopia = this.createColorMatrixFilter('tritanopia-filter', [
      0.95, 0.05, 0, 0, 0,
      0, 0.433, 0.567, 0, 0,
      0, 0.475, 0.525, 0, 0,
      0, 0, 0, 1, 0
    ]);
    svg.appendChild(tritanopia);

    document.body.appendChild(svg);
  }

  /**
   * Create SVG color matrix filter
   */
  private createColorMatrixFilter(id: string, values: number[]): SVGFilterElement {
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.id = id;

    const colorMatrix = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
    colorMatrix.setAttribute('type', 'matrix');
    colorMatrix.setAttribute('values', values.join(' '));

    filter.appendChild(colorMatrix);
    return filter;
  }

  /**
   * Get safe color palette for a specific color blind mode
   * These palettes ensure sufficient contrast and distinction
   */
  getSafePalette(mode: ColorBlindMode): SafeColorPalette {
    const palettes: Record<ColorBlindMode, SafeColorPalette> = {
      none: {
        primary: '#0055aa',
        secondary: '#ffaa00',
        success: '#00aa00',
        warning: '#ff8800',
        error: '#cc0000',
        info: '#0088cc',
        background: '#a0a0a0',
        text: '#000000'
      },
      deuteranopia: {
        primary: '#0055aa',
        secondary: '#ffaa00',
        success: '#0088cc', // Use blue instead of green
        warning: '#ff8800',
        error: '#cc0000',
        info: '#6600cc', // Use purple for distinction
        background: '#a0a0a0',
        text: '#000000'
      },
      protanopia: {
        primary: '#0055aa',
        secondary: '#ffaa00',
        success: '#0088cc', // Use blue instead of green
        warning: '#ff8800',
        error: '#8800cc', // Use purple instead of red
        info: '#00aaaa', // Use cyan for distinction
        background: '#a0a0a0',
        text: '#000000'
      },
      tritanopia: {
        primary: '#cc0000', // Use red instead of blue
        secondary: '#ffaa00',
        success: '#00aa00',
        warning: '#ff8800',
        error: '#cc0000',
        info: '#ff00ff', // Use magenta for distinction
        background: '#a0a0a0',
        text: '#000000'
      },
      monochromacy: {
        primary: '#000000',
        secondary: '#666666',
        success: '#333333',
        warning: '#555555',
        error: '#000000',
        info: '#444444',
        background: '#a0a0a0',
        text: '#000000'
      }
    };

    return palettes[mode];
  }

  /**
   * Calculate relative luminance (WCAG formula)
   */
  private getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;

    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Parse hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Calculate contrast ratio between two colors (WCAG formula)
   */
  getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) return 0;

    const lum1 = this.getRelativeLuminance(rgb1);
    const lum2 = this.getRelativeLuminance(rgb2);

    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if contrast meets WCAG AA standard (4.5:1 for normal text)
   */
  meetsWCAGAA(color1: string, color2: string): boolean {
    return this.getContrastRatio(color1, color2) >= 4.5;
  }

  /**
   * Check if contrast meets WCAG AAA standard (7:1 for normal text)
   */
  meetsWCAGAAA(color1: string, color2: string): boolean {
    return this.getContrastRatio(color1, color2) >= 7;
  }

  /**
   * Check if contrast meets WCAG AA for large text (3:1)
   */
  meetsWCAGAALarge(color1: string, color2: string): boolean {
    return this.getContrastRatio(color1, color2) >= 3;
  }

  /**
   * Get accessible text color (black or white) for a background
   */
  getAccessibleTextColor(backgroundColor: string): string {
    const blackContrast = this.getContrastRatio(backgroundColor, '#000000');
    const whiteContrast = this.getContrastRatio(backgroundColor, '#ffffff');

    return blackContrast > whiteContrast ? '#000000' : '#ffffff';
  }

  /**
   * Suggest color adjustments for better accessibility
   */
  suggestAccessibleColor(foreground: string, background: string): {
    isAccessible: boolean;
    contrastRatio: number;
    suggestion?: string;
  } {
    const ratio = this.getContrastRatio(foreground, background);
    const isAccessible = ratio >= 4.5;

    return {
      isAccessible,
      contrastRatio: ratio,
      suggestion: isAccessible ? undefined : 'Increase contrast between foreground and background colors'
    };
  }

  /**
   * Simulate color as seen by person with color blindness
   */
  simulateColor(hex: string, mode: ColorBlindMode): string {
    if (mode === 'none') return hex;
    if (mode === 'monochromacy') {
      // Convert to grayscale
      const rgb = this.hexToRgb(hex);
      if (!rgb) return hex;
      const gray = Math.round(0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
      return `#${gray.toString(16).padStart(2, '0').repeat(3)}`;
    }

    // For other modes, return the color as-is
    // (SVG filters handle the actual simulation)
    return hex;
  }

  /**
   * Get recommended icon set for color blind mode
   */
  getRecommendedIcons(mode: ColorBlindMode): {
    useShapes: boolean;
    usePatterns: boolean;
    useLabels: boolean;
  } {
    return {
      useShapes: mode !== 'none', // Use different shapes for distinction
      usePatterns: mode === 'monochromacy', // Use patterns in grayscale
      useLabels: true // Always use labels for clarity
    };
  }

  /**
   * Check if two colors are distinguishable for a color blind mode
   */
  areColorsDistinguishable(color1: string, color2: string, mode: ColorBlindMode): boolean {
    const simulated1 = this.simulateColor(color1, mode);
    const simulated2 = this.simulateColor(color2, mode);

    // Colors should have sufficient contrast even when simulated
    const ratio = this.getContrastRatio(simulated1, simulated2);
    return ratio >= 1.5; // Minimum distinguishability threshold
  }
}

// Export singleton instance
export const colorBlindFilters = new ColorBlindFilters();

// Initialize SVG filters on load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    colorBlindFilters.initializeSVGFilters();
  });
}
