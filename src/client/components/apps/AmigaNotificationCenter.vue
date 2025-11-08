<template>
  <div class="amiga-notification-center">
    <!-- Toolbar -->
    <div class="notification-toolbar">
      <div class="toolbar-left">
        <div class="filter-label">Filter:</div>
        <div
          v-for="filterType in filterOptions"
          :key="filterType.value"
          class="amiga-button filter-button"
          :class="{ active: activeFilter === filterType.value }"
          @click="setFilter(filterType.value)"
        >
          {{ filterType.label }}
        </div>
      </div>
      <div class="toolbar-right">
        <div class="unread-badge" v-if="unreadCount > 0">
          {{ unreadCount }} unread
        </div>
        <div class="amiga-button" @click="markAllRead">
          Mark All Read
        </div>
        <div class="amiga-button" @click="clearAll">
          Clear All
        </div>
      </div>
    </div>

    <!-- Notification List -->
    <div class="notification-list">
      <div v-if="filteredNotifications.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="24" fill="none" stroke="#808080" stroke-width="2"/>
            <path d="M 20 32 L 44 32" stroke="#808080" stroke-width="2"/>
          </svg>
        </div>
        <div class="empty-text">No notifications</div>
      </div>

      <div
        v-for="notification in filteredNotifications"
        :key="notification.id"
        class="notification-item"
        :class="[
          `notification-${notification.type}`,
          { unread: !notification.read }
        ]"
        @click="markRead(notification.id)"
      >
        <div class="notification-item-header">
          <div class="notification-item-icon">
            <svg v-if="notification.type === 'info'" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="6" fill="#0055aa"/>
              <text x="8" y="11" text-anchor="middle" fill="#ffffff" font-size="10" font-weight="bold">i</text>
            </svg>
            <svg v-if="notification.type === 'success'" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="6" fill="#00aa00"/>
              <path d="M 5 8 L 7 10 L 11 6" stroke="#ffffff" stroke-width="2" fill="none"/>
            </svg>
            <svg v-if="notification.type === 'warning'" viewBox="0 0 16 16">
              <path d="M 8 2 L 14 14 L 2 14 Z" fill="#ffaa00"/>
              <text x="8" y="12" text-anchor="middle" fill="#000000" font-size="8" font-weight="bold">!</text>
            </svg>
            <svg v-if="notification.type === 'error'" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="6" fill="#cc0000"/>
              <path d="M 5 5 L 11 11 M 11 5 L 5 11" stroke="#ffffff" stroke-width="2"/>
            </svg>
          </div>
          <div class="notification-item-title">{{ notification.title }}</div>
          <div class="notification-item-time">{{ formatTime(notification.timestamp) }}</div>
        </div>
        <div class="notification-item-message">{{ notification.message }}</div>
        <div v-if="!notification.read" class="unread-indicator">●</div>
      </div>
    </div>

    <!-- Status Bar -->
    <div class="notification-status-bar">
      <div class="status-left">
        Total: {{ notifications.length }} | Showing: {{ filteredNotifications.length }}
      </div>
      <div class="status-right">
        Notification Center v1.0
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import notificationManager, { type Notification, type NotificationType } from '../../utils/notification-manager';

interface FilterOption {
  value: 'all' | NotificationType;
  label: string;
}

const filterOptions: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' }
];

const notifications = ref<Notification[]>([]);
const activeFilter = ref<'all' | NotificationType>('all');
const unreadCount = ref(0);

let unsubscribe: (() => void) | null = null;

onMounted(() => {
  // Subscribe to notification history changes
  unsubscribe = notificationManager.subscribeToHistory((history) => {
    notifications.value = history;
    updateUnreadCount();
  });
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});

const filteredNotifications = computed(() => {
  if (activeFilter.value === 'all') {
    return notifications.value;
  }
  return notifications.value.filter(n => n.type === activeFilter.value);
});

const setFilter = (filter: 'all' | NotificationType) => {
  activeFilter.value = filter;
};

const markRead = (id: string) => {
  notificationManager.markAsRead(id);
};

const markAllRead = () => {
  if (confirm('Mark all notifications as read?')) {
    notificationManager.markAllAsRead();
  }
};

const clearAll = () => {
  if (confirm('Clear all notification history? This cannot be undone.')) {
    notificationManager.clearHistory();
  }
};

const updateUnreadCount = () => {
  unreadCount.value = notificationManager.getUnreadCount();
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Less than 1 minute
  if (diff < 60000) {
    return 'Just now';
  }

  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }

  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }

  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  }

  // Show full date
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.amiga-notification-center {
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: 'Press Start 2P', 'Courier New', monospace;
  background: #a0a0a0;
}

/* Toolbar */
.notification-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #c0c0c0;
  border-bottom: 2px solid #000000;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 9px;
  color: #000000;
  margin-right: 4px;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 8px;
  font-size: 8px;
  cursor: pointer;
  color: #000000;
  transition: all 0.1s;
  white-space: nowrap;
}

.amiga-button:hover {
  background: #b0b0b0;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.filter-button.active {
  background: #0055aa;
  color: #ffffff;
  border-color: #000000 #ffffff #ffffff #000000;
}

.unread-badge {
  background: #cc0000;
  color: #ffffff;
  padding: 4px 8px;
  font-size: 8px;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

/* Notification List */
.notification-list {
  flex: 1;
  overflow-y: auto;
  background: #ffffff;
  padding: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #808080;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
}

.empty-icon svg {
  width: 100%;
  height: 100%;
}

.empty-text {
  font-size: 10px;
}

/* Notification Item */
.notification-item {
  background: #e0e0e0;
  border: 2px solid;
  border-color: #ffffff #808080 #808080 #ffffff;
  margin-bottom: 8px;
  padding: 8px;
  cursor: pointer;
  position: relative;
  transition: all 0.1s;
}

.notification-item:hover {
  background: #f0f0f0;
}

.notification-item.unread {
  background: #ffffff;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 0 0 0 2px #0055aa;
}

.notification-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.notification-item-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.notification-item-icon svg {
  width: 100%;
  height: 100%;
}

.notification-item-title {
  flex: 1;
  font-size: 9px;
  font-weight: bold;
  color: #000000;
}

.notification-item-time {
  font-size: 7px;
  color: #666666;
  white-space: nowrap;
}

.notification-item-message {
  font-size: 8px;
  color: #333333;
  line-height: 1.5;
  word-wrap: break-word;
}

.unread-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #0055aa;
  font-size: 16px;
  line-height: 1;
}

/* Status Bar */
.notification-status-bar {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
  background: #c0c0c0;
  border-top: 2px solid #000000;
  font-size: 7px;
  color: #000000;
}

/* Scrollbar styling */
.notification-list::-webkit-scrollbar {
  width: 16px;
}

.notification-list::-webkit-scrollbar-track {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #808080 #ffffff #ffffff #808080;
}

.notification-list::-webkit-scrollbar-thumb {
  background: #0055aa;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.notification-list::-webkit-scrollbar-thumb:hover {
  background: #0066cc;
}

.notification-list::-webkit-scrollbar-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  height: 16px;
}

.notification-list::-webkit-scrollbar-button:hover {
  background: #b0b0b0;
}
</style>
