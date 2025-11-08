<template>
  <div class="amiga-code-editor">
    <!-- Menu Bar -->
    <div class="editor-menu">
      <div class="menu-section" @click="toggleFileMenu">
        <span class="menu-label">File</span>
        <div v-if="showFileMenu" class="menu-dropdown" @click.stop>
          <div class="menu-item" @click="newFile">New (Ctrl+N)</div>
          <div class="menu-item" @click="showOpenDialog = true">Open (Ctrl+O)</div>
          <div class="menu-separator"></div>
          <div class="menu-item" @click="saveFile" :class="{ disabled: !currentTab?.isDirty }">Save (Ctrl+S)</div>
          <div class="menu-item" @click="saveAsFile">Save As...</div>
          <div class="menu-separator"></div>
          <div class="menu-item" @click="closeCurrentTab">Close Tab</div>
        </div>
      </div>

      <div class="menu-section" @click="toggleEditMenu">
        <span class="menu-label">Edit</span>
        <div v-if="showEditMenu" class="menu-dropdown" @click.stop>
          <div class="menu-item" @click="undo">Undo (Ctrl+Z)</div>
          <div class="menu-item" @click="redo">Redo (Ctrl+Y)</div>
          <div class="menu-separator"></div>
          <div class="menu-item" @click="cut">Cut (Ctrl+X)</div>
          <div class="menu-item" @click="copy">Copy (Ctrl+C)</div>
          <div class="menu-item" @click="paste">Paste (Ctrl+V)</div>
          <div class="menu-separator"></div>
          <div class="menu-item" @click="showFindDialog = true">Find (Ctrl+F)</div>
          <div class="menu-item" @click="showReplaceDialog = true">Replace (Ctrl+H)</div>
          <div class="menu-item" @click="showGoToLineDialog = true">Go to Line (Ctrl+G)</div>
        </div>
      </div>

      <div class="menu-section" @click="toggleViewMenu">
        <span class="menu-label">View</span>
        <div v-if="showViewMenu" class="menu-dropdown" @click.stop>
          <div class="menu-item" @click="toggleLineNumbers">
            {{ showLineNumbers ? '✓' : '  ' }} Line Numbers
          </div>
          <div class="menu-item" @click="toggleWordWrap">
            {{ wordWrap ? '✓' : '  ' }} Word Wrap
          </div>
          <div class="menu-item" @click="toggleWhitespace">
            {{ showWhitespace ? '✓' : '  ' }} Show Whitespace
          </div>
          <div class="menu-separator"></div>
          <div class="menu-item" @click="zoomIn">Zoom In (Ctrl++)</div>
          <div class="menu-item" @click="zoomOut">Zoom Out (Ctrl+-)</div>
          <div class="menu-item" @click="resetZoom">Reset Zoom (Ctrl+0)</div>
        </div>
      </div>

      <div class="menu-spacer"></div>

      <!-- Language Selector -->
      <div class="language-selector">
        <label>Lang:</label>
        <select v-model="currentLanguage" @change="updateLanguage" class="amiga-select">
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="json">JSON</option>
          <option value="markdown">Markdown</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="plaintext">Plain Text</option>
        </select>
      </div>

      <!-- Theme Selector -->
      <div class="theme-selector">
        <label>Theme:</label>
        <select v-model="currentTheme" class="amiga-select">
          <option value="amiga">Amiga</option>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>
    </div>

    <!-- Tabs Bar -->
    <div class="tabs-bar" v-if="tabs.length > 0">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="tab"
        :class="{ active: tab.id === currentTabId }"
        @click="switchTab(tab.id)"
      >
        <span class="tab-title">{{ tab.title }}{{ tab.isDirty ? '*' : '' }}</span>
        <span class="tab-close" @click.stop="closeTab(tab.id)">×</span>
      </div>
      <div class="tab-new" @click="newFile" title="New File">+</div>
    </div>

    <!-- Toolbar -->
    <div class="editor-toolbar">
      <button class="amiga-button" @click="newFile" title="New File">New</button>
      <button class="amiga-button" @click="showOpenDialog = true" title="Open">Open</button>
      <button class="amiga-button" @click="saveFile" :disabled="!currentTab?.isDirty" title="Save">Save</button>
      <div class="toolbar-separator"></div>
      <button class="amiga-button" @click="undo" title="Undo">↶</button>
      <button class="amiga-button" @click="redo" title="Redo">↷</button>
      <div class="toolbar-separator"></div>
      <button class="amiga-button" @click="showFindDialog = true" title="Find">Find</button>
      <button class="amiga-button" @click="showReplaceDialog = true" title="Replace">Replace</button>
      <div class="toolbar-separator"></div>
      <button class="amiga-button" @click="commentToggle" title="Toggle Comment">// </button>
      <button class="amiga-button" @click="duplicateLine" title="Duplicate Line">⎘</button>
      <button class="amiga-button" @click="deleteLine" title="Delete Line">✕</button>
    </div>

    <!-- Editor Container -->
    <div class="editor-main" :class="{ 'word-wrap': wordWrap }" :style="{ fontSize: fontSize + 'px' }">
      <div v-if="currentTab" class="editor-content">
        <!-- Line Numbers -->
        <div v-if="showLineNumbers" class="line-numbers" ref="lineNumbersRef">
          <div
            v-for="n in lineCount"
            :key="n"
            class="line-number"
            :class="{ active: n === currentLine }"
          >
            {{ n }}
          </div>
        </div>

        <!-- Code Editor -->
        <div class="code-container">
          <textarea
            ref="textareaRef"
            v-model="currentTab.content"
            @input="handleInput"
            @keydown="handleKeyDown"
            @scroll="syncScroll"
            @click="updateCursorPosition"
            @keyup="updateCursorPosition"
            class="code-input"
            :class="themeClass"
            spellcheck="false"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
          ></textarea>

          <!-- Syntax Highlighted Overlay -->
          <pre
            ref="highlightRef"
            class="code-highlight"
            :class="themeClass"
            aria-hidden="true"
          ><code :class="`language-${currentLanguage}`" v-html="highlightedCode"></code></pre>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-message">No file open</div>
        <button class="amiga-button" @click="newFile">Create New File</button>
      </div>
    </div>

    <!-- Status Bar -->
    <div class="status-bar">
      <span class="status-item">{{ currentLanguage.toUpperCase() }}</span>
      <span class="status-item">UTF-8</span>
      <span class="status-item">Ln {{ currentLine }}, Col {{ currentColumn }}</span>
      <span class="status-item">{{ fileSize }}</span>
      <span class="status-item">{{ statusMessage }}</span>
      <span class="status-item" v-if="currentTab?.isDirty">Modified</span>
    </div>

    <!-- Find Dialog -->
    <div v-if="showFindDialog" class="dialog-overlay" @click="showFindDialog = false">
      <div class="amiga-dialog" @click.stop>
        <div class="dialog-title">Find</div>
        <div class="dialog-content">
          <label>Find:</label>
          <input
            ref="findInputRef"
            v-model="findText"
            type="text"
            class="amiga-input"
            @keyup.enter="findNext"
            @keyup.esc="showFindDialog = false"
          />
          <div class="dialog-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="findCaseSensitive" />
              Case sensitive
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="findRegex" />
              Regex
            </label>
          </div>
        </div>
        <div class="dialog-buttons">
          <button class="amiga-button" @click="findNext">Find Next</button>
          <button class="amiga-button" @click="findPrevious">Find Previous</button>
          <button class="amiga-button" @click="showFindDialog = false">Close</button>
        </div>
      </div>
    </div>

    <!-- Replace Dialog -->
    <div v-if="showReplaceDialog" class="dialog-overlay" @click="showReplaceDialog = false">
      <div class="amiga-dialog" @click.stop>
        <div class="dialog-title">Find and Replace</div>
        <div class="dialog-content">
          <label>Find:</label>
          <input
            v-model="findText"
            type="text"
            class="amiga-input"
            @keyup.enter="findNext"
          />
          <label>Replace:</label>
          <input
            v-model="replaceText"
            type="text"
            class="amiga-input"
            @keyup.enter="replaceNext"
          />
          <div class="dialog-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="findCaseSensitive" />
              Case sensitive
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="findRegex" />
              Regex
            </label>
          </div>
        </div>
        <div class="dialog-buttons">
          <button class="amiga-button" @click="replaceNext">Replace</button>
          <button class="amiga-button" @click="replaceAll">Replace All</button>
          <button class="amiga-button" @click="showReplaceDialog = false">Close</button>
        </div>
      </div>
    </div>

    <!-- Go to Line Dialog -->
    <div v-if="showGoToLineDialog" class="dialog-overlay" @click="showGoToLineDialog = false">
      <div class="amiga-dialog" @click.stop>
        <div class="dialog-title">Go to Line</div>
        <div class="dialog-content">
          <label>Line number:</label>
          <input
            ref="goToLineInputRef"
            v-model.number="goToLineNumber"
            type="number"
            class="amiga-input"
            @keyup.enter="goToLine"
            @keyup.esc="showGoToLineDialog = false"
            min="1"
            :max="lineCount"
          />
        </div>
        <div class="dialog-buttons">
          <button class="amiga-button" @click="goToLine">Go</button>
          <button class="amiga-button" @click="showGoToLineDialog = false">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Open File Dialog -->
    <div v-if="showOpenDialog" class="dialog-overlay" @click="showOpenDialog = false">
      <div class="amiga-dialog" @click.stop>
        <div class="dialog-title">Open File</div>
        <div class="dialog-content">
          <label>File path:</label>
          <input
            v-model="openFilePath"
            type="text"
            class="amiga-input"
            @keyup.enter="openFile"
            placeholder="dh0/filename.js"
          />
          <div class="recent-files" v-if="recentFiles.length > 0">
            <label>Recent files:</label>
            <div
              v-for="file in recentFiles"
              :key="file"
              class="recent-file-item"
              @click="openFilePath = file"
            >
              {{ file }}
            </div>
          </div>
        </div>
        <div class="dialog-buttons">
          <button class="amiga-button" @click="openFile">Open</button>
          <button class="amiga-button" @click="showOpenDialog = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-markup'; // HTML
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-cpp';

