<template>
  <div class="c64-terminal">
    <!-- Terminal Output -->
    <div class="terminal-output" ref="outputRef">
      <div class="terminal-header">
        **** COMMODORE 64 BASIC V2 ****
        <div class="memory-info">64K RAM SYSTEM  38911 BASIC BYTES FREE</div>
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
        <span class="prompt">READY.</span>
        <br>
        <input
          ref="inputRef"
          v-model="currentInput"
          type="text"
          class="terminal-input"
          @keyup.enter="executeCommand"
          @keyup.up="navigateHistory(-1)"
          @keyup.down="navigateHistory(1)"
          spellcheck="false"
        />
        <span class="cursor">█</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, nextTick } from 'vue';

interface OutputLine {
  text: string;
  type: 'prompt' | 'output' | 'error' | 'success' | 'system';
}

interface BasicProgram {
  [lineNumber: number]: string;
}

const outputLines = ref<OutputLine[]>([]);
const currentInput = ref('');
const commandHistory = ref<string[]>([]);
const historyIndex = ref(-1);
const outputRef = ref<HTMLDivElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const basicProgram = ref<BasicProgram>({});
const programRunning = ref(false);

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
    addOutput('READY.', 'prompt');
    currentInput.value = '';
    return;
  }

  // Add to history
  commandHistory.value.push(command);
  historyIndex.value = commandHistory.value.length;

  // Show the command (C64 style - just echo it)
  addOutput(command.toUpperCase(), 'output');

  // Parse command - check if it starts with a line number (BASIC program line)
  const lineNumMatch = command.match(/^(\d+)\s+(.*)/);
  if (lineNumMatch) {
    const lineNum = parseInt(lineNumMatch[1]);
    const lineCode = lineNumMatch[2];
    if (lineCode.trim()) {
      basicProgram.value[lineNum] = lineCode;
    } else {
      // Empty line after number = delete that line
      delete basicProgram.value[lineNum];
    }
    currentInput.value = '';
    addOutput('', 'output');
    addOutput('READY.', 'prompt');
    return;
  }

  // Parse direct command
  const parts = command.toUpperCase().split(' ');
  const cmd = parts[0];
  const args = parts.slice(1);

  // Clear input
  currentInput.value = '';

  // Execute BASIC command
  switch (cmd) {
    case 'LIST':
      listProgram(args[0]);
      break;
    case 'RUN':
      await runProgram();
      break;
    case 'NEW':
      newProgram();
      break;
    case 'LOAD':
      await loadFile(args[0] ? args.join(' ').replace(/"/g, '') : '');
      break;
    case 'SAVE':
      await saveFile(args[0] ? args.join(' ').replace(/"/g, '') : '');
      break;
    case 'DIR':
    case 'CATALOG':
      await showDirectory();
      break;
    case 'PRINT':
      printValue(args.join(' '));
      break;
    case 'CLS':
    case 'CLR':
      clearScreen();
      break;
    case 'SYS':
      sysCall(args[0]);
      break;
    case 'POKE':
      if (args.length >= 2) {
        addOutput(`POKE ${args[0]},${args[1]}`, 'output');
      } else {
        addOutput('?SYNTAX ERROR', 'error');
      }
      break;
    case 'PEEK':
      if (args[0]) {
        const value = Math.floor(Math.random() * 256);
        addOutput(`${value}`, 'output');
      } else {
        addOutput('?SYNTAX ERROR', 'error');
      }
      break;
    case '?':
      // Shorthand for PRINT
      printValue(args.join(' '));
      break;
    case 'HELP':
      showHelp();
      break;
    default:
      // Try to evaluate as expression
      if (command.includes('=') || command.match(/^\d+/)) {
        addOutput('?SYNTAX ERROR', 'error');
      } else {
        addOutput('?SYNTAX ERROR', 'error');
      }
  }

  addOutput('', 'output');
  addOutput('READY.', 'prompt');
};

const showHelp = () => {
  addOutput('COMMODORE 64 BASIC COMMANDS:', 'system');
  addOutput('', 'output');
  addOutput('PROGRAM COMMANDS:', 'success');
  addOutput('  LIST          - LIST PROGRAM', 'output');
  addOutput('  RUN           - RUN PROGRAM', 'output');
  addOutput('  NEW           - CLEAR PROGRAM', 'output');
  addOutput('  LOAD "NAME"   - LOAD FILE', 'output');
  addOutput('  SAVE "NAME"   - SAVE FILE', 'output');
  addOutput('  DIR           - DIRECTORY', 'output');
  addOutput('', 'output');
  addOutput('IMMEDIATE COMMANDS:', 'success');
  addOutput('  PRINT <EXPR>  - PRINT VALUE', 'output');
  addOutput('  ? <EXPR>      - SHORT PRINT', 'output');
  addOutput('  POKE ADDR,VAL - POKE MEMORY', 'output');
  addOutput('  PEEK(ADDR)    - PEEK MEMORY', 'output');
  addOutput('  SYS <ADDR>    - SYS CALL', 'output');
  addOutput('  CLS           - CLEAR SCREEN', 'output');
  addOutput('', 'output');
  addOutput('ENTER PROGRAM LINES:', 'success');
  addOutput('  10 PRINT "HELLO"', 'output');
  addOutput('  20 GOTO 10', 'output');
};

const listProgram = (lineNum?: string) => {
  const lines = Object.keys(basicProgram.value)
    .map(Number)
    .sort((a, b) => a - b);

  if (lines.length === 0) {
    addOutput('', 'output');
    return;
  }

  if (lineNum) {
    const num = parseInt(lineNum);
    if (basicProgram.value[num]) {
      addOutput(`${num} ${basicProgram.value[num]}`, 'output');
    }
  } else {
    lines.forEach(num => {
      addOutput(`${num} ${basicProgram.value[num]}`, 'output');
    });
  }
};

const runProgram = async () => {
  const lines = Object.keys(basicProgram.value)
    .map(Number)
    .sort((a, b) => a - b);

  if (lines.length === 0) {
    addOutput('?NO PROGRAM', 'error');
    return;
  }

  programRunning.value = true;

  for (const lineNum of lines) {
    const line = basicProgram.value[lineNum];
    const upperLine = line.toUpperCase().trim();

    // Parse BASIC statements
    if (upperLine.startsWith('PRINT ') || upperLine.startsWith('? ')) {
      const expr = line.substring(upperLine.indexOf(' ') + 1);
      printValue(expr);
    } else if (upperLine.startsWith('REM')) {
      // Comment, skip
      continue;
    } else if (upperLine.startsWith('GOTO ')) {
      // For simplicity, we won't implement full GOTO logic
      addOutput('GOTO NOT IMPLEMENTED IN WEBOS', 'system');
      break;
    } else if (upperLine === 'END') {
      break;
    } else if (upperLine.startsWith('INPUT ')) {
      addOutput('INPUT NOT SUPPORTED IN WEBOS', 'system');
      break;
    } else if (upperLine.startsWith('FOR ') || upperLine.startsWith('NEXT')) {
      addOutput('LOOPS NOT FULLY SUPPORTED', 'system');
    } else {
      // Unknown command
      addOutput(`?SYNTAX ERROR IN ${lineNum}`, 'error');
      break;
    }

    // Small delay for effect
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  programRunning.value = false;
};

const newProgram = () => {
  basicProgram.value = {};
  addOutput('', 'output');
};

const printValue = (expr: string) => {
  // Remove quotes if present
  let value = expr.trim();

  // Handle quoted strings
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.substring(1, value.length - 1);
    addOutput(value, 'output');
  } else if (value.match(/^\d+$/)) {
    // Number
    addOutput(value, 'output');
  } else if (value.includes('+') || value.includes('-') || value.includes('*') || value.includes('/')) {
    // Try to evaluate simple math
    try {
      const result = eval(value);
      addOutput(String(result), 'output');
    } catch {
      addOutput('?SYNTAX ERROR', 'error');
    }
  } else {
    // Just print it
    addOutput(value, 'output');
  }
};

const loadFile = async (filename: string) => {
  if (!filename) {
    addOutput('?FILE NAME ERROR', 'error');
    return;
  }

  try {
    addOutput(`SEARCHING FOR ${filename}`, 'system');
    await new Promise(resolve => setTimeout(resolve, 500));

    const response = await fetch('/api/files/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: `dh0/${filename}` })
    });

    if (!response.ok) {
      addOutput('?FILE NOT FOUND ERROR', 'error');
      return;
    }

    const data = await response.json();
    addOutput('LOADING', 'system');
    await new Promise(resolve => setTimeout(resolve, 300));

    // Parse as BASIC program
    basicProgram.value = {};
    const lines = data.content.split('\n');
    lines.forEach((line: string) => {
      const match = line.match(/^(\d+)\s+(.*)/);
      if (match) {
        basicProgram.value[parseInt(match[1])] = match[2];
      }
    });

    addOutput('READY.', 'success');
  } catch (error) {
    addOutput('?DEVICE NOT PRESENT ERROR', 'error');
  }
};

const saveFile = async (filename: string) => {
  if (!filename) {
    addOutput('?FILE NAME ERROR', 'error');
    return;
  }

  const lines = Object.keys(basicProgram.value)
    .map(Number)
    .sort((a, b) => a - b);

  if (lines.length === 0) {
    addOutput('?NO PROGRAM', 'error');
    return;
  }

  const content = lines.map(num => `${num} ${basicProgram.value[num]}`).join('\n');

  try {
    addOutput(`SAVING ${filename}`, 'system');

    const response = await fetch('/api/files/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'dh0',
        name: filename,
        type: 'file',
        content: content
      })
    });

    if (!response.ok) {
      addOutput('?FILE ERROR', 'error');
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    addOutput('OK', 'success');
  } catch (error) {
    addOutput('?DEVICE NOT PRESENT ERROR', 'error');
  }
};

