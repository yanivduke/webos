<template>
  <div class="snippets-manager">
    <div class="tool-header">
      <h3>📝 Code Snippets Manager</h3>
      <p class="tool-desc">Store and organize reusable code snippets</p>
    </div>

    <div class="tool-content">
      <!-- Search and Actions -->
      <div class="action-bar">
        <input
          v-model="searchQuery"
          type="text"
          class="amiga-input"
          placeholder="Search snippets..."
        />
        <button class="amiga-button small primary" @click="createSnippet">
          + New Snippet
        </button>
        <button class="amiga-button small" @click="importSnippets">Import</button>
        <button class="amiga-button small" @click="exportSnippets">Export</button>
      </div>

      <div class="content-grid">
        <!-- Sidebar with Categories and Snippets List -->
        <div class="sidebar">
          <!-- Categories -->
          <div class="categories-section">
            <div class="section-title">Categories</div>
            <div class="categories-list">
              <div
                v-for="category in categories"
                :key="category.id"
                class="category-item"
                :class="{ active: selectedCategory === category.id }"
                @click="selectedCategory = category.id"
              >
                <span class="category-icon">{{ category.icon }}</span>
                <span class="category-name">{{ category.name }}</span>
                <span class="category-count">({{ category.count }})</span>
              </div>
            </div>
          </div>

          <!-- Tags -->
          <div class="tags-section">
            <div class="section-title">Tags</div>
            <div class="tags-list">
              <button
                v-for="tag in allTags"
                :key="tag"
                class="amiga-button tiny"
                :class="{ active: selectedTags.includes(tag) }"
                @click="toggleTag(tag)"
              >
                #{{ tag }}
              </button>
            </div>
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="main-content">
          <!-- Snippets List -->
          <div v-if="!editingSnippet" class="snippets-list">
            <div v-if="filteredSnippets.length === 0" class="empty-state">
              No snippets found
            </div>

            <div
              v-for="snippet in filteredSnippets"
              :key="snippet.id"
              class="snippet-card"
              @click="viewSnippet(snippet)"
            >
              <div class="snippet-header">
                <span class="snippet-language" :class="snippet.language">
                  {{ snippet.language }}
                </span>
                <span class="snippet-title">{{ snippet.title }}</span>
                <span class="snippet-favorite" v-if="snippet.favorite">★</span>
              </div>

              <div class="snippet-description">{{ snippet.description }}</div>

              <div class="snippet-preview">
                <code>{{ truncateCode(snippet.code) }}</code>
              </div>

              <div class="snippet-footer">
                <div class="snippet-tags">
                  <span v-for="tag in snippet.tags" :key="tag" class="tag">
                    #{{ tag }}
                  </span>
                </div>
                <div class="snippet-actions">
                  <button class="amiga-button tiny" @click.stop="copyToClipboard(snippet)">
                    Copy
                  </button>
                  <button class="amiga-button tiny" @click.stop="editSnippet(snippet)">
                    Edit
                  </button>
                  <button
                    class="amiga-button tiny danger"
                    @click.stop="deleteSnippet(snippet.id)"
                  >
                    Del
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Snippet Editor -->
          <div v-else class="snippet-editor">
            <div class="editor-header">
              <h4>{{ editMode === 'create' ? 'Create Snippet' : 'Edit Snippet' }}</h4>
              <button class="amiga-button small" @click="cancelEdit">Cancel</button>
            </div>

            <div class="editor-form">
              <div class="form-group">
                <label>Title:</label>
                <input
                  v-model="editForm.title"
                  type="text"
                  class="amiga-input"
                  placeholder="Snippet title"
                />
              </div>

              <div class="form-group">
                <label>Description:</label>
                <textarea
                  v-model="editForm.description"
                  class="amiga-textarea"
                  rows="2"
                  placeholder="Brief description of what this snippet does"
                ></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Language:</label>
                  <select v-model="editForm.language" class="amiga-select">
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="bash">Bash</option>
                    <option value="sql">SQL</option>
                    <option value="json">JSON</option>
                    <option value="vue">Vue</option>
                    <option value="react">React</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Category:</label>
                  <select v-model="editForm.category" class="amiga-select">
                    <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                      {{ cat.name }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Tags (comma separated):</label>
                <input
                  v-model="editForm.tagsInput"
                  type="text"
                  class="amiga-input"
                  placeholder="react, hooks, useState"
                />
              </div>

              <div class="form-group">
                <label>Code:</label>
                <textarea
                  v-model="editForm.code"
                  class="amiga-textarea code-editor"
                  rows="15"
                  placeholder="// Your code here"
                ></textarea>
              </div>

              <div class="form-group checkbox-group">
                <label>
                  <input type="checkbox" v-model="editForm.favorite" class="amiga-checkbox" />
                  Mark as favorite
                </label>
              </div>

              <div class="editor-actions">
                <button class="amiga-button primary" @click="saveSnippet">
                  {{ editMode === 'create' ? 'Create' : 'Save' }}
                </button>
                <button class="amiga-button" @click="cancelEdit">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';

interface Snippet {
  id: string;
  title: string;
  description: string;
  language: string;
  category: string;
  code: string;
  tags: string[];
  favorite: boolean;
  created: string;
  updated: string;
}

const searchQuery = ref('');
const selectedCategory = ref('all');
const selectedTags = ref<string[]>([]);
const editingSnippet = ref(false);
const editMode = ref<'create' | 'edit'>('create');

const categories = ref([
  { id: 'all', name: 'All Snippets', icon: '📂', count: 12 },
  { id: 'frontend', name: 'Frontend', icon: '🎨', count: 5 },
  { id: 'backend', name: 'Backend', icon: '⚙️', count: 3 },
  { id: 'database', name: 'Database', icon: '💾', count: 2 },
  { id: 'utility', name: 'Utility', icon: '🔧', count: 2 }
]);

const snippets = ref<Snippet[]>([
  {
    id: '1',
    title: 'React useState Hook',
    description: 'Basic React state management with useState',
    language: 'javascript',
    category: 'frontend',
    code: `import { useState } from 'react';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  \n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(count + 1)}>\n        Increment\n      </button>\n    </div>\n  );\n}`,
    tags: ['react', 'hooks', 'useState'],
    favorite: true,
    created: '2024-01-10',
    updated: '2024-01-10'
  },
  {
    id: '2',
    title: 'Express Middleware',
    description: 'Basic Express.js middleware for authentication',
    language: 'javascript',
    category: 'backend',
    code: `const authMiddleware = (req, res, next) => {\n  const token = req.headers.authorization;\n  \n  if (!token) {\n    return res.status(401).json({ error: 'No token provided' });\n  }\n  \n  try {\n    const decoded = jwt.verify(token, process.env.JWT_SECRET);\n    req.user = decoded;\n    next();\n  } catch (error) {\n    res.status(401).json({ error: 'Invalid token' });\n  }\n};`,
    tags: ['express', 'middleware', 'auth'],
    favorite: false,
    created: '2024-01-11',
    updated: '2024-01-11'
  },
  {
    id: '3',
    title: 'SQL Join Query',
    description: 'Inner join between users and orders tables',
    language: 'sql',
    category: 'database',
    code: `SELECT \n  users.id,\n  users.name,\n  users.email,\n  orders.id AS order_id,\n  orders.total,\n  orders.created_at\nFROM users\nINNER JOIN orders ON users.id = orders.user_id\nWHERE orders.status = 'completed'\nORDER BY orders.created_at DESC;`,
    tags: ['sql', 'join', 'query'],
    favorite: false,
    created: '2024-01-12',
    updated: '2024-01-12'
  },
  {
    id: '4',
    title: 'Debounce Function',
    description: 'JavaScript debounce utility function',
    language: 'javascript',
    category: 'utility',
    code: `function debounce(func, wait) {\n  let timeout;\n  \n  return function executedFunction(...args) {\n    const later = () => {\n      clearTimeout(timeout);\n      func(...args);\n    };\n    \n    clearTimeout(timeout);\n    timeout = setTimeout(later, wait);\n  };\n}`,
    tags: ['javascript', 'utility', 'debounce'],
    favorite: true,
    created: '2024-01-13',
    updated: '2024-01-13'
  }
]);

const editForm = ref<Partial<Snippet> & { tagsInput: string }>({
  title: '',
  description: '',
  language: 'javascript',
  category: 'frontend',
  code: '',
  tagsInput: '',
  favorite: false
});

const allTags = computed(() => {
  const tags = new Set<string>();
  snippets.value.forEach(snippet => {
    snippet.tags.forEach(tag => tags.add(tag));
  });
  return Array.from(tags).sort();
});

const filteredSnippets = computed(() => {
  let result = snippets.value;

  // Filter by category
  if (selectedCategory.value !== 'all') {
    result = result.filter(s => s.category === selectedCategory.value);
  }

  // Filter by tags
  if (selectedTags.value.length > 0) {
    result = result.filter(s =>
      selectedTags.value.some(tag => s.tags.includes(tag))
    );
  }

  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(s =>
      s.title.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query) ||
      s.code.toLowerCase().includes(query) ||
      s.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }

  // Sort favorites first
  result.sort((a, b) => {
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return 0;
  });

  return result;
});

