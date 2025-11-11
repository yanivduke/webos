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
const variables = ref<Record<string, number | string>>({});
const stringVariables = ref<Record<string, string>>({});

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
    case 'LET':
      try {
        executeLet(args.join(' '));
      } catch {
        addOutput('?SYNTAX ERROR', 'error');
      }
      break;
    case 'HELP':
      showHelp();
      break;
    default:
      // Try to evaluate as variable assignment
      if (command.toUpperCase().match(/^[A-Z]\$?\s*=/)) {
        try {
          executeLet(command);
        } catch {
          addOutput('?SYNTAX ERROR', 'error');
        }
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
  addOutput('  LET VAR=VAL   - SET VARIABLE', 'output');
  addOutput('  POKE ADDR,VAL - POKE MEMORY', 'output');
  addOutput('  PEEK(ADDR)    - PEEK MEMORY', 'output');
  addOutput('  SYS <ADDR>    - SYS CALL', 'output');
  addOutput('  CLS           - CLEAR SCREEN', 'output');
  addOutput('', 'output');
  addOutput('PROGRAMMING:', 'success');
  addOutput('  LET A=10      - ASSIGN VARIABLE', 'output');
  addOutput('  IF A>5 THEN PRINT "YES"', 'output');
  addOutput('  FOR I=1 TO 10:PRINT I:NEXT I', 'output');
  addOutput('  GOSUB 1000    - CALL SUBROUTINE', 'output');
  addOutput('  RETURN        - RETURN FROM GOSUB', 'output');
  addOutput('  REM COMMENT   - COMMENT LINE', 'output');
  addOutput('', 'output');
  addOutput('EXAMPLE PROGRAM:', 'success');
  addOutput('  10 LET A=1', 'output');
  addOutput('  20 PRINT A', 'output');
  addOutput('  30 LET A=A+1', 'output');
  addOutput('  40 IF A<=10 THEN GOTO 20', 'output');
  addOutput('  50 END', 'output');
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
  variables.value = {};

  const forStack: Array<{ variable: string, end: number, step: number, lineIndex: number }> = [];
  const gosubStack: number[] = [];
  let currentLineIndex = 0;

  while (currentLineIndex < lines.length) {
    const lineNum = lines[currentLineIndex];
    const line = basicProgram.value[lineNum];
    const upperLine = line.toUpperCase().trim();

    try {
      // Parse BASIC statements
      if (upperLine.startsWith('REM')) {
        // Comment, skip
      } else if (upperLine.startsWith('LET ')) {
        executeLet(line.substring(4));
      } else if (upperLine.startsWith('PRINT ') || upperLine.startsWith('? ')) {
        const expr = line.substring(upperLine.indexOf(' ') + 1);
        await printValue(expr);
      } else if (upperLine.startsWith('IF ')) {
        const continueExec = executeIf(line.substring(3));
        if (!continueExec) {
          // Skip to next line if condition is false
          currentLineIndex++;
          continue;
        }
      } else if (upperLine.startsWith('FOR ')) {
        const forInfo = executeFor(line.substring(4));
        if (forInfo) {
          forStack.push({ ...forInfo, lineIndex: currentLineIndex });
        }
      } else if (upperLine.startsWith('NEXT')) {
        if (forStack.length > 0) {
          const forInfo = forStack[forStack.length - 1];
          variables.value[forInfo.variable] = (variables.value[forInfo.variable] as number) + forInfo.step;

          if (variables.value[forInfo.variable] as number <= forInfo.end) {
            // Continue loop
            currentLineIndex = forInfo.lineIndex;
            continue;
          } else {
            // End loop
            forStack.pop();
          }
        } else {
          addOutput('?NEXT WITHOUT FOR', 'error');
          break;
        }
      } else if (upperLine.startsWith('GOTO ')) {
        const targetLine = parseInt(line.substring(5).trim());
        const targetIndex = lines.indexOf(targetLine);
        if (targetIndex >= 0) {
          currentLineIndex = targetIndex;
          continue;
        } else {
          addOutput(`?UNDEF'D STATEMENT ERROR IN ${lineNum}`, 'error');
          break;
        }
      } else if (upperLine.startsWith('GOSUB ')) {
        const targetLine = parseInt(line.substring(6).trim());
        const targetIndex = lines.indexOf(targetLine);
        if (targetIndex >= 0) {
          gosubStack.push(currentLineIndex);
          currentLineIndex = targetIndex;
          continue;
        } else {
          addOutput(`?UNDEF'D STATEMENT ERROR IN ${lineNum}`, 'error');
          break;
        }
      } else if (upperLine === 'RETURN') {
        if (gosubStack.length > 0) {
          currentLineIndex = gosubStack.pop()!;
        } else {
          addOutput('?RETURN WITHOUT GOSUB', 'error');
          break;
        }
      } else if (upperLine === 'END' || upperLine === 'STOP') {
        break;
      } else if (upperLine.startsWith('INPUT ')) {
        addOutput('INPUT NOT SUPPORTED IN WEBOS', 'system');
        break;
      } else if (line.includes('=') && !upperLine.startsWith('IF')) {
        // Variable assignment without LET
        executeLet(line);
      } else if (upperLine.trim() === '') {
        // Empty line
      } else {
        // Unknown command
        addOutput(`?SYNTAX ERROR IN ${lineNum}`, 'error');
        break;
      }

      // Small delay for effect
      await new Promise(resolve => setTimeout(resolve, 50));

    } catch (error) {
      addOutput(`?ERROR IN ${lineNum}`, 'error');
      break;
    }

    currentLineIndex++;
  }

  programRunning.value = false;
};

