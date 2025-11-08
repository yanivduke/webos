<template>
  <div class="preferences">
    <div class="prefs-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="prefs-tab"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.name }}
      </div>
    </div>

    <div class="prefs-content">
      <!-- Display Settings -->
      <div v-if="activeTab === 'display'" class="prefs-panel">
        <h3>Display Settings</h3>

        <div class="pref-group">
          <label>Screen Mode:</label>
          <select v-model="settings.display.screenMode" class="amiga-select">
            <option value="640x256">Workbench (640x256, 16 colors)</option>
            <option value="640x480">VGA (640x480, 256 colors)</option>
            <option value="800x600">SVGA (800x600, 256 colors)</option>
          </select>
        </div>

        <div class="pref-group">
          <label>
            <input type="checkbox" v-model="settings.display.showScanlines" class="amiga-checkbox" />
            Show CRT Scanlines
          </label>
        </div>

        <div class="pref-group">
          <label>
            <input type="checkbox" v-model="settings.display.showCursor" class="amiga-checkbox" />
            Show Custom Pointer
          </label>
        </div>

        <div class="pref-group">
          <label>Animation Speed:</label>
          <input type="range" v-model.number="settings.display.animationSpeed" min="0" max="100" class="amiga-slider" />
          <span class="value-label">{{ settings.display.animationSpeed }}ms</span>
        </div>
      </div>

      <!-- Sound Settings -->
      <div v-if="activeTab === 'sound'" class="prefs-panel">
        <h3>Sound Settings</h3>

        <div class="pref-group">
          <label>
            <input type="checkbox" v-model="settings.sound.enabled" class="amiga-checkbox" />
            Enable Sound Effects
          </label>
        </div>

        <div class="pref-group">
          <label>Master Volume:</label>
          <input type="range" v-model.number="settings.sound.volume" min="0" max="100" class="amiga-slider" />
          <span class="value-label">{{ settings.sound.volume }}%</span>
        </div>

        <div class="pref-group">
          <label>
            <input type="checkbox" v-model="settings.sound.clickSounds" class="amiga-checkbox" />
            Window Click Sounds
          </label>
        </div>

        <div class="pref-group">
          <label>
            <input type="checkbox" v-model="settings.sound.startupSound" class="amiga-checkbox" />
            Startup Sound
          </label>
        </div>
      </div>

      <!-- Workbench Settings -->
      <div v-if="activeTab === 'workbench'" class="prefs-panel">
        <h3>Workbench Settings</h3>

        <div class="pref-group">
          <label>Icon View:</label>
          <select v-model="settings.workbench.iconView" class="amiga-select">
            <option value="icon">Icon View</option>
            <option value="list">List View</option>
            <option value="details">Details View</option>
          </select>
        </div>

        <div class="pref-group">
          <label>Icon Size:</label>
          <select v-model="settings.workbench.iconSize" class="amiga-select">
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>

        <div class="pref-group">
          <label>
            <input type="checkbox" v-model="settings.workbench.showHiddenFiles" class="amiga-checkbox" />
            Show Hidden Files
          </label>
        </div>

        <div class="pref-group">
          <label>
            <input type="checkbox" v-model="settings.workbench.snapToGrid" class="amiga-checkbox" />
            Snap Icons to Grid
          </label>
        </div>

        <div class="pref-group">
          <label>Default Font:</label>
          <select v-model="settings.workbench.font" class="amiga-select">
            <option value="Press Start 2P">Press Start 2P (Authentic)</option>
            <option value="Topaz">Topaz (Classic Amiga)</option>
            <option value="Courier New">Courier New</option>
          </select>
        </div>
      </div>

      <!-- System Settings -->
      <div v-if="activeTab === 'system'" class="prefs-panel">
        <h3>System Settings</h3>

        <div class="pref-group">
          <label>Time Format:</label>
          <select v-model="settings.system.timeFormat" class="amiga-select">
            <option value="12h">12 Hour</option>
            <option value="24h">24 Hour</option>
          </select>
        </div>

        <div class="pref-group">
          <label>Date Format:</label>
          <select v-model="settings.system.dateFormat" class="amiga-select">
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <div class="pref-group">
          <label>
            <input type="checkbox" v-model="settings.system.autoSave" class="amiga-checkbox" />
            Auto-save Workbench Layout
          </label>
        </div>

        <div class="pref-group">
          <label>Memory Display:</label>
          <select v-model="settings.system.memoryDisplay" class="amiga-select">
            <option value="actual">Actual (KB/MB)</option>
            <option value="authentic">Authentic Amiga</option>
          </select>
        </div>
      </div>

      <!-- Dev Tools Settings -->
      <div v-if="activeTab === 'devtools'" class="prefs-panel">
        <h3>Developer Tools Settings</h3>

        <div class="pref-group">
          <label>
            <input type="checkbox" v-model="settings.devtools.enabled" class="amiga-checkbox" />
            Enable Developer Tools
          </label>
        </div>

        <div class="devtools-list">
          <h4>Available Tools (7/11):</h4>

          <div class="pref-group">
            <label>
              <input type="checkbox" v-model="settings.devtools.regexTester" class="amiga-checkbox" />
              Regex Tester - Test regular expressions
            </label>
          </div>

          <div class="pref-group">
            <label>
              <input type="checkbox" v-model="settings.devtools.gitClient" class="amiga-checkbox" />
              Git Client - Manage Git repositories
            </label>
          </div>

          <div class="pref-group">
            <label>
              <input type="checkbox" v-model="settings.devtools.dockerManager" class="amiga-checkbox" />
              Docker Manager - Manage Docker containers
            </label>
          </div>

          <div class="pref-group">
            <label>
              <input type="checkbox" v-model="settings.devtools.npmManager" class="amiga-checkbox" />
              NPM Manager - Manage Node packages
            </label>
          </div>

          <div class="pref-group">
            <label>
              <input type="checkbox" v-model="settings.devtools.environmentEditor" class="amiga-checkbox" />
              Environment Editor - Edit .env files
            </label>
          </div>

          <div class="pref-group">
            <label>
              <input type="checkbox" v-model="settings.devtools.logViewer" class="amiga-checkbox" />
              Log Viewer - View real-time logs
            </label>
          </div>

          <div class="pref-group">
            <label>
              <input type="checkbox" v-model="settings.devtools.codeSnippetsManager" class="amiga-checkbox" />
              Code Snippets Manager - Store code snippets
            </label>
          </div>
        </div>

        <div class="devtools-config">
          <h4>Configuration:</h4>

          <div class="pref-group">
            <label>GitHub Access Token:</label>
            <input
              v-model="settings.devtools.githubToken"
              type="password"
              class="amiga-input"
              placeholder="ghp_xxxxxxxxxxxx"
            />
            <span class="help-text">Required for GitHub Code Editor</span>
          </div>

          <div class="pref-group">
            <label>Default Database Type:</label>
            <select v-model="settings.devtools.defaultDatabase" class="amiga-select">
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="mongodb">MongoDB</option>
              <option value="sqlite">SQLite</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="prefs-footer">
      <button class="amiga-button" @click="savePreferences">Save</button>
      <button class="amiga-button" @click="resetToDefaults">Reset to Defaults</button>
      <button class="amiga-button" @click="$emit('close')">Cancel</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const activeTab = ref('display');

