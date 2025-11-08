<template>
  <div class="workspace-switcher">
    <div class="workspace-grid">
      <div
        v-for="desktop in desktops"
        :key="desktop.id"
        class="workspace-thumbnail"
        :class="{
          active: desktop.id === currentDesktopId,
          'has-windows': getWindowCount(desktop.id) > 0
        }"
        @click="switchWorkspace(desktop.id)"
        :title="`${desktop.name} (${getWindowCount(desktop.id)} windows)`"
      >
        <!-- Desktop preview -->
        <div class="thumbnail-preview" :style="{ background: getThumbnailBackground(desktop) }">
          <!-- Show mini windows -->
          <div
            v-for="(window, index) in desktop.windows.slice(0, 3)"
            :key="window.id"
            class="mini-window"
            :style="{
              left: `${10 + index * 8}%`,
              top: `${20 + index * 10}%`,
              width: '50%',
              height: '40%'
            }"
          ></div>
        </div>

        <!-- Desktop label -->
        <div class="thumbnail-label">
          <div class="desktop-name">{{ desktop.name }}</div>
          <div class="window-count">{{ getWindowCount(desktop.id) }} win</div>
        </div>

        <!-- Active indicator -->
        <div v-if="desktop.id === currentDesktopId" class="active-indicator">●</div>
      </div>
    </div>

    <!-- Keyboard shortcuts hint -->
    <div class="shortcuts-hint">
      Ctrl+1/2/3/4 to switch
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useVirtualDesktops } from '../../composables/useVirtualDesktops';
import { useBackdrop } from '../../composables/useBackdrop';
import type { VirtualDesktop } from '../../composables/useVirtualDesktops';

const {
  workspaceState,
  switchToDesktop,
  getAllDesktops,
  getWindowCount
} = useVirtualDesktops();

const { setSettings } = useBackdrop();

const desktops = computed(() => getAllDesktops());
const currentDesktopId = computed(() => workspaceState.value.currentDesktopId);

const switchWorkspace = (desktopId: number) => {
  const success = switchToDesktop(desktopId);
  if (success) {
    // Update backdrop when switching desktops
    const desktop = desktops.value.find(d => d.id === desktopId);
    if (desktop) {
      setSettings(desktop.backdrop);
    }
  }
};

// Get background style for thumbnail preview
const getThumbnailBackground = (desktop: VirtualDesktop): string => {
  return desktop.backdrop.color || '#a0a0a0';
};
</script>

<style scoped>
.workspace-switcher {
  padding: 8px;
  min-width: 200px;
}

.workspace-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 8px;
  margin-bottom: 8px;
}

.workspace-thumbnail {
  position: relative;
  aspect-ratio: 4 / 3;
  border: 2px solid;
  border-color: var(--theme-borderLight) var(--theme-borderDark) var(--theme-borderDark) var(--theme-borderLight);
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s ease;
  background: var(--theme-border);
}

.workspace-thumbnail:hover {
  border-color: var(--theme-highlight);
  box-shadow: 0 0 6px var(--theme-highlight);
}

.workspace-thumbnail.active {
  border: 3px solid var(--theme-highlight);
  box-shadow: 0 0 8px var(--theme-highlight);
}

.workspace-thumbnail.active:hover {
  box-shadow: 0 0 10px var(--theme-highlight);
}

.thumbnail-preview {
  position: relative;
  width: 100%;
  height: calc(100% - 20px);
  background: #a0a0a0;
  overflow: hidden;
}

.mini-window {
  position: absolute;
  background: var(--theme-background);
  border: 1px solid var(--theme-borderDark);
  box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.mini-window::before {
  content: '';
  display: block;
  height: 3px;
  background: var(--theme-highlight);
  border-bottom: 1px solid var(--theme-borderDark);
}

.thumbnail-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--theme-borderDark);
  color: var(--theme-text);
  padding: 2px 4px;
  font-size: 7px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--theme-border);
}

.desktop-name {
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.window-count {
  margin-left: 4px;
  opacity: 0.8;
  white-space: nowrap;
}

.active-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  color: var(--theme-highlight);
  font-size: 14px;
  text-shadow: 0 0 4px var(--theme-highlight);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

.shortcuts-hint {
  text-align: center;
  font-size: 7px;
  color: var(--theme-border);
  padding: 4px;
  border-top: 1px solid var(--theme-border);
  margin-top: 4px;
}

/* Transition effects */
.workspace-thumbnail {
  transform-origin: center;
}

.workspace-thumbnail:active {
  transform: scale(0.95);
}
</style>
