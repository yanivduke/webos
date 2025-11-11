<template>
  <div class="telnet-client">
    <!-- Connection Bar -->
    <div class="connection-bar">
      <input
        v-model="hostname"
        type="text"
        class="amiga-input host-input"
        placeholder="hostname"
        :disabled="isConnected"
      />
      <input
        v-model.number="port"
        type="number"
        class="amiga-input port-input"
        placeholder="23"
        :disabled="isConnected"
      />
      <button
        class="amiga-button"
        @click="isConnected ? disconnect() : connect()"
      >
        {{ isConnected ? 'Disconnect' : 'Connect' }}
      </button>
      <span v-if="isConnected" class="status-indicator connected">● Connected</span>
      <span v-else-if="isConnecting" class="status-indicator connecting">● Connecting...</span>
      <span v-else class="status-indicator disconnected">○ Disconnected</span>

      <!-- New action buttons -->
      <button
        class="amiga-button small"
        @click="saveLog"
        :disabled="outputLines.length === 0"
        title="Save session log"
      >
        💾 Save Log
      </button>
      <button
        class="amiga-button small"
        @click="clearScreen"
        title="Clear screen"
      >
        🗑 Clear
      </button>
      <button
        class="amiga-button small"
        @click="autoScroll = !autoScroll"
        :class="{ active: autoScroll }"
        title="Toggle auto-scroll"
      >
        {{ autoScroll ? '⬇ Auto' : '⬇ Manual' }}
      </button>
    </div>

    <!-- Terminal Output -->
    <div class="terminal-output" ref="outputRef">
      <div
        v-for="(line, index) in outputLines"
        :key="index"
        class="terminal-line"
        :class="line.type"
        v-html="renderLine(line.text)"
      ></div>
      <div v-if="isConnected" class="terminal-input-line">
        <span class="prompt">{{ currentPrompt }}</span>
        <input
          ref="inputRef"
          v-model="currentInput"
          type="text"
          class="terminal-input"
          @keyup.enter="sendCommand"
          @keyup.up="navigateHistory(-1)"
          @keyup.down="navigateHistory(1)"
          @keydown.tab.prevent="autocomplete"
          spellcheck="false"
          placeholder="Type command..."
        />
      </div>
    </div>

    <!-- Enhanced Control Bar -->
    <div class="control-bar">
      <div class="control-group">
        <span class="control-label">Colors:</span>
        <button
          class="amiga-button tiny"
          @click="ansiColors = !ansiColors"
          :class="{ active: ansiColors }"
        >
          {{ ansiColors ? 'ON' : 'OFF' }}
        </button>
      </div>

      <div class="control-group">
        <span class="control-label">Echo:</span>
        <button
          class="amiga-button tiny"
          @click="localEcho = !localEcho"
          :class="{ active: localEcho }"
        >
          {{ localEcho ? 'ON' : 'OFF' }}
        </button>
      </div>

      <div class="control-group">
        <span class="control-label">Lines:</span>
        <span class="stat-value">{{ outputLines.length }}</span>
      </div>

      <div class="control-group">
        <span class="control-label">Bytes:</span>
        <span class="stat-value">{{ formatBytes(bytesReceived) }}</span>
      </div>

      <div class="control-group">
        <span class="control-label">Time:</span>
        <span class="stat-value">{{ connectionTime }}</span>
      </div>
    </div>

    <!-- Quick Connect Presets -->
    <div class="presets-bar">
      <div class="preset-label">Quick Connect:</div>
      <button
        class="amiga-button small"
        @click="quickConnect('towel.blinkenlights.nl', 23)"
        :disabled="isConnected"
      >
        🎬 Star Wars
      </button>
      <button
        class="amiga-button small"
        @click="quickConnect('telehack.com', 23)"
        :disabled="isConnected"
      >
        💻 Telehack
      </button>
      <button
        class="amiga-button small"
        @click="quickConnect('mud.darkerrealms.org', 2000)"
        :disabled="isConnected"
      >
        🎮 MUD Game
      </button>
      <button
        class="amiga-button small"
        @click="quickConnect('rainmaker.wunderground.com', 3000)"
        :disabled="isConnected"
      >
        🌤 Weather
      </button>
      <button
        class="amiga-button small"
        @click="quickConnect('localhost', 23)"
        :disabled="isConnected"
      >
        🏠 Localhost
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';

