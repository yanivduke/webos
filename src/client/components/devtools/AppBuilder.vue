<template>
  <div class="app-builder">
    <div class="wizard-header">
      <h3>App Builder</h3>
      <p class="wizard-subtitle">Create custom WebOS applications</p>
    </div>

    <!-- Wizard Progress Indicator -->
    <div class="wizard-progress">
      <div
        v-for="(step, index) in steps"
        :key="step.id"
        class="progress-step"
        :class="{
          completed: currentStep > index,
          active: currentStep === index
        }"
      >
        <div class="step-circle">{{ index + 1 }}</div>
        <div class="step-label">{{ step.label }}</div>
      </div>
    </div>

    <!-- Wizard Content -->
    <div class="wizard-content">
      <!-- Step 1: Template Selection -->
      <div v-if="currentStep === 0" class="step-container">
        <h4 class="step-title">Choose a Template</h4>

        <div class="templates-grid">
          <div
            v-for="template in templates"
            :key="template.id"
            class="template-card"
            :class="{ selected: formData.templateId === template.id }"
            @click="selectTemplate(template.id)"
          >
            <div class="template-icon">{{ template.icon }}</div>
            <div class="template-name">{{ template.name }}</div>
            <div class="template-description">{{ template.description }}</div>
          </div>
        </div>

        <div v-if="formData.templateId" class="template-preview">
          <div class="preview-header">Template Preview</div>
          <div class="preview-content">
            <p>{{ selectedTemplate?.details }}</p>
            <ul v-if="selectedTemplate?.features">
              <li v-for="(feature, idx) in selectedTemplate.features" :key="idx">
                {{ feature }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Step 2: App Configuration -->
      <div v-if="currentStep === 1" class="step-container">
        <h4 class="step-title">Configure Your App</h4>

        <div class="config-form">
          <div class="form-group">
            <label>App Name: *</label>
            <input
              v-model="formData.name"
              type="text"
              class="amiga-input"
              placeholder="My Awesome App"
              @input="onNameChange"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>App ID: *</label>
              <div class="id-input-group">
                <input
                  v-model="formData.id"
                  type="text"
                  class="amiga-input"
                  placeholder="my-awesome-app"
                  :disabled="autoGenerateId"
                />
                <button
                  class="amiga-button tiny"
                  :class="{ active: autoGenerateId }"
                  @click="autoGenerateId = !autoGenerateId"
                >
                  Auto
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>Version:</label>
              <input
                v-model="formData.version"
                type="text"
                class="amiga-input"
                placeholder="1.0.0"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Author:</label>
            <input
              v-model="formData.author"
              type="text"
              class="amiga-input"
              placeholder="Your Name"
            />
          </div>

          <div class="form-group">
            <label>Description:</label>
            <textarea
              v-model="formData.description"
              class="amiga-textarea"
              rows="3"
              placeholder="A brief description of what your app does..."
            ></textarea>
          </div>

          <div class="form-group">
            <label>Category: *</label>
            <select v-model="formData.category" class="amiga-select">
              <option value="productivity">Productivity</option>
              <option value="utility">Utility</option>
              <option value="entertainment">Entertainment</option>
              <option value="developer">Developer</option>
              <option value="system">System</option>
            </select>
          </div>

          <div class="form-group">
            <label>Icon:</label>
            <div class="icon-selector">
              <div
                v-for="icon in availableIcons"
                :key="icon"
                class="icon-option"
                :class="{ selected: formData.icon === icon }"
                @click="formData.icon = icon"
              >
                {{ icon }}
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Window Width:</label>
              <input
                v-model.number="formData.windowWidth"
                type="number"
                class="amiga-input"
                placeholder="600"
                min="300"
                max="1200"
              />
            </div>

            <div class="form-group">
              <label>Window Height:</label>
              <input
                v-model.number="formData.windowHeight"
                type="number"
                class="amiga-input"
                placeholder="400"
                min="200"
                max="800"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: Permissions -->
      <div v-if="currentStep === 2" class="step-container">
        <h4 class="step-title">Select Permissions</h4>
        <p class="step-subtitle">Choose which system resources your app can access</p>

        <div class="permissions-list">
          <div
            v-for="permission in availablePermissions"
            :key="permission.id"
            class="permission-item"
            :class="{ dangerous: permission.dangerous }"
          >
            <div class="permission-header">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  class="amiga-checkbox"
                  :value="permission.id"
                  v-model="formData.permissions"
                />
                <span class="permission-name">
                  {{ permission.name }}
                  <span v-if="permission.dangerous" class="danger-badge">⚠</span>
                </span>
              </label>
            </div>
            <div class="permission-description">
              {{ permission.description }}
            </div>
          </div>
        </div>

        <div v-if="hasDangerousPermissions" class="warning-box">
          <div class="warning-header">⚠ Warning</div>
          <div class="warning-text">
            Your app requests dangerous permissions. Users will be prompted to grant these
            permissions before the app can access these resources.
          </div>
        </div>
      </div>

      <!-- Step 4: Code Editor -->
      <div v-if="currentStep === 3" class="step-container">
        <h4 class="step-title">Edit Code</h4>

        <div class="editor-tabs">
          <button
            v-for="tab in editorTabs"
            :key="tab.id"
            class="editor-tab"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="code-editor-container">
          <textarea
            v-if="activeTab === 'main'"
            v-model="formData.code.main"
            class="code-editor"
            spellcheck="false"
          ></textarea>

          <textarea
            v-if="activeTab === 'styles'"
            v-model="formData.code.styles"
            class="code-editor"
            spellcheck="false"
          ></textarea>

          <textarea
            v-if="activeTab === 'config'"
            v-model="formData.code.config"
            class="code-editor"
            spellcheck="false"
          ></textarea>
        </div>

        <div class="editor-actions">
          <button class="amiga-button small" @click="testRun">
            ▶ Test Run
          </button>
          <button class="amiga-button small" @click="formatCode">
            Format Code
          </button>
        </div>
      </div>

      <!-- Step 5: Review & Install -->
      <div v-if="currentStep === 4" class="step-container">
        <h4 class="step-title">Review & Install</h4>

        <div class="review-sections">
          <div class="review-section">
            <h5>App Information</h5>
            <div class="review-item">
              <span class="review-label">Name:</span>
              <span class="review-value">{{ formData.name }}</span>
            </div>
            <div class="review-item">
              <span class="review-label">ID:</span>
              <span class="review-value">{{ formData.id }}</span>
            </div>
            <div class="review-item">
              <span class="review-label">Version:</span>
              <span class="review-value">{{ formData.version }}</span>
            </div>
            <div class="review-item">
              <span class="review-label">Author:</span>
              <span class="review-value">{{ formData.author || 'N/A' }}</span>
            </div>
            <div class="review-item">
              <span class="review-label">Category:</span>
              <span class="review-value">{{ formData.category }}</span>
            </div>
            <div class="review-item">
              <span class="review-label">Window Size:</span>
              <span class="review-value">
                {{ formData.windowWidth }}x{{ formData.windowHeight }}
              </span>
            </div>
          </div>

          <div class="review-section">
            <h5>Permissions ({{ formData.permissions.length }})</h5>
            <div class="permissions-summary">
              <div
                v-for="permId in formData.permissions"
                :key="permId"
                class="permission-badge"
              >
                {{ getPermissionName(permId) }}
              </div>
              <div v-if="formData.permissions.length === 0" class="no-permissions">
                No permissions requested
              </div>
            </div>
          </div>

          <div class="review-section">
            <h5>Generated Manifest</h5>
            <pre class="manifest-preview">{{ manifestPreview }}</pre>
          </div>
        </div>
      </div>

      <!-- Success Message -->
      <div v-if="showSuccess" class="success-message">
        <div class="success-icon">✓</div>
        <div class="success-text">App installed successfully!</div>
        <div class="success-actions">
          <button class="amiga-button primary" @click="runApp">
            Run App
          </button>
          <button class="amiga-button" @click="resetWizard">
            Create Another
          </button>
        </div>
      </div>
    </div>

    <!-- Wizard Navigation -->
    <div class="wizard-actions">
      <button
        class="amiga-button"
        @click="previousStep"
        :disabled="currentStep === 0 || showSuccess"
      >
        ← Back
      </button>

      <button
        class="amiga-button"
        @click="cancelWizard"
        :disabled="showSuccess"
      >
        Cancel
      </button>

      <button
        v-if="currentStep < steps.length - 1"
        class="amiga-button primary"
        @click="nextStep"
        :disabled="!canProceed"
      >
        Next →
      </button>

      <button
        v-if="currentStep === steps.length - 1 && !showSuccess"
        class="amiga-button primary install-button"
        @click="installApp"
        :disabled="installing"
      >
        {{ installing ? 'Installing...' : '✓ Install App' }}
      </button>

      <button
        v-if="currentStep === steps.length - 1"
        class="amiga-button"
        @click="exportApp"
      >
        ↓ Export
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { APP_TEMPLATES, DEFAULT_TEMPLATE_STYLES } from './app-templates';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  details: string;
  features: string[];
}

