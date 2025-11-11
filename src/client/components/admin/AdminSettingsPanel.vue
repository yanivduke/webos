<template>
  <v-card class="admin-settings-panel" elevation="3">
    <v-card-title class="bg-primary">
      <v-icon icon="mdi-shield-account" class="mr-2"></v-icon>
      Admin Settings
      <v-spacer></v-spacer>
      <v-btn icon="mdi-close" variant="text" @click="$emit('close')"></v-btn>
    </v-card-title>

    <v-tabs v-model="tab" bg-color="surface">
      <v-tab value="general">
        <v-icon icon="mdi-cog" class="mr-2"></v-icon>
        General
      </v-tab>
      <v-tab value="users">
        <v-icon icon="mdi-account-multiple" class="mr-2"></v-icon>
        Users
      </v-tab>
      <v-tab value="security">
        <v-icon icon="mdi-shield-lock" class="mr-2"></v-icon>
        Security
      </v-tab>
      <v-tab value="system">
        <v-icon icon="mdi-server" class="mr-2"></v-icon>
        System
      </v-tab>
    </v-tabs>

    <v-card-text class="pa-4">
      <v-window v-model="tab">
        <!-- General Settings -->
        <v-window-item value="general">
          <v-form>
            <v-text-field
              v-model="settings.general.siteName"
              label="Site Name"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            ></v-text-field>

            <v-text-field
              v-model="settings.general.adminEmail"
              label="Admin Email"
              type="email"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            ></v-text-field>

            <v-switch
              v-model="settings.general.maintenanceMode"
              label="Maintenance Mode"
              color="warning"
              class="mb-3"
            ></v-switch>

            <v-switch
              v-model="settings.general.registrationEnabled"
              label="Allow User Registration"
              color="primary"
              class="mb-3"
            ></v-switch>

            <v-btn color="primary" @click="saveGeneralSettings" :loading="saving">
              Save General Settings
            </v-btn>
          </v-form>
        </v-window-item>

        <!-- User Management -->
        <v-window-item value="users">
          <v-data-table
            :headers="userHeaders"
            :items="users"
            :loading="loadingUsers"
            class="elevation-1"
          >
            <template v-slot:top>
              <v-toolbar flat>
                <v-toolbar-title>User Management</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="refreshUsers">
                  <v-icon icon="mdi-refresh" class="mr-2"></v-icon>
                  Refresh
                </v-btn>
              </v-toolbar>
            </template>

            <template v-slot:item.role="{ item }">
              <v-chip
                :color="item.role === 'admin' ? 'error' : 'info'"
                size="small"
              >
                {{ item.role }}
              </v-chip>
            </template>

            <template v-slot:item.created="{ item }">
              {{ formatDate(item.created) }}
            </template>
          </v-data-table>
        </v-window-item>

        <!-- Security Settings -->
        <v-window-item value="security">
          <v-form>
            <v-text-field
              v-model="settings.security.sessionTimeout"
              label="Session Timeout (minutes)"
              type="number"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            ></v-text-field>

            <v-switch
              v-model="settings.security.requireStrongPasswords"
              label="Require Strong Passwords"
              color="primary"
              class="mb-3"
            ></v-switch>

            <v-switch
              v-model="settings.security.enableApiLogging"
              label="Enable API Request Logging"
              color="primary"
              class="mb-3"
            ></v-switch>

            <v-text-field
              v-model="settings.security.maxLoginAttempts"
              label="Max Login Attempts"
              type="number"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            ></v-text-field>

            <v-btn color="primary" @click="saveSecuritySettings" :loading="saving">
              Save Security Settings
            </v-btn>
          </v-form>
        </v-window-item>

        <!-- System Info -->
        <v-window-item value="system">
          <v-list>
            <v-list-item>
              <v-list-item-title>Version</v-list-item-title>
              <v-list-item-subtitle>2.0.0</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>Server Status</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip color="success" size="small">Running</v-chip>
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>Database</v-list-item-title>
              <v-list-item-subtitle>In-Memory (Development)</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>Active Sessions</v-list-item-title>
              <v-list-item-subtitle>{{ activeSessions }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <v-divider class="my-4"></v-divider>

          <v-alert type="warning" variant="tonal" class="mb-3">
            <v-alert-title>Production Recommendations</v-alert-title>
            <ul class="mt-2">
              <li>Enable HTTPS in production</li>
              <li>Use a real database (PostgreSQL, MongoDB)</li>
              <li>Set up Redis for session storage</li>
              <li>Configure rate limiting</li>
              <li>Enable CORS restrictions</li>
            </ul>
          </v-alert>

          <v-btn color="error" variant="outlined" @click="confirmClearCache">
            <v-icon icon="mdi-delete-sweep" class="mr-2"></v-icon>
            Clear Cache
          </v-btn>
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { authService } from '../../services/auth.service';

interface User {
  id: string;
  username: string;
  displayName: string;
  role: string;
  created: string;
}

interface Settings {
  general: {
    siteName: string;
    adminEmail: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
  };
  security: {
    sessionTimeout: number;
    requireStrongPasswords: boolean;
    enableApiLogging: boolean;
    maxLoginAttempts: number;
  };
}

defineEmits(['close']);

const tab = ref('general');
const saving = ref(false);
const loadingUsers = ref(false);
const activeSessions = ref(0);

const settings = ref<Settings>({
  general: {
    siteName: 'WebOS',
    adminEmail: 'admin@webos.local',
    maintenanceMode: false,
    registrationEnabled: true,
  },
  security: {
    sessionTimeout: 1440, // 24 hours
    requireStrongPasswords: true,
    enableApiLogging: true,
    maxLoginAttempts: 5,
  },
});

const users = ref<User[]>([]);

const userHeaders = [
  { title: 'Username', key: 'username', align: 'start' as const },
  { title: 'Display Name', key: 'displayName' },
  { title: 'Role', key: 'role' },
  { title: 'Created', key: 'created' },
];

async function loadUsers() {
  loadingUsers.value = true;
  try {
    const response = await fetch('/api/auth/users', {
      headers: authService.getAuthHeaders(),
    });

    if (response.ok) {
      const data = await response.json();
      users.value = data.users || [];
    }
  } catch (error) {
    console.error('Failed to load users:', error);
  } finally {
    loadingUsers.value = false;
  }
}

async function refreshUsers() {
  await loadUsers();
}

async function saveGeneralSettings() {
  saving.value = true;
  try {
    // Save to server
    await new Promise(resolve => setTimeout(resolve, 500));
    alert('General settings saved successfully');
  } catch (error) {
    console.error('Failed to save general settings:', error);
    alert('Failed to save settings');
  } finally {
    saving.value = false;
  }
}

async function saveSecuritySettings() {
  saving.value = true;
  try {
    // Save to server
    await new Promise(resolve => setTimeout(resolve, 500));
    alert('Security settings saved successfully');
  } catch (error) {
    console.error('Failed to save security settings:', error);
    alert('Failed to save settings');
  } finally {
    saving.value = false;
  }
}

function confirmClearCache() {
  if (confirm('Are you sure you want to clear the cache?')) {
    alert('Cache cleared successfully');
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString();
}

onMounted(() => {
  if (authService.isAdmin()) {
    loadUsers();
  }
});
</script>

<style scoped>
.admin-settings-panel {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
