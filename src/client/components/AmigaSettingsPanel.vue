<template>
  <div class="amiga-settings-panel">
    <div class="settings-header">
      <h3>System Preferences</h3>
      <button class="amiga-button" @click="saveSettings">Save</button>
      <button class="amiga-button" @click="resetSettings">Reset</button>
    </div>

    <div class="settings-tabs">
      <button
        v-for="category in categories"
        :key="category.id"
        class="amiga-button tab-button"
        :class="{ active: activeCategory === category.id }"
        @click="activeCategory = category.id"
      >
        {{ category.label }}
      </button>
    </div>

    <div class="settings-content">
      <!-- Display Settings -->
      <div v-if="activeCategory === 'display'" class="settings-section">
        <h4>Display Settings</h4>
        <p class="section-hint">Drag to reorder settings</p>

        <draggable
          v-model="displaySettings"
          :group="{ name: 'settings' }"
          :animation="150"
          ghost-class="drag-ghost"
          drag-class="drag-dragging"
          chosen-class="drag-chosen"
          handle=".drag-handle"
          item-key="id"
          class="settings-list"
          @change="onSettingsReorder"
        >
          <template #item="{ element: setting }">
            <div class="setting-item-draggable">
              <div class="drag-handle">⋮⋮</div>
              <div class="setting-content">
                <label :for="setting.id">{{ setting.label }}</label>

                <!-- Toggle -->
                <input
                  v-if="setting.type === 'toggle'"
                  :id="setting.id"
                  type="checkbox"
                  v-model="setting.value"
                  class="setting-toggle"
                />

                <!-- Slider -->
                <input
                  v-if="setting.type === 'slider'"
                  :id="setting.id"
                  type="range"
                  v-model="setting.value"
                  :min="setting.min || 0"
                  :max="setting.max || 100"
                  class="setting-slider"
                />

                <!-- Select -->
                <select
                  v-if="setting.type === 'select'"
                  :id="setting.id"
                  v-model="setting.value"
                  class="setting-select"
                >
                  <option v-for="option in setting.options" :key="option" :value="option">
                    {{ option }}
                  </option>
                </select>

                <span v-if="setting.type === 'slider'" class="setting-value">{{ setting.value }}</span>
              </div>
            </div>
          </template>
        </draggable>
      </div>

      <!-- Sound Settings -->
      <div v-if="activeCategory === 'sound'" class="settings-section">
        <h4>Sound Settings</h4>
        <p class="section-hint">Drag to reorder settings</p>

        <draggable
          v-model="soundSettings"
          :group="{ name: 'settings' }"
          :animation="150"
          ghost-class="drag-ghost"
          drag-class="drag-dragging"
          chosen-class="drag-chosen"
          handle=".drag-handle"
          item-key="id"
          class="settings-list"
          @change="onSettingsReorder"
        >
          <template #item="{ element: setting }">
            <div class="setting-item-draggable">
              <div class="drag-handle">⋮⋮</div>
              <div class="setting-content">
                <label :for="setting.id">{{ setting.label }}</label>

                <input
                  v-if="setting.type === 'toggle'"
                  :id="setting.id"
                  type="checkbox"
                  v-model="setting.value"
                  class="setting-toggle"
                />

                <input
                  v-if="setting.type === 'slider'"
                  :id="setting.id"
                  type="range"
                  v-model="setting.value"
                  :min="setting.min || 0"
                  :max="setting.max || 100"
                  class="setting-slider"
                />

                <span v-if="setting.type === 'slider'" class="setting-value">{{ setting.value }}</span>
              </div>
            </div>
          </template>
        </draggable>
      </div>

      <!-- Workbench Settings -->
      <div v-if="activeCategory === 'workbench'" class="settings-section">
        <h4>Workbench Settings</h4>
        <p class="section-hint">Drag to reorder settings</p>

        <draggable
          v-model="workbenchSettings"
          :group="{ name: 'settings' }"
          :animation="150"
          ghost-class="drag-ghost"
          drag-class="drag-dragging"
          chosen-class="drag-chosen"
          handle=".drag-handle"
          item-key="id"
          class="settings-list"
          @change="onSettingsReorder"
        >
          <template #item="{ element: setting }">
            <div class="setting-item-draggable">
              <div class="drag-handle">⋮⋮</div>
              <div class="setting-content">
                <label :for="setting.id">{{ setting.label }}</label>

                <input
                  v-if="setting.type === 'toggle'"
                  :id="setting.id"
                  type="checkbox"
                  v-model="setting.value"
                  class="setting-toggle"
                />

                <select
                  v-if="setting.type === 'select'"
                  :id="setting.id"
                  v-model="setting.value"
                  class="setting-select"
                >
                  <option v-for="option in setting.options" :key="option" :value="option">
                    {{ option }}
                  </option>
                </select>
              </div>
            </div>
          </template>
        </draggable>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import draggable from 'vuedraggable';
