<template>
  <div class="env-editor">
    <div class="tool-header">
      <h3>⚙️ Environment Editor</h3>
      <p class="tool-desc">Manage environment variables and .env files</p>
    </div>

    <div class="tool-content">
      <!-- File Selection -->
      <div class="file-selector">
        <label>Environment File:</label>
        <div class="selector-row">
          <select v-model="selectedFile" class="amiga-select" @change="loadEnvFile">
            <option value=".env">.env</option>
            <option value=".env.local">.env.local</option>
            <option value=".env.development">.env.development</option>
            <option value=".env.production">.env.production</option>
            <option value=".env.test">.env.test</option>
          </select>
          <button class="amiga-button small" @click="createNewFile">New</button>
          <button class="amiga-button small primary" @click="saveFile">Save</button>
          <button class="amiga-button small" @click="reloadFile">Reload</button>
        </div>
      </div>

      <!-- Search and Filter -->
      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          class="amiga-input"
          placeholder="Search variables..."
        />
        <button class="amiga-button small" @click="addVariable">+ Add Variable</button>
      </div>

      <!-- Variables List -->
      <div class="variables-section">
        <div class="section-header">
          <h4>Environment Variables ({{ filteredVariables.length }})</h4>
          <div class="header-actions">
            <button class="amiga-button small" @click="sortVariables">
              Sort {{ sortOrder === 'asc' ? '↑' : '↓' }}
            </button>
            <button class="amiga-button small danger" @click="clearAll">
              Clear All
            </button>
          </div>
        </div>

        <div v-if="filteredVariables.length === 0" class="empty-state">
          No environment variables defined
        </div>

        <div v-else class="variables-list">
          <div
            v-for="(variable, index) in filteredVariables"
            :key="index"
            class="variable-item"
            :class="{ editing: editingIndex === index }"
          >
            <div v-if="editingIndex !== index" class="variable-display">
              <div class="variable-key">{{ variable.key }}</div>
              <div class="variable-value" :class="{ secret: variable.isSecret }">
                {{ variable.isSecret && !variable.revealed ? '••••••••' : variable.value }}
              </div>
              <div class="variable-actions">
                <button
                  v-if="variable.isSecret"
                  class="amiga-button tiny"
                  @click="toggleReveal(index)"
                >
                  {{ variable.revealed ? '🙈' : '👁' }}
                </button>
                <button class="amiga-button tiny" @click="editVariable(index)">
                  Edit
                </button>
                <button class="amiga-button tiny" @click="copyVariable(variable)">
                  Copy
                </button>
                <button class="amiga-button tiny danger" @click="deleteVariable(index)">
                  Del
                </button>
              </div>
            </div>

            <div v-else class="variable-edit">
              <input
                v-model="editForm.key"
                type="text"
                class="amiga-input"
                placeholder="KEY"
              />
              <input
                v-model="editForm.value"
                :type="editForm.isSecret && !editForm.revealed ? 'password' : 'text'"
                class="amiga-input"
                placeholder="value"
              />
              <label class="secret-checkbox">
                <input type="checkbox" v-model="editForm.isSecret" class="amiga-checkbox" />
                Secret
              </label>
              <div class="edit-actions">
                <button class="amiga-button tiny primary" @click="saveEdit(index)">
                  Save
                </button>
                <button class="amiga-button tiny" @click="cancelEdit">
                  Cancel
                </button>
              </div>
            </div>

            <div v-if="variable.comment" class="variable-comment">
              # {{ variable.comment }}
            </div>
          </div>
        </div>
      </div>

      <!-- Raw Editor -->
      <div class="raw-editor-section">
        <div class="section-header">
          <h4>Raw .env File</h4>
          <div class="header-actions">
            <button class="amiga-button small" @click="parseRaw">Parse</button>
            <button class="amiga-button small" @click="formatRaw">Format</button>
          </div>
        </div>

        <textarea
          v-model="rawContent"
          class="amiga-textarea raw-editor"
          rows="10"
          placeholder="# Environment variables
