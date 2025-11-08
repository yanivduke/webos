<template>
  <div class="workspace-switcher" @contextmenu.prevent="handleContextMenu">
    <!-- Workspace Grid -->
    <div class="workspace-grid">
      <div
        v-for="workspace in workspaces"
        :key="workspace.id"
        class="workspace-item"
        :class="{
          active: workspace.id === currentWorkspaceId,
          'has-windows': hasWindows(workspace.id)
        }"
        @click="switchTo(workspace.id)"
        @contextmenu.prevent.stop="showWorkspaceMenu(workspace.id, $event)"
        :title="workspace.name"
      >
        <div class="workspace-number">{{ workspace.id }}</div>
        <div v-if="hasWindows(workspace.id)" class="window-indicator"></div>
      </div>

      <!-- Add New Workspace Button (if under max) -->
      <div
        v-if="workspaces.length < maxWorkspaces"
        class="workspace-item add-new"
        @click="createNew"
        title="Create New Workspace"
      >
        <div class="add-icon">+</div>
      </div>
    </div>

    <!-- Context Menu -->
    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click.stop
    >
      <div class="menu-item" @click="renameWorkspace">
        Rename
      </div>
      <div class="menu-item" @click="createNewFromMenu">
        New Workspace
      </div>
      <div
        v-if="workspaces.length > 1"
        class="menu-item danger"
        @click="deleteWorkspace"
      >
        Delete
      </div>
      <div class="menu-separator"></div>
      <div class="menu-item" @click="openManager">
        Workspace Manager
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import workspaceManager from '../utils/workspace-manager';

const emit = defineEmits<{
  openManager: [];
}>();

// State
const workspaces = ref(workspaceManager.getAllWorkspaces());
const currentWorkspaceId = ref(workspaceManager.getCurrentWorkspaceId());
const maxWorkspaces = ref(workspaceManager.getConfig().maxWorkspaces);

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  workspaceId: 1
});

// Update workspaces list
const updateWorkspaces = () => {
  workspaces.value = workspaceManager.getAllWorkspaces();
  currentWorkspaceId.value = workspaceManager.getCurrentWorkspaceId();
};

// Subscribe to workspace changes
let unsubscribeChange: (() => void) | undefined;
let unsubscribeUpdate: (() => void) | undefined;

onMounted(() => {
  updateWorkspaces();

  // Subscribe to changes
  unsubscribeChange = workspaceManager.subscribe((id) => {
    currentWorkspaceId.value = id;
  });

  unsubscribeUpdate = workspaceManager.subscribeToUpdates(() => {
    updateWorkspaces();
  });

  // Close context menu on click outside
  document.addEventListener('click', closeContextMenu);
});

onUnmounted(() => {
  if (unsubscribeChange) unsubscribeChange();
  if (unsubscribeUpdate) unsubscribeUpdate();
  document.removeEventListener('click', closeContextMenu);
});

// Check if workspace has windows
const hasWindows = (id: number): boolean => {
  return workspaceManager.hasWindows(id);
};

// Switch to workspace
const switchTo = (id: number) => {
  workspaceManager.switchWorkspace(id);
};

// Create new workspace
const createNew = () => {
  try {
    const id = workspaceManager.createWorkspace();
    workspaceManager.switchWorkspace(id);
  } catch (error) {
    alert('Maximum number of workspaces reached');
  }
};

// Context menu handlers
const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault();
};

const showWorkspaceMenu = (id: number, e: MouseEvent) => {
  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    workspaceId: id
  };
};

const closeContextMenu = () => {
  contextMenu.value.visible = false;
};

const renameWorkspace = () => {
  const workspace = workspaceManager.getWorkspace(contextMenu.value.workspaceId);
  if (!workspace) return;

  const newName = prompt('Enter new name:', workspace.name);
  if (newName && newName.trim()) {
    workspaceManager.renameWorkspace(contextMenu.value.workspaceId, newName.trim());
  }
  closeContextMenu();
};

const createNewFromMenu = () => {
  createNew();
  closeContextMenu();
};

const deleteWorkspace = () => {
  const workspace = workspaceManager.getWorkspace(contextMenu.value.workspaceId);
  if (!workspace) return;

  if (confirm(`Delete workspace "${workspace.name}"?`)) {
    try {
      workspaceManager.deleteWorkspace(contextMenu.value.workspaceId);
    } catch (error) {
      alert('Cannot delete the last workspace');
    }
  }
  closeContextMenu();
};

const openManager = () => {
  emit('openManager');
  closeContextMenu();
};
</script>

<style scoped>
.workspace-switcher {
  position: relative;
  user-select: none;
}

.workspace-grid {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 2px 4px;
}

.workspace-item {
  width: 24px;
  height: 20px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.1s;
}

.workspace-item:hover {
  background: #b0b0b0;
}

.workspace-item:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.workspace-item.active {
  background: #0055aa;
  border-color: #0066cc #003388 #003388 #0066cc;
}

.workspace-item.active .workspace-number {
  color: #ffffff;
  font-weight: bold;
}

.workspace-number {
  font-size: 9px;
  color: #000000;
  font-family: 'Press Start 2P', monospace;
  font-weight: normal;
}

.workspace-item.active .workspace-number {
  color: #ffffff;
}

.window-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 4px;
  height: 4px;
  background: #00ff00;
  border-radius: 50%;
  box-shadow: 0 0 2px #00ff00;
}

.workspace-item.active .window-indicator {
  background: #ffaa00;
  box-shadow: 0 0 2px #ffaa00;
}

.workspace-item.add-new {
  background: #808080;
  border-color: #a0a0a0 #404040 #404040 #a0a0a0;
}

.workspace-item.add-new:hover {
  background: #909090;
}

.add-icon {
  font-size: 14px;
  color: #ffffff;
  font-weight: bold;
  line-height: 1;
}

/* Context Menu */
.context-menu {
  position: fixed;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);
  z-index: 10000;
  min-width: 180px;
  font-size: 10px;
  font-family: 'Press Start 2P', monospace;
}

.menu-item {
  padding: 6px 12px;
  cursor: pointer;
  color: #000000;
  background: #a0a0a0;
  border-bottom: 1px solid #808080;
  transition: all 0.1s;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background: #0055aa;
  color: #ffffff;
}

.menu-item.danger {
  color: #ff0000;
}

.menu-item.danger:hover {
  background: #ff0000;
  color: #ffffff;
}

.menu-separator {
  height: 2px;
  background: #000000;
  border-top: 1px solid #808080;
}

/* Compact view for small screens */
@media (max-width: 768px) {
  .workspace-item {
    width: 20px;
    height: 18px;
  }

  .workspace-number {
    font-size: 8px;
  }
}
</style>
