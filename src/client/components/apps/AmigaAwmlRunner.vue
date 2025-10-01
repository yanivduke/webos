<template>
  <div class="awml-runner">
    <div class="runner-header">
      <div>
        <div class="title">{{ descriptor?.metadata.name || filename }}</div>
        <div class="subtitle">{{ descriptor?.modulePath || 'Module not loaded' }}</div>
      </div>
      <button class="amiga-button" :disabled="isRunning" @click="handleRun">{{ isRunning ? 'Running…' : 'Run Again' }}</button>
    </div>

    <div class="runner-status">Status: {{ statusMessage }}</div>

    <div class="runner-details" v-if="descriptor">
      <div><strong>Entry:</strong> {{ descriptor.entry }}</div>
      <div><strong>Version:</strong> {{ descriptor.metadata.version || 'n/a' }}</div>
      <div><strong>Author:</strong> {{ descriptor.metadata.author || 'n/a' }}</div>
      <div><strong>Description:</strong> {{ descriptor.metadata.description || 'n/a' }}</div>
      <div v-if="Object.keys(visibleConfig).length" class="config-list">
        <div class="config-heading">Configuration</div>
        <ul>
          <li v-for="(value, key) in visibleConfig" :key="key">
            <strong>{{ key }}:</strong> {{ value }}
          </li>
        </ul>
      </div>
    </div>

    <div class="runner-logs">
      <div class="logs-title">Runtime Log</div>
      <div v-if="logs.length === 0" class="log-line placeholder">No output yet.</div>
      <div v-for="(line, index) in logs" :key="index" class="log-line">{{ line }}</div>
    </div>

    <div v-if="errorMessage" class="runner-error">{{ errorMessage }}</div>

    <AmigaAwmlWizard
      v-if="showWizard && descriptor"
      class="wizard-overlay"
      :descriptor="descriptor"
      :filename="filename"
      @complete="finaliseConfig"
      @cancel="cancelWizard"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { executeAwml, loadAwmlDescriptor, type AwmlDescriptor } from '@/sdk/awml';
import AmigaAwmlWizard from './AmigaAwmlWizard.vue';
import { fetchAwmlModule, saveAwmlModule } from '@/services/awmlService';

interface RunnerProps {
  data?: {
    filePath?: string;
    meta?: Record<string, any>;
  };
}

const props = defineProps<RunnerProps>();

const descriptor = ref<AwmlDescriptor | null>(null);
const logs = ref<string[]>([]);
const statusMessage = ref('Idle');
const errorMessage = ref('');
const isRunning = ref(false);
const showWizard = ref(false);
const activeConfig = ref<Record<string, string>>({});
const hasLoadedConfig = ref(false);
const visibleConfig = computed(() => {
  if (Object.keys(activeConfig.value).length) {
    return activeConfig.value;
  }
  return descriptor.value?.config || {};
});

const filename = computed(() => props.data?.meta?.name || props.data?.filePath || 'AWML Program');
const configKeys = computed(() => (descriptor.value ? Object.keys(descriptor.value.config) : []));

const ensureDescriptor = async () => {
  const filePath = props.data?.filePath;
  if (!filePath) {
    throw new Error('AWML file path missing');
  }

  if (!descriptor.value) {
    descriptor.value = await loadAwmlDescriptor(filePath);
  }

  if (!hasLoadedConfig.value) {
    try {
      const saved = await fetchAwmlModule(filePath);
      if (saved?.config) {
        activeConfig.value = { ...saved.config };
      }
    } catch (error) {
      console.error('Failed to load AWML config', error);
    } finally {
      hasLoadedConfig.value = true;
    }
  }
};

const handleRun = async () => {
  try {
    await ensureDescriptor();
  } catch (error) {
    errorMessage.value = (error as Error).message;
    return;
  }

  if (descriptor.value && requiresWizard(descriptor.value) && Object.keys(activeConfig.value).length === 0) {
    showWizard.value = true;
    return;
  }
  await runWithConfig();
};

const requiresWizard = (desc: AwmlDescriptor) => Object.keys(desc.config).length > 0;

const runWithConfig = async () => {
  if (isRunning.value) return;
  const filePath = props.data?.filePath;
  if (!filePath) {
    errorMessage.value = 'No AWML file path provided.';
    return;
  }

  try {
    isRunning.value = true;
    errorMessage.value = '';
    logs.value = [];
    statusMessage.value = 'Loading descriptor…';

    if (!descriptor.value) {
      await ensureDescriptor();
    }

    if (Object.keys(activeConfig.value).length) {
      descriptor.value = {
        ...descriptor.value,
        config: {
          ...descriptor.value.config,
          ...activeConfig.value
        }
      };
    }

    statusMessage.value = 'Executing…';
    await executeAwml(descriptor.value, {
      onLog: (message) => {
        logs.value.push(message);
      },
      onStatus: (message) => {
        statusMessage.value = message;
      }
    });
    statusMessage.value = 'Execution completed';
  } catch (error) {
    const message = (error as Error).message || 'Unknown error';
    errorMessage.value = message;
    statusMessage.value = 'Execution failed';
  } finally {
    isRunning.value = false;
  }
};

onMounted(() => {
  handleRun();
});

const finaliseConfig = async (config: Record<string, string>) => {
  activeConfig.value = config;
  showWizard.value = false;
  const filePath = props.data?.filePath;
  if (filePath && descriptor.value) {
    try {
      await saveAwmlModule({
        filePath,
        modulePath: descriptor.value.modulePath,
        entry: descriptor.value.entry,
        metadata: descriptor.value.metadata,
        config
      });
    } catch (error) {
      console.error('Failed to persist AWML config', error);
    }
  }
  await runWithConfig();
};

const cancelWizard = () => {
  showWizard.value = false;
};
</script>

<style scoped>
.awml-runner {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  background: #ffffff;
  padding: 12px;
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  position: relative;
}

.runner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 12px;
  color: #0055aa;
}

.subtitle {
  font-size: 9px;
  color: #333333;
  word-break: break-all;
}

.runner-status {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px;
  color: #000000;
}

.runner-details {
  background: #f4f4f4;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.config-list ul {
  margin: 4px 0 0;
  padding-left: 16px;
  list-style-type: square;
}

.config-heading {
  text-transform: uppercase;
  letter-spacing: 1px;
}

.runner-logs {
  flex: 1;
  background: #000000;
  border: 3px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 8px;
  color: #00ff00;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.logs-title {
  color: #ffaa00;
  margin-bottom: 4px;
}

.log-line {
  font-size: 9px;
  white-space: pre-wrap;
  word-break: break-word;
}

.log-line.placeholder {
  color: #888888;
}

.runner-error {
  color: #ff0000;
  background: #fff0f0;
  border: 2px solid #ff0000;
  padding: 6px;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 10px;
  font-size: 9px;
  cursor: pointer;
}

.amiga-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.amiga-button:not(:disabled):hover {
  background: #b8b8b8;
}

.amiga-button:not(:disabled):active {
  border-color: #000000 #ffffff #ffffff #000000;
}
.wizard-overlay {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  bottom: 20px;
  background: rgba(160, 160, 160, 0.95);
  border: 4px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  z-index: 10;
  padding: 8px;
}
</style>
