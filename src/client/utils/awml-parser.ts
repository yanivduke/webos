/**
 * AWML Parser - Parse and validate AWML (Amiga WebAssembly Markup Language) files
 */

export interface AWMLMetadata {
  name: string;
  version: string;
  author?: string;
  description?: string;
  icon?: string;
  category?: string;
  license?: string;
  homepage?: string;
}

export interface AWMLRuntime {
  wasmSrc: string;
  memory: {
    initial: number;
    maximum: number;
    shared?: boolean;
  };
  stack?: {
    size: number;
  };
  permissions: {
    filesystem?: {
      read: boolean;
      write: boolean;
      path?: string;
    };
    network?: {
      enabled: boolean;
      domains?: string;
    };
    system?: {
      exec: boolean;
    };
    clipboard?: {
      read: boolean;
      write: boolean;
    };
    media?: {
      audio: boolean;
      video: boolean;
    };
  };
  env?: Record<string, string>;
}

export interface AWMLWindow {
  title: string;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  resizable: boolean;
  draggable: boolean;
  closable: boolean;
  icon?: string;
  position?: {
    x: number;
    y: number;
  };
}

export interface AWMLResource {
  id: string;
  type: string;
  src: string;
  encoding?: string;
}

export interface AWMLSetting {
  key: string;
  value: string | number | boolean;
  type: 'string' | 'number' | 'boolean' | 'color';
  label?: string;
  min?: number;
  max?: number;
  options?: Array<{ value: string; label: string }>;
}

export interface AWMLDocument {
  version: string;
  metadata: AWMLMetadata;
  runtime: AWMLRuntime;
  window: AWMLWindow;
  resources: AWMLResource[];
  config: AWMLSetting[];
}

export class AWMLParser {
  /**
   * Parse AWML XML string into structured data
   */
  static parse(xmlString: string): AWMLDocument {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');

    // Check for parse errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error(`XML Parse Error: ${parserError.textContent}`);
    }

    const root = doc.documentElement;

    if (root.tagName !== 'awml') {
      throw new Error('Invalid AWML file: root element must be <awml>');
    }

    const version = root.getAttribute('version') || '1.0';

