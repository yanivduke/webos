<template>
  <div class="undo-redo-toolbar">
    <button
      class="amiga-button toolbar-button"
      :disabled="!canUndo"
      @click="handleUndo"
      title="Undo (Ctrl+Z)"
    >
      <span class="button-icon">↶</span>
      Undo
    </button>

    <button
      class="amiga-button toolbar-button"
      :disabled="!canRedo"
      @click="handleRedo"
      title="Redo (Ctrl+Shift+Z)"
    >
      <span class="button-icon">↷</span>
      Redo
    </button>

    <div v-if="dragHistory.length > 0" class="history-info">
      <span class="history-count">{{ dragHistory.length }} actions</span>
    </div>

    <button
      v-if="dragHistory.length > 0"
      class="amiga-button toolbar-button"
      @click="showHistory = !showHistory"
      title="Show History"
    >
      <span class="button-icon">📋</span>
      History
    </button>

    <!-- History Dropdown -->
    <div v-if="showHistory" class="history-dropdown">
      <div class="history-header">
        <span>Action History</span>
        <button class="close-button" @click="showHistory = false">✕</button>
      </div>
      <div class="history-list">
        <div
          v-for="(entry, index) in dragHistory.slice(0, 10)"
          :key="index"
          class="history-entry"
          @click="undoToIndex(index)"
        >
          <div class="history-entry-icon">
            {{ getOperationIcon(entry.operation.type) }}
          </div>
          <div class="history-entry-details">
            <div class="history-entry-title">
              {{ getOperationTitle(entry.operation) }}
            </div>
            <div class="history-entry-time">
              {{ formatTime(entry.timestamp) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useDragDrop } from '../composables/useDragDrop';

const { canUndo, canRedo, dragHistory, undoneHistory, undo, redo } = useDragDrop();

const showHistory = ref(false);

const handleUndo = async () => {
  const success = await undo();
  if (success) {
    console.log('Undo successful');
  } else {
    console.log('Cannot undo');
  }
};

const handleRedo = async () => {
  const success = await redo();
  if (success) {
    console.log('Redo successful');
  } else {
    console.log('Cannot redo');
  }
};

const undoToIndex = async (index: number) => {
  for (let i = 0; i <= index; i++) {
    await undo();
  }
  showHistory.value = false;
};

const getOperationIcon = (type: string): string => {
  const icons: Record<string, string> = {
    move: '➜',
    copy: '📋',
    reorder: '⇅',
    link: '🔗',
  };
  return icons[type] || '⚙️';
};

const getOperationTitle = (operation: any): string => {
  const count = operation.items?.length || 0;
  const name = operation.items?.[0]?.name || 'items';

  switch (operation.type) {
    case 'move':
      if (operation.destination === 'trash') {
        return `Deleted ${count} item(s)`;
      }
      return `Moved ${count} item(s)`;
    case 'copy':
      return `Copied ${name}`;
    case 'reorder':
      return `Reordered ${count} item(s)`;
    default:
      return `${operation.type} ${name}`;
  }
};

const formatTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString();
};

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
    event.preventDefault();
    if (event.shiftKey) {
      handleRedo();
    } else {
      handleUndo();
    }
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.undo-redo-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px;
  background: #a0a0a0;
  border-bottom: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  position: relative;
}

.toolbar-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 10px;
}

.button-icon {
  font-size: 14px;
}

.history-info {
  margin-left: auto;
  font-size: 8px;
  color: #555555;
}

.history-count {
  padding: 2px 6px;
  background: rgba(0, 85, 170, 0.2);
  border: 1px solid #0055aa;
}

.history-dropdown {
  position: absolute;
  top: 100%;
  right: 8px;
  width: 300px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #0055aa;
  color: #ffffff;
  font-size: 10px;
  border-bottom: 2px solid #000000;
}

.close-button {
  background: none;
  border: none;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
  padding: 0 4px;
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
}

.history-entry {
  display: flex;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid #555555;
  cursor: pointer;
  transition: background 0.1s;
}

.history-entry:hover {
  background: rgba(0, 85, 170, 0.2);
}

.history-entry-icon {
  font-size: 16px;
  width: 24px;
  text-align: center;
}

.history-entry-details {
  flex: 1;
}

.history-entry-title {
  font-size: 9px;
  margin-bottom: 2px;
}

.history-entry-time {
  font-size: 7px;
  color: #555555;
}
</style>
