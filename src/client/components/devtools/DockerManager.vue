<template>
  <div class="docker-manager">
    <div class="tool-header">
      <h3>🐳 Docker Manager</h3>
      <p class="tool-desc">Manage Docker containers and images</p>
    </div>

    <div class="tool-content">
      <!-- Connection Status -->
      <div class="status-bar">
        <span class="status-label">Docker Status:</span>
        <span class="status-indicator" :class="{ connected: dockerConnected }">
          {{ dockerConnected ? '● Connected' : '○ Disconnected' }}
        </span>
        <button class="amiga-button small" @click="checkConnection">Refresh</button>
      </div>

      <!-- Tab Navigation -->
      <div class="tabs">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          class="tab"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.name }}
        </div>
      </div>

      <!-- Containers Tab -->
      <div v-if="activeTab === 'containers'" class="tab-content">
        <div class="section-header">
          <h4>Containers</h4>
          <div class="header-actions">
            <button class="amiga-button small" @click="refreshContainers">Refresh</button>
            <button class="amiga-button small primary" @click="showCreateContainer">New</button>
          </div>
        </div>

        <div v-if="containers.length === 0" class="empty-state">
          No containers found
        </div>

        <div v-else class="containers-list">
          <div v-for="container in containers" :key="container.id" class="container-item">
            <div class="container-header">
              <span class="container-status" :class="container.status">●</span>
              <span class="container-name">{{ container.name }}</span>
              <span class="container-image">{{ container.image }}</span>
              <span class="container-id">{{ container.id.substring(0, 12) }}</span>
            </div>

            <div class="container-details">
              <span class="detail">Ports: {{ container.ports }}</span>
              <span class="detail">Status: {{ container.status }}</span>
              <span class="detail">Created: {{ container.created }}</span>
            </div>

            <div class="container-actions">
              <button
                v-if="container.status === 'running'"
                class="amiga-button small"
                @click="stopContainer(container.id)"
              >
                Stop
              </button>
              <button
                v-else
                class="amiga-button small primary"
                @click="startContainer(container.id)"
              >
                Start
              </button>
              <button class="amiga-button small" @click="restartContainer(container.id)">
                Restart
              </button>
              <button class="amiga-button small" @click="viewLogs(container.id)">
                Logs
              </button>
              <button class="amiga-button small" @click="execShell(container.id)">
                Shell
              </button>
              <button class="amiga-button small danger" @click="removeContainer(container.id)">
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Images Tab -->
      <div v-if="activeTab === 'images'" class="tab-content">
        <div class="section-header">
          <h4>Images</h4>
          <div class="header-actions">
            <button class="amiga-button small" @click="refreshImages">Refresh</button>
            <button class="amiga-button small primary" @click="showPullImage">Pull</button>
          </div>
        </div>

        <div v-if="images.length === 0" class="empty-state">
          No images found
        </div>

        <div v-else class="images-list">
          <div v-for="image in images" :key="image.id" class="image-item">
            <div class="image-header">
              <span class="image-name">{{ image.name }}</span>
              <span class="image-tag">{{ image.tag }}</span>
              <span class="image-id">{{ image.id.substring(0, 12) }}</span>
            </div>

            <div class="image-details">
              <span class="detail">Size: {{ image.size }}</span>
              <span class="detail">Created: {{ image.created }}</span>
            </div>

            <div class="image-actions">
              <button class="amiga-button small primary" @click="runImage(image.id)">
                Run
              </button>
              <button class="amiga-button small danger" @click="removeImage(image.id)">
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Networks Tab -->
      <div v-if="activeTab === 'networks'" class="tab-content">
        <div class="section-header">
          <h4>Networks</h4>
          <div class="header-actions">
            <button class="amiga-button small" @click="refreshNetworks">Refresh</button>
            <button class="amiga-button small primary" @click="createNetwork">Create</button>
          </div>
        </div>

        <div class="networks-list">
          <div v-for="network in networks" :key="network.id" class="network-item">
            <div class="network-header">
              <span class="network-name">{{ network.name }}</span>
              <span class="network-driver">{{ network.driver }}</span>
              <span class="network-scope">{{ network.scope }}</span>
            </div>

            <div class="network-details">
              <span class="detail">Subnet: {{ network.subnet }}</span>
              <span class="detail">Containers: {{ network.containers }}</span>
            </div>

            <div class="network-actions">
              <button class="amiga-button small danger" @click="removeNetwork(network.id)">
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Volumes Tab -->
      <div v-if="activeTab === 'volumes'" class="tab-content">
        <div class="section-header">
          <h4>Volumes</h4>
          <div class="header-actions">
            <button class="amiga-button small" @click="refreshVolumes">Refresh</button>
            <button class="amiga-button small primary" @click="createVolume">Create</button>
          </div>
        </div>

        <div class="volumes-list">
          <div v-for="volume in volumes" :key="volume.name" class="volume-item">
            <div class="volume-header">
              <span class="volume-name">{{ volume.name }}</span>
              <span class="volume-driver">{{ volume.driver }}</span>
            </div>

            <div class="volume-details">
              <span class="detail">Mountpoint: {{ volume.mountpoint }}</span>
              <span class="detail">Scope: {{ volume.scope }}</span>
            </div>

            <div class="volume-actions">
              <button class="amiga-button small danger" @click="removeVolume(volume.name)">
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Console Output -->
      <div class="console-output">
        <div class="console-header">Console Output:</div>
        <div class="console-content" ref="consoleRef">
          <div v-for="(line, idx) in outputLines" :key="idx" class="console-line">
            {{ line }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const dockerConnected = ref(true);
const activeTab = ref('containers');
const outputLines = ref<string[]>(['Docker Manager initialized.']);
const consoleRef = ref<HTMLElement | null>(null);

const tabs = [
  { id: 'containers', name: 'Containers' },
  { id: 'images', name: 'Images' },
  { id: 'networks', name: 'Networks' },
  { id: 'volumes', name: 'Volumes' }
];

const containers = ref([
  {
    id: 'abc123def456',
    name: 'webos-app',
    image: 'node:18-alpine',
    status: 'running',
    ports: '3000:3000',
    created: '2 hours ago'
  },
  {
    id: 'def456ghi789',
    name: 'postgres-db',
    image: 'postgres:15',
    status: 'running',
    ports: '5432:5432',
    created: '1 day ago'
  },
  {
    id: 'ghi789jkl012',
    name: 'redis-cache',
    image: 'redis:7-alpine',
    status: 'exited',
    ports: '6379:6379',
    created: '3 days ago'
  }
]);

const images = ref([
  {
    id: 'sha256:abc123',
    name: 'node',
    tag: '18-alpine',
    size: '167 MB',
    created: '2 weeks ago'
  },
  {
    id: 'sha256:def456',
    name: 'postgres',
    tag: '15',
    size: '376 MB',
    created: '1 month ago'
  },
  {
    id: 'sha256:ghi789',
    name: 'redis',
    tag: '7-alpine',
    size: '28 MB',
    created: '3 weeks ago'
  }
]);

const networks = ref([
  {
    id: 'net123',
    name: 'bridge',
    driver: 'bridge',
    scope: 'local',
    subnet: '172.17.0.0/16',
    containers: 2
  },
  {
    id: 'net456',
    name: 'webos-network',
    driver: 'bridge',
    scope: 'local',
    subnet: '172.18.0.0/16',
    containers: 3
  }
]);

const volumes = ref([
  {
    name: 'postgres-data',
    driver: 'local',
    mountpoint: '/var/lib/docker/volumes/postgres-data',
    scope: 'local'
  },
  {
    name: 'redis-data',
    driver: 'local',
    mountpoint: '/var/lib/docker/volumes/redis-data',
    scope: 'local'
  }
]);

const checkConnection = () => {
  addOutput('Checking Docker connection...');
  dockerConnected.value = true;
  addOutput('Docker daemon is running');
};

const refreshContainers = () => {
  addOutput('Refreshing container list...');
  addOutput(`Found ${containers.value.length} containers`);
};

const refreshImages = () => {
  addOutput('Refreshing image list...');
  addOutput(`Found ${images.value.length} images`);
};

const refreshNetworks = () => {
  addOutput('Refreshing network list...');
  addOutput(`Found ${networks.value.length} networks`);
};

const refreshVolumes = () => {
  addOutput('Refreshing volume list...');
  addOutput(`Found ${volumes.value.length} volumes`);
};

const startContainer = (id: string) => {
  const container = containers.value.find(c => c.id === id);
  if (container) {
    addOutput(`Starting container ${container.name}...`);
    container.status = 'running';
    addOutput('Container started successfully');
  }
};

const stopContainer = (id: string) => {
  const container = containers.value.find(c => c.id === id);
  if (container) {
    addOutput(`Stopping container ${container.name}...`);
    container.status = 'exited';
    addOutput('Container stopped');
  }
};

const restartContainer = (id: string) => {
  const container = containers.value.find(c => c.id === id);
  if (container) {
    addOutput(`Restarting container ${container.name}...`);
    addOutput('Container restarted');
  }
};

const viewLogs = (id: string) => {
  const container = containers.value.find(c => c.id === id);
  if (container) {
    addOutput(`Fetching logs for ${container.name}...`);
    addOutput('--- Container Logs ---');
    addOutput('Application started on port 3000');
    addOutput('Listening for connections...');
  }
};

const execShell = (id: string) => {
  const container = containers.value.find(c => c.id === id);
  if (container) {
    addOutput(`Opening shell in ${container.name}...`);
    addOutput('Use the Shell application for interactive sessions');
  }
};

const removeContainer = (id: string) => {
  const container = containers.value.find(c => c.id === id);
  if (container && confirm(`Remove container ${container.name}?`)) {
    addOutput(`Removing container ${container.name}...`);
    containers.value = containers.value.filter(c => c.id !== id);
    addOutput('Container removed');
  }
};

const showCreateContainer = () => {
  const imageName = prompt('Enter image name (e.g., nginx:latest):');
  if (imageName) {
    addOutput(`Creating container from ${imageName}...`);
    addOutput('Container created (mock)');
  }
};

const showPullImage = () => {
  const imageName = prompt('Enter image name to pull (e.g., ubuntu:latest):');
  if (imageName) {
    addOutput(`Pulling image ${imageName}...`);
    addOutput('Download in progress... (mock)');
  }
};

const runImage = (id: string) => {
  const image = images.value.find(i => i.id === id);
  if (image) {
    addOutput(`Running container from ${image.name}:${image.tag}...`);
    addOutput('Container started (mock)');
  }
};

const removeImage = (id: string) => {
  const image = images.value.find(i => i.id === id);
  if (image && confirm(`Remove image ${image.name}:${image.tag}?`)) {
    addOutput(`Removing image ${image.name}:${image.tag}...`);
    images.value = images.value.filter(i => i.id !== id);
    addOutput('Image removed');
  }
};

const createNetwork = () => {
  const name = prompt('Enter network name:');
  if (name) {
    addOutput(`Creating network ${name}...`);
    addOutput('Network created (mock)');
  }
};

const removeNetwork = (id: string) => {
  const network = networks.value.find(n => n.id === id);
  if (network && confirm(`Remove network ${network.name}?`)) {
    addOutput(`Removing network ${network.name}...`);
    networks.value = networks.value.filter(n => n.id !== id);
    addOutput('Network removed');
  }
};

const createVolume = () => {
  const name = prompt('Enter volume name:');
  if (name) {
    addOutput(`Creating volume ${name}...`);
    addOutput('Volume created (mock)');
  }
};

const removeVolume = (name: string) => {
  if (confirm(`Remove volume ${name}?`)) {
    addOutput(`Removing volume ${name}...`);
    volumes.value = volumes.value.filter(v => v.name !== name);
    addOutput('Volume removed');
  }
};

const addOutput = (line: string) => {
  outputLines.value.push(`[${new Date().toLocaleTimeString()}] ${line}`);
  setTimeout(() => {
    if (consoleRef.value) {
      consoleRef.value.scrollTop = consoleRef.value.scrollHeight;
    }
  }, 10);
};
</script>

<style scoped>
.docker-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
  overflow: hidden;
}

