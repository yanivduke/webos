<template>
  <div class="git-client">
    <div class="tool-header">
      <h3>🐙 Git Client</h3>
      <p class="tool-desc">Manage Git repositories and operations</p>
    </div>

    <div class="tool-content">
      <!-- Repository Path -->
      <div class="input-section">
        <label>Repository Path:</label>
        <div class="input-row">
          <input
            v-model="repoPath"
            type="text"
            class="amiga-input"
            placeholder="/path/to/repository"
          />
          <button class="amiga-button" @click="loadRepository">Load</button>
        </div>
      </div>

      <!-- Repository Info -->
      <div v-if="repoInfo" class="repo-info">
        <div class="info-row">
          <span class="label">Branch:</span>
          <span class="value branch-name">{{ repoInfo.branch }}</span>
        </div>
        <div class="info-row">
          <span class="label">Remote:</span>
          <span class="value">{{ repoInfo.remote }}</span>
        </div>
        <div class="info-row">
          <span class="label">Status:</span>
          <span class="value" :class="statusClass">{{ repoInfo.status }}</span>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tabs">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          class="tab"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.name }}
        </div>
      </div>

      <!-- Status Tab -->
      <div v-if="activeTab === 'status'" class="tab-content">
        <div class="section-header">
          <h4>Working Directory Changes</h4>
          <button class="amiga-button small" @click="refreshStatus">Refresh</button>
        </div>

        <div v-if="changes.length === 0" class="empty-state">
          No changes in working directory
        </div>

        <div v-else class="changes-list">
          <div
            v-for="(change, idx) in changes"
            :key="idx"
            class="change-item"
            :class="change.status"
          >
            <input type="checkbox" v-model="change.selected" class="amiga-checkbox" />
            <span class="change-status" :class="change.status">{{ change.status }}</span>
            <span class="change-file">{{ change.file }}</span>
          </div>
        </div>

        <div class="action-buttons">
          <button class="amiga-button" @click="stageSelected">Stage Selected</button>
          <button class="amiga-button" @click="unstageSelected">Unstage Selected</button>
          <button class="amiga-button danger" @click="discardSelected">Discard</button>
        </div>
      </div>

      <!-- Commit Tab -->
      <div v-if="activeTab === 'commit'" class="tab-content">
        <div class="section-header">
          <h4>Commit Changes</h4>
        </div>

        <div class="input-section">
          <label>Commit Message:</label>
          <textarea
            v-model="commitMessage"
            class="amiga-textarea"
            rows="4"
            placeholder="Enter commit message..."
          ></textarea>
        </div>

        <div class="staged-files">
          <label>Staged Files ({{ stagedFiles.length }}):</label>
          <div v-if="stagedFiles.length === 0" class="empty-state">
            No files staged for commit
          </div>
          <div v-else class="file-list">
            <div v-for="(file, idx) in stagedFiles" :key="idx" class="file-item">
              {{ file }}
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button
            class="amiga-button primary"
            @click="commitChanges"
            :disabled="!commitMessage || stagedFiles.length === 0"
          >
            Commit
          </button>
          <button class="amiga-button" @click="amendCommit">Amend Last Commit</button>
        </div>
      </div>

      <!-- History Tab -->
      <div v-if="activeTab === 'history'" class="tab-content">
        <div class="section-header">
          <h4>Commit History</h4>
          <button class="amiga-button small" @click="loadHistory">Refresh</button>
        </div>

        <div class="commits-list">
          <div v-for="commit in commits" :key="commit.hash" class="commit-item">
            <div class="commit-header">
              <span class="commit-hash">{{ commit.hash.substring(0, 7) }}</span>
              <span class="commit-author">{{ commit.author }}</span>
              <span class="commit-date">{{ commit.date }}</span>
            </div>
            <div class="commit-message">{{ commit.message }}</div>
          </div>
        </div>
      </div>

      <!-- Branches Tab -->
      <div v-if="activeTab === 'branches'" class="tab-content">
        <div class="section-header">
          <h4>Branches</h4>
          <button class="amiga-button small" @click="loadBranches">Refresh</button>
        </div>

        <div class="input-section">
          <label>Create New Branch:</label>
          <div class="input-row">
            <input
              v-model="newBranchName"
              type="text"
              class="amiga-input"
              placeholder="branch-name"
            />
            <button class="amiga-button" @click="createBranch">Create</button>
          </div>
        </div>

        <div class="branches-list">
          <div v-for="branch in branches" :key="branch.name" class="branch-item">
            <span class="branch-indicator" :class="{ current: branch.current }">●</span>
            <span class="branch-name">{{ branch.name }}</span>
            <div class="branch-actions">
              <button
                v-if="!branch.current"
                class="amiga-button small"
                @click="checkoutBranch(branch.name)"
              >
                Checkout
              </button>
              <button
                v-if="!branch.current"
                class="amiga-button small danger"
                @click="deleteBranch(branch.name)"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pull/Push Tab -->
      <div v-if="activeTab === 'sync'" class="tab-content">
        <div class="section-header">
          <h4>Synchronize with Remote</h4>
        </div>

        <div class="sync-actions">
          <button class="amiga-button primary" @click="pullChanges">
            ⬇ Pull from Remote
          </button>
          <button class="amiga-button primary" @click="pushChanges">
            ⬆ Push to Remote
          </button>
          <button class="amiga-button" @click="fetchRemote">
            🔄 Fetch
          </button>
        </div>

        <div class="sync-status">
          <h4>Sync Status</h4>
          <div class="status-item">
            <span class="label">Commits ahead:</span>
            <span class="value">{{ syncStatus.ahead }}</span>
          </div>
          <div class="status-item">
            <span class="label">Commits behind:</span>
            <span class="value">{{ syncStatus.behind }}</span>
          </div>
        </div>
      </div>

      <!-- Output Console -->
      <div class="console-output">
        <div class="console-header">Console Output:</div>
        <div class="console-content" ref="consoleRef">
          <div v-for="(line, idx) in outputLines" :key="idx" class="console-line">
            {{ line }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';

const repoPath = ref('/home/user/project');
const repoInfo = ref<any>(null);
const activeTab = ref('status');
const commitMessage = ref('');
const newBranchName = ref('');
const outputLines = ref<string[]>(['Git Client initialized. Load a repository to begin.']);
const consoleRef = ref<HTMLElement | null>(null);

const tabs = [
  { id: 'status', name: 'Status' },
  { id: 'commit', name: 'Commit' },
  { id: 'history', name: 'History' },
  { id: 'branches', name: 'Branches' },
  { id: 'sync', name: 'Pull/Push' }
];

const changes = ref([
  { file: 'src/index.js', status: 'modified', selected: false },
  { file: 'package.json', status: 'modified', selected: false },
  { file: 'README.md', status: 'added', selected: false }
]);

const stagedFiles = ref<string[]>([]);

const commits = ref([
  {
    hash: 'a1b2c3d4e5f6',
    author: 'Developer',
    date: '2024-01-15',
    message: 'Initial commit'
  },
  {
    hash: 'b2c3d4e5f6g7',
    author: 'Developer',
    date: '2024-01-16',
    message: 'Add new features'
  }
]);

const branches = ref([
  { name: 'main', current: true },
  { name: 'feature/new-ui', current: false },
  { name: 'bugfix/login-error', current: false }
]);

const syncStatus = ref({
  ahead: 2,
  behind: 0
});

const statusClass = computed(() => {
  if (!repoInfo.value) return '';
  return repoInfo.value.status === 'clean' ? 'status-clean' : 'status-dirty';
});

const loadRepository = async () => {
  addOutput(`Loading repository from ${repoPath.value}...`);

  // Mock data - replace with actual API call
  repoInfo.value = {
    branch: 'main',
    remote: 'origin',
    status: 'modified'
  };

  addOutput('Repository loaded successfully');
};

const refreshStatus = () => {
  addOutput('Refreshing status...');
  addOutput(`Found ${changes.value.length} changes in working directory`);
};

const stageSelected = () => {
  const selected = changes.value.filter(c => c.selected);
  selected.forEach(c => {
    if (!stagedFiles.value.includes(c.file)) {
      stagedFiles.value.push(c.file);
    }
  });
  addOutput(`Staged ${selected.length} file(s)`);
};

const unstageSelected = () => {
  const selected = changes.value.filter(c => c.selected).map(c => c.file);
  stagedFiles.value = stagedFiles.value.filter(f => !selected.includes(f));
  addOutput(`Unstaged ${selected.length} file(s)`);
};

const discardSelected = () => {
  const selected = changes.value.filter(c => c.selected);
  if (confirm(`Discard changes in ${selected.length} file(s)?`)) {
    addOutput(`Discarded changes in ${selected.length} file(s)`);
  }
};

const commitChanges = () => {
  if (!commitMessage.value || stagedFiles.value.length === 0) return;

  addOutput(`Committing ${stagedFiles.value.length} file(s)...`);
  addOutput(`Commit message: "${commitMessage.value}"`);
  addOutput('Commit created successfully');

  commitMessage.value = '';
  stagedFiles.value = [];
};

const amendCommit = () => {
  addOutput('Amending last commit...');
};

const loadHistory = () => {
  addOutput('Loading commit history...');
  addOutput(`Loaded ${commits.value.length} commits`);
};

const loadBranches = () => {
  addOutput('Loading branches...');
  addOutput(`Found ${branches.value.length} branches`);
};

const createBranch = () => {
  if (!newBranchName.value) return;

  addOutput(`Creating branch "${newBranchName.value}"...`);
  branches.value.push({ name: newBranchName.value, current: false });
  newBranchName.value = '';
  addOutput('Branch created successfully');
};

const checkoutBranch = (name: string) => {
  addOutput(`Checking out branch "${name}"...`);
  branches.value.forEach(b => b.current = b.name === name);
  if (repoInfo.value) {
    repoInfo.value.branch = name;
  }
  addOutput(`Switched to branch "${name}"`);
};

const deleteBranch = (name: string) => {
  if (confirm(`Delete branch "${name}"?`)) {
    branches.value = branches.value.filter(b => b.name !== name);
    addOutput(`Deleted branch "${name}"`);
  }
};

const pullChanges = () => {
  addOutput('Pulling changes from remote...');
  addOutput('Already up to date');
};

const pushChanges = () => {
  addOutput('Pushing changes to remote...');
  addOutput('Push completed successfully');
};

const fetchRemote = () => {
  addOutput('Fetching from remote...');
  addOutput('Fetch completed');
};

const addOutput = (line: string) => {
  outputLines.value.push(`[${new Date().toLocaleTimeString()}] ${line}`);
  // Auto-scroll to bottom
  setTimeout(() => {
    if (consoleRef.value) {
      consoleRef.value.scrollTop = consoleRef.value.scrollHeight;
    }
  }, 10);
};
</script>

<style scoped>
.git-client {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
  overflow: hidden;
}

.tool-header {
  background: #0055aa;
  color: #ffffff;
  padding: 12px;
  border-bottom: 2px solid #000000;
}

.tool-header h3 {
  margin: 0 0 4px 0;
  font-size: 11px;
}

.tool-desc {
  margin: 0;
  font-size: 8px;
  opacity: 0.9;
}

.tool-content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-section label {
  font-size: 9px;
  color: #000000;
}

.input-row {
  display: flex;
  gap: 6px;
}

.amiga-input {
  flex: 1;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 6px 8px;
  font-size: 10px;
  font-family: 'Courier New', monospace;
  color: #000000;
}

.amiga-textarea {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 8px;
  font-size: 10px;
  font-family: 'Courier New', monospace;
  color: #000000;
  width: 100%;
  resize: vertical;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 12px;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
  cursor: pointer;
  white-space: nowrap;
}

.amiga-button:hover {
  background: #b0b0b0;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.amiga-button.small {
  padding: 4px 8px;
  font-size: 8px;
}

.amiga-button.primary {
  background: #0055aa;
  color: #ffffff;
}

.amiga-button.danger {
  background: #ff0000;
  color: #ffffff;
}

.repo-info {
  background: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 8px;
}

.info-row {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 9px;
}

.info-row .label {
  color: #666666;
  min-width: 80px;
}

.info-row .value {
  color: #000000;
  font-weight: bold;
}

.branch-name {
  color: #0055aa;
}

.status-clean {
  color: #00aa00;
}

.status-dirty {
  color: #ff8800;
}

.tabs {
  display: flex;
  gap: 2px;
  background: #888888;
  padding: 2px;
}

.tab {
  flex: 1;
  padding: 6px;
  text-align: center;
  font-size: 8px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
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
  background: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 12px;
  flex: 1;
  overflow-y: auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 2px solid #000000;
}

.section-header h4 {
  margin: 0;
  font-size: 9px;
  color: #0055aa;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: #666666;
  font-size: 8px;
  font-style: italic;
}

.changes-list,
.file-list,
.commits-list,
.branches-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.change-item,
.file-item,
.commit-item,
.branch-item {
  background: #f5f5f5;
  border: 1px solid #888888;
  padding: 6px;
  font-size: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.change-status {
  padding: 2px 6px;
  font-size: 7px;
  font-weight: bold;
  border: 1px solid;
  min-width: 60px;
  text-align: center;
}

.change-status.modified {
  background: #ffff00;
  color: #000000;
  border-color: #888800;
}

.change-status.added {
  background: #00ff00;
  color: #000000;
  border-color: #008800;
}

.change-status.deleted {
  background: #ff0000;
  color: #ffffff;
  border-color: #880000;
}

.change-file {
  flex: 1;
  font-family: 'Courier New', monospace;
}

.amiga-checkbox {
  width: 14px;
  height: 14px;
}

.action-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.staged-files {
  margin-top: 12px;
}

.staged-files label {
  display: block;
  font-size: 9px;
  margin-bottom: 6px;
  color: #0055aa;
}

.commit-header {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.commit-hash {
  color: #0055aa;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.commit-author {
  color: #666666;
}

.commit-date {
  color: #666666;
  margin-left: auto;
}

.commit-message {
  color: #000000;
  padding-left: 20px;
}

.branch-item {
  justify-content: space-between;
}

.branch-indicator {
  font-size: 14px;
  color: #888888;
}

.branch-indicator.current {
  color: #00aa00;
}

.branch-name {
  flex: 1;
  font-family: 'Courier New', monospace;
}

.branch-actions {
  display: flex;
  gap: 4px;
}

.sync-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.sync-status {
  background: #f5f5f5;
  border: 1px solid #888888;
  padding: 12px;
}

.sync-status h4 {
  margin: 0 0 8px 0;
  font-size: 9px;
  color: #0055aa;
}

.status-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 8px;
}

.console-output {
  background: #000000;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  margin-top: auto;
}

.console-header {
  background: #0055aa;
  color: #ffffff;
  padding: 4px 8px;
  font-size: 8px;
}

.console-content {
  height: 100px;
  overflow-y: auto;
  padding: 6px;
  font-family: 'Courier New', monospace;
  font-size: 8px;
}

.console-line {
  color: #00ff00;
  margin-bottom: 2px;
  line-height: 1.4;
}
</style>