interface Permission {
  id: string;
  name: string;
  description: string;
  dangerous: boolean;
}

interface AppFormData {
  templateId: string;
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  category: string;
  icon: string;
  windowWidth: number;
  windowHeight: number;
  permissions: string[];
  code: {
    main: string;
    styles: string;
    config: string;
  };
}

// Wizard steps
const steps = [
  { id: 'template', label: 'Template' },
  { id: 'config', label: 'Configure' },
  { id: 'permissions', label: 'Permissions' },
  { id: 'code', label: 'Code' },
  { id: 'review', label: 'Review' }
];

const currentStep = ref(0);
const showSuccess = ref(false);
const installing = ref(false);

// Templates
const templates = ref<Template[]>([
  {
    id: 'blank',
    name: 'Blank App',
    description: 'Start from scratch with a minimal template',
    icon: '📄',
    details: 'A minimal template with basic structure. Perfect for building custom applications from the ground up.',
    features: ['Basic component structure', 'Amiga styling setup', 'Window integration ready']
  },
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'Scientific calculator application',
    icon: '🔢',
    details: 'A fully functional calculator template with basic and scientific operations.',
    features: ['Arithmetic operations', 'Scientific functions', 'Memory functions', 'Keyboard support']
  },
  {
    id: 'notepad',
    name: 'Notepad',
    description: 'Simple text editor',
    icon: '📝',
    details: 'A basic text editor template with file operations and text manipulation.',
    features: ['Text editing', 'File save/load', 'Find & replace', 'Word count']
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Advanced template with custom configuration',
    icon: '⚙️',
    details: 'Advanced template for experienced developers with full customization options.',
    features: ['Complete API access', 'Custom event handlers', 'Advanced state management', 'Plugin support']
  }
]);

