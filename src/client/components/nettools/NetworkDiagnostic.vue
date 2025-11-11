<template>
  <div class="network-diagnostic">
    <!-- Tool Selection -->
    <div class="tool-bar">
      <button
        v-for="tool in tools"
        :key="tool.id"
        class="amiga-button"
        :class="{ active: selectedTool === tool.id }"
        @click="selectTool(tool.id)"
      >
        {{ tool.icon }} {{ tool.name }}
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
        ▶ {{ isRunning ? 'Running...' : 'Run' }}
      </button>
      <button
        class="amiga-button"
        @click="stopDiagnostic"
        :disabled="!isRunning"
      >
        ■ Stop
      </button>
      <button
        class="amiga-button small"
        @click="clearOutput"
      >
        🗑 Clear
      </button>
      <button
        class="amiga-button small"
        @click="exportResults"
        :disabled="outputLines.length === 0"
      >
        💾 Export
      </button>
      <button
        v-if="selectedTool === 'ping'"
        class="amiga-button small"
        @click="continuousMode = !continuousMode"
        :class="{ active: continuousMode }"
        :disabled="isRunning"
      >
        {{ continuousMode ? '∞ Continuous' : '🔄 Single' }}
      </button>
    </div>

    <!-- Results Visualization (for ping) -->
    <div v-if="selectedTool === 'ping' && pingResults.length > 0" class="visualization-area">
      <div class="chart-container">
        <div class="chart-title">Ping Response Time Graph</div>
        <div class="chart" ref="chartRef">
          <div
            v-for="(result, index) in visiblePingResults"
            :key="index"
            class="chart-bar"
            :style="{ height: getBarHeight(result.time), left: getBarPosition(index) }"
            :class="{ timeout: !result.alive }"
            :title="`#${index + 1}: ${result.alive ? result.time + 'ms' : 'timeout'}`"
          >
            <div class="bar-label">{{ result.alive ? result.time : 'X' }}</div>
          </div>
        </div>
        <div class="chart-axis">
          <span v-for="n in 11" :key="n" class="axis-label">
            {{ Math.round((maxPingTime / 10) * (n - 1)) }}
          </span>
        </div>
        <div class="chart-stats">
          <div class="stat-item">
            <span class="stat-label">Min:</span>
            <span class="stat-value">{{ pingStats.min }}ms</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Max:</span>
            <span class="stat-value">{{ pingStats.max }}ms</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Avg:</span>
            <span class="stat-value">{{ pingStats.avg }}ms</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Loss:</span>
            <span class="stat-value loss">{{ pingStats.loss }}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Jitter:</span>
            <span class="stat-value">{{ pingStats.jitter }}ms</span>
          </div>
        </div>
      </div>
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
        <span class="spinner">⟳</span> {{ runningStatus }}
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
      <span class="status-separator">|</span>
      <span class="status-info">Lines: {{ outputLines.length }}</span>
    </div>

    <!-- Quick Targets -->
    <div class="quick-targets-bar">
      <div class="quick-label">Quick Targets:</div>
      <button
        class="amiga-button small"
        @click="setTarget('google.com')"
      >
        🌐 Google
      </button>
      <button
        class="amiga-button small"
        @click="setTarget('cloudflare.com')"
      >
        ☁ Cloudflare
      </button>
      <button
        class="amiga-button small"
        @click="setTarget('8.8.8.8')"
      >
        📡 8.8.8.8
      </button>
      <button
        class="amiga-button small"
        @click="setTarget('1.1.1.1')"
      >
        🚀 1.1.1.1
      </button>
      <button
        class="amiga-button small"
        @click="setTarget('localhost')"
      >
        🏠 Localhost
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, nextTick } from 'vue';

interface OutputLine {
  text: string;
  type: 'normal' | 'success' | 'error' | 'warning' | 'info' | 'header';
  timestamp?: number;
}

interface Tool {
  id: string;
  name: string;
  icon: string;
  placeholder: string;
}

interface DiagnosticResult {
  success: boolean;
  message: string;
}

interface PingResult {
  alive: boolean;
  time: number;
  host: string;
}

const tools: Tool[] = [
  { id: 'ping', name: 'Ping', icon: '📶', placeholder: 'hostname or IP' },
  { id: 'traceroute', name: 'Trace', icon: '🗺️', placeholder: 'hostname or IP' },
  { id: 'dns', name: 'DNS', icon: '🔍', placeholder: 'domain name' },
  { id: 'whois', name: 'WHOIS', icon: '📋', placeholder: 'domain name' },
  { id: 'port', name: 'Port Scan', icon: '🔌', placeholder: 'hostname:port or hostname:start-end' },
  { id: 'http', name: 'HTTP Test', icon: '🌐', placeholder: 'URL' }
];

