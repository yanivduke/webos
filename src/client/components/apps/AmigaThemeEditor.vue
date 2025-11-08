<template>
  <div class="theme-editor">
    <!-- Tabs -->
    <div class="theme-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="theme-tab"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.name }}
      </div>
    </div>

    <!-- Tab Content -->
    <div class="theme-content amiga-scrollbar">
      <!-- Gallery Tab -->
      <div v-if="activeTab === 'gallery'" class="theme-gallery">
        <div class="section-title">Pre-built Themes</div>
        <div class="theme-grid">
          <div
            v-for="themeId in builtInThemes"
            :key="themeId"
            class="theme-card"
            :class="{ selected: selectedThemeId === themeId }"
            @click="previewTheme(themeId)"
          >
            <div class="theme-preview" :ref="el => setPreviewRef(themeId, el)"></div>
            <div class="theme-name">{{ getThemeName(themeId) }}</div>
            <button class="amiga-button amiga-button-small" @click.stop="applyThemeById(themeId)">
              Apply
            </button>
          </div>
        </div>

        <div v-if="customThemes.length > 0" class="section-title">Custom Themes</div>
        <div v-if="customThemes.length > 0" class="theme-grid">
          <div
            v-for="theme in customThemes"
            :key="theme.id"
            class="theme-card"
            :class="{ selected: selectedThemeId === theme.id }"
            @click="previewTheme(theme.id)"
          >
            <div class="theme-preview" :ref="el => setPreviewRef(theme.id, el)"></div>
            <div class="theme-name">{{ theme.name }}</div>
            <div class="theme-actions">
              <button class="amiga-button amiga-button-small" @click.stop="applyCustomTheme(theme)">
                Apply
              </button>
              <button class="amiga-button amiga-button-small" @click.stop="deleteTheme(theme.id)">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Customize Tab -->
      <div v-if="activeTab === 'customize'" class="theme-customize">
        <div class="customize-header">
          <input
            v-model="customTheme.name"
            class="amiga-input"
            placeholder="Theme Name"
            style="flex: 1"
          />
          <button class="amiga-button" @click="saveCustomTheme">Save Theme</button>
        </div>

        <div class="color-sections">
          <!-- Primary Colors -->
          <div class="color-section">
            <div class="section-title">Primary Colors</div>
            <div class="color-grid">
              <div class="color-input-group">
                <label>Primary</label>
                <input
                  v-model="customTheme.colors.primary"
                  type="color"
                  class="color-picker"
                  @input="updatePreview"
                />
                <input
                  v-model="customTheme.colors.primary"
                  type="text"
                  class="amiga-input amiga-input-small"
                  @input="updatePreview"
                />
              </div>
              <div class="color-input-group">
                <label>Background</label>
                <input
                  v-model="customTheme.colors.background"
                  type="color"
                  class="color-picker"
                  @input="updatePreview"
                />
                <input
                  v-model="customTheme.colors.background"
                  type="text"
                  class="amiga-input amiga-input-small"
                  @input="updatePreview"
                />
              </div>
              <div class="color-input-group">
                <label>Text</label>
                <input
                  v-model="customTheme.colors.text"
                  type="color"
                  class="color-picker"
                  @input="updatePreview"
                />
                <input
                  v-model="customTheme.colors.text"
                  type="text"
                  class="amiga-input amiga-input-small"
                  @input="updatePreview"
                />
              </div>
            </div>
          </div>

          <!-- Window Colors -->
          <div class="color-section">
            <div class="section-title">Window Colors</div>
            <div class="color-grid">
              <div class="color-input-group">
                <label>Window Chrome</label>
                <input
                  v-model="customTheme.colors.windowChrome"
                  type="color"
                  class="color-picker"
                  @input="updatePreview"
                />
                <input
                  v-model="customTheme.colors.windowChrome"
                  type="text"
                  class="amiga-input amiga-input-small"
                  @input="updatePreview"
                />
              </div>
              <div class="color-input-group">
                <label>Window Title</label>
                <input
                  v-model="customTheme.colors.windowTitle"
                  type="color"
                  class="color-picker"
                  @input="updatePreview"
                />
                <input
                  v-model="customTheme.colors.windowTitle"
                  type="text"
                  class="amiga-input amiga-input-small"
                  @input="updatePreview"
                />
              </div>
              <div class="color-input-group">
                <label>Title Text</label>
                <input
                  v-model="customTheme.colors.windowTitleText"
                  type="color"
                  class="color-picker"
                  @input="updatePreview"
                />
                <input
                  v-model="customTheme.colors.windowTitleText"
                  type="text"
                  class="amiga-input amiga-input-small"
                  @input="updatePreview"
                />
              </div>
            </div>
          </div>

          <!-- Highlight Colors -->
          <div class="color-section">
            <div class="section-title">Highlight Colors</div>
            <div class="color-grid">
              <div class="color-input-group">
                <label>Highlight</label>
                <input
                  v-model="customTheme.colors.highlight"
                  type="color"
                  class="color-picker"
                  @input="updatePreview"
                />
                <input
                  v-model="customTheme.colors.highlight"
                  type="text"
                  class="amiga-input amiga-input-small"
                  @input="updatePreview"
                />
              </div>
              <div class="color-input-group">
                <label>Highlight Text</label>
                <input
                  v-model="customTheme.colors.highlightText"
                  type="color"
                  class="color-picker"
                  @input="updatePreview"
                />
                <input
                  v-model="customTheme.colors.highlightText"
                  type="text"
                  class="amiga-input amiga-input-small"
                  @input="updatePreview"
                />
              </div>
              <div class="color-input-group">
                <label>Accent</label>
                <input
                  v-model="customTheme.colors.accent"
                  type="color"
                  class="color-picker"
                  @input="updatePreview"
                />
                <input
                  v-model="customTheme.colors.accent"
                  type="text"
                  class="amiga-input amiga-input-small"
                  @input="updatePreview"
                />
              </div>
            </div>
          </div>

          <!-- Border Colors -->
          <div class="color-section">
            <div class="section-title">Border Colors</div>
            <div class="color-grid">
              <div class="color-input-group">
                <label>Border</label>
                <input
                  v-model="customTheme.colors.border"
                  type="color"
                  class="color-picker"
                  @input="updatePreview"
                />
                <input
                  v-model="customTheme.colors.border"
                  type="text"
                  class="amiga-input amiga-input-small"
                  @input="updatePreview"
                />
              </div>
              <div class="color-input-group">
                <label>Border Light</label>
                <input
                  v-model="customTheme.colors.borderLight"
                  type="color"
                  class="color-picker"
                  @input="updatePreview"
                />
                <input
                  v-model="customTheme.colors.borderLight"
                  type="text"
                  class="amiga-input amiga-input-small"
                  @input="updatePreview"
                />
              </div>
              <div class="color-input-group">
                <label>Border Dark</label>
                <input
                  v-model="customTheme.colors.borderDark"
                  type="color"
                  class="color-picker"
                  @input="updatePreview"
                />
                <input
                  v-model="customTheme.colors.borderDark"
                  type="text"
                  class="amiga-input amiga-input-small"
                  @input="updatePreview"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Typography Tab -->
      <div v-if="activeTab === 'typography'" class="theme-typography">
        <div class="section-title">Font Settings</div>
        <div class="typography-settings">
          <div class="setting-group">
            <label>Primary Font</label>
            <select v-model="customTheme.fonts.primary" class="amiga-select" @change="updatePreview">
              <option value="'Press Start 2P', monospace">Press Start 2P (Amiga)</option>
              <option value="monospace">Monospace</option>
              <option value="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">System Font</option>
              <option value="'Courier New', monospace">Courier New</option>
              <option value="Arial, sans-serif">Arial</option>
            </select>
          </div>

          <div class="setting-group">
            <label>Small Size</label>
            <input
              v-model="customTheme.fonts.size.small"
              type="text"
              class="amiga-input"
              @input="updatePreview"
            />
          </div>

          <div class="setting-group">
            <label>Medium Size</label>
            <input
              v-model="customTheme.fonts.size.medium"
              type="text"
              class="amiga-input"
              @input="updatePreview"
            />
          </div>

          <div class="setting-group">
            <label>Large Size</label>
            <input
              v-model="customTheme.fonts.size.large"
              type="text"
              class="amiga-input"
              @input="updatePreview"
            />
          </div>
        </div>
      </div>

      <!-- Window Chrome Tab -->
      <div v-if="activeTab === 'chrome'" class="theme-chrome">
        <div class="section-title">Window Chrome Settings</div>
        <div class="chrome-settings">
          <div class="setting-group">
            <label>Border Width</label>
            <input
              v-model="customTheme.windowChrome.borderWidth"
              type="text"
              class="amiga-input"
              @input="updatePreview"
            />
          </div>

          <div class="setting-group">
            <label>Border Radius</label>
            <input
              v-model="customTheme.windowChrome.borderRadius"
              type="text"
              class="amiga-input"
              @input="updatePreview"
            />
          </div>

          <div class="setting-group">
            <label>Shadow</label>
            <input
              v-model="customTheme.windowChrome.shadow"
              type="text"
              class="amiga-input"
              placeholder="none or CSS shadow"
              @input="updatePreview"
            />
          </div>

          <div class="setting-group">
            <label>Title Bar Height</label>
            <input
              v-model="customTheme.windowChrome.titleBarHeight"
              type="text"
              class="amiga-input"
              @input="updatePreview"
            />
          </div>
        </div>
      </div>

      <!-- Preview Tab -->
      <div v-if="activeTab === 'preview'" class="theme-preview-tab">
        <div class="section-title">Live Preview</div>
        <div class="preview-container">
          <div class="preview-window theme-window">
            <div class="preview-titlebar theme-window-title">
              <span>Preview Window</span>
            </div>
            <div class="preview-content">
              <button class="theme-button">Button</button>
              <button class="theme-button theme-button-primary">Primary Button</button>
              <input type="text" class="theme-input" placeholder="Text input" />
              <div class="theme-list-item">List item</div>
              <div class="theme-list-item selected">Selected item</div>
              <div class="preview-text theme-text">Sample text in theme colors</div>
            </div>
          </div>
        </div>

        <!-- Accessibility Check -->
        <div v-if="accessibilityReport" class="accessibility-report">
          <div class="section-title">Accessibility Check</div>
          <div v-if="accessibilityReport.valid" class="accessibility-pass">
            All contrast ratios meet WCAG AA standards
          </div>
          <div v-else class="accessibility-warnings">
            <div v-for="(warning, idx) in accessibilityReport.warnings" :key="idx" class="warning-item">
              {{ warning }}
            </div>
          </div>
        </div>
      </div>

      <!-- Import/Export Tab -->
      <div v-if="activeTab === 'import-export'" class="theme-import-export">
        <div class="section-title">Import/Export Theme</div>

        <div class="import-section">
          <label>Import Theme JSON</label>
          <textarea
            v-model="importJson"
            class="amiga-input import-textarea"
            placeholder="Paste theme JSON here..."
          ></textarea>
          <button class="amiga-button" @click="importTheme">Import Theme</button>
        </div>

        <div class="export-section">
          <label>Export Current Theme</label>
          <button class="amiga-button" @click="exportTheme">Copy to Clipboard</button>
          <button class="amiga-button" @click="downloadTheme">Download JSON</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { themeManager, type ThemeDefinition } from '../../utils/theme-manager';