// Available icons
const availableIcons = [
  '📱', '💻', '🎮', '🎨', '🎵', '📊', '🔧', '⚙️',
  '📝', '📁', '🔍', '📷', '🎬', '📈', '💾', '🌐',
  '📅', '⏰', '🔔', '📮', '🎯', '🎲', '🧮', '🗂️'
];

// Available permissions
const availablePermissions = ref<Permission[]>([
  {
    id: 'fs.read',
    name: 'File System - Read',
    description: 'Read files and directories from the virtual file system',
    dangerous: false
  },
  {
    id: 'fs.write',
    name: 'File System - Write',
    description: 'Create and modify files in the virtual file system',
    dangerous: true
  },
  {
    id: 'fs.delete',
    name: 'File System - Delete',
    description: 'Delete files and directories from the virtual file system',
    dangerous: true
  },
  {
    id: 'network',
    name: 'Network Access',
    description: 'Make HTTP requests to external servers',
    dangerous: true
  },
  {
    id: 'clipboard',
    name: 'Clipboard',
    description: 'Read from and write to the system clipboard',
    dangerous: false
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Display system notifications to the user',
    dangerous: false
  },
  {
    id: 'system.info',
    name: 'System Info',
    description: 'Access system information (CPU, memory, disk usage)',
    dangerous: false
  },
  {
    id: 'window.management',
    name: 'Window Management',
    description: 'Create, modify, and close application windows',
    dangerous: false
  }
]);

// Form data
const formData = ref<AppFormData>({
  templateId: '',
  id: '',
  name: '',
  version: '1.0.0',
  author: '',
  description: '',
  category: 'utility',
  icon: '📱',
  windowWidth: 600,
  windowHeight: 400,
  permissions: [],
  code: {
    main: '',
    styles: '',
    config: ''
  }
});

const autoGenerateId = ref(true);

// Editor tabs
const editorTabs = [
  { id: 'main', label: 'Main Code' },
  { id: 'styles', label: 'Styles' },
  { id: 'config', label: 'Config' }
];

const activeTab = ref('main');

// Computed properties
const selectedTemplate = computed(() => {
  return templates.value.find(t => t.id === formData.value.templateId);
});

