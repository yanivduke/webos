<template>
  <div class="amiga-notepad">
    <!-- Menu Bar -->
    <div class="notepad-menu">
      <div class="menu-item" @click="newFile">File</div>
      <div class="menu-item" @click="toggleEditMenu">Edit</div>
      <div class="file-info">{{ fileName }} {{ isDirty ? '*' : '' }} - {{ fileSize }}</div>
    </div>

    <!-- Edit Menu Dropdown (if visible) -->
    <div v-if="showEditMenu" class="edit-menu-dropdown">
      <div class="dropdown-item" @click="selectAll">Select All</div>
      <div class="dropdown-item" @click="clearContent">Clear</div>
    </div>

    <!-- Toolbar -->
    <div class="notepad-toolbar">
      <button class="amiga-button" @click="newFile" title="New File">New</button>
      <button class="amiga-button" @click="saveFile" title="Save File" :disabled="!isDirty">Save</button>
      <button class="amiga-button" @click="saveAsFile" title="Save As">Save As</button>
      <button class="amiga-button" @click="openExportDialog" title="Export File">Export</button>
      <button class="amiga-button" @click="showFileInfo" title="File Info">Info</button>
    </div>

    <!-- Text Editor Area -->
    <div class="editor-container">
      <textarea
        v-model="content"
        class="editor-textarea"
        @input="handleInput"
        spellcheck="false"
        placeholder="Enter text here..."
      ></textarea>
    </div>

    <!-- Status Bar -->
    <div class="notepad-status">
      <span>Lines: {{ lineCount }}</span>
      <span>Chars: {{ charCount }}</span>
      <span>{{ statusMessage }}</span>
    </div>

    <!-- Save As Dialog -->
    <div v-if="showSaveAsDialog" class="dialog-overlay" @click="closeSaveAsDialog">
      <div class="amiga-dialog" @click.stop>
        <div class="dialog-title">Save File As</div>
        <div class="dialog-content">
          <label>Filename:</label>
          <input
            v-model="saveAsName"
            type="text"
            class="amiga-input"
            @keyup.enter="confirmSaveAs"
            placeholder="filename.txt"
          />
          <label>Path:</label>
          <input
            v-model="saveAsPath"
            type="text"
            class="amiga-input"
            @keyup.enter="confirmSaveAs"
            placeholder="dh0"
          />
        </div>
        <div class="dialog-buttons">
          <button class="amiga-button" @click="confirmSaveAs">Save</button>
          <button class="amiga-button" @click="closeSaveAsDialog">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Info Dialog -->
    <div v-if="showInfoDialog" class="dialog-overlay" @click="closeInfoDialog">
      <div class="amiga-dialog" @click.stop>
        <div class="dialog-title">File Information</div>
        <div class="dialog-content info-content">
          <div><strong>File:</strong> {{ fileName }}</div>
          <div><strong>Path:</strong> {{ filePath }}</div>
          <div><strong>Size:</strong> {{ fileSize }}</div>
          <div><strong>Lines:</strong> {{ lineCount }}</div>
          <div><strong>Characters:</strong> {{ charCount }}</div>
          <div v-if="fileModified"><strong>Modified:</strong> {{ fileModified }}</div>
        </div>
        <div class="dialog-buttons">
          <button class="amiga-button" @click="closeInfoDialog">OK</button>
        </div>
      </div>
    </div>

    <!-- Export Dialog -->
    <AmigaExportDialog
      :visible="showExportDialog"
      :fileName="fileName"
      :content="content"
      @close="closeExportDialog"
      @exported="handleExported"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import AmigaExportDialog from '../AmigaExportDialog.vue';

interface Props {
  data?: {
    filePath?: string;
    fileName?: string;
    content?: string;
  };
}

const props = defineProps<Props>();

const content = ref('');
const originalContent = ref('');
const fileName = ref('Untitled.txt');
const filePath = ref('dh0');
const fileSize = ref('0');
const fileModified = ref('');
const isDirty = ref(false);
const statusMessage = ref('Ready');
const showEditMenu = ref(false);
const showSaveAsDialog = ref(false);
const showInfoDialog = ref(false);
const showExportDialog = ref(false);
const saveAsName = ref('');
const saveAsPath = ref('dh0');

const lineCount = computed(() => {
  if (!content.value) return 0;
  return content.value.split('\n').length;
});

const charCount = computed(() => {
  return content.value.length;
});

onMounted(async () => {
  if (props.data?.filePath) {
    await loadFile(props.data.filePath);
  } else if (props.data?.fileName) {
    fileName.value = props.data.fileName;
  }
  if (props.data?.content) {
    content.value = props.data.content;
    originalContent.value = props.data.content;
  }
});

const handleInput = () => {
  isDirty.value = content.value !== originalContent.value;
  statusMessage.value = 'Modified';
};

const newFile = () => {
  if (isDirty.value) {
    if (!confirm('You have unsaved changes. Create new file anyway?')) {
      return;
    }
  }
  content.value = '';
  originalContent.value = '';
  fileName.value = 'Untitled.txt';
  filePath.value = 'dh0';
  isDirty.value = false;
  statusMessage.value = 'New file created';
};

