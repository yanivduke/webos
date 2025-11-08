<template>
  <div class="settings-overlay" @click="emit('close')">
    <div class="settings-window" @click.stop>
      <!-- Title Bar -->
      <div class="settings-titlebar">
        <span class="settings-title">Email Settings</span>
        <button class="close-button" @click="emit('close')">×</button>
      </div>

      <!-- Tabs -->
      <div class="settings-tabs">
        <button
          :class="['tab-button', { active: activeTab === 'general' }]"
          @click="activeTab = 'general'"
        >
          General
        </button>
        <button
          :class="['tab-button', { active: activeTab === 'filters' }]"
          @click="activeTab = 'filters'"
        >
          Filters
        </button>
        <button
          :class="['tab-button', { active: activeTab === 'templates' }]"
          @click="activeTab = 'templates'"
        >
          Templates
        </button>
        <button
          :class="['tab-button', { active: activeTab === 'display' }]"
          @click="activeTab = 'display'"
        >
          Display
        </button>
      </div>

      <!-- Tab Content -->
      <div class="settings-content">
        <!-- General Tab -->
        <div v-if="activeTab === 'general'" class="tab-panel">
          <h3>General Settings</h3>

          <div class="setting-group">
            <label class="setting-label">Your Name</label>
            <input
              type="text"
              v-model="settings.name"
              class="setting-input"
              placeholder="John Doe"
            />
          </div>

          <div class="setting-group">
            <label class="setting-label">Your Email Address</label>
            <input
              type="email"
              v-model="settings.email"
              class="setting-input"
              placeholder="user@workbench.local"
            />
          </div>

          <div class="setting-group">
            <label class="setting-label">Email Signature</label>
            <textarea
              v-model="settings.signature"
              class="setting-textarea"
              placeholder="Best regards,&#10;Your Name"
            ></textarea>
          </div>

          <div class="setting-group">
            <label class="setting-checkbox">
              <input type="checkbox" v-model="settings.autoAddSignature" />
              Automatically add signature to new emails
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-checkbox">
              <input type="checkbox" v-model="settings.markAsReadOnView" />
              Mark emails as read when viewed
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-checkbox">
              <input type="checkbox" v-model="settings.showNotifications" />
              Show desktop notifications for new emails
            </label>
          </div>
        </div>

        <!-- Filters Tab -->
        <div v-if="activeTab === 'filters'" class="tab-panel">
          <div class="panel-header">
            <h3>Email Filters</h3>
            <button class="amiga-button" @click="openFilterDialog()">
              + New Filter
            </button>
          </div>

          <div v-if="filters.length === 0" class="empty-state">
            <p>No filters configured</p>
            <p class="hint">Filters automatically organize your emails</p>
          </div>

          <div v-else class="filters-list">
            <div
              v-for="filter in filters"
              :key="filter.id"
              class="filter-item"
            >
              <div class="filter-header">
                <label class="filter-checkbox">
                  <input
                    type="checkbox"
                    :checked="filter.enabled"
                    @change="toggleFilter(filter.id)"
                  />
                  <strong>{{ filter.name }}</strong>
                </label>
                <div class="filter-actions">
                  <button class="icon-button" @click="openFilterDialog(filter)">✎</button>
                  <button class="icon-button danger" @click="deleteFilter(filter.id)">×</button>
                </div>
              </div>
              <div class="filter-details">
                <div class="filter-conditions">
                  <strong>If:</strong>
                  <span v-for="(condition, i) in filter.conditions" :key="i">
                    {{ i > 0 ? ' AND ' : '' }}
                    {{ condition.field }} {{ condition.operator }} "{{ condition.value }}"
                  </span>
                </div>
                <div class="filter-actions-desc">
                  <strong>Then:</strong>
                  <span v-for="(action, i) in filter.actions" :key="i">
                    {{ i > 0 ? ', ' : '' }}
                    {{ formatAction(action) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Templates Tab -->
        <div v-if="activeTab === 'templates'" class="tab-panel">
          <div class="panel-header">
            <h3>Email Templates</h3>
            <button class="amiga-button" @click="openTemplateDialog()">
              + New Template
            </button>
          </div>

          <div v-if="templates.length === 0" class="empty-state">
            <p>No templates saved</p>
            <p class="hint">Templates help you write common emails faster</p>
          </div>

          <div v-else class="templates-list">
            <div
              v-for="template in templates"
              :key="template.id"
              class="template-item"
            >
              <div class="template-header">
                <strong>{{ template.name }}</strong>
                <button class="icon-button danger" @click="deleteTemplate(template.id)">×</button>
              </div>
              <div class="template-subject">Subject: {{ template.subject }}</div>
              <div class="template-body">{{ truncate(template.body, 100) }}</div>
            </div>
          </div>
        </div>

        <!-- Display Tab -->
        <div v-if="activeTab === 'display'" class="tab-panel">
          <h3>Display Settings</h3>

          <div class="setting-group">
            <label class="setting-label">Font Size</label>
            <select v-model="settings.fontSize" class="setting-select">
              <option value="small">Small</option>
              <option value="normal">Normal</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div class="setting-group">
            <label class="setting-label">Emails Per Page</label>
            <select v-model="settings.emailsPerPage" class="setting-select">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </div>

          <div class="setting-group">
            <label class="setting-label">Preview Pane Position</label>
            <select v-model="settings.previewPanePosition" class="setting-select">
              <option value="right">Right</option>
              <option value="bottom">Bottom</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          <div class="setting-group">
            <label class="setting-checkbox">
              <input type="checkbox" v-model="settings.showEmailPreview" />
              Show email preview in list
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-checkbox">
              <input type="checkbox" v-model="settings.compactView" />
              Use compact view for email list
            </label>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="settings-footer">
        <button class="amiga-button primary" @click="saveSettings">
          Save Settings
        </button>
        <button class="amiga-button" @click="emit('close')">
          Cancel
        </button>
      </div>
    </div>

    <!-- Filter Dialog -->
    <div v-if="filterDialogVisible" class="dialog-overlay" @click="closeFilterDialog">
      <div class="dialog-box large" @click.stop>
        <div class="dialog-header">
          {{ editingFilter ? 'Edit Filter' : 'New Filter' }}
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label class="form-label">Filter Name *</label>
            <input
              type="text"
              v-model="filterForm.name"
              class="form-input"
              placeholder="My Filter"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Conditions (All must match)</label>
            <div class="conditions-list">
              <div v-for="(condition, index) in filterForm.conditions" :key="index" class="condition-row">
                <select v-model="condition.field" class="form-select">
                  <option value="from">From</option>
                  <option value="to">To</option>
                  <option value="subject">Subject</option>
                  <option value="body">Body</option>
                </select>
                <select v-model="condition.operator" class="form-select">
                  <option value="contains">contains</option>
                  <option value="equals">equals</option>
                  <option value="startsWith">starts with</option>
                  <option value="endsWith">ends with</option>
                </select>
                <input
                  type="text"
                  v-model="condition.value"
                  class="form-input"
                  placeholder="value"
                />
                <button class="icon-button danger" @click="removeCondition(index)">×</button>
              </div>
            </div>
            <button class="amiga-button small" @click="addCondition">+ Add Condition</button>
          </div>

          <div class="form-group">
            <label class="form-label">Actions</label>
            <div class="actions-list">
              <div v-for="(action, index) in filterForm.actions" :key="index" class="action-row">
                <select v-model="action.type" class="form-select">
                  <option value="move">Move to folder</option>
                  <option value="markRead">Mark as read</option>
                  <option value="star">Star</option>
                  <option value="delete">Delete</option>
                  <option value="label">Add label</option>
                </select>
                <input
                  v-if="action.type === 'move' || action.type === 'label'"
                  type="text"
                  v-model="action.value"
                  class="form-input"
                  :placeholder="action.type === 'move' ? 'folder name' : 'label name'"
                />
                <button class="icon-button danger" @click="removeAction(index)">×</button>
              </div>
            </div>
            <button class="amiga-button small" @click="addAction">+ Add Action</button>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="amiga-button" @click="saveFilter">
            {{ editingFilter ? 'Update' : 'Create' }}
          </button>
          <button class="amiga-button" @click="closeFilterDialog">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Template Dialog -->
    <div v-if="templateDialogVisible" class="dialog-overlay" @click="closeTemplateDialog">
      <div class="dialog-box" @click.stop>
        <div class="dialog-header">New Template</div>
        <div class="dialog-body">
          <div class="form-group">
            <label class="form-label">Template Name *</label>
            <input
              type="text"
              v-model="templateForm.name"
              class="form-input"
              placeholder="My Template"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Subject</label>
            <input
              type="text"
              v-model="templateForm.subject"
              class="form-input"
              placeholder="Email subject"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Body</label>
            <textarea
              v-model="templateForm.body"
              class="form-textarea"
              placeholder="Email body..."
            ></textarea>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="amiga-button" @click="saveTemplate">Create</button>
          <button class="amiga-button" @click="closeTemplateDialog">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { emailManager, type EmailFilter, type EmailTemplate, type FilterCondition, type FilterAction } from '../../utils/email-manager';

// ============================================================================
// EMITS
// ============================================================================

const emit = defineEmits<{
  (e: 'close'): void;
}>();

// ============================================================================
// STATE
// ============================================================================

const activeTab = ref<'general' | 'filters' | 'templates' | 'display'>('general');

const settings = ref({
  name: 'User',
  email: 'user@workbench.local',
  signature: 'Best regards,\nUser',
  autoAddSignature: true,
  markAsReadOnView: true,
  showNotifications: true,
  fontSize: 'normal',
  emailsPerPage: 20,
  previewPanePosition: 'right',
  showEmailPreview: false,
  compactView: false
});

const filters = ref<EmailFilter[]>([]);
const templates = ref<EmailTemplate[]>([]);

const filterDialogVisible = ref(false);
const editingFilter = ref<EmailFilter | null>(null);
const filterForm = ref({
  name: '',
  enabled: true,
  conditions: [] as FilterCondition[],
  actions: [] as FilterAction[]
});

const templateDialogVisible = ref(false);
const templateForm = ref({
  name: '',
  subject: '',
  body: ''
});

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(() => {
  loadSettings();
  loadFilters();
  loadTemplates();
});

// ============================================================================
// DATA LOADING
// ============================================================================

function loadSettings(): void {
  const stored = localStorage.getItem('webos-email-settings');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      Object.assign(settings.value, parsed);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }
}

function loadFilters(): void {
  filters.value = emailManager.getFilters();
}

function loadTemplates(): void {
  templates.value = emailManager.getTemplates();
}

// ============================================================================
// GENERAL SETTINGS
// ============================================================================

function saveSettings(): void {
  try {
    localStorage.setItem('webos-email-settings', JSON.stringify(settings.value));
    alert('Settings saved');
    emit('close');
  } catch (error) {
    console.error('Failed to save settings:', error);
    alert('Failed to save settings');
  }
}

// ============================================================================
// FILTER OPERATIONS
// ============================================================================

function openFilterDialog(filter?: EmailFilter): void {
  if (filter) {
    editingFilter.value = filter;
    filterForm.value = {
      name: filter.name,
      enabled: filter.enabled,
      conditions: JSON.parse(JSON.stringify(filter.conditions)),
      actions: JSON.parse(JSON.stringify(filter.actions))
    };
  } else {
    editingFilter.value = null;
    filterForm.value = {
      name: '',
      enabled: true,
      conditions: [{ field: 'from', operator: 'contains', value: '' }],
      actions: [{ type: 'move', value: '' }]
    };
  }
  filterDialogVisible.value = true;
}

function closeFilterDialog(): void {
  filterDialogVisible.value = false;
  editingFilter.value = null;
}

function addCondition(): void {
  filterForm.value.conditions.push({
    field: 'from',
    operator: 'contains',
    value: ''
  });
}

function removeCondition(index: number): void {
  filterForm.value.conditions.splice(index, 1);
}

function addAction(): void {
  filterForm.value.actions.push({
    type: 'move',
    value: ''
  });
}

function removeAction(index: number): void {
  filterForm.value.actions.splice(index, 1);
}

function saveFilter(): void {
  if (!filterForm.value.name) {
    alert('Filter name is required');
    return;
  }

  if (filterForm.value.conditions.length === 0) {
    alert('At least one condition is required');
    return;
  }

  if (filterForm.value.actions.length === 0) {
    alert('At least one action is required');
    return;
  }

  if (editingFilter.value) {
    emailManager.updateFilter(editingFilter.value.id, {
      name: filterForm.value.name,
      enabled: filterForm.value.enabled,
      conditions: filterForm.value.conditions,
      actions: filterForm.value.actions
    });
  } else {
    emailManager.createFilter({
      name: filterForm.value.name,
      enabled: filterForm.value.enabled,
      conditions: filterForm.value.conditions,
      actions: filterForm.value.actions
    });
  }

  loadFilters();
  closeFilterDialog();
}

function toggleFilter(filterId: string): void {
  const filter = filters.value.find(f => f.id === filterId);
  if (filter) {
    emailManager.updateFilter(filterId, { enabled: !filter.enabled });
    loadFilters();
  }
}

function deleteFilter(filterId: string): void {
  if (confirm('Delete this filter?')) {
    emailManager.deleteFilter(filterId);
    loadFilters();
  }
}

function formatAction(action: FilterAction): string {
  switch (action.type) {
    case 'move':
      return `move to "${action.value}"`;
    case 'markRead':
      return 'mark as read';
    case 'star':
      return 'star';
    case 'delete':
      return 'delete';
    case 'label':
      return `add label "${action.value}"`;
    default:
      return action.type;
  }
}

// ============================================================================
// TEMPLATE OPERATIONS
// ============================================================================

function openTemplateDialog(): void {
  templateForm.value = {
    name: '',
    subject: '',
    body: ''
  };
  templateDialogVisible.value = true;
}

function closeTemplateDialog(): void {
  templateDialogVisible.value = false;
}

function saveTemplate(): void {
  if (!templateForm.value.name) {
    alert('Template name is required');
    return;
  }

  emailManager.createTemplate({
    name: templateForm.value.name,
    subject: templateForm.value.subject,
    body: templateForm.value.body
  });

  loadTemplates();
  closeTemplateDialog();
}

function deleteTemplate(templateId: string): void {
  if (confirm('Delete this template?')) {
    emailManager.deleteTemplate(templateId);
    loadTemplates();
  }
}

// ============================================================================
// UTILITY
// ============================================================================

function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}
</script>

