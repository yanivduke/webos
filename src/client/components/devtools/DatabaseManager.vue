<template>
  <div class="database-manager">
    <div class="db-toolbar">
      <button class="amiga-button" @click="showConnections = !showConnections">
        Connections
      </button>
      <button class="amiga-button" @click="executeQuery" :disabled="!currentConnection || !query">
        Execute
      </button>
      <select v-model="currentConnection" class="amiga-select">
        <option value="">Select Connection...</option>
        <option v-for="conn in connections" :key="conn.id" :value="conn.id">
          {{ conn.name }} ({{ conn.type }})
        </option>
      </select>
      <button class="amiga-button" @click="addConnection">+ New</button>
    </div>

    <!-- Connection Manager Panel -->
    <div v-if="showConnections" class="db-connections-panel">
      <h4>Database Connections</h4>
      <div v-for="conn in connections" :key="conn.id" class="db-connection-item">
        <div class="conn-info">
          <strong>{{ conn.name }}</strong> - {{ conn.type }}
          <div class="conn-details">{{ conn.host }}:{{ conn.port }}</div>
        </div>
        <div class="conn-actions">
          <button class="small-button" @click="testConnection(conn.id)">Test</button>
          <button class="small-button" @click="deleteConnection(conn.id)">Delete</button>
        </div>
      </div>
      <div class="add-connection-form" v-if="showAddForm">
        <input v-model="newConn.name" class="amiga-input" placeholder="Connection Name" />
        <select v-model="newConn.type" class="amiga-select">
          <option value="postgresql">PostgreSQL</option>
          <option value="mysql">MySQL</option>
          <option value="mongodb">MongoDB</option>
          <option value="sqlite">SQLite</option>
        </select>
        <input v-model="newConn.host" class="amiga-input" placeholder="Host" />
        <input v-model="newConn.port" class="amiga-input" placeholder="Port" />
        <input v-model="newConn.database" class="amiga-input" placeholder="Database" />
        <input v-model="newConn.username" class="amiga-input" placeholder="Username" />
        <input v-model="newConn.password" type="password" class="amiga-input" placeholder="Password" />
        <div class="form-actions">
          <button class="amiga-button" @click="saveConnection">Save</button>
          <button class="amiga-button" @click="cancelAdd">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Query Editor -->
    <div class="db-query-editor">
      <textarea
        v-model="query"
        class="query-textarea"
        placeholder="Enter SQL query... (e.g., SELECT * FROM users;)"
        spellcheck="false"
      ></textarea>
    </div>

    <!-- Results Panel -->
    <div class="db-results-panel">
      <div v-if="loading" class="loading">Executing query...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <div v-else-if="results" class="results-table">
        <div class="results-header">
          {{ results.rowCount }} rows in {{ results.executionTime }}ms
        </div>
        <table v-if="results.rows && results.rows.length > 0">
          <thead>
            <tr>
              <th v-for="column in results.columns" :key="column">{{ column }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in results.rows" :key="idx">
              <td v-for="column in results.columns" :key="column">{{ row[column] }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="no-results">Query executed successfully. No rows returned.</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Connection {
  id: string;
  name: string;
  type: string;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
}

interface QueryResult {
  columns: string[];
  rows: any[];
  rowCount: number;
  executionTime: number;
}

const showConnections = ref(false);
const showAddForm = ref(false);
const currentConnection = ref('');
const query = ref('SELECT 1;');
const loading = ref(false);
const error = ref('');
const results = ref<QueryResult | null>(null);

const connections = ref<Connection[]>([
  {
    id: '1',
    name: 'Local PostgreSQL',
    type: 'postgresql',
    host: 'localhost',
    port: '5432',
    database: 'webos',
    username: 'postgres',
    password: ''
  }
]);

const newConn = ref({
  name: '',
  type: 'postgresql',
  host: 'localhost',
  port: '5432',
  database: '',
  username: '',
  password: ''
});

const addConnection = () => {
  showAddForm.value = true;
  showConnections.value = true;
};

const saveConnection = () => {
  if (!newConn.value.name || !newConn.value.database) {
    alert('Please fill in connection name and database');
    return;
  }

  connections.value.push({
    id: Date.now().toString(),
    ...newConn.value
  });

  newConn.value = {
    name: '',
    type: 'postgresql',
    host: 'localhost',
    port: '5432',
    database: '',
    username: '',
    password: ''
  };
  showAddForm.value = false;
};

const cancelAdd = () => {
  showAddForm.value = false;
};

const deleteConnection = (id: string) => {
  if (confirm('Delete this connection?')) {
    connections.value = connections.value.filter(c => c.id !== id);
  }
};

const testConnection = async (id: string) => {
  const conn = connections.value.find(c => c.id === id);
  if (!conn) return;

  try {
    const response = await fetch('/api/devtools/database/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(conn)
    });

    const data = await response.json();
    if (data.success) {
      alert('Connection successful!');
    } else {
      alert('Connection failed: ' + data.error);
    }
  } catch (err) {
    alert('Connection test failed');
  }
};

const executeQuery = async () => {
  if (!currentConnection.value || !query.value) return;

  const conn = connections.value.find(c => c.id === currentConnection.value);
  if (!conn) return;

  loading.value = true;
  error.value = '';
  results.value = null;

  try {
    const response = await fetch('/api/devtools/database/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        connection: conn,
        query: query.value
      })
    });

    const data = await response.json();

    if (response.ok) {
      results.value = data;
    } else {
      error.value = data.error || 'Query execution failed';
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to execute query';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.database-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  font-family: 'Press Start 2P', monospace;
}

