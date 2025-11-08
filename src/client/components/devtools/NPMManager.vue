<template>
  <div class="npm-manager">
    <div class="tool-header">
      <h3>📦 NPM Manager</h3>
      <p class="tool-desc">Manage Node.js packages and scripts</p>
    </div>

    <div class="tool-content">
      <!-- Project Path -->
      <div class="input-section">
        <label>Project Path:</label>
        <div class="input-row">
          <input
            v-model="projectPath"
            type="text"
            class="amiga-input"
            placeholder="/path/to/project"
          />
          <button class="amiga-button" @click="loadProject">Load</button>
        </div>
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

      <!-- Packages Tab -->
      <div v-if="activeTab === 'packages'" class="tab-content">
        <div class="section-header">
          <h4>Installed Packages</h4>
          <div class="header-actions">
            <button class="amiga-button small" @click="checkUpdates">Check Updates</button>
            <button class="amiga-button small primary" @click="installPackage">Install</button>
          </div>
        </div>

        <!-- Search -->
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            class="amiga-input"
            placeholder="Search packages..."
          />
        </div>

        <!-- Package Filters -->
        <div class="filter-buttons">
          <button
            class="amiga-button small"
            :class="{ active: filter === 'all' }"
            @click="filter = 'all'"
          >
            All ({{ packages.length }})
          </button>
          <button
            class="amiga-button small"
            :class="{ active: filter === 'dependencies' }"
            @click="filter = 'dependencies'"
          >
            Dependencies
          </button>
          <button
            class="amiga-button small"
            :class="{ active: filter === 'devDependencies' }"
            @click="filter = 'devDependencies'"
          >
            Dev Dependencies
          </button>
          <button
            class="amiga-button small"
            :class="{ active: filter === 'outdated' }"
            @click="filter = 'outdated'"
          >
            Outdated ({{ outdatedCount }})
          </button>
        </div>

        <!-- Packages List -->
        <div class="packages-list">
          <div v-for="pkg in filteredPackages" :key="pkg.name" class="package-item">
            <div class="package-header">
              <span class="package-name">{{ pkg.name }}</span>
              <span class="package-version" :class="{ outdated: pkg.outdated }">
                {{ pkg.version }}
              </span>
              <span v-if="pkg.outdated" class="latest-version">
                → {{ pkg.latest }}
              </span>
              <span class="package-type">{{ pkg.type }}</span>
            </div>

            <div class="package-description">{{ pkg.description }}</div>

            <div class="package-actions">
              <button
                v-if="pkg.outdated"
                class="amiga-button small primary"
                @click="updatePackage(pkg.name)"
              >
                Update
              </button>
              <button class="amiga-button small" @click="viewPackageInfo(pkg.name)">
                Info
              </button>
              <button class="amiga-button small danger" @click="uninstallPackage(pkg.name)">
                Uninstall
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Scripts Tab -->
      <div v-if="activeTab === 'scripts'" class="tab-content">
        <div class="section-header">
          <h4>NPM Scripts</h4>
        </div>

        <div v-if="scripts.length === 0" class="empty-state">
          No scripts defined in package.json
        </div>

        <div v-else class="scripts-list">
          <div v-for="script in scripts" :key="script.name" class="script-item">
            <div class="script-header">
              <span class="script-name">{{ script.name }}</span>
              <button
                class="amiga-button small primary"
                @click="runScript(script.name)"
                :disabled="scriptRunning === script.name"
              >
                {{ scriptRunning === script.name ? 'Running...' : 'Run' }}
              </button>
            </div>

            <div class="script-command">{{ script.command }}</div>
          </div>
        </div>
      </div>

      <!-- Audit Tab -->
      <div v-if="activeTab === 'audit'" class="tab-content">
        <div class="section-header">
          <h4>Security Audit</h4>
          <button class="amiga-button small" @click="runAudit">Run Audit</button>
        </div>

        <div v-if="auditResults" class="audit-summary">
          <div class="summary-item critical">
            <span class="severity-badge critical">Critical</span>
            <span class="count">{{ auditResults.critical }}</span>
          </div>
          <div class="summary-item high">
            <span class="severity-badge high">High</span>
            <span class="count">{{ auditResults.high }}</span>
          </div>
          <div class="summary-item moderate">
            <span class="severity-badge moderate">Moderate</span>
            <span class="count">{{ auditResults.moderate }}</span>
          </div>
          <div class="summary-item low">
            <span class="severity-badge low">Low</span>
            <span class="count">{{ auditResults.low }}</span>
          </div>
        </div>

        <div v-if="vulnerabilities.length > 0" class="vulnerabilities-list">
          <h4>Vulnerabilities:</h4>
          <div v-for="(vuln, idx) in vulnerabilities" :key="idx" class="vulnerability-item">
            <div class="vuln-header">
              <span class="severity-badge" :class="vuln.severity">
                {{ vuln.severity.toUpperCase() }}
              </span>
              <span class="vuln-title">{{ vuln.title }}</span>
            </div>

            <div class="vuln-details">
              <div class="detail-row">
                <span class="label">Package:</span>
                <span class="value">{{ vuln.package }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Vulnerable:</span>
                <span class="value">{{ vuln.vulnerable }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Patched:</span>
                <span class="value">{{ vuln.patched }}</span>
              </div>
            </div>

            <div class="vuln-actions">
              <button class="amiga-button small primary" @click="fixVulnerability(vuln)">
                Fix
              </button>
              <button class="amiga-button small" @click="viewVulnDetails(vuln)">
                Details
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Info Tab -->
      <div v-if="activeTab === 'info'" class="tab-content">
        <div class="section-header">
          <h4>Project Info</h4>
        </div>

        <div v-if="projectInfo" class="project-info">
          <div class="info-row">
            <span class="label">Name:</span>
            <span class="value">{{ projectInfo.name }}</span>
          </div>
          <div class="info-row">
            <span class="label">Version:</span>
            <span class="value">{{ projectInfo.version }}</span>
          </div>
          <div class="info-row">
            <span class="label">Description:</span>
            <span class="value">{{ projectInfo.description }}</span>
          </div>
          <div class="info-row">
            <span class="label">License:</span>
            <span class="value">{{ projectInfo.license }}</span>
          </div>
          <div class="info-row">
            <span class="label">Node Version:</span>
            <span class="value">{{ projectInfo.nodeVersion }}</span>
          </div>
          <div class="info-row">
            <span class="label">NPM Version:</span>
            <span class="value">{{ projectInfo.npmVersion }}</span>
          </div>
        </div>

        <div class="info-actions">
          <button class="amiga-button" @click="npmInstall">npm install</button>
          <button class="amiga-button" @click="npmUpdate">npm update</button>
          <button class="amiga-button danger" @click="cleanNodeModules">
            Clean node_modules
          </button>
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
import { ref, computed } from 'vue';

const projectPath = ref('/home/user/webos');
const activeTab = ref('packages');
const searchQuery = ref('');
const filter = ref('all');
const scriptRunning = ref<string | null>(null);
const outputLines = ref<string[]>(['NPM Manager initialized.']);
const consoleRef = ref<HTMLElement | null>(null);

const tabs = [
  { id: 'packages', name: 'Packages' },
  { id: 'scripts', name: 'Scripts' },
  { id: 'audit', name: 'Audit' },
  { id: 'info', name: 'Info' }
];

const packages = ref([
  {
    name: 'vue',
    version: '3.4.0',
    latest: '3.4.21',
    description: 'The progressive JavaScript framework',
    type: 'dependencies',
    outdated: true
  },
  {
    name: 'typescript',
    version: '5.3.3',
    latest: '5.3.3',
    description: 'TypeScript language for application-scale JavaScript',
    type: 'devDependencies',
    outdated: false
  },
  {
    name: 'express',
    version: '4.18.0',
    latest: '4.18.2',
    description: 'Fast, unopinionated, minimalist web framework',
    type: 'dependencies',
    outdated: true
  },
  {
    name: 'vite',
    version: '5.0.0',
    latest: '5.0.0',
    description: 'Native-ESM powered web dev build tool',
    type: 'devDependencies',
    outdated: false
  }
]);

const scripts = ref([
  { name: 'dev', command: 'vite' },
  { name: 'build', command: 'vite build' },
  { name: 'preview', command: 'vite preview' },
  { name: 'type-check', command: 'vue-tsc --noEmit' },
  { name: 'test', command: 'vitest' },
  { name: 'lint', command: 'eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --fix' }
]);

const auditResults = ref({
  critical: 0,
  high: 2,
  moderate: 5,
  low: 3
});

const vulnerabilities = ref([
  {
    title: 'Regular Expression Denial of Service',
    package: 'semver',
    vulnerable: '<7.5.2',
    patched: '>=7.5.2',
    severity: 'moderate'
  },
  {
    title: 'Prototype Pollution',
    package: 'lodash',
    vulnerable: '<4.17.21',
    patched: '>=4.17.21',
    severity: 'high'
  }
]);

const projectInfo = ref({
  name: 'webos',
  version: '2.0.0',
  description: 'Amiga Workbench Style Interface for the Web',
  license: 'MIT',
  nodeVersion: 'v18.19.0',
  npmVersion: '10.2.3'
});

const outdatedCount = computed(() => {
  return packages.value.filter(p => p.outdated).length;
});

const filteredPackages = computed(() => {
  let result = packages.value;

  // Apply type filter
  if (filter.value !== 'all') {
    if (filter.value === 'outdated') {
      result = result.filter(p => p.outdated);
    } else {
      result = result.filter(p => p.type === filter.value);
    }
  }

  // Apply search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    );
  }

  return result;
});

const loadProject = () => {
  addOutput(`Loading project from ${projectPath.value}...`);
  addOutput('Project loaded successfully');
  addOutput(`Found ${packages.value.length} packages`);
};

const checkUpdates = () => {
  addOutput('Checking for package updates...');
  addOutput(`Found ${outdatedCount.value} outdated packages`);
};

const installPackage = () => {
  const pkgName = prompt('Enter package name to install:');
  if (pkgName) {
    addOutput(`Installing ${pkgName}...`);
    addOutput(`${pkgName} installed successfully`);
  }
};

const updatePackage = (name: string) => {
  const pkg = packages.value.find(p => p.name === name);
  if (pkg) {
    addOutput(`Updating ${name} from ${pkg.version} to ${pkg.latest}...`);
    pkg.version = pkg.latest;
    pkg.outdated = false;
    addOutput(`${name} updated successfully`);
  }
};

const uninstallPackage = (name: string) => {
  if (confirm(`Uninstall package "${name}"?`)) {
    addOutput(`Uninstalling ${name}...`);
    packages.value = packages.value.filter(p => p.name !== name);
    addOutput(`${name} uninstalled successfully`);
  }
};

const viewPackageInfo = (name: string) => {
  addOutput(`Fetching info for ${name}...`);
  addOutput('Package info displayed (mock)');
};

const runScript = (name: string) => {
  const script = scripts.value.find(s => s.name === name);
  if (script) {
    scriptRunning.value = name;
    addOutput(`Running script: ${name}`);
    addOutput(`$ ${script.command}`);

    setTimeout(() => {
      addOutput('Script completed successfully');
      scriptRunning.value = null;
    }, 2000);
  }
};

const runAudit = () => {
  addOutput('Running security audit...');
  addOutput(`Found ${vulnerabilities.value.length} vulnerabilities`);
  addOutput(`Critical: ${auditResults.value.critical}, High: ${auditResults.value.high}, Moderate: ${auditResults.value.moderate}, Low: ${auditResults.value.low}`);
};

const fixVulnerability = (vuln: any) => {
  addOutput(`Fixing vulnerability in ${vuln.package}...`);
  addOutput(`Updating ${vuln.package} to patched version`);
};

const viewVulnDetails = (vuln: any) => {
  addOutput(`Vulnerability details: ${vuln.title}`);
};

const npmInstall = () => {
  addOutput('Running npm install...');
  addOutput('Installing dependencies...');
  setTimeout(() => addOutput('Installation complete'), 1000);
};

const npmUpdate = () => {
  addOutput('Running npm update...');
  addOutput('Updating packages...');
  setTimeout(() => addOutput('Update complete'), 1000);
};

const cleanNodeModules = () => {
  if (confirm('Delete node_modules directory?')) {
    addOutput('Removing node_modules...');
    addOutput('node_modules removed (mock)');
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
.npm-manager {
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

.input-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-section label {
  font-size: 9px;
  color: #000000;
}

.input-row {
  display: flex;
  gap: 6px;
}

.amiga-input {
  flex: 1;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 6px 8px;
  font-size: 10px;
  font-family: 'Courier New', monospace;
  color: #000000;
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

.amiga-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.amiga-button.active {
  background: #00aa00;
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

.search-box {
  margin-bottom: 8px;
}

.filter-buttons {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: #666666;
  font-size: 8px;
  font-style: italic;
}

.packages-list,
.scripts-list,
.vulnerabilities-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.package-item,
.script-item,
.vulnerability-item {
  background: #f5f5f5;
  border: 2px solid #888888;
  padding: 8px;
}

.package-header,
.script-header,
.vuln-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 9px;
}

.package-name,
.script-name {
  font-weight: bold;
  color: #0055aa;
  font-family: 'Courier New', monospace;
  flex: 1;
}

.package-version {
  color: #00aa00;
  font-family: 'Courier New', monospace;
  font-size: 8px;
}

.package-version.outdated {
  color: #ff8800;
}

.latest-version {
  color: #0055aa;
  font-size: 8px;
}

.package-type {
  font-size: 7px;
  color: #666666;
  padding: 2px 6px;
  background: #e0e0e0;
  border: 1px solid #888888;
}

.package-description {
  font-size: 8px;
  color: #666666;
  margin-bottom: 6px;
}

.package-actions,
.script-actions,
.vuln-actions,
.info-actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.script-command {
  font-size: 8px;
  color: #000000;
  font-family: 'Courier New', monospace;
  background: #e0e0e0;
  padding: 4px;
  border: 1px solid #888888;
  margin-bottom: 6px;
}

.audit-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.summary-item {
  background: #f5f5f5;
  border: 2px solid #888888;
  padding: 12px;
  text-align: center;
}

.severity-badge {
  display: inline-block;
  padding: 2px 6px;
  font-size: 7px;
  font-weight: bold;
  border: 1px solid;
  margin-right: 8px;
}

.severity-badge.critical {
  background: #ff0000;
  color: #ffffff;
  border-color: #880000;
}

.severity-badge.high {
  background: #ff8800;
  color: #ffffff;
  border-color: #884400;
}

.severity-badge.moderate {
  background: #ffff00;
  color: #000000;
  border-color: #888800;
}

.severity-badge.low {
  background: #00ff00;
  color: #000000;
  border-color: #008800;
}

.summary-item .count {
  display: block;
  font-size: 16px;
  font-weight: bold;
  margin-top: 6px;
}

.vuln-title {
  flex: 1;
  font-size: 9px;
  color: #000000;
}

.vuln-details {
  margin-bottom: 6px;
  font-size: 8px;
}

.detail-row {
  display: flex;
  gap: 8px;
  margin-bottom: 2px;
}

.detail-row .label {
  color: #666666;
  min-width: 80px;
}

.detail-row .value {
  color: #000000;
  font-family: 'Courier New', monospace;
}

.project-info {
  background: #f5f5f5;
  border: 2px solid #888888;
  padding: 12px;
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 9px;
}

.info-row .label {
  color: #666666;
  min-width: 120px;
}

.info-row .value {
  color: #000000;
  font-weight: bold;
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
</style>
