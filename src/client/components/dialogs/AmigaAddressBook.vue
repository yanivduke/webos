<template>
  <div class="addressbook-overlay" @click="emit('close')">
    <div class="addressbook-window" @click.stop>
      <!-- Title Bar -->
      <div class="addressbook-titlebar">
        <span class="addressbook-title">Address Book</span>
        <button class="close-button" @click="emit('close')">×</button>
      </div>

      <!-- Toolbar -->
      <div class="addressbook-toolbar">
        <div class="search-container">
          <input
            type="text"
            v-model="searchQuery"
            @input="handleSearch"
            placeholder="Search contacts..."
            class="search-input"
          />
        </div>
        <div class="toolbar-spacer"></div>
        <button class="amiga-button" @click="openAddContact">
          + New Contact
        </button>
        <button class="amiga-button" :disabled="!selectedContact" @click="openEditContact">
          Edit
        </button>
        <button class="amiga-button" :disabled="!selectedContact" @click="deleteContact">
          Delete
        </button>
        <div class="toolbar-separator"></div>
        <button class="amiga-button" @click="exportContacts">
          Export
        </button>
        <button class="amiga-button" @click="importContacts">
          Import
        </button>
      </div>

      <!-- Main Content -->
      <div class="addressbook-content">
        <!-- Contact List (Left) -->
        <div class="contact-list-pane">
          <div class="filter-tabs">
            <button
              :class="['filter-tab', { active: filterMode === 'all' }]"
              @click="filterMode = 'all'"
            >
              All ({{ allContacts.length }})
            </button>
            <button
              :class="['filter-tab', { active: filterMode === 'favorites' }]"
              @click="filterMode = 'favorites'"
            >
              ★ Favorites
            </button>
            <button
              :class="['filter-tab', { active: filterMode === 'frequent' }]"
              @click="filterMode = 'frequent'"
            >
              Frequent
            </button>
          </div>

          <div class="contact-list">
            <div
              v-for="contact in filteredContacts"
              :key="contact.id"
              :class="['contact-item', { selected: selectedContact?.id === contact.id }]"
              @click="selectContact(contact)"
            >
              <div class="contact-avatar">
                <div v-if="contact.photo" class="contact-photo" :style="{ backgroundImage: `url(${contact.photo})` }"></div>
                <div v-else class="contact-initials">{{ getInitials(contact.name) }}</div>
              </div>
              <div class="contact-info">
                <div class="contact-name">
                  {{ contact.name }}
                  <span v-if="contact.favorited" class="favorite-star">★</span>
                </div>
                <div class="contact-email">{{ contact.email }}</div>
              </div>
            </div>

            <div v-if="filteredContacts.length === 0" class="no-contacts">
              <p>No contacts found</p>
            </div>
          </div>
        </div>

        <!-- Contact Details (Right) -->
        <div class="contact-details-pane">
          <div v-if="selectedContact" class="contact-details">
            <div class="details-header">
              <div class="contact-avatar-large">
                <div v-if="selectedContact.photo" class="contact-photo" :style="{ backgroundImage: `url(${selectedContact.photo})` }"></div>
                <div v-else class="contact-initials-large">{{ getInitials(selectedContact.name) }}</div>
              </div>
              <div class="details-header-info">
                <h3>{{ selectedContact.name }}</h3>
                <button
                  class="favorite-button"
                  @click="toggleFavorite"
                >
                  {{ selectedContact.favorited ? '★' : '☆' }} Favorite
                </button>
              </div>
            </div>

            <div class="details-body">
              <div class="detail-section">
                <div class="detail-label">Email</div>
                <div class="detail-value">{{ selectedContact.email }}</div>
              </div>

              <div v-if="selectedContact.company" class="detail-section">
                <div class="detail-label">Company</div>
                <div class="detail-value">{{ selectedContact.company }}</div>
              </div>

              <div v-if="selectedContact.phone" class="detail-section">
                <div class="detail-label">Phone</div>
                <div class="detail-value">{{ selectedContact.phone }}</div>
              </div>

              <div v-if="selectedContact.notes" class="detail-section">
                <div class="detail-label">Notes</div>
                <div class="detail-value notes">{{ selectedContact.notes }}</div>
              </div>

              <div v-if="selectedContact.tags.length > 0" class="detail-section">
                <div class="detail-label">Tags</div>
                <div class="detail-tags">
                  <span v-for="tag in selectedContact.tags" :key="tag" class="tag">
                    {{ tag }}
                  </span>
                </div>
              </div>

              <div class="detail-section">
                <div class="detail-label">Interactions</div>
                <div class="detail-value">{{ selectedContact.interactionCount }} emails</div>
              </div>

              <div class="detail-section">
                <div class="detail-label">Added</div>
                <div class="detail-value">{{ formatDate(selectedContact.created) }}</div>
              </div>
            </div>

            <div class="details-actions">
              <button class="amiga-button" @click="composeEmail">
                ✉ Compose Email
              </button>
            </div>
          </div>

          <div v-else class="no-selection">
            <p>Select a contact to view details</p>
          </div>
        </div>
      </div>

      <!-- Statistics Bar -->
      <div class="statistics-bar">
        <span>Total: {{ stats.total }}</span>
        <span>Favorites: {{ stats.favorited }}</span>
        <span>Tags: {{ stats.totalTags }}</span>
      </div>

      <!-- Hidden file input for import -->
      <input
        ref="importInput"
        type="file"
        accept=".vcf,.vcard,.json"
        @change="handleImportFile"
        style="display: none"
      />
    </div>

    <!-- Add/Edit Contact Dialog -->
    <div v-if="editDialogVisible" class="dialog-overlay" @click="closeEditDialog">
      <div class="dialog-box" @click.stop>
        <div class="dialog-header">
          {{ editingContact ? 'Edit Contact' : 'New Contact' }}
        </div>
        <div class="dialog-body">
          <div class="form-row">
            <label class="form-label">Name *</label>
            <input
              type="text"
              v-model="formData.name"
              class="form-input"
              placeholder="John Doe"
            />
          </div>

          <div class="form-row">
            <label class="form-label">Email *</label>
            <input
              type="email"
              v-model="formData.email"
              class="form-input"
              placeholder="john@example.com"
            />
          </div>

          <div class="form-row">
            <label class="form-label">Company</label>
            <input
              type="text"
              v-model="formData.company"
              class="form-input"
              placeholder="Acme Corp"
            />
          </div>

          <div class="form-row">
            <label class="form-label">Phone</label>
            <input
              type="tel"
              v-model="formData.phone"
              class="form-input"
              placeholder="555-1234"
            />
          </div>

          <div class="form-row">
            <label class="form-label">Notes</label>
            <textarea
              v-model="formData.notes"
              class="form-textarea"
              placeholder="Additional notes..."
            ></textarea>
          </div>

          <div class="form-row">
            <label class="form-label">Tags</label>
            <input
              type="text"
              v-model="formData.tagsInput"
              class="form-input"
              placeholder="work, friend, etc. (comma-separated)"
            />
          </div>

          <div class="form-row">
            <label class="form-checkbox">
              <input type="checkbox" v-model="formData.favorited" />
              Mark as favorite
            </label>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="amiga-button" @click="saveContact">
            {{ editingContact ? 'Update' : 'Add' }}
          </button>
          <button class="amiga-button" @click="closeEditDialog">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { addressBook, type Contact } from '../../utils/address-book';