const selectedTool = ref('ping');
const targetHost = ref('');
const pingCount = ref(10);
const isRunning = ref(false);
const continuousMode = ref(false);
const runningStatus = ref('Running diagnostic...');
const outputLines = ref<OutputLine[]>([]);
const outputRef = ref<HTMLDivElement | null>(null);
const chartRef = ref<HTMLDivElement | null>(null);
const lastResult = ref<DiagnosticResult | null>(null);
const pingResults = ref<PingResult[]>([]);
const continuousInterval = ref<number | null>(null);

const maxPingTime = computed(() => {
  const times = pingResults.value.filter(r => r.alive).map(r => r.time);
  return times.length > 0 ? Math.max(...times, 100) : 100;
});

const visiblePingResults = computed(() => {
  // Show last 50 results for visualization
  return pingResults.value.slice(-50);
});

const pingStats = computed(() => {
  const alivePings = pingResults.value.filter(r => r.alive);
  if (alivePings.length === 0) {
    return { min: 0, max: 0, avg: 0, loss: 100, jitter: 0 };
  }

  const times = alivePings.map(r => r.time);
  const min = Math.min(...times);
  const max = Math.max(...times);
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const loss = Math.round(((pingResults.value.length - alivePings.length) / pingResults.value.length) * 100);

  // Calculate jitter (average deviation from mean)
  const jitter = alivePings.length > 1
    ? Math.round(times.reduce((sum, time, i, arr) => {
        if (i === 0) return 0;
        return sum + Math.abs(time - arr[i - 1]);
      }, 0) / (alivePings.length - 1))
    : 0;

  return { min, max, avg, loss, jitter };
});

const getCurrentToolName = () => {
  return tools.find(t => t.id === selectedTool.value)?.name || 'Unknown';
};

const getPlaceholder = () => {
  return tools.find(t => t.id === selectedTool.value)?.placeholder || 'Enter target';
};

const selectTool = (toolId: string) => {
  selectedTool.value = toolId;
  if (toolId !== 'ping') {
    pingResults.value = [];
  }
};

const setTarget = (target: string) => {
  targetHost.value = target;
};

const addOutput = (text: string, type: OutputLine['type'] = 'normal') => {
  outputLines.value.push({ text, type, timestamp: Date.now() });
  nextTick(() => {
    if (outputRef.value) {
      outputRef.value.scrollTop = outputRef.value.scrollHeight;
    }
  });
};

const clearOutput = () => {
  outputLines.value = [];
  lastResult.value = null;
  pingResults.value = [];
};

const getBarHeight = (time: number): string => {
  if (!time) return '0%';
  const percent = (time / maxPingTime.value) * 100;
  return Math.min(percent, 100) + '%';
};

const getBarPosition = (index: number): string => {
  const count = visiblePingResults.value.length;
  const percent = (index / count) * 100;
  return percent + '%';
};

const runDiagnostic = async () => {
  if (!targetHost.value || isRunning.value) return;

  if (continuousMode.value && selectedTool.value === 'ping') {
    startContinuousPing();
  } else {
    await runSingleDiagnostic();
  }
};

const startContinuousPing = async () => {
  isRunning.value = true;
  pingResults.value = [];
  clearOutput();

  addOutput('', 'normal');
  addOutput('=== Continuous Ping Mode ===', 'header');
  addOutput(`Target: ${targetHost.value}`, 'info');
  addOutput('Press Stop to end continuous monitoring', 'warning');
  addOutput('', 'normal');

  let count = 0;

  continuousInterval.value = window.setInterval(async () => {
    if (!isRunning.value) {
      if (continuousInterval.value) {
        clearInterval(continuousInterval.value);
        continuousInterval.value = null;
      }
      return;
    }

    count++;
    runningStatus.value = `Continuous ping #${count}...`;

    try {
      const response = await fetch('/api/network/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: targetHost.value,
          count: 1
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          pingResults.value.push(result);

          if (result.alive) {
            addOutput(`#${count}: Reply from ${result.host}: time=${result.time}ms`, 'success');
          } else {
            addOutput(`#${count}: Request timed out for ${result.host}`, 'error');
          }
        }
      }
    } catch (error: any) {
      addOutput(`#${count}: Error: ${error.message}`, 'error');
    }
  }, 2000); // Ping every 2 seconds
};

const runSingleDiagnostic = async () => {
  isRunning.value = true;
  lastResult.value = null;
  if (selectedTool.value === 'ping') {
    pingResults.value = [];
  }

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
  if (continuousInterval.value) {
    clearInterval(continuousInterval.value);
    continuousInterval.value = null;
  }
  addOutput('', 'normal');
  addOutput('Diagnostic stopped by user', 'warning');
};

