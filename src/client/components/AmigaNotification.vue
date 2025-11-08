<template>
  <Transition name="slide-in">
    <div
      v-if="isVisible"
      class="amiga-notification"
      :class="[`notification-${notification.type}`, { 'notification-persistent': notification.persistent }]"
      @click="handleClick"
      :style="{ '--notification-color': notificationColor }"
    >
      <div class="notification-header">
        <div class="notification-icon">{{ notification.icon }}</div>
        <div class="notification-title">{{ notification.title }}</div>
        <div class="notification-close" @click.stop="handleClose">×</div>
      </div>
      <div class="notification-message">{{ notification.message }}</div>
      <div v-if="!notification.persistent && showProgress" class="notification-progress">
        <div class="progress-bar" :style="{ width: progressWidth + '%' }"></div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useNotifications, type Notification } from '../composables/useNotifications'

const props = defineProps<{
  notification: Notification
}>()

const emit = defineEmits<{
  dismiss: [id: string]
}>()

const { getColorForType, triggerAction, dismiss } = useNotifications()

const isVisible = ref(false)
const progressWidth = ref(100)
const showProgress = ref(true)
let progressInterval: number | null = null
let dismissTimeout: number | null = null

const notificationColor = computed(() => getColorForType(props.notification.type))

const handleClick = () => {
  if (props.notification.action) {
    triggerAction(props.notification.id)
  }
  handleClose()
}

const handleClose = () => {
  isVisible.value = false
  setTimeout(() => {
    emit('dismiss', props.notification.id)
  }, 300) // Wait for animation to complete
}

const startAutoDismiss = () => {
  if (props.notification.persistent) {
    showProgress.value = false
    return
  }

  const timeout = props.notification.timeout || 5000
  const updateInterval = 50
  const steps = timeout / updateInterval

  let currentStep = 0

  progressInterval = window.setInterval(() => {
    currentStep++
    progressWidth.value = 100 - (currentStep / steps) * 100

    if (currentStep >= steps) {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
    }
  }, updateInterval)

  dismissTimeout = window.setTimeout(() => {
    handleClose()
  }, timeout)
}

onMounted(() => {
  // Trigger slide-in animation
  setTimeout(() => {
    isVisible.value = true
  }, 10)

  startAutoDismiss()
})

onUnmounted(() => {
  if (progressInterval) {
    clearInterval(progressInterval)
  }
  if (dismissTimeout) {
    clearTimeout(dismissTimeout)
  }
})
</script>

<style scoped>
.amiga-notification {
  position: relative;
  width: 300px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  margin-bottom: 10px;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
  cursor: pointer;
  user-select: none;
}

.amiga-notification:hover {
  background: #b0b0b0;
}

.amiga-notification:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.notification-header {
  display: flex;
  align-items: center;
  padding: 8px;
  background: var(--notification-color);
  border-bottom: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.notification-icon {
  font-family: 'Press Start 2P', monospace;
  font-size: 14px;
  margin-right: 8px;
  color: #ffffff;
  min-width: 20px;
  text-align: center;
}

.notification-title {
  flex: 1;
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notification-close {
  font-family: 'Press Start 2P', monospace;
  font-size: 14px;
  color: #ffffff;
  cursor: pointer;
  padding: 0 4px;
  margin-left: 8px;
  line-height: 1;
}

.notification-close:hover {
  color: #ffff00;
}

.notification-message {
  padding: 8px;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: #000000;
  line-height: 1.5;
  word-wrap: break-word;
}

.notification-progress {
  height: 4px;
  background: #666666;
  border-top: 1px solid #000000;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--notification-color);
  transition: width 50ms linear;
}

/* Slide in from right animation */
.slide-in-enter-active,
.slide-in-leave-active {
  transition: all 0.3s ease;
}

.slide-in-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-in-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Persistent notification styling */
.notification-persistent {
  border-left: 4px solid var(--notification-color);
}

/* Type-specific colors */
.notification-info {
  --notification-color: #0055aa;
}

.notification-success {
  --notification-color: #00aa00;
}

.notification-warning {
  --notification-color: #ffaa00;
}

.notification-error {
  --notification-color: #aa0000;
}

.notification-system {
  --notification-color: #888888;
}
</style>
