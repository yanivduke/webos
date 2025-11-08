/**
 * Command Palette System for WebOS
 * Provides fuzzy search for commands and quick action execution
 */

export interface Command {
  id: string;
  label: string;
  description: string;
  category: 'file' | 'edit' | 'view' | 'window' | 'tools' | 'help';
  icon?: string;
  action: () => void | Promise<void>;
  keywords?: string[]; // Additional search terms
  enabled?: boolean;
}

export interface CommandCategory {
  id: string;
  label: string;
  commands: Command[];
}

class CommandPalette {
  private commands: Map<string, Command> = new Map();
  private recentCommands: string[] = []; // Command IDs
  private readonly MAX_RECENT = 10;
  private readonly STORAGE_KEY = 'webos_recent_commands';

  constructor() {
    this.loadRecentCommands();
  }

  /**
   * Register a command
   */
  registerCommand(command: Command): void {
    this.commands.set(command.id, { ...command, enabled: command.enabled !== false });
  }

  /**
   * Unregister a command
   */
  unregisterCommand(id: string): void {
    this.commands.delete(id);
  }

  /**
   * Register multiple commands at once
   */
  registerCommands(commands: Command[]): void {
    commands.forEach(cmd => this.registerCommand(cmd));
  }

  /**
   * Get all registered commands
   */
  getAllCommands(): Command[] {
    return Array.from(this.commands.values()).filter(cmd => cmd.enabled !== false);
  }

  /**
   * Get commands by category
   */
  getCommandsByCategory(category: string): Command[] {
    return this.getAllCommands().filter(cmd => cmd.category === category);
  }

  /**
   * Get categorized commands
   */
  getCategorizedCommands(): CommandCategory[] {
    const categories = new Map<string, Command[]>();

    for (const command of this.getAllCommands()) {
      if (!categories.has(command.category)) {
        categories.set(command.category, []);
      }
      categories.get(command.category)!.push(command);
    }

    const categoryLabels: Record<string, string> = {
      file: 'File',
      edit: 'Edit',
      view: 'View',
      window: 'Window',
      tools: 'Tools',
      help: 'Help'
    };

    const result: CommandCategory[] = [];
    const order = ['file', 'edit', 'view', 'window', 'tools', 'help'];

    for (const categoryId of order) {
      const cmds = categories.get(categoryId);
      if (cmds && cmds.length > 0) {
        result.push({
          id: categoryId,
          label: categoryLabels[categoryId],
          commands: cmds
        });
      }
    }

    return result;
  }

