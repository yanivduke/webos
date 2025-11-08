<template>
  <div class="media-import-overlay" @click.self="close">
    <div class="media-import-dialog">
      <!-- Header -->
      <div class="dialog-header">
        <h2 class="dialog-title">Import Media</h2>
        <button class="close-button" @click="close">×</button>
      </div>

      <!-- Content -->
      <div class="dialog-content">
        <!-- File Selection Method -->
        <div class="import-method">
          <button
            class="method-button"
            :class="{ active: importMethod === 'file' }"
            @click="importMethod = 'file'"
          >
            📄 Select Files
          </button>
          <button
            class="method-button"
            :class="{ active: importMethod === 'folder' }"
            @click="importMethod = 'folder'"
          >
            📁 Scan Folder
          </button>
          <button
            class="method-button"
            :class="{ active: importMethod === 'url' }"
            @click="importMethod = 'url'"
          >
            🔗 Add URL
          </button>
        </div>

        <!-- File Input -->
        <div v-if="importMethod === 'file'" class="import-section">
          <div
            class="dropzone"
            :class="{ dragging: isDragging }"
            @drop="handleDrop"
            @dragover="handleDragOver"
            @dragenter="handleDragEnter"
            @dragleave="handleDragLeave"
            @click="triggerFileInput"
          >
            <div class="dropzone-content">
              <div class="dropzone-icon">📁</div>
              <div class="dropzone-text">
                <p>Drag & drop media files here</p>
                <p class="dropzone-subtext">or click to browse</p>
              </div>
            </div>
          </div>
          <input
            ref="fileInput"
            type="file"
            multiple
            accept="audio/*,video/*"
            style="display: none"
            @change="handleFileSelect"
          />
        </div>

        <!-- Folder Input -->
        <div v-if="importMethod === 'folder'" class="import-section">
          <div class="folder-input-section">
            <input
              v-model="folderPath"
              type="text"
              class="amiga-input"
              placeholder="Enter folder path..."
            />
            <button class="amiga-button" @click="scanFolder">Scan</button>
          </div>
          <p class="help-text">Enter a folder path to scan for media files recursively.</p>
        </div>

        <!-- URL Input -->
        <div v-if="importMethod === 'url'" class="import-section">
          <div class="url-input-section">
            <input
              v-model="mediaUrl"
              type="text"
              class="amiga-input"
              placeholder="https://example.com/audio.mp3"
            />
            <button class="amiga-button" @click="addFromUrl">Add</button>
          </div>
          <p class="help-text">Enter a direct URL to an audio or video file.</p>
        </div>

        <!-- Import Options -->
        <div class="import-options">
          <h3 class="section-title">Import Options</h3>
          <div class="option-row">
            <label>
              <input type="checkbox" v-model="extractMetadata" />
              Extract metadata from files
            </label>
          </div>
          <div class="option-row">
            <label>
              <input type="checkbox" v-model="skipDuplicates" />
              Skip duplicate files
            </label>
          </div>
          <div class="option-row">
            <label>
              <input type="checkbox" v-model="organizeByArtist" />
              Auto-organize by artist/album
            </label>
          </div>
        </div>

        <!-- File List -->
        <div v-if="selectedFiles.length > 0" class="file-list-section">
          <h3 class="section-title">Files to Import ({{ selectedFiles.length }})</h3>
          <div class="file-list">
            <div
              v-for="(file, index) in selectedFiles"
              :key="index"
              class="file-item"
            >
              <div class="file-info">
                <div class="file-icon">{{ getFileIcon(file.type) }}</div>
                <div class="file-details">
                  <div class="file-name">{{ file.name }}</div>
                  <div class="file-meta">
                    {{ formatFileSize(file.size) }} • {{ file.type }}
                  </div>
                </div>
              </div>
              <button class="remove-button" @click="removeFile(index)">×</button>
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div v-if="isImporting" class="progress-section">
          <h3 class="section-title">Importing...</h3>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: importProgress + '%' }"></div>
          </div>
          <div class="progress-text">
            {{ importedCount }} / {{ selectedFiles.length }} files
            ({{ Math.round(importProgress) }}%)
          </div>
        </div>

        <!-- Metadata Editor -->
        <div v-if="currentEditingFile && showMetadataEditor" class="metadata-editor">
          <h3 class="section-title">Edit Metadata: {{ currentEditingFile.name }}</h3>
          <div class="metadata-form">
            <div class="form-row">
              <label>Title:</label>
              <input
                v-model="currentMetadata.title"
                type="text"
                class="amiga-input"
              />
            </div>
            <div class="form-row">
              <label>Artist:</label>
              <input
                v-model="currentMetadata.artist"
                type="text"
                class="amiga-input"
              />
            </div>
            <div class="form-row">
              <label>Album:</label>
              <input
                v-model="currentMetadata.album"
                type="text"
                class="amiga-input"
              />
            </div>
            <div class="form-row">
              <label>Genre:</label>
              <input
                v-model="currentMetadata.genre"
                type="text"
                class="amiga-input"
              />
            </div>
            <div class="form-row">
              <label>Year:</label>
              <input
                v-model.number="currentMetadata.year"
                type="number"
                class="amiga-input"
                min="1900"
                max="2099"
              />
            </div>
            <div class="form-actions">
              <button class="amiga-button" @click="saveMetadata">Save</button>
              <button class="amiga-button" @click="skipMetadata">Skip</button>
            </div>
          </div>
        </div>

        <!-- Status Messages -->
        <div v-if="statusMessage" class="status-message" :class="statusType">
          {{ statusMessage }}
        </div>
      </div>

      <!-- Footer -->
      <div class="dialog-footer">
        <button
          class="amiga-button btn-primary"
          :disabled="selectedFiles.length === 0 || isImporting"
          @click="startImport"
        >
          Import {{ selectedFiles.length > 0 ? `(${selectedFiles.length})` : '' }}
        </button>
        <button class="amiga-button" @click="close">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { mediaLibrary, type MediaFile } from '../../utils/media-library';