const createSnippet = () => {
  editMode.value = 'create';
  editForm.value = {
    title: '',
    description: '',
    language: 'javascript',
    category: 'frontend',
    code: '',
    tagsInput: '',
    favorite: false
  };
  editingSnippet.value = true;
};

const editSnippet = (snippet: Snippet) => {
  editMode.value = 'edit';
  editForm.value = {
    ...snippet,
    tagsInput: snippet.tags.join(', ')
  };
  editingSnippet.value = true;
};

const saveSnippet = () => {
  if (!editForm.value.title || !editForm.value.code) {
    alert('Title and code are required');
    return;
  }

  const tags = editForm.value.tagsInput
    ? editForm.value.tagsInput.split(',').map(t => t.trim()).filter(t => t)
    : [];

  if (editMode.value === 'create') {
    const newSnippet: Snippet = {
      id: Date.now().toString(),
      title: editForm.value.title!,
      description: editForm.value.description || '',
      language: editForm.value.language || 'javascript',
      category: editForm.value.category || 'frontend',
      code: editForm.value.code!,
      tags,
      favorite: editForm.value.favorite || false,
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };

    snippets.value.push(newSnippet);
    alert('Snippet created successfully!');
  } else {
    const snippet = snippets.value.find(s => s.id === editForm.value.id);
    if (snippet) {
      snippet.title = editForm.value.title!;
      snippet.description = editForm.value.description || '';
      snippet.language = editForm.value.language || 'javascript';
      snippet.category = editForm.value.category || 'frontend';
      snippet.code = editForm.value.code!;
      snippet.tags = tags;
      snippet.favorite = editForm.value.favorite || false;
      snippet.updated = new Date().toISOString();
      alert('Snippet updated successfully!');
    }
  }

  updateCategoryCounts();
  cancelEdit();
};