const showDirectory = async () => {
  try {
    addOutput('', 'output');
    addOutput('DISK DIRECTORY:', 'system');
    addOutput('', 'output');

    const response = await fetch('/api/files/list?path=dh0');
    if (!response.ok) {
      addOutput('?FILE ERROR', 'error');
      return;
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      addOutput('0 BLOCKS FREE.', 'output');
      return;
    }

    data.items.forEach((item: any, idx: number) => {
      const blocks = Math.floor((item.size || 1024) / 256);
      addOutput(`${String(blocks).padStart(4)} "${item.name.toUpperCase()}"`, 'output');
    });

    const totalBlocks = 664;
    const usedBlocks = data.items.length * 16;
    addOutput(`${totalBlocks - usedBlocks} BLOCKS FREE.`, 'output');
  } catch (error) {
    addOutput('?DEVICE NOT PRESENT ERROR', 'error');
  }
};

const sysCall = (addr: string) => {
  if (!addr) {
    addOutput('?SYNTAX ERROR', 'error');
    return;
  }

  const address = parseInt(addr);
  if (address === 64738) {
    // SYS 64738 = Reset
    addOutput('', 'output');
    clearScreen();
    addOutput('**** COMMODORE 64 BASIC V2 ****', 'system');
    addOutput('64K RAM SYSTEM  38911 BASIC BYTES FREE', 'system');
  } else {
    addOutput(`CALLING SYSTEM ROUTINE AT ${address}...`, 'system');
    addOutput('ROUTINE COMPLETE', 'system');
  }
};

