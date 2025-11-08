<template>
  <div class="widget clock-widget">
    <div class="widget-header">
      <div class="widget-icon">⏰</div>
      <div class="widget-title">Clock</div>
    </div>
    <div class="widget-content">
      <div class="clock-time">{{ currentTime }}</div>
      <div v-if="showDate" class="clock-date">{{ currentDate }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface Props {
  showDate?: boolean;
  showSeconds?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showDate: true,
  showSeconds: true
});

const currentTime = ref('12:00:00');
const currentDate = ref('01 Jan 2024');

let timeInterval: number | undefined;

const updateTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  if (props.showSeconds) {
    currentTime.value = `${hours}:${minutes}:${seconds}`;
  } else {
    currentTime.value = `${hours}:${minutes}`;
  }

  if (props.showDate) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(now.getDate()).padStart(2, '0');
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    currentDate.value = `${day} ${month} ${year}`;
  }
};

onMounted(() => {
  updateTime();
  timeInterval = window.setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});
</script>

<style scoped>
.widget {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 8px;
  margin-bottom: 8px;
  font-family: 'Press Start 2P', monospace;
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #000000;
}

.widget-icon {
  font-size: 12px;
}

.widget-title {
  font-size: 9px;
  color: #0055aa;
  font-weight: bold;
}

.widget-content {
  text-align: center;
}

.clock-time {
  font-size: 14px;
  color: #000000;
  font-weight: bold;
  margin-bottom: 4px;
  text-shadow: 1px 1px 0px rgba(255, 255, 255, 0.5);
}

.clock-date {
  font-size: 8px;
  color: #333333;
}
</style>
