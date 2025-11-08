<template>
  <div class="amiga-terminal">
    <!-- Toolbar -->
    <div class="terminal-toolbar">
      <button class="toolbar-button" @click="clearTerminal" title="Clear">
        <span>Clear</span>
      </button>
      <button class="toolbar-button" @click="copyOutput" title="Copy Output">
        <span>Copy</span>
      </button>
      <button class="toolbar-button" @click="saveSession" title="Save Session">
        <span>Save</span>
      </button>
      <button class="toolbar-button" @click="toggleHistory" title="History">
        <span>History</span>
      </button>
      <button class="toolbar-button" @click="toggleProcesses" title="Processes">
        <span>Tasks</span>
      </button>
      <button class="toolbar-button" @click="toggleSettings" title="Settings">
        <span>Settings</span>
      </button>
      <div class="toolbar-spacer"></div>
      <div class="terminal-status">{{ currentPath }}</div>
    </div>

    <!-- Main content area -->
    <div class="terminal-content">
      <!-- Terminal output area -->
      <div class="terminal-output" ref="outputArea" @click="focusInput">
        <div v-for="(line, index) in outputLines" :key="index" class="output-line">
          <span v-if="line.type === 'prompt'" class="prompt">{{ line.text }}</span>
          <span v-else-if="line.type === 'command'" class="command">{{ line.text }}</span>
          <span v-else-if="line.type === 'error'" class="error">{{ line.text }}</span>
          <span v-else-if="line.type === 'success'" class="success">{{ line.text }}</span>
          <span v-else class="output">{{ line.text }}</span>
        </div>

        <!-- Current prompt -->
        <div class="current-line">
          <span class="prompt">{{ currentPrompt }}</span>
          <span class="command-input">{{ currentCommand }}</span>
          <span class="cursor" v-if="cursorVisible">█</span>
        </div>
      </div>

      <!-- History sidebar -->
      <div v-if="showHistory" class="terminal-sidebar history-sidebar">
        <div class="sidebar-header">Command History</div>
        <div class="sidebar-content">
          <div
            v-for="(cmd, index) in commandHistory"
            :key="index"
            class="history-item"
            @click="selectHistoryItem(cmd)"
          >
            <span class="history-index">{{ index + 1 }}</span>
            <span class="history-command">{{ cmd }}</span>
          </div>
          <div v-if="commandHistory.length === 0" class="empty-state">
            No command history
          </div>
        </div>
      </div>

      <!-- Processes sidebar -->
      <div v-if="showProcesses" class="terminal-sidebar process-sidebar">
        <div class="sidebar-header">
          Running Tasks
          <button class="sidebar-button" @click="refreshProcesses">↻</button>
        </div>
        <div class="sidebar-content">
          <div
            v-for="process in processes"
            :key="process.id"
            class="process-item"
          >
            <div class="process-info">
              <span class="process-id">PID: {{ process.id }}</span>
              <span class="process-name">{{ process.name }}</span>
              <span class="process-status" :class="process.status">{{ process.status }}</span>
            </div>
            <button
              v-if="process.status === 'running'"
              class="kill-button"
              @click="killProcess(process.id)"
            >
              Kill
            </button>
          </div>
          <div v-if="processes.length === 0" class="empty-state">
            No running tasks
          </div>
        </div>
      </div>
    </div>

    <!-- Input area (hidden, we draw it ourselves) -->
    <input
      ref="hiddenInput"
      v-model="currentCommand"
      @keydown="handleKeyDown"
      @input="handleInput"
      class="hidden-input"
      autocomplete="off"
      spellcheck="false"
    />

    <!-- Auto-complete dropdown -->
    <div v-if="suggestions.length > 0" class="autocomplete-dropdown" :style="dropdownStyle">
      <div
        v-for="(suggestion, index) in suggestions"
        :key="index"
        class="autocomplete-item"
        :class="{ selected: index === selectedSuggestion }"
        @click="applySuggestion(suggestion)"
      >
        {{ suggestion }}
      </div>
    </div>

    <!-- Settings panel -->
    <div v-if="showSettings" class="settings-panel">
      <div class="settings-header">
        Terminal Settings
        <button class="close-button" @click="toggleSettings">×</button>
      </div>
      <div class="settings-content">
        <div class="setting-group">
          <label>Color Scheme:</label>
          <select v-model="colorScheme" @change="applyColorScheme">
            <option value="amiga500">Amiga 500 (White/Blue)</option>
            <option value="amiga1200">Amiga 1200 (Green/Black)</option>
            <option value="modern">Modern (Light Gray/Dark)</option>
            <option value="amber">Amber Monitor</option>
            <option value="green">Green Monitor</option>
          </select>
        </div>
        <div class="setting-group">
          <label>Font Size:</label>
          <select v-model="fontSize" @change="applyFontSize">
            <option value="10">Small (10px)</option>
            <option value="12">Medium (12px)</option>
            <option value="14">Large (14px)</option>
            <option value="16">Extra Large (16px)</option>
          </select>
        </div>
        <div class="setting-group">
          <label>Prompt Style:</label>
          <select v-model="promptStyle">
            <option value="simple">Simple</option>
            <option value="full">Full Path</option>
            <option value="amiga">Amiga Style</option>
          </select>
        </div>
        <div class="setting-group">
          <label>
            <input type="checkbox" v-model="showCursor" />
            Show blinking cursor
          </label>
        </div>
        <div class="setting-group">
          <label>
            <input type="checkbox" v-model="soundEnabled" />
            Enable sound effects
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import ShellInterpreter from '../../utils/shell-interpreter';
import ScriptRunner from '../../utils/script-runner';

