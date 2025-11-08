<template>
  <div class="workspace-manager">
    <!-- Header -->
    <div class="manager-header">
      <h2>Workspace Manager</h2>
      <p class="subtitle">Manage your virtual desktops</p>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <button class="amiga-button" @click="createWorkspace">
        New Workspace
      </button>
      <button class="amiga-button" @click="refreshList">
        Refresh
      </button>
      <div class="spacer"></div>
      <div class="workspace-count">
        {{ workspaces.length }}/{{ maxWorkspaces }} Workspaces
      </div>
    </div>

    <!-- Workspace List -->
    <div class="workspace-list">
      <div
        v-for="workspace in workspaces"
        :key="workspace.id"
        class="workspace-card"
        :class="{ active: workspace.id === currentWorkspaceId }"
      >
        <!-- Workspace Header -->
        <div class="workspace-card-header">
          <div class="workspace-info">
            <div class="workspace-id">Workspace {{ workspace.id }}</div>
            <div class="workspace-name">{{ workspace.name }}</div>
          </div>
          <div class="workspace-actions">
            <button
              class="action-button"
              @click="switchTo(workspace.id)"
              :disabled="workspace.id === currentWorkspaceId"
              title="Switch to this workspace"
            >
              Switch
            </button>
            <button
              class="action-button"
              @click="editWorkspace(workspace)"
              title="Rename workspace"
            >
              Edit
            </button>
            <button
              v-if="workspaces.length > 1"
              class="action-button danger"
              @click="deleteWorkspace(workspace)"
              title="Delete workspace"
            >
              Delete
            </button>
          </div>
        </div>

        <!-- Workspace Stats -->
        <div class="workspace-stats">
          <div class="stat-item">
            <span class="stat-label">Windows:</span>
            <span class="stat-value">{{ workspace.windows.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Created:</span>
            <span class="stat-value">{{ formatDate(workspace.created) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Last Active:</span>
            <span class="stat-value">{{ formatDate(workspace.lastAccessed) }}</span>
          </div>
        </div>

        <!-- Window List -->
        <div v-if="workspace.windows.length > 0" class="window-list">
          <div class="window-list-header">Open Windows:</div>
          <div
            v-for="window in workspace.windows"
            :key="window.id"
            class="window-item"
          >
            <div class="window-icon">▣</div>
            <div class="window-title">{{ window.title }}</div>
            <div class="window-actions">
              <select
                v-if="workspaces.length > 1"
                class="move-select"
                @change="moveWindow(window.id, workspace.id, $event)"
                title="Move to workspace"
              >
                <option value="">Move to...</option>
                <option
                  v-for="ws in workspaces"
                  :key="ws.id"
                  :value="ws.id"
                  :disabled="ws.id === workspace.id"
                >
                  {{ ws.name }}
                </option>
              </select>
            </div>
          </div>
        </div>
        <div v-else class="no-windows">
          No open windows
        </div>

        <!-- Current Workspace Indicator -->
        <div v-if="workspace.id === currentWorkspaceId" class="current-badge">
          CURRENT
        </div>
      </div>
    </div>

    <!-- Keyboard Shortcuts Help -->
    <div class="shortcuts-panel">
      <div class="shortcuts-header">Keyboard Shortcuts</div>
      <div class="shortcuts-grid">
        <div class="shortcut-item">
          <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>1-9</kbd>
          <span class="shortcut-desc">Switch to workspace</span>
        </div>
        <div class="shortcut-item">
          <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>←</kbd> / <kbd>→</kbd>
          <span class="shortcut-desc">Previous/Next workspace</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import workspaceManager from '../../utils/workspace-manager';
import type { Workspace } from '../../utils/workspace-manager';

// State
const workspaces = ref<Workspace[]>([]);
const currentWorkspaceId = ref(1);
const maxWorkspaces = ref(9);

// Update workspace list
const refreshList = () => {
  workspaces.value = workspaceManager.getAllWorkspaces();
  currentWorkspaceId.value = workspaceManager.getCurrentWorkspaceId();
  maxWorkspaces.value = workspaceManager.getConfig().maxWorkspaces;
};

// Subscribe to changes
let unsubscribeChange: (() => void) | undefined;
let unsubscribeUpdate: (() => void) | undefined;

onMounted(() => {
  refreshList();

  unsubscribeChange = workspaceManager.subscribe(() => {
    currentWorkspaceId.value = workspaceManager.getCurrentWorkspaceId();
  });

  unsubscribeUpdate = workspaceManager.subscribeToUpdates(() => {
    refreshList();
  });
});

onUnmounted(() => {
  if (unsubscribeChange) unsubscribeChange();
  if (unsubscribeUpdate) unsubscribeUpdate();
});

// Create new workspace
const createWorkspace = () => {
  try {
    const name = prompt('Enter workspace name:', `Workspace ${workspaces.value.length + 1}`);
    if (name && name.trim()) {
      workspaceManager.createWorkspace(name.trim());
      refreshList();
    }
  } catch (error) {
    alert('Maximum number of workspaces reached (9)');
  }
};

// Edit workspace
const editWorkspace = (workspace: Workspace) => {
  const newName = prompt('Enter new name:', workspace.name);
  if (newName && newName.trim()) {
    workspaceManager.renameWorkspace(workspace.id, newName.trim());
    refreshList();
  }
};

// Delete workspace
const deleteWorkspace = (workspace: Workspace) => {
  const hasWindows = workspace.windows.length > 0;
  const message = hasWindows
    ? `Delete workspace "${workspace.name}"?\n\nThis workspace has ${workspace.windows.length} open window(s) which will be closed.`
    : `Delete workspace "${workspace.name}"?`;

  if (confirm(message)) {
    try {
      workspaceManager.deleteWorkspace(workspace.id);
      refreshList();
    } catch (error) {
      alert('Cannot delete the last workspace');
    }
  }
};

// Switch to workspace
const switchTo = (id: number) => {
  workspaceManager.switchWorkspace(id);
};

// Move window to another workspace
const moveWindow = (windowId: string, fromWorkspaceId: number, event: Event) => {
  const target = event.target as HTMLSelectElement;
  const toWorkspaceId = parseInt(target.value);

  if (!toWorkspaceId || toWorkspaceId === fromWorkspaceId) {
    target.value = '';
    return;
  }

  const toWorkspace = workspaceManager.getWorkspace(toWorkspaceId);
  if (!toWorkspace) {
    target.value = '';
    return;
  }

  if (confirm(`Move window to "${toWorkspace.name}"?`)) {
    // Need to temporarily switch to source workspace to move the window
    const currentId = workspaceManager.getCurrentWorkspaceId();
    workspaceManager.switchWorkspace(fromWorkspaceId);
    workspaceManager.moveWindowToWorkspace(windowId, toWorkspaceId);
    workspaceManager.switchWorkspace(currentId);
    refreshList();
  }

  target.value = '';
};

// Format date for display
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
};
</script>

<style scoped>
.workspace-manager {
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: 'Press Start 2P', monospace;
  background: #ffffff;
  overflow: hidden;
}

/* Header */
.manager-header {
  padding: 12px;
  background: #a0a0a0;
  border-bottom: 2px solid #000000;
}

.manager-header h2 {
  font-size: 14px;
  margin: 0 0 8px 0;
  color: #000000;
}

.subtitle {
  font-size: 8px;
  margin: 0;
  color: #333333;
}

/* Toolbar */
.toolbar {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: #c0c0c0;
  border-bottom: 2px solid #808080;
  align-items: center;
}

.spacer {
  flex: 1;
}

.workspace-count {
  font-size: 9px;
  color: #0055aa;
  font-weight: bold;
  padding: 4px 8px;
  background: #ffffff;
  border: 1px solid #808080;
}

/* Amiga Button */
.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 12px;
  font-size: 9px;
  cursor: pointer;
  color: #000000;
  font-family: 'Press Start 2P', monospace;
  transition: all 0.1s;
}

.amiga-button:hover {
  background: #b0b0b0;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button:disabled {
  color: #808080;
  cursor: not-allowed;
  background: #909090;
}

/* Workspace List */
.workspace-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: #ffffff;
}

.workspace-card {
  background: #e0e0e0;
  border: 2px solid;
  border-color: #ffffff #808080 #808080 #ffffff;
  padding: 12px;
  margin-bottom: 12px;
  position: relative;
}

.workspace-card.active {
  background: #cce0ff;
  border-color: #0055aa #003388 #003388 #0055aa;
}

.workspace-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #808080;
}

