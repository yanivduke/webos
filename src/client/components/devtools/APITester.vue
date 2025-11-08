<template>
  <div class="api-tester">
    <div class="api-toolbar">
      <select v-model="method" class="method-select">
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="PATCH">PATCH</option>
        <option value="DELETE">DELETE</option>
      </select>
      <input v-model="url" class="amiga-input url-input" placeholder="https://api.example.com/endpoint" />
      <button class="amiga-button" @click="sendRequest" :disabled="!url || loading">
        {{ loading ? 'Sending...' : 'Send' }}
      </button>
    </div>

    <div class="api-tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        class="tab-button"
        :class="{ active: activeTab === tab }"
        @click="activeTab = tab"
      >
        {{ tab }}
      </button>
    </div>

    <div class="api-content">
      <!-- Headers Tab -->
      <div v-if="activeTab === 'Headers'" class="headers-panel">
        <div v-for="(header, idx) in headers" :key="idx" class="header-row">
          <input v-model="header.key" class="amiga-input small-input" placeholder="Header" />
          <input v-model="header.value" class="amiga-input small-input" placeholder="Value" />
          <button class="small-button" @click="removeHeader(idx)">×</button>
        </div>
        <button class="amiga-button" @click="addHeader">+ Add Header</button>
      </div>

      <!-- Body Tab -->
      <div v-if="activeTab === 'Body'" class="body-panel">
        <div class="body-type-selector">
          <label>
            <input type="radio" v-model="bodyType" value="json" /> JSON
          </label>
          <label>
            <input type="radio" v-model="bodyType" value="text" /> Text
          </label>
          <label>
            <input type="radio" v-model="bodyType" value="form" /> Form Data
          </label>
        </div>
        <textarea
          v-if="bodyType !== 'form'"
          v-model="body"
          class="body-textarea"
          :placeholder="bodyType === 'json' ? '{ \"key\": \"value\" }' : 'Request body...'"
        ></textarea>
        <div v-else class="form-data">
          <div v-for="(item, idx) in formData" :key="idx" class="form-row">
            <input v-model="item.key" class="amiga-input small-input" placeholder="Key" />
            <input v-model="item.value" class="amiga-input small-input" placeholder="Value" />
            <button class="small-button" @click="removeFormData(idx)">×</button>
          </div>
          <button class="amiga-button" @click="addFormData">+ Add Field</button>
        </div>
      </div>

      <!-- Response Tab -->
      <div v-if="activeTab === 'Response'" class="response-panel">
        <div v-if="response" class="response-content">
          <div class="response-header">
            <span class="status-code" :class="{ success: response.status < 400, error: response.status >= 400 }">
              {{ response.status }} {{ response.statusText }}
            </span>
            <span class="response-time">{{ response.time }}ms</span>
          </div>
          <div class="response-body">
            <pre>{{ formatResponse(response.data) }}</pre>
          </div>
        </div>
        <div v-else class="no-response">Send a request to see the response</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Header {
  key: string;
  value: string;
}

interface FormDataItem {
  key: string;
  value: string;
}

interface Response {
  status: number;
  statusText: string;
  data: any;
  time: number;
}

const method = ref('GET');
const url = ref('');
const activeTab = ref('Headers');
const tabs = ['Headers', 'Body', 'Response'];
const loading = ref(false);
const bodyType = ref('json');
const body = ref('');
const response = ref<Response | null>(null);

const headers = ref<Header[]>([
  { key: 'Content-Type', value: 'application/json' }
]);

const formData = ref<FormDataItem[]>([
  { key: '', value: '' }
]);

const addHeader = () => {
  headers.value.push({ key: '', value: '' });
};

const removeHeader = (idx: number) => {
  headers.value.splice(idx, 1);
};

const addFormData = () => {
  formData.value.push({ key: '', value: '' });
};

const removeFormData = (idx: number) => {
  formData.value.splice(idx, 1);
};

