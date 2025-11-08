<template>
  <div class="file-properties-overlay" @click.self="handleClose">
    <div class="file-properties-window" :style="windowStyle">
      <!-- Title bar -->
      <div class="properties-titlebar" @mousedown="startDrag">
        <div class="titlebar-left">
          <div class="titlebar-button close-button" @click.stop="handleClose">
            <div class="close-icon"></div>
          </div>
        </div>
        <div class="titlebar-title">{{ file.name }} - Properties</div>
        <div class="titlebar-right"></div>
      </div>

      <!-- Tab navigation -->
      <div class="properties-tabs">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          class="tab"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </div>
      </div>

      <!-- Tab content -->
      <div class="properties-content">
        <!-- General Tab -->
        <div v-if="activeTab === 'general'" class="tab-panel">
          <div class="properties-section">
            <div class="file-icon-preview">
              <div class="icon-large">{{ getFileIcon(file.type) }}</div>
            </div>

            <div class="properties-grid">
              <div class="property-row">
                <label>Name:</label>
                <input
                  v-model="localMetadata.name"
                  type="text"
                  class="amiga-input"
                  @input="hasChanges = true"
                />
              </div>

              <div class="property-row">
                <label>Type:</label>
                <span class="property-value">{{ file.type }}</span>
              </div>

              <div class="property-row">
                <label>Size:</label>
                <span class="property-value">{{ formatFileSize(file.size) }}</span>
              </div>

              <div class="property-row">
                <label>Location:</label>
                <span class="property-value path">{{ file.path }}</span>
              </div>

              <div class="property-row">
                <label>Created:</label>
                <span class="property-value">{{ formatDate(localMetadata.created) }}</span>
              </div>

              <div class="property-row">
                <label>Modified:</label>
                <span class="property-value">{{ formatDate(localMetadata.modified) }}</span>
              </div>

              <div v-if="localMetadata.lastAccessed" class="property-row">
                <label>Accessed:</label>
                <span class="property-value">{{ formatDate(localMetadata.lastAccessed) }}</span>
              </div>
            </div>

            <!-- Permissions section -->
            <div class="permissions-section">
              <h3 class="section-title">Permissions</h3>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input
                    v-model="localMetadata.permissions!.read"
                    type="checkbox"
                    class="amiga-checkbox"
                    @change="hasChanges = true"
                  />
                  <span>Read</span>
                </label>
                <label class="checkbox-label">
                  <input
                    v-model="localMetadata.permissions!.write"
                    type="checkbox"
                    class="amiga-checkbox"
                    @change="hasChanges = true"
                  />
                  <span>Write</span>
                </label>
                <label class="checkbox-label">
                  <input
                    v-model="localMetadata.permissions!.execute"
                    type="checkbox"
                    class="amiga-checkbox"
                    @change="hasChanges = true"
                  />
                  <span>Execute</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Tags & Labels Tab -->
        <div v-if="activeTab === 'tags'" class="tab-panel">
          <div class="properties-section">
            <!-- Color Label Picker -->
            <div class="color-label-section">
              <h3 class="section-title">Color Label</h3>
              <div class="color-label-grid">
                <div
                  v-for="colorKey in colorKeys"
                  :key="colorKey"
                  class="color-label-option"
                  :class="{ selected: localMetadata.color === colorKey }"
                  :style="{ backgroundColor: COLOR_LABELS[colorKey] }"
                  :title="formatColorName(colorKey)"
                  @click="selectColor(colorKey)"
                >
                  <span v-if="localMetadata.color === colorKey" class="check-mark">✓</span>
                </div>
                <div
                  class="color-label-option color-none"
                  :class="{ selected: !localMetadata.color }"
                  title="No Color"
                  @click="selectColor(null)"
                >
                  <span v-if="!localMetadata.color" class="check-mark">✓</span>
                  <span class="none-icon">∅</span>
                </div>
              </div>
            </div>

            <!-- Rating -->
            <div class="rating-section">
              <h3 class="section-title">Rating</h3>
              <FileRatingStars
                :rating="localMetadata.rating"
                :editable="true"
                :size="24"
                @update:rating="updateRating"
              />
              <button
                v-if="localMetadata.rating > 0"
                class="amiga-button small"
                @click="clearRating"
              >
                Clear
              </button>
            </div>

            <!-- Tags -->
            <div class="tags-section">
              <h3 class="section-title">Tags</h3>

              <!-- Tag input with autocomplete -->
              <div class="tag-input-wrapper">
                <input
                  v-model="tagInput"
                  type="text"
                  class="amiga-input tag-input"
                  placeholder="Add tag..."
                  @input="handleTagInput"
                  @keydown.enter="addTag"
                  @keydown.down="navigateSuggestions(1)"
                  @keydown.up="navigateSuggestions(-1)"
                />
                <button class="amiga-button" @click="addTag">Add</button>
              </div>

              <!-- Tag suggestions -->
              <div v-if="tagSuggestions.length > 0" class="tag-suggestions">
                <div
                  v-for="(suggestion, index) in tagSuggestions"
                  :key="suggestion.name"
                  class="tag-suggestion"
                  :class="{ selected: selectedSuggestionIndex === index }"
                  @click="addSuggestedTag(suggestion.name)"
                >
                  <span class="suggestion-name">{{ suggestion.name }}</span>
                  <span class="suggestion-reason">{{ suggestion.reason }}</span>
                </div>
              </div>

              <!-- Current tags -->
              <div class="tag-list">
                <div
                  v-for="tag in localMetadata.tags"
                  :key="tag"
                  class="tag-badge"
                  :style="{ borderLeftColor: getTagColor(tag) }"
                >
                  <span class="tag-name">{{ tag }}</span>
                  <button class="tag-remove" @click="removeTag(tag)">×</button>
                </div>
                <div v-if="localMetadata.tags.length === 0" class="no-tags">
                  No tags yet
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Notes Tab -->
        <div v-if="activeTab === 'notes'" class="tab-panel">
          <div class="properties-section">
            <!-- Comments -->
            <div class="comments-section">
              <h3 class="section-title">Comments</h3>
              <textarea
                v-model="localMetadata.comments"
                class="amiga-textarea"
                rows="4"
                placeholder="Add comments about this file..."
                @input="hasChanges = true"
              ></textarea>
            </div>

            <!-- Notes -->
            <div class="notes-section">
              <h3 class="section-title">Notes</h3>

              <!-- Add note -->
              <div class="add-note">
                <textarea
                  v-model="newNote"
                  class="amiga-textarea"
                  rows="3"
                  placeholder="Add a note..."
                ></textarea>
                <div class="note-actions">
                  <button class="amiga-button" @click="addNote">Add Note</button>
                </div>
              </div>

              <!-- Notes list -->
              <div class="notes-list">
                <div
                  v-for="note in localMetadata.notes"
                  :key="note.id"
                  class="note-item"
                >
                  <div class="note-header">
                    <span class="note-date">{{ formatDateShort(note.timestamp) }}</span>
                    <button class="note-delete" @click="deleteNote(note.id)">×</button>
                  </div>
                  <div class="note-text">{{ note.text }}</div>
                </div>
                <div v-if="localMetadata.notes.length === 0" class="no-notes">
                  No notes yet
                </div>
              </div>

              <div class="notes-actions">
                <button
                  v-if="localMetadata.notes.length > 0"
                  class="amiga-button"
                  @click="clearAllNotes"
                >
                  Clear All Notes
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Details Tab -->
        <div v-if="activeTab === 'details'" class="tab-panel">
          <div class="properties-section">
            <h3 class="section-title">File Details</h3>

            <!-- Image metadata -->
            <div v-if="localMetadata.imageMetadata" class="details-grid">
              <div class="detail-row">
                <label>Dimensions:</label>
                <span>{{ localMetadata.imageMetadata.width }} × {{ localMetadata.imageMetadata.height }}</span>
              </div>
              <div v-if="localMetadata.imageMetadata.format" class="detail-row">
                <label>Format:</label>
                <span>{{ localMetadata.imageMetadata.format }}</span>
              </div>
              <div v-if="localMetadata.imageMetadata.colorSpace" class="detail-row">
                <label>Color Space:</label>
                <span>{{ localMetadata.imageMetadata.colorSpace }}</span>
              </div>
            </div>

            <!-- Text metadata -->
            <div v-if="localMetadata.textMetadata" class="details-grid">
              <div v-if="localMetadata.textMetadata.lineCount" class="detail-row">
                <label>Lines:</label>
                <span>{{ localMetadata.textMetadata.lineCount }}</span>
              </div>
              <div v-if="localMetadata.textMetadata.wordCount" class="detail-row">
                <label>Words:</label>
                <span>{{ localMetadata.textMetadata.wordCount }}</span>
              </div>
              <div v-if="localMetadata.textMetadata.characterCount" class="detail-row">
                <label>Characters:</label>
                <span>{{ localMetadata.textMetadata.characterCount }}</span>
              </div>
            </div>

            <!-- Archive metadata -->
            <div v-if="localMetadata.archiveMetadata" class="details-grid">
              <div v-if="localMetadata.archiveMetadata.fileCount" class="detail-row">
                <label>Files:</label>
                <span>{{ localMetadata.archiveMetadata.fileCount }}</span>
              </div>
              <div v-if="localMetadata.archiveMetadata.compressedSize" class="detail-row">
                <label>Compressed Size:</label>
                <span>{{ formatFileSize(localMetadata.archiveMetadata.compressedSize) }}</span>
              </div>
              <div v-if="localMetadata.archiveMetadata.compressionRatio" class="detail-row">
                <label>Compression Ratio:</label>
                <span>{{ (localMetadata.archiveMetadata.compressionRatio * 100).toFixed(1) }}%</span>
              </div>
            </div>

            <!-- Description -->
            <div class="description-section">
              <h3 class="section-title">Description</h3>
              <textarea
                v-model="localMetadata.description"
                class="amiga-textarea"
                rows="4"
                placeholder="Add a description..."
                @input="hasChanges = true"
              ></textarea>
            </div>

            <!-- Category -->
            <div class="category-section">
              <h3 class="section-title">Category</h3>
              <input
                v-model="localMetadata.category"
                type="text"
                class="amiga-input"
                placeholder="e.g., Work, Personal, Projects..."
                @input="hasChanges = true"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="properties-actions">
        <button class="amiga-button" @click="openFile">Open</button>
        <button class="amiga-button" @click="showInFolder">Show in Folder</button>
        <div class="spacer"></div>
        <button class="amiga-button" @click="handleClose">Cancel</button>
        <button class="amiga-button primary" :disabled="!hasChanges" @click="applyChanges">
          {{ hasChanges ? 'Apply' : 'OK' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import FileRatingStars from '../FileRatingStars.vue';
import {
  metadataManager,
  type FileMetadata,
  COLOR_LABELS,
  type ColorLabel,
  formatFileSize,
  formatDate,
  formatDateShort,
  getFileTypeIcon,
} from '../../utils/metadata-manager';
import { tagManager, type TagSuggestion } from '../../utils/tag-manager';

interface Props {
  file: {
    name: string;
    path: string;
    type: string;
    size: number;
  };
}

const props = defineProps<Props>();

interface Emits {
  (e: 'close'): void;
  (e: 'apply', metadata: FileMetadata): void;
  (e: 'open', path: string): void;
  (e: 'show-in-folder', path: string): void;
}

const emit = defineEmits<Emits>();

// State
const activeTab = ref('general');
const hasChanges = ref(false);
const tagInput = ref('');
const tagSuggestions = ref<TagSuggestion[]>([]);
const selectedSuggestionIndex = ref(-1);
const newNote = ref('');

// Dragging
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const windowX = ref(0);
const windowY = ref(0);

// Tabs
const tabs = [
  { id: 'general', label: 'General' },
  { id: 'tags', label: 'Tags & Labels' },
  { id: 'notes', label: 'Notes' },
  { id: 'details', label: 'Details' },
];

const colorKeys = Object.keys(COLOR_LABELS) as Array<keyof typeof COLOR_LABELS>;

// Local metadata copy
const localMetadata = reactive<FileMetadata>({
  name: props.file.name,
  path: props.file.path,
  size: props.file.size,
  type: props.file.type,
  created: Date.now(),
  modified: Date.now(),
  tags: [],
  labels: [],
  rating: 0,
  color: null,
  comments: '',
  notes: [],
  permissions: {
    read: true,
    write: true,
    execute: false,
  },
});

// Window positioning
const windowStyle = computed(() => ({
  transform: `translate(${windowX.value}px, ${windowY.value}px)`,
}));

// Load existing metadata
onMounted(() => {
  const existing = metadataManager.getMetadata(props.file.path);
  if (existing) {
    Object.assign(localMetadata, existing);
  } else {
    const defaultMetadata = metadataManager.createDefaultMetadata(
      props.file.path,
      props.file.name,
      props.file.type,
      props.file.size
    );
    Object.assign(localMetadata, defaultMetadata);
  }

  // Center window
  windowX.value = window.innerWidth / 2 - 350;
  windowY.value = window.innerHeight / 2 - 300;
});

function formatColorName(colorKey: string): string {
  return colorKey.charAt(0).toUpperCase() + colorKey.slice(1);
}

function getFileIcon(type: string): string {
  return getFileTypeIcon(type);
}

function selectColor(color: ColorLabel): void {
  localMetadata.color = color;
  hasChanges.value = true;
}

function updateRating(rating: number): void {
  localMetadata.rating = rating;
  hasChanges.value = true;
}

function clearRating(): void {
  localMetadata.rating = 0;
  hasChanges.value = true;
}

function getTagColor(tagName: string): string {
  const tag = tagManager.getTag(tagName);
  return tag?.color || '#0055aa';
}

function handleTagInput(): void {
  if (tagInput.value.trim()) {
    tagSuggestions.value = tagManager.getTagSuggestions(tagInput.value, props.file.type);
    selectedSuggestionIndex.value = -1;
  } else {
    tagSuggestions.value = [];
  }
}

function navigateSuggestions(direction: number): void {
  if (tagSuggestions.value.length === 0) return;

  selectedSuggestionIndex.value += direction;

  if (selectedSuggestionIndex.value < -1) {
    selectedSuggestionIndex.value = tagSuggestions.value.length - 1;
  } else if (selectedSuggestionIndex.value >= tagSuggestions.value.length) {
    selectedSuggestionIndex.value = -1;
  }

  if (selectedSuggestionIndex.value >= 0) {
    tagInput.value = tagSuggestions.value[selectedSuggestionIndex.value].name;
  }
}

function addTag(): void {
  const tag = tagInput.value.trim();
  if (!tag) return;

  if (!localMetadata.tags.includes(tag)) {
    localMetadata.tags.push(tag);
    hasChanges.value = true;

    // Create tag if it doesn't exist
    if (!tagManager.getTag(tag)) {
      tagManager.createTag(tag);
    }
  }

  tagInput.value = '';
  tagSuggestions.value = [];
  selectedSuggestionIndex.value = -1;
}

function addSuggestedTag(tagName: string): void {
  if (!localMetadata.tags.includes(tagName)) {
    localMetadata.tags.push(tagName);
    hasChanges.value = true;

    // Create tag if it doesn't exist
    if (!tagManager.getTag(tagName)) {
      tagManager.createTag(tagName);
    }
  }

  tagInput.value = '';
  tagSuggestions.value = [];
  selectedSuggestionIndex.value = -1;
}

function removeTag(tag: string): void {
  const index = localMetadata.tags.indexOf(tag);
  if (index > -1) {
    localMetadata.tags.splice(index, 1);
    hasChanges.value = true;
  }
}

function addNote(): void {
  const text = newNote.value.trim();
  if (!text) return;

  metadataManager.addNote(props.file.path, text);
  localMetadata.notes = metadataManager.getMetadata(props.file.path)?.notes || [];
  newNote.value = '';
  hasChanges.value = true;
}

function deleteNote(noteId: string): void {
  metadataManager.removeNote(props.file.path, noteId);
  localMetadata.notes = metadataManager.getMetadata(props.file.path)?.notes || [];
  hasChanges.value = true;
}

function clearAllNotes(): void {
  if (confirm('Clear all notes?')) {
    metadataManager.clearNotes(props.file.path);
    localMetadata.notes = [];
    hasChanges.value = true;
  }
}

function applyChanges(): void {
  metadataManager.setMetadata(props.file.path, localMetadata);
  emit('apply', localMetadata);
  hasChanges.value = false;
  handleClose();
}

function openFile(): void {
  emit('open', props.file.path);
}

function showInFolder(): void {
  emit('show-in-folder', props.file.path);
}

function handleClose(): void {
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
.file-properties-overlay {
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

.file-properties-window {
  background: #a0a0a0;
  border: 3px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 5px 5px 0px rgba(0, 0, 0, 0.5);
  width: 700px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Title bar */
.properties-titlebar {
  background: #0055aa;
  color: #ffffff;
  padding: 4px 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: move;
  user-select: none;
  border-bottom: 2px solid;
  border-color: #000000;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  background: #707070;
}

.close-icon {
  width: 8px;
  height: 8px;
  background: linear-gradient(45deg, transparent 40%, #000000 40%, #000000 60%, transparent 60%),
              linear-gradient(-45deg, transparent 40%, #000000 40%, #000000 60%, transparent 60%);
}

/* Tabs */
.properties-tabs {
  display: flex;
  background: #888888;
  border-bottom: 2px solid #000000;
}

.tab {
  flex: 1;
  padding: 8px 12px;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  text-align: center;
  background: #888888;
  border-right: 2px solid #000000;
  cursor: pointer;
  user-select: none;
  transition: background 0.1s;
}

.tab:last-child {
  border-right: none;
}

.tab:hover {
  background: #999999;
}

.tab.active {
  background: #a0a0a0;
  border-top: 2px solid #ffffff;
  border-left: 2px solid #ffffff;
  border-right: 2px solid #000000;
}

/* Content */
.properties-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  min-height: 400px;
}

.tab-panel {
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.properties-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* File icon preview */
.file-icon-preview {
  display: flex;
  justify-content: center;
  padding: 16px;
  background: #888888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  margin-bottom: 16px;
}

.icon-large {
  font-size: 64px;
}

/* Properties grid */
.properties-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.property-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  align-items: center;
  gap: 12px;
}

.property-row label {
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  color: #000000;
  text-align: right;
}

.property-value {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: #000000;
  word-break: break-all;
}

.property-value.path {
  font-size: 7px;
}

/* Section titles */
.section-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: #000000;
  margin: 8px 0 4px;
  padding-bottom: 4px;
  border-bottom: 2px solid #000000;
}

/* Permissions */
.checkbox-group {
  display: flex;
  gap: 16px;
  padding: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  cursor: pointer;
}

.amiga-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* Color labels */
.color-label-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 8px;
}

.color-label-option {
  width: 50px;
  height: 50px;
  border: 3px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s;
}

.color-label-option:hover {
  transform: scale(1.05);
}

.color-label-option.selected {
  border: 4px solid #ffff00;
  box-shadow: inset 0 0 0 1px #000000;
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
  font-size: 24px;
  font-weight: bold;
  text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.8);
}

.none-icon {
  font-size: 28px;
  color: #000000;
  font-weight: bold;
}

/* Rating */
.rating-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
}

/* Tags */
.tag-input-wrapper {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.tag-input {
  flex: 1;
}

.tag-suggestions {
  background: #888888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  margin-bottom: 8px;
  max-height: 150px;
  overflow-y: auto;
}

.tag-suggestion {
  padding: 6px 8px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #707070;
}

.tag-suggestion:last-child {
  border-bottom: none;
}

.tag-suggestion:hover,
.tag-suggestion.selected {
  background: #a0a0a0;
}

.suggestion-name {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  font-weight: bold;
}

.suggestion-reason {
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  color: #333333;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px;
  background: #888888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  min-height: 60px;
}

.tag-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: #ccddff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  border-left: 4px solid;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
}

.tag-name {
  color: #000000;
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
  line-height: 1;
}

.tag-remove:hover {
  background: #aa0000;
}

.no-tags,
.no-notes {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: #555555;
  font-style: italic;
  padding: 8px;
}

/* Notes */
.add-note {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.note-actions {
  display: flex;
  justify-content: flex-end;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.note-item {
  background: #ffff99;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 8px;
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.note-date {
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  color: #555555;
}

.note-delete {
  background: #cc0000;
  color: #ffffff;
  border: none;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  line-height: 1;
}

.note-delete:hover {
  background: #aa0000;
}

.note-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  line-height: 1.5;
  color: #000000;
  white-space: pre-wrap;
}

.notes-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

/* Details tab */
.details-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: #888888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  margin-bottom: 12px;
}

.detail-row {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 12px;
}

.detail-row label {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: #000000;
  text-align: right;
}

.detail-row span {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: #000000;
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
  outline-offset: -2px;
}

.amiga-textarea {
  resize: vertical;
  min-height: 60px;
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
  background: #707070;
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

.amiga-button.small {
  padding: 4px 8px;
  font-size: 7px;
}

/* Actions */
.properties-actions {
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
