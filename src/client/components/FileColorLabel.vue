<template>
  <div class="file-color-label-container">
    <!-- Color dot overlay -->
    <div
      v-if="color"
      class="color-label-dot"
      :style="{ backgroundColor: colorValue }"
      :title="`Color: ${colorName}`"
      @click.stop="toggleColorPicker"
    ></div>

    <!-- Quick color picker popup -->
    <div
      v-if="showPicker && editable"
      class="color-picker-popup"
      :style="pickerPosition"
      @click.stop
    >
      <div class="color-picker-header">
        <span class="picker-title">Color Label</span>
        <button class="picker-close" @click.stop="closePicker">×</button>
      </div>
      <div class="color-picker-grid">
        <div
          v-for="colorKey in colorKeys"
          :key="colorKey"
          class="color-option"
          :class="{ selected: color === colorKey }"
          :style="{ backgroundColor: COLOR_LABELS[colorKey] }"
          :title="formatColorName(colorKey)"
          @click.stop="selectColor(colorKey)"
        >
          <span v-if="color === colorKey" class="check-mark">✓</span>
        </div>
        <div
          class="color-option color-none"
          :class="{ selected: !color }"
          title="No Color"
          @click.stop="selectColor(null)"
        >
          <span v-if="!color" class="check-mark">✓</span>
          <span class="none-icon">∅</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { COLOR_LABELS, type ColorLabel } from '../utils/metadata-manager';

interface Props {
  color: ColorLabel;
  editable?: boolean;
  size?: number; // Size of the color dot in pixels
}

const props = withDefaults(defineProps<Props>(), {
  editable: false,
  size: 12,
});

interface Emits {
  (e: 'update:color', color: ColorLabel): void;
}

const emit = defineEmits<Emits>();

const showPicker = ref(false);
const pickerPosition = ref({});

const colorKeys = Object.keys(COLOR_LABELS) as Array<keyof typeof COLOR_LABELS>;

const colorValue = computed(() => {
  if (!props.color) return 'transparent';
  return COLOR_LABELS[props.color];
});

const colorName = computed(() => {
  if (!props.color) return 'None';
  return formatColorName(props.color);
});

function formatColorName(colorKey: string): string {
  return colorKey.charAt(0).toUpperCase() + colorKey.slice(1);
}

function toggleColorPicker(event: MouseEvent): void {
  if (!props.editable) return;

  showPicker.value = !showPicker.value;

  if (showPicker.value) {
    // Position the picker near the click
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    pickerPosition.value = {
      position: 'fixed',
      top: `${rect.bottom + 5}px`,
      left: `${rect.left}px`,
      zIndex: 10000,
    };
  }
}

function closePicker(): void {
  showPicker.value = false;
}

function selectColor(color: ColorLabel): void {
  emit('update:color', color);
  closePicker();
}

// Close picker when clicking outside
function handleClickOutside(event: MouseEvent): void {
  if (showPicker.value) {
    const target = event.target as HTMLElement;
    if (!target.closest('.color-picker-popup') && !target.closest('.color-label-dot')) {
      closePicker();
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.file-color-label-container {
  position: relative;
  display: inline-block;
}

.color-label-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: transform 0.1s;
  position: relative;
  z-index: 1;
}

.color-label-dot:hover {
  transform: scale(1.2);
}

.color-label-dot:active {
  transform: scale(1.1);
  border-color: #000000 #ffffff #ffffff #000000;
}

/* Color Picker Popup */
.color-picker-popup {
  background: #a0a0a0;
  border: 3px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 3px 3px 0px rgba(0, 0, 0, 0.5);
  padding: 4px;
  min-width: 180px;
}

.color-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 6px;
  background: #0055aa;
  color: #ffffff;
  margin-bottom: 6px;
  border: 1px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.picker-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  text-transform: uppercase;
}

.picker-close {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  color: #000000;
  font-size: 16px;
  font-weight: bold;
  line-height: 1;
  padding: 0 4px;
  cursor: pointer;
  font-family: monospace;
}

.picker-close:hover {
  background: #888888;
}

.picker-close:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #707070;
}

.color-picker-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  padding: 6px;
}

.color-option {
  width: 36px;
  height: 36px;
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
  border-width: 4px;
}

.color-option:active {
  border-color: #000000 #ffffff #ffffff #000000;
}

.color-option.selected {
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

.none-icon {
  font-size: 20px;
  color: #000000;
  font-weight: bold;
}

.check-mark {
  color: #ffffff;
  font-size: 18px;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  position: absolute;
}

/* Animations */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.color-label-dot.pulse {
  animation: pulse 0.5s ease-in-out;
}
</style>