// Emits
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'imported', files: MediaFile[]): void;
}>();

// State
const importMethod = ref<'file' | 'folder' | 'url'>('file');
const selectedFiles = ref<File[]>([]);
const isDragging = ref(false);
const isImporting = ref(false);
const importProgress = ref(0);
const importedCount = ref(0);

// Options
const extractMetadata = ref(true);
const skipDuplicates = ref(true);
const organizeByArtist = ref(false);

// Folder/URL inputs
const folderPath = ref('');
const mediaUrl = ref('');

// Metadata editor
const showMetadataEditor = ref(false);
const currentEditingFile = ref<File | null>(null);
const currentMetadata = ref({
  title: '',
  artist: '',
  album: '',
  genre: '',
  year: new Date().getFullYear(),
});

// Status
const statusMessage = ref('');
const statusType = ref<'success' | 'error' | 'info'>('info');

// Refs
const fileInput = ref<HTMLInputElement | null>(null);

// Methods
function triggerFileInput() {
  fileInput.value?.click();
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    addFiles(Array.from(target.files));
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  isDragging.value = false;

  if (event.dataTransfer?.files) {
    addFiles(Array.from(event.dataTransfer.files));
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
}

function handleDragEnter(event: DragEvent) {
  event.preventDefault();
  isDragging.value = true;
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault();
  isDragging.value = false;
}

function addFiles(files: File[]) {
  // Filter for audio/video files
  const mediaFiles = files.filter(file => {
    return file.type.startsWith('audio/') || file.type.startsWith('video/');
  });

  if (mediaFiles.length === 0) {
    showStatus('No valid audio or video files found', 'error');
    return;
  }

  // Check for duplicates if enabled
  if (skipDuplicates.value) {
    const existingNames = selectedFiles.value.map(f => f.name);
    const newFiles = mediaFiles.filter(f => !existingNames.includes(f.name));

    if (newFiles.length < mediaFiles.length) {
      showStatus(
        `Skipped ${mediaFiles.length - newFiles.length} duplicate file(s)`,
        'info'
      );
    }

    selectedFiles.value.push(...newFiles);
  } else {
    selectedFiles.value.push(...mediaFiles);
  }
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1);
}

