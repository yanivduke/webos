/**
 * Storage API Implementation
 * Provides per-app localStorage wrapper with key isolation
 */

import type { StorageAPI } from '../types/sdk-interfaces';

/**
 * Create Storage API instance
 * @param instanceId App instance ID (used for key prefixing)
 * @returns Storage API
 */
export function createStorageAPI(instanceId: string): StorageAPI {
  // Use instance ID as prefix to isolate storage between apps
  const prefix = `webos:storage:${instanceId}:`;

  /**
   * Get prefixed key
   */
  const getPrefixedKey = (key: string): string => {
    if (!key || typeof key !== 'string') {
      throw new Error('Storage key must be a non-empty string');
    }
    return `${prefix}${key}`;
  };

  /**
   * Check if a key belongs to this app
   */
  const isAppKey = (fullKey: string): boolean => {
    return fullKey.startsWith(prefix);
  };

  /**
   * Remove prefix from key
   */
  const removePrefixFromKey = (fullKey: string): string => {
    return fullKey.slice(prefix.length);
  };

  return {
    get<T = unknown>(key: string): T | null {
      try {
        const prefixedKey = getPrefixedKey(key);
        const value = localStorage.getItem(prefixedKey);

        if (value === null) {
          return null;
        }

        return JSON.parse(value) as T;
      } catch (error) {
        console.error(`[StorageAPI] Error getting key "${key}":`, error);
        return null;
      }
    },

    set(key: string, value: unknown): void {
      try {
        const prefixedKey = getPrefixedKey(key);
        const serialized = JSON.stringify(value);
        localStorage.setItem(prefixedKey, serialized);
        console.log(`[StorageAPI] Set ${key} for ${instanceId}`);
      } catch (error) {
        console.error(`[StorageAPI] Error setting key "${key}":`, error);

        // Check if quota exceeded
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          throw new Error('Storage quota exceeded. Please clear some data.');
        }

        throw new Error(`Failed to set storage key: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    remove(key: string): void {
      try {
        const prefixedKey = getPrefixedKey(key);
        localStorage.removeItem(prefixedKey);
        console.log(`[StorageAPI] Removed ${key} for ${instanceId}`);
      } catch (error) {
        console.error(`[StorageAPI] Error removing key "${key}":`, error);
      }
    },

    clear(): void {
      try {
        // Get all keys that belong to this app
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && isAppKey(key)) {
            keysToRemove.push(key);
          }
        }

        // Remove all app keys
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`[StorageAPI] Cleared ${keysToRemove.length} keys for ${instanceId}`);
      } catch (error) {
        console.error(`[StorageAPI] Error clearing storage:`, error);
        throw new Error(`Failed to clear storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    keys(): string[] {
      try {
        const appKeys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && isAppKey(key)) {
            appKeys.push(removePrefixFromKey(key));
          }
        }
        return appKeys;
      } catch (error) {
        console.error(`[StorageAPI] Error getting keys:`, error);
        return [];
      }
    }
  };
}
