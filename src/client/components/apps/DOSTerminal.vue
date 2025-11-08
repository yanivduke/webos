<template>
  <div class="dos-terminal">
    <!-- Terminal Output -->
    <div class="terminal-output" ref="outputRef">
      <div class="terminal-header">
        Microsoft(R) MS-DOS(R) Version 6.22
        <div class="copyright">        (C)Copyright Microsoft Corp 1981-1994.</div>
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
        <span class="prompt">{{ currentPath }}></span>
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
        <span class="cursor">_</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, nextTick } from 'vue';

interface OutputLine {
  text: string;
  type: 'prompt' | 'output' | 'error' | 'success' | 'header';
}

const outputLines = ref<OutputLine[]>([]);
const currentInput = ref('');
const currentPath = ref('C:\\');
const currentDrive = ref('C:');
const commandHistory = ref<string[]>([]);
const historyIndex = ref(-1);
const outputRef = ref<HTMLDivElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

onMounted(() => {
  inputRef.value?.focus();
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
  if (!command) {
    addOutput('', 'output');
    currentInput.value = '';
    return;
  }

  // Add to history
  commandHistory.value.push(command);
  historyIndex.value = commandHistory.value.length;

  // Show the command
  addOutput(`${currentPath.value}>${command}`, 'prompt');

  // Parse command (DOS is case-insensitive)
  const parts = command.split(' ');
  const cmd = parts[0].toUpperCase();
  const args = parts.slice(1);

  // Clear input
  currentInput.value = '';

  // Execute command
  switch (cmd) {
    case 'HELP':
    case '?':
      showHelp();
      break;
    case 'CLS':
      clearScreen();
      break;
    case 'DIR':
      await listFiles(args);
      break;
    case 'CD':
    case 'CHDIR':
      changeDirectory(args.join(' '));
      break;
    case 'MD':
    case 'MKDIR':
      await makeDirectory(args.join(' '));
      break;
    case 'RD':
    case 'RMDIR':
      await removeDirectory(args.join(' '));
      break;
    case 'DEL':
    case 'ERASE':
      await deleteFile(args.join(' '));
      break;
    case 'TYPE':
      await typeFile(args.join(' '));
      break;
    case 'COPY':
      addOutput('Copy function not implemented', 'output');
      break;
    case 'MOVE':
    case 'REN':
    case 'RENAME':
      addOutput('Rename/Move function not implemented', 'output');
      break;
    case 'ECHO':
      if (args.length === 0 || args[0].toUpperCase() === 'ON' || args[0].toUpperCase() === 'OFF') {
        addOutput('ECHO is on', 'output');
      } else {
        addOutput(args.join(' '), 'output');
      }
      break;
    case 'DATE':
      showDate();
      break;
    case 'TIME':
      showTime();
      break;
    case 'VER':
      showVersion();
      break;
    case 'VOL':
      showVolume();
      break;
    case 'PATH':
      addOutput('PATH=C:\\DOS;C:\\WINDOWS;C:\\', 'output');
      break;
    case 'PROMPT':
      addOutput('PROMPT command not supported', 'output');
      break;
    case 'SET':
      showEnvironment();
      break;
    case 'MEM':
      showMemory();
      break;
    case 'TREE':
      await showTree();
      break;
    case 'ATTRIB':
      addOutput('ATTRIB command not implemented', 'output');
      break;
    case 'FORMAT':
      addOutput('FORMAT is disabled for safety', 'error');
      break;
    case 'FDISK':
      addOutput('FDISK is disabled for safety', 'error');
      break;
    case 'EDIT':
      addOutput('Use NotePad from the Tools menu', 'output');
      break;
    case 'DEBUG':
      addOutput('DEBUG mode not available', 'output');
      break;
    case 'EXIT':
      addOutput('Use the window close button to exit', 'output');
      break;
    default:
      // Check if it's a drive letter change
      if (cmd.match(/^[A-Z]:$/)) {
        changeDrive(cmd);
      } else {
        addOutput(`Bad command or file name`, 'error');
      }
  }

  addOutput('', 'output');
};

const showHelp = () => {
  addOutput('For more information on a specific command, type HELP command-name', 'output');
  addOutput('', 'output');
  addOutput('ATTRIB   Displays or changes file attributes.', 'output');
  addOutput('CD       Displays the name of or changes the current directory.', 'output');
  addOutput('CHDIR    Displays the name of or changes the current directory.', 'output');
  addOutput('CLS      Clears the screen.', 'output');
  addOutput('COPY     Copies one or more files to another location.', 'output');
  addOutput('DATE     Displays or sets the date.', 'output');
  addOutput('DEL      Deletes one or more files.', 'output');
  addOutput('DIR      Displays a list of files and subdirectories in a directory.', 'output');
  addOutput('ECHO     Displays messages, or turns command echoing on or off.', 'output');
  addOutput('ERASE    Deletes one or more files.', 'output');
  addOutput('EXIT     Quits the command interpreter.', 'output');
  addOutput('HELP     Provides Help information for commands.', 'output');
  addOutput('MD       Creates a directory.', 'output');
  addOutput('MEM      Displays the amount of used and free memory.', 'output');
  addOutput('MKDIR    Creates a directory.', 'output');
  addOutput('PATH     Displays or sets a search path for executable files.', 'output');
  addOutput('RD       Removes a directory.', 'output');
  addOutput('REN      Renames a file or files.', 'output');
  addOutput('RENAME   Renames a file or files.', 'output');
  addOutput('RMDIR    Removes a directory.', 'output');
  addOutput('SET      Displays or sets environment variables.', 'output');
  addOutput('TIME     Displays or sets the system time.', 'output');
  addOutput('TREE     Graphically displays the directory structure.', 'output');
  addOutput('TYPE     Displays the contents of a text file.', 'output');
  addOutput('VER      Displays the version.', 'output');
  addOutput('VOL      Displays a disk volume label.', 'output');
};

const clearScreen = () => {
  outputLines.value = [];
};

const listFiles = async (args: string[]) => {
  const wide = args.includes('/W') || args.includes('/w');
  const pause = args.includes('/P') || args.includes('/p');

  try {
    // Map DOS path to Amiga path
    const amigaPath = pathToAmiga(currentPath.value);

    const response = await fetch(`/api/files/list?path=${encodeURIComponent(amigaPath)}`);

    if (!response.ok) {
      addOutput('File Not Found', 'error');
      return;
    }

    const data = await response.json();

    addOutput(' Volume in drive C is WEBOS', 'header');
    addOutput(' Volume Serial Number is 1A2B-3C4D', 'header');
    addOutput('', 'output');
    addOutput(` Directory of ${currentPath.value}`, 'output');
    addOutput('', 'output');

    if (!data.items || data.items.length === 0) {
      addOutput('File Not Found', 'output');
      return;
    }

    let fileCount = 0;
    let dirCount = 0;
    let totalBytes = 0;

    if (wide) {
      // Wide format
      const items: string[] = [];
      data.items.forEach((item: any) => {
        if (item.type === 'folder') {
          items.push(`[${item.name.toUpperCase()}]`);
          dirCount++;
        } else {
          items.push(item.name.toUpperCase());
          fileCount++;
          totalBytes += item.size || 0;
        }
      });

      // Display in columns
      for (let i = 0; i < items.length; i += 5) {
        const row = items.slice(i, i + 5);
        addOutput(row.map(name => name.padEnd(15)).join(' '), 'output');
      }
    } else {
      // Normal format
      data.items.forEach((item: any) => {
        const date = new Date();
        const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getFullYear()).slice(2)}`;
        const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

        if (item.type === 'folder') {
          const line = `${dateStr}  ${timeStr}    <DIR>          ${item.name.toUpperCase()}`;
          addOutput(line, 'output');
          dirCount++;
        } else {
          const size = String(item.size || 0).padStart(13);
          const line = `${dateStr}  ${timeStr}         ${size} ${item.name.toUpperCase()}`;
          addOutput(line, 'output');
          fileCount++;
          totalBytes += item.size || 0;
        }
      });
    }

    addOutput(`      ${fileCount} file(s)    ${totalBytes.toLocaleString()} bytes`, 'output');
    addOutput(`      ${dirCount} dir(s)     ${(10485760).toLocaleString()} bytes free`, 'output');
  } catch (error) {
    addOutput('File Not Found', 'error');
    console.error('Error:', error);
  }
};

const changeDirectory = (dir: string) => {
  if (!dir || dir === '.') {
    addOutput(currentPath.value, 'output');
    return;
  }

  if (dir === '..') {
    // Go up one directory
    const parts = currentPath.value.split('\\').filter(p => p);
    if (parts.length <= 1) {
      currentPath.value = currentDrive.value + '\\';
    } else {
      parts.pop();
      currentPath.value = parts.join('\\') + '\\';
    }
  } else if (dir === '\\') {
    currentPath.value = currentDrive.value + '\\';
  } else if (dir.startsWith('\\')) {
    currentPath.value = currentDrive.value + dir;
    if (!currentPath.value.endsWith('\\')) {
      currentPath.value += '\\';
    }
  } else {
    // Relative path
    let newPath = currentPath.value;
    if (!newPath.endsWith('\\')) {
      newPath += '\\';
    }
    newPath += dir;
    if (!newPath.endsWith('\\')) {
      newPath += '\\';
    }
    currentPath.value = newPath;
  }
};

const changeDrive = (drive: string) => {
  currentDrive.value = drive;
  currentPath.value = drive + '\\';
  addOutput('', 'output');
};

const makeDirectory = async (dirname: string) => {
  if (!dirname) {
    addOutput('Required parameter missing', 'error');
    return;
  }

  try {
    const amigaPath = pathToAmiga(currentPath.value);

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
      addOutput('Unable to create directory', 'error');
      return;
    }

    addOutput('', 'output');
  } catch (error) {
    addOutput('Unable to create directory', 'error');
  }
};

const removeDirectory = async (dirname: string) => {
  if (!dirname) {
    addOutput('Required parameter missing', 'error');
    return;
  }

  try {
    const amigaPath = pathToAmiga(currentPath.value);
    const itemPath = `${amigaPath}/${dirname}`;

    const response = await fetch(`/api/files/delete?path=${encodeURIComponent(itemPath)}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      addOutput('Invalid path, not directory, or directory not empty', 'error');
      return;
    }

    addOutput('', 'output');
  } catch (error) {
    addOutput('Unable to remove directory', 'error');
  }
};

const deleteFile = async (filename: string) => {
  if (!filename) {
    addOutput('Required parameter missing', 'error');
    return;
  }

  try {
    const amigaPath = pathToAmiga(currentPath.value);
    const itemPath = `${amigaPath}/${filename}`;

    const response = await fetch(`/api/files/delete?path=${encodeURIComponent(itemPath)}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      addOutput('File not found', 'error');
      return;
    }

    addOutput('', 'output');
  } catch (error) {
    addOutput('File not found', 'error');
  }
};

const typeFile = async (filename: string) => {
  if (!filename) {
    addOutput('Required parameter missing', 'error');
    return;
  }

  try {
    const amigaPath = pathToAmiga(currentPath.value);
    const filePath = `${amigaPath}/${filename}`;

    const response = await fetch('/api/files/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath })
    });

    if (!response.ok) {
      addOutput('File not found', 'error');
      return;
    }

    const data = await response.json();
    const lines = data.content.split('\n');
    lines.forEach((line: string) => addOutput(line, 'output'));
  } catch (error) {
    addOutput('File not found', 'error');
  }
};

const showDate = () => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: '2-digit', day: '2-digit', year: 'numeric' });
  addOutput(`Current date is ${dateStr}`, 'output');
};

const showTime = () => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  addOutput(`Current time is ${timeStr}`, 'output');
};

const showVersion = () => {
  addOutput('', 'output');
  addOutput('Microsoft(R) MS-DOS(R) Version 6.22', 'header');
  addOutput('        (C)Copyright Microsoft Corp 1981-1994.', 'header');
  addOutput('        Running on WebOS Emulation Layer', 'output');
};

const showVolume = () => {
  addOutput(' Volume in drive C is WEBOS', 'output');
  addOutput(' Volume Serial Number is 1A2B-3C4D', 'output');
};

const showEnvironment = () => {
  addOutput('COMSPEC=C:\\COMMAND.COM', 'output');
  addOutput('PATH=C:\\DOS;C:\\WINDOWS;C:\\', 'output');
  addOutput('PROMPT=$P$G', 'output');
  addOutput('TEMP=C:\\TEMP', 'output');
  addOutput('TMP=C:\\TEMP', 'output');
  addOutput('WEBOS=TRUE', 'output');
};

const showMemory = () => {
  addOutput('', 'output');
  addOutput('Memory Type        Total       Used       Free', 'header');
  addOutput('----------------  --------   --------   --------', 'output');
  addOutput('Conventional         640K       256K       384K', 'output');
  addOutput('Upper                384K       128K       256K', 'output');
  addOutput('Reserved             384K       384K         0K', 'output');
  addOutput('Extended (XMS)     15360K      8192K      7168K', 'output');
  addOutput('----------------  --------   --------   --------', 'output');
  addOutput('Total memory       16768K      8960K      7808K', 'output');
  addOutput('', 'output');
  addOutput('Total under 1 MB     1024K       384K       640K', 'output');
  addOutput('', 'output');
  addOutput('Largest executable program size        384K (393,216 bytes)', 'output');
  addOutput('Largest free upper memory block         64K ( 65,536 bytes)', 'output');
  addOutput('MS-DOS is resident in the high memory area.', 'output');
};

const showTree = async () => {
  addOutput('Directory PATH listing', 'output');
  addOutput('Volume serial number is 1A2B-3C4D', 'output');
  addOutput(`${currentPath.value}`, 'output');
  addOutput('├───SYSTEM', 'output');
  addOutput('├───WINDOWS', 'output');
  addOutput('├───DOS', 'output');
  addOutput('└───TEMP', 'output');
};

const pathToAmiga = (dosPath: string): string => {
  // Convert DOS path to Amiga path
  // C:\ -> dh0
  // C:\FOO -> dh0/foo
  const path = dosPath.replace(/^[A-Z]:\\/, '').replace(/\\/g, '/').toLowerCase();
  return path ? `dh0/${path}` : 'dh0';
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
  const commands = ['DIR', 'CD', 'CLS', 'COPY', 'DEL', 'TYPE', 'ECHO', 'DATE', 'TIME',
                    'HELP', 'VER', 'VOL', 'PATH', 'SET', 'MEM', 'TREE', 'MD', 'RD'];
  const input = currentInput.value.toUpperCase();

  if (!input) return;

  const matches = commands.filter(cmd => cmd.startsWith(input));
  if (matches.length === 1) {
    currentInput.value = matches[0];
  }
};
</script>

<style scoped>
.dos-terminal {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #000000;
  font-family: 'Perfect DOS VGA 437', 'Consolas', 'Courier New', monospace;
  color: #AAAAAA;
}

.terminal-output {
  flex: 1;
  padding: 8px 12px;
  overflow-y: auto;
  font-size: 16px;
  line-height: 1.2;
}

.terminal-header {
  color: #FFFFFF;
  font-weight: bold;
  margin-bottom: 8px;
}

.copyright {
  margin-top: 2px;
}

.terminal-line {
  margin: 0;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.terminal-line.prompt {
  color: #FFFFFF;
  font-weight: bold;
}

.terminal-line.output {
  color: #AAAAAA;
}

.terminal-line.error {
  color: #FFFFFF;
}

.terminal-line.success {
  color: #55FF55;
}

.terminal-line.header {
  color: #FFFFFF;
  font-weight: bold;
}

.terminal-input-line {
  display: flex;
  align-items: center;
  margin-top: 4px;
}

.prompt {
  color: #FFFFFF;
  font-weight: bold;
  margin-right: 0;
  white-space: nowrap;
}

.terminal-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #FFFFFF;
  font-family: 'Perfect DOS VGA 437', 'Consolas', 'Courier New', monospace;
  font-size: 16px;
  outline: none;
  margin-left: 0;
  caret-color: transparent;
}

.cursor {
  display: inline-block;
  background: #AAAAAA;
  color: #000000;
  animation: blink-dos 0.7s step-end infinite;
  margin-left: 1px;
  width: 9px;
}

@keyframes blink-dos {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.terminal-input::selection {
  background: #AAAAAA;
  color: #000000;
}

/* Scrollbar - DOS style */
.terminal-output::-webkit-scrollbar {
  width: 14px;
}

.terminal-output::-webkit-scrollbar-track {
  background: #000000;
}

.terminal-output::-webkit-scrollbar-thumb {
  background: #AAAAAA;
  border: 1px solid #000000;
}

.terminal-output::-webkit-scrollbar-thumb:hover {
  background: #FFFFFF;
}

/* DOS scanline effect */
.dos-terminal::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(255, 255, 255, 0.03) 0px,
    transparent 1px,
    transparent 2px,
    rgba(255, 255, 255, 0.03) 3px
  );
  pointer-events: none;
  opacity: 0.3;
}
</style>
