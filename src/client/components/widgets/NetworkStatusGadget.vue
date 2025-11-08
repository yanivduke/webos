<template>
  <div class="network-status-content">
    <div class="connection-status">
      <div class="status-icon-container">
        <svg viewBox="0 0 64 64" class="status-icon" :class="{ connected: isOnline, disconnected: !isOnline }">
          <!-- Signal waves -->
          <g v-if="isOnline">
            <path d="M 32 40 Q 20 32, 16 20" fill="none" :stroke="signalColor" stroke-width="3" :opacity="signalStrength > 0 ? 1 : 0.2"/>
            <path d="M 32 40 Q 24 36, 22 28" fill="none" :stroke="signalColor" stroke-width="3" :opacity="signalStrength > 1 ? 1 : 0.2"/>
            <path d="M 32 40 Q 28 38, 26 34" fill="none" :stroke="signalColor" stroke-width="3" :opacity="signalStrength > 2 ? 1 : 0.2"/>
            <path d="M 32 40 Q 44 32, 48 20" fill="none" :stroke="signalColor" stroke-width="3" :opacity="signalStrength > 0 ? 1 : 0.2"/>
            <path d="M 32 40 Q 40 36, 42 28" fill="none" :stroke="signalColor" stroke-width="3" :opacity="signalStrength > 1 ? 1 : 0.2"/>
            <path d="M 32 40 Q 36 38, 38 34" fill="none" :stroke="signalColor" stroke-width="3" :opacity="signalStrength > 2 ? 1 : 0.2"/>
          </g>
          <!-- Disconnected X -->
          <g v-else>
            <line x1="20" y1="20" x2="44" y2="44" stroke="#ff0000" stroke-width="4"/>
            <line x1="44" y1="20" x2="20" y2="44" stroke="#ff0000" stroke-width="4"/>
          </g>
          <!-- Base -->
          <circle cx="32" cy="42" r="4" :fill="isOnline ? signalColor : '#ff0000'"/>
        </svg>
      </div>

      <div class="status-text">
        <span class="status-label">{{ isOnline ? 'ONLINE' : 'OFFLINE' }}</span>
        <span class="status-quality" v-if="isOnline">{{ getQualityText() }}</span>
      </div>
    </div>

    <div class="network-metrics">
      <div class="metric-row">
        <span class="metric-label">Latency</span>
        <span class="metric-value" :class="getLatencyClass()">{{ latency }}ms</span>
      </div>

      <div class="metric-row">
        <span class="metric-label">Ping</span>
        <span class="metric-value" :class="getPingClass()">{{ pingTime }}ms</span>
      </div>

      <div class="metric-row">
        <span class="metric-label">Server</span>
        <span class="metric-value server" :class="{ online: serverOnline }">
          {{ serverOnline ? 'Connected' : 'No Response' }}
        </span>
      </div>
    </div>

    <div class="traffic-indicators">
      <div class="traffic-item">
        <span class="traffic-icon upload" :class="{ active: uploadActive }">▲</span>
        <span class="traffic-label">Upload</span>
      </div>
      <div class="traffic-separator"></div>
      <div class="traffic-item">
        <span class="traffic-icon download" :class="{ active: downloadActive }">▼</span>
        <span class="traffic-label">Download</span>
      </div>
    </div>

    <div class="connection-info">
      <div class="info-chip">
        <span class="info-label">Type:</span>
        <span class="info-value">Local</span>
      </div>
      <div class="info-chip">
        <span class="info-label">Port:</span>
        <span class="info-value">3001</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

const isOnline = ref(navigator.onLine);
const latency = ref(0);
const pingTime = ref(0);
const serverOnline = ref(false);
const uploadActive = ref(false);
const downloadActive = ref(false);
const signalStrength = ref(3);

let interval: number | undefined;
let trafficInterval: number | undefined;

const signalColor = computed(() => {
  if (pingTime.value < 50) return '#00ff00';
  if (pingTime.value < 100) return '#ffaa00';
  return '#ff6600';
});

const getQualityText = () => {
  if (pingTime.value < 50) return 'Excellent';
  if (pingTime.value < 100) return 'Good';
  if (pingTime.value < 200) return 'Fair';
  return 'Poor';
};

const getLatencyClass = () => {
  if (latency.value < 50) return 'good';
  if (latency.value < 100) return 'medium';
  return 'poor';
};

const getPingClass = () => {
  if (pingTime.value < 50) return 'good';
  if (pingTime.value < 100) return 'medium';
  return 'poor';
};

