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
    </div>

    <!-- Terminal Output -->
    <div class="terminal-output" ref="outputRef">
      <div
        v-for="(line, index) in outputLines"
        :key="index"
        class="terminal-line"
        :class="line.type"
        v-html="formatLine(line.text)"
      ></div>
      <div v-if="isConnected" class="terminal-input-line">
        <input
          ref="inputRef"
          v-model="currentInput"
          type="text"
          class="terminal-input"
          @keyup.enter="sendCommand"
          @keyup.up="navigateHistory(-1)"
          @keyup.down="navigateHistory(1)"
          spellcheck="false"
          placeholder="Type command..."
        />
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
        Star Wars
      </button>
      <button
        class="amiga-button small"
        @click="quickConnect('telehack.com', 23)"
        :disabled="isConnected"
      >
        Telehack
      </button>
      <button
        class="amiga-button small"
        @click="quickConnect('localhost', 23)"
        :disabled="isConnected"
      >
        Localhost
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

interface OutputLine {
  text: string;
  type: 'output' | 'error' | 'success' | 'info' | 'system';
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

onMounted(() => {
  addOutput('Telnet Client v1.0', 'system');
  addOutput('Enter hostname and port, then click Connect', 'info');
  addOutput('', 'output');
});

onUnmounted(() => {
  if (isConnected.value) {
    disconnect();
  }
});

const addOutput = (text: string, type: OutputLine['type'] = 'output') => {
  outputLines.value.push({ text, type });
  nextTick(() => {
    if (outputRef.value) {
      outputRef.value.scrollTop = outputRef.value.scrollHeight;
    }
  });
};

const formatLine = (text: string): string => {
  // Basic HTML escaping
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
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
  addOutput('', 'output');
  addOutput('Connection closed', 'system');
  addOutput('', 'output');
};

const sendCommand = async () => {
  const command = currentInput.value;
  if (!command || !isConnected.value || !sessionId.value) return;

  // Add to history
  commandHistory.value.push(command);
  historyIndex.value = commandHistory.value.length;

  // Show the command
  addOutput(command, 'output');

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
          // Split by lines and add each
          const lines = data.data.split('\n');
          lines.forEach((line: string) => {
            if (line) addOutput(line, 'output');
          });
        }
      }
    } catch (error) {
      console.error('Receive error:', error);
    }
  }, 500); // Poll every 500ms
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

const quickConnect = (host: string, portNum: number) => {
  hostname.value = host;
  port.value = portNum;
  connect();
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
  gap: 8px;
  padding: 10px;
  background: #a0a0a0;
  border-bottom: 2px solid #000000;
  align-items: center;
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
  min-width: 200px;
}

.port-input {
  width: 80px;
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

.status-indicator {
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  margin-left: auto;
}

.status-indicator.connected {
  color: #00ff00;
}

.status-indicator.connecting {
  color: #ffaa00;
}

.status-indicator.disconnected {
  color: #666666;
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
  margin-bottom: 2px;
}

.terminal-line.error {
  color: #ff0000;
}

.terminal-line.success {
  color: #00ff00;
}

.terminal-line.info {
  color: #00aaff;
}

.terminal-line.system {
  color: #ffaa00;
}

.terminal-input-line {
  display: flex;
  margin-top: 4px;
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

.presets-bar {
  display: flex;
  gap: 8px;
  padding: 8px 10px;
  background: #a0a0a0;
  border-top: 2px solid #ffffff;
  align-items: center;
}

.preset-label {
  font-size: 9px;
  color: #000000;
  margin-right: 4px;
}

/* Scrollbar styling */
.terminal-output::-webkit-scrollbar {
  width: 12px;
}

.terminal-output::-webkit-scrollbar-track {
  background: #333333;
}

.terminal-output::-webkit-scrollbar-thumb {
  background: #666666;
  border: 1px solid #000000;
}

.terminal-output::-webkit-scrollbar-thumb:hover {
  background: #888888;
}
</style>
