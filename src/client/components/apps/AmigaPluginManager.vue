<template>
  <div class="amiga-plugin-manager">
    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="tab"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        {{ tab.label }}
      </div>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Installed Tab -->
      <div v-if="activeTab === 'installed'" class="tab-panel">
        <div class="panel-header">
          <h3>Installed Plugins ({{ installedPlugins.length }})</h3>
          <div class="stats">
            <span class="stat-item">
              <span class="stat-icon">✓</span>
              {{ statistics.enabled }} enabled
            </span>
            <span class="stat-item">
              <span class="stat-icon">⊗</span>
              {{ statistics.disabled }} disabled
            </span>
            <span class="stat-item">
              <span class="stat-icon">⚠</span>
              {{ statistics.error }} errors
            </span>
          </div>
        </div>

        <div v-if="installedPlugins.length === 0" class="empty-state">
          <div class="empty-icon">🧩</div>
          <div class="empty-text">No plugins installed</div>
          <div class="empty-hint">Visit the Available tab to install plugins</div>
        </div>

        <div v-else class="plugin-list">
          <div
            v-for="plugin in installedPlugins"
            :key="plugin.metadata.id"
            class="plugin-item"
            :class="{ selected: selectedPlugin?.metadata.id === plugin.metadata.id }"
            @click="selectPlugin(plugin)"
          >
            <div class="plugin-icon">{{ plugin.metadata.icon || '🧩' }}</div>
            <div class="plugin-info">
              <div class="plugin-name">{{ plugin.metadata.name }}</div>
              <div class="plugin-meta">
                v{{ plugin.metadata.version }} by {{ plugin.metadata.author }}
              </div>
              <div class="plugin-description">{{ plugin.metadata.description }}</div>
              <div class="plugin-permissions">
                <span
                  v-for="perm in plugin.metadata.permissions"
                  :key="perm"
                  class="permission-badge"
                >
                  {{ perm }}
                </span>
              </div>
            </div>
            <div class="plugin-actions">
              <div class="plugin-status" :class="plugin.status">
                {{ plugin.status }}
              </div>
              <div class="plugin-buttons">
                <button
                  v-if="plugin.status === 'disabled' || plugin.status === 'error'"
                  class="amiga-button small"
                  @click.stop="enablePlugin(plugin.metadata.id)"
                >
                  Enable
                </button>
                <button
                  v-if="plugin.status === 'enabled'"
                  class="amiga-button small"
                  @click.stop="disablePlugin(plugin.metadata.id)"
                >
                  Disable
                </button>
                <button
                  class="amiga-button small danger"
                  @click.stop="confirmUninstall(plugin)"
                >
                  Uninstall
                </button>
              </div>
              <div v-if="plugin.error" class="plugin-error">
                ⚠ {{ plugin.error }}
              </div>
              <div v-if="plugin.size" class="plugin-size">
                {{ formatSize(plugin.size) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Available Tab -->
      <div v-if="activeTab === 'available'" class="tab-panel">
        <div class="panel-header">
          <h3>Available Plugins</h3>
          <div class="filter-buttons">
            <button
              v-for="category in categories"
              :key="category"
              class="amiga-button small"
              :class="{ active: selectedCategory === category }"
              @click="selectedCategory = category"
            >
              {{ category }}
            </button>
          </div>
        </div>

        <div class="plugin-grid">
          <div
            v-for="plugin in availablePlugins"
            :key="plugin.id"
            class="plugin-card"
          >
            <div class="card-icon">{{ plugin.icon || '🧩' }}</div>
            <div class="card-name">{{ plugin.name }}</div>
            <div class="card-version">v{{ plugin.version }}</div>
            <div class="card-description">{{ plugin.description }}</div>
            <div class="card-category">{{ plugin.category }}</div>
            <div class="card-actions">
              <button
                class="amiga-button"
                :disabled="isPluginInstalled(plugin.id)"
                @click="installAvailablePlugin(plugin)"
              >
                {{ isPluginInstalled(plugin.id) ? 'Installed' : 'Install' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Settings Tab -->
      <div v-if="activeTab === 'settings'" class="tab-panel">
        <div class="panel-header">
          <h3>Plugin Settings</h3>
        </div>

        <div class="settings-section">
          <h4>General Settings</h4>

          <div class="setting-item">
            <label class="checkbox-label">
              <input
                v-model="config.autoUpdate"
                type="checkbox"
                @change="saveConfig"
              />
              <span class="checkbox-text">Auto-update plugins</span>
            </label>
            <div class="setting-description">
              Automatically update plugins when new versions are available
            </div>
          </div>

          <div class="setting-item">
            <label class="checkbox-label">
              <input
                v-model="config.allowExperimental"
                type="checkbox"
                @change="saveConfig"
              />
              <span class="checkbox-text">Allow experimental plugins</span>
            </label>
            <div class="setting-description">
              Enable installation of beta and experimental plugins
            </div>
          </div>

          <div class="setting-item">
            <label class="setting-label">Maximum plugins:</label>
            <input
              v-model.number="config.maxPlugins"
              type="number"
              min="1"
              max="100"
              class="setting-input"
              @change="saveConfig"
            />
            <div class="setting-description">
              Maximum number of plugins that can be installed (1-100)
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h4>Storage</h4>

          <div class="setting-item">
            <label class="setting-label">Plugin storage location:</label>
            <div class="setting-value">localStorage (browser)</div>
            <div class="setting-description">
              Plugins are stored in browser localStorage
            </div>
          </div>

          <div class="setting-item">
            <label class="setting-label">Cache size:</label>
            <div class="setting-value">{{ getCacheSize() }}</div>
          </div>

          <div class="setting-item">
            <button class="amiga-button" @click="clearCache">
              Clear Plugin Cache
            </button>
            <div class="setting-description">
              Remove all cached plugin data
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h4>Statistics</h4>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Total Plugins</div>
              <div class="stat-value">{{ statistics.total }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Enabled</div>
              <div class="stat-value">{{ statistics.enabled }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Disabled</div>
              <div class="stat-value">{{ statistics.disabled }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Size</div>
              <div class="stat-value">{{ formatSize(statistics.totalSize) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import pluginManager, { type InstalledPlugin } from '../../utils/plugin-manager';
import helloWorldPlugin from '../../plugins/hello-world-plugin';
import customThemePlugin from '../../plugins/custom-theme-plugin';
import quickNotesPlugin from '../../plugins/quick-notes-plugin';

// Tab state
const activeTab = ref('installed');
const tabs = [
  { id: 'installed', label: 'Installed', icon: '✓' },
  { id: 'available', label: 'Available', icon: '🌐' },
  { id: 'settings', label: 'Settings', icon: '⚙' }
];

// Plugin state
const installedPlugins = ref<InstalledPlugin[]>([]);
const selectedPlugin = ref<InstalledPlugin | null>(null);
const selectedCategory = ref('all');

// Categories
const categories = ['all', 'utility', 'theme', 'productivity', 'system', 'entertainment', 'developer'];

// Available plugins (sample catalog)
const samplePlugins = [
  {
    id: 'hello-world',
    name: 'Hello World',
    version: '1.0.0',
    author: 'WebOS Team',
    description: 'A simple demonstration plugin',
    icon: '👋',
    category: 'utility',
    plugin: helloWorldPlugin
  },
  {
    id: 'custom-theme',
    name: 'Custom Theme',
    version: '1.0.0',
    author: 'WebOS Team',
    description: 'Customize desktop appearance',
    icon: '🎨',
    category: 'theme',
    plugin: customThemePlugin
  },
  {
    id: 'quick-notes',
    name: 'Quick Notes',
    version: '1.0.0',
    author: 'WebOS Team',
    description: 'Sticky notes for your desktop',
    icon: '📝',
    category: 'productivity',
    plugin: quickNotesPlugin
  }
];

const availablePlugins = computed(() => {
  if (selectedCategory.value === 'all') {
    return samplePlugins;
  }
  return samplePlugins.filter(p => p.category === selectedCategory.value);
});

// Configuration
const config = ref(pluginManager.getConfig());

// Statistics
const statistics = computed(() => pluginManager.getStatistics());

let unsubscribe: (() => void) | null = null;

onMounted(() => {
  // Subscribe to plugin changes
  unsubscribe = pluginManager.subscribe((plugins) => {
    installedPlugins.value = plugins;
  });
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});

const selectPlugin = (plugin: InstalledPlugin) => {
  selectedPlugin.value = plugin;
};

const enablePlugin = async (pluginId: string) => {
  await pluginManager.enablePlugin(pluginId);
};

const disablePlugin = async (pluginId: string) => {
  await pluginManager.disablePlugin(pluginId);
};

const confirmUninstall = (plugin: InstalledPlugin) => {
  if (confirm(`Uninstall ${plugin.metadata.name}?\n\nThis will remove the plugin and all its data.`)) {
    pluginManager.uninstallPlugin(plugin.metadata.id);
    if (selectedPlugin.value?.metadata.id === plugin.metadata.id) {
      selectedPlugin.value = null;
    }
  }
};

const isPluginInstalled = (pluginId: string): boolean => {
  return installedPlugins.value.some(p => p.metadata.id === pluginId);
};

const installAvailablePlugin = async (plugin: any) => {
  if (plugin.plugin) {
    const success = await pluginManager.installPlugin(plugin.plugin);
    if (success) {
      // Optionally enable immediately
      await pluginManager.enablePlugin(plugin.id);
    }
  }
};

const saveConfig = () => {
  pluginManager.setConfig(config.value);
};

const clearCache = () => {
  if (confirm('Clear plugin cache?\n\nThis will remove cached data but keep installed plugins.')) {
    pluginManager.clearCache();
  }
};

const getCacheSize = (): string => {
  try {
    let size = 0;
    for (const key in localStorage) {
      if (key.startsWith('plugin:') || key.startsWith('webos-plugin')) {
        size += (localStorage[key]?.length || 0) * 2; // UTF-16
      }
    }
    return formatSize(size);
  } catch {
    return 'Unknown';
  }
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
</script>

<style scoped>
.amiga-plugin-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
  overflow: hidden;
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  background: #888;
  border-bottom: 2px solid #000;
  padding: 4px;
}

.tab {
  padding: 8px 16px;
  margin-right: 4px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  font-size: 9px;
  transition: all 0.1s;
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

.tab-icon {
  margin-right: 6px;
}

/* Tab Content */
.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
}

.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* Panel Header */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 2px solid #000;
}

.panel-header h3 {
  font-size: 11px;
  margin: 0;
  color: #0055aa;
}

/* Stats */
.stats {
  display: flex;
  gap: 15px;
  font-size: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-icon {
  font-size: 10px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.empty-text {
  font-size: 11px;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 8px;
  color: #888;
}

/* Plugin List */
.plugin-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.plugin-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  transition: all 0.1s;
}

.plugin-item:hover {
  background: #f0f0f0;
}

.plugin-item.selected {
  background: #0055aa;
  color: #fff;
  border-color: #000000 #ffffff #ffffff #000000;
}

.plugin-icon {
  font-size: 32px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.plugin-info {
  flex: 1;
  min-width: 0;
}

.plugin-name {
  font-size: 10px;
  font-weight: bold;
  margin-bottom: 4px;
}

.plugin-meta {
  font-size: 7px;
  opacity: 0.8;
  margin-bottom: 6px;
}

.plugin-description {
  font-size: 8px;
  margin-bottom: 6px;
  line-height: 1.4;
}

.plugin-permissions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.permission-badge {
  font-size: 7px;
  padding: 2px 6px;
  background: #ffaa00;
  color: #000;
  border-radius: 2px;
}

.plugin-item.selected .permission-badge {
  background: #fff;
  color: #0055aa;
}

.plugin-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  min-width: 120px;
}

.plugin-status {
  font-size: 8px;
  padding: 3px 8px;
  border-radius: 2px;
  font-weight: bold;
  text-transform: uppercase;
}

.plugin-status.enabled {
  background: #00ff00;
  color: #000;
}

.plugin-status.disabled {
  background: #888;
  color: #fff;
}

.plugin-status.error {
  background: #ff0000;
  color: #fff;
}

.plugin-buttons {
  display: flex;
  gap: 4px;
}

.plugin-error {
  font-size: 7px;
  color: #ff0000;
  max-width: 120px;
}

.plugin-item.selected .plugin-error {
  color: #ffaa00;
}

.plugin-size {
  font-size: 7px;
  opacity: 0.7;
}

/* Plugin Grid (Available) */
.plugin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.plugin-card {
  background: #fff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 15px;
  text-align: center;
  transition: all 0.1s;
}

.plugin-card:hover {
  background: #f0f0f0;
  transform: translateY(-2px);
}

.card-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.card-name {
  font-size: 10px;
  font-weight: bold;
  margin-bottom: 4px;
}

.card-version {
  font-size: 7px;
  opacity: 0.7;
  margin-bottom: 8px;
}

.card-description {
  font-size: 8px;
  line-height: 1.4;
  margin-bottom: 8px;
  min-height: 40px;
}

.card-category {
  font-size: 7px;
  padding: 3px 8px;
  background: #0055aa;
  color: #fff;
  display: inline-block;
  margin-bottom: 10px;
  border-radius: 2px;
}

.card-actions {
  margin-top: 10px;
}

/* Filter Buttons */
.filter-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

/* Settings */
.settings-section {
  background: #fff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 15px;
  margin-bottom: 15px;
}

.settings-section h4 {
  font-size: 10px;
  margin: 0 0 15px 0;
  color: #0055aa;
}

.setting-item {
  margin-bottom: 15px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 9px;
}

.checkbox-text {
  user-select: none;
}

.setting-label {
  font-size: 9px;
  display: block;
  margin-bottom: 6px;
}

.setting-value {
  font-size: 9px;
  color: #0055aa;
  margin-bottom: 4px;
}

.setting-input {
  width: 80px;
  padding: 4px 8px;
  font-size: 9px;
  font-family: monospace;
  border: 2px solid #000;
}

.setting-description {
  font-size: 7px;
  color: #666;
  margin-top: 4px;
  line-height: 1.4;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.stat-card {
  background: #0055aa;
  color: #fff;
  padding: 15px;
  text-align: center;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.stat-label {
  font-size: 8px;
  margin-bottom: 8px;
  opacity: 0.9;
}

.stat-value {
  font-size: 16px;
  font-weight: bold;
}

/* Amiga Button */
.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 12px;
  font-size: 8px;
  cursor: pointer;
  color: #000000;
  font-family: 'Press Start 2P', monospace;
  transition: all 0.1s;
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
  padding: 4px 8px;
  font-size: 7px;
}

.amiga-button.danger {
  background: #ff6666;
}

.amiga-button.active {
  background: #0055aa;
  color: #fff;
}
</style>