const sendRequest = async () => {
  if (!url.value) return;

  loading.value = true;
  const startTime = Date.now();

  try {
    const requestHeaders: Record<string, string> = {};
    headers.value.forEach(h => {
      if (h.key && h.value) {
        requestHeaders[h.key] = h.value;
      }
    });

    let requestBody = undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method.value)) {
      if (bodyType.value === 'json') {
        requestBody = body.value;
      } else if (bodyType.value === 'form') {
        const formDataObj: Record<string, string> = {};
        formData.value.forEach(item => {
          if (item.key) formDataObj[item.key] = item.value;
        });
        requestBody = JSON.stringify(formDataObj);
      } else {
        requestBody = body.value;
      }
    }

    const res = await fetch('/api/devtools/api-tester/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: method.value,
        url: url.value,
        headers: requestHeaders,
        body: requestBody
      })
    });

    const data = await res.json();
    const endTime = Date.now();

    response.value = {
      status: data.status || res.status,
      statusText: data.statusText || res.statusText,
      data: data.data,
      time: endTime - startTime
    };

    activeTab.value = 'Response';
  } catch (err: any) {
    response.value = {
      status: 0,
      statusText: 'Error',
      data: { error: err.message },
      time: Date.now() - startTime
    };
    activeTab.value = 'Response';
  } finally {
    loading.value = false;
  }
};

const formatResponse = (data: any) => {
  if (typeof data === 'string') return data;
  return JSON.stringify(data, null, 2);
};
</script>

<style scoped>
.api-tester {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  font-family: 'Press Start 2P', monospace;
}

.api-toolbar {
  display: flex;
  gap: 4px;
  padding: 8px;
  background: #a0a0a0;
  border-bottom: 2px solid #000000;
}

.method-select {
  width: 100px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px 8px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  font-weight: bold;
  color: #0055aa;
}

.url-input {
  flex: 1;
}

.api-tabs {
  display: flex;
  background: #888888;
  border-bottom: 2px solid #000000;
}

.tab-button {
  flex: 1;
  padding: 6px 12px;
  background: #a0a0a0;
  border: none;
  border-right: 1px solid #000000;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  color: #000000;
}

.tab-button:hover {
  background: #b0b0b0;
}

.tab-button.active {
  background: #ffffff;
  font-weight: bold;
  color: #0055aa;
}

.api-content {
  flex: 1;
  overflow: auto;
  padding: 8px;
  background: #ffffff;
}

.headers-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.header-row,
.form-row {
  display: flex;
  gap: 4px;
  align-items: center;
}

.small-input {
  flex: 1;
  font-size: 7px !important;
  padding: 3px 6px !important;
}

.small-button {
  background: #ff5555;
  color: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 3px 8px;
  font-size: 8px;
  cursor: pointer;
  font-family: 'Press Start 2P', monospace;
  font-weight: bold;
}

.body-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
}

.body-type-selector {
  display: flex;
  gap: 12px;
  padding: 8px;
  background: #f0f0f0;
  border: 1px solid #cccccc;
  font-size: 7px;
}

.body-type-selector label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.body-textarea {
  flex: 1;
  min-height: 200px;
  padding: 8px;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  resize: vertical;
}

.form-data {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.response-panel {
  height: 100%;
}

.response-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
}

.response-header {
  display: flex;
  justify-content: space-between;
  padding: 6px 8px;
  background: #f0f0f0;
  border: 1px solid #cccccc;
  font-size: 7px;
}

.status-code {
  font-weight: bold;
}

.status-code.success {
  color: #00aa00;
}

.status-code.error {
  color: #ff0000;
}

.response-time {
  color: #666666;
}

.response-body {
  flex: 1;
  overflow: auto;
  background: #f8f8f8;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 8px;
}

.response-body pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 9px;
  line-height: 1.4;
  color: #000000;
}

.no-response {
  text-align: center;
  padding: 40px;
  color: #888888;
  font-size: 8px;
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
