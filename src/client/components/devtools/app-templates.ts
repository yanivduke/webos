/**
 * App Templates for WebOS App Builder
 * Contains template code strings for different app types
 */

export const APP_TEMPLATES = {
  blank: `<template>
  <div class="app-container">
    <h1>{{ appName }}</h1>
    <p>Welcome to your new WebOS app!</p>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const appName = ref('My App');
</script>`,

  calculator: `<template>
  <div class="calculator">
    <div class="display">{{ display }}</div>
    <div class="keypad">
      <button v-for="key in keys" :key="key" @click="handleKey(key)">
        {{ key }}
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const display = ref('0');
const keys = ['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'];

const handleKey = (key: string) => {
  // Add calculator logic here
  console.log('Key pressed:', key);
};
</script>`,

  notepad: `<template>
  <div class="notepad">
    <div class="toolbar">
      <button @click="newFile">New</button>
      <button @click="saveFile">Save</button>
      <button @click="openFile">Open</button>
    </div>
    <textarea v-model="content" class="editor"></textarea>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const content = ref('');

const newFile = () => content.value = '';
const saveFile = () => console.log('Save:', content.value);
const openFile = () => console.log('Open file');
</script>`,

  custom: `<template>
  <div class="custom-app">
    <!-- Your custom app UI here -->
  </div>
</template>

<script lang="ts" setup>
// Your custom app logic here
</script>`
};

export const DEFAULT_TEMPLATE_STYLES = `.app-container {
  padding: 20px;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
}

h1 {
  font-size: 12px;
  color: #0055aa;
  margin-bottom: 12px;
}

button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 12px;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
}

button:active {
  border-color: #000000 #ffffff #ffffff #000000;
}`;
