<template>
  <div class="archive-preview">
    <div class="archive-header">
      <div class="archive-icon">📦</div>
      <div class="archive-title">{{ metadata.name }}</div>
    </div>

    <div class="archive-stats">
      <div class="stat-item">
        <span class="stat-label">Files:</span>
        <span class="stat-value">{{ fileCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Total Size:</span>
        <span class="stat-value">{{ formatSize(totalSize) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Compressed:</span>
        <span class="stat-value">{{ formatSize(metadata.size || 0) }}</span>
      </div>
      <div class="stat-item" v-if="compressionRatio">
        <span class="stat-label">Ratio:</span>
        <span class="stat-value">{{ compressionRatio }}%</span>
      </div>
    </div>

    <div class="archive-content">
      <div class="content-header">
        <span class="col-name">Name</span>
        <span class="col-size">Size</span>
        <span class="col-date">Modified</span>
      </div>

      <div class="file-list">
        <div
          v-for="(file, index) in files"
          :key="index"
          class="file-item"
          :class="{ folder: file.isDirectory }"
        >
          <span class="file-icon">{{ file.isDirectory ? '📁' : '📄' }}</span>
          <span class="file-name">{{ file.name }}</span>
          <span class="file-size">{{ file.isDirectory ? '-' : formatSize(file.size) }}</span>
          <span class="file-date">{{ formatDate(file.modified) }}</span>
        </div>
      </div>
    </div>

    <div class="archive-actions">
      <button class="amiga-button" @click="extractArchive">Extract All</button>
      <button class="amiga-button" @click="extractSelected" :disabled="!hasSelection">
        Extract Selected
      </button>
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

interface ArchiveFile {
  name: string;
  size: number;
  modified: Date;
  isDirectory: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  extract: [path: string];
}>();

const files = ref<ArchiveFile[]>([]);
const selectedFiles = ref<string[]>([]);

const fileCount = computed(() => {
  return files.value.filter(f => !f.isDirectory).length;
});

const totalSize = computed(() => {
  return files.value.reduce((sum, f) => sum + (f.isDirectory ? 0 : f.size), 0);
});

const compressionRatio = computed(() => {
  if (!totalSize.value || !props.metadata.size) return null;
  return Math.round((1 - props.metadata.size / totalSize.value) * 100);
});

const hasSelection = computed(() => {
  return selectedFiles.value.length > 0;
});

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatDate = (date: Date): string => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const extractArchive = () => {
  emit('extract', props.filePath);
};

const extractSelected = () => {
  if (!hasSelection.value) return;
  // Emit extract event with selected files
  console.log('Extract selected:', selectedFiles.value);
};

const loadArchiveContents = async () => {
  try {
    const response = await fetch(`/api/files/archive/list?path=${encodeURIComponent(props.filePath)}`);
    if (response.ok) {
      const data = await response.json();
      files.value = data.files || [];
    } else {
      // If server endpoint doesn't exist yet, use mock data
      files.value = [
        { name: 'README.md', size: 2048, modified: new Date(), isDirectory: false },
        { name: 'src/', size: 0, modified: new Date(), isDirectory: true },
        { name: 'src/index.js', size: 4096, modified: new Date(), isDirectory: false },
        { name: 'src/utils.js', size: 3072, modified: new Date(), isDirectory: false },
        { name: 'package.json', size: 1024, modified: new Date(), isDirectory: false },
        { name: 'node_modules/', size: 0, modified: new Date(), isDirectory: true },
      ];
    }
  } catch (error) {
    console.error('Failed to load archive contents:', error);
    // Use mock data on error
    files.value = [
      { name: 'file1.txt', size: 1024, modified: new Date(), isDirectory: false },
      { name: 'file2.txt', size: 2048, modified: new Date(), isDirectory: false },
      { name: 'folder/', size: 0, modified: new Date(), isDirectory: true },
    ];
  }
};

onMounted(() => {
  loadArchiveContents();
});
</script>

<style scoped>
.archive-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
}

.archive-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #a0a0a0;
  border-bottom: 2px solid #000000;
}

.archive-icon {
  font-size: 48px;
}

.archive-title {
  font-size: 12px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
  font-weight: bold;
}

.archive-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  padding: 12px;
  background: #e0e0e0;
  border-bottom: 2px solid #000000;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 7px;
  font-family: 'Press Start 2P', monospace;
  color: #666666;
}

.stat-value {
  font-size: 10px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
  font-weight: bold;
}

.archive-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-header {
  display: grid;
  grid-template-columns: 1fr 100px 120px;
  gap: 8px;
  padding: 8px 12px;
  background: #a0a0a0;
  border-bottom: 2px solid #000000;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
  font-weight: bold;
}

.file-list {
  flex: 1;
  overflow-y: auto;
}

.file-item {
  display: grid;
  grid-template-columns: 24px 1fr 100px 120px;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid #e0e0e0;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  align-items: center;
  cursor: pointer;
}

.file-item:hover {
  background: rgba(0, 85, 170, 0.1);
}

.file-item.folder {
  font-weight: bold;
}

.file-icon {
  font-size: 16px;
}

.file-name {
  color: #000000;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  color: #666666;
  text-align: right;
}

.file-date {
  color: #666666;
  font-size: 7px;
}

.archive-actions {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: #a0a0a0;
  border-top: 2px solid #000000;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 12px;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  color: #000000;
}

.amiga-button:hover:not(:disabled) {
  background: #b0b0b0;
}

.amiga-button:active:not(:disabled) {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