KEY=value
API_KEY=secret123
DATABASE_URL=postgresql://..."
        ></textarea>
      </div>

      <!-- Templates -->
      <div class="templates-section">
        <div class="section-header">
          <h4>Quick Templates</h4>
        </div>

        <div class="templates-grid">
          <button
            v-for="template in templates"
            :key="template.name"
            class="amiga-button template-btn"
            @click="applyTemplate(template)"
          >
            {{ template.name }}
          </button>
        </div>
      </div>

      <!-- Status Bar -->
      <div class="status-bar">
        <span class="status-item">File: {{ selectedFile }}</span>
        <span class="status-item">{{ filteredVariables.length }} variables</span>
        <span class="status-item" :class="{ unsaved: hasUnsavedChanges }">
          {{ hasUnsavedChanges ? '● Unsaved changes' : '✓ Saved' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';

interface Variable {
  key: string;
  value: string;
  isSecret: boolean;
  revealed: boolean;
  comment?: string;
}

const selectedFile = ref('.env');
const searchQuery = ref('');
const sortOrder = ref<'asc' | 'desc'>('asc');
const editingIndex = ref<number | null>(null);
const hasUnsavedChanges = ref(false);
const rawContent = ref('');

const variables = ref<Variable[]>([
  { key: 'NODE_ENV', value: 'development', isSecret: false, revealed: false },
  { key: 'PORT', value: '3001', isSecret: false, revealed: false },
  { key: 'DATABASE_URL', value: 'postgresql://localhost:5432/webos', isSecret: true, revealed: false },
  { key: 'API_KEY', value: 'sk_test_1234567890abcdef', isSecret: true, revealed: false },
  { key: 'JWT_SECRET', value: 'super-secret-key-change-in-prod', isSecret: true, revealed: false },
  { key: 'REDIS_URL', value: 'redis://localhost:6379', isSecret: false, revealed: false }
]);

const editForm = ref<Variable>({
  key: '',
  value: '',
  isSecret: false,
  revealed: false
});

const templates = [
  {
    name: 'Node.js App',
    variables: [
      { key: 'NODE_ENV', value: 'development', isSecret: false },
      { key: 'PORT', value: '3000', isSecret: false },
      { key: 'HOST', value: 'localhost', isSecret: false }
    ]
  },
  {
    name: 'Database',
    variables: [
      { key: 'DB_HOST', value: 'localhost', isSecret: false },
      { key: 'DB_PORT', value: '5432', isSecret: false },
      { key: 'DB_NAME', value: 'myapp', isSecret: false },
      { key: 'DB_USER', value: 'postgres', isSecret: true },
      { key: 'DB_PASSWORD', value: 'password', isSecret: true }
    ]
  },
  {
    name: 'AWS',
    variables: [
      { key: 'AWS_REGION', value: 'us-east-1', isSecret: false },
      { key: 'AWS_ACCESS_KEY_ID', value: '', isSecret: true },
      { key: 'AWS_SECRET_ACCESS_KEY', value: '', isSecret: true }
    ]
  },
  {
    name: 'OAuth',
    variables: [
      { key: 'OAUTH_CLIENT_ID', value: '', isSecret: true },
      { key: 'OAUTH_CLIENT_SECRET', value: '', isSecret: true },
      { key: 'OAUTH_CALLBACK_URL', value: 'http://localhost:3000/auth/callback', isSecret: false }
    ]
  }
];

const filteredVariables = computed(() => {
  let result = [...variables.value];

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(v =>
      v.key.toLowerCase().includes(query) ||
      v.value.toLowerCase().includes(query)
    );
  }

  if (sortOrder.value === 'asc') {
    result.sort((a, b) => a.key.localeCompare(b.key));
  } else {
    result.sort((a, b) => b.key.localeCompare(a.key));
  }

  return result;
});

const loadEnvFile = () => {
  console.log(`Loading ${selectedFile.value}...`);
  updateRawContent();
};

const createNewFile = () => {
  const filename = prompt('Enter new .env filename (e.g., .env.staging):');
  if (filename) {
    selectedFile.value = filename;
    variables.value = [];
    rawContent.value = '';
  }
};

const saveFile = () => {
  console.log(`Saving ${selectedFile.value}...`);
  hasUnsavedChanges.value = false;
  alert(`${selectedFile.value} saved successfully!`);
};

const reloadFile = () => {
  if (hasUnsavedChanges.value) {
    if (!confirm('Discard unsaved changes?')) return;
  }
  loadEnvFile();
  hasUnsavedChanges.value = false;
};

const addVariable = () => {
  variables.value.push({
    key: 'NEW_VAR',
    value: '',
    isSecret: false,
    revealed: false
  });
  editingIndex.value = variables.value.length - 1;
  editForm.value = { ...variables.value[editingIndex.value], revealed: false };
  hasUnsavedChanges.value = true;
};

const editVariable = (index: number) => {
  editingIndex.value = index;
  editForm.value = { ...variables.value[index] };
};

const saveEdit = (index: number) => {
  if (!editForm.value.key) {
    alert('Key cannot be empty');
    return;
  }

  variables.value[index] = { ...editForm.value };
  editingIndex.value = null;
  hasUnsavedChanges.value = true;
  updateRawContent();
};

const cancelEdit = () => {
  editingIndex.value = null;
};

const deleteVariable = (index: number) => {
  if (confirm(`Delete ${variables.value[index].key}?`)) {
    variables.value.splice(index, 1);
    hasUnsavedChanges.value = true;
    updateRawContent();
  }
};

const copyVariable = (variable: Variable) => {
  const text = `${variable.key}=${variable.value}`;
  navigator.clipboard.writeText(text);
  alert('Copied to clipboard!');
};

const toggleReveal = (index: number) => {
  variables.value[index].revealed = !variables.value[index].revealed;
};

const sortVariables = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
};