import { ThemeBuilder } from '../../utils/theme-builder';

const activeTab = ref('gallery');
const selectedThemeId = ref<string | null>(null);
const builtInThemes = ref<string[]>([]);
const customThemes = ref<ThemeDefinition[]>([]);
const previewRefs = new Map<string, HTMLElement>();
const importJson = ref('');
const accessibilityReport = ref<{ valid: boolean; warnings: string[] } | null>(null);

const tabs = [
  { id: 'gallery', name: 'Gallery' },
  { id: 'customize', name: 'Customize' },
  { id: 'typography', name: 'Typography' },
  { id: 'chrome', name: 'Window Chrome' },
  { id: 'preview', name: 'Preview' },
  { id: 'import-export', name: 'Import/Export' }
];

// Default custom theme
const customTheme = ref<ThemeDefinition>(createDefaultCustomTheme());

function createDefaultCustomTheme(): ThemeDefinition {
  const current = themeManager.getCurrentTheme();
  if (current) {
    return JSON.parse(JSON.stringify(current));
  }

  return {
    id: 'custom-theme',
    name: 'My Custom Theme',
    description: 'Custom theme',
    version: '1.0.0',
    colors: {
      primary: '#0055aa',
      background: '#a0a0a0',
      text: '#000000',
      textInverse: '#ffffff',
      border: '#000000',
      borderLight: '#ffffff',
      borderDark: '#000000',
      windowChrome: '#a0a0a0',
      windowTitle: '#0055aa',
      windowTitleText: '#ffffff',
      highlight: '#0055aa',
      highlightText: '#ffffff',
      shadow: '#707070',
      accent: '#ffaa00',
      success: '#00ff00',
      warning: '#ffff00',
      error: '#ff0000',
      disabled: '#888888',
      inputBg: '#ffffff',
      inputText: '#000000',
      inputBorder: '#000000',
      scrollbarTrack: '#a0a0a0',
      scrollbarThumb: '#707070',
      menuBg: '#a0a0a0',
      menuText: '#000000',
      menuHighlight: '#0055aa',
      menuHighlightText: '#ffffff'
    },
    fonts: {
      primary: "'Press Start 2P', monospace",
      secondary: 'monospace',
      size: {
        small: '8px',
        medium: '10px',
        large: '12px'
      }
    },
    windowChrome: {
      borderWidth: '2px',
      borderRadius: '0px',
      shadow: 'none',
      titleBarHeight: '20px'
    },
    spacing: {
      small: '4px',
      medium: '8px',
      large: '12px'
    },
    animation: {
      duration: '0.1s',
      easing: 'linear'
    }
  };
}