const checkNetworkStatus = async () => {
  isOnline.value = navigator.onLine;

  if (!isOnline.value) {
    serverOnline.value = false;
    pingTime.value = 0;
    latency.value = 0;
    signalStrength.value = 0;
    return;
  }

  try {
    const startTime = performance.now();
    downloadActive.value = true;

    const response = await fetch('/api/health', {
      method: 'GET',
      cache: 'no-cache'
    });

    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);

    downloadActive.value = false;

    if (response.ok) {
      serverOnline.value = true;
      pingTime.value = responseTime;
      latency.value = responseTime + Math.floor(Math.random() * 10);

      // Calculate signal strength based on ping
      if (responseTime < 50) {
        signalStrength.value = 3;
      } else if (responseTime < 100) {
        signalStrength.value = 2;
      } else {
        signalStrength.value = 1;
      }

      // Simulate upload activity briefly
      uploadActive.value = true;
      setTimeout(() => {
        uploadActive.value = false;
      }, 200);
    } else {
      serverOnline.value = false;
      signalStrength.value = 0;
    }
  } catch (error) {
    console.error('Network check failed:', error);
    serverOnline.value = false;
    pingTime.value = 0;
    latency.value = 0;
    signalStrength.value = 0;
    downloadActive.value = false;
  }
};

const handleOnlineStatus = () => {
  isOnline.value = true;
  checkNetworkStatus();
};

const handleOfflineStatus = () => {
  isOnline.value = false;
  serverOnline.value = false;
  pingTime.value = 0;
  latency.value = 0;
  signalStrength.value = 0;
};

onMounted(() => {
  checkNetworkStatus();
  interval = window.setInterval(checkNetworkStatus, 3000);

  window.addEventListener('online', handleOnlineStatus);
  window.addEventListener('offline', handleOfflineStatus);
});

onUnmounted(() => {
  if (interval) {
    clearInterval(interval);
  }
  if (trafficInterval) {
    clearInterval(trafficInterval);
  }

  window.removeEventListener('online', handleOnlineStatus);
  window.removeEventListener('offline', handleOfflineStatus);
});
</script>

<style scoped>
.network-status-content {
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--theme-border);
}

.status-icon-container {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
  border: 2px solid var(--theme-borderDark);
  border-radius: 4px;
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.5);
}

.status-icon {
  width: 100%;
  height: 100%;
  padding: 8px;
}

.status-icon.connected {
  filter: drop-shadow(0 0 6px #00ff00);
}

.status-icon.disconnected {
  filter: drop-shadow(0 0 6px #ff0000);
}

.status-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-label {
  font-size: 12px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
}

.connection-status .status-label {
  color: #00ff00;
  text-shadow: 0 0 8px #00ff00;
}

.connection-status:has(.disconnected) .status-label {
  color: #ff0000;
  text-shadow: 0 0 8px #ff0000;
}

.status-quality {
  font-size: 8px;
  color: var(--theme-text);
  opacity: 0.7;
  text-transform: uppercase;
}

.network-metrics {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 6px;
  background: rgba(0, 0, 0, 0.1);
  border: 1px solid var(--theme-borderDark);
  border-radius: 2px;
}

.metric-label {
  font-size: 8px;
  color: var(--theme-text);
  opacity: 0.8;
  text-transform: uppercase;
}

.metric-value {
  font-size: 9px;
  font-family: 'Courier New', monospace;
  font-weight: bold;
}

.metric-value.good {
  color: #00ff00;
  text-shadow: 0 0 4px #00ff00;
}

.metric-value.medium {
  color: #ffaa00;
  text-shadow: 0 0 4px #ffaa00;
}

.metric-value.poor {
  color: #ff6600;
  text-shadow: 0 0 4px #ff6600;
}

.metric-value.server {
  font-size: 8px;
}

.metric-value.server.online {
  color: #00ff00;
  text-shadow: 0 0 4px #00ff00;
}

.metric-value.server:not(.online) {
  color: #ff0000;
  text-shadow: 0 0 4px #ff0000;
}

.traffic-indicators {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 8px 0;
  background: #1a1a1a;
  border: 1px solid var(--theme-borderDark);
  border-radius: 2px;
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5);
}

.traffic-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.traffic-icon {
  font-size: 16px;
  opacity: 0.3;
  transition: all 0.2s;
}

.traffic-icon.upload {
  color: #00ff00;
}

.traffic-icon.download {
  color: #0099ff;
}

.traffic-icon.active {
  opacity: 1;
  animation: trafficBlink 0.5s ease-in-out;
}

@keyframes trafficBlink {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.6;
  }
}

.traffic-label {
  font-size: 7px;
  color: var(--theme-text);
  opacity: 0.7;
  text-transform: uppercase;
}

.traffic-separator {
  width: 1px;
  height: 30px;
  background: var(--theme-border);
}

.connection-info {
  display: flex;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px solid var(--theme-border);
}

.info-chip {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px;
  background: rgba(0, 0, 0, 0.1);
  border: 1px solid var(--theme-borderDark);
  border-radius: 2px;
}

.info-label {
  font-size: 7px;
  color: var(--theme-text);
  opacity: 0.6;
  margin-bottom: 2px;
}

.info-value {
  font-size: 8px;
  color: var(--theme-highlight);
  font-family: 'Courier New', monospace;
  font-weight: bold;
}
</style>
