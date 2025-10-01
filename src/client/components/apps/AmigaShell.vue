<template>
  <div class="amiga-shell">
    <!-- Terminal Output -->
    <div class="terminal-output" ref="outputRef">
      <div class="terminal-header">
        AmigaShell v3.1 - Type 'help' for commands
      </div>
      <div
        v-for="(line, index) in outputLines"
        :key="index"
        class="terminal-line"
        :class="line.type"
      >
        <span v-if="line.type === 'prompt'" class="prompt">{{ line.text }}</span>
        <span v-else>{{ line.text }}</span>
      </div>
      <div class="terminal-input-line">
        <span class="prompt">{{ currentPath }}> </span>
        <input
          ref="inputRef"
          v-model="currentInput"
          type="text"
          class="terminal-input"
          @keyup.enter="executeCommand"
          @keyup.up="navigateHistory(-1)"
          @keyup.down="navigateHistory(1)"
          @keyup.tab.prevent="autocomplete"
          spellcheck="false"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, nextTick } from 'vue';

interface OutputLine {
  text: string;
  type: 'prompt' | 'output' | 'error' | 'success';
}

const outputLines = ref<OutputLine[]>([]);
const currentInput = ref('');
const currentPath = ref('dh0:');
const commandHistory = ref<string[]>([]);
const historyIndex = ref(-1);
const outputRef = ref<HTMLDivElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

onMounted(() => {
  inputRef.value?.focus();
  addOutput('Welcome to AmigaShell!', 'success');
  addOutput('Type "help" to see available commands', 'output');
  addOutput('', 'output');
});

const addOutput = (text: string, type: OutputLine['type'] = 'output') => {
  outputLines.value.push({ text, type });
  nextTick(() => {
    if (outputRef.value) {
      outputRef.value.scrollTop = outputRef.value.scrollHeight;
    }
  });
};

const executeCommand = async () => {
  const command = currentInput.value.trim();
  if (!command) return;

  // Add to history
  commandHistory.value.push(command);
  historyIndex.value = commandHistory.value.length;

  // Show the command
  addOutput(`${currentPath.value}> ${command}`, 'prompt');

  // Parse command
  const parts = command.split(' ');
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  // Clear input
  currentInput.value = '';

  // Execute command
  switch (cmd) {
    case 'help':
      showHelp();
      break;
    case 'clear':
    case 'cls':
      clearScreen();
      break;
    case 'ls':
    case 'dir':
      await listFiles(args[0] || '');
      break;
    case 'cd':
      changeDirectory(args[0] || '');
      break;
    case 'cat':
    case 'type':
      await readFile(args[0] || '');
      break;
    case 'mkdir':
      await makeDirectory(args[0] || '');
      break;
    case 'rm':
    case 'delete':
      await deleteItem(args[0] || '');
      break;
    case 'echo':
      addOutput(args.join(' '), 'output');
      break;
    case 'pwd':
      addOutput(currentPath.value, 'output');
      break;
    case 'about':
      showAbout();
      break;
    case 'date':
      addOutput(new Date().toLocaleString(), 'output');
      break;
    case 'ver':
    case 'version':
      addOutput('AmigaShell v3.1 (WebOS)', 'output');
      break;
    default:
      addOutput(`Command not found: ${cmd}`, 'error');
      addOutput('Type "help" for available commands', 'output');
  }

  addOutput('', 'output');
};

const showHelp = () => {
  addOutput('Available Commands:', 'success');
  addOutput('  help       - Show this help message', 'output');
  addOutput('  clear, cls - Clear the screen', 'output');
  addOutput('  ls, dir    - List files and directories', 'output');
  addOutput('  cd <dir>   - Change directory', 'output');
  addOutput('  cat <file> - Display file contents', 'output');
  addOutput('  mkdir <dir>- Create a directory', 'output');
  addOutput('  rm <name>  - Delete file or directory', 'output');
  addOutput('  echo <msg> - Display a message', 'output');
  addOutput('  pwd        - Show current directory', 'output');
  addOutput('  date       - Show current date/time', 'output');
  addOutput('  about      - About AmigaShell', 'output');
  addOutput('  version    - Show version info', 'output');
};

const clearScreen = () => {
  outputLines.value = [];
};

const listFiles = async (path?: string) => {
  try {
    // Use current path if no path specified
    const targetPath = path || currentPath.value.replace(':', '');

    const response = await fetch(`/api/files/list?path=${encodeURIComponent(targetPath)}`);

    if (!response.ok) {
      addOutput(`Cannot access '${targetPath}': No such directory`, 'error');
      return;
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      addOutput('Directory is empty', 'output');
      return;
    }

    addOutput(`Directory of ${targetPath}:`, 'success');
    data.items.forEach((item: any) => {
      const type = item.type === 'folder' ? '<DIR>' : '     ';
      const size = item.size || '';
      addOutput(`  ${type}  ${item.name.padEnd(30)} ${size}`, 'output');
    });
    addOutput(`Total: ${data.items.length} items`, 'output');
  } catch (error) {
    addOutput('Error listing directory', 'error');
    console.error('Error:', error);
  }
};