    return {
      version,
      metadata: this.parseMetadata(root),
      runtime: this.parseRuntime(root),
      window: this.parseWindow(root),
      resources: this.parseResources(root),
      config: this.parseConfig(root)
    };
  }

  /**
   * Parse metadata section
   */
  private static parseMetadata(root: Element): AWMLMetadata {
    const metadata = root.querySelector('metadata');
    if (!metadata) {
      throw new Error('Missing required <metadata> section');
    }

    const name = metadata.querySelector('name')?.textContent?.trim();
    const version = metadata.querySelector('version')?.textContent?.trim();

    if (!name || !version) {
      throw new Error('Metadata must include <name> and <version>');
    }

    return {
      name,
      version,
      author: metadata.querySelector('author')?.textContent?.trim(),
      description: metadata.querySelector('description')?.textContent?.trim(),
      icon: metadata.querySelector('icon')?.textContent?.trim(),
      category: metadata.querySelector('category')?.textContent?.trim(),
      license: metadata.querySelector('license')?.textContent?.trim(),
      homepage: metadata.querySelector('homepage')?.textContent?.trim()
    };
  }

  /**
   * Parse runtime section
   */
  private static parseRuntime(root: Element): AWMLRuntime {
    const runtime = root.querySelector('runtime');
    if (!runtime) {
      throw new Error('Missing required <runtime> section');
    }

    const wasm = runtime.querySelector('wasm');
    if (!wasm) {
      throw new Error('Runtime must include <wasm> element');
    }

    const wasmSrc = wasm.getAttribute('src');
    if (!wasmSrc) {
      throw new Error('<wasm> element must have src attribute');
    }

    const memory = runtime.querySelector('memory');
    const memoryConfig = {
      initial: parseInt(memory?.getAttribute('initial') || '256'),
      maximum: parseInt(memory?.getAttribute('maximum') || '1024'),
      shared: memory?.getAttribute('shared') === 'true'
    };

    const stack = runtime.querySelector('stack');
    const stackConfig = stack ? {
      size: parseInt(stack.getAttribute('size') || '65536')
    } : undefined;

    const permissions = this.parsePermissions(runtime);

    // Parse environment variables
    const env: Record<string, string> = {};
    runtime.querySelectorAll('env').forEach(envEl => {
      const key = envEl.getAttribute('key');
      const value = envEl.getAttribute('value');
      if (key && value) {
        env[key] = value;
      }
    });

    return {
      wasmSrc,
      memory: memoryConfig,
      stack: stackConfig,
      permissions,
      env: Object.keys(env).length > 0 ? env : undefined
    };
  }

  /**
   * Parse permissions
   */
  private static parsePermissions(runtime: Element): AWMLRuntime['permissions'] {
    const permissionsEl = runtime.querySelector('permissions');
    const permissions: AWMLRuntime['permissions'] = {};

    if (permissionsEl) {
      const filesystem = permissionsEl.querySelector('filesystem');
      if (filesystem) {
        permissions.filesystem = {
          read: filesystem.getAttribute('read') === 'true',
          write: filesystem.getAttribute('write') === 'true',
          path: filesystem.getAttribute('path') || undefined
        };
      }

      const network = permissionsEl.querySelector('network');
      if (network) {
        permissions.network = {
          enabled: network.getAttribute('enabled') === 'true',
          domains: network.getAttribute('domains') || undefined
        };
      }

      const system = permissionsEl.querySelector('system');
      if (system) {
        permissions.system = {
          exec: system.getAttribute('exec') === 'true'
        };
      }

      const clipboard = permissionsEl.querySelector('clipboard');
      if (clipboard) {
        permissions.clipboard = {
          read: clipboard.getAttribute('read') === 'true',
          write: clipboard.getAttribute('write') === 'true'
        };
      }

      const media = permissionsEl.querySelector('media');
      if (media) {
        permissions.media = {
          audio: media.getAttribute('audio') === 'true',
          video: media.getAttribute('video') === 'true'
        };
      }
    }

    return permissions;
  }

  /**
   * Parse window section
   */
  private static parseWindow(root: Element): AWMLWindow {
    const window = root.querySelector('window');
    if (!window) {
      throw new Error('Missing required <window> section');
    }

    const title = window.querySelector('title')?.textContent?.trim() || 'Untitled';
    const width = parseInt(window.querySelector('width')?.textContent || '640');
    const height = parseInt(window.querySelector('height')?.textContent || '480');

    return {
      title,
      width,
      height,
      minWidth: this.parseNumber(window, 'minWidth'),
      minHeight: this.parseNumber(window, 'minHeight'),
      maxWidth: this.parseNumber(window, 'maxWidth'),
      maxHeight: this.parseNumber(window, 'maxHeight'),
      resizable: window.querySelector('resizable')?.textContent?.trim() !== 'false',
      draggable: window.querySelector('draggable')?.textContent?.trim() !== 'false',
      closable: window.querySelector('closable')?.textContent?.trim() !== 'false',
      icon: window.querySelector('icon')?.textContent?.trim(),
      position: this.parsePosition(window)
    };
  }

  /**
   * Parse resources section
   */
  private static parseResources(root: Element): AWMLResource[] {
    const resources: AWMLResource[] = [];
    const resourcesEl = root.querySelector('resources');

    if (resourcesEl) {
      resourcesEl.querySelectorAll('resource').forEach(resource => {
        const id = resource.getAttribute('id');
        const type = resource.getAttribute('type');
        const src = resource.getAttribute('src') || resource.textContent?.trim();

        if (id && type && src) {
          resources.push({
            id,
            type,
            src,
            encoding: resource.getAttribute('encoding') || undefined
          });
        }
      });
    }

    return resources;
  }

  /**
   * Parse config section
   */
  private static parseConfig(root: Element): AWMLSetting[] {
    const settings: AWMLSetting[] = [];
    const configEl = root.querySelector('config');

    if (configEl) {
      configEl.querySelectorAll('setting').forEach(setting => {
        const key = setting.getAttribute('key');
        const valueStr = setting.getAttribute('value');
        const type = setting.getAttribute('type') as AWMLSetting['type'] || 'string';

        if (key && valueStr) {
          let value: string | number | boolean = valueStr;

          if (type === 'number') {
            value = parseFloat(valueStr);
          } else if (type === 'boolean') {
            value = valueStr === 'true';
          }

          const settingObj: AWMLSetting = {
            key,
            value,
            type,
            label: setting.querySelector('label')?.textContent?.trim(),
            min: this.parseNumberAttr(setting, 'min'),
            max: this.parseNumberAttr(setting, 'max')
          };

          // Parse options
          const options = setting.querySelector('options');
          if (options) {
            settingObj.options = Array.from(options.querySelectorAll('option')).map(opt => ({
              value: opt.getAttribute('value') || '',
              label: opt.textContent?.trim() || ''
            }));
          }

          settings.push(settingObj);
        }
      });
    }

    return settings;
  }

  /**
   * Helper: Parse number from element
   */
  private static parseNumber(parent: Element, tag: string): number | undefined {
    const text = parent.querySelector(tag)?.textContent?.trim();
    return text ? parseInt(text) : undefined;
  }

  /**
   * Helper: Parse number from attribute
   */
  private static parseNumberAttr(element: Element, attr: string): number | undefined {
    const value = element.getAttribute(attr);
    return value ? parseFloat(value) : undefined;
  }

  /**
   * Helper: Parse position
   */
  private static parsePosition(window: Element): { x: number; y: number } | undefined {
    const position = window.querySelector('position');
    if (position) {
      const x = position.getAttribute('x');
      const y = position.getAttribute('y');
      if (x && y) {
        return { x: parseInt(x), y: parseInt(y) };
      }
    }
    return undefined;
  }

  /**
   * Validate AWML document
   */
  static validate(awml: AWMLDocument): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate metadata
    if (!awml.metadata.name) {
      errors.push('Metadata name is required');
    }
    if (!awml.metadata.version) {
      errors.push('Metadata version is required');
    }

    // Validate runtime
    if (!awml.runtime.wasmSrc) {
      errors.push('Runtime WASM source is required');
    }

    if (awml.runtime.memory.initial > awml.runtime.memory.maximum) {
      errors.push('Initial memory cannot exceed maximum memory');
    }

    // Validate window
    if (awml.window.width < 100 || awml.window.height < 100) {
      errors.push('Window dimensions must be at least 100x100');
    }

    if (awml.window.minWidth && awml.window.width < awml.window.minWidth) {
      errors.push('Window width cannot be less than minWidth');
    }

    if (awml.window.minHeight && awml.window.height < awml.window.minHeight) {
      errors.push('Window height cannot be less than minHeight');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
