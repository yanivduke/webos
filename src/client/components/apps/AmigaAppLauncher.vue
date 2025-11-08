<template>
  <div class="amiga-app-launcher">
    <!-- Header -->
    <div class="launcher-header">
      <div class="launcher-title">Application Launcher</div>
      <button class="close-btn" @click="close">✕</button>
    </div>

    <!-- Search Bar -->
    <div class="search-section">
      <input
        ref="searchInput"
        type="text"
        v-model="searchQuery"
        @keydown.enter="launchFirstMatch"
        placeholder="Type to search apps..."
        class="search-input"
      />
    </div>

    <!-- Recently Used Section -->
    <div v-if="recentApps.length > 0 && !searchQuery" class="recent-section">
      <div class="section-header">Recently Used</div>
      <div class="app-grid compact">
        <div
          v-for="app in recentApps"
          :key="app.name"
          class="app-item"
          :class="{ selected: selectedApp === app.name }"
          @click="selectApp(app.name)"
          @dblclick="launchApp(app.name)"
        >
          <div class="app-icon" v-html="app.icon"></div>
          <div class="app-name">{{ app.name }}</div>
        </div>
      </div>
    </div>

    <!-- Categories -->
    <div class="categories-section">
      <div class="category-tabs">
        <div
          v-for="category in categories"
          :key="category.id"
          class="category-tab"
          :class="{ active: activeCategory === category.id }"
          @click="activeCategory = category.id"
        >
          {{ category.name }}
        </div>
      </div>
    </div>

    <!-- Apps Grid -->
    <div class="apps-section">
      <div class="app-grid">
        <div
          v-for="app in filteredApps"
          :key="app.name"
          class="app-item"
          :class="{ selected: selectedApp === app.name }"
          @click="selectApp(app.name)"
          @dblclick="launchApp(app.name)"
          :title="app.description"
        >
          <div class="app-icon" v-html="app.icon"></div>
          <div class="app-name">{{ app.name }}</div>
        </div>
      </div>
      <div v-if="filteredApps.length === 0" class="empty-state">
        No applications found
      </div>
    </div>

    <!-- Footer -->
    <div class="launcher-footer">
      <div class="app-description">
        {{ selectedAppDescription }}
      </div>
      <div class="footer-actions">
        <button class="amiga-button" @click="launchSelectedApp" :disabled="!selectedApp">
          Launch
        </button>
        <button class="amiga-button" @click="close">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';

interface AppInfo {
  name: string;
  category: string;
  icon: string;
  description: string;
}

interface Category {
  id: string;
  name: string;
}

const emit = defineEmits<{
  launch: [appName: string];
  close: [];
}>();

const searchQuery = ref('');
const selectedApp = ref<string | null>(null);
const activeCategory = ref('all');
const searchInput = ref<HTMLInputElement | null>(null);

const categories: Category[] = [
  { id: 'all', name: 'All Apps' },
  { id: 'system', name: 'System Tools' },
  { id: 'apps', name: 'Applications' },
  { id: 'utilities', name: 'Utilities' },
];