const loadFile = async (path: string) => {
  try {
    const response = await fetch('/api/files/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    });

    if (!response.ok) {
      throw new Error('Failed to load file');
    }

    const data = await response.json();
    content.value = data.content || '';
    originalContent.value = data.content || '';
    fileName.value = data.name || 'Untitled.txt';
    filePath.value = path;
    fileSize.value = data.size || '0';
    fileModified.value = data.modified ? new Date(data.modified).toLocaleString() : '';
    isDirty.value = false;
    statusMessage.value = 'File loaded';
  } catch (error) {
    console.error('Error loading file:', error);
    statusMessage.value = 'Error loading file';
  }
};

const saveFile = async () => {
  if (!isDirty.value) {
    statusMessage.value = 'No changes to save';
    return;
  }

  try {
    const savePath = filePath.value.includes('/') ? filePath.value : `${filePath.value}/${fileName.value}`;

    const response = await fetch('/api/files/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: savePath,
        content: content.value
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save file');
    }

    const data = await response.json();
    originalContent.value = content.value;
    isDirty.value = false;
    fileSize.value = data.size || '0';
    fileModified.value = data.modified ? new Date(data.modified).toLocaleString() : '';
    statusMessage.value = 'File saved';
  } catch (error) {
    console.error('Error saving file:', error);
    statusMessage.value = 'Error saving file';
  }
};

const saveAsFile = () => {
  saveAsName.value = fileName.value;
  saveAsPath.value = filePath.value;
  showSaveAsDialog.value = true;
};

const confirmSaveAs = async () => {
  if (!saveAsName.value) {
    alert('Please enter a filename');
    return;
  }

  try {
    const savePath = `${saveAsPath.value}/${saveAsName.value}`;

    const response = await fetch('/api/files/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: savePath,
        content: content.value
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save file');
    }

    const data = await response.json();
    fileName.value = saveAsName.value;
    filePath.value = savePath;
    originalContent.value = content.value;
    isDirty.value = false;
    fileSize.value = data.size || '0';
    fileModified.value = data.modified ? new Date(data.modified).toLocaleString() : '';
    statusMessage.value = 'File saved as ' + saveAsName.value;
    showSaveAsDialog.value = false;
  } catch (error) {
    console.error('Error saving file:', error);
    statusMessage.value = 'Error saving file';
  }
};

const closeSaveAsDialog = () => {
  showSaveAsDialog.value = false;
};

const toggleEditMenu = () => {
  showEditMenu.value = !showEditMenu.value;
};

const selectAll = () => {
  const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement;
  if (textarea) {
    textarea.select();
  }
  showEditMenu.value = false;
};

const clearContent = () => {
  if (confirm('Clear all content?')) {
    content.value = '';
    isDirty.value = true;
  }
  showEditMenu.value = false;
};

const showFileInfo = () => {
  showInfoDialog.value = true;
};

const closeInfoDialog = () => {
  showInfoDialog.value = false;
};

const openExportDialog = () => {
  showExportDialog.value = true;
};

const closeExportDialog = () => {
  showExportDialog.value = false;
};

const handleExported = (format: string) => {
  statusMessage.value = `File exported to ${format.toUpperCase()}`;
};
</script>

<style scoped>
.amiga-notepad {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
}

/* Menu Bar */
.notepad-menu {
  display: flex;
  background: #ffffff;
  border-bottom: 2px solid #000000;
  padding: 4px 8px;
  font-size: 10px;
  gap: 16px;
  align-items: center;
}

.menu-item {
  cursor: pointer;
  padding: 2px 8px;
  color: #000000;
  transition: all 0.1s;
  user-select: none;
}

.menu-item:hover {
  background: #0055aa;
  color: #ffffff;
}

.file-info {
  margin-left: auto;
  color: #0055aa;
  font-size: 9px;
}

.edit-menu-dropdown {
  position: absolute;
  top: 30px;
  left: 60px;
  background: #ffffff;
  border: 2px solid #000000;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.dropdown-item {
  padding: 6px 12px;
  font-size: 9px;
  cursor: pointer;
  user-select: none;
  color: #000000;
}

.dropdown-item:hover {
  background: #0055aa;
  color: #ffffff;
}

/* Toolbar */
.notepad-toolbar {
  display: flex;
  gap: 4px;
  padding: 6px;
  background: #a0a0a0;
  border-bottom: 2px solid #000000;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 12px;
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

.amiga-button:disabled {
  color: #666666;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Editor Container */
.editor-container {
  flex: 1;
  padding: 8px;
  background: #ffffff;
  overflow: hidden;
}

.editor-textarea {
  width: 100%;
  height: 100%;
  background: #ffffff;
  color: #000000;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 8px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  resize: none;
  outline: none;
}

.editor-textarea::placeholder {
  color: #999999;
}

/* Status Bar */
.notepad-status {
  display: flex;
  gap: 16px;
  background: #ffffff;
  border-top: 2px solid #000000;
  padding: 4px 12px;
  font-size: 8px;
  color: #000000;
}

/* Dialogs */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.amiga-dialog {
  background: #a0a0a0;
  border: 4px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  min-width: 350px;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);
}

.dialog-title {
  background: #0055aa;
  color: #ffffff;
  padding: 6px 12px;
  font-size: 10px;
  border-bottom: 2px solid #000000;
}

.dialog-content {
  padding: 16px;
  font-size: 9px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-content {
  line-height: 1.8;
}

.info-content div {
  display: flex;
  gap: 8px;
}

.amiga-input {
  width: 100%;
  padding: 6px;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  background: #ffffff;
  color: #000000;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  outline: none;
}

.dialog-buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 12px;
  border-top: 2px solid #000000;
}

label {
  font-weight: bold;
  color: #000000;
  margin-top: 4px;
}
</style>
