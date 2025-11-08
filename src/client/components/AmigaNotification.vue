<template>
  <div
    class="amiga-notification"
    :class="[`notification-${type}`, { 'notification-entering': entering, 'notification-leaving': leaving }]"
  >
    <!-- Notification Header -->
    <div class="notification-header">
      <div class="notification-icon">
        <svg v-if="type === 'info'" viewBox="0 0 16 16" class="icon-svg">
          <circle cx="8" cy="8" r="7" fill="none" stroke="#0055aa" stroke-width="2"/>
          <text x="8" y="12" text-anchor="middle" fill="#0055aa" font-size="12" font-weight="bold">i</text>
        </svg>
        <svg v-if="type === 'success'" viewBox="0 0 16 16" class="icon-svg">
          <circle cx="8" cy="8" r="7" fill="none" stroke="#00aa00" stroke-width="2"/>
          <path d="M 5 8 L 7 10 L 11 6" stroke="#00aa00" stroke-width="2" fill="none"/>
        </svg>
        <svg v-if="type === 'warning'" viewBox="0 0 16 16" class="icon-svg">
          <path d="M 8 2 L 14 14 L 2 14 Z" fill="none" stroke="#ffaa00" stroke-width="2"/>
          <text x="8" y="12" text-anchor="middle" fill="#ffaa00" font-size="10" font-weight="bold">!</text>
        </svg>
        <svg v-if="type === 'error'" viewBox="0 0 16 16" class="icon-svg">
          <circle cx="8" cy="8" r="7" fill="none" stroke="#cc0000" stroke-width="2"/>
          <path d="M 5 5 L 11 11 M 11 5 L 5 11" stroke="#cc0000" stroke-width="2"/>
        </svg>
      </div>
      <div class="notification-title">{{ title }}</div>
      <div class="notification-close" @click="handleDismiss">
        <div class="close-icon"></div>
      </div>
    </div>

    <!-- Notification Body -->
    <div class="notification-body">
      {{ message }}
    </div>

    <!-- Progress Bar -->
    <div v-if="!persistent && showProgress" class="notification-progress">
      <div
        class="notification-progress-bar"
        :style="{ width: `${progress}%` }"
      ></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import type { NotificationType } from '../utils/notification-manager';

interface Props {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration: number;
  persistent?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  persistent: false
});

const emit = defineEmits<{
  dismiss: [id: string];
}>();

const entering = ref(true);
const leaving = ref(false);
const progress = ref(100);
const showProgress = ref(true);

let progressInterval: number | undefined;
let startTime: number;

onMounted(() => {
  // Remove entering class after animation
  setTimeout(() => {
    entering.value = false;
  }, 200);

  // Start progress bar countdown
  if (!props.persistent) {
    startTime = Date.now();
    progressInterval = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, props.duration - elapsed);
      progress.value = (remaining / props.duration) * 100;

      if (remaining === 0) {
        clearInterval(progressInterval);
      }
    }, 50);
  }
});

onUnmounted(() => {
  if (progressInterval) {
    clearInterval(progressInterval);
  }
});

const handleDismiss = () => {
  leaving.value = true;
  showProgress.value = false;

  // Wait for animation to complete before emitting dismiss
  setTimeout(() => {
    emit('dismiss', props.id);
  }, 150);
};
</script>

<style scoped>
.amiga-notification {
  width: 320px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);
  margin-bottom: 10px;
  font-family: 'Press Start 2P', 'Courier New', monospace;
  font-size: 8px;
  overflow: hidden;
  transition: all 0.15s ease-out;
}

/* Entering animation - slide in from right */
.notification-entering {
  animation: slideInRight 0.15s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Leaving animation - slide out to right */
.notification-leaving {
  animation: slideOutRight 0.15s ease-in;
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* Header */
.notification-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: linear-gradient(180deg, #ffffff 0%, #c0c0c0 50%, #a0a0a0 100%);
  border-bottom: 2px solid #000000;
}

.notification-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.icon-svg {
  width: 100%;
  height: 100%;
}

.notification-title {
  flex: 1;
  font-size: 9px;
  font-weight: bold;
  color: #000000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notification-close {
  width: 16px;
  height: 16px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s;
  flex-shrink: 0;
}

.notification-close:hover {
  background: #b0b0b0;
}

.notification-close:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.close-icon {
  width: 8px;
  height: 8px;
  position: relative;
}

.close-icon::before,
.close-icon::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 2px;
  background: #ff6600;
  top: 3px;
  left: -1px;
}

.close-icon::before {
  transform: rotate(45deg);
}

.close-icon::after {
  transform: rotate(-45deg);
}

/* Body */
.notification-body {
  padding: 8px;
  color: #000000;
  background: #ffffff;
  line-height: 1.6;
  word-wrap: break-word;
  max-height: 100px;
  overflow-y: auto;
}

/* Progress Bar */
.notification-progress {
  height: 4px;
  background: #666666;
  border-top: 1px solid #000000;
}

.notification-progress-bar {
  height: 100%;
  transition: width 0.05s linear;
}

.notification-info .notification-progress-bar {
  background: #0055aa;
}

.notification-success .notification-progress-bar {
  background: #00aa00;
}

.notification-warning .notification-progress-bar {
  background: #ffaa00;
}

.notification-error .notification-progress-bar {
  background: #cc0000;
}

/* Scrollbar styling for notification body */
.notification-body::-webkit-scrollbar {
  width: 12px;
}

.notification-body::-webkit-scrollbar-track {
  background: #a0a0a0;
  border: 1px solid;
  border-color: #808080 #ffffff #ffffff #808080;
}

.notification-body::-webkit-scrollbar-thumb {
  background: #0055aa;
  border: 1px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.notification-body::-webkit-scrollbar-thumb:hover {
  background: #0066cc;
}
</style>
