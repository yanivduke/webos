<template>
  <div class="track-info-overlay" @click.self="close">
    <div class="track-info-dialog">
      <!-- Header -->
      <div class="dialog-header">
        <h2 class="dialog-title">Track Information</h2>
        <button class="close-button" @click="close">×</button>
      </div>

      <!-- Content -->
      <div class="dialog-content">
        <!-- Artwork Section -->
        <div class="artwork-section">
          <div class="artwork-container">
            <img v-if="editedTrack.artwork" :src="editedTrack.artwork" alt="Artwork" class="artwork-image" />
            <div v-else class="artwork-placeholder">
              <div class="artwork-icon">♪</div>
            </div>
          </div>
          <div class="artwork-actions">
            <button class="amiga-button btn-small" @click="triggerArtworkUpload">
              {{ editedTrack.artwork ? 'Change' : 'Add' }} Artwork
            </button>
            <button
              v-if="editedTrack.artwork"
              class="amiga-button btn-small btn-danger"
              @click="removeArtwork"
            >
              Remove
            </button>
            <input
              ref="artworkInput"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleArtworkUpload"
            />
          </div>
        </div>

        <!-- Metadata Form -->
        <div class="metadata-section">
          <h3 class="section-title">Metadata</h3>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Title:</label>
              <input
                v-model="editedTrack.name"
                type="text"
                class="amiga-input"
                placeholder="Track title"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Artist:</label>
              <input
                v-model="editedTrack.artist"
                type="text"
                class="amiga-input"
                placeholder="Artist name"
                list="artists"
              />
              <datalist id="artists">
                <option v-for="artist in suggestedArtists" :key="artist" :value="artist" />
              </datalist>
            </div>

            <div class="form-group">
              <label class="form-label">Album:</label>
              <input
                v-model="editedTrack.album"
                type="text"
                class="amiga-input"
                placeholder="Album name"
                list="albums"
              />
              <datalist id="albums">
                <option v-for="album in suggestedAlbums" :key="album" :value="album" />
              </datalist>
            </div>

            <div class="form-group">
              <label class="form-label">Genre:</label>
              <input
                v-model="editedTrack.genre"
                type="text"
                class="amiga-input"
                placeholder="Genre"
                list="genres"
              />
              <datalist id="genres">
                <option v-for="genre in suggestedGenres" :key="genre" :value="genre" />
              </datalist>
            </div>

            <div class="form-group form-group-half">
              <label class="form-label">Year:</label>
              <input
                v-model.number="editedTrack.year"
                type="number"
                class="amiga-input"
                placeholder="Year"
                min="1900"
                max="2099"
              />
            </div>

            <div class="form-group form-group-half">
              <label class="form-label">Track #:</label>
              <input
                v-model.number="editedTrack.trackNumber"
                type="number"
                class="amiga-input"
                placeholder="Track number"
                min="1"
                max="999"
              />
            </div>

            <div class="form-group form-group-full">
              <label class="form-label">Comments:</label>
              <textarea
                v-model="editedTrack.comments"
                class="amiga-textarea"
                rows="3"
                placeholder="Additional notes or comments"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- File Details -->
        <div class="details-section">
          <h3 class="section-title">File Details</h3>

          <div class="details-grid">
            <div class="detail-row">
              <span class="detail-label">File Path:</span>
              <span class="detail-value">{{ editedTrack.path }}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Format:</span>
              <span class="detail-value">{{ editedTrack.format?.toUpperCase() || '—' }}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Duration:</span>
              <span class="detail-value">{{ formatDuration(editedTrack.duration) }}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">File Size:</span>
              <span class="detail-value">{{ formatFileSize(editedTrack.fileSize || 0) }}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Bitrate:</span>
              <span class="detail-value">{{ editedTrack.bitrate ? `${editedTrack.bitrate} kbps` : '—' }}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Sample Rate:</span>
              <span class="detail-value">{{ editedTrack.sampleRate ? `${editedTrack.sampleRate} Hz` : '—' }}</span>
            </div>
          </div>
        </div>

        <!-- Playback Stats -->
        <div class="stats-section">
          <h3 class="section-title">Playback Statistics</h3>

          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">Play Count:</div>
              <div class="stat-value">{{ editedTrack.playCount }}</div>
            </div>

            <div class="stat-item">
              <div class="stat-label">Date Added:</div>
              <div class="stat-value">{{ formatDate(editedTrack.addedDate) }}</div>
            </div>

            <div class="stat-item">
              <div class="stat-label">Last Played:</div>
              <div class="stat-value">{{ formatDate(editedTrack.lastPlayed) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="dialog-footer">
        <button class="amiga-button btn-primary" @click="save">
          Save Changes
        </button>
        <button class="amiga-button" @click="reset">
          Reset
        </button>
        <button class="amiga-button" @click="close">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { mediaLibrary, type MediaFile } from '../../utils/media-library';

// Props
interface Props {
  track: MediaFile;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updated', track: MediaFile): void;
}>();

// State
const editedTrack = ref<MediaFile>({ ...props.track });
const artworkInput = ref<HTMLInputElement | null>(null);

// Suggestions (from library)
const suggestedArtists = computed(() => mediaLibrary.getArtists());
const suggestedAlbums = computed(() => mediaLibrary.getAlbums());
const suggestedGenres = computed(() => mediaLibrary.getGenres());

// Methods
function triggerArtworkUpload() {
  artworkInput.value?.click();
}

function handleArtworkUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Please select an image file');
    return;
  }

  // Convert to base64
  const reader = new FileReader();
  reader.onload = (e) => {
    editedTrack.value.artwork = e.target?.result as string;
  };
  reader.readAsDataURL(file);
}