// ============================================================================
// EMITS
// ============================================================================

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'composeEmail', email: string): void;
}>();

// ============================================================================
// STATE
// ============================================================================

const allContacts = ref<Contact[]>([]);
const selectedContact = ref<Contact | null>(null);
const searchQuery = ref('');
const filterMode = ref<'all' | 'favorites' | 'frequent'>('all');
const editDialogVisible = ref(false);
const editingContact = ref<Contact | null>(null);
const importInput = ref<HTMLInputElement | null>(null);

const formData = ref({
  name: '',
  email: '',
  company: '',
  phone: '',
  notes: '',
  tagsInput: '',
  favorited: false
});

const stats = ref({
  total: 0,
  favorited: 0,
  withCompany: 0,
  withPhone: 0,
  withNotes: 0,
  totalTags: 0
});

// ============================================================================
// COMPUTED
// ============================================================================

const filteredContacts = computed(() => {
  let contacts: Contact[] = [];

  if (searchQuery.value) {
    contacts = addressBook.searchContacts(searchQuery.value);
  } else {
    switch (filterMode.value) {
      case 'favorites':
        contacts = addressBook.getFavoritedContacts();
        break;
      case 'frequent':
        contacts = addressBook.getFrequentContacts(20);
        break;
      default:
        contacts = allContacts.value;
    }
  }

  return contacts;
});

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(() => {
  loadContacts();
  loadStatistics();
});

