/**
 * App Manifest Type Definitions
 * Defines the structure of WebOS app manifests
 */

/**
 * Permission types available in WebOS
 */
export type PermissionType =
  | 'filesystem:read'
  | 'filesystem:write'
  | 'filesystem:delete'
  | 'network:fetch'
  | 'network:websocket'
  | 'clipboard:read'
  | 'clipboard:write'
  | 'notifications:show'
  | 'system:info'
  | 'windows:manage';

/**
 * App permissions configuration
 */
export interface AppPermissions {
  /** List of requested permissions */
  requested: PermissionType[];
  /** Optional permission descriptions shown to user */
  descriptions?: Record<PermissionType, string>;
}

/**
 * Configuration option for app settings
 */
export interface ConfigOption {
  /** Unique key for this config option */
  key: string;
  /** Display label */
  label: string;
  /** Type of input */
  type: 'text' | 'number' | 'boolean' | 'select' | 'color';
  /** Default value */
  default: string | number | boolean;
  /** Available options for select type */
  options?: Array<{ label: string; value: string | number }>;
  /** Optional description */
  description?: string;
}

/**
 * Window configuration for app
 */
export interface WindowConfig {
  /** Default window width in pixels */
  width: number;
  /** Default window height in pixels */
  height: number;
  /** Minimum window width */
  minWidth?: number;
  /** Minimum window height */
  minHeight?: number;
  /** Maximum window width */
  maxWidth?: number;
  /** Maximum window height */
  maxHeight?: number;
  /** Whether window is resizable */
  resizable?: boolean;
  /** Whether window can be maximized */
  maximizable?: boolean;
  /** Whether window can be minimized */
  minimizable?: boolean;
}

/**
 * App runtime configuration
 */
export interface AppRuntime {
  /** Entry point file (relative to app root) */
  entry: string;
  /** Runtime type */
  type: 'vue' | 'javascript' | 'iframe';
  /** Whether app can run multiple instances */
  multiInstance?: boolean;
  /** Auto-start on system boot */
  autoStart?: boolean;
}

/**
 * App category for organization
 */
export type AppCategory =
  | 'Utilities'
  | 'Games'
  | 'Productivity'
  | 'Graphics'
  | 'Audio'
  | 'Development'
  | 'System'
  | 'Network'
  | 'Education'
  | 'Other';

/**
 * Complete app manifest structure
 */
export interface AppManifest {
  /** Unique app identifier (reverse domain notation recommended) */
  id: string;
  /** App display name */
  name: string;
  /** Semantic version */
  version: string;
  /** Author name or organization */
  author: string;
  /** Short description of the app */
  description: string;
  /** Icon path or data URL */
  icon: string;
  /** App category */
  category: AppCategory;
  /** Window configuration */
  window: WindowConfig;
  /** Runtime configuration */
  runtime: AppRuntime;
  /** Required permissions */
  permissions: AppPermissions;
  /** User-configurable options */
  config?: ConfigOption[];
  /** Minimum WebOS version required */
  minWebOSVersion?: string;
  /** App homepage URL */
  homepage?: string;
  /** License identifier */
  license?: string;
}
