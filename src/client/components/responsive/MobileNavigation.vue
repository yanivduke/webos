<template>
  <div class="mobile-navigation">
    <!-- App Bar for Mobile -->
    <v-app-bar
      v-if="isMobile"
      color="primary"
      density="compact"
      elevation="2"
    >
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>

      <v-toolbar-title>WebOS</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn icon @click="$emit('toggle-search')">
        <v-icon>mdi-magnify</v-icon>
      </v-btn>

      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="$emit('open-settings')">
            <template v-slot:prepend>
              <v-icon>mdi-cog</v-icon>
            </template>
            <v-list-item-title>Settings</v-list-item-title>
          </v-list-item>
          <v-list-item @click="$emit('open-about')">
            <template v-slot:prepend>
              <v-icon>mdi-information</v-icon>
            </template>
            <v-list-item-title>About</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      :temporary="isMobile"
      :permanent="!isMobile"
      width="280"
    >
      <v-list density="compact" nav>
        <v-list-item
          prepend-icon="mdi-harddisk"
          title="Hard Disk"
          @click="$emit('open-disk', 'df0')"
        ></v-list-item>

        <v-list-item
          prepend-icon="mdi-memory"
          title="RAM Disk"
          @click="$emit('open-disk', 'ram')"
        ></v-list-item>

        <v-divider class="my-2"></v-divider>

        <v-list-group value="Apps">
          <template v-slot:activator="{ props }">
            <v-list-item
              v-bind="props"
              prepend-icon="mdi-apps"
              title="Applications"
            ></v-list-item>
          </template>

          <v-list-item
            v-for="app in apps"
            :key="app.id"
            :title="app.name"
            :prepend-icon="app.icon"
            @click="$emit('open-app', app.id)"
          ></v-list-item>
        </v-list-group>

        <v-divider class="my-2"></v-divider>

        <v-list-group value="Tools">
          <template v-slot:activator="{ props }">
            <v-list-item
              v-bind="props"
              prepend-icon="mdi-tools"
              title="Tools"
            ></v-list-item>
          </template>

          <v-list-item
            v-for="tool in tools"
            :key="tool.id"
            :title="tool.name"
            :prepend-icon="tool.icon"
            @click="$emit('open-tool', tool.id)"
          ></v-list-item>
        </v-list-group>

        <v-divider class="my-2"></v-divider>

        <v-list-item
          prepend-icon="mdi-delete"
          title="Trash"
          @click="$emit('open-disk', 'trash')"
        ></v-list-item>
      </v-list>

      <template v-slot:append>
        <div class="pa-2">
          <v-btn
            block
            color="primary"
            prepend-icon="mdi-shield-account"
            @click="$emit('admin-login')"
          >
            Admin
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useDisplay } from 'vuetify';

defineEmits([
  'open-disk',
  'open-app',
  'open-tool',
  'toggle-search',
  'open-settings',
  'open-about',
  'admin-login',
]);

const { mobile } = useDisplay();
const isMobile = computed(() => mobile.value);

const drawer = ref(!mobile.value);

const apps = [
  { id: 'terminal', name: 'Terminal', icon: 'mdi-console' },
  { id: 'notepad', name: 'NotePad', icon: 'mdi-note-text' },
  { id: 'calculator', name: 'Calculator', icon: 'mdi-calculator' },
  { id: 'calendar', name: 'Calendar', icon: 'mdi-calendar' },
  { id: 'email', name: 'Email', icon: 'mdi-email' },
  { id: 'media', name: 'Media Player', icon: 'mdi-play-circle' },
  { id: 'paint', name: 'Paint', icon: 'mdi-palette' },
  { id: 'code', name: 'Code Editor', icon: 'mdi-code-braces' },
];

const tools = [
  { id: 'search', name: 'Search', icon: 'mdi-magnify' },
  { id: 'monitor', name: 'System Monitor', icon: 'mdi-chart-line' },
  { id: 'tasks', name: 'Task Manager', icon: 'mdi-format-list-checks' },
  { id: 'capture', name: 'Screen Capture', icon: 'mdi-camera' },
  { id: 'archiver', name: 'Archiver', icon: 'mdi-zip-box' },
];
</script>

<style scoped>
.mobile-navigation {
  height: 100%;
}
</style>
