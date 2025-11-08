/**
 * CSS Optimizer Utility
 *
 * Provides utilities for optimizing CSS usage and reducing duplicate styles.
 * Extracts common patterns into CSS variables and helps identify unused styles.
 */

/**
 * Common Amiga Workbench CSS variables
 * Used to reduce duplicate color/style definitions across components
 */
export const amigaCSSVariables = {
  // Colors
  '--amiga-gray': '#a0a0a0',
  '--amiga-blue': '#0055aa',
  '--amiga-blue-light': '#0088ff',
  '--amiga-orange': '#ffaa00',
  '--amiga-white': '#ffffff',
  '--amiga-black': '#000000',
  '--amiga-dark-gray': '#666666',
  '--amiga-light-gray': '#cccccc',
  '--amiga-shadow': '#808080',

  // Borders
  '--amiga-border-raised': '2px solid',
  '--amiga-border-raised-colors': '#ffffff #000000 #000000 #ffffff',
  '--amiga-border-sunken': '2px solid',
  '--amiga-border-sunken-colors': '#000000 #ffffff #ffffff #000000',

  // Spacing
  '--amiga-spacing-xs': '4px',
  '--amiga-spacing-sm': '8px',
  '--amiga-spacing-md': '12px',
  '--amiga-spacing-lg': '20px',
  '--amiga-spacing-xl': '30px',

  // Typography
  '--amiga-font-family': "'Press Start 2P', 'Courier New', monospace",
  '--amiga-font-size-xs': '8px',
  '--amiga-font-size-sm': '9px',
  '--amiga-font-size-md': '10px',
  '--amiga-font-size-lg': '11px',
  '--amiga-font-size-xl': '12px',

  // Shadows
  '--amiga-shadow-sm': '2px 2px 0px rgba(0, 0, 0, 0.3)',
  '--amiga-shadow-md': '4px 4px 0px rgba(0, 0, 0, 0.4)',
  '--amiga-shadow-lg': '6px 6px 0px rgba(0, 0, 0, 0.5)',

  // Transitions
  '--amiga-transition-fast': '0.1s',
  '--amiga-transition-medium': '0.2s',
  '--amiga-transition-slow': '0.3s',
};

/**
 * Apply CSS variables to document root
 */
