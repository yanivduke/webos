<template>
  <div class="dialog-overlay" @click.self="cancel">
    <div class="amiga-dialog effects-dialog">
      <!-- Title Bar -->
      <div class="dialog-titlebar">
        <div class="dialog-title">Image Effects</div>
        <div class="dialog-close" @click="cancel">×</div>
      </div>

      <!-- Content -->
      <div class="dialog-content">
        <!-- Effect Categories -->
        <div class="effect-categories">
          <button
            v-for="category in categories"
            :key="category.id"
            :class="['category-button', { active: selectedCategory === category.id }]"
            @click="selectedCategory = category.id"
          >
            {{ category.name }}
          </button>
        </div>

        <!-- Effects List -->
        <div class="effects-list">
          <div
            v-for="effect in currentEffects"
            :key="effect.id"
            :class="['effect-item', { selected: selectedEffect === effect.id }]"
            @click="selectEffect(effect.id)"
          >
            <div class="effect-name">{{ effect.name }}</div>
            <div class="effect-description">{{ effect.description }}</div>
          </div>
        </div>

        <!-- Effect Parameters -->
        <div v-if="selectedEffect" class="effect-parameters">
          <div class="parameters-title">Parameters:</div>

          <!-- Brightness/Contrast -->
          <div v-if="selectedEffect === 'brightness'" class="parameter-control">
            <label>Brightness</label>
            <input
              type="range"
              v-model.number="brightness"
              min="-100"
              max="100"
              class="amiga-range"
            />
            <span>{{ brightness }}</span>
          </div>

          <div v-if="selectedEffect === 'contrast'" class="parameter-control">
            <label>Contrast</label>
            <input
              type="range"
              v-model.number="contrast"
              min="-100"
              max="100"
              class="amiga-range"
            />
            <span>{{ contrast }}</span>
          </div>

          <!-- Blur -->
          <div v-if="selectedEffect === 'blur'" class="parameter-control">
            <label>Radius</label>
            <input
              type="range"
              v-model.number="blurRadius"
              min="1"
              max="10"
              class="amiga-range"
            />
            <span>{{ blurRadius }}px</span>
          </div>

          <!-- Pixelate -->
          <div v-if="selectedEffect === 'pixelate'" class="parameter-control">
            <label>Block Size</label>
            <input
              type="range"
              v-model.number="pixelateSize"
              min="2"
              max="32"
              class="amiga-range"
            />
            <span>{{ pixelateSize }}px</span>
          </div>

          <!-- Rotate -->
          <div v-if="selectedEffect === 'rotate'" class="parameter-control">
            <label>Angle</label>
            <div class="rotate-buttons">
              <button class="amiga-button small" @click="rotateAngle = 90">90°</button>
              <button class="amiga-button small" @click="rotateAngle = 180">180°</button>
              <button class="amiga-button small" @click="rotateAngle = 270">270°</button>
              <button class="amiga-button small" @click="rotateAngle = -90">-90°</button>
            </div>
            <input
              type="range"
              v-model.number="rotateAngle"
              min="-360"
              max="360"
              class="amiga-range"
            />
            <span>{{ rotateAngle }}°</span>
          </div>

          <!-- Effects with no parameters just show info -->
          <div v-if="noParameterEffects.includes(selectedEffect)" class="parameter-info">
            Click "Apply" to apply this effect.
          </div>
        </div>

        <!-- Preview -->
        <div class="preview-section">
          <div class="preview-label">Preview:</div>
          <div class="preview-note">
            Effect will be applied to selected layer
          </div>
        </div>
      </div>

      <!-- Buttons -->
      <div class="dialog-buttons">
        <button class="amiga-button" @click="apply">Apply</button>
        <button class="amiga-button" @click="cancel">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface EffectConfig {
  effect: string;
  parameters: Record<string, number>;
}

const emit = defineEmits<{
  apply: [config: EffectConfig];
  cancel: [];
}>();

// Categories
const categories = [
  { id: 'color', name: 'Color' },
  { id: 'filter', name: 'Filter' },
  { id: 'transform', name: 'Transform' },
  { id: 'special', name: 'Special' }
];

