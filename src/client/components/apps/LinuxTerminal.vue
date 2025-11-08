<template>
  <div class="linux-terminal">
    <!-- Terminal Output -->
    <div class="terminal-output" ref="outputRef">
      <div class="terminal-header">
        Linux Terminal - Type 'help' for commands
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
        <span class="prompt">{{ currentUser }}@webos:{{ currentPath }}$ </span>
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
  type: 'prompt' | 'output' | 'error' | 'success' | 'info';
}

const outputLines = ref<OutputLine[]>([]);
const currentInput = ref('');
const currentPath = ref('~');
const currentUser = ref('user');
const commandHistory = ref<string[]>([]);
const historyIndex = ref(-1);
const outputRef = ref<HTMLDivElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

onMounted(() => {
  inputRef.value?.focus();
  addOutput('Welcome to Linux Terminal!', 'success');
  addOutput('Type "help" to see available commands', 'info');
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
  addOutput(`${currentUser.value}@webos:${currentPath.value}$ ${command}`, 'prompt');

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
      clearScreen();
      break;
    case 'ls':
      await listFiles(args);
      break;
    case 'cd':
      changeDirectory(args[0] || '~');
      break;
    case 'pwd':
      addOutput(currentPath.value === '~' ? '/home/user' : currentPath.value, 'output');
      break;
    case 'cat':
      await readFile(args[0] || '');
      break;
    case 'mkdir':
      await makeDirectory(args[0] || '');
      break;
    case 'rm':
      await deleteItem(args);
      break;
    case 'echo':
      addOutput(args.join(' '), 'output');
      break;
    case 'date':
      addOutput(new Date().toString(), 'output');
      break;
    case 'whoami':
      addOutput(currentUser.value, 'output');
      break;
    case 'uname':
      if (args.includes('-a')) {
        addOutput('Linux webos 5.15.0-webos #1 SMP x86_64 GNU/Linux', 'output');
      } else {
        addOutput('Linux', 'output');
      }
      break;
    case 'ps':
      showProcesses();
      break;
    case 'top':
      addOutput('top - displaying system processes...', 'info');
      showProcesses();
      break;
    case 'df':
      showDiskUsage();
      break;
    case 'free':
      showMemory();
      break;
    case 'man':
      showManual(args[0] || '');
      break;
    case 'grep':
      addOutput('grep: basic search functionality (use with cat)', 'info');
      break;
    case 'touch':
      await touchFile(args[0] || '');
      break;
    case 'nano':
    case 'vim':
    case 'vi':
      addOutput(`${cmd}: text editor (use NotePad from Tools menu)`, 'info');
      break;
    default:
      addOutput(`bash: ${cmd}: command not found`, 'error');
      addOutput('Type "help" for available commands', 'info');
  }

  addOutput('', 'output');
};

const showHelp = () => {
  addOutput('Available Commands:', 'success');
  addOutput('', 'output');
  addOutput('File System:', 'info');
  addOutput('  ls [options]  - List directory contents', 'output');
  addOutput('  cd <dir>      - Change directory', 'output');
  addOutput('  pwd           - Print working directory', 'output');
  addOutput('  cat <file>    - Display file contents', 'output');
  addOutput('  mkdir <dir>   - Create directory', 'output');
  addOutput('  rm <file>     - Remove file or directory', 'output');
  addOutput('  touch <file>  - Create empty file', 'output');
  addOutput('', 'output');
  addOutput('System Info:', 'info');
  addOutput('  whoami        - Display current user', 'output');
  addOutput('  uname         - System information', 'output');
  addOutput('  date          - Display date and time', 'output');
  addOutput('  ps            - Display processes', 'output');
  addOutput('  top           - Display system monitor', 'output');
  addOutput('  df            - Disk space usage', 'output');
  addOutput('  free          - Memory usage', 'output');
  addOutput('', 'output');
  addOutput('Utilities:', 'info');
  addOutput('  echo <text>   - Display text', 'output');
  addOutput('  man <cmd>     - Display manual page', 'output');
  addOutput('  clear         - Clear screen', 'output');
  addOutput('  help          - Show this help', 'output');
};

const clearScreen = () => {
  outputLines.value = [];
};

