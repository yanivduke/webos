<template>
  <div class="bulk-metadata-overlay" @click.self="handleClose">
    <div class="bulk-metadata-window" :style="windowStyle">
      <!-- Title bar -->
      <div class="bulk-titlebar" @mousedown="startDrag">
        <div class="titlebar-left">
          <div class="titlebar-button close-button" @click.stop="handleClose">
            <div class="close-icon"></div>
          </div>
        </div>
        <div class="titlebar-title">Bulk Metadata Editor - {{ selectedFiles.length }} files</div>
        <div class="titlebar-right"></div>
      </div>

      <!-- File list -->
      <div class="file-list-section">
        <div class="section-header">
          <h3 class="section-title">Selected Files</h3>
          <div class="file-count">{{ selectedFiles.length }} file(s)</div>
        </div>

        <div class="file-list">
          <div
            v-for="file in selectedFiles"
            :key="file.path"
            class="file-item"
          >
            <input
              v-model="file.selected"
              type="checkbox"
              class="file-checkbox"
              @change="updateSelection"
            />
            <span class="file-icon">{{ getFileIcon(file.type) }}</span>
            <span class="file-name">{{ file.name }}</span>
            <span class="file-size">{{ formatFileSize(file.size) }}</span>
          </div>
        </div>

        <div class="selection-actions">
          <button class="amiga-button small" @click="selectAll">Select All</button>
          <button class="amiga-button small" @click="selectNone">Select None</button>
          <span class="selection-count">{{ selectedCount }} selected</span>
        </div>
      </div>

      <!-- Metadata editing section -->
      <div class="metadata-editing-section">
        <h3 class="section-title">Apply Metadata</h3>

        <!-- Add Tags -->
        <div class="edit-group">
          <label class="edit-label">Add Tags:</label>
          <div class="tag-input-group">
            <input
              v-model="tagToAdd"
              type="text"
              class="amiga-input"
              placeholder="Tag name..."
              @input="handleTagInput"
              @keydown.enter="addTagToList"
            />
            <button class="amiga-button" @click="addTagToList">Add</button>
          </div>

          <!-- Tag suggestions -->
          <div v-if="tagSuggestions.length > 0" class="tag-suggestions-inline">
            <span
              v-for="suggestion in tagSuggestions.slice(0, 5)"
              :key="suggestion.name"
              class="tag-suggestion-chip"
              @click="quickAddTag(suggestion.name)"
            >
              {{ suggestion.name }}
            </span>
          </div>

          <!-- Tags to add list -->
          <div v-if="tagsToAdd.length > 0" class="tags-to-add">
            <div
              v-for="tag in tagsToAdd"
              :key="tag"
              class="tag-chip"
            >
              <span>{{ tag }}</span>
              <button class="tag-remove" @click="removeTagFromList(tag)">×</button>
            </div>
          </div>
        </div>

        <!-- Set Color Label -->
        <div class="edit-group">
          <label class="edit-label">Set Color Label:</label>
          <div class="color-selection">
            <div
              v-for="colorKey in colorKeys"
              :key="colorKey"
              class="color-option"
              :class="{ selected: colorToSet === colorKey }"
              :style="{ backgroundColor: COLOR_LABELS[colorKey] }"
              :title="formatColorName(colorKey)"
              @click="selectColorLabel(colorKey)"
            >
              <span v-if="colorToSet === colorKey" class="check-mark">✓</span>
            </div>
            <div
              class="color-option color-none"
              :class="{ selected: colorToSet === null }"
              title="No Color"
              @click="selectColorLabel(null)"
            >
              <span v-if="colorToSet === null" class="check-mark">✓</span>
              <span class="none-icon">∅</span>
            </div>
          </div>
        </div>

        <!-- Set Rating -->
        <div class="edit-group">
          <label class="edit-label">Set Rating:</label>
          <div class="rating-selection">
            <FileRatingStars
              :rating="ratingToSet"
              :editable="true"
              :size="20"
              @update:rating="ratingToSet = $event"
            />
            <button
              v-if="ratingToSet > 0"
              class="amiga-button small"
              @click="ratingToSet = 0"
            >
              Clear
            </button>
          </div>
        </div>

        <!-- Add Comment -->
        <div class="edit-group">
          <label class="edit-label">Add Comment:</label>
          <textarea
            v-model="commentToAdd"
            class="amiga-textarea"
            rows="3"
            placeholder="This comment will be added to all selected files..."
          ></textarea>
        </div>
      </div>

      <!-- Preview changes -->
      <div v-if="hasChanges" class="preview-section">
        <h3 class="section-title">Changes Preview</h3>
        <div class="preview-content">
          <div v-if="tagsToAdd.length > 0" class="preview-item">
            <strong>Tags to add:</strong> {{ tagsToAdd.join(', ') }}
          </div>
          <div v-if="colorToSet !== undefined" class="preview-item">
            <strong>Color label:</strong>
            <span v-if="colorToSet" :style="{ color: COLOR_LABELS[colorToSet] }">
              {{ formatColorName(colorToSet) }}
            </span>
            <span v-else>None</span>
          </div>
          <div v-if="ratingToSet > 0" class="preview-item">
            <strong>Rating:</strong> {{ ratingToSet }} star{{ ratingToSet !== 1 ? 's' : '' }}
          </div>
          <div v-if="commentToAdd" class="preview-item">
            <strong>Comment:</strong> {{ commentToAdd.substring(0, 100) }}{{ commentToAdd.length > 100 ? '...' : '' }}
          </div>
          <div class="preview-item">
            <strong>Files affected:</strong> {{ selectedCount }}
          </div>
        </div>
      </div>

      <!-- Progress bar -->
      <div v-if="isProcessing" class="progress-section">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        </div>
        <div class="progress-text">
          Processing: {{ processedCount }} / {{ selectedCount }} files ({{ progress }}%)
        </div>
      </div>

      <!-- Undo section -->
      <div v-if="canUndo" class="undo-section">
        <div class="undo-message">
          Last operation completed successfully!
        </div>
        <button class="amiga-button" @click="undoLastOperation">Undo Last Operation</button>
      </div>

      <!-- Action buttons -->
      <div class="bulk-actions">
        <button
          class="amiga-button"
          :disabled="!hasChanges || selectedCount === 0 || isProcessing"
          @click="previewChanges"
        >
          Preview
        </button>
        <button
          class="amiga-button danger"
          :disabled="selectedCount === 0 || isProcessing"
          @click="clearMetadata"
        >
          Clear Metadata
        </button>
        <div class="spacer"></div>
        <button class="amiga-button" @click="handleClose" :disabled="isProcessing">
          Close
        </button>
        <button
          class="amiga-button primary"
          :disabled="!hasChanges || selectedCount === 0 || isProcessing"
          @click="applyChanges"
        >
          Apply to {{ selectedCount }} File{{ selectedCount !== 1 ? 's' : '' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import FileRatingStars from '../FileRatingStars.vue';
import {
  metadataManager,
  COLOR_LABELS,
  type ColorLabel,
  formatFileSize,
  getFileTypeIcon,
} from '../../utils/metadata-manager';
import { tagManager, type TagSuggestion } from '../../utils/tag-manager';

interface FileItem {
  name: string;
  path: string;
  type: string;
  size: number;
  selected: boolean;
}

interface Props {
  files: Array<{
    name: string;
    path: string;
    type: string;
    size: number;
  }>;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'close'): void;
  (e: 'apply', changes: any): void;
}

const emit = defineEmits<Emits>();

// State
const selectedFiles = ref<FileItem[]>([]);
const tagsToAdd = ref<string[]>([]);
const colorToSet = ref<ColorLabel | undefined>(undefined);
const ratingToSet = ref(0);
const commentToAdd = ref('');
const tagToAdd = ref('');
const tagSuggestions = ref<TagSuggestion[]>([]);

const isProcessing = ref(false);
const processedCount = ref(0);
const progress = ref(0);

const canUndo = ref(false);
const lastOperation = ref<any>(null);

// Dragging
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const windowX = ref(0);
const windowY = ref(0);

const colorKeys = Object.keys(COLOR_LABELS) as Array<keyof typeof COLOR_LABELS>;

// Computed
const selectedCount = computed(() => {
  return selectedFiles.value.filter(f => f.selected).length;
});

const hasChanges = computed(() => {
  return tagsToAdd.value.length > 0 ||
         colorToSet.value !== undefined ||
         ratingToSet.value > 0 ||
         commentToAdd.value.trim() !== '';
});

const windowStyle = computed(() => ({
  transform: `translate(${windowX.value}px, ${windowY.value}px)`,
}));

// Initialize
onMounted(() => {
  selectedFiles.value = props.files.map(file => ({
    ...file,
    selected: true,
  }));

  // Center window
  windowX.value = window.innerWidth / 2 - 400;
  windowY.value = window.innerHeight / 2 - 350;
});

function getFileIcon(type: string): string {
  return getFileTypeIcon(type);
}

function formatColorName(colorKey: string): string {
  return colorKey.charAt(0).toUpperCase() + colorKey.slice(1);
}

function updateSelection(): void {
  // Just trigger reactivity
}

function selectAll(): void {
  selectedFiles.value.forEach(file => {
    file.selected = true;
  });
}

function selectNone(): void {
  selectedFiles.value.forEach(file => {
    file.selected = false;
  });
}

function handleTagInput(): void {
  if (tagToAdd.value.trim()) {
    tagSuggestions.value = tagManager.getTagSuggestions(tagToAdd.value);
  } else {
    tagSuggestions.value = [];
  }
}

function addTagToList(): void {
  const tag = tagToAdd.value.trim();
  if (!tag) return;

  if (!tagsToAdd.value.includes(tag)) {
    tagsToAdd.value.push(tag);
  }

  tagToAdd.value = '';
  tagSuggestions.value = [];
}

function quickAddTag(tagName: string): void {
  if (!tagsToAdd.value.includes(tagName)) {
    tagsToAdd.value.push(tagName);
  }
  tagToAdd.value = '';
  tagSuggestions.value = [];
}

function removeTagFromList(tag: string): void {
  const index = tagsToAdd.value.indexOf(tag);
  if (index > -1) {
    tagsToAdd.value.splice(index, 1);
  }
}

function selectColorLabel(color: ColorLabel | null): void {
  colorToSet.value = color === null ? null : color;
}

async function applyChanges(): Promise<void> {
  if (!hasChanges.value || selectedCount.value === 0) return;

  if (!confirm(`Apply changes to ${selectedCount.value} file(s)?`)) {
    return;
  }

  isProcessing.value = true;
  processedCount.value = 0;
  progress.value = 0;

  const filesToProcess = selectedFiles.value.filter(f => f.selected);
  const changes: any = {};

  // Build changes object
  if (colorToSet.value !== undefined) {
    changes.color = colorToSet.value;
  }

  if (ratingToSet.value > 0) {
    changes.rating = ratingToSet.value;
  }

  if (commentToAdd.value.trim()) {
    changes.comments = commentToAdd.value.trim();
  }

  // Store for undo
  const undoData = {
    files: filesToProcess.map(f => f.path),
    previousMetadata: new Map(),
  };

  // Process files
  for (let i = 0; i < filesToProcess.length; i++) {
    const file = filesToProcess[i];

    // Store previous metadata for undo
    const previous = metadataManager.getMetadata(file.path);
    if (previous) {
      undoData.previousMetadata.set(file.path, { ...previous });
    }

    // Get or create metadata
    let metadata = metadataManager.getMetadata(file.path);
    if (!metadata) {
      metadata = metadataManager.createDefaultMetadata(
        file.path,
        file.name,
        file.type,
        file.size
      );
    }

    // Apply tags
    if (tagsToAdd.value.length > 0) {
      tagsToAdd.value.forEach(tag => {
        if (!metadata!.tags.includes(tag)) {
          metadataManager.addTag(file.path, tag);
        }
      });
    }

    // Apply other changes
    if (Object.keys(changes).length > 0) {
      metadataManager.setMetadata(file.path, {
        ...metadata,
        ...changes,
      });
    }

    processedCount.value++;
    progress.value = Math.round((processedCount.value / filesToProcess.length) * 100);

    // Small delay to show progress
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Save for undo
  lastOperation.value = undoData;
  canUndo.value = true;

  // Complete
  isProcessing.value = false;
  emit('apply', { tagsToAdd: tagsToAdd.value, ...changes });

  // Reset form
  setTimeout(() => {
    tagsToAdd.value = [];
    colorToSet.value = undefined;
    ratingToSet.value = 0;
    commentToAdd.value = '';
  }, 500);
}

async function clearMetadata(): Promise<void> {
  if (!confirm(`Clear all metadata from ${selectedCount.value} file(s)? This cannot be undone!`)) {
    return;
  }

  isProcessing.value = true;
  processedCount.value = 0;
  progress.value = 0;

  const filesToProcess = selectedFiles.value.filter(f => f.selected);

  for (let i = 0; i < filesToProcess.length; i++) {
    const file = filesToProcess[i];
    metadataManager.clearMetadata(file.path);

    processedCount.value++;
    progress.value = Math.round((processedCount.value / filesToProcess.length) * 100);

    await new Promise(resolve => setTimeout(resolve, 30));
  }

  isProcessing.value = false;
  canUndo.value = false;
}

function undoLastOperation(): void {
  if (!lastOperation.value) return;

  const { files, previousMetadata } = lastOperation.value;

  files.forEach((path: string) => {
    const previous = previousMetadata.get(path);
    if (previous) {
      metadataManager.setMetadata(path, previous);
    } else {
      metadataManager.clearMetadata(path);
    }
  });

  canUndo.value = false;
  lastOperation.value = null;
}

function previewChanges(): void {
  // Preview is shown automatically in the preview-section
  // This function could open a detailed preview dialog if needed
  alert('Changes preview is shown below the editing section.');
}

function handleClose(): void {
  if (isProcessing.value) {
    alert('Please wait for the current operation to complete.');
    return;
  }

  if (hasChanges.value) {
    if (confirm('You have unsaved changes. Close anyway?')) {
      emit('close');
    }
  } else {
    emit('close');
  }
}

// Dragging
function startDrag(e: MouseEvent): void {
  isDragging.value = true;
  dragStartX.value = e.clientX - windowX.value;
  dragStartY.value = e.clientY - windowY.value;
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
  e.preventDefault();
}

function onDrag(e: MouseEvent): void {
  if (!isDragging.value) return;
  windowX.value = e.clientX - dragStartX.value;
  windowY.value = e.clientY - dragStartY.value;
}

function stopDrag(): void {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
}

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
});
</script>

