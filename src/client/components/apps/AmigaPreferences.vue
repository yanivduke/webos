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

      <!-- Widgets Settings -->
      <div v-if="activeTab === 'widgets'" class="prefs-panel">
        <h3>Cloud Services & Widgets</h3>
        <p class="widget-intro">Enable modern cloud services to display on your desktop</p>

        <!-- Clock Widget -->
        <div class="widget-section">
          <h4>Clock Widget</h4>
          <div class="pref-group">
            <label>
              <input type="checkbox" v-model="settings.widgets.clock.enabled" class="amiga-checkbox" />
              Enable Clock Widget
            </label>
          </div>
          <div class="pref-group" v-if="settings.widgets.clock.enabled">
            <label>
              <input type="checkbox" v-model="settings.widgets.clock.showDate" class="amiga-checkbox" />
              Show Date
            </label>
          </div>
          <div class="pref-group" v-if="settings.widgets.clock.enabled">
            <label>
              <input type="checkbox" v-model="settings.widgets.clock.showSeconds" class="amiga-checkbox" />
              Show Seconds
            </label>
          </div>
        </div>

        <!-- Weather Widget -->
        <div class="widget-section">
          <h4>Weather Service</h4>
          <div class="pref-group">
            <label>
              <input type="checkbox" v-model="settings.widgets.weather.enabled" class="amiga-checkbox" />
              Enable Weather Widget
            </label>
          </div>
          <div class="pref-group" v-if="settings.widgets.weather.enabled">
            <label>Location:</label>
            <input type="text" v-model="settings.widgets.weather.location" class="amiga-input" placeholder="City name" />
          </div>
          <div class="pref-group" v-if="settings.widgets.weather.enabled">
            <label>Units:</label>
            <select v-model="settings.widgets.weather.units" class="amiga-select">
              <option value="metric">Celsius</option>
              <option value="imperial">Fahrenheit</option>
            </select>
          </div>
        </div>

        <!-- News Widget -->
        <div class="widget-section">
          <h4>News Service</h4>
          <div class="pref-group">
            <label>
              <input type="checkbox" v-model="settings.widgets.news.enabled" class="amiga-checkbox" />
              Enable News Widget
            </label>
          </div>
          <div class="pref-group" v-if="settings.widgets.news.enabled">
            <label>Category:</label>
            <select v-model="settings.widgets.news.category" class="amiga-select">
              <option value="general">General</option>
              <option value="technology">Technology</option>
              <option value="business">Business</option>
              <option value="science">Science</option>
              <option value="entertainment">Entertainment</option>
            </select>
          </div>
          <div class="pref-group" v-if="settings.widgets.news.enabled">
            <label>Max Items:</label>
            <input type="number" v-model.number="settings.widgets.news.maxItems" class="amiga-input" min="3" max="10" />
          </div>
        </div>
      </div>

      <!-- Developer Tools Settings -->
      <div v-if="activeTab === 'devtools'" class="prefs-panel">
        <h3>Developer Tools Configuration</h3>
        <p class="widget-intro">Enable and configure professional development tools</p>

        <!-- Database Manager -->
        <div class="widget-section">
          <h4>💾 Database Manager</h4>
          <div class="pref-group">
            <label>
              <input type="checkbox" v-model="settings.devtools.database.enabled" class="amiga-checkbox" />
              Enable Database Manager
            </label>
          </div>
          <div class="pref-group" v-if="settings.devtools.database.enabled">
            <label>Default Database:</label>
            <select v-model="settings.devtools.database.defaultType" class="amiga-select">
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="mongodb">MongoDB</option>
              <option value="sqlite">SQLite</option>
            </select>
          </div>
        </div>

        <!-- GitHub Integration -->
        <div class="widget-section">
          <h4>🐙 GitHub Code Editor</h4>
          <div class="pref-group">
            <label>
              <input type="checkbox" v-model="settings.devtools.github.enabled" class="amiga-checkbox" />
              Enable GitHub Integration
            </label>
          </div>
          <div class="pref-group" v-if="settings.devtools.github.enabled">
            <label>Access Token:</label>
            <input type="password" v-model="settings.devtools.github.token" class="amiga-input" placeholder="ghp_..." />
            <div class="hint-text">Generate token at github.com/settings/tokens</div>
          </div>
        </div>

        <!-- Other Developer Tools -->
        <div class="widget-section">
          <h4>🛠️ Additional Tools</h4>
          <div class="pref-group">
            <label>
              <input type="checkbox" v-model="settings.devtools.apiTester.enabled" class="amiga-checkbox" />
              API Tester (REST Client)
            </label>
          </div>
          <div class="pref-group">
            <label>
              <input type="checkbox" v-model="settings.devtools.jsonFormatter.enabled" class="amiga-checkbox" />
              JSON/XML Formatter
            </label>
          </div>
          <div class="pref-group">
            <label>
              <input type="checkbox" v-model="settings.devtools.regexTester.enabled" class="amiga-checkbox" />
              Regex Tester
            </label>
          </div>
          <div class="pref-group">
            <label>
              <input type="checkbox" v-model="settings.devtools.gitClient.enabled" class="amiga-checkbox" />
              Git Client
            </label>
          </div>
          <div class="pref-group">
            <label>
              <input type="checkbox" v-model="settings.devtools.docker.enabled" class="amiga-checkbox" />
              Docker Manager
            </label>
          </div>
          <div class="pref-group">
            <label>
              <input type="checkbox" v-model="settings.devtools.npmManager.enabled" class="amiga-checkbox" />
              NPM Package Manager
            </label>
          </div>
          <div class="pref-group">
            <label>
              <input type="checkbox" v-model="settings.devtools.envEditor.enabled" class="amiga-checkbox" />
              Environment Editor
            </label>
          </div>
          <div class="pref-group">
            <label>
              <input type="checkbox" v-model="settings.devtools.logViewer.enabled" class="amiga-checkbox" />
              Log Viewer
            </label>
          </div>
          <div class="pref-group">
            <label>
              <input type="checkbox" v-model="settings.devtools.snippets.enabled" class="amiga-checkbox" />
              Code Snippets Manager
            </label>
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
  { id: 'widgets', name: 'Widgets' },
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
  widgets: {
    clock: {
      enabled: true,
      showDate: true,
      showSeconds: true
    },
    weather: {
      enabled: false,
      location: 'New York',
      units: 'metric'
    },
    news: {
      enabled: false,
      category: 'technology',
      maxItems: 5
    }
  },
  devtools: {
    database: {
      enabled: true,
      defaultType: 'postgresql'
    },
    github: {
      enabled: true,
      token: ''
    },
    apiTester: {
      enabled: true
    },
    jsonFormatter: {
      enabled: true
    },
    regexTester: {
      enabled: true
    },
    gitClient: {
      enabled: true
    },
    docker: {
      enabled: true
    },
    npmManager: {
      enabled: true
    },
    envEditor: {
      enabled: true
    },
    logViewer: {
      enabled: true
    },
    snippets: {
      enabled: true
    }
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
      widgets: {
        clock: {
          enabled: true,
          showDate: true,
          showSeconds: true
        },
        weather: {
          enabled: false,
          location: 'New York',
          units: 'metric'
        },
        news: {
          enabled: false,
          category: 'technology',
          maxItems: 5
        }
      },
      devtools: {
        database: {
          enabled: true,
          defaultType: 'postgresql'
        },
        github: {
          enabled: true,
          token: ''
        },
        apiTester: {
          enabled: true
        },
        jsonFormatter: {
          enabled: true
        },
        regexTester: {
          enabled: true
        },
        gitClient: {
          enabled: true
        },
        docker: {
          enabled: true
        },
        npmManager: {
          enabled: true
        },
        envEditor: {
          enabled: true
        },
        logViewer: {
          enabled: true
        },
        snippets: {
          enabled: true
        }
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

.widget-intro {
  font-size: 8px;
  color: #666666;
  margin-bottom: 16px;
  line-height: 1.5;
}

.widget-section {
  background: #f0f0f0;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 12px;
  margin-bottom: 16px;
}

.widget-section h4 {
  font-size: 10px;
  color: #0055aa;
  margin: 0 0 12px 0;
  padding-bottom: 6px;
  border-bottom: 1px solid #cccccc;
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

.amiga-input:focus {
  outline: 1px solid #0055aa;
}

.hint-text {
  font-size: 6px;
  color: #888888;
  font-style: italic;
  margin-top: 2px;
}
</style>
