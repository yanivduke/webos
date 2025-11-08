<template>
  <div class="disk-usage-content">
    <div class="disk-header">
      <span class="header-label">Mounted Disks</span>
      <span class="disk-count">{{ disks.length }}</span>
    </div>

    <div class="disk-list">
      <div
        v-for="disk in disks"
        :key="disk.id"
        class="disk-item"
        :class="{ clickable: disk.type !== 'floppy' }"
        @click="openDisk(disk)"
      >
        <div class="disk-info">
          <div class="disk-name">
            <span class="disk-icon">{{ getDiskIcon(disk.type) }}</span>
            <span class="disk-label">{{ disk.name }}</span>
          </div>
          <div class="disk-stats">
            <span class="disk-used">{{ disk.used }}</span>
            <span class="disk-separator">/</span>
            <span class="disk-capacity">{{ disk.capacity }}</span>
          </div>
        </div>

        <div class="usage-bar">
          <div
            class="usage-fill"
            :class="getUsageClass(disk.usagePercent)"
            :style="{ width: `${disk.usagePercent}%` }"
          ></div>
        </div>

        <div class="disk-percent">{{ disk.usagePercent.toFixed(0) }}%</div>
      </div>
    </div>

    <div class="disk-legend">
      <div class="legend-item">
        <span class="legend-color low"></span>
        <span class="legend-label">Low</span>
      </div>
      <div class="legend-item">
        <span class="legend-color medium"></span>
        <span class="legend-label">Med</span>
      </div>
      <div class="legend-item">
        <span class="legend-color high"></span>
        <span class="legend-label">High</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';

interface Disk {
  id: string;
  name: string;
  type: 'floppy' | 'hard' | 'ram';
  capacity: string;
  used: string;
  free: string;
  usagePercent: number;
}

const disks = ref<Disk[]>([]);
let interval: number | undefined;

const getDiskIcon = (type: string) => {
  switch (type) {
    case 'floppy':
      return '💾';
    case 'hard':
      return '🖴';
    case 'ram':
      return '⚡';
    default:
      return '💽';
  }
};

const getUsageClass = (percent: number) => {
  if (percent < 50) return 'low';
  if (percent < 80) return 'medium';
  return 'high';
};

const openDisk = (disk: Disk) => {
  // Only open hard drives and RAM disk
  if (disk.type !== 'floppy') {
    console.log('Opening disk:', disk.id);
    // Trigger disk open event if needed
    window.dispatchEvent(new CustomEvent('open-disk', { detail: disk.id }));
  }
};

const fetchDiskUsage = async () => {
  try {
    const response = await fetch('/api/system/status');
    if (response.ok) {
      const data = await response.json();
      if (data.disks && Array.isArray(data.disks)) {
        disks.value = data.disks.map((disk: any) => ({
          ...disk,
          usagePercent: calculateUsagePercent(disk.used, disk.capacity)
        }));
      }
    }
  } catch (error) {
    console.error('Failed to fetch disk usage:', error);
    // Keep existing data or show defaults
    if (disks.value.length === 0) {
      disks.value = [
        {
          id: 'df0',
          name: 'Workbench3.1',
          type: 'floppy',
          capacity: '880K',
          used: '720K',
          free: '160K',
          usagePercent: 81.8
        },
        {
          id: 'dh0',
          name: 'System',
          type: 'hard',
          capacity: '40MB',
          used: '28MB',
          free: '12MB',
          usagePercent: 70
        },
        {
          id: 'dh1',
          name: 'Work',
          type: 'hard',
          capacity: '100MB',
          used: '45MB',
          free: '55MB',
          usagePercent: 45
        },
        {
          id: 'ram',
          name: 'RAM Disk',
          type: 'ram',
          capacity: '2MB',
          used: '512K',
          free: '1.5MB',
          usagePercent: 25
        }
      ];
    }
  }
};

const calculateUsagePercent = (used: string, capacity: string): number => {
  const parseSize = (size: string): number => {
    const match = size.match(/^([\d.]+)([KMG]B?)$/i);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    if (unit.startsWith('K')) return value;
    if (unit.startsWith('M')) return value * 1024;
    if (unit.startsWith('G')) return value * 1024 * 1024;
    return value;
  };

  const usedBytes = parseSize(used);
  const capacityBytes = parseSize(capacity);

  if (capacityBytes === 0) return 0;
  return (usedBytes / capacityBytes) * 100;
};

onMounted(() => {
  fetchDiskUsage();
  interval = window.setInterval(fetchDiskUsage, 5000);
});

onUnmounted(() => {
  if (interval) {
    clearInterval(interval);
  }
});
</script>

<style scoped>
.disk-usage-content {
  min-width: 240px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.disk-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--theme-border);
}

.header-label {
  font-size: 9px;
  color: var(--theme-text);
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.disk-count {
  font-size: 10px;
  color: var(--theme-highlight);
  font-weight: bold;
}

.disk-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.disk-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px;
  background: rgba(0, 0, 0, 0.1);
  border: 1px solid var(--theme-borderDark);
  border-radius: 2px;
  transition: all 0.2s;
}

.disk-item.clickable {
  cursor: pointer;
}

.disk-item.clickable:hover {
  background: rgba(0, 85, 170, 0.2);
  border-color: var(--theme-highlight);
}

.disk-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.disk-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 9px;
  color: var(--theme-text);
}

.disk-icon {
  font-size: 12px;
  line-height: 1;
}

.disk-label {
  font-weight: bold;
}

.disk-stats {
  font-size: 7px;
  color: var(--theme-text);
  opacity: 0.7;
  font-family: 'Courier New', monospace;
}

.disk-used {
  color: #ffaa00;
}

.disk-separator {
  color: var(--theme-border);
}

.disk-capacity {
  color: #00ff00;
}

.usage-bar {
  height: 10px;
  background: #1a1a1a;
  border: 1px solid var(--theme-borderDark);
  box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  position: relative;
}

.usage-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.usage-fill.low {
  background: linear-gradient(90deg, #00ff00, #00ff88);
  box-shadow: 0 0 6px rgba(0, 255, 0, 0.5);
}

.usage-fill.medium {
  background: linear-gradient(90deg, #ffaa00, #ffff00);
  box-shadow: 0 0 6px rgba(255, 170, 0, 0.5);
}

.usage-fill.high {
  background: linear-gradient(90deg, #ff6600, #ff0000);
  box-shadow: 0 0 6px rgba(255, 0, 0, 0.5);
}

.disk-percent {
  font-size: 8px;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  text-align: right;
  text-shadow: 0 0 4px #00ff00;
}

.disk-legend {
  display: flex;
  justify-content: space-around;
  padding: 6px 0;
  border-top: 1px solid var(--theme-border);
  margin-top: 2px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-color {
  width: 12px;
  height: 8px;
  border: 1px solid var(--theme-borderDark);
}

.legend-color.low {
  background: #00ff00;
}

.legend-color.medium {
  background: #ffaa00;
}

.legend-color.high {
  background: #ff0000;
}

.legend-label {
  font-size: 7px;
  color: var(--theme-text);
  opacity: 0.7;
}
</style>
