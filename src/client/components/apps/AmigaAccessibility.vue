<template>
  <div class="accessibility-preferences" role="main" aria-label="Accessibility Preferences">
    <!-- Header -->
    <div class="preferences-header">
      <h2>Accessibility Preferences</h2>
      <p class="subtitle">Customize WebOS to meet your needs</p>
    </div>

    <!-- Settings Sections -->
    <div class="preferences-content">
      <!-- Screen Reader Section -->
      <section class="preference-section" aria-labelledby="screen-reader-heading">
        <h3 id="screen-reader-heading" class="section-title">
          <span class="section-icon">👁</span>
          Screen Reader
        </h3>

        <div class="preference-row">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="localSettings.screenReader"
              @change="applySettings"
              aria-describedby="screen-reader-desc"
            />
            <span>Enable Screen Reader</span>
          </label>
          <p id="screen-reader-desc" class="description">
            Announces UI actions and navigation for visually impaired users
          </p>
        </div>

        <div class="preference-row" v-if="localSettings.screenReader">
          <label for="verbosity-select">Verbosity Level:</label>
          <select
            id="verbosity-select"
            v-model="localSettings.screenReaderVerbosity"
            @change="applySettings"
            class="amiga-select"
          >
            <option value="low">Low - Essential announcements only</option>
            <option value="medium">Medium - Balanced detail</option>
            <option value="high">High - Maximum detail with hints</option>
          </select>
        </div>
      </section>

      <!-- Visual Section -->
      <section class="preference-section" aria-labelledby="visual-heading">
        <h3 id="visual-heading" class="section-title">
          <span class="section-icon">🎨</span>
          Visual
        </h3>

        <div class="preference-row">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="localSettings.highContrast"
              @change="applySettings"
              aria-describedby="high-contrast-desc"
            />
            <span>High Contrast Mode</span>
          </label>
          <p id="high-contrast-desc" class="description">
            Increases contrast for better visibility
          </p>
        </div>

        <div class="preference-row">
          <label for="text-scale-slider">
            Text Size: {{ localSettings.textScale }}%
          </label>
          <div class="slider-container">
            <input
              id="text-scale-slider"
              type="range"
              min="100"
              max="200"
              step="25"
              v-model.number="localSettings.textScale"
              @input="applySettings"
              class="amiga-slider"
              aria-valuemin="100"
              aria-valuemax="200"
              :aria-valuenow="localSettings.textScale"
              aria-valuetext="`${localSettings.textScale} percent`"
            />
            <div class="slider-labels">
              <span>100%</span>
              <span>125%</span>
              <span>150%</span>
              <span>175%</span>
              <span>200%</span>
            </div>
          </div>
          <p class="description">
            Adjust text size throughout the interface
          </p>
        </div>

        <div class="preference-row">
          <label for="colorblind-select">Color Blind Mode:</label>
          <select
            id="colorblind-select"
            v-model="localSettings.colorBlindMode"
            @change="applySettings"
            class="amiga-select"
          >
            <option value="none">None</option>
            <option value="deuteranopia">Deuteranopia (Red-Green)</option>
            <option value="protanopia">Protanopia (Red Weak)</option>
            <option value="tritanopia">Tritanopia (Blue-Yellow)</option>
            <option value="monochromacy">Monochromacy (Grayscale)</option>
          </select>
          <p class="description" v-if="colorBlindInfo">
            {{ colorBlindInfo.description }}
            <br>
            <small>Affects {{ colorBlindInfo.affectedPopulation }}</small>
          </p>
        </div>
      </section>

      <!-- Motion Section -->
      <section class="preference-section" aria-labelledby="motion-heading">
        <h3 id="motion-heading" class="section-title">
          <span class="section-icon">⚡</span>
          Motion
        </h3>

        <div class="preference-row">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="localSettings.reducedMotion"
              @change="applySettings"
              aria-describedby="reduced-motion-desc"
            />
            <span>Reduce Motion</span>
          </label>
          <p id="reduced-motion-desc" class="description">
            Minimizes animations and transitions
          </p>
        </div>

        <div class="system-preference" v-if="systemPrefersReducedMotion">
          <span class="info-icon">ℹ️</span>
          System preference detected: Reduced motion enabled
        </div>
      </section>

      <!-- Keyboard Section -->
      <section class="preference-section" aria-labelledby="keyboard-heading">
        <h3 id="keyboard-heading" class="section-title">
          <span class="section-icon">⌨️</span>
          Keyboard
        </h3>

        <div class="preference-row">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="localSettings.focusIndicators"
              @change="applySettings"
              aria-describedby="focus-indicators-desc"
            />
            <span>Show Focus Indicators</span>
          </label>
          <p id="focus-indicators-desc" class="description">
            Highlights focused elements for keyboard navigation
          </p>
        </div>

        <div class="preference-row">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="localSettings.keyboardNavigationHelp"
              @change="applySettings"
              aria-describedby="keyboard-help-desc"
            />
            <span>Show Keyboard Shortcuts</span>
          </label>
          <p id="keyboard-help-desc" class="description">
            Displays keyboard shortcut hints
          </p>
        </div>

        <div class="shortcuts-list" v-if="localSettings.keyboardNavigationHelp">
          <h4>Available Keyboard Shortcuts:</h4>
          <ul role="list">
            <li v-for="(action, shortcut) in keyboardShortcuts" :key="shortcut">
              <kbd>{{ shortcut }}</kbd> - {{ action }}
            </li>
          </ul>
        </div>
      </section>

      <!-- Experimental Section -->
      <section class="preference-section" aria-labelledby="experimental-heading">
        <h3 id="experimental-heading" class="section-title">
          <span class="section-icon">🧪</span>
          Experimental
        </h3>

        <div class="preference-row">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="localSettings.voiceCommands"
              @change="applySettings"
              aria-describedby="voice-commands-desc"
            />
            <span>Voice Commands (Experimental)</span>
          </label>
          <p id="voice-commands-desc" class="description">
            Enable voice control for WebOS (requires browser support)
          </p>
        </div>
      </section>
    </div>

    <!-- Action Buttons -->
    <div class="preferences-footer">
      <button
        @click="resetToDefaults"
        class="amiga-button"
        aria-label="Reset all settings to defaults"
      >
        Reset to Defaults
      </button>

      <button
        @click="applySystemPreferences"
        class="amiga-button"
        aria-label="Apply system accessibility preferences"
      >
        Apply System Preferences
      </button>

      <div class="status-message" role="status" aria-live="polite">
        {{ statusMessage }}
      </div>
    </div>

    <!-- Live Preview -->
    <div class="live-preview" v-if="previewEnabled">
      <h4>Preview:</h4>
      <div class="preview-content">
        <p>Sample text with current settings applied</p>
        <button class="amiga-button">Sample Button</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { accessibilityManager, type AccessibilitySettings } from '../../utils/accessibility-manager';
