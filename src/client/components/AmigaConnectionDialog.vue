<template>
  <div class="connection-dialog-overlay" @click.self="$emit('close')">
    <div class="connection-dialog">
      <div class="dialog-header">
        <span class="dialog-title">New Network Connection</span>
        <button class="close-button" @click="$emit('close')">✕</button>
      </div>

      <div class="dialog-content">
        <!-- Recent connections -->
        <div v-if="recentConnections.length > 0" class="recent-connections">
          <label class="form-label">Recent Connections</label>
          <select
            v-model="selectedRecent"
            @change="loadRecentConnection"
            class="amiga-select"
          >
            <option value="">-- Select a recent connection --</option>
            <option
              v-for="conn in recentConnections"
              :key="conn.connection.id"
              :value="conn.connection.id"
            >
              {{ conn.connection.protocol.toUpperCase() }} - {{ conn.connection.host }}:{{ conn.connection.port }}
            </option>
          </select>
        </div>

        <!-- Connection form -->
        <div class="connection-form">
          <div class="form-row">
            <label class="form-label">Protocol</label>
            <select v-model="formData.protocol" class="amiga-select" @change="onProtocolChange">
              <option value="ftp">FTP</option>
              <option value="sftp">SFTP</option>
              <option value="webdav">WebDAV</option>
              <option value="http">HTTP/HTTPS</option>
            </select>
          </div>

          <div class="form-row">
            <label class="form-label">Host</label>
            <input
              v-model="formData.host"
              type="text"
              class="amiga-input"
              placeholder="example.com"
              required
            />
          </div>

          <div class="form-row">
            <label class="form-label">Port</label>
            <input
              v-model.number="formData.port"
              type="number"
              class="amiga-input"
              min="1"
              max="65535"
            />
          </div>

          <div v-if="formData.protocol !== 'http'" class="form-row">
            <label class="form-label">Username</label>
            <input
              v-model="formData.username"
              type="text"
              class="amiga-input"
              placeholder="username"
            />
          </div>

          <div v-if="formData.protocol !== 'http'" class="form-row">
            <label class="form-label">Password</label>
            <input
              v-model="formData.password"
              type="password"
              class="amiga-input"
              placeholder="password"
            />
          </div>

          <div class="form-row">
            <label class="form-label">Remote Path</label>
            <input
              v-model="formData.path"
              type="text"
              class="amiga-input"
              placeholder="/"
            />
          </div>

          <div class="form-row checkbox-row">
            <label>
              <input v-model="saveAsBookmark" type="checkbox" />
              Save as Bookmark
            </label>
          </div>

          <div v-if="saveAsBookmark" class="form-row">
            <label class="form-label">Bookmark Name</label>
            <input
              v-model="bookmarkName"
              type="text"
              class="amiga-input"
              placeholder="My Server"
            />
          </div>

          <div v-if="saveAsBookmark" class="form-row checkbox-row">
            <label>
              <input v-model="markAsFavorite" type="checkbox" />
              Mark as Favorite
            </label>
          </div>
        </div>

        <!-- Security warning -->
        <div
          v-if="formData.protocol === 'ftp' || (formData.protocol === 'http' && !formData.host.startsWith('https://'))"
          class="security-warning"
        >
          ⚠️ Warning: This connection is not encrypted. Your credentials and data will be transmitted in plain text.
        </div>

        <!-- Test result -->
        <div v-if="testResult" class="test-result" :class="{ success: testResult.success, error: !testResult.success }">
          {{ testResult.message }}
        </div>
      </div>

      <div class="dialog-footer">
        <button class="amiga-button" @click="testConnection" :disabled="!isFormValid || testing">
          {{ testing ? 'Testing...' : 'Test Connection' }}
        </button>
        <button class="amiga-button" @click="connect" :disabled="!isFormValid || connecting">
          {{ connecting ? 'Connecting...' : 'Connect' }}
        </button>
        <button class="amiga-button" @click="$emit('close')">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import networkBrowser, { type NetworkConnection, type NetworkProtocol } from '../utils/network-browser';

const emit = defineEmits<{
  close: [];
  connect: [connection: NetworkConnection];
}>();

const formData = ref<NetworkConnection>({
  id: `conn-${Date.now()}`,
  protocol: 'ftp' as NetworkProtocol,
  host: '',
  port: 21,
  username: '',
  password: '',
  path: '/'
});