const outputArea = ref<HTMLElement | null>(null);
const hiddenInput = ref<HTMLInputElement | null>(null);

// Terminal state
const outputLines = ref<Array<{ type: string; text: string }>>([]);
const currentCommand = ref('');
const currentPath = ref('dh0');
const commandHistory = ref<string[]>([]);
const historyIndex = ref(-1);
const cursorVisible = ref(true);
const showHistory = ref(false);
const showProcesses = ref(false);
const showSettings = ref(false);

// Auto-complete
const suggestions = ref<string[]>([]);
const selectedSuggestion = ref(0);
const dropdownStyle = ref({});

// Settings
const colorScheme = ref('amiga1200');
const fontSize = ref('12');
const promptStyle = ref('amiga');
const showCursor = ref(true);
const soundEnabled = ref(false);

// Processes
const processes = ref<any[]>([]);

// Shell interpreter
let shellInterpreter: ShellInterpreter;
let scriptRunner: ScriptRunner;

// Cursor blink interval
let cursorInterval: number | null = null;

onMounted(() => {
  shellInterpreter = new ShellInterpreter('dh0');
  _scriptRunner = new ScriptRunner();

  // Show welcome message
  addOutput('system', 'WebOS AmigaShell v2.0');
  addOutput('system', 'Type "help" for available commands');
  addOutput('system', '');

  // Focus input
  focusInput();

  // Start cursor blink
  if (showCursor.value) {
    cursorInterval = window.setInterval(() => {
      cursorVisible.value = !cursorVisible.value;
    }, 530);
  }

  // Load command history from localStorage
  const savedHistory = localStorage.getItem('webos-shell-history');
  if (savedHistory) {
    try {
      commandHistory.value = JSON.parse(savedHistory);
    } catch (e) {
      // Ignore
    }
  }

  // Apply saved settings
  const savedSettings = localStorage.getItem('webos-shell-settings');
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings);
      colorScheme.value = settings.colorScheme || 'amiga1200';
      fontSize.value = settings.fontSize || '12';
      promptStyle.value = settings.promptStyle || 'amiga';
      showCursor.value = settings.showCursor !== false;
      soundEnabled.value = settings.soundEnabled || false;
    } catch (e) {
      // Ignore
    }
  }

  applyColorScheme();
  applyFontSize();
});

onUnmounted(() => {
  if (cursorInterval) {
    clearInterval(cursorInterval);
  }

  // Save history
  localStorage.setItem('webos-shell-history', JSON.stringify(commandHistory.value));

  // Save settings
  localStorage.setItem('webos-shell-settings', JSON.stringify({
    colorScheme: colorScheme.value,
    fontSize: fontSize.value,
    promptStyle: promptStyle.value,
    showCursor: showCursor.value,
    soundEnabled: soundEnabled.value
  }));
});