const cancelEdit = () => {
  editingSnippet.value = false;
  editForm.value = {
    title: '',
    description: '',
    language: 'javascript',
    category: 'frontend',
    code: '',
    tagsInput: '',
    favorite: false
  };
};

const deleteSnippet = (id: string) => {
  const snippet = snippets.value.find(s => s.id === id);
  if (snippet && confirm(`Delete snippet "${snippet.title}"?`)) {
    snippets.value = snippets.value.filter(s => s.id !== id);
    updateCategoryCounts();
  }
};

const viewSnippet = (snippet: Snippet) => {
  editSnippet(snippet);
};

const copyToClipboard = (snippet: Snippet) => {
  navigator.clipboard.writeText(snippet.code);
  alert(`"${snippet.title}" copied to clipboard!`);
};

const truncateCode = (code: string, maxLength: number = 100): string => {
  if (code.length <= maxLength) return code;
  return code.substring(0, maxLength) + '...';
};

const toggleTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag);
  if (index > -1) {
    selectedTags.value.splice(index, 1);
  } else {
    selectedTags.value.push(tag);
  }
};

const updateCategoryCounts = () => {
  categories.value.forEach(cat => {
    if (cat.id === 'all') {
      cat.count = snippets.value.length;
    } else {
      cat.count = snippets.value.filter(s => s.category === cat.id).length;
    }
  });
};