const hasDangerousPermissions = computed(() => {
  return formData.value.permissions.some(permId => {
    const perm = availablePermissions.value.find(p => p.id === permId);
    return perm?.dangerous;
  });
});

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0: // Template selection
      return !!formData.value.templateId;
    case 1: // Configuration
      return !!(formData.value.name && formData.value.id && formData.value.category);
    case 2: // Permissions
      return true; // Always can proceed
    case 3: // Code
      return !!formData.value.code.main;
    case 4: // Review
      return true;
    default:
      return false;
  }
});

const manifestPreview = computed(() => {
  const manifest = {
    id: formData.value.id,
    name: formData.value.name,
    version: formData.value.version,
    author: formData.value.author,
    description: formData.value.description,
    category: formData.value.category,
    icon: formData.value.icon,
    window: {
      width: formData.value.windowWidth,
      height: formData.value.windowHeight
    },
    permissions: formData.value.permissions
  };
  return JSON.stringify(manifest, null, 2);
});

// Methods
const selectTemplate = async (templateId: string) => {
  formData.value.templateId = templateId;

  // Load template code from API
  try {
    const response = await fetch(`/api/sdk/templates/${templateId}`);
    if (response.ok) {
      const templateData = await response.json();
      formData.value.code.main = templateData.main || getDefaultTemplateCode(templateId);
      formData.value.code.styles = templateData.styles || getDefaultTemplateStyles();
      formData.value.code.config = templateData.config || '{}';
    } else {
      // Fallback to default templates
      formData.value.code.main = getDefaultTemplateCode(templateId);
      formData.value.code.styles = getDefaultTemplateStyles();
      formData.value.code.config = '{}';
    }
  } catch (error) {
    console.warn('Failed to load template from API, using defaults', error);
    formData.value.code.main = getDefaultTemplateCode(templateId);
    formData.value.code.styles = getDefaultTemplateStyles();
    formData.value.code.config = '{}';
  }
};

const getDefaultTemplateCode = (templateId: string): string => {
  return APP_TEMPLATES[templateId as keyof typeof APP_TEMPLATES] || APP_TEMPLATES.blank;
};

const getDefaultTemplateStyles = (): string => {
  return DEFAULT_TEMPLATE_STYLES;
};

const onNameChange = () => {
  if (autoGenerateId.value) {
    formData.value.id = formData.value.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
};

const getPermissionName = (permId: string): string => {
  const perm = availablePermissions.value.find(p => p.id === permId);
  return perm?.name || permId;
};

const nextStep = () => {
  if (canProceed.value && currentStep.value < steps.length - 1) {
    currentStep.value++;
  }
};

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

const cancelWizard = () => {
  if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
    resetWizard();
  }
};

const resetWizard = () => {
  currentStep.value = 0;
  showSuccess.value = false;
  formData.value = {
    templateId: '',
    id: '',
    name: '',
    version: '1.0.0',
    author: '',
    description: '',
    category: 'utility',
    icon: '📱',
    windowWidth: 600,
    windowHeight: 400,
    permissions: [],
    code: {
      main: '',
      styles: '',
      config: ''
    }
  };
};

const testRun = () => {
  alert('Test Run feature - This would preview your app in a sandboxed window');
  // TODO: Implement preview functionality
};

const formatCode = () => {
  alert('Format Code feature - This would auto-format your code');
  // TODO: Implement code formatting
};

