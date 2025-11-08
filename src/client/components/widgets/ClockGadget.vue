<template>
  <div class="clock-gadget-content">
    <div class="digital-display">
      <div class="time-display">{{ timeString }}</div>
      <div class="date-display">{{ dateString }}</div>
    </div>

    <div class="analog-clock">
      <svg viewBox="0 0 100 100" class="clock-face">
        <!-- Clock circle -->
        <circle cx="50" cy="50" r="45" fill="#1a1a1a" stroke="#0ff" stroke-width="2"/>

        <!-- Hour markers -->
        <line v-for="i in 12" :key="`hour-${i}`"
          :x1="50 + 38 * Math.sin(i * 30 * Math.PI / 180)"
          :y1="50 - 38 * Math.cos(i * 30 * Math.PI / 180)"
          :x2="50 + 42 * Math.sin(i * 30 * Math.PI / 180)"
          :y2="50 - 42 * Math.cos(i * 30 * Math.PI / 180)"
          stroke="#0ff"
          stroke-width="2"
        />

        <!-- Hour hand -->
        <line
          :x1="50"
          :y1="50"
          :x2="50 + 25 * Math.sin(hourAngle * Math.PI / 180)"
          :y2="50 - 25 * Math.cos(hourAngle * Math.PI / 180)"
          stroke="#ffaa00"
          stroke-width="4"
          stroke-linecap="round"
        />

        <!-- Minute hand -->
        <line
          :x1="50"
          :y1="50"
          :x2="50 + 35 * Math.sin(minuteAngle * Math.PI / 180)"
          :y2="50 - 35 * Math.cos(minuteAngle * Math.PI / 180)"
          stroke="#0ff"
          stroke-width="3"
          stroke-linecap="round"
        />

        <!-- Second hand -->
        <line
          :x1="50"
          :y1="50"
          :x2="50 + 38 * Math.sin(secondAngle * Math.PI / 180)"
          :y2="50 - 38 * Math.cos(secondAngle * Math.PI / 180)"
          stroke="#ff0000"
          stroke-width="1"
          stroke-linecap="round"
        />

        <!-- Center dot -->
        <circle cx="50" cy="50" r="3" fill="#0ff"/>
      </svg>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

const now = ref(new Date());
let interval: number | undefined;

const updateTime = () => {
  now.value = new Date();
};

const timeString = computed(() => {
  const hours = String(now.value.getHours()).padStart(2, '0');
  const minutes = String(now.value.getMinutes()).padStart(2, '0');
  const seconds = String(now.value.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
});

const dateString = computed(() => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const day = days[now.value.getDay()];
  const month = months[now.value.getMonth()];
  const date = now.value.getDate();
  const year = now.value.getFullYear();

  return `${day}, ${month} ${date}, ${year}`;
});

const hourAngle = computed(() => {
  const hours = now.value.getHours() % 12;
  const minutes = now.value.getMinutes();
  return (hours * 30) + (minutes * 0.5);
});

const minuteAngle = computed(() => {
  const minutes = now.value.getMinutes();
  const seconds = now.value.getSeconds();
  return (minutes * 6) + (seconds * 0.1);
});

const secondAngle = computed(() => {
  return now.value.getSeconds() * 6;
});

onMounted(() => {
  updateTime();
  interval = window.setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (interval) {
    clearInterval(interval);
  }
});
</script>

<style scoped>
.clock-gadget-content {
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.digital-display {
  background: #1a1a1a;
  border: 2px solid var(--theme-borderDark);
  padding: 8px;
  text-align: center;
  font-family: 'Courier New', monospace;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
}

.time-display {
  font-size: 16px;
  color: #00ff00;
  font-weight: bold;
  text-shadow: 0 0 8px #00ff00;
  letter-spacing: 2px;
  margin-bottom: 4px;
}

.date-display {
  font-size: 8px;
  color: #ffaa00;
  text-shadow: 0 0 4px #ffaa00;
  letter-spacing: 1px;
}

.analog-clock {
  width: 100%;
  aspect-ratio: 1;
  max-width: 200px;
  margin: 0 auto;
}

.clock-face {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 4px rgba(0, 255, 255, 0.3));
}
</style>
