<template>
  <div
    class="smart-folder-item"
    :class="{ selected: isSelected }"
    @click="selectFolder"
    @dblclick="openFolder"
    @contextmenu.prevent="showContextMenu"
  >
    <div class="folder-icon-container">
      <!-- Dynamic SVG icon based on folder type -->
      <svg viewBox="0 0 64 64" class="folder-svg">
        <!-- Base folder -->
        <path d="M 4 16 L 4 52 L 60 52 L 60 24 L 32 24 L 28 16 Z" :fill="folder.color" stroke="#000" stroke-width="2"/>
        <path d="M 4 16 L 28 16 L 32 24 L 60 24 L 60 20 L 32 20 L 28 16 Z" :fill="lightenColor(folder.color)" stroke="#000" stroke-width="1"/>

        <!-- Magnifying glass overlay -->
        <circle cx="44" cy="40" r="8" fill="#ffffff" stroke="#000" stroke-width="2"/>
        <circle cx="44" cy="40" r="5" fill="none" stroke="#0055aa" stroke-width="2"/>
        <line x1="50" y1="46" x2="56" y2="52" stroke="#0055aa" stroke-width="3" stroke-linecap="round"/>
      </svg>

      <!-- Live file count badge -->
      <div v-if="folder.fileCount !== undefined" class="file-count-badge">
        {{ formatCount(folder.fileCount) }}
      </div>

      <!-- Auto-refresh indicator -->
      <div v-if="folder.autoRefresh && isRefreshing" class="refresh-indicator">
        ↻
      </div>
    </div>

    <div class="folder-label">{{ folder.name }}</div>

    <!-- Context Menu -->
    <div
      v-if="contextMenuVisible"
      class="context-menu"
      :style="contextMenuStyle"
      @click.stop
    >
      <div class="context-item" @click="openFolder">
        <span class="context-icon">⤢</span>
        <span>Open</span>
      </div>
      <div class="context-separator"></div>
      <div class="context-item" @click="refreshFolder">
        <span class="context-icon">↻</span>
        <span>Refresh Now</span>
      </div>
      <div class="context-item" @click="editCriteria">
        <span class="context-icon">✎</span>
        <span>Edit Criteria</span>
      </div>
      <div class="context-separator"></div>
      <div class="context-item" @click="toggleAutoRefresh">
        <span class="context-icon">{{ folder.autoRefresh ? '✓' : '☐' }}</span>
        <span>Auto-refresh</span>
      </div>
      <div class="context-separator"></div>
      <div class="context-item" @click="duplicateFolder">
        <span class="context-icon">⎘</span>
        <span>Duplicate</span>
      </div>
      <div class="context-item danger" @click="deleteFolder">
        <span class="context-icon">✕</span>
        <span>Delete</span>
      </div>
      <div class="context-separator"></div>
      <div class="context-item" @click="showInformation">
        <span class="context-icon">ℹ</span>
        <span>Information</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  SmartFolder,
  refreshSmartFolder,
  updateSmartFolder,
  deleteSmartFolder as removeSmartFolder,
  duplicateSmartFolder,
  subscribe
} from '../utils/smart-folders';

interface Props {
  folder: SmartFolder;
  selected?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  open: [folder: SmartFolder];
  select: [folder: SmartFolder];
  refresh: [folder: SmartFolder];
  delete: [folder: SmartFolder];
}>();

// ==================== State ====================

const isSelected = computed(() => props.selected);
const isRefreshing = ref(false);
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);

const contextMenuStyle = computed(() => ({
  top: `${contextMenuY.value}px`,
  left: `${contextMenuX.value}px`
}));

// ==================== Actions ====================

const selectFolder = () => {
  emit('select', props.folder);
};

const openFolder = () => {
  emit('open', props.folder);
};

const refreshFolder = async () => {
  isRefreshing.value = true;
  contextMenuVisible.value = false;

  try {
    await refreshSmartFolder(props.folder.id);
    emit('refresh', props.folder);
  } catch (error) {
    console.error('Failed to refresh smart folder:', error);
    alert('Failed to refresh folder');
  } finally {
    isRefreshing.value = false;
  }
};

const editCriteria = () => {
  contextMenuVisible.value = false;

  // Show basic edit dialog
  const criteriaInfo = `Current criteria:
Query: "${props.folder.criteria.query || '(empty)'}"
Mode: ${props.folder.criteria.mode || 'simple'}
Scope: ${props.folder.criteria.scope || 'all'}
File Types: ${props.folder.criteria.fileTypes?.join(', ') || 'all'}`;

  alert(criteriaInfo + '\n\nUse Advanced Search to modify criteria and save as new smart folder.');
};

const toggleAutoRefresh = async () => {
  contextMenuVisible.value = false;

  try {
    updateSmartFolder(props.folder.id, {
      autoRefresh: !props.folder.autoRefresh
    });
  } catch (error) {
    console.error('Failed to toggle auto-refresh:', error);
  }
};

