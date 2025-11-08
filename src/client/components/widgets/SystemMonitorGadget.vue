<template>
  <div class="system-monitor-content">
    <div class="monitor-section">
      <div class="section-label">CPU Usage</div>
      <div class="meter-container">
        <div class="meter-bar">
          <div class="meter-fill" :style="{ width: `${cpuUsage}%` }"></div>
        </div>
        <div class="meter-value">{{ cpuUsage.toFixed(1) }}%</div>
      </div>
    </div>

    <div class="monitor-section">
      <div class="section-label">Chip RAM</div>
      <div class="meter-container">
        <div class="meter-bar">
          <div class="meter-fill chip-ram" :style="{ width: `${chipRamUsage}%` }"></div>
        </div>
        <div class="meter-value">{{ chipRam }}</div>
      </div>
    </div>

    <div class="monitor-section">
      <div class="section-label">Fast RAM</div>
      <div class="meter-container">
        <div class="meter-bar">
          <div class="meter-fill fast-ram" :style="{ width: `${fastRamUsage}%` }"></div>
        </div>
        <div class="meter-value">{{ fastRam }}</div>
      </div>
    </div>

    <div class="monitor-section">
      <div class="section-label">Uptime</div>
      <div class="uptime-display">
        {{ uptimeString }}
      </div>
    </div>

    <div class="status-indicators">
      <div class="status-item">
        <span class="status-dot" :class="{ active: cpuUsage > 50 }"></span>
        <span class="status-label">CPU</span>
      </div>
      <div class="status-item">
        <span class="status-dot" :class="{ active: chipRamUsage > 50 }"></span>
        <span class="status-label">CHIP</span>
      </div>
      <div class="status-item">
        <span class="status-dot" :class="{ active: fastRamUsage > 50 }"></span>
        <span class="status-label">FAST</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

const cpuUsage = ref(0);
const chipRam = ref('512K');
const fastRam = ref('512K');
const chipRamUsage = ref(0);
const fastRamUsage = ref(0);
const uptime = ref(0);

let interval: number | undefined;

const uptimeString = computed(() => {
  const hours = Math.floor(uptime.value / 3600);
  const minutes = Math.floor((uptime.value % 3600) / 60);
  const seconds = Math.floor(uptime.value % 60);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

const fetchSystemStatus = async () => {
  try {
    const response = await fetch('/api/system/monitor');
    if (response.ok) {
      const data = await response.json();
      cpuUsage.value = data.cpuUsage || 0;
      chipRam.value = data.memory?.chipMem || '512K';
      fastRam.value = data.memory?.fastMem || '512K';
      chipRamUsage.value = data.memory?.chipUsagePercent || 0;
      fastRamUsage.value = data.memory?.fastUsagePercent || 0;
      uptime.value = data.uptime || 0;
    }
  } catch (error) {
    console.error('Failed to fetch system status:', error);
    // Simulate data if API fails
    cpuUsage.value = Math.random() * 100;
    chipRamUsage.value = 50 + Math.random() * 30;
    fastRamUsage.value = 30 + Math.random() * 40;
    uptime.value += 2;
  }
};

onMounted(() => {
  fetchSystemStatus();
  interval = window.setInterval(fetchSystemStatus, 2000);
});

onUnmounted(() => {
  if (interval) {
    clearInterval(interval);
  }
});
</script>

<style scoped>
.system-monitor-content {
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.monitor-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-label {
  font-size: 8px;
  color: var(--theme-text);
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.meter-container {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meter-bar {
  flex: 1;
  height: 12px;
  background: #1a1a1a;
  border: 1px solid var(--theme-borderDark);
  box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.meter-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ff00, #ffff00, #ff0000);
  transition: width 0.3s ease;
  box-shadow: 0 0 8px rgba(0, 255, 0, 0.5);
}

.meter-fill.chip-ram {
  background: linear-gradient(90deg, #0099ff, #00ffff);
  box-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
}

.meter-fill.fast-ram {
  background: linear-gradient(90deg, #ff9900, #ffaa00);
  box-shadow: 0 0 8px rgba(255, 170, 0, 0.5);
}

.meter-value {
  font-size: 9px;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  min-width: 45px;
  text-align: right;
  text-shadow: 0 0 4px #00ff00;
}

.uptime-display {
  background: #1a1a1a;
  border: 1px solid var(--theme-borderDark);
  padding: 6px 8px;
  text-align: center;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #ffaa00;
  text-shadow: 0 0 6px #ffaa00;
  letter-spacing: 2px;
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.5);
}

.status-indicators {
  display: flex;
  justify-content: space-around;
  padding: 8px 0;
  border-top: 1px solid var(--theme-border);
  margin-top: 4px;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #333;
  border: 1px solid var(--theme-borderDark);
  transition: all 0.3s;
}

.status-dot.active {
  background: #ff0000;
  box-shadow: 0 0 8px #ff0000;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.status-label {
  font-size: 7px;
  color: var(--theme-text);
  opacity: 0.7;
}
</style>
