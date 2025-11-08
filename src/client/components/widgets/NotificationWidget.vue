<template>
  <div class="notification-widget" @click="toggleNotificationCenter" :class="{ 'widget-active': hasUnread }">
    <div class="widget-icon">🔔</div>
    <div v-if="unreadCount > 0" class="widget-badge" :class="{ 'badge-pulse': shouldPulse }">
      {{ displayCount }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useNotifications } from '../../composables/useNotifications'

const emit = defineEmits<{
  toggle: []
}>()

const { unreadCount } = useNotifications()

const shouldPulse = ref(false)
const previousCount = ref(0)

const hasUnread = computed(() => unreadCount.value > 0)

const displayCount = computed(() => {
  if (unreadCount.value > 99) {
    return '99+'
  }
  return unreadCount.value.toString()
})

const toggleNotificationCenter = () => {
  emit('toggle')
}

// Trigger pulse animation when new notification arrives
watch(unreadCount, (newCount, oldCount) => {
  if (newCount > oldCount) {
    shouldPulse.value = true
    setTimeout(() => {
      shouldPulse.value = false
    }, 1000)
  }
  previousCount.value = oldCount
})
</script>

<style scoped>
.notification-widget {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 22px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  margin: 0 4px;
}

.notification-widget:hover {
  background: #b0b0b0;
}

.notification-widget:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.widget-active {
  background: #0055aa;
}

.widget-active:hover {
  background: #0066bb;
}

.widget-icon {
  font-size: 12px;
  line-height: 1;
}

.widget-active .widget-icon {
  filter: brightness(1.5);
}

.widget-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  background: #aa0000;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  border-radius: 8px;
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  color: #ffffff;
  font-weight: bold;
}

.badge-pulse {
  animation: pulse 0.5s ease-in-out 2;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}
</style>
