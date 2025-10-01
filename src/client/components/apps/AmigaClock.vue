<template>
  <div class="amiga-clock">
    <!-- Analog Clock -->
    <div class="clock-container">
      <svg viewBox="0 0 200 200" class="clock-face">
        <!-- Clock background -->
        <circle cx="100" cy="100" r="95" fill="#ffffff" stroke="#000000" stroke-width="4"/>

        <!-- Hour markers -->
        <g v-for="hour in 12" :key="hour">
          <line
            :x1="100 + 80 * Math.sin(hour * 30 * Math.PI / 180)"
            :y1="100 - 80 * Math.cos(hour * 30 * Math.PI / 180)"
            :x2="100 + 90 * Math.sin(hour * 30 * Math.PI / 180)"
            :y2="100 - 90 * Math.cos(hour * 30 * Math.PI / 180)"
            stroke="#000000"
            stroke-width="3"
          />
          <text
            :x="100 + 70 * Math.sin(hour * 30 * Math.PI / 180)"
            :y="100 - 70 * Math.cos(hour * 30 * Math.PI / 180) + 5"
            text-anchor="middle"
            font-size="16"
            font-weight="bold"
            fill="#000000"
          >
            {{ hour }}
          </text>
        </g>

        <!-- Hour hand -->
        <line
          :x1="100"
          :y1="100"
          :x2="100 + 45 * Math.sin(hourAngle)"
          :y2="100 - 45 * Math.cos(hourAngle)"
          stroke="#000000"
          stroke-width="6"
          stroke-linecap="round"
        />

        <!-- Minute hand -->
        <line
          :x1="100"
          :y1="100"
          :x2="100 + 65 * Math.sin(minuteAngle)"
          :y2="100 - 65 * Math.cos(minuteAngle)"
          stroke="#0055aa"
          stroke-width="4"
          stroke-linecap="round"
        />

        <!-- Second hand -->
        <line
          :x1="100"
          :y1="100"
          :x2="100 + 75 * Math.sin(secondAngle)"
          :y2="100 - 75 * Math.cos(secondAngle)"
          stroke="#ff6600"
          stroke-width="2"
          stroke-linecap="round"
        />

        <!-- Center dot -->
        <circle cx="100" cy="100" r="6" fill="#000000"/>
        <circle cx="100" cy="100" r="3" fill="#ff6600"/>
      </svg>
    </div>

    <!-- Digital Display -->
    <div class="digital-display">
      <div class="digital-time">{{ digitalTime }}</div>
      <div class="digital-date">{{ digitalDate }}</div>
    </div>

    <!-- Controls -->
    <div class="clock-controls">
      <button class="amiga-button small" @click="toggleFormat">
        {{ is24Hour ? '24h' : '12h' }}
      </button>
      <button class="amiga-button small" @click="showInfo = !showInfo">
        Info
      </button>
    </div>

    <!-- Info Panel -->
    <div v-if="showInfo" class="info-panel">
      <div><strong>Timezone:</strong> {{ timezone }}</div>
      <div><strong>Day:</strong> {{ dayOfWeek }}</div>
      <div><strong>Week:</strong> {{ weekOfYear }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const currentTime = ref(new Date());
const is24Hour = ref(true);
const showInfo = ref(false);

let intervalId: number | undefined;

onMounted(() => {
  updateTime();
  intervalId = window.setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});

const updateTime = () => {
  currentTime.value = new Date();
};

const secondAngle = computed(() => {
  const seconds = currentTime.value.getSeconds();
  return (seconds * 6) * (Math.PI / 180);
});

const minuteAngle = computed(() => {
  const minutes = currentTime.value.getMinutes();
  const seconds = currentTime.value.getSeconds();
  return ((minutes + seconds / 60) * 6) * (Math.PI / 180);
});

const hourAngle = computed(() => {
  const hours = currentTime.value.getHours() % 12;
  const minutes = currentTime.value.getMinutes();
  return ((hours + minutes / 60) * 30) * (Math.PI / 180);
});

const digitalTime = computed(() => {
  const hours = currentTime.value.getHours();
  const minutes = currentTime.value.getMinutes();
  const seconds = currentTime.value.getSeconds();

  if (is24Hour.value) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${period}`;
  }
});

const digitalDate = computed(() => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  return currentTime.value.toLocaleDateString('en-US', options);
});

const timezone = computed(() => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
});

const dayOfWeek = computed(() => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[currentTime.value.getDay()];
});

const weekOfYear = computed(() => {
  const start = new Date(currentTime.value.getFullYear(), 0, 1);
  const diff = currentTime.value.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.floor(diff / oneWeek) + 1;
});

const toggleFormat = () => {
  is24Hour.value = !is24Hour.value;
};
</script>

<style scoped>
.amiga-clock {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
  padding: 12px;
  gap: 12px;
}

.clock-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.clock-face {
  width: 100%;
  max-width: 250px;
  height: auto;
  filter: drop-shadow(3px 3px 6px rgba(0, 0, 0, 0.3));
}

.digital-display {
  background: #000000;
  border: 3px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 12px;
  text-align: center;
}

.digital-time {
  color: #00ff00;
  font-size: 20px;
  font-weight: bold;
  text-shadow: 0 0 10px #00ff00;
  margin-bottom: 6px;
}

.digital-date {
  color: #00aaaa;
  font-size: 9px;
  text-shadow: 0 0 6px #00aaaa;
}

.clock-controls {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 16px;
  font-size: 9px;
  cursor: pointer;
  color: #000000;
  font-family: 'Press Start 2P', monospace;
  transition: all 0.05s;
}

.amiga-button:hover {
  background: #b0b0b0;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button.small {
  padding: 4px 12px;
  font-size: 8px;
}

.info-panel {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 8px;
  font-size: 8px;
  line-height: 1.6;
  color: #000000;
}

.info-panel div {
  margin: 4px 0;
}

.info-panel strong {
  color: #0055aa;
  margin-right: 4px;
}
</style>