const currentPrompt = computed(() => {
  switch (promptStyle.value) {
    case 'simple':
      return '$ ';
    case 'full':
      return `${currentPath.value}$ `;
    case 'amiga':
    default:
      const pathParts = currentPath.value.split('/');
      const disk = pathParts[0] || 'dh0';
      return `${disk}:${pathParts.slice(1).join('/')}> `;
  }
});

const focusInput = () => {
  if (hiddenInput.value) {
    hiddenInput.value.focus();
  }
};

const addOutput = (type: string, text: string) => {
  outputLines.value.push({ type, text });
  nextTick(() => {
    if (outputArea.value) {
      outputArea.value.scrollTop = outputArea.value.scrollHeight;
    }
  });
};

const handleKeyDown = async (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    await executeCommand();
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    navigateHistory(-1);
  } else if (event.key === 'ArrowDown') {
    event.preventDefault();
    navigateHistory(1);
  } else if (event.key === 'Tab') {
    event.preventDefault();
    handleAutoComplete();
  } else if (event.key === 'Escape') {
    suggestions.value = [];
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    // Allow cursor movement
  } else if (suggestions.value.length > 0) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      selectedSuggestion.value = (selectedSuggestion.value + 1) % suggestions.value.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      selectedSuggestion.value = (selectedSuggestion.value - 1 + suggestions.value.length) % suggestions.value.length;
    } else if (event.key === 'Enter' && suggestions.value.length > 0) {
      event.preventDefault();
      applySuggestion(suggestions.value[selectedSuggestion.value]);
    }
  }
};

const handleInput = () => {
  // Update auto-complete suggestions
  if (currentCommand.value.trim()) {
    updateSuggestions();
  } else {
    suggestions.value = [];
  }
};

const executeCommand = async () => {
  const command = currentCommand.value.trim();

  if (!command) {
    return;
  }

  // Show command in output
  addOutput('prompt', currentPrompt.value);
  addOutput('command', command);

  // Add to history
  if (!commandHistory.value.includes(command)) {
    commandHistory.value.push(command);
    // Limit history to 100 items
    if (commandHistory.value.length > 100) {
      commandHistory.value.shift();
    }
  }
  historyIndex.value = -1;

  // Clear input
  currentCommand.value = '';
  suggestions.value = [];

  // Special handling for clear command
  if (command === 'clear' || command === 'cls') {
    outputLines.value = [];
    return;
  }

  // Execute command
  try {
    const result = await shellInterpreter.execute(command);

    // Update current path if changed
    if (result.newPath) {
      currentPath.value = result.newPath;
    }

    // Show output
    if (result.output) {
      result.output.split('\n').forEach(line => {
        addOutput('output', line);
      });
    }

    // Show error
    if (result.error) {
      addOutput('error', result.error);
    }

    // Update processes list
    if (command.startsWith('ps') || command.startsWith('exec')) {
      refreshProcesses();
    }
  } catch (error) {
    addOutput('error', `Error: ${error}`);
  }

  // Scroll to bottom
  nextTick(() => {
    focusInput();
  });
};

const navigateHistory = (direction: number) => {
  if (commandHistory.value.length === 0) return;

  if (historyIndex.value === -1) {
    historyIndex.value = commandHistory.value.length;
  }

  historyIndex.value += direction;

  if (historyIndex.value < 0) {
    historyIndex.value = 0;
  } else if (historyIndex.value >= commandHistory.value.length) {
    historyIndex.value = commandHistory.value.length;
    currentCommand.value = '';
    return;
  }

  currentCommand.value = commandHistory.value[historyIndex.value];
};

const handleAutoComplete = () => {
  const parts = currentCommand.value.split(' ');
  const lastPart = parts[parts.length - 1];

  if (parts.length === 1) {
    // Command auto-complete
    const commands = ['ls', 'cd', 'pwd', 'cat', 'mkdir', 'rm', 'cp', 'mv', 'echo', 'clear',
                      'help', 'history', 'grep', 'find', 'df', 'du', 'date', 'env', 'export',
                      'ps', 'kill', 'exec', 'touch', 'version'];
    const matches = commands.filter(cmd => cmd.startsWith(lastPart));

    if (matches.length === 1) {
      currentCommand.value = matches[0] + ' ';
    } else if (matches.length > 1) {
      suggestions.value = matches;
    }
  } else {
    // File/folder auto-complete (simplified)
    suggestions.value = [];
  }
};

