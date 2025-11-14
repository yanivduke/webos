/**
 * Z-Index Manager
 * Provides centralized z-index management for windows to prevent overflow
 * and ensure proper stacking order.
 */

// Start at 1000 to leave room for other elements
let currentZIndex = 1000;
const MAX_Z_INDEX = 2147483647; // Maximum safe z-index for CSS
const RESET_THRESHOLD = 100000; // Reset when we get too high
const BASE_Z_INDEX = 1000;

/**
 * Get the next available z-index
 * Automatically resets if approaching the maximum safe value
 */
export function getNextZIndex(): number {
  // Reset if we're approaching the max
  if (currentZIndex > RESET_THRESHOLD) {
    currentZIndex = BASE_Z_INDEX;
  }

  return currentZIndex++;
}

/**
 * Reset the z-index counter (useful for testing or manual resets)
 */
export function resetZIndexCounter(): void {
  currentZIndex = BASE_Z_INDEX;
}

/**
 * Get the current z-index without incrementing
 */
export function getCurrentZIndex(): number {
  return currentZIndex;
}

/**
 * Composable for z-index management
 */
export function useZIndexManager() {
  return {
    getNextZIndex,
    resetZIndexCounter,
    getCurrentZIndex
  };
}