interface OutputLine {
  text: string;
  type: 'output' | 'error' | 'success' | 'info' | 'system';
  timestamp?: number;
}

const hostname = ref('towel.blinkenlights.nl');
const port = ref(23);
const isConnected = ref(false);
const isConnecting = ref(false);
const outputLines = ref<OutputLine[]>([]);
const currentInput = ref('');
const commandHistory = ref<string[]>([]);
const historyIndex = ref(-1);
const outputRef = ref<HTMLDivElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const sessionId = ref<string | null>(null);
const autoScroll = ref(true);
const ansiColors = ref(true);
const localEcho = ref(false);
const bytesReceived = ref(0);
const connectionStartTime = ref<number | null>(null);
const connectionTimeInterval = ref<number | null>(null);
const currentPrompt = ref('> ');

const connectionTime = computed(() => {
  if (!isConnected.value || !connectionStartTime.value) return '00:00';
  const now = Date.now();
  const elapsed = Math.floor((now - connectionStartTime.value) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

onMounted(() => {
  addOutput('Telnet Client v1.1 - Enhanced Edition', 'system');
  addOutput('ANSI color support • Session logging • Auto-scroll', 'info');
  addOutput('Enter hostname and port, then click Connect', 'info');
  addOutput('', 'output');
});

onUnmounted(() => {
  if (isConnected.value) {
    disconnect();
  }
  if (connectionTimeInterval.value) {
    clearInterval(connectionTimeInterval.value);
  }
});

const addOutput = (text: string, type: OutputLine['type'] = 'output') => {
  outputLines.value.push({
    text,
    type,
    timestamp: Date.now()
  });

  if (autoScroll.value) {
    nextTick(() => {
      if (outputRef.value) {
        outputRef.value.scrollTop = outputRef.value.scrollHeight;
      }
    });
  }
};

// ANSI color code to HTML conversion
const ansiToHtml = (text: string): string => {
  if (!ansiColors.value) {
    // Strip ANSI codes if colors are disabled
    return text.replace(/\x1b\[[0-9;]*m/g, '');
  }

  const ansiColorMap: { [key: string]: string } = {
    '30': '#000000', // Black
    '31': '#ff5555', // Red
    '32': '#50fa7b', // Green
    '33': '#f1fa8c', // Yellow
    '34': '#bd93f9', // Blue
    '35': '#ff79c6', // Magenta
    '36': '#8be9fd', // Cyan
    '37': '#f8f8f2', // White
    '90': '#6272a4', // Bright Black
    '91': '#ff6e6e', // Bright Red
    '92': '#69ff94', // Bright Green
    '93': '#ffffa5', // Bright Yellow
    '94': '#d6acff', // Bright Blue
    '95': '#ff92df', // Bright Magenta
    '96': '#a4ffff', // Bright Cyan
    '97': '#ffffff', // Bright White
  };

  let html = text;
  let currentColor = '#00ff00';
  let isBold = false;

  // Replace ANSI escape codes
  html = html.replace(/\x1b\[([0-9;]*)m/g, (match, codes) => {
    if (!codes) return '</span>';

    const codeList = codes.split(';');
    let style = '';

    for (const code of codeList) {
      if (code === '0' || code === '') {
        // Reset
        isBold = false;
        currentColor = '#00ff00';
        return '</span><span>';
      } else if (code === '1') {
        // Bold
        isBold = true;
        style += 'font-weight: bold;';
      } else if (ansiColorMap[code]) {
        // Color
        currentColor = ansiColorMap[code];
        style += `color: ${currentColor};`;
      }
    }

    return `</span><span style="${style}">`;
  });

  return `<span>${html}</span>`;
};

const renderLine = (text: string): string => {
  // Handle HTML escaping for non-ANSI content
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // Apply ANSI color conversion
  escaped = ansiToHtml(escaped);

  // Convert URLs to clickable links
  escaped = escaped.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" class="terminal-link">$1</a>'
  );

  return escaped;
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const connect = async () => {
  if (!hostname.value) {
    addOutput('Error: Please enter a hostname', 'error');
    return;
  }

  isConnecting.value = true;
  addOutput(`Connecting to ${hostname.value}:${port.value}...`, 'system');

  try {
    const response = await fetch('/api/network/telnet/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: hostname.value,
        port: port.value
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Connection failed');
    }

    const data = await response.json();
    sessionId.value = data.sessionId;
    isConnected.value = true;
    connectionStartTime.value = Date.now();
    addOutput(`Connected to ${hostname.value}:${port.value}`, 'success');
    addOutput('', 'output');

    // Start receiving data
    startReceiving();

    // Focus input
    nextTick(() => {
      inputRef.value?.focus();
    });

  } catch (error: any) {
    addOutput(`Connection failed: ${error.message}`, 'error');
  } finally {
    isConnecting.value = false;
  }
};

const disconnect = async () => {
  if (!sessionId.value) return;

  try {
    await fetch(`/api/network/telnet/disconnect/${sessionId.value}`, {
      method: 'POST'
    });
  } catch (error) {
    console.error('Disconnect error:', error);
  }

  isConnected.value = false;
  sessionId.value = null;
  connectionStartTime.value = null;
  addOutput('', 'output');
  addOutput('Connection closed', 'system');
  addOutput('', 'output');
};

const sendCommand = async () => {
  const command = currentInput.value;
  if (!command || !isConnected.value || !sessionId.value) return;

  // Add to history
  if (command.trim()) {
    commandHistory.value.push(command);
    historyIndex.value = commandHistory.value.length;
  }

  // Show the command if local echo is enabled
  if (localEcho.value) {
    addOutput(currentPrompt.value + command, 'output');
  }

  // Send to server
  try {
    await fetch('/api/network/telnet/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId.value,
        data: command + '\r\n'
      })
    });
  } catch (error: any) {
    addOutput(`Send error: ${error.message}`, 'error');
  }

  // Clear input
  currentInput.value = '';
};

const startReceiving = async () => {
  if (!sessionId.value) return;

  const pollInterval = setInterval(async () => {
    if (!isConnected.value || !sessionId.value) {
      clearInterval(pollInterval);
      return;
    }

    try {
      const response = await fetch(`/api/network/telnet/receive/${sessionId.value}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          bytesReceived.value += data.data.length;

          // Split by lines and add each
          const lines = data.data.split('\n');
          lines.forEach((line: string) => {
            if (line || lines.length === 1) {
              addOutput(line, 'output');
            }
          });
        }
      }
    } catch (error) {
      console.error('Receive error:', error);
    }
  }, 300); // Poll every 300ms for more responsive updates
};

const navigateHistory = (direction: number) => {
  if (commandHistory.value.length === 0) return;

  historyIndex.value += direction;
  if (historyIndex.value < 0) historyIndex.value = 0;
  if (historyIndex.value >= commandHistory.value.length) {
    historyIndex.value = commandHistory.value.length;
    currentInput.value = '';
  } else {
    currentInput.value = commandHistory.value[historyIndex.value];
  }
};

const autocomplete = () => {
  // Basic autocomplete stub - can be enhanced
  console.log('Autocomplete requested');
};

const quickConnect = (host: string, portNum: number) => {
  hostname.value = host;
  port.value = portNum;
  connect();
};

const clearScreen = () => {
  outputLines.value = [];
  bytesReceived.value = 0;
  addOutput('Screen cleared', 'system');
};

const saveLog = () => {
  if (outputLines.value.length === 0) return;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `telnet-log-${hostname.value}-${timestamp}.txt`;

  const logContent = outputLines.value
    .map(line => {
      const time = line.timestamp ? new Date(line.timestamp).toLocaleTimeString() : '';
      return `[${time}] ${line.text}`;
    })
    .join('\n');

  const blob = new Blob([logContent], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

  addOutput(`Log saved: ${filename}`, 'success');
};
</script>

<style scoped>
.telnet-client {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #000000;
  font-family: 'Press Start 2P', 'Courier New', monospace;
}

.connection-bar {
  display: flex;
  gap: 6px;
  padding: 8px;
  background: #a0a0a0;
  border-bottom: 2px solid #000000;
  align-items: center;
  flex-wrap: wrap;
}

.amiga-input {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px 8px;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
}

.host-input {
  flex: 1;
  min-width: 150px;
}

.port-input {
  width: 70px;
}

.amiga-input:disabled {
  background: #cccccc;
  color: #666666;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 12px;
  font-size: 9px;
  cursor: pointer;
  color: #000000;
  font-family: 'Press Start 2P', monospace;
  white-space: nowrap;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.amiga-button.small {
  padding: 3px 8px;
  font-size: 8px;
}

.amiga-button.tiny {
  padding: 2px 6px;
  font-size: 7px;
}

.amiga-button.active {
  background: #0055aa;
  color: #ffffff;
  border-color: #0077cc #003388 #003388 #0077cc;
}

.status-indicator {
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  margin-left: 8px;
}

.status-indicator.connected {
  color: #00ff00;
  animation: pulse 2s infinite;
}

.status-indicator.connecting {
  color: #ffaa00;
  animation: blink 1s infinite;
}

.status-indicator.disconnected {
  color: #666666;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.terminal-output {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  background: #000000;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  line-height: 1.4;
}

.terminal-line {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin-bottom: 1px;
}

.terminal-line.error {
  color: #ff5555;
}

.terminal-line.success {
  color: #50fa7b;
}

.terminal-line.info {
  color: #8be9fd;
}

.terminal-line.system {
  color: #f1fa8c;
  font-weight: bold;
}

.terminal-input-line {
  display: flex;
  margin-top: 4px;
  align-items: center;
}

.prompt {
  color: #00ff00;
  margin-right: 4px;
  font-family: 'Courier New', monospace;
}

.terminal-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  outline: none;
  padding: 0;
}

.terminal-input::placeholder {
  color: #006600;
}

.terminal-link {
  color: #8be9fd;
  text-decoration: underline;
}

.terminal-link:hover {
  color: #ff79c6;
}

.control-bar {
  display: flex;
  gap: 12px;
  padding: 6px 10px;
  background: #222222;
  border-top: 1px solid #444444;
  border-bottom: 2px solid #000000;
  align-items: center;
  font-size: 8px;
}

.control-group {
  display: flex;
  gap: 4px;
  align-items: center;
}

.control-label {
  color: #888888;
  font-size: 8px;
}

.stat-value {
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 8px;
  font-weight: bold;
}

.presets-bar {
  display: flex;
  gap: 6px;
  padding: 6px 8px;
  background: #a0a0a0;
  border-top: 2px solid #ffffff;
  align-items: center;
  flex-wrap: wrap;
}

.preset-label {
  font-size: 9px;
  color: #000000;
  margin-right: 4px;
  font-weight: bold;
}

/* Scrollbar styling */
.terminal-output::-webkit-scrollbar {
  width: 12px;
}

.terminal-output::-webkit-scrollbar-track {
  background: #111111;
}

.terminal-output::-webkit-scrollbar-thumb {
  background: #00aa00;
  border: 1px solid #000000;
}

.terminal-output::-webkit-scrollbar-thumb:hover {
  background: #00ff00;
}
</style>
