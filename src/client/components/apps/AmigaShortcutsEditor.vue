<template>
  <div class="amiga-shortcuts-editor">
    <!-- Header -->
    <div class="editor-header">
      <h2>Keyboard Shortcuts</h2>
      <div class="header-controls">
        <button class="amiga-button small" @click="resetToDefaults">
          Reset
        </button>
        <button class="amiga-button small" @click="exportProfile">
          Export
        </button>
        <button class="amiga-button small" @click="showImportDialog = true">
          Import
        </button>
      </div>
    </div>

    <!-- Search Filter -->
    <div class="search-container">
      <div class="search-input-wrapper">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search shortcuts..."
          class="amiga-input"
        />
      </div>
    </div>

    <!-- Category Tabs -->
    <div class="category-tabs">
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="tab-button"
        :class="{ active: activeCategory === cat.id }"
        @click="activeCategory = cat.id"
      >
        {{ cat.label }}
      </button>
    </div>

    <!-- Shortcuts List -->
    <div class="shortcuts-list">
      <div
        v-for="shortcut in filteredShortcuts"
        :key="shortcut.id"
        class="shortcut-item"
      >
        <div class="shortcut-info">
          <div class="shortcut-description">{{ shortcut.description }}</div>
          <div class="shortcut-category-tag">{{ getCategoryLabel(shortcut.category) }}</div>
        </div>
        <div class="shortcut-binding">
          <div class="key-display">
            {{ formatShortcut(shortcut) }}
          </div>
          <button
            class="amiga-button tiny"
            @click="editShortcut(shortcut)"
          >
            Edit
          </button>
          <button
            class="amiga-button tiny"
            :class="{ disabled: !shortcut.enabled }"
            @click="toggleShortcut(shortcut)"
          >
            {{ shortcut.enabled ? 'On' : 'Off' }}
          </button>
        </div>
      </div>

      <div v-if="filteredShortcuts.length === 0" class="no-results">
        No shortcuts found
      </div>
    </div>

    <!-- Edit Dialog -->
    <div v-if="editingShortcut" class="modal-overlay" @click.self="cancelEdit">
      <div class="edit-dialog">
        <div class="dialog-title">
          Edit Shortcut: {{ editingShortcut.description }}
        </div>

        <div class="dialog-content">
          <div class="key-capture-box">
            <div v-if="!capturingKey" class="capture-prompt">
              Click "Capture Key" and press your desired key combination
            </div>
            <div v-else class="capturing-indicator">
              Press key combination...
            </div>
            <div v-if="capturedKey" class="captured-key">
              {{ formatCapturedKey() }}
            </div>
          </div>

          <div class="capture-controls">
            <button
              class="amiga-button"
              @click="startCapture"
              :disabled="capturingKey"
            >
              {{ capturingKey ? 'Listening...' : 'Capture Key' }}
            </button>
            <button
              class="amiga-button"
              @click="clearCapture"
              :disabled="!capturedKey"
            >
              Clear
            </button>
          </div>

          <div v-if="conflictWarning" class="conflict-warning">
            Warning: This combination is already used by "{{ conflictWarning }}"
          </div>
        </div>

        <div class="dialog-actions">
          <button class="amiga-button" @click="saveEdit" :disabled="!capturedKey || !!conflictWarning">
            Save
          </button>
          <button class="amiga-button" @click="cancelEdit">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Import Dialog -->
    <div v-if="showImportDialog" class="modal-overlay" @click.self="showImportDialog = false">
      <div class="import-dialog">
        <div class="dialog-title">Import Shortcuts Profile</div>

        <div class="dialog-content">
          <textarea
            v-model="importJson"
            class="import-textarea"
            placeholder="Paste JSON profile here..."
          ></textarea>
        </div>

        <div class="dialog-actions">
          <button class="amiga-button" @click="importProfileFromJson">
            Import
          </button>
          <button class="amiga-button" @click="showImportDialog = false">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { keyboardManager, type ShortcutDefinition, type ShortcutModifiers } from '../../utils/keyboard-manager';

const searchQuery = ref('');
const activeCategory = ref('all');
const editingShortcut = ref<ShortcutDefinition | null>(null);
const capturingKey = ref(false);
const capturedKey = ref<{ key: string; modifiers: ShortcutModifiers } | null>(null);
const conflictWarning = ref('');
const showImportDialog = ref(false);
const importJson = ref('');

