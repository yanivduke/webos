import { ref, computed, onMounted } from 'vue'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'system'
  title: string
  message: string
  timestamp: Date
  read: boolean
  persistent: boolean
  action?: () => void
  icon?: string
  timeout?: number // in milliseconds, default 5000
}

const notifications = ref<Notification[]>([])
const STORAGE_KEY = 'webos-notifications'
const MAX_NOTIFICATIONS = 50
const MAX_AGE_DAYS = 7

// Load notifications from localStorage
const loadNotifications = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Filter out old notifications (older than 7 days)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - MAX_AGE_DAYS)

      notifications.value = parsed
        .map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }))
        .filter((n: Notification) => n.timestamp > cutoffDate)
        .slice(0, MAX_NOTIFICATIONS)
    }
  } catch (e) {
    console.error('Failed to load notifications:', e)
  }
}

// Save notifications to localStorage
const saveNotifications = () => {
  try {
    const toSave = notifications.value.slice(0, MAX_NOTIFICATIONS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch (e) {
    console.error('Failed to save notifications:', e)
  }
}

// Get icon for notification type
const getIconForType = (type: Notification['type']): string => {
  switch (type) {
    case 'info':
      return 'ℹ'
    case 'success':
      return '✓'
    case 'warning':
      return '⚠'
    case 'error':
      return '✗'
    case 'system':
      return '⚙'
    default:
      return '•'
  }
}

// Get color for notification type
const getColorForType = (type: Notification['type']): string => {
  switch (type) {
    case 'info':
      return '#0055aa' // Amiga blue
    case 'success':
      return '#00aa00' // Green
    case 'warning':
      return '#ffaa00' // Orange/Yellow
    case 'error':
      return '#aa0000' // Red
    case 'system':
      return '#888888' // Gray
    default:
      return '#a0a0a0'
  }
}

export const useNotifications = () => {
  // Initialize on first use
  if (notifications.value.length === 0) {
    loadNotifications()
  }

  const unreadCount = computed(() =>
    notifications.value.filter(n => !n.read).length
  )

  const activeNotifications = computed(() =>
    notifications.value.filter(n => !n.read || n.persistent)
  )

  // Create a new notification
  const notify = (options: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
      persistent: false,
      timeout: 5000,
      icon: getIconForType(options.type),
      ...options
    }

    // Add to beginning of array (newest first)
    notifications.value.unshift(notification)

    // Keep only MAX_NOTIFICATIONS
    if (notifications.value.length > MAX_NOTIFICATIONS) {
      notifications.value = notifications.value.slice(0, MAX_NOTIFICATIONS)
    }

    saveNotifications()

    // Play sound effect based on type
    playNotificationSound(notification.type)

    return notification.id
  }

  // Dismiss a notification
  const dismiss = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
      saveNotifications()
    }
  }

  // Mark notification as read
  const markRead = (id: string) => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
      saveNotifications()
    }
  }

  // Mark all as read
  const markAllRead = () => {
    notifications.value.forEach(n => n.read = true)
    saveNotifications()
  }

  // Clear all notifications
  const clearAll = () => {
    notifications.value = []
    saveNotifications()
  }

  // Clear read notifications
  const clearRead = () => {
    notifications.value = notifications.value.filter(n => !n.read)
    saveNotifications()
  }

  // Trigger notification action
  const triggerAction = (id: string) => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification?.action) {
      notification.action()
      markRead(id)
    }
  }

  // Play sound effect for notification type
  const playNotificationSound = (type: Notification['type']) => {
    // TODO: Integrate with existing sound effects system
    // For now, use system beep
    try {
      // Check if AudioContext is available
      if (typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined') {
        const AudioContextClass = AudioContext || (window as any).webkitAudioContext
        const audioCtx = new AudioContextClass()
        const oscillator = audioCtx.createOscillator()
        const gainNode = audioCtx.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioCtx.destination)

        // Different frequencies for different notification types
        switch (type) {
          case 'info':
            oscillator.frequency.value = 440 // A4
            break
          case 'success':
            oscillator.frequency.value = 523 // C5
            break
          case 'warning':
            oscillator.frequency.value = 349 // F4
            break
          case 'error':
            oscillator.frequency.value = 293 // D4
            break
          case 'system':
            oscillator.frequency.value = 392 // G4
            break
        }

        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1)

        oscillator.start(audioCtx.currentTime)
        oscillator.stop(audioCtx.currentTime + 0.1)
      }
    } catch (e) {
      // Silently fail if audio not available
      console.debug('Audio notification failed:', e)
    }
  }

  // Group notifications by date
  const groupedNotifications = computed(() => {
    const groups: {
      today: Notification[]
      yesterday: Notification[]
      earlier: Notification[]
    } = {
      today: [],
      yesterday: [],
      earlier: []
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    notifications.value.forEach(notification => {
      const notifDate = new Date(notification.timestamp)
      const notifDay = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate())

      if (notifDay.getTime() === today.getTime()) {
        groups.today.push(notification)
      } else if (notifDay.getTime() === yesterday.getTime()) {
        groups.yesterday.push(notification)
      } else {
        groups.earlier.push(notification)
      }
    })

    return groups
  })

  return {
    notifications,
    unreadCount,
    activeNotifications,
    groupedNotifications,
    notify,
    dismiss,
    markRead,
    markAllRead,
    clearAll,
    clearRead,
    triggerAction,
    getIconForType,
    getColorForType
  }
}