const duplicateFolder = () => {
  contextMenuVisible.value = false;

  try {
    duplicateSmartFolder(props.folder.id);
    alert(`"${props.folder.name}" duplicated`);
  } catch (error) {
    console.error('Failed to duplicate folder:', error);
    alert('Failed to duplicate folder');
  }
};

const deleteFolder = () => {
  contextMenuVisible.value = false;

  if (!confirm(`Delete smart folder "${props.folder.name}"?\n\nThis cannot be undone.`)) {
    return;
  }

  try {
    removeSmartFolder(props.folder.id);
    emit('delete', props.folder);
  } catch (error) {
    console.error('Failed to delete folder:', error);
    alert('Failed to delete folder');
  }
};

const showInformation = () => {
  contextMenuVisible.value = false;

  const info = `Smart Folder Information

Name: ${props.folder.name}
Files: ${props.folder.fileCount || 0}
Auto-refresh: ${props.folder.autoRefresh ? 'Yes' : 'No'}
Created: ${formatDate(props.folder.created)}
Last Updated: ${formatDate(props.folder.lastUpdated)}

Search Criteria:
Mode: ${props.folder.criteria.mode || 'simple'}
Query: ${props.folder.criteria.query || '(empty)'}
Scope: ${props.folder.criteria.scope || 'all'}
File Types: ${props.folder.criteria.fileTypes?.join(', ') || 'all'}`;

  alert(info);
};

const showContextMenu = (event: MouseEvent) => {
  event.preventDefault();
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  contextMenuVisible.value = true;
};

const closeContextMenu = () => {
  contextMenuVisible.value = false;
};

// ==================== Utilities ====================

const lightenColor = (color: string): string => {
  // Simple color lightening - add 40 to each RGB component
  if (!color.startsWith('#')) return color;

  const hex = color.substring(1);
  const r = Math.min(255, parseInt(hex.substring(0, 2), 16) + 40);
  const g = Math.min(255, parseInt(hex.substring(2, 4), 16) + 40);
  const b = Math.min(255, parseInt(hex.substring(4, 6), 16) + 40);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const formatCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString();
};

// ==================== Lifecycle ====================

let unsubscribe: (() => void) | null = null;

onMounted(() => {
  // Close context menu when clicking outside
  document.addEventListener('click', closeContextMenu);

  // Subscribe to smart folder updates
  unsubscribe = subscribe(() => {
    // Force re-render when smart folders change
    // The parent component will provide updated props
  });

  // Refresh folder on mount if auto-refresh is enabled
  if (props.folder.autoRefresh) {
    const lastUpdate = new Date(props.folder.lastUpdated).getTime();
    const now = Date.now();
    const age = now - lastUpdate;

    // If not updated in last 5 minutes, refresh
    if (age > 5 * 60 * 1000) {
      refreshFolder();
    }
  }
});

onUnmounted(() => {
  document.removeEventListener('click', closeContextMenu);
  if (unsubscribe) {
    unsubscribe();
  }
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.smart-folder-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  user-select: none;
  padding: 8px;
  transition: all 0.1s;
  position: relative;
}

.smart-folder-item:hover {
  background: rgba(0, 85, 170, 0.2);
}

.smart-folder-item.selected {
  background: rgba(0, 85, 170, 0.4);
}

.folder-icon-container {
  position: relative;
  width: 64px;
  height: 64px;
  margin-bottom: 4px;
}

.folder-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(2px 2px 0px rgba(0, 0, 0, 0.3));
}

.file-count-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ff0000;
  color: #ffffff;
  font-size: 7px;
  font-family: 'Press Start 2P', monospace;
  padding: 2px 4px;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  border-radius: 8px;
  min-width: 16px;
  text-align: center;
  box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.refresh-indicator {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: #00aa00;
  color: #ffffff;
  font-size: 12px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.folder-label {
  font-size: 9px;
  color: #000000;
  text-align: center;
  text-shadow:
    -1px -1px 0 #ffffff,
    1px -1px 0 #ffffff,
    -1px 1px 0 #ffffff,
    1px 1px 0 #ffffff;
  max-width: 80px;
  word-wrap: break-word;
  font-family: 'Press Start 2P', monospace;
}

/* Context Menu */
.context-menu {
  position: fixed;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.4);
  z-index: 10000;
  min-width: 180px;
  font-family: 'Press Start 2P', monospace;
}

.context-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 8px;
  cursor: pointer;
  color: #000000;
  transition: all 0.1s;
  border-bottom: 1px solid #808080;
}

.context-item:last-child {
  border-bottom: none;
}

.context-item:hover {
  background: #0055aa;
  color: #ffffff;
}

.context-item.danger:hover {
  background: #aa0000;
  color: #ffffff;
}

.context-icon {
  font-size: 12px;
  width: 16px;
  text-align: center;
}

.context-separator {
  height: 1px;
  background: #808080;
  margin: 2px 0;
}
</style>