const listFiles = async (args: string[]) => {
  const options = args.filter(a => a.startsWith('-'));
  const showAll = options.includes('-a') || options.includes('-la') || options.includes('-al');
  const longFormat = options.includes('-l') || options.includes('-la') || options.includes('-al');

  try {
    // Map to Amiga path
    const amigaPath = currentPath.value === '~' ? 'dh0' : currentPath.value.replace('/home/user/', 'dh0/');

    const response = await fetch(`/api/files/list?path=${encodeURIComponent(amigaPath)}`);

    if (!response.ok) {
      addOutput(`ls: cannot access '${currentPath.value}': No such file or directory`, 'error');
      return;
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return; // Empty directory, no output
    }

    if (longFormat) {
      addOutput('total ' + data.items.length, 'output');
      data.items.forEach((item: any) => {
        const perms = item.type === 'folder' ? 'drwxr-xr-x' : '-rw-r--r--';
        const links = '1';
        const size = item.size || '4096';
        const date = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        const name = item.type === 'folder' ? `\x1b[34m${item.name}\x1b[0m` : item.name;
        addOutput(`${perms} ${links} ${currentUser.value} ${currentUser.value} ${String(size).padStart(8)} ${date} ${name}`, 'output');
      });
    } else {
      const names = data.items.map((item: any) =>
        item.type === 'folder' ? `\x1b[34m${item.name}\x1b[0m` : item.name
      );
      addOutput(names.join('  '), 'output');
    }
  } catch (error) {
    addOutput('ls: error reading directory', 'error');
    console.error('Error:', error);
  }
};

const changeDirectory = (dir: string) => {
  if (!dir || dir === '~') {
    currentPath.value = '~';
    addOutput('', 'output');
    return;
  }

  if (dir === '..') {
    if (currentPath.value === '~' || currentPath.value === '/home/user') {
      currentPath.value = '/home';
    } else {
      const parts = currentPath.value.split('/');
      parts.pop();
      currentPath.value = parts.join('/') || '/';
    }
  } else if (dir === '/') {
    currentPath.value = '/';
  } else if (dir.startsWith('/')) {
    currentPath.value = dir;
  } else {
    if (currentPath.value === '~') {
      currentPath.value = `/home/user/${dir}`;
    } else {
      currentPath.value = `${currentPath.value}/${dir}`;
    }
  }

  addOutput('', 'output');
};

const readFile = async (filename: string) => {
  if (!filename) {
    addOutput('cat: missing file operand', 'error');
    return;
  }

  try {
    const amigaPath = currentPath.value === '~' ? 'dh0' : currentPath.value.replace('/home/user/', 'dh0/');
    const filePath = `${amigaPath}/${filename}`;

    const response = await fetch('/api/files/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath })
    });

    if (!response.ok) {
      addOutput(`cat: ${filename}: No such file or directory`, 'error');
      return;
    }

    const data = await response.json();
    const lines = data.content.split('\n');
    lines.forEach((line: string) => addOutput(line, 'output'));
  } catch (error) {
    addOutput('cat: error reading file', 'error');
    console.error('Error:', error);
  }
};

const makeDirectory = async (dirname: string) => {
  if (!dirname) {
    addOutput('mkdir: missing operand', 'error');
    return;
  }

  try {
    const amigaPath = currentPath.value === '~' ? 'dh0' : currentPath.value.replace('/home/user/', 'dh0/');

    const response = await fetch('/api/files/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: amigaPath,
        name: dirname,
        type: 'folder'
      })
    });

    if (!response.ok) {
      addOutput(`mkdir: cannot create directory '${dirname}': File exists`, 'error');
      return;
    }

    addOutput('', 'output');
  } catch (error) {
    addOutput('mkdir: error creating directory', 'error');
    console.error('Error:', error);
  }
};