import type { SettingItem } from '../types/drag';

const emit = defineEmits(['close']);

// State
const activeCategory = ref('display');
const displaySettings = ref<SettingItem[]>([]);
const soundSettings = ref<SettingItem[]>([]);
const workbenchSettings = ref<SettingItem[]>([]);

const categories = [
  { id: 'display', label: 'Display' },
  { id: 'sound', label: 'Sound' },
  { id: 'workbench', label: 'Workbench' },
];

// Load settings from API
const loadSettings = async () => {
  try {
    const response = await fetch('/api/settings');
    if (!response.ok) throw new Error('Failed to load settings');

    const data = await response.json();

    // Convert API response to setting items
    displaySettings.value = [
      { id: 'screenMode', category: 'display', label: 'Screen Mode', value: data.display.screenMode, type: 'select', options: ['Workbench', 'Productivity', 'Custom'] },
      { id: 'resolution', category: 'display', label: 'Resolution', value: data.display.resolution, type: 'select', options: ['640x256', '640x400', '800x600', '1024x768'] },
      { id: 'colors', category: 'display', label: 'Colors', value: data.display.colors, type: 'slider', min: 2, max: 256 },
      { id: 'scanlines', category: 'display', label: 'Scanlines', value: data.display.scanlines, type: 'toggle' },
    ];

    soundSettings.value = [
      { id: 'enabled', category: 'sound', label: 'Sound Enabled', value: data.sound.enabled, type: 'toggle' },
      { id: 'volume', category: 'sound', label: 'Volume', value: data.sound.volume, type: 'slider', min: 0, max: 100 },
      { id: 'diskSounds', category: 'sound', label: 'Disk Sounds', value: data.sound.diskSounds, type: 'toggle' },
      { id: 'clickSounds', category: 'sound', label: 'Click Sounds', value: data.sound.clickSounds, type: 'toggle' },
    ];

    workbenchSettings.value = [
      { id: 'font', category: 'workbench', label: 'Font', value: data.workbench.font, type: 'select', options: ['Topaz', 'Arial', 'Courier'] },
      { id: 'fontSize', category: 'workbench', label: 'Font Size', value: data.workbench.fontSize, type: 'slider', min: 6, max: 16 },
      { id: 'showHiddenFiles', category: 'workbench', label: 'Show Hidden', value: data.workbench.showHiddenFiles, type: 'toggle' },
      { id: 'snapIcons', category: 'workbench', label: 'Snap to Grid', value: data.workbench.snapIcons, type: 'toggle' },
    ];
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
};

// Handle reordering
const onSettingsReorder = async () => {
  console.log('Settings reordered');
  // Could save order to preferences
};

// Save settings
const saveSettings = async () => {
  try {
    // Save display settings
    const displayData: any = {};
    displaySettings.value.forEach(setting => {
      displayData[setting.id] = setting.value;
    });

    await fetch('/api/settings/display', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(displayData),
    });

    // Save sound settings
    const soundData: any = {};
    soundSettings.value.forEach(setting => {
      soundData[setting.id] = setting.value;
    });

    await fetch('/api/settings/sound', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(soundData),
    });

    // Save workbench settings
    const workbenchData: any = {};
    workbenchSettings.value.forEach(setting => {
      workbenchData[setting.id] = setting.value;
    });

    await fetch('/api/settings/workbench', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workbenchData),
    });

    alert('Settings saved successfully');
  } catch (error) {
    console.error('Failed to save settings:', error);
    alert('Failed to save settings');
  }
};

// Reset settings
const resetSettings = async () => {
  try {
    await fetch('/api/settings/reset', {
      method: 'POST',
    });

    await loadSettings();
    alert('Settings reset to defaults');
  } catch (error) {
    console.error('Failed to reset settings:', error);
    alert('Failed to reset settings');
  }
};

onMounted(() => {
  loadSettings();
});
</script>

<style scoped>
.amiga-settings-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
}

.settings-header {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-bottom: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  align-items: center;
}

.settings-header h3 {
  flex: 1;
  font-size: 12px;
  margin: 0;
}

.settings-tabs {
  display: flex;
  gap: 4px;
  padding: 8px;
  border-bottom: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.tab-button {
  flex: 1;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.settings-section h4 {
  font-size: 11px;
  margin-bottom: 8px;
  color: #0055aa;
}

.section-hint {
  font-size: 8px;
  color: #555555;
  margin-bottom: 12px;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-content label {
  flex: 1;
  font-size: 9px;
}

.setting-toggle {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.setting-slider {
  flex: 2;
  height: 20px;
}

.setting-select {
  flex: 1;
  padding: 4px;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.setting-value {
  font-size: 9px;
  min-width: 30px;
  text-align: right;
}
</style>