// ============================================================================
// DATA LOADING
// ============================================================================

function loadContacts(): void {
  allContacts.value = addressBook.getAllContacts();
}

function loadStatistics(): void {
  stats.value = addressBook.getStatistics();
}

// ============================================================================
// CONTACT OPERATIONS
// ============================================================================

function selectContact(contact: Contact): void {
  selectedContact.value = contact;
}

function openAddContact(): void {
  editingContact.value = null;
  formData.value = {
    name: '',
    email: '',
    company: '',
    phone: '',
    notes: '',
    tagsInput: '',
    favorited: false
  };
  editDialogVisible.value = true;
}

function openEditContact(): void {
  if (!selectedContact.value) return;

  editingContact.value = selectedContact.value;
  formData.value = {
    name: selectedContact.value.name,
    email: selectedContact.value.email,
    company: selectedContact.value.company || '',
    phone: selectedContact.value.phone || '',
    notes: selectedContact.value.notes || '',
    tagsInput: selectedContact.value.tags.join(', '),
    favorited: selectedContact.value.favorited
  };
  editDialogVisible.value = true;
}

function saveContact(): void {
  if (!formData.value.name || !formData.value.email) {
    alert('Name and email are required');
    return;
  }

  const tags = formData.value.tagsInput
    .split(',')
    .map(t => t.trim())
    .filter(t => t);

  if (editingContact.value) {
    // Update existing contact
    addressBook.updateContact(editingContact.value.id, {
      name: formData.value.name,
      email: formData.value.email,
      company: formData.value.company || undefined,
      phone: formData.value.phone || undefined,
      notes: formData.value.notes || undefined,
      tags,
      favorited: formData.value.favorited
    });
  } else {
    // Add new contact
    addressBook.addContact({
      name: formData.value.name,
      email: formData.value.email,
      company: formData.value.company || undefined,
      phone: formData.value.phone || undefined,
      notes: formData.value.notes || undefined,
      tags,
      favorited: formData.value.favorited,
      interactionCount: 0
    });
  }

  loadContacts();
  loadStatistics();
  closeEditDialog();
}

function deleteContact(): void {
  if (!selectedContact.value) return;

  if (confirm(`Delete contact "${selectedContact.value.name}"?`)) {
    addressBook.deleteContact(selectedContact.value.id);
    selectedContact.value = null;
    loadContacts();
    loadStatistics();
  }
}

function toggleFavorite(): void {
  if (!selectedContact.value) return;

  addressBook.updateContact(selectedContact.value.id, {
    favorited: !selectedContact.value.favorited
  });

  loadContacts();
  loadStatistics();

  // Update selected contact reference
  selectedContact.value = addressBook.getContact(selectedContact.value.id) || null;
}

function closeEditDialog(): void {
  editDialogVisible.value = false;
  editingContact.value = null;
}

// ============================================================================
// SEARCH & FILTER
// ============================================================================

function handleSearch(): void {
  // Computed property handles filtering
}

// ============================================================================
// IMPORT / EXPORT
// ============================================================================

function exportContacts(): void {
  const vCard = addressBook.exportVCard();
  const blob = new Blob([vCard], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'contacts.vcf';
  a.click();
  URL.revokeObjectURL(url);
}

function importContacts(): void {
  importInput.value?.click();
}

function handleImportFile(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;

    let imported = 0;
    if (file.name.endsWith('.vcf') || file.name.endsWith('.vcard')) {
      imported = addressBook.importVCard(content);
    } else if (file.name.endsWith('.json')) {
      imported = addressBook.importJSON(content);
    }

    if (imported > 0) {
      alert(`Imported ${imported} contact(s)`);
      loadContacts();
      loadStatistics();
    } else {
      alert('No new contacts imported');
    }
  };
  reader.readAsText(file);

  // Reset file input
  if (importInput.value) {
    importInput.value.value = '';
  }
}

// ============================================================================
// ACTIONS
// ============================================================================

function composeEmail(): void {
  if (selectedContact.value) {
    emit('composeEmail', selectedContact.value.email);
  }
}

// ============================================================================
// UTILITY
// ============================================================================

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
</script>

<style scoped>
.addressbook-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.addressbook-window {
  width: 90%;
  max-width: 900px;
  height: 85%;
  max-height: 650px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  display: flex;
  flex-direction: column;
  font-family: 'Press Start 2P', monospace;
}