// Effects by category
const effects = {
  color: [
    { id: 'brightness', name: 'Brightness', description: 'Adjust image brightness' },
    { id: 'contrast', name: 'Contrast', description: 'Adjust image contrast' },
    { id: 'invert', name: 'Invert', description: 'Invert colors' },
    { id: 'grayscale', name: 'Grayscale', description: 'Convert to grayscale' },
    { id: 'sepia', name: 'Sepia', description: 'Apply sepia tone' }
  ],
  filter: [
    { id: 'blur', name: 'Blur', description: 'Blur the image' },
    { id: 'sharpen', name: 'Sharpen', description: 'Sharpen the image' },
    { id: 'pixelate', name: 'Pixelate', description: 'Pixelate effect' }
  ],
  transform: [
    { id: 'rotate', name: 'Rotate', description: 'Rotate the image' },
    { id: 'flip-h', name: 'Flip Horizontal', description: 'Flip horizontally' },
    { id: 'flip-v', name: 'Flip Vertical', description: 'Flip vertically' }
  ],
  special: [
    { id: 'dither', name: 'Dither', description: 'Apply dithering' }
  ]
};

// State
const selectedCategory = ref('color');
const selectedEffect = ref<string | null>('brightness');

// Effect parameters
const brightness = ref(0);
const contrast = ref(0);
const blurRadius = ref(2);
const pixelateSize = ref(8);
const rotateAngle = ref(90);

// Effects that don't need parameters
const noParameterEffects = ['invert', 'grayscale', 'sepia', 'sharpen', 'flip-h', 'flip-v', 'dither'];

// Computed
const currentEffects = computed(() => {
  return effects[selectedCategory.value as keyof typeof effects] || [];
});

// Methods
function selectEffect(effectId: string) {
  selectedEffect.value = effectId;
}

function apply() {
  if (!selectedEffect.value) return;

  const parameters: Record<string, number> = {};

  // Build parameters based on effect
  switch (selectedEffect.value) {
    case 'brightness':
      parameters.value = brightness.value;
      break;
    case 'contrast':
      parameters.value = contrast.value;
      break;
    case 'blur':
      parameters.radius = blurRadius.value;
      break;
    case 'pixelate':
      parameters.blockSize = pixelateSize.value;
      break;
    case 'rotate':
      parameters.angle = rotateAngle.value;
      break;
  }

  emit('apply', {
    effect: selectedEffect.value,
    parameters
  });
}

function cancel() {
  emit('cancel');
}
</script>

<style scoped>
.dialog-overlay {
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

.amiga-dialog {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  font-family: 'Press Start 2P', monospace;
}

.dialog-titlebar {
  background: #0055aa;
  color: #ffffff;
  padding: 4px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #000000;
}

.dialog-title {
  font-size: 10px;
}

.dialog-close {
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0 4px;
}

.dialog-close:hover {
  background: #0077dd;
}

.dialog-content {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}

.effect-categories {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
}

.category-button {
  flex: 1;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 8px;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  cursor: pointer;
}

.category-button:hover {
  background: #b0b0b0;
}

.category-button.active {
  background: #0055aa;
  color: #ffffff;
  border-color: #000000 #ffffff #ffffff #000000;
}

.effects-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
  max-height: 200px;
  overflow-y: auto;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 8px;
  background: #888888;
}

.effect-item {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 8px;
  cursor: pointer;
}

.effect-item:hover {
  background: #b0b0b0;
}

.effect-item.selected {
  background: #0055aa;
  color: #ffffff;
  border-color: #000000 #ffffff #ffffff #000000;
}

.effect-name {
  font-size: 8px;
  font-weight: bold;
  margin-bottom: 4px;
}

.effect-description {
  font-size: 7px;
  opacity: 0.8;
}

.effect-parameters {
  background: #888888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 12px;
  margin-bottom: 16px;
}

.parameters-title {
  font-size: 8px;
  font-weight: bold;
  margin-bottom: 12px;
}

.parameter-control {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.parameter-control:last-child {
  margin-bottom: 0;
}

.parameter-control label {
  font-size: 8px;
  min-width: 80px;
}

.parameter-control span {
  font-size: 8px;
  min-width: 50px;
  text-align: right;
}

.amiga-range {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  height: 16px;
}

.amiga-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 20px;
  background: #0055aa;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
}

.amiga-range::-moz-range-thumb {
  width: 12px;
  height: 20px;
  background: #0055aa;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
}

.rotate-buttons {
  display: flex;
  gap: 4px;
}

.amiga-button.small {
  padding: 4px 8px;
  min-width: 0;
}

.parameter-info {
  font-size: 8px;
  color: #333333;
  padding: 8px;
  background: #999999;
  border: 1px solid #777777;
}

.preview-section {
  background: #888888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 12px;
}

.preview-label {
  font-size: 8px;
  font-weight: bold;
  margin-bottom: 8px;
}

.preview-note {
  font-size: 7px;
  color: #333333;
}

.dialog-buttons {
  display: flex;
  gap: 8px;
  padding: 8px 16px 16px;
  justify-content: flex-end;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 16px;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  cursor: pointer;
  min-width: 80px;
}

.amiga-button:hover {
  background: #b0b0b0;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}
</style>
