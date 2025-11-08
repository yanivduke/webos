<template>
  <div class="network-diagnostic">
    <!-- Tool Selection -->
    <div class="tool-bar">
      <button
        v-for="tool in tools"
        :key="tool.id"
        class="amiga-button"
        :class="{ active: selectedTool === tool.id }"
        @click="selectedTool = tool.id"
      >
        {{ tool.name }}
      </button>
    </div>

    <!-- Tool Input -->
    <div class="input-bar">
      <input
        v-model="targetHost"
        type="text"
        class="amiga-input"
        :placeholder="getPlaceholder()"
        @keyup.enter="runDiagnostic"
      />
      <input
        v-if="selectedTool === 'ping'"
        v-model.number="pingCount"
        type="number"
        class="amiga-input count-input"
        placeholder="Count"
        min="1"
        max="100"
      />
      <button
        class="amiga-button"
        @click="runDiagnostic"
        :disabled="isRunning || !targetHost"
      >
        {{ isRunning ? 'Running...' : 'Run' }}
      </button>
      <button
        class="amiga-button"
        @click="stopDiagnostic"
        :disabled="!isRunning"
      >
        Stop
      </button>
      <button
        class="amiga-button small"
        @click="clearOutput"
      >
        Clear
      </button>
    </div>

    <!-- Output Area -->
    <div class="output-area" ref="outputRef">
      <div
        v-for="(line, index) in outputLines"
        :key="index"
        class="output-line"
        :class="line.type"
      >
        {{ line.text }}
      </div>
      <div v-if="isRunning" class="running-indicator">
        <span class="spinner">⟳</span> Running diagnostic...
      </div>
    </div>

    <!-- Status Bar -->
    <div class="status-bar">
      <span class="status-info">Tool: {{ getCurrentToolName() }}</span>
      <span class="status-separator">|</span>
      <span class="status-info">Target: {{ targetHost || 'None' }}</span>
      <span v-if="lastResult" class="status-separator">|</span>
      <span v-if="lastResult" class="status-result" :class="lastResult.success ? 'success' : 'error'">
        {{ lastResult.message }}
      </span>
    </div>

    <!-- Quick Targets -->
    <div class="quick-targets-bar">
      <div class="quick-label">Quick Targets:</div>
      <button
        class="amiga-button small"
        @click="setTarget('google.com')"
      >
        Google
      </button>
      <button
        class="amiga-button small"
        @click="setTarget('cloudflare.com')"
      >
        Cloudflare
      </button>
      <button
        class="amiga-button small"
        @click="setTarget('8.8.8.8')"
      >
        8.8.8.8
      </button>
      <button
        class="amiga-button small"
        @click="setTarget('localhost')"
      >
        Localhost
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, nextTick } from 'vue';

interface OutputLine {
  text: string;
  type: 'normal' | 'success' | 'error' | 'warning' | 'info' | 'header';
}

interface Tool {
  id: string;
  name: string;
  placeholder: string;
}

interface DiagnosticResult {
  success: boolean;
  message: string;
}

const tools: Tool[] = [
  { id: 'ping', name: 'Ping', placeholder: 'hostname or IP' },
  { id: 'traceroute', name: 'Traceroute', placeholder: 'hostname or IP' },
  { id: 'dns', name: 'DNS Lookup', placeholder: 'domain name' },
  { id: 'whois', name: 'WHOIS', placeholder: 'domain name' },
  { id: 'port', name: 'Port Scan', placeholder: 'hostname:port or hostname:start-end' },
  { id: 'http', name: 'HTTP Test', placeholder: 'URL' }
];

const selectedTool = ref('ping');
const targetHost = ref('');
const pingCount = ref(4);
const isRunning = ref(false);
const outputLines = ref<OutputLine[]>([]);
const outputRef = ref<HTMLDivElement | null>(null);
const lastResult = ref<DiagnosticResult | null>(null);