const executeLet = (statement: string) => {
  const match = statement.match(/([A-Z]\$?)\s*=\s*(.+)/i);
  if (match) {
    const [, varName, expr] = match;
    const value = evaluateExpression(expr.trim());

    if (varName.endsWith('$')) {
      stringVariables.value[varName] = String(value);
    } else {
      variables.value[varName.toUpperCase()] = value as number;
    }
  } else {
    throw new Error('Syntax error in LET');
  }
};

const executeIf = (statement: string): boolean => {
  const thenMatch = statement.match(/(.+?)\s+THEN\s+(.+)/i);
  if (!thenMatch) {
    throw new Error('Syntax error in IF');
  }

  const [, condition, thenPart] = thenMatch;
  const conditionResult = evaluateCondition(condition.trim());

  if (conditionResult) {
    // Execute the THEN part
    const upperThen = thenPart.toUpperCase().trim();
    if (upperThen.startsWith('PRINT ')) {
      printValue(thenPart.substring(6));
    } else if (upperThen.startsWith('GOTO ')) {
      // This would require jumping, handled by returning line number
    } else if (thenPart.includes('=')) {
      executeLet(thenPart);
    }
    return true;
  }

  return false;
};

const executeFor = (statement: string): { variable: string, end: number, step: number } | null => {
  const match = statement.match(/([A-Z])\s*=\s*(\d+)\s+TO\s+(\d+)(?:\s+STEP\s+(\d+))?/i);
  if (match) {
    const [, varName, start, end, step] = match;
    variables.value[varName.toUpperCase()] = parseInt(start);
    return {
      variable: varName.toUpperCase(),
      end: parseInt(end),
      step: step ? parseInt(step) : 1
    };
  }
  throw new Error('Syntax error in FOR');
};

const evaluateCondition = (condition: string): boolean => {
  // Simple condition evaluator
  const operators = ['<=', '>=', '<>', '=', '<', '>'];

  for (const op of operators) {
    if (condition.includes(op)) {
      const parts = condition.split(op).map(p => p.trim());
      if (parts.length === 2) {
        const left = evaluateExpression(parts[0]);
        const right = evaluateExpression(parts[1]);

        switch (op) {
          case '=': return left === right;
          case '<>': return left !== right;
          case '<': return (left as number) < (right as number);
          case '>': return (left as number) > (right as number);
          case '<=': return (left as number) <= (right as number);
          case '>=': return (left as number) >= (right as number);
        }
      }
    }
  }

  return false;
};

const evaluateExpression = (expr: string): number | string => {
  expr = expr.trim();

  // Check if it's a string literal
  if (expr.startsWith('"') && expr.endsWith('"')) {
    return expr.substring(1, expr.length - 1);
  }

  // Check if it's a variable
  if (expr.match(/^[A-Z]\$?$/i)) {
    const varName = expr.toUpperCase();
    if (varName.endsWith('$')) {
      return stringVariables.value[varName] || '';
    }
    return variables.value[varName] || 0;
  }

  // Check if it's a number
  if (expr.match(/^-?\d+(\.\d+)?$/)) {
    return parseFloat(expr);
  }

  // Try to evaluate as math expression
  try {
    // Replace variables with their values
    let evalExpr = expr.toUpperCase();
    Object.keys(variables.value).forEach(varName => {
      const regex = new RegExp(`\\b${varName}\\b`, 'g');
      evalExpr = evalExpr.replace(regex, String(variables.value[varName]));
    });

    // Safely evaluate simple math expressions
    const result = eval(evalExpr.toLowerCase());
    return typeof result === 'number' ? result : 0;
  } catch {
    return 0;
  }
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