interface Tab {
  id: string;
  title: string;
  content: string;
  originalContent: string;
  isDirty: boolean;
  filePath: string;
  language: string;
  cursorPosition: number;
}

interface Props {
  data?: {
    filePath?: string;
    fileName?: string;
    content?: string;
  };
}

const props = defineProps<Props>();

// Tabs
const tabs = ref<Tab[]>([]);
const currentTabId = ref<string | null>(null);
const tabIdCounter = ref(0);

// Editor state
const currentLanguage = ref('javascript');
const currentTheme = ref('amiga');
const showLineNumbers = ref(true);
const wordWrap = ref(false);
const showWhitespace = ref(false);
const fontSize = ref(13);
const currentLine = ref(1);
const currentColumn = ref(1);
const statusMessage = ref('Ready');

// Menu state
const showFileMenu = ref(false);
const showEditMenu = ref(false);
const showViewMenu = ref(false);

// Dialog state
const showFindDialog = ref(false);
const showReplaceDialog = ref(false);
const showGoToLineDialog = ref(false);
const showOpenDialog = ref(false);

// Find/Replace
const findText = ref('');
const replaceText = ref('');
const findCaseSensitive = ref(false);
const findRegex = ref(false);
const goToLineNumber = ref(1);
const openFilePath = ref('');

