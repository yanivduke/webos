<template>
  <div class="session-manager">
    <!-- Tab Bar -->
    <div class="tab-bar">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="tab"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </div>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Sessions Tab -->
      <div v-if="activeTab === 'sessions'" class="tab-pane">
        <div class="toolbar">
          <button class="amiga-button" @click="saveCurrentSession">
            Save Current
          </button>
          <button class="amiga-button" @click="restoreLastSession">
            Restore Last
          </button>
          <button class="amiga-button" @click="exportAllSessions">
            Export All
          </button>
          <button class="amiga-button" @click="importSessions">
            Import
          </button>
          <button class="amiga-button" @click="clearAllSessions" :disabled="sessions.length === 0">
            Clear All
          </button>
        </div>

        <div class="sessions-list">
          <div v-if="sessions.length === 0" class="empty-state">
            No saved sessions. Save your current window layout to get started.
          </div>
          <div
            v-for="session in sessions"
            :key="session.id"
            class="session-item"
            :class="{ 'auto-save': session.id === '_autosave_' }"
          >
            <div class="session-preview">
              <div class="preview-thumbnail">
                <div class="window-count">{{ session.windows.length }}</div>
              </div>
            </div>
            <div class="session-info">
              <div class="session-name">{{ session.name }}</div>
              <div class="session-meta">
                <span>{{ formatDate(session.modified) }}</span>
                <span>{{ session.windows.length }} window{{ session.windows.length !== 1 ? 's' : '' }}</span>
              </div>
              <div v-if="session.description" class="session-description">
                {{ session.description }}
              </div>
            </div>
            <div class="session-actions">
              <button class="amiga-button small" @click="loadSession(session.id)">
                Load
              </button>
              <button class="amiga-button small" @click="duplicateSession(session.id)">
                Duplicate
              </button>
              <button class="amiga-button small" @click="exportSession(session.id)">
                Export
              </button>
              <button
                v-if="session.id !== '_autosave_'"
                class="amiga-button small"
                @click="renameSession(session.id)"
              >
                Rename
              </button>
              <button
                v-if="session.id !== '_autosave_'"
                class="amiga-button small danger"
                @click="deleteSession(session.id)"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Workspaces Tab -->
      <div v-if="activeTab === 'workspaces'" class="tab-pane">
        <div class="toolbar">
          <button class="amiga-button" @click="createNewWorkspace">
            Create Workspace
          </button>
          <button class="amiga-button" @click="exportWorkspace" :disabled="workspaces.length === 0">
            Export
          </button>
          <button class="amiga-button" @click="importWorkspace">
            Import
          </button>
        </div>

        <div class="workspaces-grid">
          <div
            v-for="workspace in workspaces"
            :key="workspace.id"
            class="workspace-card"
            :class="{ active: workspace.id === currentWorkspaceId }"
            :style="{ borderColor: workspace.color }"
            @click="switchToWorkspace(workspace.id)"
          >
            <div class="workspace-icon" :style="{ color: workspace.color }">
              {{ workspace.icon }}
            </div>
            <div class="workspace-name">{{ workspace.name }}</div>
            <div class="workspace-meta">
              {{ workspace.windows.length }} window{{ workspace.windows.length !== 1 ? 's' : '' }}
            </div>
            <div class="workspace-actions">
              <button class="amiga-button tiny" @click.stop="editWorkspace(workspace.id)">
                Edit
              </button>
              <button
                class="amiga-button tiny danger"
                @click.stop="deleteWorkspace(workspace.id)"
                :disabled="workspaces.length <= 1"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- History Tab -->
      <div v-if="activeTab === 'history'" class="tab-pane">
        <div class="toolbar">
          <button class="amiga-button" @click="undoLastClose" :disabled="recentHistory.length === 0">
            Undo Last Close
          </button>
          <button class="amiga-button" @click="clearReopened">
            Clear Reopened
          </button>
          <button class="amiga-button" @click="clearAllHistory" :disabled="history.length === 0">
            Clear All
          </button>
        </div>

        <div class="history-list">
          <div v-if="history.length === 0" class="empty-state">
            No recently closed windows.
          </div>
          <div
            v-for="item in history"
            :key="item.id"
            class="history-item"
            :class="{ reopened: item.reopened }"
          >
            <div class="history-icon">
              {{ getWindowIcon(item.window.type) }}
            </div>
            <div class="history-info">
              <div class="history-title">{{ item.window.title }}</div>
              <div class="history-meta">
                <span>{{ formatTimeAgo(item.closedAt) }}</span>
                <span>{{ item.window.type }}</span>
                <span v-if="item.reopened" class="reopened-badge">Reopened</span>
              </div>
            </div>
            <div class="history-actions">
              <button
                class="amiga-button small"
                @click="reopenWindow(item.id)"
                :disabled="item.reopened"
              >
                Reopen
              </button>
              <button class="amiga-button small danger" @click="removeFromHistory(item.id)">
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Settings Tab -->
      <div v-if="activeTab === 'settings'" class="tab-pane">
        <div class="settings-section">
          <h3>Auto-Save Settings</h3>
          <div class="setting-item">
            <label>Auto-save interval (seconds):</label>
            <input
              type="number"
              v-model.number="settings.autoSaveInterval"
              min="10"
              max="300"
              class="amiga-input"
            />
          </div>
          <div class="setting-item">
            <label>
              <input type="checkbox" v-model="settings.autoSaveEnabled" />
              Enable auto-save
            </label>
          </div>
        </div>

        <div class="settings-section">
          <h3>History Settings</h3>
          <div class="setting-item">
            <label>Maximum history items:</label>
            <input
              type="number"
              v-model.number="settings.maxHistory"
              min="5"
              max="50"
              class="amiga-input"
            />
          </div>
          <div class="setting-item">
            <label>Auto-cleanup days:</label>
            <input
              type="number"
              v-model.number="settings.cleanupDays"
              min="1"
              max="30"
              class="amiga-input"
            />
          </div>
        </div>

        <div class="settings-section">
          <h3>Workspace Settings</h3>
          <div class="setting-item">
            <label>
              <input type="checkbox" v-model="settings.enableKeyboardShortcuts" />
              Enable keyboard shortcuts (Ctrl/Cmd + 1-9)
            </label>
          </div>
          <div class="setting-item">
            <label>
              <input type="checkbox" v-model="settings.saveWorkspaceOnSwitch" />
              Auto-save workspace state on switch
            </label>
          </div>
        </div>

        <div class="settings-section">
          <h3>Statistics</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ statistics.totalSessions }}</div>
              <div class="stat-label">Saved Sessions</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ statistics.totalWorkspaces }}</div>
              <div class="stat-label">Workspaces</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ statistics.totalHistory }}</div>
              <div class="stat-label">History Items</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ statistics.totalWindows }}</div>
              <div class="stat-label">Total Windows</div>
            </div>
          </div>
        </div>

        <div class="settings-actions">
          <button class="amiga-button" @click="saveSettings">
            Save Settings
          </button>
          <button class="amiga-button" @click="resetSettings">
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>

    <!-- Workspace Editor Modal -->
    <AmigaWorkspaceEditor
      v-if="showWorkspaceEditor"
      :workspace="editingWorkspace"
      @save="onWorkspaceSaved"
      @close="showWorkspaceEditor = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { getSessionManager, type SessionProfile } from '../../utils/session-manager';
