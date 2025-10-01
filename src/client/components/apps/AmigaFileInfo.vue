<template>
  <div class="file-info">
    <div class="info-section">
      <div class="info-title">{{ displayName }}</div>
      <div class="info-path">{{ filePath }}</div>
    </div>

    <div class="info-grid">
      <div class="label">Type</div>
      <div class="value">{{ meta.type || 'unknown' }}</div>

      <div class="label">Size</div>
      <div class="value">{{ meta.size || 'n/a' }}</div>

      <div class="label">Created</div>
      <div class="value">{{ formattedCreated }}</div>

      <div class="label">Modified</div>
      <div class="value">{{ formattedModified }}</div>
    </div>

    <div v-if="extraKeys.length" class="extra-section">
      <div class="extra-title">Metadata</div>
      <ul>
        <li v-for="key in extraKeys" :key="key">
          <strong>{{ key }}:</strong> {{ meta[key] }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface InfoProps {
  data?: {
    filePath?: string;
    meta?: Record<string, any>;
  };
}

const props = defineProps<InfoProps>();

const meta = computed(() => props.data?.meta ?? {});
const filePath = computed(() => props.data?.filePath ?? '');
const displayName = computed(() => meta.value.name || filePath.value.split('/').pop() || 'File');

const formatDate = (value?: string) => {
  if (!value) return 'n/a';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const formattedCreated = computed(() => formatDate(meta.value.created));
const formattedModified = computed(() => formatDate(meta.value.modified));

const extraKeys = computed(() => {
  const base = ['id', 'name', 'type', 'size', 'created', 'modified', 'path'];
  return Object.keys(meta.value || {})
    .filter(key => !base.includes(key) && meta.value[key] !== undefined && meta.value[key] !== null);
});
</script>

<style scoped>
.file-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  height: 100%;
  background: #ffffff;
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #f4f4f4;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 10px;
}

.info-title {
  font-size: 11px;
  color: #0055aa;
}

.info-path {
  color: #333333;
  word-break: break-all;
}

.info-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 6px 12px;
}

.label {
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #000000;
}

.value {
  color: #333333;
}

.extra-section {
  background: #f4f4f4;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 10px;
}

.extra-title {
  color: #0055aa;
  margin-bottom: 6px;
}

ul {
  list-style: square;
  padding-left: 18px;
}

li {
  margin-bottom: 4px;
  color: #000000;
}
</style>