// Recent files
const recentFiles = ref<string[]>([]);

// Undo/Redo
const undoStack = ref<string[]>([]);
const redoStack = ref<string[]>([]);

// Refs
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const highlightRef = ref<HTMLPreElement | null>(null);
const lineNumbersRef = ref<HTMLDivElement | null>(null);
const findInputRef = ref<HTMLInputElement | null>(null);
const goToLineInputRef = ref<HTMLInputElement | null>(null);

// Auto-save
let autoSaveInterval: number | undefined;

// Computed
const currentTab = computed(() => {
  if (!currentTabId.value) return null;
  return tabs.value.find(tab => tab.id === currentTabId.value) || null;
});

const lineCount = computed(() => {
  if (!currentTab.value) return 0;
  return currentTab.value.content.split('\n').length;
});

const fileSize = computed(() => {
  if (!currentTab.value) return '0 bytes';
  const bytes = new Blob([currentTab.value.content]).size;
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
});

const highlightedCode = computed(() => {
  if (!currentTab.value) return '';
  try {
    const language = currentLanguage.value === 'plaintext' ? 'markup' : currentLanguage.value;
    const grammar = Prism.languages[language];
    if (!grammar) return escapeHtml(currentTab.value.content);

    let highlighted = Prism.highlight(currentTab.value.content, grammar, language);

    // Show whitespace if enabled
    if (showWhitespace.value) {
      highlighted = highlighted.replace(/ /g, '·').replace(/\t/g, '→   ');
    }

    return highlighted;
  } catch (error) {
    console.error('Syntax highlighting error:', error);
    return escapeHtml(currentTab.value.content);
  }
});

const themeClass = computed(() => `theme-${currentTheme.value}`);

// Lifecycle
onMounted(async () => {
  // Load from props or create new tab
  if (props.data?.filePath) {
    await loadFileFromPath(props.data.filePath);
  } else {
    createNewTab('Untitled.txt', '', 'plaintext');
  }

  // Load recent files from localStorage
  loadRecentFiles();

  // Start auto-save
  autoSaveInterval = window.setInterval(autoSave, 30000); // 30 seconds

  // Load saved state
  loadEditorState();

  // Add keyboard shortcuts
  document.addEventListener('keydown', handleGlobalKeyDown);
});

onUnmounted(() => {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
  }
  document.removeEventListener('keydown', handleGlobalKeyDown);

  // Save state
  saveEditorState();
});

// Watch for dialog visibility to focus inputs
watch(showFindDialog, async (value) => {
  if (value) {
    await nextTick();
    findInputRef.value?.focus();
  }
});

watch(showGoToLineDialog, async (value) => {
  if (value) {
    await nextTick();
    goToLineInputRef.value?.focus();
    goToLineInputRef.value?.select();
  }
});

// Functions
function createNewTab(title: string, content: string = '', language: string = 'javascript'): Tab {
  const id = `tab-${++tabIdCounter.value}`;
  const tab: Tab = {
    id,
    title,
    content,
    originalContent: content,
    isDirty: false,
    filePath: '',
    language,
    cursorPosition: 0
  };
  tabs.value.push(tab);
  currentTabId.value = id;
  currentLanguage.value = language;

  nextTick(() => {
    textareaRef.value?.focus();
  });

  return tab;
}

function newFile() {
  createNewTab('Untitled.txt', '', 'plaintext');
  statusMessage.value = 'New file created';
  closeAllMenus();
}