function getFileIcon(type: string): string {
  if (type.startsWith('audio/')) return '🎵';
  if (type.startsWith('video/')) return '🎬';
  return '📄';
}

function formatFileSize(bytes: number): string {
  return MediaLibrary.formatFileSize(bytes);
}

async function scanFolder() {
  // This would require server-side implementation
  showStatus('Folder scanning requires server-side implementation', 'info');
}

async function addFromUrl() {
  if (!mediaUrl.value.trim()) {
    showStatus('Please enter a valid URL', 'error');
    return;
  }

  try {
    // Create a virtual file from URL
    const response = await fetch(mediaUrl.value);
    const blob = await response.blob();
    const filename = mediaUrl.value.split('/').pop() || 'media';
    const file = new File([blob], filename, { type: blob.type });

    addFiles([file]);
    mediaUrl.value = '';
  } catch (error) {
    showStatus('Failed to load media from URL', 'error');
  }
}

async function startImport() {
  if (selectedFiles.value.length === 0) return;

  isImporting.value = true;
  importProgress.value = 0;
  importedCount.value = 0;

  const importedFiles: MediaFile[] = [];

  for (let i = 0; i < selectedFiles.value.length; i++) {
    const file = selectedFiles.value[i];

    try {
      // Extract metadata if enabled
      let metadata: Partial<MediaFile> = {};

      if (extractMetadata.value) {
        metadata = await extractFileMetadata(file);
      }

      // Create media file entry
      const mediaType = MediaLibrary.detectMediaType(file.name);
      if (!mediaType) continue;

      const mediaFile = mediaLibrary.addMediaFile({
        path: URL.createObjectURL(file),
        name: metadata.name || file.name,
        type: mediaType,
        duration: metadata.duration || 0,
        artist: metadata.artist,
        album: metadata.album,
        genre: metadata.genre,
        year: metadata.year,
        trackNumber: metadata.trackNumber,
        artwork: metadata.artwork,
        fileSize: file.size,
        format: file.type.split('/')[1],
      });

      importedFiles.push(mediaFile);
      importedCount.value++;
      importProgress.value = ((i + 1) / selectedFiles.value.length) * 100;
    } catch (error) {
      console.error('Failed to import file:', file.name, error);
    }

    // Small delay to show progress
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  isImporting.value = false;
  showStatus(`Successfully imported ${importedCount.value} file(s)`, 'success');

  // Emit imported event
  emit('imported', importedFiles);

  // Clear selection after 1 second
  setTimeout(() => {
    selectedFiles.value = [];
    close();
  }, 1000);
}

async function extractFileMetadata(file: File): Promise<Partial<MediaFile>> {
  // Basic metadata extraction from filename
  const metadata = MediaLibrary.parseFilename(file.name);

  // Try to extract actual metadata using HTML5 Audio/Video API
  return new Promise((resolve) => {
    if (file.type.startsWith('audio/')) {
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);

      audio.addEventListener('loadedmetadata', () => {
        metadata.duration = audio.duration;
        URL.revokeObjectURL(audio.src);
        resolve(metadata);
      });

      audio.addEventListener('error', () => {
        URL.revokeObjectURL(audio.src);
        resolve(metadata);
      });
    } else if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);

      video.addEventListener('loadedmetadata', () => {
        metadata.duration = video.duration;
        URL.revokeObjectURL(video.src);
        resolve(metadata);
      });

      video.addEventListener('error', () => {
        URL.revokeObjectURL(video.src);
        resolve(metadata);
      });
    } else {
      resolve(metadata);
    }
  });
}

