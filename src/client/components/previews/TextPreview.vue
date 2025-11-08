<template>
  <div class="text-preview">
    <div class="text-controls">
      <button class="amiga-button" @click="toggleLineNumbers">
        {{ showLineNumbers ? 'Hide Lines' : 'Show Lines' }}
      </button>
      <button class="amiga-button" @click="toggleWordWrap">
        {{ wordWrap ? 'No Wrap' : 'Wrap' }}
      </button>
      <input
        type="text"
        class="search-input"
        v-model="searchQuery"
        placeholder="Search..."
        @input="onSearch"
      />
    </div>

    <div class="text-container" ref="containerRef" :class="{ 'word-wrap': wordWrap }">
      <pre v-if="showLineNumbers" class="line-numbers">{{ lineNumbers }}</pre>
      <pre class="text-content" :class="{ highlighted: isHighlighted }" v-html="highlightedContent"></pre>
    </div>

    <div class="text-info">
      <span>{{ lineCount }} lines</span>
      <span>{{ wordCount }} words</span>
      <span>{{ charCount }} chars</span>
      <span v-if="searchResults > 0">{{ searchResults }} matches</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import type { FileMetadata } from '../../utils/file-preview';

interface Props {
  filePath: string;
  metadata: FileMetadata;
}

const props = defineProps<Props>();

const containerRef = ref<HTMLElement | null>(null);
const content = ref('');
const showLineNumbers = ref(true);
const wordWrap = ref(false);
const searchQuery = ref('');
const searchResults = ref(0);

const lineCount = computed(() => {
  return content.value.split('\n').length;
});

const wordCount = computed(() => {
  return content.value.split(/\s+/).filter(word => word.length > 0).length;
});

const charCount = computed(() => {
  return content.value.length;
});

const lineNumbers = computed(() => {
  return Array.from({ length: lineCount.value }, (_, i) => i + 1).join('\n');
});

const isHighlighted = computed(() => {
  const ext = props.metadata.extension;
  return ['.js', '.ts', '.json', '.html', '.css', '.xml', '.py', '.java', '.cpp', '.c'].includes(ext);
});

const highlightedContent = computed(() => {
  let text = escapeHtml(content.value);

  // Apply search highlighting
  if (searchQuery.value) {
    const regex = new RegExp(escapeRegex(searchQuery.value), 'gi');
    const matches = text.match(regex);
    searchResults.value = matches ? matches.length : 0;

    text = text.replace(regex, (match) => {
      return `<mark>${match}</mark>`;
    });
  } else {
    searchResults.value = 0;
  }

  // Simple syntax highlighting based on file type
  if (isHighlighted.value) {
    text = applySyntaxHighlighting(text, props.metadata.extension);
  }

  return text;
});

const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const escapeRegex = (text: string): string => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const applySyntaxHighlighting = (text: string, extension: string): string => {
  // Simple keyword highlighting for common languages
  const keywords: Record<string, string[]> = {
    '.js': ['const', 'let', 'var', 'function', 'class', 'if', 'else', 'for', 'while', 'return', 'import', 'export'],
    '.ts': ['const', 'let', 'var', 'function', 'class', 'interface', 'type', 'if', 'else', 'for', 'while', 'return', 'import', 'export'],
    '.py': ['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'return', 'import', 'from', 'as'],
    '.java': ['public', 'private', 'class', 'void', 'if', 'else', 'for', 'while', 'return', 'import'],
  };

  const keywordList = keywords[extension] || [];

  keywordList.forEach((keyword) => {
    const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
    text = text.replace(regex, '<span class="keyword">$1</span>');
  });

  // Highlight strings
  text = text.replace(/(".*?"|'.*?')/g, '<span class="string">$1</span>');

  // Highlight comments
  text = text.replace(/(\/\/.*$|\/\*.*?\*\/)/gm, '<span class="comment">$1</span>');

  return text;
};

const toggleLineNumbers = () => {
  showLineNumbers.value = !showLineNumbers.value;
};

const toggleWordWrap = () => {
  wordWrap.value = !wordWrap.value;
};

const onSearch = () => {
  // Search is handled by computed property
};

onMounted(async () => {
  try {
    const response = await fetch(`/api/files/content?path=${encodeURIComponent(props.filePath)}`);
    if (response.ok) {
      content.value = await response.text();
    }
  } catch (error) {
    console.error('Failed to load text file:', error);
    content.value = 'Error loading file content.';
  }
});
</script>

<style scoped>
.text-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
}

.text-controls {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: #a0a0a0;
  border-bottom: 2px solid #000000;
}

.search-input {
  flex: 1;
  max-width: 200px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px 8px;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
}

.text-container {
  flex: 1;
  display: flex;
  overflow: auto;
  background: #ffffff;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  line-height: 1.5;
}

.text-container.word-wrap .text-content {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.line-numbers {
  background: #e0e0e0;
  color: #666666;
  padding: 8px;
  margin: 0;
  text-align: right;
  user-select: none;
  border-right: 2px solid #a0a0a0;
  min-width: 40px;
}

.text-content {
  flex: 1;
  margin: 0;
  padding: 8px;
  white-space: pre;
  overflow-x: auto;
  color: #000000;
}

.text-info {
  display: flex;
  gap: 16px;
  padding: 8px;
  background: #a0a0a0;
  border-top: 2px solid #000000;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 8px;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  color: #000000;
}

.amiga-button:hover {
  background: #b0b0b0;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

/* Syntax highlighting */
:deep(.keyword) {
  color: #0000ff;
  font-weight: bold;
}

:deep(.string) {
  color: #008000;
}

:deep(.comment) {
  color: #808080;
  font-style: italic;
}

:deep(mark) {
  background: #ffff00;
  color: #000000;
  padding: 0 2px;
}
</style>