const updateSuggestions = () => {
  // Simplified suggestion update
  const parts = currentCommand.value.split(' ');
  if (parts.length === 1) {
    const commands = ['ls', 'cd', 'pwd', 'cat', 'mkdir', 'rm', 'cp', 'mv', 'echo', 'clear',
                      'help', 'history', 'grep', 'find', 'df', 'du', 'date', 'env', 'export',
                      'ps', 'kill', 'exec', 'touch', 'version'];
    suggestions.value = commands.filter(cmd => cmd.startsWith(parts[0])).slice(0, 5);
  } else {
    suggestions.value = [];
  }
};

const applySuggestion = (suggestion: string) => {
  const parts = currentCommand.value.split(' ');
  parts[parts.length - 1] = suggestion;
  currentCommand.value = parts.join(' ') + ' ';
  suggestions.value = [];
  focusInput();
};

const selectHistoryItem = (command: string) => {
  currentCommand.value = command;
  showHistory.value = false;
  focusInput();
};

const clearTerminal = () => {
  outputLines.value = [];
};

const copyOutput = () => {
  const text = outputLines.value.map(line => line.text).join('\n');
  navigator.clipboard.writeText(text).then(() => {
    addOutput('success', 'Output copied to clipboard');
  });
};

const saveSession = async () => {
  const text = outputLines.value.map(line => line.text).join('\n');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `terminal-session-${timestamp}.txt`;

  try {
    await fetch('/api/files/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'dh0',
        name: filename,
        type: 'file',
        content: text
      })
    });

    addOutput('success', `Session saved to ${filename}`);
  } catch (error) {
    addOutput('error', 'Failed to save session');
  }
};

const toggleHistory = () => {
  showHistory.value = !showHistory.value;
  if (showHistory.value) {
    showProcesses.value = false;
    showSettings.value = false;
  }
};

const toggleProcesses = () => {
  showProcesses.value = !showProcesses.value;
  if (showProcesses.value) {
    showHistory.value = false;
    showSettings.value = false;
    refreshProcesses();
  }
};

const toggleSettings = () => {
  showSettings.value = !showSettings.value;
  if (showSettings.value) {
    showHistory.value = false;
    showProcesses.value = false;
  }
};

const refreshProcesses = () => {
  processes.value = shellInterpreter.getProcesses();
};

const killProcess = async (pid: number) => {
  await shellInterpreter.execute(`kill ${pid}`);
  refreshProcesses();
  addOutput('success', `Process ${pid} terminated`);
};

const applyColorScheme = () => {
  const schemes = {
    amiga500: { bg: '#0055aa', fg: '#ffffff', prompt: '#ffff00' },
    amiga1200: { bg: '#000000', fg: '#00ff00', prompt: '#00ff00' },
    modern: { bg: '#1e1e1e', fg: '#d4d4d4', prompt: '#4ec9b0' },
    amber: { bg: '#000000', fg: '#ffb000', prompt: '#ffb000' },
    green: { bg: '#000000', fg: '#00ff00', prompt: '#00ff00' }
  };

  const scheme = schemes[colorScheme.value as keyof typeof schemes];
  if (scheme && outputArea.value) {
    const terminal = outputArea.value.closest('.amiga-terminal') as HTMLElement;
    if (terminal) {
      terminal.style.setProperty('--terminal-bg', scheme.bg);
      terminal.style.setProperty('--terminal-fg', scheme.fg);
      terminal.style.setProperty('--terminal-prompt', scheme.prompt);
    }
  }
};

const applyFontSize = () => {
  if (outputArea.value) {
    const terminal = outputArea.value.closest('.amiga-terminal') as HTMLElement;
    if (terminal) {
      terminal.style.setProperty('--terminal-font-size', `${fontSize.value}px`);
    }
  }
};
</script>

<style scoped>
.amiga-terminal {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--terminal-bg, #000000);
  color: var(--terminal-fg, #00ff00);
  font-family: 'Courier New', monospace;
  font-size: var(--terminal-font-size, 12px);
  --terminal-bg: #000000;
  --terminal-fg: #00ff00;
  --terminal-prompt: #00ff00;
  --terminal-font-size: 12px;
}

/* Toolbar */
.terminal-toolbar {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: #a0a0a0;
  border-bottom: 2px solid #000000;
  flex-shrink: 0;
}

.toolbar-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 2px 8px;
  font-size: 10px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  color: #000000;
}