import { colorBlindFilters } from '../../utils/color-blind-filters';
import { screenReader } from '../../utils/screen-reader';

// Local state
const localSettings = ref<AccessibilitySettings>(accessibilityManager.getSettings());
const statusMessage = ref('');
const previewEnabled = ref(true);
const systemPrefersReducedMotion = ref(false);

// Computed
const keyboardShortcuts = computed(() => accessibilityManager.getKeyboardShortcuts());

const colorBlindInfo = computed(() => {
  if (localSettings.value.colorBlindMode === 'none') return null;
  return colorBlindFilters.getFilter(localSettings.value.colorBlindMode);
});

// Methods
const applySettings = () => {
  accessibilityManager.updateSettings(localSettings.value);
  statusMessage.value = 'Settings applied';
  screenReader.announceStatus('Accessibility settings updated');

  // Clear status message after 3 seconds
  setTimeout(() => {
    statusMessage.value = '';
  }, 3000);
};

const resetToDefaults = () => {
  if (confirm('Reset all accessibility settings to defaults?')) {
    accessibilityManager.resetSettings();
    localSettings.value = accessibilityManager.getSettings();
    statusMessage.value = 'Settings reset to defaults';
    screenReader.announceStatus('Accessibility settings reset to defaults');
  }
};

const applySystemPreferences = () => {
  accessibilityManager.applySystemPreferences();
  localSettings.value = accessibilityManager.getSettings();
  statusMessage.value = 'System preferences applied';
  screenReader.announceStatus('System accessibility preferences applied');
};

