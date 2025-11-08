<template>
  <div class="github-editor">
    <div class="gh-toolbar">
      <input
        v-model="repoPath"
        class="amiga-input repo-input"
        placeholder="owner/repository"
        @keyup.enter="loadRepository"
      />
      <button class="amiga-button" @click="loadRepository">Load Repo</button>
      <select v-model="currentBranch" class="amiga-select" @change="loadFiles">
        <option value="">Select Branch...</option>
        <option v-for="branch in branches" :key="branch" :value="branch">
          {{ branch }}
        </option>
      </select>
    </div>

    <div class="gh-content">
      <!-- File Tree -->
      <div class="gh-file-tree">
        <div class="tree-header">Files</div>
        <div v-if="loadingTree" class="loading-text">Loading...</div>
        <div v-else-if="files.length === 0" class="empty-text">No files</div>
        <div v-else class="file-list">
          <div
            v-for="file in files"
            :key="file.path"
            class="file-item"
            :class="{ selected: selectedFile === file.path, folder: file.type === 'dir' }"
            @click="handleFileClick(file)"
          >
            <span class="file-icon">{{ file.type === 'dir' ? '📁' : '📄' }}</span>
            <span class="file-name">{{ file.name }}</span>
          </div>
        </div>
      </div>

      <!-- Code Editor -->
      <div class="gh-editor-panel">
        <div v-if="selectedFile" class="editor-header">
          {{ selectedFile }}
          <button class="small-button" @click="saveFile" :disabled="!fileModified">Save</button>
        </div>
        <div v-if="loadingFile" class="loading-text">Loading file...</div>
        <textarea
          v-else-if="fileContent !== null"
          v-model="fileContent"
          class="code-editor"
          @input="fileModified = true"
          spellcheck="false"
        ></textarea>
        <div v-else class="empty-editor">Select a file to edit</div>
      </div>
    </div>

    <!-- Status Bar -->
    <div class="gh-status-bar">
      <span v-if="statusMessage">{{ statusMessage }}</span>
      <span v-else>Ready</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  sha?: string;
}

const repoPath = ref('');
const currentBranch = ref('main');
const branches = ref<string[]>(['main', 'master']);
const files = ref<FileItem[]>([]);
const selectedFile = ref('');
const fileContent = ref<string | null>(null);
const fileModified = ref(false);
const loadingTree = ref(false);
const loadingFile = ref(false);
const statusMessage = ref('');

const loadRepository = async () => {
  if (!repoPath.value) return;

  try {
    loadingTree.value = true;
    statusMessage.value = 'Loading repository...';

    const response = await fetch(`/api/devtools/github/repo/${repoPath.value}`);
    const data = await response.json();

    if (response.ok) {
      branches.value = data.branches || ['main'];
      currentBranch.value = branches.value[0];
      await loadFiles();
      statusMessage.value = 'Repository loaded';
    } else {
      statusMessage.value = 'Failed to load repository: ' + data.error;
    }
  } catch (err) {
    statusMessage.value = 'Error loading repository';
  } finally {
    loadingTree.value = false;
    setTimeout(() => statusMessage.value = '', 3000);
  }
};

const loadFiles = async () => {
  if (!repoPath.value || !currentBranch.value) return;

  try {
    loadingTree.value = true;

    const response = await fetch(
      `/api/devtools/github/files/${repoPath.value}?branch=${currentBranch.value}`
    );
    const data = await response.json();

    if (response.ok) {
      files.value = data.files || [];
    } else {
      statusMessage.value = 'Failed to load files';
    }
  } catch (err) {
    statusMessage.value = 'Error loading files';
  } finally {
    loadingTree.value = false;
  }
};

const handleFileClick = (file: FileItem) => {
  if (file.type === 'dir') {
    // In a real implementation, this would load the directory contents
    statusMessage.value = 'Directory navigation coming soon';
    return;
  }

  loadFileContent(file.path);
};

