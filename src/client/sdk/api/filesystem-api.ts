/**
 * File System API Implementation
 * Provides file operations with permission checks
 */

import type { FileSystemAPI, FileItem } from '../types/sdk-interfaces';

/**
 * Create File System API instance
 * @param instanceId App instance ID
 * @param validatePath Path validation callback
 * @param checkPermission Permission check callback (pass true for write, false for read)
 * @returns File System API
 */
export function createFileSystemAPI(
  instanceId: string,
  validatePath: (path: string) => void,
  checkPermission: (write: boolean) => void
): FileSystemAPI {
  const API_BASE = '/api/files';

  /**
   * Make API request
   */
  const apiRequest = async (
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<unknown> => {
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-App-Id': instanceId
        }
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${API_BASE}${endpoint}`, options);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[FileSystemAPI] Request failed:`, error);
      throw error;
    }
  };

  return {
    async read(path: string): Promise<string> {
      validatePath(path);
      checkPermission(false);

      console.log(`[FileSystemAPI] Reading file: ${path}`);
      const response = await apiRequest('GET', `/read?path=${encodeURIComponent(path)}`);
      return (response as { content: string }).content;
    },

    async write(path: string, content: string): Promise<void> {
      validatePath(path);
      checkPermission(true);

      console.log(`[FileSystemAPI] Writing file: ${path}`);
      await apiRequest('POST', '/write', { path, content });
    },

    async list(path: string): Promise<FileItem[]> {
      validatePath(path);
      checkPermission(false);

      console.log(`[FileSystemAPI] Listing directory: ${path}`);
      const response = await apiRequest('GET', `?path=${encodeURIComponent(path)}`);
      return (response as { items: FileItem[] }).items || [];
    },

    async exists(path: string): Promise<boolean> {
      validatePath(path);
      checkPermission(false);

      try {
        console.log(`[FileSystemAPI] Checking existence: ${path}`);
        const response = await apiRequest('GET', `/exists?path=${encodeURIComponent(path)}`);
        return (response as { exists: boolean }).exists;
      } catch (error) {
        // If endpoint doesn't exist, fall back to trying to list and catching error
        try {
          await this.list(path);
          return true;
        } catch {
          return false;
        }
      }
    },

    async delete(path: string): Promise<void> {
      validatePath(path);
      checkPermission(true);

      console.log(`[FileSystemAPI] Deleting: ${path}`);
      await apiRequest('DELETE', '', { path });
    },

    async mkdir(path: string): Promise<void> {
      validatePath(path);
      checkPermission(true);

      console.log(`[FileSystemAPI] Creating directory: ${path}`);
      await apiRequest('POST', '/mkdir', { path });
    },

    async copy(source: string, destination: string): Promise<void> {
      validatePath(source);
      validatePath(destination);
      checkPermission(true);

      console.log(`[FileSystemAPI] Copying ${source} to ${destination}`);
      await apiRequest('POST', '/copy', { source, destination });
    },

    async move(source: string, destination: string): Promise<void> {
      validatePath(source);
      validatePath(destination);
      checkPermission(true);

      console.log(`[FileSystemAPI] Moving ${source} to ${destination}`);
      await apiRequest('POST', '/move', { source, destination });
    }
  };
}