function setPreviewRef(themeId: string, el: any) {
  if (el) {
    previewRefs.set(themeId, el as HTMLElement);
  }
}

async function loadThemes() {
  builtInThemes.value = themeManager.getBuiltInThemes();
  customThemes.value = themeManager.getCustomThemes();

  // Load and render previews
  await nextTick();
  for (const themeId of builtInThemes.value) {
    await renderThemePreview(themeId);
  }
  for (const theme of customThemes.value) {
    await renderThemePreview(theme.id);
  }
}

async function renderThemePreview(themeId: string) {
  try {
    let theme: ThemeDefinition;
    const customTheme = customThemes.value.find(t => t.id === themeId);

    if (customTheme) {
      theme = customTheme;
    } else {
      const response = await fetch(`/themes/${themeId}.json`);
      theme = await response.json();
    }

    const previewUrl = ThemeBuilder.createPreview(theme);
    const el = previewRefs.get(themeId);
    if (el) {
      el.style.backgroundImage = `url(${previewUrl})`;
      el.style.backgroundSize = 'cover';
    }
  } catch (error) {
    console.error(`Failed to render preview for ${themeId}:`, error);
  }
}

function getThemeName(themeId: string): string {
  return themeId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function previewTheme(themeId: string) {
  selectedThemeId.value = themeId;
}

async function applyThemeById(themeId: string) {
  await themeManager.loadTheme(themeId);
  selectedThemeId.value = themeId;
}

function applyCustomTheme(theme: ThemeDefinition) {
  themeManager.applyTheme(theme);
  selectedThemeId.value = theme.id;
}

function saveCustomTheme() {
  themeManager.saveCustomTheme(customTheme.value);
  customThemes.value = themeManager.getCustomThemes();
  alert('Theme saved successfully!');
}

function deleteTheme(themeId: string) {
  if (confirm('Are you sure you want to delete this theme?')) {
    themeManager.deleteCustomTheme(themeId);
    customThemes.value = themeManager.getCustomThemes();
  }
}

function updatePreview() {
  // Update accessibility report
  accessibilityReport.value = ThemeBuilder.validateAccessibility(customTheme.value);

  // Apply theme temporarily for preview
  themeManager.applyTheme(customTheme.value);
}

function exportTheme() {
  const json = themeManager.exportTheme(customTheme.value);
  navigator.clipboard.writeText(json);
  alert('Theme copied to clipboard!');
}

function downloadTheme() {
  themeManager.downloadTheme(customTheme.value);
}

function importTheme() {
  try {
    const theme = themeManager.importTheme(importJson.value);
    customTheme.value = theme;
    customThemes.value = themeManager.getCustomThemes();
    importJson.value = '';
    alert('Theme imported successfully!');
    activeTab.value = 'customize';
  } catch (error) {
    alert(`Import failed: ${error}`);
  }
}

// Watch for tab changes to update accessibility report
watch(activeTab, (newTab) => {
  if (newTab === 'preview') {
    accessibilityReport.value = ThemeBuilder.validateAccessibility(customTheme.value);
  }
});

onMounted(async () => {
  await loadThemes();
  const current = themeManager.getCurrentTheme();
  if (current) {
    selectedThemeId.value = current.id;
  }
});
</script>

<style scoped>
.theme-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--amiga-gray);
}

