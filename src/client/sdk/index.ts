/**
 * WebOS SDK - Main Entry Point
 * Client-side SDK for developing inner apps within WebOS
 *
 * @example
 * ```typescript
 * import { createWebOSSDK } from '@/sdk';
 *
 * // Your app manifest
 * const manifest: AppManifest = {
 *   id: 'com.example.myapp',
 *   name: 'My App',
 *   version: '1.0.0',
 *   // ... other fields
 * };
 *
 * // Create SDK instance
 * const webOS = createWebOSSDK(manifest);
 *
 * // Use SDK APIs
 * webOS.window.setTitle('Hello WebOS');
 * await webOS.fs.list('df0:/');
 * webOS.storage.set('key', 'value');
 * ```
 */

// Type exports
export type {
  AppManifest,
  AppPermissions,
  ConfigOption,
  WindowConfig,
  AppRuntime,
  AppCategory,
  PermissionType
} from './types/app-manifest';

export type {
  WebOSSDK,
  AppAPI,
  WindowAPI,
  FileSystemAPI,
  StorageAPI,
  EventsAPI,
  ClipboardAPI,
  UIAPI,
  FileItem,
  DialogOptions,
  DialogResult,
  MenuItem,
  Menu,
  NotificationOptions,
  WindowPosition,
  WindowSize,
  RunningApp,
  AppState
} from './types/sdk-interfaces';

// Lifecycle exports
export { AppRegistry, appRegistry } from './lifecycle/app-registry';
export { AppSandbox, createSandboxedSDK } from './lifecycle/app-sandbox';

// API exports
export * from './api';

// Main SDK creation
import type { AppManifest } from './types/app-manifest';
import type { WebOSSDK } from './types/sdk-interfaces';
import { appRegistry } from './lifecycle/app-registry';
import { createSandboxedSDK } from './lifecycle/app-sandbox';

/**
 * Create a WebOS SDK instance for an app
 *
 * This is the primary entry point for inner apps to access WebOS functionality.
 * The SDK is automatically sandboxed based on the app's requested permissions.
 *
 * @param manifest - App manifest with permissions and configuration
 * @param windowId - Optional window ID if app has a window
 * @returns Sandboxed WebOS SDK instance
 *
 * @example
 * ```typescript
 * const webOS = createWebOSSDK({
 *   id: 'com.example.notepad',
 *   name: 'NotePad',
 *   version: '1.0.0',
 *   author: 'Example Dev',
 *   description: 'Simple text editor',
 *   icon: '/icons/notepad.png',
 *   category: 'Productivity',
 *   window: { width: 600, height: 400, resizable: true },
 *   runtime: { entry: 'main.js', type: 'vue' },
 *   permissions: {
 *     requested: ['filesystem:read', 'filesystem:write']
 *   }
 * });
 *
 * // Now use the SDK
 * const files = await webOS.fs.list('df0:/documents');
 * ```
 */
export function createWebOSSDK(
  manifest: AppManifest,
  windowId?: string
): WebOSSDK {
  try {
    // Validate manifest
    if (!manifest || typeof manifest !== 'object') {
      throw new Error('Manifest must be a valid object');
    }

    if (!manifest.id || typeof manifest.id !== 'string') {
      throw new Error('Manifest must have a valid id');
    }

    if (!manifest.permissions || !Array.isArray(manifest.permissions.requested)) {
      throw new Error('Manifest must have valid permissions.requested array');
    }

    // Register app in registry
    const instanceId = appRegistry.register(manifest, windowId);

    // Create sandboxed SDK
    const sdk = createSandboxedSDK(manifest, instanceId, windowId);

    // Store SDK in registry
    appRegistry.setSDK(instanceId, sdk);

    console.log(`[WebOS SDK] Created SDK for ${manifest.name} (${instanceId})`);

    return sdk;
  } catch (error) {
    console.error('[WebOS SDK] Failed to create SDK:', error);
    throw error;
  }
}

/**
 * Get the SDK instance for a running app
 *
 * @param instanceId - App instance ID
 * @returns SDK instance or undefined if not found
 */
export function getSDKInstance(instanceId: string): WebOSSDK | undefined {
  const app = appRegistry.getApp(instanceId);
  return app?.sdk;
}

/**
 * Check if SDK is available in the current environment
 *
 * @returns True if SDK can be initialized
 */
export function isSDKAvailable(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/**
 * Get SDK version
 *
 * @returns SDK version string
 */
export function getSDKVersion(): string {
  return '1.0.0';
}