.workspace-info {
  flex: 1;
}

.workspace-id {
  font-size: 8px;
  color: #666666;
  margin-bottom: 4px;
}

.workspace-name {
  font-size: 11px;
  color: #000000;
  font-weight: bold;
}

.workspace-actions {
  display: flex;
  gap: 4px;
}

.action-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 3px 8px;
  font-size: 8px;
  cursor: pointer;
  color: #000000;
  font-family: 'Press Start 2P', monospace;
  transition: all 0.1s;
}

.action-button:hover:not(:disabled) {
  background: #b0b0b0;
}

.action-button:active:not(:disabled) {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.action-button:disabled {
  color: #808080;
  cursor: not-allowed;
  background: #909090;
}

.action-button.danger {
  color: #ff0000;
}

.action-button.danger:hover {
  background: #ff0000;
  color: #ffffff;
}

/* Workspace Stats */
.workspace-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.stat-item {
  font-size: 7px;
  padding: 4px;
  background: #ffffff;
  border: 1px solid #808080;
}

.stat-label {
  color: #666666;
  display: block;
  margin-bottom: 2px;
}

.stat-value {
  color: #0055aa;
  font-weight: bold;
  display: block;
}

/* Window List */
.window-list {
  margin-top: 8px;
}

.window-list-header {
  font-size: 8px;
  color: #666666;
  margin-bottom: 6px;
}

.window-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px;
  background: #ffffff;
  border: 1px solid #808080;
  margin-bottom: 4px;
}

