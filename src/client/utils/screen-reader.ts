/**
 * Screen Reader Utility
 *
 * Provides context-aware screen reader announcements for WebOS.
 * Integrates with the accessibility manager to provide meaningful
 * feedback for all user interactions.
 */

import { accessibilityManager, type AccessibilitySettings } from './accessibility-manager';

export interface AnnouncementContext {
  component?: string;
  action?: string;
  target?: string;
  result?: string;
  error?: string;
}

class ScreenReader {
  private settings: AccessibilitySettings;

  constructor() {
    this.settings = accessibilityManager.getSettings();

    // Listen for settings changes
    accessibilityManager.addListener((settings) => {
      this.settings = settings;
    });
  }

  /**
   * Check if screen reader is enabled
   */
  private isEnabled(): boolean {
    return this.settings.screenReader;
  }

  /**
   * Get verbosity level
   */
  private getVerbosity(): 'low' | 'medium' | 'high' {
    return this.settings.screenReaderVerbosity;
  }

  /**
   * Format announcement based on verbosity
   */
  private formatAnnouncement(message: string, detail?: string): string {
    const verbosity = this.getVerbosity();

    if (verbosity === 'low') {
      return message;
    } else if (verbosity === 'medium') {
      return detail ? `${message}. ${detail}` : message;
    } else {
      // High verbosity - include all details
      return detail ? `${message}. ${detail}. Press Tab to navigate, Escape to cancel.` : message;
    }
  }

  /**
   * Announce navigation event
   */
  announceNavigation(location: string, detail?: string): void {
    if (!this.isEnabled()) return;

    const message = this.formatAnnouncement(
      `Navigated to ${location}`,
      detail
    );

    accessibilityManager.announce(message, 'polite');
  }

  /**
   * Announce window opened
   */
  announceWindowOpened(windowTitle: string, windowType?: string): void {
    if (!this.isEnabled()) return;

    const typeStr = windowType ? ` ${windowType}` : '';
    const message = this.formatAnnouncement(
      `${windowTitle}${typeStr} window opened`,
      'Use Tab to navigate, Escape to close'
    );

    accessibilityManager.announce(message, 'polite');
  }

  /**
   * Announce window closed
   */
  announceWindowClosed(windowTitle: string): void {
    if (!this.isEnabled()) return;

    const message = `${windowTitle} window closed`;
    accessibilityManager.announce(message, 'polite');
  }

  /**
   * Announce file/folder opened
   */
  announceFileOpened(fileName: string, fileType: 'file' | 'folder' | 'disk'): void {
    if (!this.isEnabled()) return;

    const message = this.formatAnnouncement(
      `Opened ${fileType} ${fileName}`,
      fileType === 'folder' ? 'Use arrow keys to navigate items' : undefined
    );

    accessibilityManager.announce(message, 'polite');
  }

  /**
   * Announce file/folder selected
   */
  announceFileSelected(fileName: string, fileType: string, count?: number): void {
    if (!this.isEnabled()) return;

    let message: string;
    if (count && count > 1) {
      message = `${count} items selected`;
    } else {
      message = `Selected ${fileType} ${fileName}`;
    }

    accessibilityManager.announce(message, 'polite');
  }

  /**
   * Announce action performed
   */
  announceAction(action: string, target?: string, result?: string): void {
    if (!this.isEnabled()) return;

    const targetStr = target ? ` on ${target}` : '';
    const message = this.formatAnnouncement(
      `${action}${targetStr}`,
      result
    );

    accessibilityManager.announce(message, 'polite');
  }

  /**
   * Announce operation complete
   */
  announceOperationComplete(operation: string, success: boolean = true): void {
    if (!this.isEnabled()) return;

    const message = success
      ? `${operation} completed successfully`
      : `${operation} failed`;

    accessibilityManager.announce(message, success ? 'polite' : 'assertive');
  }

  /**
   * Announce error
   */
  announceError(error: string, detail?: string): void {
    if (!this.isEnabled()) return;

    const message = this.formatAnnouncement(
      `Error: ${error}`,
      detail
    );

    accessibilityManager.announce(message, 'assertive');
  }

  /**
   * Announce status change
   */
  announceStatus(status: string, detail?: string): void {
    if (!this.isEnabled()) return;

    const message = this.formatAnnouncement(status, detail);
    accessibilityManager.announce(message, 'polite');
  }

  /**
   * Announce menu opened
   */
  announceMenuOpened(menuName: string): void {
    if (!this.isEnabled()) return;

    const message = this.formatAnnouncement(
      `${menuName} menu opened`,
      'Use arrow keys to navigate, Enter to select, Escape to close'
    );

    accessibilityManager.announce(message, 'polite');
  }

  /**
   * Announce menu item focused
   */
  announceMenuItemFocused(itemName: string, position?: { current: number; total: number }): void {
    if (!this.isEnabled()) return;
    if (this.getVerbosity() === 'low') return; // Don't announce every focus in low verbosity

    let message = itemName;
    if (position && this.getVerbosity() === 'high') {
      message += `, ${position.current} of ${position.total}`;
    }

    accessibilityManager.announce(message, 'polite');
  }

  /**
   * Announce dialog opened
   */
  announceDialogOpened(dialogTitle: string, dialogType?: 'alert' | 'confirm' | 'info'): void {
    if (!this.isEnabled()) return;

    const typeStr = dialogType ? ` ${dialogType}` : '';
    const message = this.formatAnnouncement(
      `${dialogTitle}${typeStr} dialog opened`,
      'Tab to navigate, Escape to close'
    );

    accessibilityManager.announce(message, dialogType === 'alert' ? 'assertive' : 'polite');
  }