.tool-header {
  background: #0055aa;
  color: #ffffff;
  padding: 12px;
  border-bottom: 2px solid #000000;
}

.tool-header h3 {
  margin: 0 0 4px 0;
  font-size: 11px;
}

.tool-desc {
  margin: 0;
  font-size: 8px;
  opacity: 0.9;
}

.tool-content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  font-size: 9px;
}

.status-label {
  color: #666666;
}

.status-indicator {
  color: #ff0000;
  font-weight: bold;
}

.status-indicator.connected {
  color: #00aa00;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 12px;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
  cursor: pointer;
  white-space: nowrap;
}

.amiga-button:hover {
  background: #b0b0b0;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button.small {
  padding: 4px 8px;
  font-size: 8px;
}

.amiga-button.primary {
  background: #0055aa;
  color: #ffffff;
}

.amiga-button.danger {
  background: #ff0000;
  color: #ffffff;
}

.tabs {
  display: flex;
  gap: 2px;
  background: #888888;
  padding: 2px;
}

.tab {
  flex: 1;
  padding: 6px;
  text-align: center;
  font-size: 8px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  user-select: none;
}

.tab:hover {
  background: #b0b0b0;
}

.tab.active {
  background: #0055aa;
  color: #ffffff;
  border-color: #000000 #ffffff #ffffff #000000;
}

