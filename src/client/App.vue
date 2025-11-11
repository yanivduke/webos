<template>
  <AmigaDesktop />
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import AmigaDesktop from './components/AmigaDesktop.vue';
import { themeManager } from './utils/theme-manager';

// Initialize theme on app startup
onMounted(async () => {
  await themeManager.restoreThemePreference();
});
</script>

<style scoped>
</style>