const importSnippets = () => {
  alert('Import functionality (mock)');
};

const exportSnippets = () => {
  const data = JSON.stringify(snippets.value, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `snippets_${new Date().toISOString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Initialize counts
updateCategoryCounts();
</script>

<style scoped>
.snippets-manager {
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
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-bar {
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

.amiga-select {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 6px 8px;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
  width: 100%;
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

.code-editor {
  font-family: 'Courier New', monospace;
  tab-size: 2;
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
  font-size: 7px;
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

.amiga-button.active {
  background: #00aa00;
  color: #ffffff;
}

.amiga-checkbox {
  width: 14px;
  height: 14px;
}

.content-grid {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 12px;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  background: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 12px;
  overflow-y: auto;
}

.section-title {
  font-size: 9px;
  color: #0055aa;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 2px solid #000000;
}

.categories-section,
.tags-section {
  margin-bottom: 16px;
}

.categories-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-item {
  padding: 6px;
  font-size: 7px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid transparent;
}

.category-item:hover {
  background: #f0f0f0;
}

.category-item.active {
  background: #0055aa;
  color: #ffffff;
  border: 1px solid #000000;
}

.category-icon {
  font-size: 12px;
}

.category-name {
  flex: 1;
}

.category-count {
  color: #666666;
}

.category-item.active .category-count {
  color: #ffffff;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.main-content {
  background: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 12px;
  overflow-y: auto;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #666666;
  font-size: 8px;
  font-style: italic;
}

.snippets-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.snippet-card {
  background: #f5f5f5;
  border: 2px solid #888888;
  padding: 10px;
  cursor: pointer;
  transition: all 0.1s;
}

.snippet-card:hover {
  border-color: #0055aa;
  box-shadow: 2px 2px 0 #0055aa;
}

.snippet-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.snippet-language {
  padding: 2px 6px;
  font-size: 7px;
  font-weight: bold;
  border: 1px solid;
  background: #0055aa;
  color: #ffffff;
}

.snippet-title {
  flex: 1;
  font-size: 9px;
  font-weight: bold;
  color: #000000;
}

.snippet-favorite {
  color: #ffaa00;
  font-size: 12px;
}

.snippet-description {
  font-size: 7px;
  color: #666666;
  margin-bottom: 6px;
  line-height: 1.4;
}

.snippet-preview {
  background: #e0e0e0;
  border: 1px solid #888888;
  padding: 6px;
  margin-bottom: 6px;
  font-size: 7px;
  overflow: hidden;
}

.snippet-preview code {
  font-family: 'Courier New', monospace;
  color: #000000;
  display: block;
  white-space: pre;
}

.snippet-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
}

.snippet-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1;
}

.tag {
  font-size: 6px;
  color: #666666;
  background: #e0e0e0;
  padding: 2px 4px;
  border: 1px solid #888888;
}

.snippet-actions {
  display: flex;
  gap: 4px;
}

.snippet-editor {
  max-width: 800px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 2px solid #000000;
}

.editor-header h4 {
  margin: 0;
  font-size: 9px;
  color: #0055aa;
}

.editor-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 9px;
  color: #000000;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.checkbox-group label {
  flex-direction: row;
  align-items: center;
  gap: 6px;
  font-size: 8px;
}

.editor-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 2px solid #e0e0e0;
}
</style>