function switchTab(tabId: string) {
  if (currentTab.value && textareaRef.value) {
    currentTab.value.cursorPosition = textareaRef.value.selectionStart;
  }

  currentTabId.value = tabId;
  const tab = tabs.value.find(t => t.id === tabId);
  if (tab) {
    currentLanguage.value = tab.language;
    nextTick(() => {
      if (textareaRef.value) {
        textareaRef.value.focus();
        textareaRef.value.setSelectionRange(tab.cursorPosition, tab.cursorPosition);
        updateCursorPosition();
      }
    });
  }
}

function closeTab(tabId: string) {
  const index = tabs.value.findIndex(t => t.id === tabId);
  if (index === -1) return;

  const tab = tabs.value[index];
  if (tab.isDirty) {
    if (!confirm(`Close "${tab.title}" without saving?`)) {
      return;
    }
  }

  tabs.value.splice(index, 1);

  if (currentTabId.value === tabId) {
    if (tabs.value.length > 0) {
      const newIndex = Math.min(index, tabs.value.length - 1);
      currentTabId.value = tabs.value[newIndex].id;
    } else {
      currentTabId.value = null;
    }
  }
}

function closeCurrentTab() {
  if (currentTabId.value) {
    closeTab(currentTabId.value);
  }
  closeAllMenus();
}

async function loadFileFromPath(path: string) {
  try {
    const response = await fetch('/api/files/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    });

    if (!response.ok) {
      throw new Error('Failed to load file');
    }

    const data = await response.json();
    const fileName = path.split('/').pop() || 'Untitled';
    const language = detectLanguage(fileName);

    createNewTab(fileName, data.content || '', language);

    if (currentTab.value) {
      currentTab.value.filePath = path;
      currentTab.value.originalContent = data.content || '';
      currentTab.value.isDirty = false;
    }

    addToRecentFiles(path);
    statusMessage.value = 'File loaded';
  } catch (error) {
    console.error('Error loading file:', error);
    statusMessage.value = 'Error loading file';
  }
}

async function openFile() {
  if (!openFilePath.value) {
    alert('Please enter a file path');
    return;
  }

  await loadFileFromPath(openFilePath.value);
  showOpenDialog.value = false;
  openFilePath.value = '';
}

async function saveFile() {
  if (!currentTab.value || !currentTab.value.isDirty) {
    statusMessage.value = 'No changes to save';
    return;
  }

  if (!currentTab.value.filePath) {
    saveAsFile();
    return;
  }

  try {
    const response = await fetch('/api/files/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: currentTab.value.filePath,
        content: currentTab.value.content
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save file');
    }

    currentTab.value.originalContent = currentTab.value.content;
    currentTab.value.isDirty = false;
    addToRecentFiles(currentTab.value.filePath);
    statusMessage.value = 'File saved';
  } catch (error) {
    console.error('Error saving file:', error);
    statusMessage.value = 'Error saving file';
  }

  closeAllMenus();
}

function saveAsFile() {
  const path = prompt('Save as (path):', currentTab.value?.filePath || 'dh0/untitled.txt');
  if (!path) return;

  if (currentTab.value) {
    currentTab.value.filePath = path;
    const fileName = path.split('/').pop() || 'Untitled';
    currentTab.value.title = fileName;
    currentTab.value.language = detectLanguage(fileName);
    currentLanguage.value = currentTab.value.language;
    saveFile();
  }

  closeAllMenus();
}

function handleInput() {
  if (!currentTab.value) return;

  currentTab.value.isDirty = currentTab.value.content !== currentTab.value.originalContent;

  // Update undo stack
  if (undoStack.value.length === 0 ||
      undoStack.value[undoStack.value.length - 1] !== currentTab.value.content) {
    undoStack.value.push(currentTab.value.originalContent);
    if (undoStack.value.length > 50) {
      undoStack.value.shift();
    }
    redoStack.value = [];
  }

  updateCursorPosition();
}

function handleKeyDown(e: KeyboardEvent) {
  // Tab key - insert spaces
  if (e.key === 'Tab') {
    e.preventDefault();
    insertAtCursor('  ');
    return;
  }

  // Auto-indent on Enter
  if (e.key === 'Enter') {
    e.preventDefault();
    const textarea = textareaRef.value;
    if (!textarea || !currentTab.value) return;

    const lines = currentTab.value.content.substring(0, textarea.selectionStart).split('\n');
    const currentLineText = lines[lines.length - 1];
    const indent = currentLineText.match(/^\s*/)?.[0] || '';

    insertAtCursor('\n' + indent);
  }
}

function handleGlobalKeyDown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case 'n':
        e.preventDefault();
        newFile();
        break;
      case 'o':
        e.preventDefault();
        showOpenDialog.value = true;
        break;
      case 's':
        e.preventDefault();
        saveFile();
        break;
      case 'f':
        e.preventDefault();
        showFindDialog.value = true;
        break;
      case 'h':
        e.preventDefault();
        showReplaceDialog.value = true;
        break;
      case 'g':
        e.preventDefault();
        showGoToLineDialog.value = true;
        break;
      case 'z':
        e.preventDefault();
        undo();
        break;
      case 'y':
        e.preventDefault();
        redo();
        break;
      case '/':
        e.preventDefault();
        commentToggle();
        break;
      case 'd':
        if (!e.shiftKey) {
          e.preventDefault();
          duplicateLine();
        }
        break;
      case 'k':
        if (e.shiftKey) {
          e.preventDefault();
          deleteLine();
        }
        break;
      case '=':
      case '+':
        e.preventDefault();
        zoomIn();
        break;
      case '-':
        e.preventDefault();
        zoomOut();
        break;
      case '0':
        e.preventDefault();
        resetZoom();
        break;
    }
  }
}

