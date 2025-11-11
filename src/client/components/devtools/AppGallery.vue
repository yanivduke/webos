<template>
  <div class="app-gallery">
    <div class="gallery-toolbar">
      <div class="tabs">
        <div
          class="tab"
          :class="{ active: activeTab === 'installed' }"
          @click="activeTab = 'installed'"
        >
          Installed Apps
        </div>
        <div
          class="tab"
          :class="{ active: activeTab === 'templates' }"
          @click="activeTab = 'templates'"
        >
          Templates
        </div>
      </div>
      <input
        v-model="searchQuery"
        type="text"
        class="search-box"
        placeholder="Search apps..."
      />
    </div>

    <div class="gallery-content">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-text">Loading apps...</div>
      </div>

      <!-- Error State -->
      <div v-else-if="errorMessage" class="error-state">
        <div class="error-icon">!</div>
        <div class="error-text">{{ errorMessage }}</div>
        <button class="amiga-button" @click="loadApps">Retry</button>
      </div>

      <!-- Apps Grid -->
      <div v-else class="app-grid">
        <div
          v-for="app in filteredApps"
          :key="app.id"
          class="app-card"
          @click="selectApp(app)"
          :class="{ selected: selectedApp?.id === app.id }"
        >
          <div class="app-icon">
            <img v-if="app.icon && app.icon.startsWith('data:')" :src="app.icon" alt="App Icon" />
            <svg v-else viewBox="0 0 48 48" class="icon-svg">
              <rect x="8" y="8" width="32" height="32" fill="#ff6600" stroke="#000" stroke-width="2"/>
              <rect x="12" y="12" width="24" height="6" fill="#fff"/>
              <rect x="12" y="20" width="24" height="6" fill="#fff"/>
              <rect x="12" y="28" width="24" height="6" fill="#fff"/>
            </svg>
          </div>
          <div class="app-info">
            <div class="app-name">{{ app.name }}</div>
            <div class="app-version">v{{ app.version }}</div>
            <div class="app-author">by {{ app.author }}</div>
            <div class="app-description">{{ truncateDescription(app.description) }}</div>
            <div class="app-meta">
              <span class="app-category">{{ app.category }}</span>
              <span class="app-permissions">{{ app.permissions.requested.length }} perms</span>
            </div>
          </div>
          <div class="app-actions">
            <button
              v-if="activeTab === 'templates'"
              class="amiga-button small primary"
              @click.stop="installApp(app)"
            >
              Install
            </button>
            <button
              v-if="activeTab === 'installed'"
              class="amiga-button small danger"
              @click.stop="uninstallApp(app)"
            >
              Uninstall
            </button>
            <button class="amiga-button small" @click.stop="viewDetails(app)">
              Details
            </button>
            <button
              v-if="activeTab === 'installed'"
              class="amiga-button small"
              @click.stop="runApp(app)"
            >
              Run
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredApps.length === 0" class="empty-state">
          <div class="empty-icon">📦</div>
          <div class="empty-text">
            {{ activeTab === 'installed' ? 'No installed apps' : 'No templates available' }}
          </div>
        </div>
      </div>
    </div>

    <div class="gallery-statusbar">
      {{ filteredApps.length }} apps | {{ installedApps.length }} installed
    </div>

    <!-- Details Modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click="showDetailsModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-title">App Details</div>
          <button class="close-button" @click="showDetailsModal = false">X</button>
        </div>
        <div class="modal-body" v-if="selectedApp">
          <div class="details-section">
            <div class="details-icon">
              <img v-if="selectedApp.icon && selectedApp.icon.startsWith('data:')" :src="selectedApp.icon" alt="App Icon" />
              <svg v-else viewBox="0 0 48 48" class="icon-svg">
                <rect x="8" y="8" width="32" height="32" fill="#ff6600" stroke="#000" stroke-width="2"/>
                <rect x="12" y="12" width="24" height="6" fill="#fff"/>
                <rect x="12" y="20" width="24" height="6" fill="#fff"/>
                <rect x="12" y="28" width="24" height="6" fill="#fff"/>
              </svg>
            </div>
            <div class="details-info">
              <h3>{{ selectedApp.name }}</h3>
              <div class="detail-row">
                <span class="label">Version:</span>
                <span class="value">{{ selectedApp.version }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Author:</span>
                <span class="value">{{ selectedApp.author }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Category:</span>
                <span class="value">{{ selectedApp.category }}</span>
              </div>
              <div class="detail-row">
                <span class="label">License:</span>
                <span class="value">{{ selectedApp.license || 'N/A' }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4>Description</h4>
            <p>{{ selectedApp.description }}</p>
          </div>

          <div class="detail-section">
            <h4>Window Configuration</h4>
            <div class="detail-row">
              <span class="label">Size:</span>
              <span class="value">{{ selectedApp.window.width }}x{{ selectedApp.window.height }}px</span>
            </div>
            <div class="detail-row">
              <span class="label">Resizable:</span>
              <span class="value">{{ selectedApp.window.resizable !== false ? 'Yes' : 'No' }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h4>Runtime</h4>
            <div class="detail-row">
              <span class="label">Type:</span>
              <span class="value">{{ selectedApp.runtime.type }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Entry:</span>
              <span class="value">{{ selectedApp.runtime.entry }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Multi-instance:</span>
              <span class="value">{{ selectedApp.runtime.multiInstance ? 'Yes' : 'No' }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h4>Permissions ({{ selectedApp.permissions.requested.length }})</h4>
            <div class="permissions-list">
              <div
                v-for="perm in selectedApp.permissions.requested"
                :key="perm"
                class="permission-item"
              >
                <span class="permission-badge">{{ perm }}</span>
                <span v-if="selectedApp.permissions.descriptions?.[perm]" class="permission-desc">
                  {{ selectedApp.permissions.descriptions[perm] }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="selectedApp.homepage" class="detail-section">
            <h4>Links</h4>
            <a :href="selectedApp.homepage" target="_blank" class="app-link">
              Homepage
            </a>
          </div>
        </div>
        <div class="modal-footer">
          <button class="amiga-button" @click="showDetailsModal = false">Close</button>
        </div>
      </div>
    </div>

    <!-- Notification -->
    <div v-if="notification" class="notification" :class="notification.type">
      {{ notification.message }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import type { AppManifest } from '@/sdk/types/app-manifest';

const emit = defineEmits<{
  runApp: [app: AppManifest];
}>();

const activeTab = ref<'installed' | 'templates'>('installed');
const searchQuery = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const selectedApp = ref<AppManifest | null>(null);
const showDetailsModal = ref(false);
const notification = ref<{ message: string; type: 'success' | 'error' } | null>(null);

const installedApps = ref<AppManifest[]>([]);
const templateApps = ref<AppManifest[]>([]);

const currentApps = computed(() => {
  return activeTab.value === 'installed' ? installedApps.value : templateApps.value;
});

const filteredApps = computed(() => {
  if (!searchQuery.value) {
    return currentApps.value;
  }

  const query = searchQuery.value.toLowerCase();
  return currentApps.value.filter(app =>
    app.name.toLowerCase().includes(query) ||
    app.author.toLowerCase().includes(query) ||
    app.description.toLowerCase().includes(query) ||
    app.category.toLowerCase().includes(query)
  );
});

const truncateDescription = (desc: string, maxLength = 80): string => {
  if (desc.length <= maxLength) return desc;
  return desc.substring(0, maxLength) + '...';
};

const selectApp = (app: AppManifest) => {
  selectedApp.value = app;
};

const viewDetails = (app: AppManifest) => {
  selectedApp.value = app;
  showDetailsModal.value = true;
};

const loadApps = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    // Load installed apps
    const installedResponse = await fetch('/api/sdk/apps');
    if (!installedResponse.ok) {
      throw new Error('Failed to load installed apps');
    }
    const installedData = await installedResponse.json();
    installedApps.value = installedData.apps || [];

    // Load templates
    const templatesResponse = await fetch('/api/sdk/templates');
    if (!templatesResponse.ok) {
      throw new Error('Failed to load templates');
    }
    const templatesData = await templatesResponse.json();
    templateApps.value = templatesData.templates || [];
  } catch (error) {
    console.error('Error loading apps:', error);
    errorMessage.value = error instanceof Error ? error.message : 'Failed to load apps';
  } finally {
    isLoading.value = false;
  }
};

const installApp = async (app: AppManifest) => {
  try {
    const response = await fetch('/api/sdk/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId: app.id })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to install app');
    }

    const result = await response.json();

    // Add to installed apps
    installedApps.value.push(app);

    showNotification(`${app.name} installed successfully!`, 'success');

    // Switch to installed tab
    activeTab.value = 'installed';
  } catch (error) {
    console.error('Error installing app:', error);
    const message = error instanceof Error ? error.message : 'Failed to install app';
    showNotification(message, 'error');
  }
};

const uninstallApp = async (app: AppManifest) => {
  if (!confirm(`Uninstall "${app.name}"?`)) {
    return;
  }

  try {
    const response = await fetch(`/api/sdk/apps/${app.id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to uninstall app');
    }

    // Remove from installed apps
    installedApps.value = installedApps.value.filter(a => a.id !== app.id);

    showNotification(`${app.name} uninstalled successfully!`, 'success');

    if (selectedApp.value?.id === app.id) {
      selectedApp.value = null;
    }
  } catch (error) {
    console.error('Error uninstalling app:', error);
    const message = error instanceof Error ? error.message : 'Failed to uninstall app';
    showNotification(message, 'error');
  }
};

const runApp = (app: AppManifest) => {
  emit('runApp', app);
  showNotification(`Launching ${app.name}...`, 'success');
};

const showNotification = (message: string, type: 'success' | 'error') => {
  notification.value = { message, type };
  setTimeout(() => {
    notification.value = null;
  }, 3000);
};

onMounted(() => {
  loadApps();
});
</script>

<style scoped>
.app-gallery {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
  overflow: hidden;
}

.gallery-toolbar {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: #888888;
  border-bottom: 2px solid #000000;
}

.tabs {
  display: flex;
  gap: 2px;
  flex: 1;
}

.tab {
  flex: 1;
  padding: 8px;
  text-align: center;
  font-size: 9px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  user-select: none;
  transition: all 0.1s;
}

.tab:hover {
  background: #b0b0b0;
}

.tab.active {
  background: #0055aa;
  color: #ffffff;
  border-color: #000000 #ffffff #ffffff #000000;
}

.search-box {
  width: 200px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 6px 8px;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
}

.search-box::placeholder {
  color: #888888;
}

.gallery-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: #ffffff;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
}

.loading-text {
  font-size: 10px;
  color: #0055aa;
}

.error-state {
  color: #ff0000;
}

.error-icon {
  font-size: 32px;
  background: #ff0000;
  color: #ffffff;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #000000;
  font-weight: bold;
}

.error-text {
  font-size: 9px;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  min-height: 100%;
}

.app-card {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 12px;
  cursor: pointer;
  transition: all 0.1s;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.app-card:hover {
  background: #b0b0b0;
  border-color: #ffaa00 #ffaa00 #ffaa00 #ffaa00;
}

.app-card.selected {
  background: #0055aa;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.app-card.selected .app-name,
.app-card.selected .app-version,
.app-card.selected .app-author,
.app-card.selected .app-description,
.app-card.selected .app-category,
.app-card.selected .app-permissions {
  color: #ffffff;
}

.app-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto;
}

.app-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.icon-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.3));
}

.app-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.app-name {
  font-size: 10px;
  font-weight: bold;
  color: #000000;
  text-align: center;
}

.app-version {
  font-size: 8px;
  color: #0055aa;
  text-align: center;
}

.app-author {
  font-size: 7px;
  color: #666666;
  text-align: center;
}

.app-description {
  font-size: 7px;
  color: #000000;
  line-height: 1.4;
  margin-top: 4px;
}

.app-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
}

.app-category,
.app-permissions {
  font-size: 7px;
  padding: 2px 4px;
  background: #888888;
  color: #ffffff;
  border: 1px solid #000000;
}

.app-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 8px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.1s;
}

.amiga-button:hover {
  background: #b0b0b0;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button.small {
  padding: 3px 6px;
  font-size: 7px;
}

.amiga-button.primary {
  background: #0055aa;
  color: #ffffff;
}

.amiga-button.primary:hover {
  background: #0066cc;
}

.amiga-button.danger {
  background: #ff0000;
  color: #ffffff;
}

.amiga-button.danger:hover {
  background: #ff3333;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  grid-column: 1 / -1;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 9px;
  color: #666666;
}

.gallery-statusbar {
  padding: 6px 12px;
  background: #888888;
  border-top: 2px solid #000000;
  font-size: 8px;
  color: #ffffff;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  background: #0055aa;
  color: #ffffff;
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #000000;
}

.modal-title {
  font-size: 10px;
  font-weight: bold;
}

.close-button {
  background: #ff0000;
  color: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  width: 24px;
  height: 24px;
  font-size: 10px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.close-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: #ffffff;
}

.details-section {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #888888;
}

.details-icon {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
}

.details-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.details-info {
  flex: 1;
}

.details-info h3 {
  margin: 0 0 8px 0;
  font-size: 11px;
  color: #0055aa;
}

.detail-section {
  margin-bottom: 12px;
}

.detail-section h4 {
  margin: 0 0 6px 0;
  font-size: 9px;
  color: #0055aa;
  padding-bottom: 4px;
  border-bottom: 1px solid #888888;
}

.detail-section p {
  margin: 0;
  font-size: 8px;
  line-height: 1.4;
  color: #000000;
}

.detail-row {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 8px;
}

.detail-row .label {
  color: #666666;
  min-width: 100px;
}

.detail-row .value {
  color: #000000;
  font-weight: bold;
}

.permissions-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.permission-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 7px;
}

.permission-badge {
  background: #0055aa;
  color: #ffffff;
  padding: 2px 6px;
  border: 1px solid #000000;
  white-space: nowrap;
  font-family: 'Courier New', monospace;
}

.permission-desc {
  color: #666666;
  flex: 1;
  line-height: 1.4;
}

.app-link {
  color: #0055aa;
  font-size: 8px;
  text-decoration: underline;
}

.app-link:hover {
  color: #0066cc;
}

.modal-footer {
  padding: 8px 12px;
  background: #888888;
  border-top: 2px solid #000000;
  display: flex;
  justify-content: flex-end;
}

/* Notification */
.notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 16px;
  background: #0055aa;
  color: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  font-size: 9px;
  z-index: 2000;
  animation: slideIn 0.2s ease;
}

.notification.success {
  background: #00aa00;
}

.notification.error {
  background: #ff0000;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