const changeDirectory = (dir: string) => {
  if (!dir) {
    addOutput('Usage: cd <directory>', 'error');
    return;
  }

  if (dir === '..' || dir === '/') {
    // Go to root
    currentPath.value = 'dh0:';
  } else if (dir.includes(':')) {
    // Absolute path
    currentPath.value = dir;
  } else {
    // Relative path
    const basePath = currentPath.value.replace(':', '');
    currentPath.value = `${basePath}/${dir}:`;
  }

  addOutput(`Changed to ${currentPath.value}`, 'success');
};

const readFile = async (filename: string) => {
  if (!filename) {
    addOutput('Usage: cat <filename>', 'error');
    return;
  }

  try {
    const basePath = currentPath.value.replace(':', '');
    const filePath = `${basePath}/${filename}`;

    const response = await fetch('/api/files/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath })
    });

    if (!response.ok) {
      addOutput(`Cannot read '${filename}': File not found`, 'error');
      return;
    }

    const data = await response.json();
    const lines = data.content.split('\n');
    lines.forEach((line: string) => addOutput(line, 'output'));
  } catch (error) {
    addOutput('Error reading file', 'error');
    console.error('Error:', error);
  }
};

const makeDirectory = async (dirname: string) => {
  if (!dirname) {
    addOutput('Usage: mkdir <directory>', 'error');
    return;
  }

  try {
    const basePath = currentPath.value.replace(':', '');

    const response = await fetch('/api/files/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: basePath,
        name: dirname,
        type: 'folder'
      })
    });

    if (!response.ok) {
      addOutput(`Cannot create directory '${dirname}'`, 'error');
      return;
    }

    addOutput(`Directory '${dirname}' created`, 'success');
  } catch (error) {
    addOutput('Error creating directory', 'error');
    console.error('Error:', error);
  }
};

const deleteItem = async (name: string) => {
  if (!name) {
    addOutput('Usage: rm <filename>', 'error');
    return;
  }

  if (!confirm(`Delete '${name}'?`)) {
    addOutput('Delete cancelled', 'output');
    return;
  }

  try {
    const basePath = currentPath.value.replace(':', '');
    const itemPath = `${basePath}/${name}`;

    const response = await fetch(`/api/files/delete?path=${encodeURIComponent(itemPath)}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      addOutput(`Cannot delete '${name}'`, 'error');
      return;
    }

    addOutput(`'${name}' deleted`, 'success');
  } catch (error) {
    addOutput('Error deleting item', 'error');
    console.error('Error:', error);
  }
};

const showAbout = () => {
  addOutput('╔═══════════════════════════════════╗', 'success');
  addOutput('║       AmigaShell v3.1            ║', 'success');
  addOutput('║   WebOS - Amiga Workbench Style  ║', 'success');
  addOutput('║                                   ║', 'success');
  addOutput('║  Built with Vue 3 & Express.js   ║', 'success');
  addOutput('╚═══════════════════════════════════╝', 'success');
};

const navigateHistory = (direction: number) => {
  if (commandHistory.value.length === 0) return;

  historyIndex.value += direction;

  if (historyIndex.value < 0) {
    historyIndex.value = 0;
  } else if (historyIndex.value >= commandHistory.value.length) {
    historyIndex.value = commandHistory.value.length;
    currentInput.value = '';
    return;
  }

  currentInput.value = commandHistory.value[historyIndex.value] || '';
};

const autocomplete = () => {
  // Simple autocomplete (could be enhanced)
  const commands = ['help', 'clear', 'ls', 'cd', 'cat', 'mkdir', 'rm', 'echo', 'pwd', 'about', 'date', 'version'];
  const input = currentInput.value.toLowerCase();

  if (!input) return;

  const matches = commands.filter(cmd => cmd.startsWith(input));
  if (matches.length === 1) {
    currentInput.value = matches[0];
  } else if (matches.length > 1) {
    addOutput(`Possible commands: ${matches.join(', ')}`, 'output');
  }
};
</script>

<style scoped>
.amiga-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #000000;
  font-family: 'Courier New', monospace;
  color: #ffffff;
}

.terminal-output {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.5;
}

.terminal-header {
  color: #ffaa00;
  font-weight: bold;
  margin-bottom: 12px;
  border-bottom: 1px solid #333333;
  padding-bottom: 8px;
}

.terminal-line {
  margin: 2px 0;
  word-wrap: break-word;
}

.terminal-line.prompt {
  color: #00ff00;
  font-weight: bold;
}

.terminal-line.output {
  color: #ffffff;
}

.terminal-line.error {
  color: #ff6666;
}

.terminal-line.success {
  color: #00ff00;
}

.terminal-input-line {
  display: flex;
  align-items: center;
  margin-top: 8px;
}

.prompt {
  color: #00ff00;
  font-weight: bold;
  margin-right: 4px;
  white-space: nowrap;
}

.terminal-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #ffffff;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  outline: none;
  caret-color: #00ff00;
}

.terminal-input::selection {
  background: #0055aa;
  color: #ffffff;
}

/* Scrollbar */
.terminal-output::-webkit-scrollbar {
  width: 12px;
}

.terminal-output::-webkit-scrollbar-track {
  background: #000000;
}

.terminal-output::-webkit-scrollbar-thumb {
  background: #333333;
  border: 1px solid #000000;
}

.terminal-output::-webkit-scrollbar-thumb:hover {
  background: #444444;
}
</style>
