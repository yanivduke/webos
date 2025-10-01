<template>
  <div class="legacy-wrapper">
    <component :is="legacyComponent" :data="componentData" v-bind="componentProps" />
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw } from 'vue';
import AmigaNotePad from './AmigaNotePad.vue';
import AmigaPaint from './AmigaPaint.vue';
import AmigaCalculator from './AmigaCalculator.vue';
import AmigaShell from './AmigaShell.vue';
import AmigaClock from './AmigaClock.vue';

const props = defineProps<{
  appName: string;
  data?: any;
}>();

// Map app names to legacy Vue components
const legacyComponents: Record<string, any> = {
  'NotePad': markRaw(AmigaNotePad),
  'Paint': markRaw(AmigaPaint),
  'Calculator': markRaw(AmigaCalculator),
  'Shell': markRaw(AmigaShell),
  'Clock': markRaw(AmigaClock)
};

const legacyComponent = computed(() => {
  return legacyComponents[props.appName] || null;
});

const componentData = computed(() => props.data);
const componentProps = computed(() => props.data || {});
</script>

<style scoped>
.legacy-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