.db-toolbar {
  display: flex;
  gap: 4px;
  padding: 8px;
  background: #a0a0a0;
  border-bottom: 2px solid #000000;
  flex-wrap: wrap;
}

.db-toolbar .amiga-button {
  font-size: 8px;
  padding: 4px 8px;
}

.db-toolbar .amiga-select {
  flex: 1;
  min-width: 200px;
  font-size: 8px;
}

.db-connections-panel {
  background: #f0f0f0;
  border-bottom: 2px solid #000000;
  padding: 8px;
  max-height: 250px;
  overflow-y: auto;
}

.db-connections-panel h4 {
  font-size: 9px;
  color: #0055aa;
  margin: 0 0 8px 0;
}

.db-connection-item {
  background: #ffffff;
  border: 1px solid #000000;
  padding: 6px;
  margin-bottom: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.conn-info {
  font-size: 7px;
  flex: 1;
}

.conn-info strong {
  color: #0055aa;
}

.conn-details {
  font-size: 6px;
  color: #666666;
  margin-top: 2px;
}

.conn-actions {
  display: flex;
  gap: 4px;
}

.small-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 2px 6px;
  font-size: 6px;
  cursor: pointer;
  font-family: 'Press Start 2P', monospace;
}

.small-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
}

.add-connection-form {
  background: #e0e0e0;
  border: 2px solid #000000;
  padding: 8px;
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.add-connection-form .amiga-input,
.add-connection-form .amiga-select {
  font-size: 7px;
  padding: 3px 6px;
}

.form-actions {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.form-actions .amiga-button {
  flex: 1;
  font-size: 7px;
  padding: 4px;
}

.db-query-editor {
  flex: 1;
  padding: 8px;
  background: #ffffff;
  min-height: 150px;
}

.query-textarea {
  width: 100%;
  height: 100%;
  min-height: 150px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 8px;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: #000000;
  resize: vertical;
}

.query-textarea:focus {
  outline: 1px solid #0055aa;
}

.db-results-panel {
  flex: 1;
  padding: 8px;
  background: #f8f8f8;
  border-top: 2px solid #000000;
  overflow: auto;
  min-height: 150px;
}

.loading {
  text-align: center;
  padding: 20px;
  font-size: 8px;
  color: #666666;
}

.error-message {
  color: #ff0000;
  font-size: 7px;
  padding: 8px;
  background: #ffeeee;
  border: 1px solid #ff0000;
}

.results-header {
  font-size: 7px;
  color: #0055aa;
  margin-bottom: 8px;
  font-weight: bold;
}

.results-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 7px;
  background: #ffffff;
}

.results-table th {
  background: #0055aa;
  color: #ffffff;
  padding: 4px 8px;
  text-align: left;
  border: 1px solid #000000;
  font-weight: bold;
}

.results-table td {
  padding: 4px 8px;
  border: 1px solid #cccccc;
  color: #000000;
}

.results-table tr:nth-child(even) {
  background: #f0f0f0;
}

.no-results {
  text-align: center;
  padding: 20px;
  font-size: 7px;
  color: #666666;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 8px;
  font-size: 8px;
  cursor: pointer;
  color: #000000;
  font-family: 'Press Start 2P', monospace;
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

.amiga-select {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px 8px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
}

.amiga-input {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px 8px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
}

.amiga-input:focus {
  outline: 1px solid #0055aa;
}
</style>