function insertAtCursor(text: string) {
  const textarea = textareaRef.value;
  if (!textarea || !currentTab.value) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const before = currentTab.value.content.substring(0, start);
  const after = currentTab.value.content.substring(end);

  currentTab.value.content = before + text + after;

  nextTick(() => {
    const newPos = start + text.length;
    textarea.setSelectionRange(newPos, newPos);
    textarea.focus();
    handleInput();
  });
}

function updateCursorPosition() {
  const textarea = textareaRef.value;
  if (!textarea || !currentTab.value) return;

  const pos = textarea.selectionStart;
  const textBeforeCursor = currentTab.value.content.substring(0, pos);
  const lines = textBeforeCursor.split('\n');

  currentLine.value = lines.length;
  currentColumn.value = lines[lines.length - 1].length + 1;
}

function syncScroll() {
  if (highlightRef.value && textareaRef.value) {
    highlightRef.value.scrollTop = textareaRef.value.scrollTop;
    highlightRef.value.scrollLeft = textareaRef.value.scrollLeft;
  }
  if (lineNumbersRef.value && textareaRef.value) {
    lineNumbersRef.value.scrollTop = textareaRef.value.scrollTop;
  }
}

function detectLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'cpp',
    'h': 'cpp',
    'txt': 'plaintext'
  };
  return langMap[ext || ''] || 'plaintext';
}