function saveMetadata() {
  // Apply metadata to current file
  showMetadataEditor.value = false;
  currentEditingFile.value = null;
}

function skipMetadata() {
  showMetadataEditor.value = false;
  currentEditingFile.value = null;
}

function showStatus(message: string, type: 'success' | 'error' | 'info') {
  statusMessage.value = message;
  statusType.value = type;

  setTimeout(() => {
    statusMessage.value = '';
  }, 3000);
}

function close() {
  emit('close');
}
</script>

<style scoped>
.media-import-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.media-import-dialog {
  background: #a0a0a0;
  border: 4px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  width: 600px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.5);
}

.dialog-header {
  background: #0055aa;
  color: #ffffff;
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #000000;
}

.dialog-title {
  font-size: 10px;
  margin: 0;
  font-family: 'Press Start 2P', monospace;
}

.close-button {
  background: none;
  border: none;
  color: #ffffff;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.import-method {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.method-button {
  flex: 1;
  background: #888888;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 8px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  color: #000000;
}

.method-button:hover {
  background: #999999;
}

.method-button.active {
  background: #0055aa;
  color: #ffffff;
}

.import-section {
  margin-bottom: 20px;
}

.dropzone {
  border: 3px dashed #666666;
  background: #888888;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.dropzone:hover,
.dropzone.dragging {
  border-color: #0055aa;
  background: #999999;
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.dropzone-icon {
  font-size: 48px;
}

.dropzone-text p {
  margin: 0;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
}

.dropzone-subtext {
  font-size: 7px !important;
  opacity: 0.7;
  margin-top: 4px !important;
}

.folder-input-section,
.url-input-section {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.folder-input-section input,
.url-input-section input {
  flex: 1;
}

.help-text {
  font-size: 7px;
  font-family: 'Press Start 2P', monospace;
  opacity: 0.7;
  margin: 0;
}

.import-options {
  background: #888888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 12px;
  margin-bottom: 20px;
}

.section-title {
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  margin: 0 0 12px 0;
}

.option-row {
  margin-bottom: 8px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
}

.option-row:last-child {
  margin-bottom: 0;
}

.option-row label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.file-list-section {
  margin-bottom: 20px;
}

.file-list {
  max-height: 200px;
  overflow-y: auto;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  background: #666666;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid #555555;
}

.file-item:last-child {
  border-bottom: none;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.file-icon {
  font-size: 20px;
}

.file-details {
  flex: 1;
}

.file-name {
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  color: #ffffff;
  margin-bottom: 2px;
}

.file-meta {
  font-size: 7px;
  font-family: 'Press Start 2P', monospace;
  color: #cccccc;
}

.remove-button {
  background: #ff0000;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  color: #ffffff;
  font-size: 16px;
  cursor: pointer;
  padding: 2px 8px;
  line-height: 1;
}

.progress-section {
  margin-bottom: 20px;
}

.progress-bar {
  height: 20px;
  background: #666666;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  margin-bottom: 8px;
  position: relative;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #0055aa;
  transition: width 0.3s;
}

.progress-text {
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  text-align: center;
}

.metadata-editor {
  background: #888888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 12px;
  margin-bottom: 20px;
}

.metadata-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
}

.form-row label {
  min-width: 60px;
}

.form-row input {
  flex: 1;
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.status-message {
  padding: 8px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  text-align: center;
  border: 2px solid;
  margin-bottom: 16px;
}

.status-message.success {
  background: #00ff00;
  border-color: #00aa00;
  color: #000000;
}

.status-message.error {
  background: #ff0000;
  border-color: #aa0000;
  color: #ffffff;
}

.status-message.info {
  background: #ffaa00;
  border-color: #aa6600;
  color: #000000;
}

.dialog-footer {
  background: #888888;
  border-top: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.amiga-input {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px 8px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 12px;
  font-size: 8px;
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

.amiga-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #0055aa;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: #0066cc;
}
</style>
