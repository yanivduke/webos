/**
 * App API Implementation
 * Provides app lifecycle and metadata methods
 */

import type { AppManifest } from '../types/app-manifest';
import type { AppAPI, WebOSSDK } from '../types/sdk-interfaces';
import { appRegistry } from '../lifecycle/app-registry';

/**
 * Create App API instance
 * @param manifest App manifest
 * @param instanceId App instance ID
 * @param sdk SDK instance (for exit functionality)
 * @returns App API
 */
export function createAppAPI(
  manifest: AppManifest,
  instanceId: string,
  sdk: WebOSSDK
): AppAPI {
  // Store config in localStorage with app-specific prefix
  const configPrefix = `webos:app:${instanceId}:config:`;

  return {
    getManifest(): AppManifest {
      return manifest;
    },

    getId(): string {
      return instanceId;
    },

    getConfig(key: string): unknown {
      try {
        const storedValue = localStorage.getItem(`${configPrefix}${key}`);
        if (storedValue === null) {
          // Return default value from manifest if available
          const configOption = manifest.config?.find(opt => opt.key === key);
          return configOption?.default ?? null;
        }
        return JSON.parse(storedValue);
      } catch (error) {
        console.error(`[AppAPI] Error getting config ${key}:`, error);
        return null;
      }
    },

    setConfig(key: string, value: unknown): void {
      try {
        // Validate that config key exists in manifest
        const configOption = manifest.config?.find(opt => opt.key === key);
        if (!configOption) {
          console.warn(`[AppAPI] Config key "${key}" not defined in manifest`);
        }

        localStorage.setItem(`${configPrefix}${key}`, JSON.stringify(value));
        console.log(`[AppAPI] Config ${key} set for ${instanceId}`);
      } catch (error) {
        console.error(`[AppAPI] Error setting config ${key}:`, error);
        throw new Error(`Failed to set config: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    exit(): void {
      console.log(`[AppAPI] Exiting app ${instanceId}`);

      // Emit exit event for cleanup
      sdk.events.emit('app:exit');

      // Unregister from app registry
      appRegistry.unregister(instanceId);

      // Emit global event that desktop can listen to
      window.dispatchEvent(new CustomEvent('webos:app:exit', {
        detail: { instanceId, appId: manifest.id }
      }));
    }
  };
}