import { getWorkspaceSwitcher, type WorkspaceProfile } from '../../utils/workspace-switcher';
import { getWindowHistory, type WindowHistoryItem } from '../../utils/window-history';
import AmigaWorkspaceEditor from '../dialogs/AmigaWorkspaceEditor.vue';

const emit = defineEmits<{
  (e: 'loadSession', sessionId: string): void;
  (e: 'reopenWindow', historyId: string): void;
  (e: 'switchWorkspace', workspaceId: string): void;
}>();

const props = defineProps<{
  currentWindows?: any[];
}>();

const sessionManager = getSessionManager();
const workspaceSwitcher = getWorkspaceSwitcher();
const windowHistory = getWindowHistory();

const activeTab = ref('sessions');
const tabs = [
  { id: 'sessions', label: 'Sessions' },
  { id: 'workspaces', label: 'Workspaces' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' }
];

// Sessions
const sessions = ref<SessionProfile[]>([]);
const workspaces = ref<WorkspaceProfile[]>([]);
const history = ref<WindowHistoryItem[]>([]);
const currentWorkspaceId = ref<string | null>(null);

// Workspace Editor
const showWorkspaceEditor = ref(false);
const editingWorkspace = ref<WorkspaceProfile | null>(null);

// Settings
const settings = ref({
  autoSaveInterval: 30,
  autoSaveEnabled: true,
  maxHistory: 20,
  cleanupDays: 7,
  enableKeyboardShortcuts: true,
  saveWorkspaceOnSwitch: true
});

// Computed
const recentHistory = computed(() => history.value.filter(item => !item.reopened));

const statistics = computed(() => ({
  totalSessions: sessions.value.filter(s => s.id !== '_autosave_').length,
  totalWorkspaces: workspaces.value.length,
  totalHistory: history.value.length,
  totalWindows: sessions.value.reduce((sum, s) => sum + s.windows.length, 0)
}));

// Methods
function loadData() {
  sessions.value = sessionManager.getAllSessions();
  workspaces.value = workspaceSwitcher.getAllWorkspaces();
  history.value = windowHistory.getHistory();
  currentWorkspaceId.value = workspaceSwitcher.getCurrentWorkspace()?.id || null;
}

function saveCurrentSession() {
  const name = prompt('Enter session name:');
  if (!name) return;

  const description = prompt('Enter description (optional):');
  const windows = props.currentWindows || [];

  sessionManager.saveSession(name, windows, description || undefined);
  loadData();
}

function loadSession(sessionId: string) {
  emit('loadSession', sessionId);
}

function deleteSession(sessionId: string) {
  if (confirm('Delete this session?')) {
    sessionManager.deleteSession(sessionId);
    loadData();
  }
}

function duplicateSession(sessionId: string) {
  const name = prompt('Enter new session name:');
  if (!name) return;

  sessionManager.duplicateSession(sessionId, name);
  loadData();
}

function renameSession(sessionId: string) {
  const session = sessionManager.getSession(sessionId);
  if (!session) return;

  const newName = prompt('Enter new name:', session.name);
  if (!newName) return;

  sessionManager.renameSession(sessionId, newName);
  loadData();
}

function exportSession(sessionId: string) {
  const json = sessionManager.exportSession(sessionId);
  if (!json) return;

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `session-${sessionId}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportAllSessions() {
  const json = sessionManager.exportAllSessions();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'webos-sessions.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importSessions() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event: any) => {
      const json = event.target.result;
      const count = sessionManager.importMultipleSessions(json);
      alert(`Imported ${count} session(s)`);
      loadData();
    };
    reader.readAsText(file);
  };
  input.click();
}

function clearAllSessions() {
  if (confirm('Delete all sessions? This cannot be undone.')) {
    sessionManager.clearAllSessions();
    loadData();
  }
}

function restoreLastSession() {
  const autoSave = sessionManager.getAutoSavedSession();
  if (autoSave) {
    emit('loadSession', '_autosave_');
  } else {
    alert('No auto-saved session found');
  }
}

// Workspaces
function createNewWorkspace() {
  editingWorkspace.value = null;
  showWorkspaceEditor.value = true;
}

function editWorkspace(workspaceId: string) {
  const workspace = workspaceSwitcher.getWorkspace(workspaceId);
  if (!workspace) return;

  editingWorkspace.value = workspace;
  showWorkspaceEditor.value = true;
}

function deleteWorkspace(workspaceId: string) {
  if (workspaces.value.length <= 1) {
    alert('Cannot delete the last workspace');
    return;
  }

  if (confirm('Delete this workspace?')) {
    workspaceSwitcher.deleteWorkspace(workspaceId);
    loadData();
  }
}

function switchToWorkspace(workspaceId: string) {
  emit('switchWorkspace', workspaceId);
  currentWorkspaceId.value = workspaceId;
}

function exportWorkspace() {
  const workspace = workspaceSwitcher.getCurrentWorkspace();
  if (!workspace) return;

  const json = workspaceSwitcher.exportWorkspace(workspace.id);
  if (!json) return;

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `workspace-${workspace.name}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importWorkspace() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event: any) => {
      const json = event.target.result;
      const workspace = workspaceSwitcher.importWorkspace(json);
      if (workspace) {
        alert('Workspace imported successfully');
        loadData();
      } else {
        alert('Failed to import workspace');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function onWorkspaceSaved(workspaceData: any) {
  if (editingWorkspace.value) {
    // Update existing
    workspaceSwitcher.updateWorkspace(editingWorkspace.value.id, workspaceData);
  } else {
    // Create new
    workspaceSwitcher.createWorkspace(
      workspaceData.name,
      workspaceData.icon,
      workspaceData.color,
      workspaceData.settings,
      workspaceData.autoSwitch
    );
  }

  showWorkspaceEditor.value = false;
  editingWorkspace.value = null;
  loadData();
}

// History
function undoLastClose() {
  const window = windowHistory.undoLastClose();
  if (window) {
    const lastItem = recentHistory.value[0];
    if (lastItem) {
      emit('reopenWindow', lastItem.id);
    }
  }
  loadData();
}

function reopenWindow(historyId: string) {
  emit('reopenWindow', historyId);
  loadData();
}

function removeFromHistory(historyId: string) {
  windowHistory.removeFromHistory(historyId);
  loadData();
}

function clearReopened() {
  windowHistory.clearReopened();
  loadData();
}

function clearAllHistory() {
  if (confirm('Clear all history? This cannot be undone.')) {
    windowHistory.clearHistory();
    loadData();
  }
}

// Settings
function saveSettings() {
  localStorage.setItem('webos_session_settings', JSON.stringify(settings.value));
  alert('Settings saved');
}

function resetSettings() {
  settings.value = {
    autoSaveInterval: 30,
    autoSaveEnabled: true,
    maxHistory: 20,
    cleanupDays: 7,
    enableKeyboardShortcuts: true,
    saveWorkspaceOnSwitch: true
  };
}

function loadSettings() {
  const stored = localStorage.getItem('webos_session_settings');
  if (stored) {
    try {
      settings.value = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }
}

// Utilities
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function getWindowIcon(type: string): string {
  const icons: Record<string, string> = {
    folder: '📁',
    shell: '💻',
    calculator: '🔢',
    notepad: '📝',
    clock: '⏰',
    preferences: '⚙️',
    default: '🪟'
  };
  return icons[type] || icons.default;
}

onMounted(() => {
  loadData();
  loadSettings();
});

onUnmounted(() => {
  // Cleanup if needed
});
</script>

<style scoped>
.session-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
}

.tab-bar {
  display: flex;
  background: #888888;
  border-bottom: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.tab {
  padding: 8px 16px;
  font-size: 8px;
  cursor: pointer;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  margin: 2px;
  user-select: none;
}

.tab:hover {
  background: #b0b0b0;
}

.tab.active {
  background: #0055aa;
  color: #ffffff;
  border-color: #000000 #ffffff #ffffff #000000;
}

.tab-content {
  flex: 1;
  overflow: hidden;
  padding: 8px;
}

.tab-pane {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
  padding: 4px;
  background: #888888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 12px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  user-select: none;
}

.amiga-button:hover:not(:disabled) {
  background: #b0b0b0;
}

.amiga-button:active:not(:disabled) {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.amiga-button.small {
  padding: 2px 8px;
  font-size: 7px;
}

.amiga-button.tiny {
  padding: 2px 4px;
  font-size: 6px;
}

.amiga-button.danger:hover:not(:disabled) {
  background: #aa5555;
  color: #ffffff;
}

.sessions-list,
.history-list {
  flex: 1;
  overflow-y: auto;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px;
}

.session-item,
.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  margin-bottom: 4px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.session-item.auto-save {
  background: #0055aa;
  color: #ffffff;
}

.session-preview {
  flex-shrink: 0;
}

.preview-thumbnail {
  width: 60px;
  height: 40px;
  background: #888888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.window-count {
  font-size: 12px;
  font-weight: bold;
}

.session-info,
.history-info {
  flex: 1;
}

.session-name,
.history-title {
  font-size: 9px;
  margin-bottom: 4px;
}

.session-meta,
.history-meta {
  font-size: 6px;
  color: #555555;
  display: flex;
  gap: 8px;
}

.session-description {
  font-size: 7px;
  margin-top: 4px;
  font-style: italic;
}

.session-actions,
.history-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.workspaces-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
  padding: 8px;
  overflow-y: auto;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.workspace-card {
  padding: 16px;
  background: #a0a0a0;
  border: 3px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  text-align: center;
  transition: all 0.1s;
}

.workspace-card:hover {
  background: #b0b0b0;
}

.workspace-card.active {
  background: #0055aa;
  color: #ffffff;
  border-color: #ffaa00;
}

.workspace-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.workspace-name {
  font-size: 9px;
  margin-bottom: 4px;
}

.workspace-meta {
  font-size: 6px;
  color: #555555;
  margin-bottom: 8px;
}

.workspace-card.active .workspace-meta {
  color: #ffffff;
}

.workspace-actions {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.history-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.history-item.reopened {
  opacity: 0.6;
}

.reopened-badge {
  background: #0055aa;
  color: #ffffff;
  padding: 2px 4px;
  border-radius: 2px;
}

.empty-state {
  padding: 32px;
  text-align: center;
  font-size: 8px;
  color: #555555;
}

.settings-section {
  margin-bottom: 16px;
  padding: 8px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.settings-section h3 {
  font-size: 9px;
  margin-bottom: 8px;
  color: #0055aa;
}

.setting-item {
  margin-bottom: 8px;
  font-size: 7px;
}

.setting-item label {
  display: flex;
  align-items: center;
  gap: 4px;
}

.amiga-input {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  width: 100px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.stat-item {
  text-align: center;
  padding: 8px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.stat-value {
  font-size: 16px;
  color: #0055aa;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 6px;
  color: #555555;
}

.settings-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
</style>