// Lifecycle
onMounted(() => {
  // Check system preferences
  systemPrefersReducedMotion.value = accessibilityManager.prefersReducedMotion();

  // Listen for settings changes
  accessibilityManager.addListener((settings) => {
    localSettings.value = settings;
  });

  // Announce component load
  screenReader.announceWindowOpened('Accessibility Preferences', 'settings');
});

// Watch for external changes
watch(() => accessibilityManager.getSettings(), (newSettings) => {
  localSettings.value = newSettings;
}, { deep: true });
</script>

<style scoped>
.accessibility-preferences {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
}

.preferences-header {
  margin-bottom: 30px;
  border-bottom: 3px solid;
  border-color: #000000;
  padding-bottom: 15px;
}

.preferences-header h2 {
  margin: 0 0 10px 0;
  font-size: 16px;
}

.subtitle {
  margin: 0;
  font-size: 10px;
  color: #666666;
}

.preferences-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.preference-section {
  background: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 15px;
}

.section-title {
  margin: 0 0 15px 0;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 2px solid #a0a0a0;
  padding-bottom: 10px;
}

.section-icon {
  font-size: 16px;
}

.preference-row {
  margin: 15px 0;
  padding: 10px;
  background: #f0f0f0;
  border: 1px solid #d0d0d0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 10px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.description {
  margin: 8px 0 0 0;
  font-size: 9px;
  color: #666666;
  line-height: 1.4;
}

.amiga-select {
  width: 100%;
  padding: 8px;
  margin-top: 8px;
  background: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
}

.slider-container {
  margin-top: 10px;
}

.amiga-slider {
  width: 100%;
  height: 8px;
  background: #d0d0d0;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  outline: none;
  cursor: pointer;
}

.amiga-slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  background: #0055aa;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
}

.amiga-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #0055aa;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 8px;
  margin-top: 5px;
  color: #666666;
}

.system-preference {
  margin-top: 10px;
  padding: 10px;
  background: #ffffcc;
  border: 2px solid #ffaa00;
  font-size: 9px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-icon {
  font-size: 14px;
}

.shortcuts-list {
  margin-top: 15px;
  padding: 15px;
  background: #ffffff;
  border: 2px solid #a0a0a0;
}

.shortcuts-list h4 {
  margin: 0 0 10px 0;
  font-size: 10px;
}

.shortcuts-list ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.shortcuts-list li {
  margin: 8px 0;
  font-size: 9px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.shortcuts-list kbd {
  display: inline-block;
  padding: 4px 8px;
  background: #000000;
  color: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  min-width: 60px;
  text-align: center;
}

.preferences-footer {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 3px solid #000000;
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 10px 20px;
  font-size: 10px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  transition: all 0.1s;
}

.amiga-button:hover {
  background: #888888;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #707070;
}

.status-message {
  flex: 1;
  font-size: 9px;
  color: #00aa00;
  min-height: 20px;
}

.live-preview {
  margin-top: 30px;
  padding: 20px;
  background: #e0e0e0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.live-preview h4 {
  margin: 0 0 15px 0;
  font-size: 11px;
}

.preview-content {
  padding: 15px;
  background: #ffffff;
  border: 2px solid #a0a0a0;
}

.preview-content p {
  margin: 0 0 15px 0;
  font-size: 10px;
}

/* Responsive */
@media (max-width: 768px) {
  .accessibility-preferences {
    padding: 10px;
  }

  .preferences-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .amiga-button {
    width: 100%;
  }
}
</style>