const tabs = [
  { id: 'display', name: 'Display' },
  { id: 'sound', name: 'Sound' },
  { id: 'workbench', name: 'Workbench' },
  { id: 'system', name: 'System' },
  { id: 'devtools', name: 'Dev Tools' }
];

const settings = ref({
  display: {
    screenMode: '640x256',
    showScanlines: true,
    showCursor: true,
    animationSpeed: 100
  },
  sound: {
    enabled: true,
    volume: 75,
    clickSounds: true,
    startupSound: true
  },
  workbench: {
    iconView: 'icon',
    iconSize: 'medium',
    showHiddenFiles: false,
    snapToGrid: true,
    font: 'Press Start 2P'
  },
  system: {
    timeFormat: '24h',
    dateFormat: 'MM/DD/YYYY',
    autoSave: true,
    memoryDisplay: 'authentic'
  },
  devtools: {
    enabled: true,
    regexTester: true,
    gitClient: true,
    dockerManager: true,
    npmManager: true,
    environmentEditor: true,
    logViewer: true,
    codeSnippetsManager: true,
    githubToken: '',
    defaultDatabase: 'postgresql'
  }
});

const loadPreferences = async () => {
  try {
    const response = await fetch('/api/settings');
    if (response.ok) {
      const data = await response.json();
      if (data.settings) {
        settings.value = { ...settings.value, ...data.settings };
      }
    }
  } catch (error) {
    console.error('Failed to load preferences:', error);
  }
};