const installApp = async () => {
  if (installing.value) return;

  // Validate manifest
  if (!formData.value.id || !formData.value.name) {
    alert('App ID and Name are required');
    return;
  }

  installing.value = true;

  try {
    const manifest = {
      id: formData.value.id,
      name: formData.value.name,
      version: formData.value.version,
      author: formData.value.author,
      description: formData.value.description,
      category: formData.value.category,
      icon: formData.value.icon,
      window: {
        width: formData.value.windowWidth,
        height: formData.value.windowHeight
      },
      permissions: formData.value.permissions,
      code: formData.value.code
    };

    const response = await fetch('/api/sdk/apps', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(manifest)
    });

    if (response.ok) {
      showSuccess.value = true;
    } else {
      const error = await response.json();
      alert(`Installation failed: ${error.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Installation error:', error);
    alert('Installation failed. Check console for details.');
  } finally {
    installing.value = false;
  }
};

const exportApp = () => {
  const manifest = JSON.parse(manifestPreview.value);
  const exportData = {
    manifest,
    files: {
      'main.vue': formData.value.code.main,
      'styles.css': formData.value.code.styles,
      'config.json': formData.value.code.config
    }
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${formData.value.id || 'app'}-export.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const runApp = () => {
  alert(`Running app: ${formData.value.name}\n\nThis would launch your newly installed app.`);
  // TODO: Emit event to parent to launch the app
};

// Watch for auto-generate ID changes
watch(autoGenerateId, (newVal) => {
  if (newVal) {
    onNameChange();
  }
});
</script>

<style scoped>
.app-builder {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
  overflow: hidden;
}

.wizard-header {
  background: #0055aa;
  color: #ffffff;
  padding: 12px;
  border-bottom: 2px solid #000000;
}

.wizard-header h3 {
  margin: 0 0 4px 0;
  font-size: 11px;
}

.wizard-subtitle {
  margin: 0;
  font-size: 7px;
  opacity: 0.9;
}

.wizard-progress {
  display: flex;
  justify-content: space-between;
  padding: 16px 24px;
  background: #ffffff;
  border-bottom: 2px solid #000000;
  gap: 8px;
}

.progress-step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  position: relative;
}

.progress-step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 12px;
  left: calc(50% + 20px);
  width: calc(100% - 40px);
  height: 2px;
  background: #cccccc;
}

.progress-step.completed:not(:last-child)::after {
  background: #00aa00;
}

.step-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid #888888;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  color: #888888;
  position: relative;
  z-index: 1;
}

.progress-step.active .step-circle {
  background: #0055aa;
  border-color: #0055aa;
  color: #ffffff;
  font-weight: bold;
}

.progress-step.completed .step-circle {
  background: #00aa00;
  border-color: #00aa00;
  color: #ffffff;
}

.step-label {
  font-size: 7px;
  color: #666666;
  text-align: center;
}

.progress-step.active .step-label {
  color: #0055aa;
  font-weight: bold;
}

.progress-step.completed .step-label {
  color: #00aa00;
}

.wizard-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #ffffff;
  margin: 12px;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.step-container {
  max-width: 700px;
  margin: 0 auto;
}

.step-title {
  margin: 0 0 8px 0;
  font-size: 11px;
  color: #0055aa;
  padding-bottom: 8px;
  border-bottom: 2px solid #000000;
}

.step-subtitle {
  font-size: 8px;
  color: #666666;
  margin: 8px 0 16px 0;
}

/* Template Selection */
.templates-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.template-card {
  background: #f5f5f5;
  border: 2px solid #888888;
  padding: 16px;
  cursor: pointer;
  transition: all 0.1s;
  text-align: center;
}

.template-card:hover {
  border-color: #0055aa;
  background: #e8e8e8;
}

.template-card.selected {
  border-color: #0055aa;
  background: #d0e0ff;
  box-shadow: 0 0 0 2px #0055aa;
}

.template-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.template-name {
  font-size: 9px;
  font-weight: bold;
  color: #000000;
  margin-bottom: 8px;
}

.template-description {
  font-size: 7px;
  color: #666666;
  line-height: 1.4;
}

.template-preview {
  background: #f5f5f5;
  border: 2px solid #888888;
  padding: 12px;
}

.preview-header {
  font-size: 9px;
  color: #0055aa;
  margin-bottom: 8px;
  font-weight: bold;
}

.preview-content {
  font-size: 7px;
  line-height: 1.6;
}

.preview-content p {
  margin: 0 0 8px 0;
  color: #333333;
}

.preview-content ul {
  margin: 0;
  padding-left: 16px;
  color: #666666;
}

.preview-content li {
  margin-bottom: 4px;
}

/* Configuration Form */
.config-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 8px;
  color: #000000;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.id-input-group {
  display: flex;
  gap: 4px;
}

.id-input-group .amiga-input {
  flex: 1;
}

.amiga-input {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 6px 8px;
  font-size: 9px;
  font-family: 'Courier New', monospace;
  color: #000000;
}

.amiga-input:disabled {
  background: #e0e0e0;
  color: #888888;
}

.amiga-textarea {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 8px;
  font-size: 9px;
  font-family: 'Courier New', monospace;
  color: #000000;
  resize: vertical;
}

.amiga-select {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 6px 8px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
}

.icon-selector {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
  padding: 8px;
  background: #f5f5f5;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.icon-option {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  border: 2px solid transparent;
  background: #ffffff;
}

.icon-option:hover {
  background: #e8e8e8;
}

.icon-option.selected {
  border-color: #0055aa;
  background: #d0e0ff;
}

/* Permissions */
.permissions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.permission-item {
  background: #f5f5f5;
  border: 2px solid #888888;
  padding: 10px;
}

.permission-item.dangerous {
  border-color: #ff6600;
  background: #fff5f0;
}

.permission-header {
  margin-bottom: 6px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 8px;
}

.amiga-checkbox {
  width: 14px;
  height: 14px;
  cursor: pointer;
}

.permission-name {
  font-weight: bold;
  color: #000000;
}

.danger-badge {
  color: #ff6600;
  font-size: 10px;
}

.permission-description {
  font-size: 7px;
  color: #666666;
  margin-left: 22px;
  line-height: 1.4;
}

.warning-box {
  background: #fff5e6;
  border: 2px solid #ff6600;
  padding: 12px;
}

.warning-header {
  font-size: 9px;
  color: #ff6600;
  font-weight: bold;
  margin-bottom: 6px;
}

.warning-text {
  font-size: 7px;
  color: #666666;
  line-height: 1.6;
}

/* Code Editor */
.editor-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 0;
  border-bottom: 2px solid #000000;
}

.editor-tab {
  background: #cccccc;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  border-bottom: none;
  padding: 6px 12px;
  font-size: 7px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  color: #666666;
}

.editor-tab.active {
  background: #000000;
  color: #00ff00;
  border-color: #00ff00 #000000 #000000 #00ff00;
}

.code-editor-container {
  margin-bottom: 12px;
}

.code-editor {
  width: 100%;
  height: 350px;
  background: #000000;
  color: #00ff00;
  border: 2px solid #00ff00;
  padding: 12px;
  font-size: 9px;
  font-family: 'Courier New', monospace;
  resize: vertical;
  tab-size: 2;
}

.code-editor::selection {
  background: #00ff00;
  color: #000000;
}

.editor-actions {
  display: flex;
  gap: 8px;
}

/* Review */
.review-sections {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-section {
  background: #f5f5f5;
  border: 2px solid #888888;
  padding: 12px;
}

.review-section h5 {
  margin: 0 0 10px 0;
  font-size: 9px;
  color: #0055aa;
  padding-bottom: 6px;
  border-bottom: 1px solid #cccccc;
}

.review-item {
  display: flex;
  margin-bottom: 6px;
  font-size: 7px;
}

.review-label {
  width: 120px;
  color: #666666;
}

.review-value {
  flex: 1;
  color: #000000;
  font-weight: bold;
}

.permissions-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.permission-badge {
  background: #0055aa;
  color: #ffffff;
  padding: 4px 8px;
  font-size: 7px;
  border: 1px solid #000000;
}

.no-permissions {
  font-size: 7px;
  color: #888888;
  font-style: italic;
}

.manifest-preview {
  background: #000000;
  color: #00ff00;
  border: 2px solid #00ff00;
  padding: 12px;
  font-size: 7px;
  font-family: 'Courier New', monospace;
  overflow-x: auto;
  margin: 0;
  white-space: pre;
}

/* Success Message */
.success-message {
  text-align: center;
  padding: 40px;
}

.success-icon {
  font-size: 48px;
  color: #00aa00;
  margin-bottom: 16px;
}

.success-text {
  font-size: 11px;
  color: #00aa00;
  margin-bottom: 24px;
}

.success-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

/* Wizard Actions */
.wizard-actions {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: #ffffff;
  border-top: 2px solid #000000;
  gap: 8px;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 8px 16px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
  cursor: pointer;
  white-space: nowrap;
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

.amiga-button.primary {
  background: #0055aa;
  color: #ffffff;
}

.amiga-button.primary:hover:not(:disabled) {
  background: #0066cc;
}

.amiga-button.small {
  padding: 6px 12px;
  font-size: 7px;
}

.amiga-button.tiny {
  padding: 4px 8px;
  font-size: 7px;
}

.amiga-button.tiny.active {
  background: #00aa00;
  color: #ffffff;
}

.install-button {
  background: #00aa00;
  color: #ffffff;
  font-weight: bold;
}

.install-button:hover:not(:disabled) {
  background: #00cc00;
}
</style>
