<template>
  <Teleport to="body">
    <div
      v-if="visible && metadata"
      class="amiga-tooltip"
      :style="{ left: `${position.x}px`, top: `${position.y}px` }"
      @click.stop
    >
      <!-- Tooltip Header -->
      <div class="tooltip-header">
        <div class="tooltip-icon">
          <svg v-if="metadata.type === 'folder'" viewBox="0 0 32 32" class="icon-svg">
            <path d="M 2 6 L 2 28 L 30 28 L 30 12 L 16 12 L 12 6 Z" fill="#ffaa00" stroke="#000" stroke-width="1.5"/>
            <path d="M 2 6 L 12 6 L 16 12 L 30 12 L 30 10 L 16 10 L 12 6 Z" fill="#ffcc44" stroke="#000" stroke-width="1"/>
          </svg>
          <svg v-else viewBox="0 0 32 32" class="icon-svg">
            <rect x="6" y="4" width="20" height="26" fill="#ffffff" stroke="#000" stroke-width="1.5"/>
            <line x1="10" y1="10" x2="22" y2="10" stroke="#0055aa" stroke-width="1.5"/>
            <line x1="10" y1="16" x2="22" y2="16" stroke="#0055aa" stroke-width="1.5"/>
            <line x1="10" y1="22" x2="18" y2="22" stroke="#0055aa" stroke-width="1.5"/>
          </svg>
        </div>
        <div class="tooltip-title">{{ metadata.name }}</div>
      </div>

      <!-- Tooltip Content -->
      <div class="tooltip-content">
        <!-- Type -->
        <div class="tooltip-row">
          <span class="label">Type:</span>
          <span class="value">
            {{ metadata.type === 'folder' ? 'Folder' : `${metadata.extension ? metadata.extension.toUpperCase() : 'File'}` }}
          </span>
        </div>

        <!-- Folder-specific info -->
        <div v-if="metadata.type === 'folder'" class="tooltip-row">
          <span class="label">Items:</span>
          <span class="value">{{ metadata.itemCount || 0 }}</span>
        </div>
        <div v-if="metadata.type === 'folder' && metadata.totalSize" class="tooltip-row">
          <span class="label">Size:</span>
          <span class="value">{{ metadata.totalSize }}</span>
        </div>

        <!-- File-specific info -->
        <div v-if="metadata.type === 'file' && metadata.size" class="tooltip-row">
          <span class="label">Size:</span>
          <span class="value">{{ metadata.size }}</span>
        </div>

        <!-- Modified date -->
        <div v-if="metadata.modified" class="tooltip-row">
          <span class="label">Modified:</span>
          <span class="value">{{ formatDate(metadata.modified) }}</span>
        </div>

        <!-- Created date -->
        <div v-if="metadata.created" class="tooltip-row">
          <span class="label">Created:</span>
          <span class="value">{{ formatDate(metadata.created) }}</span>
        </div>

        <!-- Path -->
        <div class="tooltip-row path-row">
          <span class="label">Path:</span>
          <span class="value path-value">{{ metadata.path }}</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useTooltip, type FileMetadata, type TooltipPosition } from '../composables/useTooltip';

interface Props {
  visible: boolean;
  position: TooltipPosition;
  metadata: FileMetadata | null;
}

const props = defineProps<Props>();
const { formatDate } = useTooltip();
</script>

<style scoped>
/* Authentic Amiga Tooltip Styling */
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.amiga-tooltip {
  position: fixed;
  background: var(--theme-background);
  border: 2px solid;
  border-color: var(--theme-borderLight) var(--theme-borderDark) var(--theme-borderDark) var(--theme-borderLight);
  box-shadow: inset 1px 1px 0 var(--theme-borderLight),
              inset -1px -1px 0 var(--theme-borderDark),
              4px 4px 8px var(--theme-shadow);
  z-index: 10000;
  min-width: 200px;
  max-width: 320px;
  padding: 8px;
  font-family: 'Press Start 2P', 'Courier New', monospace;
  font-size: 9px;
  transition: opacity 0.2s ease-in-out;
  animation: tooltipFadeIn 0.2s ease-in-out;
  pointer-events: all;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.tooltip-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--theme-border);
}

.tooltip-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(1px 1px 0px rgba(0, 0, 0, 0.3));
}

.tooltip-title {
  font-weight: bold;
  color: var(--theme-text);
  word-break: break-word;
  flex: 1;
  font-size: 8px;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tooltip-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: flex-start;
  padding: 2px 0;
}

.tooltip-row .label {
  color: var(--theme-highlight);
  font-weight: bold;
  flex-shrink: 0;
  font-size: 8px;
}

.tooltip-row .value {
  color: var(--theme-text);
  text-align: right;
  flex: 1;
  font-size: 8px;
  word-break: break-word;
}

.path-row {
  border-top: 1px solid var(--theme-border);
  padding-top: 4px;
  margin-top: 4px;
}

.path-value {
  font-family: 'Courier New', monospace;
  word-break: break-all;
  max-width: 200px;
  font-size: 7px;
}

/* Theme-aware styling */
:root {
  --theme-background: #a0a0a0;
  --theme-text: #000000;
  --theme-border: #808080;
  --theme-borderLight: #ffffff;
  --theme-borderDark: #000000;
  --theme-highlight: #0055aa;
  --theme-shadow: rgba(0, 0, 0, 0.4);
}
</style>
