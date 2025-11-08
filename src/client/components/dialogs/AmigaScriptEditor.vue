<template>
  <div class="script-editor-overlay" @click="handleOverlayClick">
    <div class="script-editor-dialog" @click.stop>
      <!-- Title bar -->
      <div class="editor-titlebar">
        <span class="editor-title">Script Editor - {{ fileName }}</span>
        <button class="close-btn" @click="close">×</button>
      </div>

      <!-- Toolbar -->
      <div class="editor-toolbar">
        <button class="toolbar-btn" @click="newScript">New</button>
        <button class="toolbar-btn" @click="saveScript">Save</button>
        <button class="toolbar-btn" @click="saveAsScript">Save As</button>
        <button class="toolbar-btn" @click="runScript">Run</button>
        <div class="toolbar-spacer"></div>
        <select v-model="selectedTemplate" @change="loadTemplate" class="template-select">
          <option value="">-- Templates --</option>
          <option value="hello.sh">Hello World (Shell)</option>
          <option value="info.sh">System Info (Shell)</option>
          <option value="backup.sh">Backup Script (Shell)</option>
          <option value="search.sh">Search Script (Shell)</option>
          <option value="test.js">Test Script (JS)</option>
          <option value="loop.sh">Loop Example (Shell)</option>
        </select>
      </div>

      <!-- Editor area -->
      <div class="editor-container">
        <!-- Line numbers -->
        <div class="line-numbers">
          <div v-for="n in lineCount" :key="n" class="line-number">{{ n }}</div>
        </div>

        <!-- Code editor -->
        <textarea
          ref="codeEditor"
          v-model="scriptContent"
          class="code-editor"
          spellcheck="false"
          @input="handleInput"
          @keydown="handleKeyDown"
          @scroll="syncScroll"
        ></textarea>
      </div>

      <!-- Status bar -->
      <div class="editor-statusbar">
        <span class="status-item">Lines: {{ lineCount }}</span>
        <span class="status-item">Chars: {{ scriptContent.length }}</span>
        <span class="status-item">Type: {{ fileExtension }}</span>
        <span class="status-item" v-if="modified">Modified</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import ScriptRunner from '../../utils/script-runner';

const props = defineProps<{
  filePath?: string;
  fileName?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'run', script: string): void;
}>();

const codeEditor = ref<HTMLTextAreaElement | null>(null);
const scriptContent = ref('');
const fileName = ref(props.fileName || 'untitled.sh');
const currentPath = ref(props.filePath || '');
const modified = ref(false);
const selectedTemplate = ref('');

const _scriptRunner = new ScriptRunner();

const lineCount = computed(() => {
  return scriptContent.value.split('\n').length;
});

const fileExtension = computed(() => {
  const ext = fileName.value.split('.').pop()?.toLowerCase();
  if (ext === 'sh' || ext === 'bash') return 'Shell Script';
  if (ext === 'js') return 'JavaScript';
  return 'Unknown';
});

onMounted(async () => {
  // Load file if path provided
  if (props.filePath) {
    await loadFile(props.filePath);
  } else {
    // Start with a template
    scriptContent.value = `#!/bin/sh
# WebOS Shell Script
# Created: ${new Date().toLocaleDateString()}

echo "Hello from WebOS!"
pwd
ls
`;
  }

  // Focus editor
  nextTick(() => {
    if (codeEditor.value) {
      codeEditor.value.focus();
    }
  });
});

const loadFile = async (path: string) => {
  try {
    const response = await fetch('/api/files/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    });

    if (response.ok) {
      const data = await response.json();
      scriptContent.value = data.content;
      modified.value = false;
    }
  } catch (error) {
    console.error('Failed to load script:', error);
  }
};

const handleInput = () => {
  modified.value = true;
};

const handleKeyDown = (event: KeyboardEvent) => {
  // Tab key - insert spaces instead
  if (event.key === 'Tab') {
    event.preventDefault();
    const start = codeEditor.value?.selectionStart || 0;
    const end = codeEditor.value?.selectionEnd || 0;

    scriptContent.value =
      scriptContent.value.substring(0, start) +
      '  ' +
      scriptContent.value.substring(end);

    nextTick(() => {
      if (codeEditor.value) {
        codeEditor.value.selectionStart = start + 2;
        codeEditor.value.selectionEnd = start + 2;
      }
    });
  }

  // Ctrl+S - Save
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault();
    saveScript();
  }

  // Ctrl+R - Run
  if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
    event.preventDefault();
    runScript();
  }
};

const syncScroll = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  const lineNumbers = target.previousElementSibling as HTMLElement;
  if (lineNumbers) {
    lineNumbers.scrollTop = target.scrollTop;
  }
};