const clearAll = () => {
  if (confirm('Clear all variables?')) {
    variables.value = [];
    rawContent.value = '';
    hasUnsavedChanges.value = true;
  }
};

const parseRaw = () => {
  const lines = rawContent.value.split('\n');
  variables.value = [];

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      const isSecret = key.toLowerCase().includes('secret') ||
        key.toLowerCase().includes('key') ||
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('token');

      variables.value.push({
        key: key.trim(),
        value: value.trim(),
        isSecret,
        revealed: false
      });
    }
  });

  hasUnsavedChanges.value = true;
  alert(`Parsed ${variables.value.length} variables`);
};

const formatRaw = () => {
  updateRawContent();
  alert('Content formatted!');
};

const updateRawContent = () => {
  rawContent.value = variables.value
    .map(v => `${v.key}=${v.value}`)
    .join('\n');
};

const applyTemplate = (template: any) => {
  if (variables.value.length > 0) {
    if (!confirm('Replace existing variables with template?')) return;
  }

  variables.value = template.variables.map((v: any) => ({
    ...v,
    revealed: false
  }));

  hasUnsavedChanges.value = true;
  updateRawContent();
  alert(`Applied ${template.name} template`);
};

// Initialize raw content
updateRawContent();
</script>

<style scoped>
.env-editor {
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

.file-selector {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.file-selector label {
  font-size: 9px;
  color: #000000;
}

.selector-row,
.search-bar {
  display: flex;
  gap: 6px;
}

.amiga-select {
  flex: 1;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 6px 8px;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
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

.amiga-button.small {
  padding: 4px 8px;
  font-size: 8px;
}

.amiga-button.tiny {
  padding: 2px 6px;
  font-size: 7px;
}

.amiga-button.primary {
  background: #0055aa;
  color: #ffffff;
}

.amiga-button.danger {
  background: #ff0000;
  color: #ffffff;
}

.variables-section,
.raw-editor-section,
.templates-section {
  background: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 12px;
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

.header-actions {
  display: flex;
  gap: 4px;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: #666666;
  font-size: 8px;
  font-style: italic;
}

.variables-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.variable-item {
  background: #f5f5f5;
  border: 2px solid #888888;
  padding: 8px;
}

.variable-item.editing {
  background: #e0f0ff;
}

.variable-display {
  display: grid;
  grid-template-columns: minmax(150px, 1fr) 2fr auto;
  gap: 8px;
  align-items: center;
}

.variable-key {
  font-family: 'Courier New', monospace;
  font-weight: bold;
  color: #0055aa;
  font-size: 9px;
}

.variable-value {
  font-family: 'Courier New', monospace;
  color: #000000;
  font-size: 8px;
  word-break: break-all;
}

.variable-value.secret {
  color: #666666;
}

.variable-actions,
.edit-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.variable-edit {
  display: grid;
  grid-template-columns: 1fr 2fr auto auto;
  gap: 6px;
  align-items: center;
}

.secret-checkbox {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 7px;
  white-space: nowrap;
}

.amiga-checkbox {
  width: 12px;
  height: 12px;
}

.variable-comment {
  margin-top: 4px;
  font-size: 7px;
  color: #666666;
  font-style: italic;
}

.raw-editor {
  min-height: 150px;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 6px;
}

.template-btn {
  padding: 8px;
  font-size: 7px;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  font-size: 8px;
  margin-top: auto;
}

.status-item {
  color: #000000;
}

.status-item.unsaved {
  color: #ff8800;
  font-weight: bold;
}
</style>
