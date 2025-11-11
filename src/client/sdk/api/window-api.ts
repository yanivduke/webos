/**
 * Window API Implementation
 * Provides window management methods
 */

import type { WindowAPI, WindowPosition, WindowSize } from '../types/sdk-interfaces';

/**
 * Create Window API instance
 * @param instanceId App instance ID
 * @param windowId Window ID
 * @param checkPermission Permission check callback
 * @returns Window API
 */
export function createWindowAPI(
  instanceId: string,
  windowId: string | undefined,
  checkPermission: () => void
): WindowAPI {
  /**
   * Emit window event to parent desktop
   */
  const emitWindowEvent = (action: string, data?: unknown) => {
    if (!windowId) {
      console.warn(`[WindowAPI] No window ID for ${instanceId}, cannot perform action: ${action}`);
      return;
    }

    window.dispatchEvent(new CustomEvent('webos:window:action', {
      detail: {
        instanceId,
        windowId,
        action,
        data
      }
    }));

    console.log(`[WindowAPI] Emitted ${action} for window ${windowId}`);
  };

  return {
    setTitle(title: string): void {
      emitWindowEvent('setTitle', { title });
    },

    resize(width: number, height: number): void {
      checkPermission();

      if (width <= 0 || height <= 0) {
        throw new Error('Width and height must be positive numbers');
      }

      emitWindowEvent('resize', { width, height });
    },

    minimize(): void {
      emitWindowEvent('minimize');
    },

    maximize(): void {
      emitWindowEvent('maximize');
    },

    restore(): void {
      emitWindowEvent('restore');
    },

    setPosition(x: number, y: number): void {
      checkPermission();
      emitWindowEvent('setPosition', { x, y });
    },

    getPosition(): WindowPosition {
      // This would need to query the actual window element
      // For now, dispatch event and return cached/default position
      const event = new CustomEvent('webos:window:query', {
        detail: { instanceId, windowId, query: 'position' }
      });
      window.dispatchEvent(event);

      // Return default - in a real implementation, this would be synchronous
      // via a shared state or async via promises
      console.warn('[WindowAPI] getPosition() returns default values - implement state sync');
      return { x: 0, y: 0 };
    },

    getSize(): WindowSize {
      // This would need to query the actual window element
      const event = new CustomEvent('webos:window:query', {
        detail: { instanceId, windowId, query: 'size' }
      });
      window.dispatchEvent(event);

      // Return default - in a real implementation, this would be synchronous
      console.warn('[WindowAPI] getSize() returns default values - implement state sync');
      return { width: 400, height: 300 };
    },

    focus(): void {
      emitWindowEvent('focus');
    }
  };
}