const newScript = () => {
  if (modified.value) {
    if (!confirm('You have unsaved changes. Continue?')) {
      return;
    }
  }

  fileName.value = 'untitled.sh';
  currentPath.value = '';
  scriptContent.value = `#!/bin/sh
# WebOS Shell Script

echo "New script"
`;
  modified.value = false;
};

const saveScript = async () => {
  if (!currentPath.value) {
    await saveAsScript();
    return;
  }

  try {
    const response = await fetch('/api/files/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: currentPath.value,
        content: scriptContent.value
      })
    });

    if (response.ok) {
      modified.value = false;
      alert('Script saved successfully!');
    } else {
      alert('Failed to save script');
    }
  } catch (error) {
    alert('Error saving script');
  }
};

const saveAsScript = async () => {
  const name = prompt('Enter script filename:', fileName.value);
  if (!name) return;

  const path = `dh0/${name}`;

  try {
    const response = await fetch('/api/files/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'dh0',
        name: name,
        type: 'file',
        content: scriptContent.value
      })
    });

    if (response.ok) {
      fileName.value = name;
      currentPath.value = path;
      modified.value = false;
      alert('Script saved successfully!');
    } else {
      const data = await response.json();
      alert(`Failed to save: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    alert('Error saving script');
  }
};

const runScript = () => {
  if (modified.value) {
    if (!confirm('Save script before running?')) {
      // Run unsaved script
      emit('run', scriptContent.value);
      return;
    }
    saveScript().then(() => {
      emit('run', scriptContent.value);
    });
  } else {
    emit('run', scriptContent.value);
  }
};

const loadTemplate = () => {
  if (!selectedTemplate.value) return;

  if (modified.value) {
    if (!confirm('You have unsaved changes. Continue?')) {
      selectedTemplate.value = '';
      return;
    }
  }

  const templates = scriptRunner.getTemplates();
  const template = templates[selectedTemplate.value];

  if (template) {
    scriptContent.value = template;
    fileName.value = selectedTemplate.value;
    currentPath.value = '';
    modified.value = false;
  }

  selectedTemplate.value = '';
};

const handleOverlayClick = () => {
  if (modified.value) {
    if (confirm('You have unsaved changes. Close anyway?')) {
      close();
    }
  } else {
    close();
  }
};

const close = () => {
  if (modified.value) {
    if (!confirm('You have unsaved changes. Close anyway?')) {
      return;
    }
  }
  emit('close');
};
</script>

<style scoped>
.script-editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.script-editor-dialog {
  width: 800px;
  height: 600px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

/* Title bar */
.editor-titlebar {
  background: #0055aa;
  color: #ffffff;
  padding: 6px 8px;
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #000000;
}

.editor-title {
  flex: 1;
}

.close-btn {
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  line-height: 1;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Toolbar */
.editor-toolbar {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: #888888;
  border-bottom: 2px solid #000000;
}

.toolbar-btn {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 12px;
  font-size: 10px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  color: #000000;
}

.toolbar-btn:hover {
  background: #b0b0b0;
}

.toolbar-btn:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.toolbar-spacer {
  flex: 1;
}

.template-select {
  font-size: 10px;
  font-family: 'Press Start 2P', monospace;
  padding: 4px;
  border: 2px solid #000000;
  background: #ffffff;
}

/* Editor container */
.editor-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  background: #ffffff;
  position: relative;
}

/* Line numbers */
.line-numbers {
  width: 40px;
  background: #e0e0e0;
  border-right: 1px solid #999999;
  padding: 8px 4px;
  overflow: hidden;
  user-select: none;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  text-align: right;
  color: #666666;
}

.line-number {
  height: 18px;
}

/* Code editor */
.code-editor {
  flex: 1;
  padding: 8px;
  border: none;
  outline: none;
  resize: none;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  background: #ffffff;
  color: #000000;
  overflow-y: scroll;
  overflow-x: auto;
  white-space: pre;
}

.code-editor::-webkit-scrollbar {
  width: 14px;
  height: 14px;
}

.code-editor::-webkit-scrollbar-track {
  background: #d0d0d0;
}

.code-editor::-webkit-scrollbar-thumb {
  background: #888888;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.code-editor::-webkit-scrollbar-thumb:hover {
  background: #999999;
}

/* Status bar */
.editor-statusbar {
  display: flex;
  gap: 20px;
  padding: 4px 8px;
  background: #888888;
  border-top: 2px solid #000000;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: #000000;
}

.status-item {
  padding: 2px 4px;
}

/* Syntax highlighting classes (basic) */
.code-editor {
  tab-size: 2;
  -moz-tab-size: 2;
}
</style>
