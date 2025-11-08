/**
 * Focus Trap Directive
 *
 * Traps keyboard focus within a container element (e.g., modals, dialogs).
 * Implements WCAG 2.1 focus management patterns.
 */

import type { ObjectDirective, DirectiveBinding } from 'vue';
import { accessibilityManager } from '../utils/accessibility-manager';

interface FocusTrapState {
  previousFocus: HTMLElement | null;
  keydownHandler: (e: KeyboardEvent) => void;
  focusInHandler: (e: FocusEvent) => void;
  isActive: boolean;
}

const trapStates = new WeakMap<HTMLElement, FocusTrapState>();

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selectors = [
    'a[href]',
    'button:not([disabled]):not([aria-hidden="true"])',
    'textarea:not([disabled]):not([aria-hidden="true"])',
    'input:not([disabled]):not([aria-hidden="true"])',
    'select:not([disabled]):not([aria-hidden="true"])',
    '[tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])',
    '[contenteditable="true"]'
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(selectors))
    .filter(el => {
      // Filter out invisible elements
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
    });
}

/**
 * Handle Tab key to trap focus
 */
function handleTabKey(container: HTMLElement, event: KeyboardEvent): void {
  const focusableElements = getFocusableElements(container);

  if (focusableElements.length === 0) {
    event.preventDefault();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  const activeElement = document.activeElement as HTMLElement;

  if (event.shiftKey) {
    // Shift + Tab: moving backward
    if (activeElement === firstElement || !container.contains(activeElement)) {
      event.preventDefault();
      lastElement.focus();
    }
  } else {
    // Tab: moving forward
    if (activeElement === lastElement || !container.contains(activeElement)) {
      event.preventDefault();
      firstElement.focus();
    }
  }
}

/**
 * Setup focus trap for an element
 */
function setupFocusTrap(el: HTMLElement, binding: DirectiveBinding): void {
  // Store previous focus to restore later
  const previousFocus = document.activeElement as HTMLElement;

  // Create keyboard event handler
  const keydownHandler = (event: KeyboardEvent) => {
    const state = trapStates.get(el);
    if (!state || !state.isActive) return;

    if (event.key === 'Tab') {
      handleTabKey(el, event);
    } else if (event.key === 'Escape' && binding.value?.escapeDeactivates !== false) {
      // Allow escape to deactivate trap if enabled
      event.preventDefault();
      deactivateFocusTrap(el);

      if (binding.value?.onEscape) {
        binding.value.onEscape();
      }
    }
  };

  // Create focus event handler to prevent focus leaving container
  const focusInHandler = (event: FocusEvent) => {
    const state = trapStates.get(el);
    if (!state || !state.isActive) return;

    const target = event.target as HTMLElement;

    // If focus moved outside container, bring it back
    if (target && !el.contains(target)) {
      event.preventDefault();
      const focusableElements = getFocusableElements(el);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  };

  // Store state
  trapStates.set(el, {
    previousFocus,
    keydownHandler,
    focusInHandler,
    isActive: true
  });

  // Add event listeners
  document.addEventListener('keydown', keydownHandler);
  document.addEventListener('focusin', focusInHandler, true);

  // Register with accessibility manager
  accessibilityManager.addFocusTrap(el);

  // Auto-focus first element if specified
  if (binding.value?.autoFocus !== false) {
    setTimeout(() => {
      const focusableElements = getFocusableElements(el);
      if (focusableElements.length > 0) {
        // Focus first element or specified initial focus element
        const initialFocus = binding.value?.initialFocus
          ? el.querySelector<HTMLElement>(binding.value.initialFocus)
          : focusableElements[0];

        (initialFocus || focusableElements[0]).focus();
      }
    }, 100); // Small delay to ensure DOM is ready
  }

  // Set ARIA attributes
  if (!el.hasAttribute('role')) {
    el.setAttribute('role', 'dialog');
  }
  el.setAttribute('aria-modal', 'true');
}

/**
 * Deactivate focus trap
 */
function deactivateFocusTrap(el: HTMLElement): void {
  const state = trapStates.get(el);
  if (!state) return;

  // Mark as inactive
  state.isActive = false;

  // Remove event listeners
  document.removeEventListener('keydown', state.keydownHandler);
  document.removeEventListener('focusin', state.focusInHandler, true);

  // Unregister from accessibility manager
  accessibilityManager.removeFocusTrap(el);

  // Restore previous focus
  if (state.previousFocus && state.previousFocus.focus) {
    setTimeout(() => {
      state.previousFocus?.focus();
    }, 0);
  }

  // Remove ARIA attributes
  el.removeAttribute('aria-modal');

  // Clean up state
  trapStates.delete(el);
}

/**
 * Focus Trap Directive
 *
 * Usage:
 * <div v-focus-trap>...</div>
 *
 * With options:
 * <div v-focus-trap="{
 *   autoFocus: true,
 *   initialFocus: '.my-input',
 *   escapeDeactivates: true,
 *   onEscape: handleEscape
 * }">...</div>
 */
export const vFocusTrap: ObjectDirective<HTMLElement> = {
  mounted(el, binding) {
    // Only activate if value is not explicitly false
    if (binding.value === false) return;

    setupFocusTrap(el, binding);
  },

  updated(el, binding) {
    const state = trapStates.get(el);

    // If directive is disabled, deactivate trap
    if (binding.value === false) {
      if (state && state.isActive) {
        deactivateFocusTrap(el);
      }
      return;
    }

    // If directive is enabled and trap is not active, set it up
    if (!state || !state.isActive) {
      setupFocusTrap(el, binding);
    }
  },

  beforeUnmount(el) {
    const state = trapStates.get(el);
    if (state && state.isActive) {
      deactivateFocusTrap(el);
    }
  }
};

/**
 * Helper function to manually create focus trap
 */
export function createFocusTrap(
  element: HTMLElement,
  options?: {
    autoFocus?: boolean;
    initialFocus?: string;
    escapeDeactivates?: boolean;
    onEscape?: () => void;
  }
): () => void {
  const binding: DirectiveBinding = {
    value: options,
    oldValue: undefined,
    arg: undefined,
    modifiers: {},
    dir: vFocusTrap,
    instance: null
  };

  setupFocusTrap(element, binding);

  // Return deactivate function
  return () => deactivateFocusTrap(element);
}

export default vFocusTrap;
