/**
 * WebOS SDK Interface Definitions
 * Core interfaces for the WebOS SDK
 */

import type { AppManifest } from './app-manifest';

/**
 * File system item representation
 */
export interface FileItem {
  /** File/folder name */
  name: string;
  /** Type of item */
  type: 'file' | 'folder';
  /** File size in bytes (for files) */
  size?: number;
  /** File extension (for files) */
  extension?: string;
  /** Icon identifier */
  icon?: string;
  /** Last modified timestamp */
  modified?: number;
  /** Full path */
  path: string;
}

/**
 * Dialog options for UI dialogs
 */
export interface DialogOptions {
  /** Dialog title */
  title: string;
  /** Dialog message/content */
  message: string;
  /** Dialog type */
  type: 'info' | 'warning' | 'error' | 'confirm' | 'prompt';
  /** Button labels (defaults to OK/Cancel based on type) */
  buttons?: string[];
  /** Default button index */
  defaultButton?: number;
  /** Default input value for prompt type */
  defaultValue?: string;
}

/**
 * Dialog result
 */
export interface DialogResult {
  /** Button index clicked */
  buttonIndex: number;
  /** Input value (for prompt type) */
  value?: string;
}

/**
 * Menu item definition
 */
export interface MenuItem {
  /** Item label */
  label: string;
  /** Unique identifier */
  id: string;
  /** Whether item is disabled */
  disabled?: boolean;
  /** Whether item is checked (for toggle items) */
  checked?: boolean;
  /** Keyboard shortcut */
  shortcut?: string;
  /** Submenu items */
  submenu?: MenuItem[];
  /** Separator (if true, other properties ignored) */
  separator?: boolean;
  /** Click handler */
  onClick?: () => void;
}

/**
 * Menu definition
 */
export interface Menu {
  /** Menu items */
  items: MenuItem[];
}

/**
 * Notification options
 */
export interface NotificationOptions {
  /** Notification title */
  title: string;
  /** Notification body */
  body: string;
  /** Icon URL */
  icon?: string;
  /** Duration in milliseconds (0 = persistent) */
  duration?: number;
}

/**
 * Window position
 */
export interface WindowPosition {
  x: number;
  y: number;
}

/**
 * Window size
 */
export interface WindowSize {
  width: number;
  height: number;
}

/**
 * Running app state
 */
export type AppState = 'running' | 'paused' | 'stopped';

/**
 * Running app information
 */
export interface RunningApp {
  /** App manifest */
  manifest: AppManifest;
  /** App state */
  state: AppState;
  /** Window ID (if app has a window) */
  windowId?: string;
  /** App instance start time */
  startTime: number;
  /** App SDK instance */
  sdk?: WebOSSDK;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * App API - App lifecycle and metadata
 */
export interface AppAPI {
  /** Get app manifest */
  getManifest(): AppManifest;
  /** Get app ID */
  getId(): string;
  /** Get app config value */
  getConfig(key: string): unknown;
  /** Set app config value */
  setConfig(key: string, value: unknown): void;
  /** Exit the app */
  exit(): void;
}

/**
 * Window API - Window management
 */
export interface WindowAPI {
  /** Set window title */
  setTitle(title: string): void;
  /** Resize window */
  resize(width: number, height: number): void;
  /** Minimize window */
  minimize(): void;
  /** Maximize window */
  maximize(): void;
  /** Restore window to normal size */
  restore(): void;
  /** Set window position */
  setPosition(x: number, y: number): void;
  /** Get window position */
  getPosition(): WindowPosition;
  /** Get window size */
  getSize(): WindowSize;
  /** Focus window */
  focus(): void;
}

/**
 * File System API - File operations with permission checks
 */
export interface FileSystemAPI {
  /** Read file contents */
  read(path: string): Promise<string>;
  /** Write file contents */
  write(path: string, content: string): Promise<void>;
  /** List directory contents */
  list(path: string): Promise<FileItem[]>;
  /** Check if file/folder exists */
  exists(path: string): Promise<boolean>;
  /** Delete file/folder */
  delete(path: string): Promise<void>;
  /** Create directory */
  mkdir(path: string): Promise<void>;
  /** Copy file/folder */
  copy(source: string, destination: string): Promise<void>;
  /** Move/rename file/folder */
  move(source: string, destination: string): Promise<void>;
}

/**
 * Storage API - Persistent key-value storage
 */
export interface StorageAPI {
  /** Get value by key */
  get<T = unknown>(key: string): T | null;
  /** Set value by key */
  set(key: string, value: unknown): void;
  /** Remove value by key */
  remove(key: string): void;
  /** Clear all app storage */
  clear(): void;
  /** Get all keys */
  keys(): string[];
}

/**
 * Events API - Event subscription and emission
 */
export interface EventsAPI {
  /** Subscribe to event */
  on(event: string, handler: (...args: unknown[]) => void): void;
  /** Unsubscribe from event */
  off(event: string, handler: (...args: unknown[]) => void): void;
  /** Emit event */
  emit(event: string, ...args: unknown[]): void;
  /** Subscribe to event once */
  once(event: string, handler: (...args: unknown[]) => void): void;
}

/**
 * Clipboard API - Clipboard operations
 */
export interface ClipboardAPI {
  /** Read text from clipboard */
  readText(): Promise<string>;
  /** Write text to clipboard */
  writeText(text: string): Promise<void>;
}

/**
 * UI API - UI helpers and dialogs
 */
export interface UIAPI {
  /** Show dialog */
  showDialog(options: DialogOptions): Promise<DialogResult>;
  /** Show notification */
  showNotification(options: NotificationOptions): void;
  /** Create context menu */
  createMenu(menu: Menu): void;
}

/**
 * Main WebOS SDK Interface
 */
export interface WebOSSDK {
  /** App lifecycle and metadata API */
  app: AppAPI;
  /** Window management API */
  window: WindowAPI;
  /** File system API */
  fs: FileSystemAPI;
  /** Storage API */
  storage: StorageAPI;
  /** Events API */
  events: EventsAPI;
  /** Clipboard API */
  clipboard: ClipboardAPI;
  /** UI API */
  ui: UIAPI;
}
