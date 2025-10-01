<template>
  <div class="awml-wizard">
    <div class="wizard-header">
      <div class="title">Install AWML Module</div>
      <div class="subtitle">{{ descriptor?.metadata.name || filename }}</div>
    </div>

    <div v-if="step === 'intro'" class="wizard-section">
      <p>This module requires configuration before it can run. Review the details below and click “Next” to provide values.</p>
      <ul class="summary">
        <li><strong>Module:</strong> {{ descriptor?.modulePath }}</li>
        <li><strong>Entry:</strong> {{ descriptor?.entry }}</li>
        <li><strong>Version:</strong> {{ descriptor?.metadata.version || 'n/a' }}</li>
      </ul>
      <div class="wizard-actions">
        <button class="amiga-button" @click="closeWizard">Cancel</button>
        <button class="amiga-button primary" @click="step = 'form'">Next</button>
      </div>
    </div>

    <div v-else-if="step === 'form'" class="wizard-section">
      <div v-if="configKeys.length === 0" class="empty-state">
        This module does not define any settings.
      </div>
      <div v-else class="form-grid">
        <label v-for="key in configKeys" :key="key">
          <span>{{ key }}</span>
          <input
            v-model="formState[key]"
            type="text"
            class="amiga-input"
            :placeholder="descriptor?.config[key] || ''"
          />
        </label>
      </div>
      <div class="wizard-actions">
        <button class="amiga-button" @click="step = 'intro'">Back</button>
        <button class="amiga-button primary" @click="step = 'review'">Next</button>
      </div>
    </div>

    <div v-else class="wizard-section">
      <p>Review the settings below. Click “Install” to save and launch the module.</p>
      <ul class="summary">
        <li v-for="key in configKeys" :key="key"><strong>{{ key }}:</strong> {{ formState[key] || descriptor?.config[key] || '(empty)' }}</li>
      </ul>
      <div class="wizard-actions">
        <button class="amiga-button" @click="step = 'form'">Back</button>
        <button class="amiga-button primary" @click="installModule">Install</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';
import type { AwmlDescriptor } from '@/sdk/awml';

interface WizardProps {
  descriptor: AwmlDescriptor | null;
  filename: string;
}

const props = defineProps<WizardProps>();
const emit = defineEmits<{
  complete: [config: Record<string, string>];
  cancel: [];
}>();

const step = ref<'intro' | 'form' | 'review'>('intro');
const formState = reactive<Record<string, string>>({});

const configKeys = computed(() => Object.keys(props.descriptor?.config || {}));
const descriptor = computed(() => props.descriptor);
const filename = computed(() => props.filename);

watch(descriptor, (value) => {
  if (!value) return;
  Object.keys(formState).forEach((key) => delete formState[key]);
  Object.entries(value.config).forEach(([key, val]) => {
    formState[key] = val;
  });
});

const closeWizard = () => emit('cancel');

const installModule = () => {
  const config: Record<string, string> = {};
  configKeys.value.forEach((key) => {
    const trimmed = (formState[key] || '').trim();
    if (trimmed) {
      config[key] = trimmed;
    }
  });
  emit('complete', config);
};
</script>

<style scoped>
.awml-wizard {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  padding: 14px;
  background: #ffffff;
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
}

.wizard-header .title {
  color: #0055aa;
  font-size: 12px;
}

.wizard-header .subtitle {
  color: #333333;
  margin-top: 4px;
}

.wizard-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #f4f4f4;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 12px;
}

.summary {
  list-style: square;
  padding-left: 18px;
  color: #000000;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #000000;
}

.amiga-input {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 6px 8px;
  font-family: inherit;
  font-size: 9px;
}

.empty-state {
  color: #555555;
  text-align: center;
  margin-top: 24px;
}

.wizard-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: auto;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 14px;
  cursor: pointer;
}

.amiga-button.primary {
  background: #0055aa;
  color: #ffffff;
}

.amiga-button:hover {
  background: #b0b0b0;
}

.amiga-button.primary:hover {
  background: #0066d0;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
}
</style>
