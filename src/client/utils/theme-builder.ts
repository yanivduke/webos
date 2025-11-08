/**
 * Theme Builder for WebOS
 * Utilities for creating and customizing themes
 */

import type { ThemeDefinition, ThemeColors } from './theme-manager';

export interface ColorPalette {
  primary: string;
  complementary: string;
  analogous: string[];
  triadic: string[];
}

export class ThemeBuilder {
  /**
   * Generate a color palette from a base color
   */
  static generatePalette(baseColor: string): ColorPalette {
    const hsl = this.hexToHSL(baseColor);

    return {
      primary: baseColor,
      complementary: this.hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l),
      analogous: [
        this.hslToHex((hsl.h - 30 + 360) % 360, hsl.s, hsl.l),
        this.hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l)
      ],
      triadic: [
        this.hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l),
        this.hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l)
      ]
    };
  }

  /**
   * Generate complementary color
   */
  static getComplementary(color: string): string {
    const hsl = this.hexToHSL(color);
    return this.hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l);
  }

  /**
   * Lighten a color by percentage
   */
  static lighten(color: string, percent: number): string {
    const hsl = this.hexToHSL(color);
    const newL = Math.min(100, hsl.l + percent);
    return this.hslToHex(hsl.h, hsl.s, newL);
  }

  /**
   * Darken a color by percentage
   */
  static darken(color: string, percent: number): string {
    const hsl = this.hexToHSL(color);
    const newL = Math.max(0, hsl.l - percent);
    return this.hslToHex(hsl.h, hsl.s, newL);
  }

  /**
   * Adjust color saturation
   */
  static saturate(color: string, percent: number): string {
    const hsl = this.hexToHSL(color);
    const newS = Math.min(100, Math.max(0, hsl.s + percent));
    return this.hslToHex(hsl.h, newS, hsl.l);
  }

  /**
   * Calculate contrast ratio between two colors (WCAG)
   */
  static getContrastRatio(color1: string, color2: string): number {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if color combination meets WCAG AA standard (4.5:1 for normal text)
   */
  static meetsContrastAA(foreground: string, background: string): boolean {
    return this.getContrastRatio(foreground, background) >= 4.5;
  }

  /**
   * Check if color combination meets WCAG AAA standard (7:1 for normal text)
   */
  static meetsContrastAAA(foreground: string, background: string): boolean {
    return this.getContrastRatio(foreground, background) >= 7.0;
  }

  /**
   * Validate theme accessibility
   */
  static validateAccessibility(theme: ThemeDefinition): {
    valid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    // Check text on background
    if (!this.meetsContrastAA(theme.colors.text, theme.colors.background)) {
      warnings.push('Text on background does not meet WCAG AA contrast ratio');
    }

    // Check window title text on title background
    if (!this.meetsContrastAA(theme.colors.windowTitleText, theme.colors.windowTitle)) {
      warnings.push('Window title text contrast is insufficient');
    }

    // Check highlight text
    if (!this.meetsContrastAA(theme.colors.highlightText, theme.colors.highlight)) {
      warnings.push('Highlight text contrast is insufficient');
    }

    // Check menu text
    if (!this.meetsContrastAA(theme.colors.menuText, theme.colors.menuBg)) {
      warnings.push('Menu text contrast is insufficient');
    }

    // Check input text
    if (!this.meetsContrastAA(theme.colors.inputText, theme.colors.inputBg)) {
      warnings.push('Input text contrast is insufficient');
    }

    return {
      valid: warnings.length === 0,
      warnings
    };
  }

  /**
   * Auto-generate theme colors from primary color
   */
  static generateThemeColors(primaryColor: string, isDark: boolean = false): Partial<ThemeColors> {
    const baseBackground = isDark ? '#2d2d2d' : '#a0a0a0';
    const baseText = isDark ? '#ffffff' : '#000000';
    const baseTextInverse = isDark ? '#000000' : '#ffffff';

    return {
      primary: primaryColor,
      background: baseBackground,
      text: baseText,
      textInverse: baseTextInverse,
      border: isDark ? '#555555' : '#000000',
      borderLight: isDark ? '#777777' : '#ffffff',
      borderDark: isDark ? '#000000' : '#000000',
      windowChrome: isDark ? this.lighten(baseBackground, 10) : baseBackground,
      windowTitle: primaryColor,
      windowTitleText: this.meetsContrastAA('#ffffff', primaryColor) ? '#ffffff' : '#000000',
      highlight: primaryColor,
      highlightText: this.meetsContrastAA('#ffffff', primaryColor) ? '#ffffff' : '#000000',
      shadow: isDark ? this.darken(baseBackground, 10) : this.darken(baseBackground, 20),
      accent: this.getComplementary(primaryColor),
      success: '#4caf50',
      warning: '#ffc107',
      error: '#f44336',
      disabled: isDark ? '#666666' : '#888888',
      inputBg: isDark ? '#1a1a1a' : '#ffffff',
      inputText: isDark ? '#ffffff' : '#000000',
      inputBorder: isDark ? '#555555' : '#000000',
      scrollbarTrack: baseBackground,
      scrollbarThumb: isDark ? '#555555' : '#707070',
      menuBg: isDark ? this.lighten(baseBackground, 10) : baseBackground,
      menuText: baseText,
      menuHighlight: primaryColor,
      menuHighlightText: this.meetsContrastAA('#ffffff', primaryColor) ? '#ffffff' : '#000000'
    };
  }

  /**
   * Create a theme preview data URL
   */
  static createPreview(theme: ThemeDefinition, width: number = 200, height: number = 150): string {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    // Background
    ctx.fillStyle = theme.colors.background;
    ctx.fillRect(0, 0, width, height);

    // Window
    const winX = 10;
    const winY = 10;
    const winW = width - 20;
    const winH = height - 20;

    // Window chrome
    ctx.fillStyle = theme.colors.windowChrome;
    ctx.fillRect(winX, winY, winW, winH);

    // Window border
    ctx.strokeStyle = theme.colors.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(winX, winY, winW, winH);

    // Title bar
    const titleH = 20;
    ctx.fillStyle = theme.colors.windowTitle;
    ctx.fillRect(winX, winY, winW, titleH);

    // Title text
    ctx.fillStyle = theme.colors.windowTitleText;
    ctx.font = '8px monospace';
    ctx.fillText('Preview', winX + 5, winY + 13);

    // Button
    const btnX = winX + 10;
    const btnY = winY + titleH + 10;
    const btnW = 60;
    const btnH = 20;

    ctx.fillStyle = theme.colors.primary;
    ctx.fillRect(btnX, btnY, btnW, btnH);

    ctx.strokeStyle = theme.colors.borderLight;
    ctx.lineWidth = 1;
    ctx.strokeRect(btnX, btnY, btnW, btnH);

    // Text
    ctx.fillStyle = theme.colors.text;
    ctx.font = '10px monospace';
    ctx.fillText('Text sample', btnX, btnY + btnH + 15);

    return canvas.toDataURL();
  }

  /**
   * Convert hex to HSL
   */
  private static hexToHSL(hex: string): { h: number; s: number; l: number } {
    // Remove # if present
    hex = hex.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  /**
   * Convert HSL to hex
   */
  private static hslToHex(h: number, s: number, l: number): string {
    s = s / 100;
    l = l / 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r = 0;
    let g = 0;
    let b = 0;

    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
      r = c; g = 0; b = x;
    }

    const toHex = (n: number) => {
      const hex = Math.round((n + m) * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Get relative luminance of a color
   */
  private static getLuminance(hex: string): number {
    hex = hex.replace('#', '');

    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const toLinear = (c: number) => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };

    const rLinear = toLinear(r);
    const gLinear = toLinear(g);
    const bLinear = toLinear(b);

    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  }

  /**
   * Ensure color is in hex format
   */
  static normalizeColor(color: string): string {
    // If already hex, return as is
    if (color.startsWith('#')) {
      return color;
    }

    // Handle rgb/rgba
    if (color.startsWith('rgb')) {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '#000000';

      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const data = ctx.getImageData(0, 0, 1, 1).data;

      const toHex = (n: number) => {
        const hex = n.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };

      return `#${toHex(data[0])}${toHex(data[1])}${toHex(data[2])}`;
    }

    return color;
  }
}