function updateLanguage() {
  if (currentTab.value) {
    currentTab.value.language = currentLanguage.value;
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Edit operations
function undo() {
  if (!currentTab.value || undoStack.value.length === 0) return;

  redoStack.value.push(currentTab.value.content);
  currentTab.value.content = undoStack.value.pop() || '';
  currentTab.value.isDirty = currentTab.value.content !== currentTab.value.originalContent;
  closeAllMenus();
}

function redo() {
  if (!currentTab.value || redoStack.value.length === 0) return;

  undoStack.value.push(currentTab.value.content);
  currentTab.value.content = redoStack.value.pop() || '';
  currentTab.value.isDirty = currentTab.value.content !== currentTab.value.originalContent;
  closeAllMenus();
}

function cut() {
  document.execCommand('cut');
  closeAllMenus();
}

function copy() {
  document.execCommand('copy');
  closeAllMenus();
}

function paste() {
  document.execCommand('paste');
  closeAllMenus();
}

function commentToggle() {
  const textarea = textareaRef.value;
  if (!textarea || !currentTab.value) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const lines = currentTab.value.content.split('\n');

  const startLine = currentTab.value.content.substring(0, start).split('\n').length - 1;
  const endLine = currentTab.value.content.substring(0, end).split('\n').length - 1;

  const commentStr = currentLanguage.value === 'python' ? '# ' : '// ';

  for (let i = startLine; i <= endLine; i++) {
    if (lines[i].startsWith(commentStr)) {
      lines[i] = lines[i].substring(commentStr.length);
    } else {
      lines[i] = commentStr + lines[i];
    }
  }

  currentTab.value.content = lines.join('\n');
  handleInput();
  closeAllMenus();
}

function duplicateLine() {
  const textarea = textareaRef.value;
  if (!textarea || !currentTab.value) return;

  const pos = textarea.selectionStart;
  const lines = currentTab.value.content.substring(0, pos).split('\n');
  const lineNum = lines.length - 1;
  const allLines = currentTab.value.content.split('\n');

  allLines.splice(lineNum + 1, 0, allLines[lineNum]);
  currentTab.value.content = allLines.join('\n');
  handleInput();
  closeAllMenus();
}

function deleteLine() {
  const textarea = textareaRef.value;
  if (!textarea || !currentTab.value) return;

  const pos = textarea.selectionStart;
  const lines = currentTab.value.content.substring(0, pos).split('\n');
  const lineNum = lines.length - 1;
  const allLines = currentTab.value.content.split('\n');

  allLines.splice(lineNum, 1);
  currentTab.value.content = allLines.join('\n');
  handleInput();
  closeAllMenus();
}

// Find/Replace
function findNext() {
  if (!findText.value || !currentTab.value || !textareaRef.value) return;

  const textarea = textareaRef.value;
  const content = currentTab.value.content;
  const start = textarea.selectionEnd;

  let index: number;
  if (findRegex.value) {
    try {
      const flags = findCaseSensitive.value ? 'g' : 'gi';
      const regex = new RegExp(findText.value, flags);
      const match = content.substring(start).match(regex);
      index = match ? start + content.substring(start).indexOf(match[0]) : -1;
    } catch {
      alert('Invalid regex pattern');
      return;
    }
  } else {
    const searchText = findCaseSensitive.value ? content : content.toLowerCase();
    const search = findCaseSensitive.value ? findText.value : findText.value.toLowerCase();
    index = searchText.indexOf(search, start);
  }

  if (index === -1) {
    // Wrap around
    if (findRegex.value) {
      const flags = findCaseSensitive.value ? 'g' : 'gi';
      const regex = new RegExp(findText.value, flags);
      const match = content.match(regex);
      index = match ? content.indexOf(match[0]) : -1;
    } else {
      const searchText = findCaseSensitive.value ? content : content.toLowerCase();
      const search = findCaseSensitive.value ? findText.value : findText.value.toLowerCase();
      index = searchText.indexOf(search);
    }
  }

  if (index !== -1) {
    textarea.setSelectionRange(index, index + findText.value.length);
    textarea.focus();
    updateCursorPosition();
  } else {
    statusMessage.value = 'Not found';
  }
}

function findPrevious() {
  if (!findText.value || !currentTab.value || !textareaRef.value) return;

  const textarea = textareaRef.value;
  const content = currentTab.value.content;
  const start = textarea.selectionStart;

  const searchText = findCaseSensitive.value ? content : content.toLowerCase();
  const search = findCaseSensitive.value ? findText.value : findText.value.toLowerCase();

  const index = searchText.lastIndexOf(search, start - 1);

  if (index !== -1) {
    textarea.setSelectionRange(index, index + findText.value.length);
    textarea.focus();
    updateCursorPosition();
  } else {
    statusMessage.value = 'Not found';
  }
}

function replaceNext() {
  const textarea = textareaRef.value;
  if (!currentTab.value || !textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  if (end > start) {
    const before = currentTab.value.content.substring(0, start);
    const after = currentTab.value.content.substring(end);
    currentTab.value.content = before + replaceText.value + after;

    nextTick(() => {
      const newPos = start + replaceText.value.length;
      textarea.setSelectionRange(newPos, newPos);
      handleInput();
      findNext();
    });
  } else {
    findNext();
  }
}

function replaceAll() {
  if (!findText.value || !currentTab.value) return;

  let content = currentTab.value.content;
  let count = 0;

  if (findRegex.value) {
    try {
      const flags = findCaseSensitive.value ? 'g' : 'gi';
      const regex = new RegExp(findText.value, flags);
      content = content.replace(regex, () => {
        count++;
        return replaceText.value;
      });
    } catch {
      alert('Invalid regex pattern');
      return;
    }
  } else {
    const search = findCaseSensitive.value ? findText.value : new RegExp(escapeRegex(findText.value), 'gi');
    content = content.replace(search, () => {
      count++;
      return replaceText.value;
    });
  }

  currentTab.value.content = content;
  handleInput();
  statusMessage.value = `Replaced ${count} occurrence(s)`;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function goToLine() {
  const textarea = textareaRef.value;
  if (!textarea || !currentTab.value) return;

  if (goToLineNumber.value < 1 || goToLineNumber.value > lineCount.value) {
    alert(`Line number must be between 1 and ${lineCount.value}`);
    return;
  }

  const lines = currentTab.value.content.split('\n');
  let pos = 0;
  for (let i = 0; i < goToLineNumber.value - 1; i++) {
    pos += lines[i].length + 1;
  }

  textarea.setSelectionRange(pos, pos);
  textarea.focus();
  updateCursorPosition();
  showGoToLineDialog.value = false;
}

// View operations
function toggleLineNumbers() {
  showLineNumbers.value = !showLineNumbers.value;
  closeAllMenus();
}

function toggleWordWrap() {
  wordWrap.value = !wordWrap.value;
  closeAllMenus();
}

function toggleWhitespace() {
  showWhitespace.value = !showWhitespace.value;
  closeAllMenus();
}

function zoomIn() {
  if (fontSize.value < 24) {
    fontSize.value += 2;
  }
  closeAllMenus();
}

function zoomOut() {
  if (fontSize.value > 8) {
    fontSize.value -= 2;
  }
  closeAllMenus();
}

function resetZoom() {
  fontSize.value = 13;
  closeAllMenus();
}

// Menu operations
function toggleFileMenu() {
  showFileMenu.value = !showFileMenu.value;
  showEditMenu.value = false;
  showViewMenu.value = false;
}

function toggleEditMenu() {
  showEditMenu.value = !showEditMenu.value;
  showFileMenu.value = false;
  showViewMenu.value = false;
}

function toggleViewMenu() {
  showViewMenu.value = !showViewMenu.value;
  showFileMenu.value = false;
  showEditMenu.value = false;
}

function closeAllMenus() {
  showFileMenu.value = false;
  showEditMenu.value = false;
  showViewMenu.value = false;
}

// Auto-save
function autoSave() {
  if (currentTab.value?.isDirty && currentTab.value.filePath) {
    const state = {
      tabs: tabs.value.map(t => ({
        title: t.title,
        content: t.content,
        filePath: t.filePath,
        language: t.language
      })),
      currentTabId: currentTabId.value
    };
    localStorage.setItem('webos-code-editor-autosave', JSON.stringify(state));
    statusMessage.value = 'Auto-saved';
    setTimeout(() => {
      if (statusMessage.value === 'Auto-saved') {
        statusMessage.value = 'Ready';
      }
    }, 2000);
  }
}

function saveEditorState() {
  const state = {
    fontSize: fontSize.value,
    showLineNumbers: showLineNumbers.value,
    wordWrap: wordWrap.value,
    showWhitespace: showWhitespace.value,
    theme: currentTheme.value
  };
  localStorage.setItem('webos-code-editor-state', JSON.stringify(state));
}

function loadEditorState() {
  const stateStr = localStorage.getItem('webos-code-editor-state');
  if (stateStr) {
    try {
      const state = JSON.parse(stateStr);
      fontSize.value = state.fontSize || 13;
      showLineNumbers.value = state.showLineNumbers !== false;
      wordWrap.value = state.wordWrap || false;
      showWhitespace.value = state.showWhitespace || false;
      currentTheme.value = state.theme || 'amiga';
    } catch (e) {
      console.error('Error loading editor state:', e);
    }
  }

  // Load auto-save
  const autoSaveStr = localStorage.getItem('webos-code-editor-autosave');
  if (autoSaveStr && !props.data?.filePath) {
    try {
      const autoSave = JSON.parse(autoSaveStr);
      if (confirm('Recover unsaved changes from previous session?')) {
        tabs.value = autoSave.tabs.map((t: any, i: number) => ({
          id: `tab-${i}`,
          title: t.title,
          content: t.content,
          originalContent: t.content,
          isDirty: false,
          filePath: t.filePath,
          language: t.language,
          cursorPosition: 0
        }));
        currentTabId.value = autoSave.currentTabId || tabs.value[0]?.id || null;
        tabIdCounter.value = tabs.value.length;
      } else {
        localStorage.removeItem('webos-code-editor-autosave');
      }
    } catch (e) {
      console.error('Error loading auto-save:', e);
    }
  }
}

// Recent files
function addToRecentFiles(path: string) {
  const filtered = recentFiles.value.filter(f => f !== path);
  filtered.unshift(path);
  recentFiles.value = filtered.slice(0, 10);
  localStorage.setItem('webos-code-editor-recent', JSON.stringify(recentFiles.value));
}

function loadRecentFiles() {
  const recentStr = localStorage.getItem('webos-code-editor-recent');
  if (recentStr) {
    try {
      recentFiles.value = JSON.parse(recentStr);
    } catch (e) {
      console.error('Error loading recent files:', e);
    }
  }
}
</script>

<style scoped>
.amiga-code-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
  overflow: hidden;
}

/* Menu Bar */
.editor-menu {
  display: flex;
  align-items: center;
  background: #ffffff;
  border-bottom: 2px solid #000000;
  padding: 4px 8px;
  font-size: 10px;
  gap: 4px;
  position: relative;
  z-index: 100;
}

.menu-section {
  position: relative;
  cursor: pointer;
  padding: 4px 12px;
  user-select: none;
}

.menu-section:hover {
  background: #0055aa;
  color: #ffffff;
}

.menu-label {
  font-weight: bold;
}

.menu-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 200px;
  background: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  margin-top: 2px;
}

.menu-item {
  padding: 6px 12px;
  font-size: 9px;
  cursor: pointer;
  user-select: none;
  color: #000000;
}

.menu-item:hover:not(.disabled) {
  background: #0055aa;
  color: #ffffff;
}

.menu-item.disabled {
  color: #999999;
  cursor: not-allowed;
}

.menu-separator {
  height: 1px;
  background: #000000;
  margin: 2px 0;
}

.menu-spacer {
  flex: 1;
}

.language-selector,
.theme-selector {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 9px;
  color: #000000;
}

.amiga-select {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 2px 4px;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
}

/* Tabs Bar */
.tabs-bar {
  display: flex;
  background: #a0a0a0;
  border-bottom: 2px solid #000000;
  overflow-x: auto;
  overflow-y: hidden;
}

.tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #888888;
  border-right: 2px solid #000000;
  border-color: #666666 #000000 #000000 #666666;
  cursor: pointer;
  font-size: 9px;
  white-space: nowrap;
  user-select: none;
}

.tab.active {
  background: #a0a0a0;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.tab:hover:not(.active) {
  background: #999999;
}

.tab-title {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-close {
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  padding: 0 4px;
}

.tab-close:hover {
  color: #ff0000;
}

.tab-new {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 16px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  background: #a0a0a0;
  border-right: 2px solid #000000;
  user-select: none;
}

.tab-new:hover {
  background: #b0b0b0;
}

/* Toolbar */
.editor-toolbar {
  display: flex;
  gap: 4px;
  padding: 6px;
  background: #a0a0a0;
  border-bottom: 2px solid #000000;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 10px;
  font-size: 9px;
  cursor: pointer;
  color: #000000;
  font-family: 'Press Start 2P', monospace;
  transition: all 0.05s;
}

.amiga-button:hover:not(:disabled) {
  background: #b0b0b0;
}

.amiga-button:active:not(:disabled) {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button:disabled {
  color: #666666;
  cursor: not-allowed;
  opacity: 0.6;
}

.toolbar-separator {
  width: 2px;
  background: #000000;
  margin: 0 4px;
}

/* Editor Main */
.editor-main {
  flex: 1;
  display: flex;
  overflow: hidden;
  background: #ffffff;
}

.editor-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.line-numbers {
  background: #f0f0f0;
  border-right: 2px solid #000000;
  padding: 8px 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  text-align: right;
  user-select: none;
  overflow: hidden;
  min-width: 50px;
}

.line-number {
  color: #666666;
  padding: 0 8px;
}

.line-number.active {
  color: #0055aa;
  font-weight: bold;
}

.code-container {
  flex: 1;
  position: relative;
  overflow: auto;
}

.code-input,
.code-highlight {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 8px;
  margin: 0;
  border: none;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre;
  overflow: auto;
  box-sizing: border-box;
}

.code-input {
  color: transparent;
  caret-color: #000000;
  background: transparent;
  resize: none;
  outline: none;
  z-index: 1;
}

.code-highlight {
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.word-wrap .code-input,
.word-wrap .code-highlight {
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Syntax Highlighting Themes */
.theme-amiga {
  background: #c0c0c0;
  color: #000000;
}

.theme-amiga :deep(.token.comment) { color: #707070; }
.theme-amiga :deep(.token.keyword) { color: #0055aa; font-weight: bold; }
.theme-amiga :deep(.token.string) { color: #ff8800; }
.theme-amiga :deep(.token.function) { color: #00aa00; }
.theme-amiga :deep(.token.number) { color: #aa5500; }
.theme-amiga :deep(.token.operator) { color: #0055aa; }
.theme-amiga :deep(.token.class-name) { color: #aa0055; font-weight: bold; }
.theme-amiga :deep(.token.tag) { color: #0055aa; }
.theme-amiga :deep(.token.attr-name) { color: #00aa00; }
.theme-amiga :deep(.token.attr-value) { color: #ff8800; }

.theme-dark {
  background: #1e1e1e;
  color: #d4d4d4;
}

.theme-dark .code-input {
  caret-color: #ffffff;
}

.theme-dark :deep(.token.comment) { color: #6a9955; }
.theme-dark :deep(.token.keyword) { color: #569cd6; }
.theme-dark :deep(.token.string) { color: #ce9178; }
.theme-dark :deep(.token.function) { color: #dcdcaa; }
.theme-dark :deep(.token.number) { color: #b5cea8; }
.theme-dark :deep(.token.operator) { color: #d4d4d4; }
.theme-dark :deep(.token.class-name) { color: #4ec9b0; }
.theme-dark :deep(.token.tag) { color: #569cd6; }
.theme-dark :deep(.token.attr-name) { color: #9cdcfe; }
.theme-dark :deep(.token.attr-value) { color: #ce9178; }

.theme-light {
  background: #ffffff;
  color: #000000;
}

.theme-light :deep(.token.comment) { color: #008000; }
.theme-light :deep(.token.keyword) { color: #0000ff; }
.theme-light :deep(.token.string) { color: #a31515; }
.theme-light :deep(.token.function) { color: #795e26; }
.theme-light :deep(.token.number) { color: #098658; }
.theme-light :deep(.token.operator) { color: #000000; }
.theme-light :deep(.token.class-name) { color: #267f99; }
.theme-light :deep(.token.tag) { color: #800000; }
.theme-light :deep(.token.attr-name) { color: #ff0000; }
.theme-light :deep(.token.attr-value) { color: #0000ff; }

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 20px;
}

.empty-message {
  font-size: 12px;
  color: #666666;
}

/* Status Bar */
.status-bar {
  display: flex;
  gap: 12px;
  background: #ffffff;
  border-top: 2px solid #000000;
  padding: 4px 12px;
  font-size: 8px;
  color: #000000;
}

.status-item {
  padding: 0 4px;
  border-right: 1px solid #cccccc;
}

.status-item:last-child {
  border-right: none;
  margin-left: auto;
}

/* Dialogs */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.amiga-dialog {
  background: #a0a0a0;
  border: 4px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  min-width: 400px;
  max-width: 600px;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);
}

.dialog-title {
  background: #0055aa;
  color: #ffffff;
  padding: 6px 12px;
  font-size: 10px;
  border-bottom: 2px solid #000000;
}

.dialog-content {
  padding: 16px;
  font-size: 9px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.dialog-options {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 9px;
  cursor: pointer;
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
}

.amiga-input {
  width: 100%;
  padding: 6px;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  background: #ffffff;
  color: #000000;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  outline: none;
}

.dialog-buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 12px;
  border-top: 2px solid #000000;
}

.recent-files {
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.recent-file-item {
  padding: 6px;
  cursor: pointer;
  font-size: 9px;
  background: #ffffff;
  border: 1px solid #cccccc;
  margin-top: 4px;
  font-family: 'Courier New', monospace;
}

.recent-file-item:hover {
  background: #0055aa;
  color: #ffffff;
}

label {
  font-weight: bold;
  color: #000000;
  margin-top: 4px;
}
</style>
