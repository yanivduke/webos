<template>
  <AmigaDesktop />
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import AmigaDesktop from './components/AmigaDesktop.vue';
import { useTheme } from './composables/useTheme';

const { initializeTheme } = useTheme();

// Initialize theme system on app mount
onMounted(async () => {
  await initializeTheme();
});
</script>

<style scoped>
</style>