const getCurrentToolName = () => {
  return tools.find(t => t.id === selectedTool.value)?.name || 'Unknown';
};

const getPlaceholder = () => {
  return tools.find(t => t.id === selectedTool.value)?.placeholder || 'Enter target';
};

const setTarget = (target: string) => {
  targetHost.value = target;
};

const addOutput = (text: string, type: OutputLine['type'] = 'normal') => {
  outputLines.value.push({ text, type });
  nextTick(() => {
    if (outputRef.value) {
      outputRef.value.scrollTop = outputRef.value.scrollHeight;
    }
  });
};

const clearOutput = () => {
  outputLines.value = [];
  lastResult.value = null;
};

const runDiagnostic = async () => {
  if (!targetHost.value || isRunning.value) return;

  isRunning.value = true;
  lastResult.value = null;

  addOutput('', 'normal');
  addOutput(`=== ${getCurrentToolName()} Diagnostic ===`, 'header');
  addOutput(`Target: ${targetHost.value}`, 'info');
  addOutput(`Started: ${new Date().toLocaleString()}`, 'info');
  addOutput('', 'normal');

  try {
    switch (selectedTool.value) {
      case 'ping':
        await runPing();
        break;
      case 'traceroute':
        await runTraceroute();
        break;
      case 'dns':
        await runDNSLookup();
        break;
      case 'whois':
        await runWhois();
        break;
      case 'port':
        await runPortScan();
        break;
      case 'http':
        await runHTTPTest();
        break;
    }
  } catch (error: any) {
    addOutput(`Error: ${error.message}`, 'error');
    lastResult.value = { success: false, message: error.message };
  } finally {
    isRunning.value = false;
    addOutput('', 'normal');
    addOutput(`Completed: ${new Date().toLocaleString()}`, 'info');
  }
};

const stopDiagnostic = () => {
  isRunning.value = false;
  addOutput('', 'normal');
  addOutput('Diagnostic stopped by user', 'warning');
};

const runPing = async () => {
  try {
    const response = await fetch('/api/network/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: targetHost.value,
        count: pingCount.value
      })
    });

    if (!response.ok) {
      throw new Error('Ping failed');
    }

    const data = await response.json();

    if (data.results && Array.isArray(data.results)) {
      data.results.forEach((result: any) => {
        if (result.alive) {
          addOutput(`Reply from ${result.host}: time=${result.time}ms`, 'success');
        } else {
          addOutput(`Request timed out for ${result.host}`, 'error');
        }
      });
    }

    if (data.summary) {
      addOutput('', 'normal');
      addOutput('Ping statistics:', 'header');
      addOutput(`  Packets: Sent = ${data.summary.sent}, Received = ${data.summary.received}, Lost = ${data.summary.lost}`, 'info');
      if (data.summary.avgTime) {
        addOutput(`  Average time = ${data.summary.avgTime}ms`, 'info');
      }
    }

    lastResult.value = { success: true, message: 'Ping completed successfully' };

  } catch (error: any) {
    addOutput(`Ping error: ${error.message}`, 'error');
    lastResult.value = { success: false, message: error.message };
  }
};

const runTraceroute = async () => {
  try {
    const response = await fetch('/api/network/traceroute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: targetHost.value
      })
    });

    if (!response.ok) {
      throw new Error('Traceroute failed');
    }

    const data = await response.json();

    if (data.hops && Array.isArray(data.hops)) {
      addOutput('Tracing route to ' + targetHost.value + ':', 'info');
      addOutput('', 'normal');

      data.hops.forEach((hop: any, index: number) => {
        const hopNum = String(index + 1).padStart(3, ' ');
        const time = hop.time ? `${hop.time}ms` : '*';
        const host = hop.host || hop.ip || '*';
        addOutput(`${hopNum}  ${time.padEnd(10)}  ${host}`, 'normal');
      });
    }

    addOutput('', 'normal');
    addOutput('Trace complete.', 'success');
    lastResult.value = { success: true, message: 'Traceroute completed' };

  } catch (error: any) {
    addOutput(`Traceroute error: ${error.message}`, 'error');
    lastResult.value = { success: false, message: error.message };
  }
};