const deleteItem = async (args: string[]) => {
  const recursive = args.includes('-r') || args.includes('-rf');
  const name = args.filter(a => !a.startsWith('-'))[0];

  if (!name) {
    addOutput('rm: missing operand', 'error');
    return;
  }

  try {
    const amigaPath = currentPath.value === '~' ? 'dh0' : currentPath.value.replace('/home/user/', 'dh0/');
    const itemPath = `${amigaPath}/${name}`;

    const response = await fetch(`/api/files/delete?path=${encodeURIComponent(itemPath)}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      addOutput(`rm: cannot remove '${name}': No such file or directory`, 'error');
      return;
    }

    addOutput('', 'output');
  } catch (error) {
    addOutput('rm: error deleting item', 'error');
    console.error('Error:', error);
  }
};

const touchFile = async (filename: string) => {
  if (!filename) {
    addOutput('touch: missing file operand', 'error');
    return;
  }

  try {
    const amigaPath = currentPath.value === '~' ? 'dh0' : currentPath.value.replace('/home/user/', 'dh0/');

    const response = await fetch('/api/files/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: amigaPath,
        name: filename,
        type: 'file',
        content: ''
      })
    });

    if (!response.ok) {
      addOutput(`touch: cannot touch '${filename}'`, 'error');
      return;
    }

    addOutput('', 'output');
  } catch (error) {
    addOutput('touch: error creating file', 'error');
    console.error('Error:', error);
  }
};

const showProcesses = () => {
  addOutput('  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND', 'output');
  addOutput('    1 root      20   0  169808   9876   6788 S   0.0   0.5   0:01.23 systemd', 'output');
  addOutput('  142 user      20   0  234532  45632  23456 S   0.3   2.2   0:05.67 webos', 'output');
  addOutput('  289 user      20   0   87652  12456   8765 R   1.2   0.6   0:00.45 terminal', 'output');
  addOutput('  312 user      20   0   45678   7890   5432 S   0.0   0.4   0:00.12 bash', 'output');
};

const showDiskUsage = () => {
  addOutput('Filesystem     1K-blocks    Used Available Use% Mounted on', 'output');
  addOutput('/dev/sda1       10485760 4194304   6291456  40% /', 'output');
  addOutput('/dev/sda2        5242880 1048576   4194304  20% /home', 'output');
  addOutput('tmpfs            2097152  524288   1572864  25% /tmp', 'output');
};

const showMemory = () => {
  addOutput('              total        used        free      shared  buff/cache   available', 'output');
  addOutput('Mem:        8192000     3276800     3932160      524288      983040     4390912', 'output');
  addOutput('Swap:       2097152      262144     1835008', 'output');
};

const showManual = (cmd: string) => {
  if (!cmd) {
    addOutput('What manual page do you want?', 'error');
    return;
  }

  const manPages: Record<string, string[]> = {
    ls: [
      'LS(1)                    User Commands                   LS(1)',
      '',
      'NAME',
      '       ls - list directory contents',
      '',
      'SYNOPSIS',
      '       ls [OPTION]... [FILE]...',
      '',
      'DESCRIPTION',
      '       List information about FILEs (the current directory by default).',
      '       -a     do not ignore entries starting with .',
      '       -l     use a long listing format',
    ],
    cd: [
      'CD(1)                    User Commands                   CD(1)',
      '',
      'NAME',
      '       cd - change directory',
      '',
      'SYNOPSIS',
      '       cd [DIRECTORY]',
      '',
      'DESCRIPTION',
      '       Change the current working directory to DIRECTORY.',
    ]
  };

  const page = manPages[cmd.toLowerCase()];
  if (page) {
    page.forEach(line => addOutput(line, 'output'));
  } else {
    addOutput(`No manual entry for ${cmd}`, 'error');
  }
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
  const commands = ['help', 'clear', 'ls', 'cd', 'pwd', 'cat', 'mkdir', 'rm', 'echo', 'date',
                    'whoami', 'uname', 'ps', 'top', 'df', 'free', 'man', 'grep', 'touch'];
  const input = currentInput.value.toLowerCase();

  if (!input) return;

  const matches = commands.filter(cmd => cmd.startsWith(input));
  if (matches.length === 1) {
    currentInput.value = matches[0];
  } else if (matches.length > 1) {
    addOutput(matches.join('  '), 'output');
  }
};
</script>

<style scoped>
.linux-terminal {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #000000;
  font-family: 'Ubuntu Mono', 'Courier New', monospace;
  color: #00ff00;
}

.terminal-output {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.4;
}

.terminal-header {
  color: #00ff00;
  font-weight: bold;
  margin-bottom: 12px;
  border-bottom: 1px solid #00ff00;
  padding-bottom: 8px;
}

.terminal-line {
  margin: 1px 0;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.terminal-line.prompt {
  color: #00ff00;
  font-weight: bold;
}

.terminal-line.output {
  color: #ffffff;
}

.terminal-line.error {
  color: #ff5555;
}

.terminal-line.success {
  color: #00ff00;
  font-weight: bold;
}

.terminal-line.info {
  color: #55ffff;
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
  font-family: 'Ubuntu Mono', 'Courier New', monospace;
  font-size: 13px;
  outline: none;
  caret-color: #00ff00;
}

.terminal-input::selection {
  background: #00ff00;
  color: #000000;
}

/* Scrollbar */
.terminal-output::-webkit-scrollbar {
  width: 10px;
}

.terminal-output::-webkit-scrollbar-track {
  background: #000000;
}

.terminal-output::-webkit-scrollbar-thumb {
  background: #00ff00;
  border: 1px solid #000000;
}

.terminal-output::-webkit-scrollbar-thumb:hover {
  background: #00cc00;
}
</style>