  /**
   * Announce loading state
   */
  announceLoading(message: string = 'Loading'): void {
    if (!this.isEnabled()) return;

    accessibilityManager.announce(`${message}, please wait`, 'polite');
  }

  /**
   * Announce loaded state
   */
  announceLoaded(message: string = 'Content loaded'): void {
    if (!this.isEnabled()) return;

    accessibilityManager.announce(message, 'polite');
  }

  /**
   * Announce focus change for complex widgets
   */
  announceFocusChange(from: string, to: string): void {
    if (!this.isEnabled()) return;
    if (this.getVerbosity() !== 'high') return; // Only announce in high verbosity

    accessibilityManager.announce(`Focus moved from ${from} to ${to}`, 'polite');
  }

  /**
   * Announce clipboard operation
   */
  announceClipboard(operation: 'copy' | 'cut' | 'paste', itemName?: string): void {
    if (!this.isEnabled()) return;

    const itemStr = itemName ? ` ${itemName}` : '';
    const message = `${operation}${itemStr} ${operation === 'paste' ? 'from' : 'to'} clipboard`;

    accessibilityManager.announce(message, 'polite');
  }

  /**
   * Announce drag and drop operation
   */
  announceDragStart(itemName: string): void {
    if (!this.isEnabled()) return;

    const message = this.formatAnnouncement(
      `Picked up ${itemName}`,
      'Use arrow keys to move, Space to drop, Escape to cancel'
    );

    accessibilityManager.announce(message, 'polite');
  }

  /**
   * Announce drag and drop complete
   */
  announceDrop(itemName: string, target: string): void {
    if (!this.isEnabled()) return;

    accessibilityManager.announce(`Dropped ${itemName} on ${target}`, 'polite');
  }

  /**
   * Announce search results
   */
  announceSearchResults(query: string, count: number): void {
    if (!this.isEnabled()) return;

    const message = count === 0
      ? `No results found for ${query}`
      : `Found ${count} result${count === 1 ? '' : 's'} for ${query}`;

    accessibilityManager.announce(message, 'polite');
  }

  /**
   * Announce form validation
   */
  announceValidation(fieldName: string, error?: string): void {
    if (!this.isEnabled()) return;

    const message = error
      ? `${fieldName}: ${error}`
      : `${fieldName} is valid`;

    accessibilityManager.announce(message, error ? 'assertive' : 'polite');
  }

  /**
   * Announce progress update
   */
  announceProgress(operation: string, percent: number): void {
    if (!this.isEnabled()) return;
    if (this.getVerbosity() === 'low') return; // Don't announce progress in low verbosity

    // Only announce at 25%, 50%, 75%, 100% to avoid spam
    if (percent === 25 || percent === 50 || percent === 75 || percent === 100) {
      accessibilityManager.announce(`${operation} ${percent}% complete`, 'polite');
    }
  }

  /**
   * Announce keyboard shortcut activated
   */
  announceShortcut(shortcut: string, action: string): void {
    if (!this.isEnabled()) return;
    if (this.getVerbosity() !== 'high') return; // Only in high verbosity

    accessibilityManager.announce(`${shortcut}: ${action}`, 'polite');
  }

  /**
   * Announce context with all details
   */
  announceContext(context: AnnouncementContext): void {
    if (!this.isEnabled()) return;

    const parts: string[] = [];

    if (context.component) parts.push(context.component);
    if (context.action) parts.push(context.action);
    if (context.target) parts.push(context.target);
    if (context.result) parts.push(context.result);

    const message = parts.join(': ');
    const politeness = context.error ? 'assertive' : 'polite';

    accessibilityManager.announce(
      context.error ? `Error - ${message}: ${context.error}` : message,
      politeness
    );
  }

  /**
   * Announce table navigation
   */
  announceTableCell(row: number, col: number, content: string, totalRows: number, totalCols: number): void {
    if (!this.isEnabled()) return;

    const verbosity = this.getVerbosity();
    let message = content;

    if (verbosity === 'medium' || verbosity === 'high') {
      message += `, row ${row}, column ${col}`;
    }

    if (verbosity === 'high') {
      message += ` of ${totalRows} rows, ${totalCols} columns`;
    }

    accessibilityManager.announce(message, 'polite');
  }

  /**
   * Create descriptive label for element
   */
  describeElement(element: HTMLElement): string {
    const role = element.getAttribute('role') || element.tagName.toLowerCase();
    const label = element.getAttribute('aria-label')
      || element.getAttribute('title')
      || element.textContent?.trim()
      || 'unlabeled';

    const state: string[] = [];

    if (element.getAttribute('aria-selected') === 'true') state.push('selected');
    if (element.getAttribute('aria-expanded') === 'true') state.push('expanded');
    if (element.getAttribute('aria-expanded') === 'false') state.push('collapsed');
    if (element.getAttribute('aria-checked') === 'true') state.push('checked');
    if (element.getAttribute('aria-disabled') === 'true') state.push('disabled');

    const stateStr = state.length > 0 ? `, ${state.join(', ')}` : '';
    return `${role}: ${label}${stateStr}`;
  }
}

// Export singleton instance
export const screenReader = new ScreenReader();