const loadFileContent = async (path: string) => {
  if (!repoPath.value || !currentBranch.value) return;

  try {
    loadingFile.value = true;
    selectedFile.value = path;
    fileModified.value = false;

    const response = await fetch(
      `/api/devtools/github/file/${repoPath.value}/${path}?branch=${currentBranch.value}`
    );
    const data = await response.json();

    if (response.ok) {
      fileContent.value = data.content;
      statusMessage.value = 'File loaded';
    } else {
      fileContent.value = '';
      statusMessage.value = 'Failed to load file';
    }
  } catch (err) {
    fileContent.value = '';
    statusMessage.value = 'Error loading file';
  } finally {
    loadingFile.value = false;
    setTimeout(() => statusMessage.value = '', 2000);
  }
};

const saveFile = async () => {
  if (!repoPath.value || !selectedFile.value || !fileContent.value) return;

  try {
    statusMessage.value = 'Saving file...';

    const response = await fetch('/api/devtools/github/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repo: repoPath.value,
        path: selectedFile.value,
        content: fileContent.value,
        branch: currentBranch.value,
        message: `Update ${selectedFile.value} via WebOS`
      })
    });

    const data = await response.json();

    if (response.ok) {
      fileModified.value = false;
      statusMessage.value = 'File saved successfully';
    } else {
      statusMessage.value = 'Failed to save: ' + data.error;
    }
  } catch (err) {
    statusMessage.value = 'Error saving file';
  } finally {
    setTimeout(() => statusMessage.value = '', 3000);
  }
};
</script>

<style scoped>
.github-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  font-family: 'Press Start 2P', monospace;
}

.gh-toolbar {
  display: flex;
  gap: 4px;
  padding: 8px;
  background: #a0a0a0;
  border-bottom: 2px solid #000000;
}

.repo-input {
  flex: 1;
  min-width: 200px;
}

.gh-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.gh-file-tree {
  width: 250px;
  background: #f0f0f0;
  border-right: 2px solid #000000;
  display: flex;
  flex-direction: column;
}

.tree-header {
  background: #0055aa;
  color: #ffffff;
  padding: 6px 8px;
  font-size: 9px;
  font-weight: bold;
  border-bottom: 2px solid #000000;
}

.file-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}

.file-item {
  padding: 4px 8px;
  font-size: 7px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: 2px;
  margin-bottom: 2px;
}

.file-item:hover {
  background: #e0e0e0;
}

.file-item.selected {
  background: #0055aa;
  color: #ffffff;
}

.file-item.folder {
  font-weight: bold;
}

.file-icon {
  font-size: 10px;
}

.file-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gh-editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.editor-header {
  background: #a0a0a0;
  padding: 6px 8px;
  font-size: 7px;
  border-bottom: 1px solid #000000;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.code-editor {
  flex: 1;
  padding: 8px;
  border: none;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #000000;
  background: #ffffff;
  resize: none;
  line-height: 1.5;
}

.code-editor:focus {
  outline: none;
  background: #fffff8;
}

.empty-editor {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888888;
  font-size: 8px;
}

.loading-text {
  padding: 20px;
  text-align: center;
  font-size: 7px;
  color: #666666;
}

.empty-text {
  padding: 20px;
  text-align: center;
  font-size: 7px;
  color: #888888;
}

.gh-status-bar {
  background: #888888;
  color: #ffffff;
  padding: 4px 8px;
  font-size: 6px;
  border-top: 2px solid #000000;
}

.small-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 2px 6px;
  font-size: 6px;
  cursor: pointer;
  font-family: 'Press Start 2P', monospace;
}

.small-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
}

.small-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 8px;
  font-size: 8px;
  cursor: pointer;
  color: #000000;
  font-family: 'Press Start 2P', monospace;
}

.amiga-button:hover {
  background: #b0b0b0;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-select {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px 8px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
}

.amiga-input {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px 8px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
}

.amiga-input:focus {
  outline: 1px solid #0055aa;
}
</style>