.tab-content {
  background: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 12px;
  flex: 1;
  overflow-y: auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 2px solid #000000;
}

.section-header h4 {
  margin: 0;
  font-size: 9px;
  color: #0055aa;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: #666666;
  font-size: 8px;
  font-style: italic;
}

.containers-list,
.images-list,
.networks-list,
.volumes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.container-item,
.image-item,
.network-item,
.volume-item {
  background: #f5f5f5;
  border: 2px solid #888888;
  padding: 8px;
}

.container-header,
.image-header,
.network-header,
.volume-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 9px;
}

.container-status {
  font-size: 16px;
}

.container-status.running {
  color: #00aa00;
}

.container-status.exited {
  color: #888888;
}

.container-name,
.image-name,
.network-name,
.volume-name {
  font-weight: bold;
  color: #0055aa;
  font-family: 'Courier New', monospace;
}

.container-image,
.image-tag,
.network-driver,
.volume-driver {
  color: #666666;
}

.container-id,
.image-id {
  margin-left: auto;
  font-family: 'Courier New', monospace;
  color: #888888;
  font-size: 7px;
}

.container-details,
.image-details,
.network-details,
.volume-details {
  display: flex;
  gap: 12px;
  margin-bottom: 6px;
  font-size: 8px;
  color: #666666;
}

.detail {
  display: flex;
  align-items: center;
}

.container-actions,
.image-actions,
.network-actions,
.volume-actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.console-output {
  background: #000000;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  margin-top: auto;
}

.console-header {
  background: #0055aa;
  color: #ffffff;
  padding: 4px 8px;
  font-size: 8px;
}

.console-content {
  height: 100px;
  overflow-y: auto;
  padding: 6px;
  font-family: 'Courier New', monospace;
  font-size: 8px;
}

.console-line {
  color: #00ff00;
  margin-bottom: 2px;
  line-height: 1.4;
}

.network-scope {
  margin-left: auto;
  font-size: 7px;
}
</style>