const runDNSLookup = async () => {
  try {
    const response = await fetch('/api/network/dns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostname: targetHost.value
      })
    });

    if (!response.ok) {
      throw new Error('DNS lookup failed');
    }

    const data = await response.json();

    addOutput(`DNS lookup for: ${targetHost.value}`, 'info');
    addOutput('', 'normal');

    if (data.addresses && data.addresses.length > 0) {
      addOutput('A Records (IPv4):', 'header');
      data.addresses.forEach((addr: string) => {
        addOutput(`  ${addr}`, 'success');
      });
    }

    if (data.addresses6 && data.addresses6.length > 0) {
      addOutput('', 'normal');
      addOutput('AAAA Records (IPv6):', 'header');
      data.addresses6.forEach((addr: string) => {
        addOutput(`  ${addr}`, 'success');
      });
    }

    if (data.mx && data.mx.length > 0) {
      addOutput('', 'normal');
      addOutput('MX Records:', 'header');
      data.mx.forEach((mx: any) => {
        addOutput(`  ${mx.priority} ${mx.exchange}`, 'normal');
      });
    }

    if (data.txt && data.txt.length > 0) {
      addOutput('', 'normal');
      addOutput('TXT Records:', 'header');
      data.txt.forEach((txt: string) => {
        addOutput(`  ${txt}`, 'normal');
      });
    }

    lastResult.value = { success: true, message: 'DNS lookup completed' };

  } catch (error: any) {
    addOutput(`DNS lookup error: ${error.message}`, 'error');
    lastResult.value = { success: false, message: error.message };
  }
};

const runWhois = async () => {
  try {
    const response = await fetch('/api/network/whois', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain: targetHost.value
      })
    });

    if (!response.ok) {
      throw new Error('WHOIS lookup failed');
    }

    const data = await response.json();

    if (data.whois) {
      const lines = data.whois.split('\n');
      lines.forEach((line: string) => {
        if (line.trim()) {
          addOutput(line, 'normal');
        }
      });
    }

    lastResult.value = { success: true, message: 'WHOIS lookup completed' };

  } catch (error: any) {
    addOutput(`WHOIS error: ${error.message}`, 'error');
    lastResult.value = { success: false, message: error.message };
  }
};

const runPortScan = async () => {
  try {
    // Parse host:port or host:start-end
    const parts = targetHost.value.split(':');
    const host = parts[0];
    let ports: number[] = [];

    if (parts.length < 2) {
      throw new Error('Please specify port(s) in format hostname:port or hostname:start-end');
    }

    const portSpec = parts[1];
    if (portSpec.includes('-')) {
      const [start, end] = portSpec.split('-').map(Number);
      for (let i = start; i <= end && i <= start + 100; i++) {
        ports.push(i);
      }
    } else {
      ports.push(Number(portSpec));
    }

    addOutput(`Scanning ${host} on ${ports.length} port(s)...`, 'info');
    addOutput('', 'normal');

    const response = await fetch('/api/network/portscan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: host,
        ports: ports
      })
    });

    if (!response.ok) {
      throw new Error('Port scan failed');
    }

    const data = await response.json();

    if (data.results && Array.isArray(data.results)) {
      let openCount = 0;
      data.results.forEach((result: any) => {
        if (result.open) {
          addOutput(`Port ${result.port}: OPEN ${result.service ? `(${result.service})` : ''}`, 'success');
          openCount++;
        } else {
          addOutput(`Port ${result.port}: CLOSED`, 'error');
        }
      });

      addOutput('', 'normal');
      addOutput(`Scan complete: ${openCount} open port(s) found`, 'info');
    }

    lastResult.value = { success: true, message: 'Port scan completed' };

  } catch (error: any) {
    addOutput(`Port scan error: ${error.message}`, 'error');
    lastResult.value = { success: false, message: error.message };
  }
};

