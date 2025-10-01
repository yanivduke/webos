import { AwmlDescriptor, AwmlExecutionResult, AwmlRuntimeHooks } from './types';

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

const resolveRelativePath = (basePath: string, relative: string) => {
  if (!relative) return basePath;
  if (relative.startsWith('/')) return relative.replace(/^\/+/, '');
  const segments = basePath.split('/').filter(Boolean);
  segments.pop();
  for (const part of relative.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      segments.pop();
    } else {
      segments.push(part);
    }
  }
  return segments.join('/');
};

const extractText = (doc: Document, selector: string) => {
  const el = doc.querySelector(selector);
  return el?.textContent?.trim() || undefined;
};

export async function loadAwmlDescriptor(filePath: string): Promise<AwmlDescriptor> {
  const response = await fetch('/api/files/read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: filePath })
  });

  if (!response.ok) {
    throw new Error(`Failed to load AWML file: ${filePath}`);
  }

  const payload = await response.json();
  const source = payload.content as string;

  const parser = new DOMParser();
  const xml = parser.parseFromString(source, 'application/xml');
  const parserError = xml.querySelector('parsererror');
  if (parserError) {
    throw new Error(`Invalid AWML XML: ${parserError.textContent}`);
  }

  const moduleElement = xml.querySelector('module');
  if (!moduleElement) {
    throw new Error('AWML file is missing <module> declaration');
  }

  const moduleSrc = moduleElement.getAttribute('src');
  if (!moduleSrc) {
    throw new Error('AWML module declaration missing "src" attribute');
  }

  const entry = moduleElement.getAttribute('entry') || 'awml_entry';
  const descriptor: AwmlDescriptor = {
    filePath,
    modulePath: resolveRelativePath(filePath, moduleSrc),
    entry,
    config: {},
    metadata: {
      name: moduleElement.getAttribute('name') || payload.name || filePath.split('/').pop() || 'AWML Module',
      version: moduleElement.getAttribute('version') || extractText(xml, 'metadata > version'),
      author: moduleElement.getAttribute('author') || extractText(xml, 'metadata > author'),
      description: extractText(xml, 'metadata > description')
    }
  };

  xml.querySelectorAll('config > setting').forEach(setting => {
    const key = setting.getAttribute('name');
    const value = setting.getAttribute('value') ?? setting.textContent ?? '';
    if (key) {
      descriptor.config[key] = value.trim();
    }
  });

  return descriptor;
}

export async function executeAwml(descriptor: AwmlDescriptor, hooks: AwmlRuntimeHooks = {}): Promise<AwmlExecutionResult> {
  const { modulePath, entry, config } = descriptor;

  hooks.onStatus?.(`Fetching WebAssembly module: ${modulePath}`);
  const wasmResponse = await fetch(`/api/files/raw?path=${encodeURIComponent(modulePath)}`);
  if (!wasmResponse.ok) {
    throw new Error(`Failed to fetch WebAssembly module at ${modulePath}`);
  }

  const wasmBytes = await wasmResponse.arrayBuffer();

  const logFn = hooks.onLog ?? (() => undefined);
  let memoryRef: WebAssembly.Memory | null = null;
  let instance: WebAssembly.Instance;

  const importObject: WebAssembly.Imports = {
    env: {
      awml_log: (ptr: number, len: number) => {
        if (!memoryRef) {
          logFn('[awml] log called before memory initialised');
          return;
        }
        const bytes = new Uint8Array(memoryRef.buffer, ptr, len);
        const message = textDecoder.decode(bytes);
        logFn(message);
      }
    }
  };

  hooks.onStatus?.('Instantiating WebAssembly runtime');
  const startedAt = new Date().toISOString();
  const { instance: wasmInstance } = await WebAssembly.instantiate(wasmBytes, importObject);
  instance = wasmInstance;

  const exports = instance.exports as Record<string, any>;
  const memory = exports.memory as WebAssembly.Memory | undefined;
  if (!memory) {
    throw new Error('AWML module must export memory');
  }
  memoryRef = memory;

  const entryFn = exports[entry] as ((...args: any[]) => any) | undefined;
  if (typeof entryFn !== 'function') {
    throw new Error(`AWML module is missing entry function "${entry}"`);
  }

  const allocator = (exports.awml_alloc || exports.malloc) as ((len: number) => number) | undefined;
  const configJson = JSON.stringify(config);
  const configBytes = textEncoder.encode(configJson);
  let configPtr = 0;

  if (allocator) {
    configPtr = allocator(configBytes.length);
    const view = new Uint8Array(memory.buffer, configPtr, configBytes.length);
    view.set(configBytes);
  }

  hooks.onStatus?.('Executing AWML entry point');
  try {
    if (entryFn.length >= 2 && allocator) {
      entryFn(configPtr, configBytes.length);
    } else {
      entryFn();
    }
  } catch (error) {
    throw new Error(`AWML execution failed: ${(error as Error).message}`);
  }

  const finishedAt = new Date().toISOString();
  return {
    descriptor,
    startedAt,
    finishedAt
  };
}