const categories = [
  { id: 'all', label: 'All' },
  { id: 'file', label: 'File' },
  { id: 'edit', label: 'Edit' },
  { id: 'view', label: 'View' },
  { id: 'window', label: 'Window' },
  { id: 'tools', label: 'Tools' },
  { id: 'help', label: 'Help' }
];

const shortcuts = ref<ShortcutDefinition[]>([]);

onMounted(() => {
  loadShortcuts();
});

const loadShortcuts = () => {
  shortcuts.value = keyboardManager.getAllShortcuts();
};

const filteredShortcuts = computed(() => {
  let result = shortcuts.value;

  // Filter by category
  if (activeCategory.value !== 'all') {
    result = result.filter(s => s.category === activeCategory.value);
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(s =>
      s.description.toLowerCase().includes(query) ||
      s.id.toLowerCase().includes(query) ||
      formatShortcut(s).toLowerCase().includes(query)
    );
  }

  return result;
});

const getCategoryLabel = (categoryId: string): string => {
  const cat = categories.find(c => c.id === categoryId);
  return cat ? cat.label : categoryId;
};

const formatShortcut = (shortcut: ShortcutDefinition): string => {
  return keyboardManager.formatShortcut(shortcut);
};

const formatCapturedKey = (): string => {
  if (!capturedKey.value) return '';

  const parts: string[] = [];
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  if (capturedKey.value.modifiers.ctrl) parts.push(isMac ? '⌃' : 'Ctrl');
  if (capturedKey.value.modifiers.alt) parts.push(isMac ? '⌥' : 'Alt');
  if (capturedKey.value.modifiers.shift) parts.push(isMac ? '⇧' : 'Shift');
  if (capturedKey.value.modifiers.meta) parts.push(isMac ? '⌘' : 'Win');

  parts.push(capturedKey.value.key.toUpperCase());

  return parts.join(isMac ? '' : '+');
};

const editShortcut = (shortcut: ShortcutDefinition) => {
  editingShortcut.value = shortcut;
  capturedKey.value = null;
  conflictWarning.value = '';
};

const startCapture = () => {
  capturingKey.value = true;
  conflictWarning.value = '';
  document.addEventListener('keydown', handleKeyCapture);
};

const handleKeyCapture = (e: KeyboardEvent) => {
  e.preventDefault();
  e.stopPropagation();

  // Ignore modifier-only keys
  if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
    return;
  }

  const key = e.key;
  const modifiers: ShortcutModifiers = {
    ctrl: e.ctrlKey,
    alt: e.altKey,
    shift: e.shiftKey,
    meta: e.metaKey
  };

  capturedKey.value = { key, modifiers };
  capturingKey.value = false;
  document.removeEventListener('keydown', handleKeyCapture);

  // Check for conflicts
  if (editingShortcut.value) {
    const conflictId = keyboardManager.checkConflict(key, modifiers, editingShortcut.value.id);
    if (conflictId) {
      const conflictShortcut = keyboardManager.getShortcut(conflictId);
      conflictWarning.value = conflictShortcut?.description || conflictId;
    }
  }
};

const clearCapture = () => {
  capturedKey.value = null;
  conflictWarning.value = '';
};

const saveEdit = () => {
  if (!editingShortcut.value || !capturedKey.value || conflictWarning.value) {
    return;
  }

  const success = keyboardManager.updateShortcut(
    editingShortcut.value.id,
    capturedKey.value.key,
    capturedKey.value.modifiers
  );

  if (success) {
    loadShortcuts();
    cancelEdit();
  }
};

const cancelEdit = () => {
  if (capturingKey.value) {
    document.removeEventListener('keydown', handleKeyCapture);
  }
  editingShortcut.value = null;
  capturedKey.value = null;
  conflictWarning.value = '';
  capturingKey.value = false;
};

const toggleShortcut = (shortcut: ShortcutDefinition) => {
  keyboardManager.toggleShortcut(shortcut.id, !shortcut.enabled);
  loadShortcuts();
};

const resetToDefaults = () => {
  if (confirm('Reset all shortcuts to default values?')) {
    keyboardManager.resetToDefaults();
    loadShortcuts();
  }
};