<style scoped>
.bulk-metadata-overlay {
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

.bulk-metadata-window {
  background: #a0a0a0;
  border: 3px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 5px 5px 0px rgba(0, 0, 0, 0.5);
  width: 800px;
  max-height: 700px;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Title bar */
.bulk-titlebar {
  background: #0055aa;
  color: #ffffff;
  padding: 4px 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: move;
  user-select: none;
  border-bottom: 2px solid #000000;
}

.titlebar-left,
.titlebar-right {
  display: flex;
  gap: 4px;
}

.titlebar-title {
  flex: 1;
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  text-align: center;
}

.titlebar-button {
  width: 20px;
  height: 16px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.titlebar-button:hover {
  background: #888888;
}

.titlebar-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
}

.close-icon {
  width: 8px;
  height: 8px;
  background: linear-gradient(45deg, transparent 40%, #000000 40%, #000000 60%, transparent 60%),
              linear-gradient(-45deg, transparent 40%, #000000 40%, #000000 60%, transparent 60%);
}

/* File list section */
.file-list-section {
  padding: 12px;
  border-bottom: 2px solid #000000;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: #000000;
  margin: 0;
}

.file-count {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: #333333;
}

.file-list {
  background: #888888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  max-height: 150px;
  overflow-y: auto;
  margin-bottom: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-bottom: 1px solid #707070;
}

.file-item:last-child {
  border-bottom: none;
}

.file-item:hover {
  background: #999999;
}

.file-checkbox {
  width: 16px;
  height: 16px;
}

.file-icon {
  font-size: 16px;
}

.file-name {
  flex: 1;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  color: #333333;
}

.selection-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.selection-count {
  margin-left: auto;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: #000000;
}

/* Metadata editing section */
.metadata-editing-section {
  padding: 12px;
  overflow-y: auto;
  max-height: 300px;
}

.edit-group {
  margin-bottom: 16px;
}

.edit-label {
  display: block;
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  color: #000000;
  margin-bottom: 6px;
}

.tag-input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.tag-suggestions-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.tag-suggestion-chip {
  padding: 3px 8px;
  background: #ccddff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  cursor: pointer;
}

.tag-suggestion-chip:hover {
  background: #bbccee;
}

.tags-to-add {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px;
  background: #888888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.tag-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: #ccddff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
}

.tag-remove {
  background: #cc0000;
  color: #ffffff;
  border: none;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
}

.tag-remove:hover {
  background: #aa0000;
}

/* Color selection */
.color-selection {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.color-option {
  width: 40px;
  height: 40px;
  border: 3px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s;
}

.color-option:hover {
  transform: scale(1.05);
}

.color-option.selected {
  border: 4px solid #ffff00;
}

.color-none {
  background: #a0a0a0;
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 4px,
    #888888 4px,
    #888888 8px
  );
}

.check-mark {
  color: #ffffff;
  font-size: 20px;
  font-weight: bold;
  text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.8);
}

.none-icon {
  font-size: 24px;
  color: #000000;
  font-weight: bold;
}

/* Rating selection */
.rating-selection {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Preview section */
.preview-section {
  padding: 12px;
  background: #ffff99;
  border-top: 2px solid #000000;
  border-bottom: 2px solid #000000;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-item {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: #000000;
}

.preview-item strong {
  color: #0055aa;
}

/* Progress section */
.progress-section {
  padding: 12px;
  background: #888888;
  border-top: 2px solid #000000;
}

.progress-bar {
  background: #555555;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  height: 24px;
  margin-bottom: 8px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #00aa00;
  transition: width 0.3s;
}

.progress-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: #000000;
  text-align: center;
}

/* Undo section */
.undo-section {
  padding: 12px;
  background: #ccffcc;
  border-top: 2px solid #000000;
  display: flex;
  align-items: center;
  gap: 12px;
}

.undo-message {
  flex: 1;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: #00aa00;
}

/* Input elements */
.amiga-input,
.amiga-textarea {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px 6px;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: #000000;
  width: 100%;
}

.amiga-input:focus,
.amiga-textarea:focus {
  outline: 2px solid #0055aa;
}

.amiga-textarea {
  resize: vertical;
}

/* Buttons */
.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 12px;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: #000000;
  cursor: pointer;
  white-space: nowrap;
}

.amiga-button:hover {
  background: #888888;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
}

.amiga-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.amiga-button.primary {
  background: #0055aa;
  color: #ffffff;
}

.amiga-button.primary:hover {
  background: #0044aa;
}

.amiga-button.danger {
  background: #cc0000;
  color: #ffffff;
}

.amiga-button.danger:hover {
  background: #aa0000;
}

.amiga-button.small {
  padding: 4px 8px;
  font-size: 7px;
}

/* Actions */
.bulk-actions {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: #888888;
  border-top: 2px solid #000000;
}

.spacer {
  flex: 1;
}
</style>