const allApps: AppInfo[] = [
  // System Tools
  {
    name: 'System Monitor',
    category: 'system',
    icon: `<svg viewBox="0 0 64 64" width="48" height="48">
      <rect x="8" y="12" width="48" height="40" fill="#0055aa" stroke="#000" stroke-width="2"/>
      <rect x="12" y="16" width="40" height="32" fill="#000" stroke="#fff" stroke-width="1"/>
      <rect x="16" y="38" width="6" height="8" fill="#00ff00"/>
      <rect x="24" y="32" width="6" height="14" fill="#ffaa00"/>
      <rect x="32" y="28" width="6" height="18" fill="#ff6600"/>
      <rect x="40" y="24" width="6" height="22" fill="#ff0000"/>
    </svg>`,
    description: 'Monitor system performance, processes, and resources',
  },
  {
    name: 'Shell',
    category: 'system',
    icon: `<svg viewBox="0 0 64 64" width="48" height="48">
      <rect x="8" y="12" width="48" height="40" fill="#000" stroke="#fff" stroke-width="2"/>
      <text x="12" y="24" fill="#00ff00" font-size="6" font-family="monospace">C:\\></text>
      <rect x="22" y="20" width="2" height="6" fill="#00ff00"/>
    </svg>`,
    description: 'Command-line interface for advanced operations',
  },
  {
    name: 'Preferences',
    category: 'system',
    icon: `<svg viewBox="0 0 64 64" width="48" height="48">
      <circle cx="32" cy="32" r="20" fill="#888" stroke="#000" stroke-width="2"/>
      <circle cx="32" cy="32" r="8" fill="#0055aa" stroke="#fff" stroke-width="2"/>
      <rect x="30" y="8" width="4" height="10" fill="#888"/>
      <rect x="30" y="46" width="4" height="10" fill="#888"/>
      <rect x="8" y="30" width="10" height="4" fill="#888"/>
      <rect x="46" y="30" width="10" height="4" fill="#888"/>
    </svg>`,
    description: 'Configure system settings and preferences',
  },
  {
    name: 'Clipboard',
    category: 'system',
    icon: `<svg viewBox="0 0 64 64" width="48" height="48">
      <rect x="16" y="12" width="32" height="40" fill="#a0a0a0" stroke="#000" stroke-width="2"/>
      <rect x="24" y="8" width="16" height="8" fill="#666" stroke="#000" stroke-width="1"/>
      <line x1="22" y1="22" x2="42" y2="22" stroke="#000" stroke-width="1"/>
      <line x1="22" y1="28" x2="42" y2="28" stroke="#000" stroke-width="1"/>
      <line x1="22" y1="34" x2="38" y2="34" stroke="#000" stroke-width="1"/>
    </svg>`,
    description: 'Manage clipboard history and contents',
  },
  {
    name: 'Search Files',
    category: 'system',
    icon: `<svg viewBox="0 0 64 64" width="48" height="48">
      <circle cx="26" cy="26" r="14" fill="#0055aa" stroke="#000" stroke-width="2"/>
      <circle cx="26" cy="26" r="9" fill="#ffffff" stroke="#000" stroke-width="2"/>
      <line x1="36" y1="36" x2="50" y2="50" stroke="#000" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
    description: 'Search for files and folders across all disks',
  },

  // Applications
  {
    name: 'NotePad',
    category: 'apps',
    icon: `<svg viewBox="0 0 64 64" width="48" height="48">
      <rect x="12" y="8" width="40" height="48" fill="#fff" stroke="#000" stroke-width="2"/>
      <rect x="12" y="8" width="40" height="8" fill="#0055aa"/>
      <line x1="18" y1="22" x2="46" y2="22" stroke="#000" stroke-width="1"/>
      <line x1="18" y1="28" x2="46" y2="28" stroke="#000" stroke-width="1"/>
      <line x1="18" y1="34" x2="42" y2="34" stroke="#000" stroke-width="1"/>
      <line x1="18" y1="40" x2="44" y2="40" stroke="#000" stroke-width="1"/>
    </svg>`,
    description: 'Text editor for creating and editing documents',
  },
  {
    name: 'Paint',
    category: 'apps',
    icon: `<svg viewBox="0 0 64 64" width="48" height="48">
      <rect x="8" y="12" width="48" height="40" fill="#fff" stroke="#000" stroke-width="2"/>
      <path d="M 16 40 Q 24 20, 32 36 T 48 28" stroke="#ff0000" stroke-width="3" fill="none"/>
      <circle cx="20" cy="24" r="4" fill="#00ff00"/>
      <rect x="36" y="32" width="8" height="8" fill="#0055aa"/>
    </svg>`,
    description: 'Bitmap graphics editor for creating artwork',
  },
  {
    name: 'Calculator',
    category: 'apps',
    icon: `<svg viewBox="0 0 64 64" width="48" height="48">
      <rect x="12" y="8" width="40" height="48" fill="#888" stroke="#000" stroke-width="2"/>
      <rect x="16" y="12" width="32" height="12" fill="#000" stroke="#fff" stroke-width="1"/>
      <rect x="18" y="28" width="8" height="6" fill="#a0a0a0"/>
      <rect x="28" y="28" width="8" height="6" fill="#a0a0a0"/>
      <rect x="38" y="28" width="8" height="6" fill="#a0a0a0"/>
      <rect x="18" y="36" width="8" height="6" fill="#a0a0a0"/>
      <rect x="28" y="36" width="8" height="6" fill="#a0a0a0"/>
      <rect x="38" y="36" width="8" height="6" fill="#a0a0a0"/>
    </svg>`,
    description: 'Scientific calculator with advanced functions',
  },
  {
    name: 'MultiView',
    category: 'apps',
    icon: `<svg viewBox="0 0 64 64" width="48" height="48">
      <rect x="8" y="12" width="48" height="40" fill="#fff" stroke="#000" stroke-width="2"/>
      <rect x="12" y="16" width="20" height="14" fill="#0055aa"/>
      <rect x="34" y="16" width="20" height="14" fill="#ffaa00"/>
      <rect x="12" y="32" width="42" height="16" fill="#888"/>
    </svg>`,
    description: 'View images, documents, and multimedia files',
  },
  {
    name: 'AWML Runner',
    category: 'apps',
    icon: `<svg viewBox="0 0 64 64" width="48" height="48">
      <rect x="8" y="12" width="48" height="40" fill="#0055aa" stroke="#000" stroke-width="2"/>
      <polygon points="28,24 28,40 44,32" fill="#fff"/>
      <text x="12" y="20" fill="#fff" font-size="6">AWML</text>
    </svg>`,
    description: 'Run AWML applications and scripts',
  },
  {
    name: 'AWML Wizard',
    category: 'apps',
    icon: `<svg viewBox="0 0 64 64" width="48" height="48">
      <rect x="8" y="12" width="48" height="40" fill="#666" stroke="#000" stroke-width="2"/>
      <polygon points="32,20 28,32 36,32" fill="#ffaa00"/>
      <circle cx="32" cy="38" r="4" fill="#00ff00"/>
      <path d="M 20 44 L 32 38 L 44 44" stroke="#0055aa" stroke-width="2" fill="none"/>
    </svg>`,
    description: 'Create and edit AWML applications visually',
  },

  // Utilities
  {
    name: 'Clock',
    category: 'utilities',
    icon: `<svg viewBox="0 0 64 64" width="48" height="48">
      <circle cx="32" cy="32" r="20" fill="#fff" stroke="#000" stroke-width="2"/>
      <circle cx="32" cy="32" r="2" fill="#000"/>
      <line x1="32" y1="32" x2="32" y2="18" stroke="#000" stroke-width="2"/>
      <line x1="32" y1="32" x2="42" y2="32" stroke="#000" stroke-width="2"/>
      <circle cx="32" cy="16" r="1" fill="#000"/>
      <circle cx="48" cy="32" r="1" fill="#000"/>
      <circle cx="32" cy="48" r="1" fill="#000"/>
      <circle cx="16" cy="32" r="1" fill="#000"/>
    </svg>`,
    description: 'Display current time and date',
  },
];

const recentApps = ref<AppInfo[]>([]);

onMounted(() => {
  loadRecentApps();
  // Focus search input
  setTimeout(() => {
    searchInput.value?.focus();
  }, 100);
});

const filteredApps = computed(() => {
  let apps = allApps;

  // Filter by category
  if (activeCategory.value !== 'all') {
    apps = apps.filter(app => app.category === activeCategory.value);
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    apps = apps.filter(app =>
      app.name.toLowerCase().includes(query) ||
      app.description.toLowerCase().includes(query)
    );
  }

  return apps;
});

const selectedAppDescription = computed(() => {
  if (!selectedApp.value) return 'Select an application to launch';
  const app = allApps.find(a => a.name === selectedApp.value);
  return app?.description || '';
});

const selectApp = (name: string) => {
  selectedApp.value = name;
};

const launchApp = (name: string) => {
  addToRecent(name);
  emit('launch', name);
};

const launchSelectedApp = () => {
  if (selectedApp.value) {
    launchApp(selectedApp.value);
  }
};

const launchFirstMatch = () => {
  if (filteredApps.value.length > 0) {
    launchApp(filteredApps.value[0].name);
  }
};

const close = () => {
  emit('close');
};

const addToRecent = (name: string) => {
  const app = allApps.find(a => a.name === name);
  if (!app) return;

  // Remove if already exists
  recentApps.value = recentApps.value.filter(a => a.name !== name);

  // Add to front
  recentApps.value.unshift(app);

  // Keep only 6 most recent
  if (recentApps.value.length > 6) {
    recentApps.value = recentApps.value.slice(0, 6);
  }

  saveRecentApps();
};

const loadRecentApps = () => {
  const saved = localStorage.getItem('recentApps');
  if (saved) {
    const names = JSON.parse(saved);
    recentApps.value = names
      .map((name: string) => allApps.find(a => a.name === name))
      .filter((app: AppInfo | undefined) => app !== undefined);
  }
};

const saveRecentApps = () => {
  const names = recentApps.value.map(a => a.name);
  localStorage.setItem('recentApps', JSON.stringify(names));
};
</script>

<style scoped>
.amiga-app-launcher {
  width: 600px;
  max-height: 80vh;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  font-family: 'Press Start 2P', monospace;
}

/* Header */
.launcher-header {
  background: linear-gradient(180deg, #ffffff 0%, #c0c0c0 50%, #a0a0a0 100%);
  border-bottom: 2px solid #000000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  box-shadow: inset 1px 1px 0 #ffffff, inset -1px -1px 0 #808080;
}

.launcher-title {
  font-size: 10px;
  color: #000000;
  font-weight: bold;
}

.close-btn {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  width: 20px;
  height: 20px;
  cursor: pointer;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff6600;
  font-weight: bold;
}

.close-btn:hover {
  background: #b0b0b0;
}

.close-btn:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

/* Search Section */
.search-section {
  padding: 10px;
  background: #888;
  border-bottom: 2px solid #000;
}

.search-input {
  width: 100%;
  background: #fff;
  border: 2px solid;
  border-color: #000 #fff #fff #000;
  padding: 6px 8px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
}

.search-input:focus {
  outline: 2px solid #0055aa;
  outline-offset: -2px;
}

/* Recent Section */
.recent-section {
  padding: 8px;
  background: #888;
  border-bottom: 2px solid #000;
}

.section-header {
  font-size: 7px;
  color: #fff;
  margin-bottom: 6px;
  text-transform: uppercase;
}

/* Categories */
.categories-section {
  background: #888;
  border-bottom: 2px solid #000;
  padding: 4px;
}

.category-tabs {
  display: flex;
  gap: 2px;
}

.category-tab {
  padding: 6px 12px;
  font-size: 7px;
  cursor: pointer;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  color: #000;
  transition: all 0.05s;
  user-select: none;
}

.category-tab:hover {
  background: #b0b0b0;
}

.category-tab.active {
  background: #0055aa;
  color: #ffffff;
  border-color: #000000 #ffffff #ffffff #000000;
}

/* Apps Section */
.apps-section {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  min-height: 300px;
  max-height: 400px;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
}

.app-grid.compact {
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 8px;
}

.app-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: #888;
  border: 2px solid;
  border-color: #666 #000 #000 #666;
  cursor: pointer;
  transition: all 0.05s;
  user-select: none;
}

.app-item:hover {
  background: #999;
  border-color: #777 #111 #111 #777;
}

.app-item.selected {
  background: #0055aa;
  border-color: #0066cc #003388 #003388 #0066cc;
}

.app-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 6px;
}

.app-name {
  font-size: 6px;
  color: #fff;
  text-align: center;
  word-wrap: break-word;
  max-width: 100%;
}

.app-item.selected .app-name {
  color: #fff;
  font-weight: bold;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 8px;
}

/* Footer */
.launcher-footer {
  background: #888;
  border-top: 2px solid #000;
  padding: 8px;
}

.app-description {
  font-size: 7px;
  color: #fff;
  margin-bottom: 8px;
  min-height: 24px;
  padding: 4px;
  background: #666;
  border: 1px solid #000;
}

.footer-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

/* Buttons */
.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 12px;
  font-size: 8px;
  cursor: pointer;
  color: #000000;
  font-family: 'Press Start 2P', monospace;
  transition: all 0.05s;
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

/* Scrollbar */
::-webkit-scrollbar {
  width: 12px;
}

::-webkit-scrollbar-track {
  background: #666;
}

::-webkit-scrollbar-thumb {
  background: #a0a0a0;
  border: 1px solid #000;
}

::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
}
</style>