<style scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.settings-window {
  width: 90%;
  max-width: 700px;
  height: 80%;
  max-height: 600px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  display: flex;
  flex-direction: column;
  font-family: 'Press Start 2P', monospace;
}

.settings-titlebar {
  padding: 8px;
  background: #0055aa;
  color: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #000000;
}

.settings-title {
  font-size: 9px;
}

.close-button {
  background: #ff0000;
  color: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  width: 20px;
  height: 20px;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.close-button:hover {
  background: #cc0000;
}

.settings-tabs {
  display: flex;
  background: #888888;
  border-bottom: 2px solid #000000;
}

.tab-button {
  flex: 1;
  padding: 8px;
  background: #a0a0a0;
  border: none;
  border-right: 1px solid #000000;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  cursor: pointer;
}

.tab-button:last-child {
  border-right: none;
}

.tab-button:hover {
  background: #b0b0b0;
}

.tab-button.active {
  background: #0055aa;
  color: #ffffff;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #ffffff;
}

.tab-panel h3 {
  margin: 0 0 16px 0;
  font-size: 10px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-header h3 {
  margin: 0;
}

.setting-group {
  margin-bottom: 16px;
}

.setting-label {
  display: block;
  font-size: 7px;
  margin-bottom: 6px;
  font-weight: bold;
}

.setting-input,
.setting-select {
  width: 100%;
  padding: 6px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
}

.setting-textarea {
  width: 100%;
  min-height: 80px;
  padding: 6px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  resize: vertical;
}

.setting-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 8px;
  cursor: pointer;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 12px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
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

.amiga-button.primary {
  background: #0055aa;
  color: #ffffff;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #888888;
}

.empty-state p {
  margin: 8px 0;
  font-size: 8px;
}

.empty-state .hint {
  font-size: 7px;
}

.filters-list,
.templates-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-item,
.template-item {
  padding: 12px;
  background: #f0f0f0;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.filter-header,
.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.filter-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 8px;
}

.filter-actions {
  display: flex;
  gap: 4px;
}

.icon-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 2px 6px;
  font-size: 10px;
  cursor: pointer;
}

.icon-button:hover {
  background: #b0b0b0;
}

.icon-button.danger {
  background: #ff0000;
  color: #ffffff;
}

.icon-button.danger:hover {
  background: #cc0000;
}

.filter-details {
  font-size: 7px;
  line-height: 1.6;
}

.filter-conditions,
.filter-actions-desc {
  margin: 4px 0;
}

.template-subject,
.template-body {
  font-size: 7px;
  margin: 4px 0;
  color: #666666;
}

.settings-footer {
  padding: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.dialog-box {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  min-width: 400px;
  max-width: 500px;
}

.dialog-box.large {
  max-width: 600px;
}

.dialog-header {
  padding: 8px;
  background: #0055aa;
  color: #ffffff;
  font-size: 9px;
  border-bottom: 2px solid #000000;
}

.dialog-body {
  padding: 16px;
  max-height: 500px;
  overflow-y: auto;
}

.dialog-footer {
  padding: 8px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 7px;
  margin-bottom: 6px;
  font-weight: bold;
}

.form-input,
.form-select {
  width: 100%;
  padding: 6px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
}

.form-textarea {
  width: 100%;
  min-height: 100px;
  padding: 6px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  resize: vertical;
}

.conditions-list,
.actions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.condition-row,
.action-row {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr 40px;
  gap: 8px;
  align-items: center;
}

::-webkit-scrollbar {
  width: 16px;
  height: 16px;
}

::-webkit-scrollbar-track {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

::-webkit-scrollbar-thumb {
  background: #0055aa;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}
</style>