.toolbar-button:hover {
  background: #b0b0b0;
}

.toolbar-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.toolbar-spacer {
  flex: 1;
}

.terminal-status {
  font-size: 10px;
  font-family: 'Press Start 2P', monospace;
  color: #0055aa;
  padding: 2px 8px;
  align-self: center;
}

/* Content area */
.terminal-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Terminal output */
.terminal-output {
  flex: 1;
  padding: 8px;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--terminal-bg);
  color: var(--terminal-fg);
  cursor: text;
  line-height: 1.4;
}

.output-line {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.prompt {
  color: var(--terminal-prompt);
  font-weight: bold;
}

.command {
  color: var(--terminal-fg);
}

.error {
  color: #ff5555;
}

.success {
  color: #50fa7b;
}

.output {
  color: var(--terminal-fg);
}

.current-line {
  display: flex;
}

.command-input {
  color: var(--terminal-fg);
}

.cursor {
  color: var(--terminal-fg);
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* Hidden input */
.hidden-input {
  position: absolute;
  left: -9999px;
  opacity: 0;
}

/* Sidebar */
.terminal-sidebar {
  width: 250px;
  background: #a0a0a0;
  border-left: 2px solid #000000;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 6px;
  background: #0055aa;
  color: #ffffff;
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  border-bottom: 2px solid #000000;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-button {
  background: transparent;
  border: none;
  color: #ffffff;
  cursor: pointer;
  font-size: 14px;
  padding: 0 4px;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}

.history-item,
.process-item {
  padding: 4px;
  margin-bottom: 2px;
  background: #888888;
  border: 1px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  font-size: 10px;
}

.history-item:hover {
  background: #999999;
}

.history-index {
  color: #0055aa;
  margin-right: 8px;
  font-weight: bold;
}

.history-command {
  color: #000000;
}

.process-item {
  cursor: default;
}

.process-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 4px;
}

.process-id {
  color: #0055aa;
  font-weight: bold;
}

.process-name {
  color: #000000;
}

.process-status {
  font-size: 8px;
  padding: 2px 4px;
  border-radius: 2px;
}

.process-status.running {
  background: #00ff00;
  color: #000000;
}

.process-status.stopped {
  background: #ff0000;
  color: #ffffff;
}

.kill-button {
  background: #ff5555;
  border: 1px solid #000000;
  color: #ffffff;
  padding: 2px 6px;
  font-size: 9px;
  cursor: pointer;
  font-family: 'Press Start 2P', monospace;
}

.kill-button:hover {
  background: #ff6666;
}

.empty-state {
  color: #666666;
  text-align: center;
  padding: 20px;
  font-size: 10px;
}

/* Auto-complete dropdown */
.autocomplete-dropdown {
  position: absolute;
  background: #333333;
  border: 2px solid var(--terminal-fg);
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  min-width: 200px;
}

.autocomplete-item {
  padding: 4px 8px;
  color: var(--terminal-fg);
  cursor: pointer;
}

.autocomplete-item:hover,
.autocomplete-item.selected {
  background: var(--terminal-fg);
  color: var(--terminal-bg);
}

/* Settings panel */
.settings-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.settings-header {
  padding: 6px;
  background: #0055aa;
  color: #ffffff;
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-button {
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  line-height: 1;
}

.settings-content {
  padding: 12px;
}

.setting-group {
  margin-bottom: 12px;
}

.setting-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 10px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
}

.setting-group select,
.setting-group input[type="checkbox"] {
  font-size: 10px;
  padding: 4px;
  border: 2px solid #000000;
  background: #ffffff;
}

.setting-group select {
  width: 100%;
}

/* Scrollbar styling */
.terminal-output::-webkit-scrollbar,
.sidebar-content::-webkit-scrollbar {
  width: 12px;
}

.terminal-output::-webkit-scrollbar-track,
.sidebar-content::-webkit-scrollbar-track {
  background: #333333;
}

.terminal-output::-webkit-scrollbar-thumb,
.sidebar-content::-webkit-scrollbar-thumb {
  background: #666666;
  border: 1px solid #000000;
}

.terminal-output::-webkit-scrollbar-thumb:hover,
.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: #888888;
}
</style>