const exportProfile = () => {
  const profile = keyboardManager.exportProfile('My Shortcuts');
  const json = JSON.stringify(profile, null, 2);

  // Create download
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'webos-shortcuts.json';
  a.click();
  URL.revokeObjectURL(url);
};

const importProfileFromJson = () => {
  try {
    const profile = JSON.parse(importJson.value);
    const success = keyboardManager.importProfile(profile);

    if (success) {
      loadShortcuts();
      showImportDialog.value = false;
      importJson.value = '';
      alert('Profile imported successfully!');
    } else {
      alert('Failed to import profile. Please check the format.');
    }
  } catch (error) {
    alert('Invalid JSON format');
  }
};

onUnmounted(() => {
  if (capturingKey.value) {
    document.removeEventListener('keydown', handleKeyCapture);
  }
});
</script>

<style scoped>
.amiga-shortcuts-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
  overflow: hidden;
}

.editor-header {
  background: #0055aa;
  color: #ffffff;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #000000;
}

.editor-header h2 {
  font-size: 12px;
  margin: 0;
}

.header-controls {
  display: flex;
  gap: 6px;
}

.search-container {
  padding: 12px;
  background: #a0a0a0;
  border-bottom: 2px solid #888888;
}

.search-input-wrapper {
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  background: #ffffff;
}

.amiga-input {
  width: 100%;
  background: #ffffff;
  border: none;
  padding: 8px;
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  color: #000000;
  outline: none;
}

.category-tabs {
  display: flex;
  background: #a0a0a0;
  border-bottom: 2px solid #000000;
  overflow-x: auto;
}

.tab-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  border-bottom: none;
  padding: 8px 16px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  color: #000000;
  white-space: nowrap;
}

.tab-button:hover {
  background: #b0b0b0;
}

.tab-button.active {
  background: #0055aa;
  color: #ffffff;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.shortcuts-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  gap: 8px;
  display: flex;
  flex-direction: column;
}

.shortcut-item {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.shortcut-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.shortcut-description {
  font-size: 9px;
  color: #000000;
  font-weight: bold;
}

.shortcut-category-tag {
  font-size: 7px;
  color: #0055aa;
}

.shortcut-binding {
  display: flex;
  align-items: center;
  gap: 6px;
}

.key-display {
  background: #000000;
  color: #00ff00;
  padding: 6px 12px;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  font-size: 8px;
  min-width: 100px;
  text-align: center;
  font-weight: bold;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 16px;
  font-size: 9px;
  cursor: pointer;
  color: #000000;
  font-family: 'Press Start 2P', monospace;
  transition: all 0.05s;
}

.amiga-button:hover:not(:disabled) {
  background: #b0b0b0;
}

.amiga-button:active:not(:disabled) {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button.small {
  padding: 4px 12px;
  font-size: 8px;
}

.amiga-button.tiny {
  padding: 4px 8px;
  font-size: 7px;
}

.amiga-button.disabled {
  opacity: 0.5;
}

.amiga-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.no-results {
  text-align: center;
  padding: 32px;
  font-size: 10px;
  color: #666666;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.edit-dialog,
.import-dialog {
  background: #a0a0a0;
  border: 4px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  width: 90%;
  max-width: 500px;
  box-shadow: 8px 8px 0px rgba(0, 0, 0, 0.5);
}

.dialog-title {
  background: #0055aa;
  color: #ffffff;
  padding: 12px;
  font-size: 10px;
  border-bottom: 2px solid #000000;
}

.dialog-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.key-capture-box {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 16px;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.capture-prompt,
.capturing-indicator {
  font-size: 8px;
  color: #666666;
  text-align: center;
}

.capturing-indicator {
  color: #0055aa;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.captured-key {
  font-size: 16px;
  font-weight: bold;
  color: #000000;
  background: #ffff00;
  padding: 8px 16px;
  border: 2px solid #000000;
}

.capture-controls {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.conflict-warning {
  background: #ff6600;
  color: #ffffff;
  padding: 8px;
  font-size: 7px;
  border: 2px solid #000000;
  text-align: center;
}

.dialog-actions {
  padding: 12px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  border-top: 2px solid #888888;
}

.import-textarea {
  width: 100%;
  height: 200px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 8px;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: #000000;
  resize: vertical;
}
</style>