export function applyCSSVariables(): void {
  const root = document.documentElement;

  Object.entries(amigaCSSVariables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  if (import.meta.env.DEV) {
    console.log('🎨 Amiga CSS variables applied');
  }
}

/**
 * Common CSS mixins as string templates
 * These can be used in component styles to reduce duplication
 */
export const amigaCSSMixins = {
  /**
   * Amiga-style raised button border
   */
  buttonRaised: `
    border: var(--amiga-border-raised);
    border-color: var(--amiga-border-raised-colors);
    background: var(--amiga-gray);
  `,

  /**
   * Amiga-style sunken/pressed button border
   */
  buttonSunken: `
    border: var(--amiga-border-sunken);
    border-color: var(--amiga-border-sunken-colors);
    background: #888888;
  `,

  /**
   * Amiga-style window border
   */
  windowBorder: `
    border: 3px solid;
    border-color: var(--amiga-border-raised-colors);
    background: var(--amiga-gray);
    box-shadow: var(--amiga-shadow-md);
  `,

  /**
   * Amiga-style text outline (for icon labels)
   */
  textOutline: `
    text-shadow:
      -1px -1px 0 var(--amiga-white),
      1px -1px 0 var(--amiga-white),
      -1px 1px 0 var(--amiga-white),
      1px 1px 0 var(--amiga-white);
  `,

  /**
   * Amiga-style retro font
   */
  retroFont: `
    font-family: var(--amiga-font-family);
    font-size: var(--amiga-font-size-md);
  `,
};

/**
 * Get optimized CSS for common patterns
 */
export function getOptimizedCSS(pattern: keyof typeof amigaCSSMixins): string {
  return amigaCSSMixins[pattern] || '';
}

/**
 * CSS Performance Analyzer
 * Analyzes loaded stylesheets and identifies potential optimizations
 */
class CSSOptimizer {
  /**
   * Analyze CSS usage and log statistics
   */
  analyzeCSS(): void {
    if (!import.meta.env.DEV) {
      return;
    }

    const stylesheets = Array.from(document.styleSheets);
    let totalRules = 0;
    let totalSelectors = 0;

    stylesheets.forEach((sheet) => {
      try {
        const rules = Array.from(sheet.cssRules || []);
        totalRules += rules.length;

        rules.forEach((rule) => {
          if (rule instanceof CSSStyleRule) {
            totalSelectors++;
          }
        });
      } catch (e) {
        // Can't access cross-origin stylesheets
      }
    });

    console.log(
      '%c🎨 CSS Analysis',
      'background: #0055aa; color: white; padding: 4px 8px; font-weight: bold;'
    );
    console.table({
      'Total Stylesheets': stylesheets.length,
      'Total Rules': totalRules,
      'Total Selectors': totalSelectors,
      'Rules per Stylesheet': (totalRules / stylesheets.length).toFixed(1),
    });
  }

  /**
   * Find potentially unused CSS selectors
   * Note: This is a simple heuristic and may have false positives
   */
  findUnusedSelectors(): string[] {
    if (!import.meta.env.DEV) {
      return [];
    }

    const stylesheets = Array.from(document.styleSheets);
    const unusedSelectors: string[] = [];

    stylesheets.forEach((sheet) => {
      try {
        const rules = Array.from(sheet.cssRules || []);

        rules.forEach((rule) => {
          if (rule instanceof CSSStyleRule) {
            const selector = rule.selectorText;

            try {
              const elements = document.querySelectorAll(selector);
              if (elements.length === 0) {
                unusedSelectors.push(selector);
              }
            } catch (e) {
              // Invalid selector
            }
          }
        });
      } catch (e) {
        // Can't access cross-origin stylesheets
      }
    });

    if (unusedSelectors.length > 0) {
      console.warn(
        `⚠️ Found ${unusedSelectors.length} potentially unused CSS selectors`,
        unusedSelectors
      );
    }

    return unusedSelectors;
  }

  /**
   * Get CSS size statistics
   */
  getCSSSize(): { total: number; bySheet: Array<{ href: string | null; size: number }> } {
    const stylesheets = Array.from(document.styleSheets);
    const bySheet: Array<{ href: string | null; size: number }> = [];
    let total = 0;

    stylesheets.forEach((sheet) => {
      try {
        const rules = Array.from(sheet.cssRules || []);
        const size = rules.reduce((sum, rule) => sum + rule.cssText.length, 0);
        total += size;

        bySheet.push({
          href: sheet.href,
          size,
        });
      } catch (e) {
        // Can't access cross-origin stylesheets
      }
    });

    return { total, bySheet };
  }

  /**
   * Log CSS size report
   */
  logSizeReport(): void {
    if (!import.meta.env.DEV) {
      return;
    }

    const { total, bySheet } = this.getCSSSize();

    console.log(
      '%c📊 CSS Size Report',
      'background: #0055aa; color: white; padding: 4px 8px; font-weight: bold;'
    );

    console.log(`Total CSS: ${(total / 1024).toFixed(2)} KB`);

    bySheet.forEach((sheet, index) => {
      const name = sheet.href
        ? sheet.href.split('/').pop()
        : `Inline Style ${index + 1}`;
      console.log(`  ${name}: ${(sheet.size / 1024).toFixed(2)} KB`);
    });
  }
}

// Export singleton instance
export const cssOptimizer = new CSSOptimizer();

// Global access for debugging
if (import.meta.env.DEV) {
  (window as any).__cssOptimizer = cssOptimizer;
}
