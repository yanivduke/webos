<template>
  <div class="json-formatter">
    <div class="json-toolbar">
      <button class="amiga-button" @click="formatJSON">Format</button>
      <button class="amiga-button" @click="minifyJSON">Minify</button>
      <button class="amiga-button" @click="validateJSON">Validate</button>
      <button class="amiga-button" @click="clearAll">Clear</button>
      <select v-model="indentSize" class="amiga-select">
        <option value="2">2 spaces</option>
        <option value="4">4 spaces</option>
        <option value="tab">Tab</option>
      </select>
    </div>

    <div class="json-content">
      <div class="input-panel">
        <div class="panel-header">Input</div>
        <textarea
          v-model="inputText"
          class="json-textarea"
          placeholder="Paste JSON or XML here..."
          spellcheck="false"
        ></textarea>
      </div>

      <div class="output-panel">
        <div class="panel-header">
          Output
          <button v-if="outputText" class="copy-button" @click="copyOutput">Copy</button>
        </div>
        <div v-if="error" class="error-message">{{ error }}</div>
        <textarea
          v-else
          v-model="outputText"
          class="json-textarea"
          readonly
          placeholder="Formatted output will appear here..."
          spellcheck="false"
        ></textarea>
      </div>
    </div>

    <div class="json-footer">
      <span v-if="stats">{{ stats }}</span>
      <span v-else>Ready</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const inputText = ref('');
const outputText = ref('');
const error = ref('');
const stats = ref('');
const indentSize = ref('2');

const formatJSON = () => {
  try {
    error.value = '';
    const parsed = JSON.parse(inputText.value);
    const indent = indentSize.value === 'tab' ? '\t' : parseInt(indentSize.value);
    outputText.value = JSON.stringify(parsed, null, indent);

    const lines = outputText.value.split('\n').length;
    const chars = outputText.value.length;
    stats.value = `Formatted: ${lines} lines, ${chars} characters`;
    setTimeout(() => stats.value = '', 3000);
  } catch (err: any) {
    error.value = `Invalid JSON: ${err.message}`;
    outputText.value = '';
  }
};

const minifyJSON = () => {
  try {
    error.value = '';
    const parsed = JSON.parse(inputText.value);
    outputText.value = JSON.stringify(parsed);

    const chars = outputText.value.length;
    stats.value = `Minified: ${chars} characters`;
    setTimeout(() => stats.value = '', 3000);
  } catch (err: any) {
    error.value = `Invalid JSON: ${err.message}`;
    outputText.value = '';
  }
};

const validateJSON = () => {
  try {
    error.value = '';
    JSON.parse(inputText.value);
    stats.value = '✓ Valid JSON';
    setTimeout(() => stats.value = '', 3000);
  } catch (err: any) {
    error.value = `Invalid JSON: ${err.message}`;
  }
};

const clearAll = () => {
  inputText.value = '';
  outputText.value = '';
  error.value = '';
  stats.value = '';
};

const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(outputText.value);
    stats.value = 'Copied to clipboard!';
    setTimeout(() => stats.value = '', 2000);
  } catch (err) {
    stats.value = 'Failed to copy';
    setTimeout(() => stats.value = '', 2000);
  }
};
</script>

<style scoped>
.json-formatter {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  font-family: 'Press Start 2P', monospace;
}

.json-toolbar {
  display: flex;
  gap: 4px;
  padding: 8px;
  background: #a0a0a0;
  border-bottom: 2px solid #000000;
  flex-wrap: wrap;
}

.json-content {
  flex: 1;
  display: flex;
  gap: 8px;
  padding: 8px;
  overflow: hidden;
}

.input-panel,
.output-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.panel-header {
  background: #0055aa;
  color: #ffffff;
  padding: 4px 8px;
  font-size: 8px;
  font-weight: bold;
  border: 2px solid #000000;
  border-bottom: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.copy-button {
  background: #00aa00;
  color: #ffffff;
  border: 1px solid #ffffff;
  padding: 2px 6px;
  font-size: 6px;
  cursor: pointer;
  font-family: 'Press Start 2P', monospace;
}

.copy-button:active {
  background: #008800;
}

.json-textarea {
  flex: 1;
  padding: 8px;
  border: 2px solid #000000;
  border-top: none;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: #000000;
  background: #ffffff;
  resize: none;
  line-height: 1.5;
  overflow: auto;
}

.json-textarea:focus {
  outline: none;
  background: #fffff8;
}

.json-textarea[readonly] {
  background: #f8f8f8;
}

.error-message {
  flex: 1;
  padding: 16px;
  background: #ffeeee;
  border: 2px solid #ff0000;
  color: #ff0000;
  font-size: 7px;
  line-height: 1.5;
  overflow: auto;
}

.json-footer {
  background: #888888;
  color: #ffffff;
  padding: 4px 8px;
  font-size: 6px;
  border-top: 2px solid #000000;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 8px;
  font-size: 7px;
  cursor: pointer;
  color: #000000;
  font-family: 'Press Start 2P', monospace;
}

.amiga-button:hover {
  background: #b0b0b0;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-select {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px 8px;
  font-size: 7px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
}
</style>
