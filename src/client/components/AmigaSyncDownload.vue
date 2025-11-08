<template>
  <div class="sync-download-container">
    <div class="sync-header">
      <h2>WebOS Sync Agent</h2>
      <p class="subtitle">Sync your desktop files with WebOS</p>
    </div>

    <div class="sync-features">
      <div class="feature-item">
        <div class="feature-icon">🔄</div>
        <div class="feature-text">Real-time file synchronization</div>
      </div>
      <div class="feature-item">
        <div class="feature-icon">🔐</div>
        <div class="feature-text">Secure encrypted transfers</div>
      </div>
      <div class="feature-item">
        <div class="feature-icon">🖥️</div>
        <div class="feature-text">Works on Windows, Mac & Linux</div>
      </div>
      <div class="feature-item">
        <div class="feature-icon">⚡</div>
        <div class="feature-text">Automatic background syncing</div>
      </div>
    </div>

    <div class="sync-downloads">
      <h3>Download Sync Agent</h3>
      <p class="download-subtitle">Choose your operating system:</p>

      <div class="download-buttons">
        <div class="download-card" @click="downloadAgent('windows')">
          <div class="os-icon">
            <svg viewBox="0 0 64 64" class="windows-icon">
              <rect x="8" y="8" width="22" height="22" fill="#0078d4"/>
              <rect x="34" y="8" width="22" height="22" fill="#0078d4"/>
              <rect x="8" y="34" width="22" height="22" fill="#0078d4"/>
              <rect x="34" y="34" width="22" height="22" fill="#0078d4"/>
            </svg>
          </div>
          <div class="os-name">Windows</div>
          <div class="os-detail">Windows 10/11 (64-bit)</div>
          <div class="download-size">~85 MB</div>
        </div>

        <div class="download-card" @click="downloadAgent('mac')">
          <div class="os-icon">
            <svg viewBox="0 0 64 64" class="mac-icon">
              <path d="M32 8 C 28 8 24 10 24 14 C 24 16 25 18 26 19 C 22 20 18 24 18 30 C 18 38 24 48 30 48 C 32 48 33 47 34 47 C 35 47 36 48 38 48 C 44 48 50 38 50 30 C 50 24 46 20 42 19 C 43 18 44 16 44 14 C 44 10 40 8 36 8 C 34 8 33 9 32 10 C 31 9 30 8 28 8 Z" fill="#555"/>
              <circle cx="34" cy="8" r="4" fill="#555"/>
            </svg>
          </div>
          <div class="os-name">macOS</div>
          <div class="os-detail">macOS 10.14+ (Intel & Apple Silicon)</div>
          <div class="download-size">~90 MB</div>
        </div>

        <div class="download-card" @click="downloadAgent('linux')">
          <div class="os-icon">
            <svg viewBox="0 0 64 64" class="linux-icon">
              <ellipse cx="32" cy="28" rx="16" ry="20" fill="#333"/>
              <ellipse cx="26" cy="24" rx="3" ry="4" fill="#fff"/>
              <ellipse cx="38" cy="24" rx="3" ry="4" fill="#fff"/>
              <circle cx="26" cy="24" r="1.5" fill="#000"/>
              <circle cx="38" cy="24" r="1.5" fill="#000"/>
              <path d="M 28 30 Q 32 32 36 30" stroke="#000" stroke-width="2" fill="none"/>
              <path d="M 20 36 L 18 44 M 44 36 L 46 44" stroke="#333" stroke-width="3"/>
            </svg>
          </div>
          <div class="os-name">Linux</div>
          <div class="os-detail">Ubuntu, Fedora, Debian (AppImage)</div>
          <div class="download-size">~88 MB</div>
        </div>
      </div>
    </div>

    <div class="sync-instructions">
      <h3>Quick Start</h3>
      <ol class="instruction-list">
        <li>Download and install the sync agent for your OS</li>
        <li>Launch the sync agent application</li>
        <li>Enter this server's URL: <code>{{ serverUrl }}</code></li>
        <li>Login with your WebOS credentials</li>
        <li>Select a folder to sync and start syncing!</li>
      </ol>
    </div>

    <div class="sync-footer">
      <button class="amiga-button" @click="viewDocumentation">View Documentation</button>
      <button class="amiga-button" @click="closeWindow">Close</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const serverUrl = ref('http://localhost:3001');

onMounted(() => {
  // Get server URL from current location
  serverUrl.value = window.location.origin.replace(':3000', ':3001');
});

const downloadAgent = (platform: string) => {
  let filename = '';

  switch (platform) {
    case 'windows':
      filename = 'WebOS-Sync-Agent-Setup.exe';
      break;
    case 'mac':
      filename = 'WebOS-Sync-Agent.dmg';
      break;
    case 'linux':
      filename = 'WebOS-Sync-Agent.AppImage';
      break;
  }

  // Trigger download
  const downloadUrl = `/api/downloads/sync-agent/${filename}`;
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const viewDocumentation = () => {
  window.open('https://github.com/yourusername/webos/blob/main/sync-agent/README.md', '_blank');
};

const closeWindow = () => {
  // Emit close event to parent
  const event = new CustomEvent('close');
  window.dispatchEvent(event);
};
</script>

<style scoped>
.sync-download-container {
  padding: 20px;
  background: #a0a0a0;
  min-height: 100%;
  font-family: 'Press Start 2P', monospace;
}

.sync-header {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.sync-header h2 {
  font-size: 16px;
  color: #0055aa;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 8px;
  color: #000;
}

.sync-features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #888;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.feature-icon {
  font-size: 16px;
}

.feature-text {
  font-size: 7px;
  color: #fff;
}

.sync-downloads {
  margin-bottom: 20px;
}

.sync-downloads h3 {
  font-size: 12px;
  color: #0055aa;
  margin-bottom: 10px;
}

.download-subtitle {
  font-size: 8px;
  margin-bottom: 15px;
  color: #000;
}

.download-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.download-card {
  background: #888;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.1s;
}

.download-card:hover {
  background: #999;
  border-color: #000000 #ffffff #ffffff #000000;
}

.download-card:active {
  background: #777;
  border-color: #000000 #ffffff #ffffff #000000;
}

.os-icon {
  margin-bottom: 10px;
}

.os-icon svg {
  width: 48px;
  height: 48px;
}

.os-name {
  font-size: 10px;
  color: #fff;
  margin-bottom: 6px;
}

.os-detail {
  font-size: 6px;
  color: #ccc;
  margin-bottom: 4px;
  line-height: 1.4;
}

.download-size {
  font-size: 6px;
  color: #ffaa00;
  margin-top: 6px;
}

.sync-instructions {
  background: #666;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 16px;
  margin-bottom: 20px;
}

.sync-instructions h3 {
  font-size: 10px;
  color: #ffaa00;
  margin-bottom: 12px;
}

.instruction-list {
  margin-left: 20px;
  font-size: 7px;
  color: #fff;
  line-height: 2;
}

.instruction-list li {
  margin-bottom: 8px;
}

.instruction-list code {
  background: #333;
  color: #0f0;
  padding: 2px 6px;
  font-family: 'Courier New', monospace;
  font-size: 7px;
}

.sync-footer {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 8px 16px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  color: #000;
}

.amiga-button:hover {
  background: #b0b0b0;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888;
}
</style>
