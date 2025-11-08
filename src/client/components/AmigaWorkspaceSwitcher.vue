<template>
  <div v-if="isVisible" class="workspace-switcher-overlay" @click.self="close">
    <div class="workspace-switcher-panel">
      <div class="switcher-header">
        <div class="header-title">Switch Workspace</div>
        <div class="header-hint">Use arrow keys or 1-9 to select</div>
      </div>

      <div class="workspaces-container">
        <div
          v-for="(workspace, index) in workspaces"
          :key="workspace.id"
          class="workspace-item"
          :class="{
            active: workspace.id === currentWorkspaceId,
            selected: index === selectedIndex
          }"
          :style="{ borderColor: workspace.color }"
          @click="selectWorkspace(index)"
          @dblclick="switchToSelected"
        >
          <div class="workspace-number">{{ index + 1 }}</div>
          <div class="workspace-icon" :style="{ color: workspace.color }">
            {{ workspace.icon }}
          </div>
          <div class="workspace-name">{{ workspace.name }}</div>
          <div class="workspace-info">
            {{ workspace.windows.length }} window{{ workspace.windows.length !== 1 ? 's' : '' }}
          </div>
          <div v-if="workspace.id === currentWorkspaceId" class="current-badge">
            CURRENT
          </div>
        </div>
      </div>

      <div class="switcher-footer">
        <div class="footer-actions">
          <button class="amiga-button small" @click="switchToSelected">
            Switch
          </button>
          <button class="amiga-button small" @click="close">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { getWorkspaceSwitcher, type WorkspaceProfile } from '../utils/workspace-switcher';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'switch', workspaceId: string): void;
}>();

const workspaceSwitcher = getWorkspaceSwitcher();

const workspaces = ref<WorkspaceProfile[]>([]);
const currentWorkspaceId = ref<string | null>(null);
const selectedIndex = ref(0);

const isVisible = computed(() => props.visible);

function loadWorkspaces() {
  workspaces.value = workspaceSwitcher.getAllWorkspaces();
  currentWorkspaceId.value = workspaceSwitcher.getCurrentWorkspace()?.id || null;

  // Set selected index to current workspace
  const currentIndex = workspaces.value.findIndex(w => w.id === currentWorkspaceId.value);
  if (currentIndex !== -1) {
    selectedIndex.value = currentIndex;
  }
}

function selectWorkspace(index: number) {
  selectedIndex.value = index;
}

function switchToSelected() {
  if (selectedIndex.value >= 0 && selectedIndex.value < workspaces.value.length) {
    const workspace = workspaces.value[selectedIndex.value];
    emit('switch', workspace.id);
  }
  close();
}

function close() {
  emit('close');
}

function handleKeyDown(e: KeyboardEvent) {
  if (!isVisible.value) return;

  switch (e.key) {
    case 'ArrowLeft':
    case 'ArrowUp':
      e.preventDefault();
      selectedIndex.value = Math.max(0, selectedIndex.value - 1);
      break;

    case 'ArrowRight':
    case 'ArrowDown':
      e.preventDefault();
      selectedIndex.value = Math.min(workspaces.value.length - 1, selectedIndex.value + 1);
      break;

    case 'Enter':
      e.preventDefault();
      switchToSelected();
      break;

    case 'Escape':
      e.preventDefault();
      close();
      break;

    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9':
      e.preventDefault();
      const num = parseInt(e.key);
      if (num <= workspaces.value.length) {
        selectedIndex.value = num - 1;
        switchToSelected();
      }
      break;
  }
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    loadWorkspaces();
  }
});

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
  loadWorkspaces();
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.workspace-switcher-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.1s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.workspace-switcher-panel {
  background: #a0a0a0;
  border: 3px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  width: 800px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  font-family: 'Press Start 2P', monospace;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
  animation: slideIn 0.15s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.switcher-header {
  background: #0055aa;
  color: #ffffff;
  padding: 12px 16px;
  border-bottom: 2px solid #000000;
}

.header-title {
  font-size: 10px;
  margin-bottom: 4px;
}

.header-hint {
  font-size: 6px;
  opacity: 0.9;
}

.workspaces-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  background: #888888;
}

.workspace-item {
  background: #a0a0a0;
  border: 3px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 16px;
  cursor: pointer;
  position: relative;
  transition: all 0.1s;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.workspace-item:hover {
  background: #b0b0b0;
  transform: translateY(-2px);
}

.workspace-item.selected {
  background: #0055aa;
  color: #ffffff;
  border-color: #ffaa00;
  transform: scale(1.05);
}

.workspace-item.active {
  border-width: 4px;
}

.workspace-number {
  position: absolute;
  top: 4px;
  left: 4px;
  font-size: 10px;
  background: #888888;
  color: #ffffff;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.workspace-item.selected .workspace-number {
  background: #ffaa00;
  color: #000000;
}

.workspace-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.workspace-name {
  font-size: 9px;
  margin-bottom: 8px;
  font-weight: bold;
}

.workspace-info {
  font-size: 7px;
  opacity: 0.8;
}

.workspace-item.selected .workspace-info {
  opacity: 1;
}

.current-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 6px;
  background: #00aa55;
  color: #ffffff;
  padding: 2px 6px;
  border: 1px solid #000000;
}

.workspace-item.selected .current-badge {
  background: #ffaa00;
  color: #000000;
}

.switcher-footer {
  background: #888888;
  padding: 12px 16px;
  border-top: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.footer-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 8px 24px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  transition: all 0.1s;
}

.amiga-button:hover {
  background: #b0b0b0;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button.small {
  padding: 6px 16px;
  font-size: 7px;
}
</style>
