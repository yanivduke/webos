<template>
  <div class="amiga-folder">
    <!-- Folder Content with Icon View -->
    <div class="folder-content">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="folder-item"
        :class="{ selected: selectedItems.includes(item.id) }"
        @click="selectItem(item, $event)"
        @dblclick="openItem(item)"
      >
        <div class="item-icon">
          <!-- Folder Icon -->
          <svg v-if="item.type === 'folder'" viewBox="0 0 48 48" class="icon-svg">
            <path d="M 4 8 L 4 40 L 44 40 L 44 16 L 24 16 L 20 8 Z" fill="#ffaa00" stroke="#000" stroke-width="2"/>
            <path d="M 4 8 L 20 8 L 24 16 L 44 16 L 44 12 L 24 12 L 20 8 Z" fill="#ffcc44" stroke="#000" stroke-width="1"/>
          </svg>

          <!-- File Icon -->
          <svg v-else-if="item.type === 'file'" viewBox="0 0 48 48" class="icon-svg">
            <rect x="10" y="6" width="28" height="36" fill="#ffffff" stroke="#000" stroke-width="2"/>
            <line x1="14" y1="14" x2="34" y2="14" stroke="#0055aa" stroke-width="2"/>
            <line x1="14" y1="20" x2="34" y2="20" stroke="#0055aa" stroke-width="2"/>
            <line x1="14" y1="26" x2="28" y2="26" stroke="#0055aa" stroke-width="2"/>
            <line x1="14" y1="32" x2="30" y2="32" stroke="#0055aa" stroke-width="2"/>
          </svg>

          <!-- Disk Icon -->
          <svg v-else-if="item.type === 'disk'" viewBox="0 0 48 48" class="icon-svg">
            <rect x="8" y="12" width="32" height="24" fill="#666" stroke="#000" stroke-width="2"/>
            <rect x="12" y="16" width="24" height="6" fill="#333"/>
            <circle cx="24" cy="28" r="6" fill="#888"/>
            <circle cx="24" cy="28" r="3" fill="#333"/>
          </svg>

          <!-- Tool Icon -->
          <svg v-else-if="item.type === 'tool'" viewBox="0 0 48 48" class="icon-svg">
            <rect x="12" y="8" width="24" height="32" fill="#0055aa" stroke="#000" stroke-width="2"/>
            <rect x="16" y="12" width="16" height="4" fill="#fff"/>
            <rect x="16" y="18" width="16" height="4" fill="#fff"/>
            <rect x="16" y="24" width="16" height="4" fill="#fff"/>
          </svg>
        </div>
        <div class="item-label">{{ item.name }}</div>
        <div v-if="item.size" class="item-size">{{ item.size }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';

interface Props {
  data?: any;
}

interface FolderItem {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'disk' | 'tool';
  size?: string;
  icon?: string;
}

const props = defineProps<Props>();

// Sample items based on folder type
const items = computed<FolderItem[]>(() => {
  if (!props.data) {
    return defaultItems.value;
  }

  switch (props.data.id) {
    case 'ram':
      return [
        { id: 'r1', name: 'Clipboards', type: 'folder' },
        { id: 'r2', name: 'T', type: 'folder' },
        { id: 'r3', name: 'ENV', type: 'folder' }
      ];

    case 'utils':
      return [
        { id: 'u1', name: 'Clock', type: 'tool' },
        { id: 'u2', name: 'Calculator', type: 'tool' },
        { id: 'u3', name: 'MultiView', type: 'tool' },
        { id: 'u4', name: 'NotePad', type: 'tool' },
        { id: 'u5', name: 'Shell', type: 'tool' },
        { id: 'u6', name: 'More', type: 'folder' }
      ];

    case 'trash':
      return [];

    default:
      return [
        { id: 'd1', name: 'Devs', type: 'folder' },
        { id: 'd2', name: 'Expansion', type: 'folder' },
        { id: 'd3', name: 'Fonts', type: 'folder' },
        { id: 'd4', name: 'Libs', type: 'folder' },
        { id: 'd5', name: 'Prefs', type: 'folder' },
        { id: 'd6', name: 'System', type: 'folder' },
        { id: 'd7', name: 'Tools', type: 'folder' },
        { id: 'd8', name: 'Utilities', type: 'folder' },
        { id: 'f1', name: 'Shell-Startup', type: 'file', size: '1.2K' },
        { id: 'f2', name: 'Startup-Sequence', type: 'file', size: '856' }
      ];
  }
});

const defaultItems = ref<FolderItem[]>([
  { id: '1', name: 'Documents', type: 'folder' },
  { id: '2', name: 'Pictures', type: 'folder' },
  { id: '3', name: 'Music', type: 'folder' },
  { id: '4', name: 'ReadMe.txt', type: 'file', size: '1.2K' },
  { id: '5', name: 'Info.doc', type: 'file', size: '4.5K' }
]);

const selectedItems = ref<string[]>([]);

const selectItem = (item: FolderItem, event: MouseEvent) => {
  if (event.ctrlKey || event.metaKey) {
    // Multi-select with Ctrl/Cmd
    const index = selectedItems.value.indexOf(item.id);
    if (index > -1) {
      selectedItems.value.splice(index, 1);
    } else {
      selectedItems.value.push(item.id);
    }
  } else {
    // Single select
    selectedItems.value = [item.id];
  }
};

const openItem = (item: FolderItem) => {
  console.log(`Opening: ${item.name}`);
  // Emit event to parent to open new window
};
</script>

<style scoped>
.amiga-folder {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.folder-content {
  flex: 1;
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  grid-gap: 16px;
  align-content: start;
  overflow-y: auto;
}

.folder-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  user-select: none;
  border: 2px solid transparent;
  background: transparent;
  transition: all 0.1s;
}

.folder-item:hover {
  background: rgba(0, 85, 170, 0.1);
}

.folder-item.selected {
  background: #0055aa;
  border-color: #0055aa;
}

.folder-item.selected .item-label {
  color: #ffffff;
  background: #0055aa;
  text-shadow: none;
}

.item-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 4px;
}

.icon-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.3));
}

.item-label {
  font-size: 9px;
  text-align: center;
  color: #000000;
  max-width: 70px;
  word-wrap: break-word;
  line-height: 1.3;
  padding: 2px 4px;
  background: rgba(255, 255, 255, 0.8);
  font-family: 'Press Start 2P', monospace;
}

.item-size {
  font-size: 7px;
  color: #666666;
  margin-top: 2px;
}
</style>
