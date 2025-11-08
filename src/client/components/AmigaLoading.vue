<template>
  <div class="amiga-loading">
    <div class="loading-container">
      <!-- Amiga-style loading animation -->
      <div class="loading-diskette">
        <svg viewBox="0 0 64 64" class="diskette-icon">
          <rect x="8" y="12" width="48" height="40" fill="#666" stroke="#000" stroke-width="2"/>
          <rect x="12" y="16" width="40" height="8" fill="#333"/>
          <circle cx="32" cy="36" r="8" fill="#888"/>
          <circle cx="32" cy="36" r="4" fill="#333"/>
          <rect x="16" y="20" width="8" height="2" :fill="ledColor"/>
        </svg>
      </div>

      <!-- Loading text -->
      <div class="loading-text">{{ message }}</div>

      <!-- Amiga-style progress indicator -->
      <div class="loading-bar">
        <div class="loading-progress" :style="{ width: progress + '%' }"></div>
      </div>

      <!-- Blinking cursor -->
      <div class="loading-cursor">_</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';

interface Props {
  message?: string;
}

const props = withDefaults(defineProps<Props>(), {
  message: 'Loading Application...'
});

// Animated progress bar
const progress = ref(0);
const ledColor = ref('#0f0');

let progressInterval: number | undefined;
let ledInterval: number | undefined;

onMounted(() => {
  // Simulate progress
  progressInterval = window.setInterval(() => {
    if (progress.value < 90) {
      progress.value += Math.random() * 10;
    }
  }, 100);

  // Blink LED
  ledInterval = window.setInterval(() => {
    ledColor.value = ledColor.value === '#0f0' ? '#050' : '#0f0';
  }, 500);
});

onUnmounted(() => {
  if (progressInterval) clearInterval(progressInterval);
  if (ledInterval) clearInterval(ledInterval);
});
</script>

<style scoped>
.amiga-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 200px;
  background: #a0a0a0;
  font-family: 'Press Start 2P', 'Courier New', monospace;
}

.loading-container {
  text-align: center;
  padding: 40px;
  background: #a0a0a0;
  border: 3px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.4);
  min-width: 300px;
}

.loading-diskette {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  animation: spin 2s linear infinite;
}

.diskette-icon {
  width: 80px;
  height: 80px;
  filter: drop-shadow(2px 2px 0px rgba(0, 0, 0, 0.3));
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 10px;
  color: #000000;
  margin-bottom: 15px;
  text-shadow:
    -1px -1px 0 #ffffff,
    1px -1px 0 #ffffff,
    -1px 1px 0 #ffffff,
    1px 1px 0 #ffffff;
}

.loading-bar {
  width: 100%;
  height: 12px;
  background: #666666;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  margin-bottom: 15px;
  overflow: hidden;
}

.loading-progress {
  height: 100%;
  background: linear-gradient(
    90deg,
    #0055aa 0%,
    #0088ff 50%,
    #0055aa 100%
  );
  transition: width 0.2s ease;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% {
    background-position: -100px;
  }
  100% {
    background-position: 100px;
  }
}

.loading-cursor {
  font-size: 12px;
  color: #0055aa;
  font-weight: bold;
  display: inline-block;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}
</style>