.window-icon {
  font-size: 10px;
  color: #0055aa;
}

.window-title {
  flex: 1;
  font-size: 8px;
  color: #000000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.window-actions {
  display: flex;
  gap: 4px;
}

.move-select {
  font-size: 7px;
  font-family: 'Press Start 2P', monospace;
  background: #a0a0a0;
  border: 1px solid #000000;
  padding: 2px;
  cursor: pointer;
}

.no-windows {
  font-size: 8px;
  color: #808080;
  font-style: italic;
  padding: 8px;
  text-align: center;
  background: #f0f0f0;
  border: 1px dashed #c0c0c0;
}

/* Current Badge */
.current-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 7px;
  color: #ffffff;
  background: #0055aa;
  padding: 2px 6px;
  border: 1px solid #003388;
  font-weight: bold;
}

/* Keyboard Shortcuts Panel */
.shortcuts-panel {
  background: #e0e0e0;
  border-top: 2px solid #000000;
  padding: 8px 12px;
}

.shortcuts-header {
  font-size: 9px;
  color: #000000;
  margin-bottom: 8px;
  font-weight: bold;
}

.shortcuts-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.shortcut-item {
  font-size: 7px;
  color: #333333;
  display: flex;
  align-items: center;
  gap: 4px;
}

.shortcut-item kbd {
  background: #a0a0a0;
  border: 1px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 2px 4px;
  font-size: 7px;
  font-family: 'Press Start 2P', monospace;
  border-radius: 2px;
}

.shortcut-desc {
  margin-left: 8px;
  color: #666666;
}

/* Scrollbar */
.workspace-list::-webkit-scrollbar {
  width: 12px;
}

.workspace-list::-webkit-scrollbar-track {
  background: #c0c0c0;
  border: 1px solid #808080;
}

.workspace-list::-webkit-scrollbar-thumb {
  background: #0055aa;
  border: 1px solid #003388;
}

.workspace-list::-webkit-scrollbar-thumb:hover {
  background: #0066cc;
}
</style>