function removeArtwork() {
  editedTrack.value.artwork = undefined;
}

function save() {
  // Update in library
  const updated = mediaLibrary.updateMediaFile(editedTrack.value.id, editedTrack.value);

  if (updated) {
    emit('updated', updated);
    close();
  } else {
    alert('Failed to update track');
  }
}

function reset() {
  editedTrack.value = { ...props.track };
}

function close() {
  emit('close');
}

function formatDuration(seconds: number): string {
  return MediaLibrary.formatDuration(seconds);
}

function formatFileSize(bytes: number): string {
  return MediaLibrary.formatFileSize(bytes);
}

function formatDate(timestamp?: number): string {
  if (!timestamp) return '—';

  const date = new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Keyboard shortcuts
function handleKeyPress(event: KeyboardEvent) {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    save();
  } else if (event.key === 'Escape') {
    close();
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyPress);
});
</script>

<style scoped>
.track-info-overlay {
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

.track-info-dialog {
  background: #a0a0a0;
  border: 4px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  width: 700px;
  max-width: 90vw;
  max-height: 90vh;
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

.artwork-section {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  align-items: center;
}

.artwork-container {
  width: 150px;
  height: 150px;
  background: #666666;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.artwork-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artwork-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.artwork-icon {
  font-size: 48px;
  color: #0055aa;
}

.artwork-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metadata-section,
.details-section,
.stats-section {
  background: #888888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 12px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  margin: 0 0 12px 0;
  color: #000000;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group-half {
  grid-column: span 1;
}

.form-group-full {
  grid-column: span 2;
}

.form-label {
  font-size: 7px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
}

.amiga-input,
.amiga-textarea {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px 8px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
}

.amiga-textarea {
  resize: vertical;
  font-family: 'Courier New', monospace;
  line-height: 1.4;
}

.details-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  gap: 8px;
  font-size: 7px;
  font-family: 'Press Start 2P', monospace;
}

.detail-label {
  min-width: 100px;
  color: #000000;
  opacity: 0.7;
}

.detail-value {
  flex: 1;
  color: #000000;
  word-break: break-all;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 7px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
  opacity: 0.7;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
  font-weight: bold;
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

.btn-small {
  font-size: 7px;
  padding: 4px 8px;
}

.btn-primary {
  background: #0055aa;
  color: #ffffff;
}

.btn-primary:hover {
  background: #0066cc;
}

.btn-danger {
  background: #ff0000;
  color: #ffffff;
}

.btn-danger:hover {
  background: #ff3333;
}
</style>