const runPing = async () => {
  runningStatus.value = `Pinging ${targetHost.value}...`;

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
      pingResults.value = data.results;

      data.results.forEach((result: PingResult, index: number) => {
        if (result.alive) {
          addOutput(`Reply #${index + 1} from ${result.host}: time=${result.time}ms`, 'success');
        } else {
          addOutput(`Request #${index + 1} timed out for ${result.host}`, 'error');
        }
      });
    }

    if (data.summary) {
      addOutput('', 'normal');
      addOutput('Ping statistics:', 'header');
      addOutput(`  Packets: Sent = ${data.summary.sent}, Received = ${data.summary.received}, Lost = ${data.summary.lost} (${Math.round((data.summary.lost / data.summary.sent) * 100)}% loss)`, 'info');
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
  runningStatus.value = `Tracing route to ${targetHost.value}...`;

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
  runningStatus.value = `Looking up ${targetHost.value}...`;

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
  runningStatus.value = `WHOIS lookup for ${targetHost.value}...`;

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
  runningStatus.value = `Scanning ports on ${targetHost.value}...`;

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
  runningStatus.value = `Testing HTTP connection to ${targetHost.value}...`;

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

const exportResults = () => {
  if (outputLines.value.length === 0 && pingResults.value.length === 0) return;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const tool = selectedTool.value;

  // Export as JSON
  const exportData = {
    tool: tool,
    target: targetHost.value,
    timestamp: new Date().toISOString(),
    outputLines: outputLines.value,
    lastResult: lastResult.value,
    ...(tool === 'ping' && {
      pingResults: pingResults.value,
      pingStats: pingStats.value
    })
  };

  const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const jsonUrl = window.URL.createObjectURL(jsonBlob);
  const jsonLink = document.createElement('a');
  jsonLink.href = jsonUrl;
  jsonLink.download = `network-diagnostic-${tool}-${timestamp}.json`;
  document.body.appendChild(jsonLink);
  jsonLink.click();
  document.body.removeChild(jsonLink);
  window.URL.revokeObjectURL(jsonUrl);

  // Also export as CSV if ping data
  if (tool === 'ping' && pingResults.value.length > 0) {
    const csvLines = ['Index,Timestamp,Host,Alive,Time(ms)'];
    pingResults.value.forEach((result, index) => {
      const ts = outputLines.value[index]?.timestamp || Date.now();
      csvLines.push(`${index + 1},${new Date(ts).toISOString()},${result.host},${result.alive},${result.time || 'N/A'}`);
    });
    const csvBlob = new Blob([csvLines.join('\n')], { type: 'text/csv' });
    const csvUrl = window.URL.createObjectURL(csvBlob);
    const csvLink = document.createElement('a');
    csvLink.href = csvUrl;
    csvLink.download = `ping-results-${timestamp}.csv`;
    document.body.appendChild(csvLink);
    csvLink.click();
    document.body.removeChild(csvLink);
    window.URL.revokeObjectURL(csvUrl);

    addOutput(`Results exported: JSON + CSV`, 'success');
  } else {
    addOutput(`Results exported: JSON`, 'success');
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
  padding: 6px;
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
  flex: 1;
  min-width: 120px;
}

.count-input {
  flex: 0;
  width: 80px;
}

.visualization-area {
  background: #222222;
  border-bottom: 2px solid #000000;
  padding: 12px;
}

.chart-container {
  background: #000000;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 12px;
}

.chart-title {
  color: #00ff00;
  font-size: 10px;
  margin-bottom: 12px;
  text-align: center;
}

.chart {
  position: relative;
  height: 120px;
  background: #111111;
  border: 1px solid #333333;
  margin-bottom: 8px;
}

.chart-bar {
  position: absolute;
  bottom: 0;
  width: 8px;
  background: linear-gradient(to top, #00ff00, #00aa00);
  border-top: 2px solid #00ff00;
  transition: height 0.3s ease;
}

.chart-bar.timeout {
  background: linear-gradient(to top, #ff0000, #aa0000);
  border-top: 2px solid #ff0000;
  height: 10px !important;
}

.bar-label {
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 7px;
  color: #00ff00;
  white-space: nowrap;
}

.chart-bar.timeout .bar-label {
  color: #ff0000;
}

.chart-axis {
  display: flex;
  justify-content: space-between;
  font-size: 7px;
  color: #666666;
  padding: 0 4px;
  margin-bottom: 8px;
}

.axis-label {
  flex: 1;
  text-align: center;
}

.chart-stats {
  display: flex;
  gap: 16px;
  justify-content: center;
  padding-top: 8px;
  border-top: 1px solid #333333;
}

.stat-item {
  display: flex;
  gap: 6px;
  align-items: center;
}

.stat-label {
  color: #888888;
  font-size: 8px;
}

.stat-value {
  color: #00ff00;
  font-size: 8px;
  font-weight: bold;
}

.stat-value.loss {
  color: #ff5555;
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
  color: #50fa7b;
}

.output-line.error {
  color: #ff5555;
}

.output-line.warning {
  color: #f1fa8c;
}

.output-line.info {
  color: #8be9fd;
}

.output-line.header {
  color: #bd93f9;
  font-weight: bold;
  margin-top: 8px;
}

.running-indicator {
  color: #f1fa8c;
  margin-top: 8px;
  animation: blink 1.5s infinite;
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
  flex-wrap: wrap;
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
  flex-wrap: wrap;
}

.quick-label {
  font-size: 9px;
  color: #000000;
  margin-right: 4px;
  font-weight: bold;
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
