/**
 * Events API Implementation
 * Provides event subscription and emission
 */

import type { EventsAPI } from '../types/sdk-interfaces';

/**
 * Event handler type
 */
type EventHandler = (...args: unknown[]) => void;

/**
 * Create Events API instance
 * @param instanceId App instance ID (for logging)
 * @returns Events API
 */
export function createEventsAPI(instanceId: string): EventsAPI {
  // Event listeners map: event name -> array of handlers
  const listeners = new Map<string, EventHandler[]>();

  return {
    on(event: string, handler: EventHandler): void {
      if (!event || typeof event !== 'string') {
        throw new Error('Event name must be a non-empty string');
      }

      if (typeof handler !== 'function') {
        throw new Error('Event handler must be a function');
      }

      // Get or create handler array for this event
      let handlers = listeners.get(event);
      if (!handlers) {
        handlers = [];
        listeners.set(event, handlers);
      }

      // Add handler if not already registered
      if (!handlers.includes(handler)) {
        handlers.push(handler);
        console.log(`[EventsAPI] Registered handler for "${event}" (${instanceId})`);
      }
    },

    off(event: string, handler: EventHandler): void {
      if (!event || typeof event !== 'string') {
        throw new Error('Event name must be a non-empty string');
      }

      if (typeof handler !== 'function') {
        throw new Error('Event handler must be a function');
      }

      const handlers = listeners.get(event);
      if (!handlers) {
        return;
      }

      // Remove handler from array
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
        console.log(`[EventsAPI] Unregistered handler for "${event}" (${instanceId})`);
      }

      // Clean up empty handler arrays
      if (handlers.length === 0) {
        listeners.delete(event);
      }
    },

    emit(event: string, ...args: unknown[]): void {
      if (!event || typeof event !== 'string') {
        throw new Error('Event name must be a non-empty string');
      }

      const handlers = listeners.get(event);
      if (!handlers || handlers.length === 0) {
        console.log(`[EventsAPI] No handlers for event "${event}" (${instanceId})`);
        return;
      }

      console.log(`[EventsAPI] Emitting "${event}" to ${handlers.length} handler(s) (${instanceId})`);

      // Call all handlers
      // Use slice to avoid issues if handlers modify the array
      handlers.slice().forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`[EventsAPI] Error in handler for "${event}":`, error);
        }
      });
    },

    once(event: string, handler: EventHandler): void {
      if (!event || typeof event !== 'string') {
        throw new Error('Event name must be a non-empty string');
      }

      if (typeof handler !== 'function') {
        throw new Error('Event handler must be a function');
      }

      // Create wrapper that removes itself after first call
      const onceWrapper: EventHandler = (...args: unknown[]) => {
        this.off(event, onceWrapper);
        handler(...args);
      };

      this.on(event, onceWrapper);
    }
  };
}
