<template>
  <Teleport to="body">
    <div v-if="isVisible" class="quick-view-backdrop" @click="handleBackdropClick">
      <div class="quick-view-window" @click.stop @mousedown.stop>
        <!-- Title Bar -->
        <div class="quick-view-titlebar">
          <div class="title-bar-left">
            <div class="title-bar-button close-button" @click.stop="close">
              <div class="close-icon"></div>
            </div>
          </div>
          <div class="window-title">
            Quick View - {{ currentItem?.name || 'Unknown' }}
          </div>
          <div class="title-bar-right">
            <span class="navigation-info">{{ navigationInfo }}</span>
          </div>
        </div>

        <!-- Content Area -->
        <div class="quick-view-content">
          <!-- Loading State -->
          <div v-if="isLoading" class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading...</div>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="error-container">
            <div class="error-icon">⚠</div>
            <div class="error-text">{{ error }}</div>
          </div>

          <!-- Content Display -->
          <div v-else-if="currentItem" class="content-display">
            <!-- Folder Preview -->
            <div v-if="currentItem.type === 'folder'" class="folder-preview">
              <div class="preview-header">
                <svg viewBox="0 0 48 48" class="folder-icon">
                  <path d="M 4 8 L 4 40 L 44 40 L 44 16 L 24 16 L 20 8 Z" fill="#ffaa00" stroke="#000" stroke-width="2"/>
                  <path d="M 4 8 L 20 8 L 24 16 L 44 16 L 44 12 L 24 12 L 20 8 Z" fill="#ffcc44" stroke="#000" stroke-width="1"/>
                </svg>
                <h3>{{ currentItem.name }}</h3>
              </div>
              <div class="folder-contents">
                <pre class="folder-list">{{ formatFolderContents(content) }}</pre>
              </div>
            </div>

            <!-- Text File Preview -->
            <div v-else-if="isTextFile(currentItem.name)" class="text-preview">
              <div class="preview-header">
                <svg viewBox="0 0 48 48" class="file-icon">
                  <rect x="10" y="6" width="28" height="36" fill="#ffffff" stroke="#000" stroke-width="2"/>
                  <line x1="14" y1="14" x2="34" y2="14" stroke="#0055aa" stroke-width="2"/>
                  <line x1="14" y1="20" x2="34" y2="20" stroke="#0055aa" stroke-width="2"/>
                  <line x1="14" y1="26" x2="28" y2="26" stroke="#0055aa" stroke-width="2"/>
                  <line x1="14" y1="32" x2="30" y2="32" stroke="#0055aa" stroke-width="2"/>
                </svg>
                <h3>{{ currentItem.name }}</h3>
                <span class="file-info">{{ currentItem.size }}</span>
              </div>
              <div class="text-contents">
                <pre class="text-content">{{ truncateContent(content, 500) }}</pre>
                <div v-if="isContentTruncated(content, 500)" class="truncate-notice">
                  Content truncated to first 500 lines...
                </div>
              </div>
            </div>

            <!-- AWML File Preview -->
            <div v-else-if="isAwmlFile(currentItem.name)" class="awml-preview">
              <div class="preview-header">
                <svg viewBox="0 0 48 48" class="awml-icon">
                  <rect x="8" y="8" width="32" height="32" fill="#ff6600" stroke="#000" stroke-width="2"/>
                  <rect x="12" y="12" width="24" height="6" fill="#fff"/>
                  <rect x="12" y="20" width="24" height="6" fill="#fff"/>
                  <rect x="12" y="28" width="24" height="6" fill="#fff"/>
                  <circle cx="38" cy="10" r="4" fill="#00ff00"/>
                  <text x="39" y="13" text-anchor="middle" fill="#000" font-size="6" font-family="monospace">A</text>
                </svg>
                <h3>{{ currentItem.name }}</h3>
                <span class="file-info">{{ currentItem.size }} • AWML Application</span>
              </div>
              <div class="awml-contents">
                <pre class="awml-content">{{ truncateContent(content, 500) }}</pre>
                <div v-if="isContentTruncated(content, 500)" class="truncate-notice">
                  Content truncated to first 500 lines...
                </div>
              </div>
            </div>

            <!-- Tool Preview -->
            <div v-else-if="currentItem.type === 'tool'" class="tool-preview">
              <div class="preview-header">
                <svg viewBox="0 0 48 48" class="tool-icon">
                  <rect x="12" y="8" width="24" height="32" fill="#0055aa" stroke="#000" stroke-width="2"/>
                  <rect x="16" y="12" width="16" height="4" fill="#fff"/>
                  <rect x="16" y="18" width="16" height="4" fill="#fff"/>
                  <rect x="16" y="24" width="16" height="4" fill="#fff"/>
                </svg>
                <h3>{{ currentItem.name }}</h3>
              </div>
              <div class="tool-info">
                <pre>{{ content }}</pre>
              </div>
            </div>

            <!-- Unknown/Binary File -->
            <div v-else class="binary-preview">
              <div class="preview-header">
                <div class="binary-icon">?</div>
                <h3>{{ currentItem.name }}</h3>
                <span class="file-info">{{ currentItem.size }}</span>
              </div>
              <div class="binary-info">
                <p>Preview not available for this file type.</p>
                <div class="file-details">
                  <div><strong>Type:</strong> {{ currentItem.type }}</div>
                  <div><strong>Size:</strong> {{ currentItem.size || 'Unknown' }}</div>
                  <div v-if="currentItem.created"><strong>Created:</strong> {{ formatDate(currentItem.created) }}</div>
                  <div v-if="currentItem.modified"><strong>Modified:</strong> {{ formatDate(currentItem.modified) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer / Navigation Bar -->
        <div class="quick-view-footer">
          <button
            class="amiga-button nav-button"
            :disabled="!canNavigate"
            @click="previous"
          >
            ◄ Previous
          </button>
          <div class="footer-info">
            Press <kbd>←</kbd> <kbd>→</kbd> to navigate, <kbd>ESC</kbd> to close
          </div>
          <button
            class="amiga-button nav-button"
            :disabled="!canNavigate"
            @click="next"
          >
            Next ►
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted } from 'vue';
import { useQuickView } from '../composables/useQuickView';

const {
  isVisible,
  currentItem,
  content,
  isLoading,
  error,
  canNavigate,
  navigationInfo,
  close,
  next,
  previous
} = useQuickView();

// Helper functions
const isTextFile = (fileName: string): boolean => {
  const lowerName = fileName.toLowerCase();
  return lowerName.endsWith('.txt') ||
    lowerName.endsWith('.text') ||
    lowerName.endsWith('.md') ||
    lowerName.endsWith('.log') ||
    lowerName.endsWith('.doc');
};

const isAwmlFile = (fileName: string): boolean => {
  return fileName.toLowerCase().endsWith('.awml');
};

const truncateContent = (content: string | null, maxLines: number): string => {
  if (!content) return '';
  const lines = content.split('\n');
  if (lines.length <= maxLines) return content;
  return lines.slice(0, maxLines).join('\n');
};

const isContentTruncated = (content: string | null, maxLines: number): boolean => {
  if (!content) return false;
  return content.split('\n').length > maxLines;
};

const formatFolderContents = (content: string | null): string => {
  if (!content) return 'Empty folder';

  try {
    const items = JSON.parse(content);
    if (!Array.isArray(items) || items.length === 0) {
      return 'Empty folder';
    }

    return items
      .map(item => {
        const icon = item.type === 'folder' ? '📁' : '📄';
        const size = item.size ? `  (${item.size})` : '';
        return `${icon} ${item.name}${size}`;
      })
      .join('\n');
  } catch {
    return content;
  }
};

const formatDate = (date: string): string => {
  try {
    return new Date(date).toLocaleString();
  } catch {
    return date;
  }
};

const handleBackdropClick = () => {
  close();
};

// Keyboard navigation
const handleKeyDown = (event: KeyboardEvent) => {
  if (!isVisible.value) return;

  switch (event.key) {
    case 'Escape':
      event.preventDefault();
      close();
      break;
    case 'ArrowLeft':
      event.preventDefault();
      if (canNavigate.value) previous();
      break;
    case 'ArrowRight':
      event.preventDefault();
      if (canNavigate.value) next();
      break;
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
/* Backdrop */
.quick-view-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(2px);
}

/* Quick View Window */
.quick-view-window {
  width: 80vw;
  height: 80vh;
  max-width: 1200px;
  max-height: 900px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 8px 8px 16px rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  font-family: 'Press Start 2P', 'Courier New', monospace;
}

/* Title Bar */
.quick-view-titlebar {
  background: linear-gradient(180deg, #ffffff 0%, #c0c0c0 50%, #a0a0a0 100%);
  border-bottom: 2px solid #000000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 4px;
  height: 24px;
  box-shadow: inset 1px 1px 0 #ffffff, inset -1px -1px 0 #808080;
}

.title-bar-left,
.title-bar-right {
  display: flex;
  gap: 4px;
  align-items: center;
}

.window-title {
  flex: 1;
  text-align: center;
  font-size: 10px;
  color: #000000;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 8px;
}

.navigation-info {
  font-size: 8px;
  color: #000000;
  padding: 0 8px;
}

/* Title Bar Buttons */
.title-bar-button {
  width: 18px;
  height: 18px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s;
}

.title-bar-button:hover {
  background: #b0b0b0;
}

.title-bar-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

/* Close Button */
.close-button .close-icon {
  width: 10px;
  height: 10px;
  position: relative;
}

.close-button .close-icon::before,
.close-button .close-icon::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 2px;
  background: #ff6600;
  top: 4px;
  left: -1px;
}

.close-button .close-icon::before {
  transform: rotate(45deg);
}

.close-button .close-icon::after {
  transform: rotate(-45deg);
}

/* Content Area */
.quick-view-content {
  flex: 1;
  background: #ffffff;
  overflow: auto;
  border: 2px solid #808080;
  margin: 2px;
  position: relative;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 4px solid #a0a0a0;
  border-top-color: #0055aa;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 10px;
  color: #000000;
}

/* Error State */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  padding: 32px;
}

.error-icon {
  font-size: 48px;
}

.error-text {
  font-size: 10px;
  color: #ff0000;
  text-align: center;
}

/* Content Display */
.content-display {
  height: 100%;
  overflow: auto;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 2px solid #a0a0a0;
  background: #f0f0f0;
}

.preview-header h3 {
  font-size: 12px;
  margin: 0;
  flex: 1;
}

.file-info {
  font-size: 8px;
  color: #666666;
}

.folder-icon,
.file-icon,
.awml-icon,
.tool-icon {
  width: 48px;
  height: 48px;
}

.binary-icon {
  width: 48px;
  height: 48px;
  background: #cccccc;
  border: 2px solid #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #666666;
}

/* Folder Preview */
.folder-contents {
  padding: 16px;
}

.folder-list {
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  line-height: 1.6;
  white-space: pre-wrap;
  color: #000000;
  margin: 0;
}

/* Text Preview */
.text-contents,
.awml-contents {
  padding: 16px;
}

.text-content,
.awml-content {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #000000;
  margin: 0;
}

.truncate-notice {
  margin-top: 16px;
  padding: 8px 12px;
  background: #ffaa00;
  border: 2px solid #000000;
  font-size: 8px;
  text-align: center;
}

/* Tool Preview */
.tool-info {
  padding: 16px;
}

.tool-info pre {
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  line-height: 1.6;
  white-space: pre-wrap;
  color: #000000;
  margin: 0;
}

/* Binary Preview */
.binary-info {
  padding: 32px;
  text-align: center;
}

.binary-info p {
  font-size: 10px;
  margin-bottom: 24px;
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
  max-width: 400px;
  margin: 0 auto;
  padding: 16px;
  background: #f0f0f0;
  border: 2px solid #a0a0a0;
}

.file-details div {
  font-size: 9px;
}

.file-details strong {
  color: #0055aa;
}

/* Footer / Navigation Bar */
.quick-view-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 12px;
  background: #a0a0a0;
  border-top: 2px solid #ffffff;
  box-shadow: inset 0 1px 0 #ffffff;
}

.footer-info {
  flex: 1;
  text-align: center;
  font-size: 8px;
  color: #000000;
}

.footer-info kbd {
  display: inline-block;
  padding: 2px 6px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  margin: 0 2px;
}

.nav-button {
  min-width: 100px;
}

.nav-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Scrollbar styling */
.quick-view-content::-webkit-scrollbar,
.content-display::-webkit-scrollbar {
  width: 16px;
  height: 16px;
}

.quick-view-content::-webkit-scrollbar-track,
.content-display::-webkit-scrollbar-track {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #808080 #ffffff #ffffff #808080;
}

.quick-view-content::-webkit-scrollbar-thumb,
.content-display::-webkit-scrollbar-thumb {
  background: #0055aa;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.quick-view-content::-webkit-scrollbar-thumb:hover,
.content-display::-webkit-scrollbar-thumb:hover {
  background: #0066cc;
}
</style>
