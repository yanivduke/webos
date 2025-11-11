/**
 * Clipboard API Implementation
 * Provides clipboard read/write operations
 */

import type { ClipboardAPI } from '../types/sdk-interfaces';

/**
 * Create Clipboard API instance
 * @param checkReadPermission Permission check for read operations
 * @param checkWritePermission Permission check for write operations
 * @returns Clipboard API
 */
export function createClipboardAPI(
  checkReadPermission: () => void,
  checkWritePermission: () => void
): ClipboardAPI {
  return {
    async readText(): Promise<string> {
      checkReadPermission();

      try {
        // Check if clipboard API is available
        if (!navigator.clipboard || !navigator.clipboard.readText) {
          throw new Error('Clipboard API not available in this browser');
        }

        // Check if in secure context (HTTPS or localhost)
        if (!window.isSecureContext) {
          throw new Error('Clipboard API requires secure context (HTTPS)');
        }

        const text = await navigator.clipboard.readText();
        console.log('[ClipboardAPI] Read text from clipboard');
        return text;
      } catch (error) {
        console.error('[ClipboardAPI] Error reading from clipboard:', error);

        // Handle permission denied
        if (error instanceof Error && error.name === 'NotAllowedError') {
          throw new Error('Clipboard read permission denied by browser');
        }

        throw new Error(
          `Failed to read from clipboard: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    },

    async writeText(text: string): Promise<void> {
      checkWritePermission();

      try {
        // Check if clipboard API is available
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
          throw new Error('Clipboard API not available in this browser');
        }

        // Check if in secure context (HTTPS or localhost)
        if (!window.isSecureContext) {
          throw new Error('Clipboard API requires secure context (HTTPS)');
        }

        if (typeof text !== 'string') {
          throw new Error('Clipboard text must be a string');
        }

        await navigator.clipboard.writeText(text);
        console.log('[ClipboardAPI] Wrote text to clipboard');
      } catch (error) {
        console.error('[ClipboardAPI] Error writing to clipboard:', error);

        // Handle permission denied
        if (error instanceof Error && error.name === 'NotAllowedError') {
          throw new Error('Clipboard write permission denied by browser');
        }

        throw new Error(
          `Failed to write to clipboard: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  };
}
