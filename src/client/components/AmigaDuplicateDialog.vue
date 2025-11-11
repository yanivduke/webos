<template>
  <div v-if="visible" class="duplicate-dialog-overlay" @click="handleOverlayClick">
    <div class="duplicate-dialog" @click.stop>
      <div class="dialog-header">
        <div class="dialog-title">File Already Exists</div>
      </div>

      <div class="dialog-content">
        <div class="dialog-icon">⚠️</div>
        <div class="dialog-message">
          A file named <strong>{{ fileName }}</strong> already exists at this location.
        </div>
        <div class="dialog-question">
          What would you like to do?
        </div>

        <div class="dialog-options">
          <button class="amiga-button option-button" @click="selectOption('overwrite')">
            <div class="button-icon">🔄</div>
            <div class="button-text">
              <div class="button-title">Overwrite</div>
              <div class="button-desc">Replace the existing file</div>
            </div>
          </button>

          <button class="amiga-button option-button" @click="selectOption('keep-both')">
            <div class="button-icon">📋</div>
            <div class="button-text">
              <div class="button-title">Keep Both</div>
              <div class="button-desc">Rename the new file</div>
            </div>
          </button>

          <button class="amiga-button option-button" @click="selectOption('skip')">
            <div class="button-icon">⏭️</div>
            <div class="button-text">
              <div class="button-title">Skip</div>
              <div class="button-desc">Don't upload this file</div>
            </div>
          </button>
        </div>

        <div class="dialog-remember">
          <label class="amiga-checkbox">
            <input type="checkbox" v-model="rememberChoice" />
            <span class="checkbox-label">Remember my choice</span>
          </label>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="amiga-button cancel-button" @click="cancel">
          Cancel All
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';

interface Props {
  visible: boolean;
  fileName: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  select: [action: 'overwrite' | 'keep-both' | 'skip', remember: boolean];
  cancel: [];
}>();

const rememberChoice = ref(false);

const selectOption = (action: 'overwrite' | 'keep-both' | 'skip') => {
  emit('select', action, rememberChoice.value);
};

const cancel = () => {
  emit('cancel');
};

const handleOverlayClick = () => {
  // Don't close on overlay click, force user to make a choice
};

// Reset remember choice when dialog opens
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    rememberChoice.value = false;
  }
});
</script>

<style scoped>
.duplicate-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100002;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.duplicate-dialog {
  background: #a0a0a0;
  border: 3px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 8px 8px 16px rgba(0, 0, 0, 0.6);
  font-family: 'Press Start 2P', monospace;
  min-width: 500px;
  max-width: 600px;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.dialog-header {
  background: #0055aa;
  color: #ffffff;
  padding: 10px 12px;
  font-size: 11px;
  font-weight: bold;
  border-bottom: 2px solid #000000;
}

.dialog-content {
  padding: 20px;
  background: #ffffff;
}

.dialog-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 15px;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.dialog-message {
  font-size: 10px;
  color: #000000;
  margin-bottom: 10px;
  text-align: center;
  line-height: 1.6;
}

.dialog-message strong {
  color: #ff6600;
}

.dialog-question {
  font-size: 9px;
  color: #666666;
  margin-bottom: 15px;
  text-align: center;
}

.dialog-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

.option-button {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  text-align: left;
  width: 100%;
  background: #d0d0d0;
  transition: all 0.1s;
}

.option-button:hover {
  background: #e0e0e0;
  border-color: #0055aa #000000 #000000 #0055aa;
}

.option-button:active {
  background: #b0b0b0;
}

.button-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.button-text {
  flex: 1;
}

.button-title {
  font-size: 9px;
  color: #000000;
  font-weight: bold;
  margin-bottom: 4px;
}

.button-desc {
  font-size: 7px;
  color: #666666;
  line-height: 1.4;
}

.dialog-remember {
  padding: 10px;
  background: #e8e8e8;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  margin-top: 10px;
}

.amiga-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.amiga-checkbox input[type="checkbox"] {
  width: 14px;
  height: 14px;
  cursor: pointer;
}

.checkbox-label {
  font-size: 8px;
  color: #000000;
}

.dialog-footer {
  padding: 10px 12px;
  background: #a0a0a0;
  border-top: 2px solid #000000;
  text-align: right;
}

.cancel-button {
  font-size: 8px;
  padding: 6px 12px;
  color: #ff0000;
}

/* Amiga button styling */
.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 12px;
  font-size: 9px;
  cursor: pointer;
  color: #000000;
  font-family: 'Press Start 2P', monospace;
  transition: all 0.1s;
}

.amiga-button:hover {
  background: #b0b0b0;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}
</style>