.addressbook-titlebar {
  padding: 8px;
  background: #0055aa;
  color: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #000000;
}

.addressbook-title {
  font-size: 9px;
}

.close-button {
  background: #ff0000;
  color: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  width: 20px;
  height: 20px;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.close-button:hover {
  background: #cc0000;
}

.addressbook-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px;
  background: #a0a0a0;
  border-bottom: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.search-container {
  flex: 1;
  max-width: 300px;
}

.search-input {
  width: 100%;
  padding: 4px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
}

.toolbar-spacer {
  flex: 1;
}

.toolbar-separator {
  width: 2px;
  height: 20px;
  background: #000000;
  margin: 0 4px;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 10px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
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

.addressbook-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.contact-list-pane {
  width: 350px;
  display: flex;
  flex-direction: column;
  border-right: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.filter-tabs {
  display: flex;
  background: #888888;
  border-bottom: 2px solid #000000;
}

.filter-tab {
  flex: 1;
  padding: 6px;
  background: #a0a0a0;
  border: none;
  border-right: 1px solid #000000;
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  cursor: pointer;
}

.filter-tab:last-child {
  border-right: none;
}

.filter-tab:hover {
  background: #b0b0b0;
}

.filter-tab.active {
  background: #0055aa;
  color: #ffffff;
}

.contact-list {
  flex: 1;
  overflow-y: auto;
  background: #ffffff;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  cursor: pointer;
  border-bottom: 1px solid #cccccc;
}

.contact-item:hover {
  background: #f0f0f0;
}

.contact-item.selected {
  background: #0055aa;
  color: #ffffff;
}

.contact-avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.contact-photo {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.contact-initials {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffaa00;
  color: #000000;
  font-size: 12px;
  font-weight: bold;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.contact-info {
  flex: 1;
  min-width: 0;
}

.contact-name {
  font-size: 8px;
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorite-star {
  color: #ffaa00;
  margin-left: 4px;
}

.contact-item.selected .favorite-star {
  color: #ffff00;
}

.contact-email {
  font-size: 7px;
  color: #666666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-item.selected .contact-email {
  color: #cccccc;
}

.no-contacts {
  padding: 40px;
  text-align: center;
  color: #888888;
  font-size: 8px;
}

.contact-details-pane {
  flex: 1;
  overflow-y: auto;
  background: #ffffff;
}

.contact-details {
  padding: 20px;
}

.details-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 20px;
  border-bottom: 2px solid #cccccc;
  margin-bottom: 20px;
}

.contact-avatar-large {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}

.contact-initials-large {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffaa00;
  color: #000000;
  font-size: 24px;
  font-weight: bold;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.details-header-info h3 {
  margin: 0 0 10px 0;
  font-size: 12px;
}

.favorite-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 10px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
}

.favorite-button:hover {
  background: #b0b0b0;
}

.details-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 7px;
  font-weight: bold;
  color: #666666;
  text-transform: uppercase;
}

.detail-value {
  font-size: 9px;
  color: #000000;
}

.detail-value.notes {
  white-space: pre-wrap;
  line-height: 1.6;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  background: #0055aa;
  color: #ffffff;
  padding: 4px 8px;
  font-size: 7px;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.details-actions {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #cccccc;
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888888;
  font-size: 10px;
}

.statistics-bar {
  padding: 6px 12px;
  background: #888888;
  color: #ffffff;
  display: flex;
  gap: 20px;
  font-size: 7px;
  border-top: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.dialog-box {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  min-width: 400px;
  max-width: 500px;
}

.dialog-header {
  padding: 8px;
  background: #0055aa;
  color: #ffffff;
  font-size: 9px;
  border-bottom: 2px solid #000000;
}

.dialog-body {
  padding: 16px;
  max-height: 500px;
  overflow-y: auto;
}

.form-row {
  margin-bottom: 12px;
}

.form-label {
  display: block;
  font-size: 7px;
  margin-bottom: 4px;
}

.form-input {
  width: 100%;
  padding: 6px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
}

.form-textarea {
  width: 100%;
  min-height: 80px;
  padding: 6px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  resize: vertical;
}

.form-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 8px;
}

.dialog-footer {
  padding: 8px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

::-webkit-scrollbar {
  width: 16px;
  height: 16px;
}

::-webkit-scrollbar-track {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

::-webkit-scrollbar-thumb {
  background: #0055aa;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}
</style>