.theme-tabs {
  display: flex;
  background: var(--amiga-gray);
  border-bottom: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.theme-tab {
  padding: 8px 16px;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  cursor: pointer;
  user-select: none;
  border-right: 1px solid #707070;
  background: var(--amiga-gray);
}

.theme-tab:hover {
  background: var(--amiga-light-gray);
}

.theme-tab.active {
  background: var(--amiga-blue);
  color: #ffffff;
}

.theme-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

/* Gallery */
.theme-gallery {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  margin-bottom: 8px;
  color: var(--amiga-blue);
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.theme-card {
  background: var(--amiga-gray);
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.theme-card:hover {
  background: var(--amiga-light-gray);
}

.theme-card.selected {
  border-color: var(--amiga-blue);
  border-width: 3px;
}

.theme-preview {
  width: 100%;
  height: 120px;
  background: var(--amiga-dark-gray);
  border: 1px solid #000000;
}

.theme-name {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  text-align: center;
}

.theme-actions {
  display: flex;
  gap: 4px;
}

/* Customize */
.theme-customize {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.customize-header {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-sections {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.color-section {
  background: var(--amiga-gray);
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 12px;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.color-input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.color-input-group label {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
}

.color-picker {
  width: 100%;
  height: 40px;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  cursor: pointer;
}

.amiga-input-small {
  font-size: 8px;
  padding: 2px 4px;
}

/* Typography */
.theme-typography {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.typography-settings,
.chrome-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--amiga-gray);
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 12px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-group label {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
}

/* Preview */
.theme-preview-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-container {
  background: var(--theme-background);
  padding: 20px;
  min-height: 300px;
}

.preview-window {
  max-width: 400px;
  margin: 0 auto;
}

.preview-titlebar {
  padding: 4px 8px;
  font-family: var(--theme-font-primary);
  font-size: var(--theme-font-size-medium);
}

.preview-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--theme-window-chrome);
}

.preview-text {
  padding: 8px;
}

.accessibility-report {
  background: var(--amiga-gray);
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 12px;
}

.accessibility-pass {
  color: var(--amiga-green);
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
}

.accessibility-warnings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.warning-item {
  color: var(--amiga-red);
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
}

/* Import/Export */
.theme-import-export {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.import-section,
.export-section {
  background: var(--amiga-gray);
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.import-section label,
.export-section label {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
}

.import-textarea {
  min-height: 200px;
  font-family: monospace;
  font-size: 10px;
  resize: vertical;
}

.export-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