  /**
   * Search commands with fuzzy matching
   */
  search(query: string): Command[] {
    if (!query.trim()) {
      return this.getAllCommands();
    }

    const normalizedQuery = query.toLowerCase().trim();
    const commands = this.getAllCommands();

    // Score each command based on how well it matches
    const scored = commands.map(cmd => ({
      command: cmd,
      score: this.calculateMatchScore(cmd, normalizedQuery)
    }));

    // Filter out non-matches and sort by score (higher is better)
    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.command);
  }

  /**
   * Calculate match score for fuzzy search
   */
  private calculateMatchScore(command: Command, query: string): number {
    let score = 0;
    const label = command.label.toLowerCase();
    const description = command.description.toLowerCase();
    const keywords = (command.keywords || []).map(k => k.toLowerCase());

    // Exact match in label (highest priority)
    if (label === query) {
      return 1000;
    }

    // Label starts with query
    if (label.startsWith(query)) {
      score += 500;
    }

    // Label contains query
    if (label.includes(query)) {
      score += 300;
    }

    // Description contains query
    if (description.includes(query)) {
      score += 200;
    }

    // Keywords match
    for (const keyword of keywords) {
      if (keyword === query) {
        score += 400;
      } else if (keyword.startsWith(query)) {
        score += 250;
      } else if (keyword.includes(query)) {
        score += 150;
      }
    }

    // Fuzzy match - check if all query characters appear in order
    if (this.fuzzyMatch(label, query)) {
      score += 100;
    }

    // Boost recent commands
    if (this.recentCommands.includes(command.id)) {
      const recentIndex = this.recentCommands.indexOf(command.id);
      score += (this.MAX_RECENT - recentIndex) * 10;
    }

    return score;
  }

  /**
   * Fuzzy matching - check if all query characters appear in order in the text
   */
  private fuzzyMatch(text: string, query: string): boolean {
    let textIndex = 0;
    let queryIndex = 0;

    while (textIndex < text.length && queryIndex < query.length) {
      if (text[textIndex] === query[queryIndex]) {
        queryIndex++;
      }
      textIndex++;
    }

    return queryIndex === query.length;
  }

  /**
   * Execute a command and track it as recent
   */
  async executeCommand(commandId: string): Promise<boolean> {
    const command = this.commands.get(commandId);

    if (!command || command.enabled === false) {
      console.warn(`Command not found or disabled: ${commandId}`);
      return false;
    }

    try {
      await command.action();
      this.addToRecent(commandId);
      return true;
    } catch (error) {
      console.error(`Error executing command ${commandId}:`, error);
      return false;
    }
  }

  /**
   * Get recent commands
   */
  getRecentCommands(): Command[] {
    const recent: Command[] = [];

    for (const id of this.recentCommands) {
      const command = this.commands.get(id);
      if (command && command.enabled !== false) {
        recent.push(command);
      }
    }

    return recent;
  }

  /**
   * Add command to recent list
   */
  private addToRecent(commandId: string): void {
    // Remove if already in list
    const index = this.recentCommands.indexOf(commandId);
    if (index > -1) {
      this.recentCommands.splice(index, 1);
    }

    // Add to front
    this.recentCommands.unshift(commandId);

    // Keep only MAX_RECENT items
    if (this.recentCommands.length > this.MAX_RECENT) {
      this.recentCommands = this.recentCommands.slice(0, this.MAX_RECENT);
    }

    this.saveRecentCommands();
  }

  /**
   * Clear recent commands
   */
  clearRecent(): void {
    this.recentCommands = [];
    this.saveRecentCommands();
  }

  /**
   * Save recent commands to localStorage
   */
  private saveRecentCommands(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.recentCommands));
    } catch (error) {
      console.error('Failed to save recent commands:', error);
    }
  }

  /**
   * Load recent commands from localStorage
   */
  private loadRecentCommands(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.recentCommands = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load recent commands:', error);
      this.recentCommands = [];
    }
  }

  /**
   * Get default commands
   */
  getDefaultCommands(): Command[] {
    return [
      {
        id: 'open-file',
        label: 'Open File',
        description: 'Open a file browser window',
        category: 'file',
        keywords: ['browse', 'folder'],
        action: () => console.log('Open file - implement in desktop')
      },
      {
        id: 'new-folder',
        label: 'New Folder',
        description: 'Create a new folder',
        category: 'file',
        keywords: ['create', 'directory'],
        action: () => console.log('New folder - implement in desktop')
      },
      {
        id: 'copy',
        label: 'Copy',
        description: 'Copy selected items',
        category: 'edit',
        keywords: ['duplicate'],
        action: () => console.log('Copy - implement in desktop')
      },
      {
        id: 'paste',
        label: 'Paste',
        description: 'Paste clipboard contents',
        category: 'edit',
        keywords: ['insert'],
        action: () => console.log('Paste - implement in desktop')
      },
      {
        id: 'cut',
        label: 'Cut',
        description: 'Cut selected items',
        category: 'edit',
        keywords: ['move'],
        action: () => console.log('Cut - implement in desktop')
      },
      {
        id: 'select-all',
        label: 'Select All',
        description: 'Select all items in current window',
        category: 'edit',
        action: () => console.log('Select all - implement in desktop')
      },
      {
        id: 'refresh',
        label: 'Refresh',
        description: 'Refresh current window',
        category: 'view',
        keywords: ['reload'],
        action: () => console.log('Refresh - implement in desktop')
      },
      {
        id: 'minimize-window',
        label: 'Minimize Window',
        description: 'Minimize the active window',
        category: 'window',
        keywords: ['hide'],
        action: () => console.log('Minimize - implement in desktop')
      },
      {
        id: 'maximize-window',
        label: 'Maximize Window',
        description: 'Maximize the active window',
        category: 'window',
        keywords: ['expand', 'fullscreen'],
        action: () => console.log('Maximize - implement in desktop')
      },
      {
        id: 'close-window',
        label: 'Close Window',
        description: 'Close the active window',
        category: 'window',
        keywords: ['quit'],
        action: () => console.log('Close window - implement in desktop')
      },
      {
        id: 'settings',
        label: 'Settings',
        description: 'Open system settings',
        category: 'tools',
        keywords: ['preferences', 'options', 'config'],
        action: () => console.log('Settings - implement in desktop')
      },
      {
        id: 'keyboard-shortcuts',
        label: 'Keyboard Shortcuts',
        description: 'View and edit keyboard shortcuts',
        category: 'tools',
        keywords: ['hotkeys', 'keys'],
        action: () => console.log('Shortcuts - implement in desktop')
      },
      {
        id: 'about',
        label: 'About WebOS',
        description: 'Show information about WebOS',
        category: 'help',
        keywords: ['info', 'version'],
        action: () => console.log('About - implement in desktop')
      },
      {
        id: 'help',
        label: 'Help',
        description: 'Open help documentation',
        category: 'help',
        keywords: ['docs', 'manual'],
        action: () => console.log('Help - implement in desktop')
      }
    ];
  }

  /**
   * Get a specific command
   */
  getCommand(id: string): Command | undefined {
    return this.commands.get(id);
  }

  /**
   * Enable or disable a command
   */
  setCommandEnabled(id: string, enabled: boolean): boolean {
    const command = this.commands.get(id);
    if (!command) return false;

    command.enabled = enabled;
    return true;
  }
}

// Export singleton instance
export const commandPalette = new CommandPalette();
export default commandPalette;