const clearScreen = () => {
  outputLines.value = [];
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
</script>

<style scoped>
.c64-terminal {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #3539BC;
  font-family: 'C64 Pro Mono', 'Courier New', monospace;
  color: #A5A5FF;
}

.terminal-output {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.6;
  letter-spacing: 0.5px;
}

.terminal-header {
  color: #A5A5FF;
  font-weight: bold;
  margin-bottom: 16px;
  text-transform: uppercase;
}

.memory-info {
  margin-top: 4px;
}

.terminal-line {
  margin: 2px 0;
  word-wrap: break-word;
  white-space: pre-wrap;
  text-transform: uppercase;
}

.terminal-line.prompt {
  color: #A5A5FF;
  font-weight: bold;
}

.terminal-line.output {
  color: #A5A5FF;
}

.terminal-line.error {
  color: #FF7777;
}

.terminal-line.success {
  color: #7CFC00;
}

.terminal-line.system {
  color: #A5A5FF;
  font-weight: bold;
}

.terminal-input-line {
  display: flex;
  align-items: center;
  margin-top: 8px;
  position: relative;
}

.prompt {
  color: #A5A5FF;
  font-weight: bold;
  white-space: nowrap;
  display: block;
  margin-bottom: 4px;
}

.terminal-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #A5A5FF;
  font-family: 'C64 Pro Mono', 'Courier New', monospace;
  font-size: 14px;
  outline: none;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: 100%;
  caret-color: transparent;
}

.cursor {
  display: inline-block;
  background: #A5A5FF;
  color: #3539BC;
  animation: blink 1s step-end infinite;
  margin-left: 2px;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.terminal-input::selection {
  background: #A5A5FF;
  color: #3539BC;
}

/* Scrollbar - C64 style */
.terminal-output::-webkit-scrollbar {
  width: 12px;
}

.terminal-output::-webkit-scrollbar-track {
  background: #3539BC;
}

.terminal-output::-webkit-scrollbar-thumb {
  background: #A5A5FF;
  border: 2px solid #3539BC;
}

.terminal-output::-webkit-scrollbar-thumb:hover {
  background: #7C71DA;
}

/* Classic C64 border effect */
.c64-terminal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 24px solid #3539BC;
  pointer-events: none;
  z-index: -1;
}
</style>
