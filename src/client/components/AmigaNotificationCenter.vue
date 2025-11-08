<template>
  <Transition name="slide-panel">
    <div v-if="isOpen" class="notification-center-overlay" @click.self="close">
      <div class="notification-center">
        <div class="notification-center-header">
          <div class="header-title">Notifications</div>
          <div class="header-actions">
            <div class="header-button" @click="markAllRead" title="Mark all as read">
              ✓
            </div>
            <div class="header-button" @click="close" title="Close">×</div>
          </div>
        </div>

        <div class="notification-center-body">
          <div v-if="notifications.length === 0" class="empty-state">
            <div class="empty-icon">🔔</div>
            <div class="empty-text">No notifications</div>
          </div>

          <div v-else class="notification-groups">
            <!-- Today -->
            <div v-if="groupedNotifications.today.length > 0" class="notification-group">
              <div class="group-header">Today</div>
              <div class="group-items">
                <div
                  v-for="notification in groupedNotifications.today"
                  :key="notification.id"
                  class="notification-item"
                  :class="{ 'notification-unread': !notification.read }"
                  @click="handleNotificationClick(notification)"
                >
                  <div class="item-indicator" :style="{ background: getColorForType(notification.type) }"></div>
                  <div class="item-icon">{{ notification.icon }}</div>
                  <div class="item-content">
                    <div class="item-title">{{ notification.title }}</div>
                    <div class="item-message">{{ notification.message }}</div>
                    <div class="item-time">{{ formatTime(notification.timestamp) }}</div>
                  </div>
                  <div class="item-actions">
                    <div class="item-action" @click.stop="dismiss(notification.id)" title="Dismiss">×</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Yesterday -->
            <div v-if="groupedNotifications.yesterday.length > 0" class="notification-group">
              <div class="group-header">Yesterday</div>
              <div class="group-items">
                <div
                  v-for="notification in groupedNotifications.yesterday"
                  :key="notification.id"
                  class="notification-item"
                  :class="{ 'notification-unread': !notification.read }"
                  @click="handleNotificationClick(notification)"
                >
                  <div class="item-indicator" :style="{ background: getColorForType(notification.type) }"></div>
                  <div class="item-icon">{{ notification.icon }}</div>
                  <div class="item-content">
                    <div class="item-title">{{ notification.title }}</div>
                    <div class="item-message">{{ notification.message }}</div>
                    <div class="item-time">{{ formatTime(notification.timestamp) }}</div>
                  </div>
                  <div class="item-actions">
                    <div class="item-action" @click.stop="dismiss(notification.id)" title="Dismiss">×</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Earlier -->
            <div v-if="groupedNotifications.earlier.length > 0" class="notification-group">
              <div class="group-header">Earlier</div>
              <div class="group-items">
                <div
                  v-for="notification in groupedNotifications.earlier"
                  :key="notification.id"
                  class="notification-item"
                  :class="{ 'notification-unread': !notification.read }"
                  @click="handleNotificationClick(notification)"
                >
                  <div class="item-indicator" :style="{ background: getColorForType(notification.type) }"></div>
                  <div class="item-icon">{{ notification.icon }}</div>
                  <div class="item-content">
                    <div class="item-title">{{ notification.title }}</div>
                    <div class="item-message">{{ notification.message }}</div>
                    <div class="item-time">{{ formatDate(notification.timestamp) }}</div>
                  </div>
                  <div class="item-actions">
                    <div class="item-action" @click.stop="dismiss(notification.id)" title="Dismiss">×</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="notifications.length > 0" class="notification-center-footer">
          <div class="footer-button" @click="clearRead">Clear Read</div>
          <div class="footer-button" @click="handleClearAll">Clear All</div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNotifications, type Notification } from '../composables/useNotifications'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const {
  notifications,
  groupedNotifications,
  dismiss,
  markRead,
  markAllRead,
  clearAll,
  clearRead,
  triggerAction,
  getColorForType
} = useNotifications()

const close = () => {
  emit('close')
}

const handleNotificationClick = (notification: Notification) => {
  markRead(notification.id)
  if (notification.action) {
    triggerAction(notification.id)
    close()
  }
}

const handleClearAll = () => {
  if (confirm('Clear all notifications?')) {
    clearAll()
  }
}

const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

const formatDate = (date: Date): string => {
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${month}/${day} ${formatTime(date)}`
}
</script>

<style scoped>
.notification-center-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10000;
  display: flex;
  justify-content: flex-end;
}

.notification-center {
  width: 400px;
  max-width: 90vw;
  height: 100vh;
  background: #a0a0a0;
  border-left: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 8px rgba(0, 0, 0, 0.3);
}

.notification-center-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #0055aa;
  border-bottom: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.header-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 12px;
  color: #ffffff;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.header-button {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  font-family: 'Press Start 2P', monospace;
  font-size: 12px;
  color: #000000;
}

.header-button:hover {
  background: #b0b0b0;
}

.header-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.notification-center-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: #666666;
}

.notification-groups {
  padding: 8px;
}

.notification-group {
  margin-bottom: 16px;
}

.group-header {
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: #000000;
  padding: 8px;
  background: #888888;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  margin-bottom: 4px;
}

.group-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 8px;
  background: #c0c0c0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  position: relative;
}

.notification-item:hover {
  background: #d0d0d0;
}

.notification-item:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #a0a0a0;
}

.notification-unread {
  background: #ffffff;
}

.notification-unread:hover {
  background: #f0f0f0;
}

.item-indicator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.item-icon {
  font-family: 'Press Start 2P', monospace;
  font-size: 14px;
  margin-right: 8px;
  margin-left: 4px;
  min-width: 20px;
  text-align: center;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: #000000;
  margin-bottom: 4px;
  font-weight: bold;
}

.item-message {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: #333333;
  line-height: 1.4;
  margin-bottom: 4px;
  word-wrap: break-word;
}

.item-time {
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  color: #666666;
}

.item-actions {
  display: flex;
  gap: 4px;
  margin-left: 8px;
}

.item-action {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  font-family: 'Press Start 2P', monospace;
  font-size: 12px;
  color: #000000;
}

.item-action:hover {
  background: #b0b0b0;
}

.item-action:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.notification-center-footer {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: #888888;
  border-top: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.footer-button {
  flex: 1;
  padding: 8px;
  text-align: center;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  color: #000000;
}

.footer-button:hover {
  background: #b0b0b0;
}

.footer-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

/* Slide panel animation */
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: opacity 0.3s ease;
}

.slide-panel-enter-active .notification-center,
.slide-panel-leave-active .notification-center {
  transition: transform 0.3s ease;
}

.slide-panel-enter-from,
.slide-panel-leave-to {
  opacity: 0;
}

.slide-panel-enter-from .notification-center,
.slide-panel-leave-to .notification-center {
  transform: translateX(100%);
}

/* Custom scrollbar for Amiga aesthetic */
.notification-center-body::-webkit-scrollbar {
  width: 16px;
}

.notification-center-body::-webkit-scrollbar-track {
  background: #888888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.notification-center-body::-webkit-scrollbar-thumb {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.notification-center-body::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
}
</style>