const selectedRecent = ref('');
const saveAsBookmark = ref(false);
const bookmarkName = ref('');
const markAsFavorite = ref(false);
const testing = ref(false);
const connecting = ref(false);
const testResult = ref<{ success: boolean; message: string } | null>(null);

const recentConnections = ref(networkBrowser.getConnectionHistory().slice(0, 5));

const isFormValid = computed(() => {
  return formData.value.host.trim().length > 0 && formData.value.port > 0 && formData.value.port <= 65535;
});

const onProtocolChange = () => {
  formData.value.port = networkBrowser.getDefaultPort(formData.value.protocol);
  testResult.value = null;
};

const loadRecentConnection = () => {
  const recent = recentConnections.value.find(c => c.connection.id === selectedRecent.value);
  if (recent) {
    formData.value = {
      ...recent.connection,
      id: `conn-${Date.now()}`,
      password: '' // Don't auto-fill password for security
    };
  }
};

const testConnection = async () => {
  if (!isFormValid.value) return;

  testing.value = true;
  testResult.value = null;

  try {
    const result = await networkBrowser.testConnection(formData.value);
    testResult.value = result;
  } catch (error) {
    testResult.value = {
      success: false,
      message: `Test failed: ${error}`
    };
  } finally {
    testing.value = false;
  }
};

const connect = async () => {
  if (!isFormValid.value) return;

  connecting.value = true;

  try {
    const result = await networkBrowser.connect(formData.value);

    if (result.success) {
      // Save as bookmark if requested
      if (saveAsBookmark.value) {
        const name = bookmarkName.value.trim() || `${formData.value.host}:${formData.value.port}`;
        networkBrowser.addBookmark(formData.value, name, markAsFavorite.value);
      }

      emit('connect', formData.value);
      emit('close');
    } else {
      testResult.value = result;
    }
  } catch (error) {
    testResult.value = {
      success: false,
      message: `Connection failed: ${error}`
    };
  } finally {
    connecting.value = false;
  }
};

onMounted(() => {
  // Focus on host input
  setTimeout(() => {
    const hostInput = document.querySelector('.connection-dialog input[type="text"]') as HTMLInputElement;
    if (hostInput) {
      hostInput.focus();
    }
  }, 100);
});
</script>

<style scoped>
.connection-dialog-overlay {
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
  font-family: 'Press Start 2P', monospace;
}

.connection-dialog {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.4);
  min-width: 500px;
  max-width: 600px;
}

.dialog-header {
  background: #0055aa;
  color: #ffffff;
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #000000;
}

.dialog-title {
  font-size: 11px;
  font-weight: bold;
}

.close-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
}

.close-button:hover {
  background: #b0b0b0;
}

.close-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.dialog-content {
  padding: 16px;
  max-height: 60vh;
  overflow-y: auto;
}

.recent-connections {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.connection-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-row.checkbox-row {
  flex-direction: row;
  align-items: center;
}

.form-row.checkbox-row label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.form-label {
  font-size: 9px;
  color: #000000;
  font-weight: bold;
}

.amiga-input,
.amiga-select {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 6px 8px;
  font-size: 10px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
}

.amiga-input:focus,
.amiga-select:focus {
  outline: none;
  border-color: #0055aa #0055aa #0055aa #0055aa;
}

.amiga-select {
  cursor: pointer;
}

input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.security-warning {
  margin-top: 12px;
  padding: 8px;
  background: #ffcc00;
  border: 2px solid;
  border-color: #ffaa00;
  color: #000000;
  font-size: 8px;
  line-height: 1.4;
}

.test-result {
  margin-top: 12px;
  padding: 8px;
  border: 2px solid;
  font-size: 9px;
}

.test-result.success {
  background: #ccffcc;
  border-color: #00aa00;
  color: #006600;
}

.test-result.error {
  background: #ffcccc;
  border-color: #ff0000;
  color: #cc0000;
}

.dialog-footer {
  padding: 12px 16px;
  border-top: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 16px;
  font-size: 9px;
  cursor: pointer;
  color: #000000;
  font-family: 'Press Start 2P', monospace;
}

.amiga-button:hover:not(:disabled) {
  background: #b0b0b0;
}

.amiga-button:active:not(:disabled) {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button:disabled {
  color: #808080;
  cursor: not-allowed;
}

/* Scrollbar styling */
.dialog-content::-webkit-scrollbar {
  width: 16px;
}

.dialog-content::-webkit-scrollbar-track {
  background: #888888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.dialog-content::-webkit-scrollbar-thumb {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.dialog-content::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
}
</style>