const savePreferences = async () => {
  try {
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: settings.value })
    });

    if (response.ok) {
      alert('Preferences saved successfully!');
      emit('close');
    } else {
      alert('Failed to save preferences');
    }
  } catch (error) {
    console.error('Failed to save preferences:', error);
    alert('Error saving preferences');
  }
};

const resetToDefaults = () => {
  if (confirm('Reset all preferences to default values?')) {
    settings.value = {
      display: {
        screenMode: '640x256',
        showScanlines: true,
        showCursor: true,
        animationSpeed: 100
      },
      sound: {
        enabled: true,
        volume: 75,
        clickSounds: true,
        startupSound: true
      },
      workbench: {
        iconView: 'icon',
        iconSize: 'medium',
        showHiddenFiles: false,
        snapToGrid: true,
        font: 'Press Start 2P'
      },
      system: {
        timeFormat: '24h',
        dateFormat: 'MM/DD/YYYY',
        autoSave: true,
        memoryDisplay: 'authentic'
      },
      devtools: {
        enabled: true,
        regexTester: true,
        gitClient: true,
        dockerManager: true,
        npmManager: true,
        environmentEditor: true,
        logViewer: true,
        codeSnippetsManager: true,
        githubToken: '',
        defaultDatabase: 'postgresql'
      }
    };
  }
};

onMounted(() => {
  loadPreferences();
});
</script>

<style scoped>
.preferences {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
}

.prefs-tabs {
  display: flex;
  background: #888888;
  border-bottom: 2px solid #000000;
}

.prefs-tab {
  flex: 1;
  padding: 8px 12px;
  text-align: center;
  font-size: 9px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  user-select: none;
}

.prefs-tab:hover {
  background: #b0b0b0;
}

.prefs-tab.active {
  background: #0055aa;
  color: #ffffff;
  border-color: #000000 #ffffff #ffffff #000000;
}

.prefs-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #ffffff;
}

.prefs-panel h3 {
  font-size: 11px;
  color: #0055aa;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #000000;
}

.pref-group {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pref-group label {
  font-size: 9px;
  color: #000000;
  display: flex;
  align-items: center;
  gap: 8px;
}

.amiga-select {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px 8px;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
}

.amiga-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.amiga-slider {
  width: 100%;
  height: 20px;
}

.value-label {
  font-size: 8px;
  color: #666666;
  margin-left: 8px;
}

.prefs-footer {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: #888888;
  border-top: 2px solid #ffffff;
  justify-content: center;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 16px;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
  cursor: pointer;
}

.amiga-button:hover {
  background: #b0b0b0;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-input {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px 8px;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
  width: 100%;
}

.devtools-list,
.devtools-config {
  margin-top: 16px;
  padding: 12px;
  background: #f0f0f0;
  border: 2px solid #888888;
}

.devtools-list h4,
.devtools-config h4 {
  font-size: 9px;
  color: #0055aa;
  margin: 0 0 12px 0;
  padding-bottom: 6px;
  border-bottom: 1px solid #888888;
}

.help-text {
  display: block;
  font-size: 7px;
  color: #666666;
  margin-top: 4px;
  font-style: italic;
}
</style>