const runHTTPTest = async () => {
  try {
    const response = await fetch('/api/network/http-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: targetHost.value
      })
    });

    if (!response.ok) {
      throw new Error('HTTP test failed');
    }

    const data = await response.json();

    addOutput(`HTTP Test for: ${targetHost.value}`, 'info');
    addOutput('', 'normal');
    addOutput(`Status: ${data.statusCode} ${data.statusMessage}`, data.statusCode < 400 ? 'success' : 'error');
    addOutput(`Response Time: ${data.responseTime}ms`, 'info');

    if (data.headers) {
      addOutput('', 'normal');
      addOutput('Response Headers:', 'header');
      Object.entries(data.headers).forEach(([key, value]) => {
        addOutput(`  ${key}: ${value}`, 'normal');
      });
    }

    if (data.redirects && data.redirects.length > 0) {
      addOutput('', 'normal');
      addOutput('Redirects:', 'header');
      data.redirects.forEach((redirect: string) => {
        addOutput(`  → ${redirect}`, 'warning');
      });
    }

    lastResult.value = { success: data.statusCode < 400, message: `HTTP ${data.statusCode}` };

  } catch (error: any) {
    addOutput(`HTTP test error: ${error.message}`, 'error');
    lastResult.value = { success: false, message: error.message };
  }
};
</script>

<style scoped>
.network-diagnostic {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  font-family: 'Press Start 2P', 'Courier New', monospace;
}

.tool-bar {
  display: flex;
  gap: 4px;
  padding: 8px;
  background: #a0a0a0;
  border-bottom: 2px solid #000000;
  flex-wrap: wrap;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 10px;
  font-size: 8px;
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

.amiga-button.active {
  background: #0055aa;
  color: #ffffff;
  border-color: #0077cc #003388 #003388 #0077cc;
}

.amiga-button.small {
  padding: 3px 8px;
  font-size: 8px;
}

.input-bar {
  display: flex;
  gap: 6px;
  padding: 8px;
  background: #e0e0e0;
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
  flex: 1;
}

.count-input {
  flex: 0;
  width: 80px;
}

.output-area {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  background: #000000;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  line-height: 1.5;
}

.output-line {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin-bottom: 2px;
}

.output-line.success {
  color: #00ff00;
}

.output-line.error {
  color: #ff0000;
}

.output-line.warning {
  color: #ffaa00;
}

.output-line.info {
  color: #00aaff;
}

.output-line.header {
  color: #ffff00;
  font-weight: bold;
  margin-top: 8px;
}

.running-indicator {
  color: #ffaa00;
  margin-top: 8px;
  animation: blink 1s infinite;
}

.spinner {
  display: inline-block;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.5; }
}

.status-bar {
  display: flex;
  gap: 10px;
  padding: 6px 10px;
  background: #ffffff;
  border-top: 2px solid #000000;
  font-size: 8px;
  color: #000000;
  align-items: center;
}

.status-info {
  color: #666666;
}

.status-separator {
  color: #cccccc;
}

.status-result {
  font-weight: bold;
}

.status-result.success {
  color: #00aa00;
}

.status-result.error {
  color: #ff0000;
}

.quick-targets-bar {
  display: flex;
  gap: 6px;
  padding: 6px 8px;
  background: #a0a0a0;
  border-top: 2px solid #ffffff;
  align-items: center;
}

.quick-label {
  font-size: 9px;
  color: #000000;
  margin-right: 4px;
}

/* Scrollbar styling */
.output-area::-webkit-scrollbar {
  width: 12px;
}

.output-area::-webkit-scrollbar-track {
  background: #111111;
}

.output-area::-webkit-scrollbar-thumb {
  background: #004400;
  border: 1px solid #000000;
}

.output-area::-webkit-scrollbar-thumb:hover {
  background: #006600;
}
</style>
