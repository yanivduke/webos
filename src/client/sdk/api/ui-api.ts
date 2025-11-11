/**
 * UI API Implementation
 * Provides UI helpers like dialogs, notifications, and menus
 */

import type {
  UIAPI,
  DialogOptions,
  DialogResult,
  NotificationOptions,
  Menu
} from '../types/sdk-interfaces';

/**
 * Create UI API instance
 * @param instanceId App instance ID
 * @param checkNotificationPermission Permission check for notifications
 * @returns UI API
 */
export function createUIAPI(
  instanceId: string,
  checkNotificationPermission: () => void
): UIAPI {
  return {
    async showDialog(options: DialogOptions): Promise<DialogResult> {
      console.log(`[UIAPI] Showing dialog for ${instanceId}:`, options.title);

      // Emit event that AmigaDesktop can listen to
      return new Promise((resolve) => {
        const eventId = `dialog-${Date.now()}-${Math.random()}`;

        // Listen for dialog response
        const handleResponse = (event: Event) => {
          const customEvent = event as CustomEvent;
          if (customEvent.detail.eventId === eventId) {
            window.removeEventListener('webos:dialog:response', handleResponse);
            resolve(customEvent.detail.result);
          }
        };

        window.addEventListener('webos:dialog:response', handleResponse);

        // Emit dialog request
        window.dispatchEvent(new CustomEvent('webos:dialog:show', {
          detail: {
            instanceId,
            eventId,
            options
          }
        }));

        // Fallback timeout (30 seconds)
        setTimeout(() => {
          window.removeEventListener('webos:dialog:response', handleResponse);
          console.warn('[UIAPI] Dialog timed out');
          resolve({ buttonIndex: -1 });
        }, 30000);
      });
    },

    showNotification(options: NotificationOptions): void {
      checkNotificationPermission();

      console.log(`[UIAPI] Showing notification for ${instanceId}:`, options.title);

      // Emit event that AmigaDesktop can listen to
      window.dispatchEvent(new CustomEvent('webos:notification:show', {
        detail: {
          instanceId,
          options
        }
      }));

      // Auto-dismiss after duration (default 5 seconds)
      const duration = options.duration ?? 5000;
      if (duration > 0) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('webos:notification:dismiss', {
            detail: { instanceId }
          }));
        }, duration);
      }
    },

    createMenu(menu: Menu): void {
      console.log(`[UIAPI] Creating menu for ${instanceId} with ${menu.items.length} items`);

      // Emit event that AmigaDesktop can listen to
      window.dispatchEvent(new CustomEvent('webos:menu:create', {
        detail: {
          instanceId,
          menu
        }
      }));

      // When menu items are clicked, the desktop will emit events back
      // Apps should listen via events.on('menu:click', handler)
    }
  };
}
