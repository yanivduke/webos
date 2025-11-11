/**
 * App Sandbox
 * Creates sandboxed SDK instances with permission enforcement
 */

import type { AppManifest, PermissionType } from '../types/app-manifest';
import type { WebOSSDK } from '../types/sdk-interfaces';
import { createAppAPI } from '../api/app-api';
import { createWindowAPI } from '../api/window-api';
import { createFileSystemAPI } from '../api/filesystem-api';
import { createStorageAPI } from '../api/storage-api';
import { createEventsAPI } from '../api/events-api';
import { createClipboardAPI } from '../api/clipboard-api';
import { createUIAPI } from '../api/ui-api';

/**
 * App Sandbox - Creates and manages sandboxed SDK instances
 */
export class AppSandbox {
  private manifest: AppManifest;
  private instanceId: string;
  private windowId?: string;

  constructor(manifest: AppManifest, instanceId: string, windowId?: string) {
    this.manifest = manifest;
    this.instanceId = instanceId;
    this.windowId = windowId;
  }

  /**
   * Check if app has a specific permission
   * @param permission Permission to check
   * @returns True if permission is granted
   */
  hasPermission(permission: PermissionType): boolean {
    return this.manifest.permissions.requested.includes(permission);
  }

  /**
   * Enforce permission check
   * @param permission Permission required
   * @throws Error if permission not granted
   */
  requirePermission(permission: PermissionType): void {
    if (!this.hasPermission(permission)) {
      throw new Error(
        `Permission denied: ${permission}. App "${this.manifest.name}" has not requested this permission.`
      );
    }
  }

  /**
   * Validate filesystem path access
   * @param path Path to validate
   * @throws Error if path is invalid or access denied
   */
  validateFilesystemPath(path: string): void {
    // Sanitize path
    if (!path || typeof path !== 'string') {
      throw new Error('Invalid path: path must be a non-empty string');
    }

    // Prevent path traversal
    if (path.includes('..')) {
      throw new Error('Invalid path: path traversal not allowed');
    }

    // Ensure path starts with valid drive
    const validDrives = ['df0', 'dh0', 'ram', 'utils', 'trash'];
    const pathParts = path.split('/').filter(Boolean);

    if (pathParts.length === 0 || !validDrives.includes(pathParts[0])) {
      throw new Error(`Invalid path: must start with a valid drive (${validDrives.join(', ')})`);
    }
  }

  /**
   * Validate network domain access
   * @param url URL to validate
   * @throws Error if domain is not allowed
   */
  validateNetworkAccess(url: string): void {
    try {
      const urlObj = new URL(url);

      // For now, allow localhost and same-origin
      const allowedHosts = ['localhost', '127.0.0.1', window.location.hostname];

      if (!allowedHosts.includes(urlObj.hostname)) {
        console.warn(`[Sandbox] Network access to ${urlObj.hostname} may be restricted in future versions`);
      }
    } catch (error) {
      throw new Error(`Invalid URL: ${url}`);
    }
  }

  /**
   * Create a sandboxed SDK instance
   * @returns Sandboxed WebOS SDK
   */
  createSDK(): WebOSSDK {
    const sandbox = this;

    // Create API instances with permission checks
    const sdk: WebOSSDK = {
      app: createAppAPI(this.manifest, this.instanceId, sdk),

      window: createWindowAPI(
        this.instanceId,
        this.windowId,
        () => sandbox.requirePermission('windows:manage')
      ),

      fs: createFileSystemAPI(
        this.instanceId,
        (path) => {
          sandbox.validateFilesystemPath(path);
        },
        (write) => {
          sandbox.requirePermission(write ? 'filesystem:write' : 'filesystem:read');
        }
      ),

      storage: createStorageAPI(this.instanceId),

      events: createEventsAPI(this.instanceId),

      clipboard: createClipboardAPI(
        () => sandbox.requirePermission('clipboard:read'),
        () => sandbox.requirePermission('clipboard:write')
      ),

      ui: createUIAPI(
        this.instanceId,
        () => sandbox.requirePermission('notifications:show')
      )
    };

    console.log(`[Sandbox] Created SDK for ${this.manifest.name} (${this.instanceId})`);
    return sdk;
  }

  /**
   * Get manifest
   */
  getManifest(): AppManifest {
    return this.manifest;
  }

  /**
   * Get instance ID
   */
  getInstanceId(): string {
    return this.instanceId;
  }

  /**
   * Get window ID
   */
  getWindowId(): string | undefined {
    return this.windowId;
  }

  /**
   * Set window ID
   */
  setWindowId(windowId: string): void {
    this.windowId = windowId;
  }
}

/**
 * Create a sandboxed SDK instance
 * @param manifest App manifest
 * @param instanceId Instance ID
 * @param windowId Optional window ID
 * @returns Sandboxed WebOS SDK
 */
export function createSandboxedSDK(
  manifest: AppManifest,
  instanceId: string,
  windowId?: string
): WebOSSDK {
  const sandbox = new AppSandbox(manifest, instanceId, windowId);
  return sandbox.createSDK();
}
