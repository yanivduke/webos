<template>
  <div class="amiga-file">
    <div class="file-header">
      <div class="file-icon">📄</div>
      <div class="file-name">{{ name }}</div>
      <div class="file-actions">
        <button class="btn-small" @click="showOpenDialog = true">▶️</button>
        <button class="btn-small" @click="showRenameDialog = true">✏️</button>
        <button class="btn-small" @click="showDeleteDialog = true">🗑️</button>
      </div>
    </div>

    <div class="file-content">
      <slot></slot>
    </div>

    <!-- Open Dialog -->
    <v-dialog v-model="showOpenDialog" max-width="400">
      <v-card>
        <v-card-title>Open File</v-card-title>
        <v-card-text>
          <p>Opening {{ name }}...</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="openFile">Open</v-btn>
          <v-btn color="grey" @click="showOpenDialog = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Rename Dialog -->
    <v-dialog v-model="showRenameDialog" max-width="400">
      <v-card>
        <v-card-title>Renaming File</v-card-title>
        <v-card-text>
          <v-text-field v-model="newName" label="New Name"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="renameFile">Rename</v-btn>
          <v-btn color="grey" @click="showRenameDialog = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title>Confirm Delete</v-card-title>
        <v-card-text>
          <p>Are you sure you want to delete this file?</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" @click="deleteFile">Delete</v-btn>
          <v-btn color="grey" @click="showDeleteDialog = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

// Define file properties
const name = ref('document.txt');
const showOpenDialog = ref(false);
const showRenameDialog = ref(false);
const showDeleteDialog = ref(false);
const newName = ref('');

// Functions
const openFile = () => {
  console.log(`Opening file: ${name.value}`);
  showOpenDialog.value = false;
};

const renameFile = () => {
  if (newName.value) {
    name.value = newName.value;
    newName.value = '';
    showRenameDialog.value = false;
  }
};

const deleteFile = () => {
  name.value = 'Deleted File';
  showDeleteDialog.value = false;
};
</script>

<style scoped>
.amiga-file {
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.4);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  margin: 10px 0;
  padding: 10px;
}

.file-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-weight: bold;
}

.file-icon {
  font-size: 18px;
  margin-right: 10px;
  color: #00ffcc;
}

.file-name {
  flex: 1;
  font-size: 14px;
}

.file-actions {
  display: flex;
  gap: 8px;
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(0, 0, 0, 0.3);
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-small:hover {
  background: rgba(0, 255, 204, 0.2);
  border-color: #00ffcc;
}

.file-content {
  padding: 15px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  margin: 10px 0;
}
</style>