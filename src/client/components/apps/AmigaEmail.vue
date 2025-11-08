<template>
  <div class="amiga-email">
    <!-- Top Toolbar -->
    <div class="email-toolbar">
      <button class="amiga-button toolbar-button" @click="openCompose">
        <span class="button-icon">✉</span> Compose
      </button>
      <button class="amiga-button toolbar-button" @click="refreshEmails">
        <span class="button-icon">↻</span> Refresh
      </button>
      <div class="toolbar-separator"></div>
      <div class="toolbar-search">
        <input
          type="text"
          v-model="searchQuery"
          @input="handleSearch"
          placeholder="Search emails..."
          class="search-input"
        />
      </div>
      <div class="toolbar-spacer"></div>
      <button class="amiga-button toolbar-button" @click="openAddressBook">
        <span class="button-icon">📖</span> Contacts
      </button>
      <button class="amiga-button toolbar-button" @click="openSettings">
        <span class="button-icon">⚙</span> Settings
      </button>
    </div>

    <!-- Main 3-Pane Layout -->
    <div class="email-content">
      <!-- Left Pane - Folder List -->
      <div class="folder-pane">
        <div class="folder-header">Folders</div>
        <div class="folder-list">
          <div
            v-for="folder in folders"
            :key="folder.id"
            :class="['folder-item', { selected: selectedFolderId === folder.id }]"
            @click="selectFolder(folder.id)"
            @contextmenu.prevent="showFolderContextMenu(folder, $event)"
          >
            <span class="folder-icon">{{ folder.icon }}</span>
            <span class="folder-name">{{ folder.name }}</span>
            <span v-if="folder.unread > 0" class="folder-unread">{{ folder.unread }}</span>
          </div>
        </div>
        <div class="folder-actions">
          <button class="amiga-button small-button" @click="createNewFolder">
            + New Folder
          </button>
        </div>
      </div>

      <!-- Middle Pane - Email List -->
      <div class="email-list-pane">
        <!-- Bulk Actions Toolbar -->
        <div v-if="selectedEmailIds.length > 0" class="bulk-actions">
          <span class="bulk-count">{{ selectedEmailIds.length }} selected</span>
          <button class="amiga-button tiny-button" @click="bulkMarkAsRead(true)">
            Mark Read
          </button>
          <button class="amiga-button tiny-button" @click="bulkMarkAsRead(false)">
            Mark Unread
          </button>
          <button class="amiga-button tiny-button" @click="bulkStar">
            ★ Star
          </button>
          <button class="amiga-button tiny-button" @click="showBulkMoveDialog">
            Move
          </button>
          <button class="amiga-button tiny-button" @click="bulkDelete">
            Delete
          </button>
        </div>

        <!-- Email List Header -->
        <div class="email-list-header">
          <div class="email-header-checkbox">
            <input
              type="checkbox"
              :checked="allEmailsSelected"
              @change="toggleSelectAll"
            />
          </div>
          <div class="email-header-star">★</div>
          <div class="email-header-from">From</div>
          <div class="email-header-subject">Subject</div>
          <div class="email-header-date">Date</div>
        </div>

        <!-- Email List -->
        <div class="email-list">
          <div
            v-for="email in currentEmails"
            :key="email.id"
            :class="['email-item', {
              selected: selectedEmailId === email.id,
              unread: !email.read
            }]"
            @click="selectEmail(email.id)"
          >
            <div class="email-checkbox">
              <input
                type="checkbox"
                :checked="selectedEmailIds.includes(email.id)"
                @click.stop="toggleEmailSelection(email.id)"
              />
            </div>
            <div class="email-star" @click.stop="toggleStar(email.id)">
              <span :class="{ starred: email.starred }">{{ email.starred ? '★' : '☆' }}</span>
            </div>
            <div class="email-from">
              {{ email.fromName || email.from }}
            </div>
            <div class="email-subject">
              <span v-if="email.attachments.length > 0" class="attachment-icon">📎</span>
              {{ email.subject || '(No Subject)' }}
            </div>
            <div class="email-date">
              {{ formatDate(email.date) }}
            </div>
          </div>

          <div v-if="currentEmails.length === 0" class="no-emails">
            <p>{{ searchQuery ? 'No emails found' : 'No emails in this folder' }}</p>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="email-pagination">
          <button
            class="amiga-button tiny-button"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            ◀
          </button>
          <span class="page-info">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <button
            class="amiga-button tiny-button"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            ▶
          </button>
        </div>
      </div>

      <!-- Right Pane - Email Viewer -->
      <div class="email-viewer-pane">
        <div v-if="selectedEmail" class="email-viewer">
          <!-- Email Actions -->
          <div class="email-actions">
            <button class="amiga-button tiny-button" @click="replyToEmail">
              ↩ Reply
            </button>
            <button class="amiga-button tiny-button" @click="replyAllToEmail">
              ↩↩ Reply All
            </button>
            <button class="amiga-button tiny-button" @click="forwardEmail">
              ⇨ Forward
            </button>
            <div class="action-spacer"></div>
            <button class="amiga-button tiny-button" @click="deleteCurrentEmail">
              🗑 Delete
            </button>
            <button class="amiga-button tiny-button" @click="showMoveDialog">
              📁 Move
            </button>
            <button class="amiga-button tiny-button" @click="printEmail">
              🖨 Print
            </button>
          </div>

          <!-- Email Header -->
          <div class="email-header-info">
            <div class="email-subject-line">
              <h3>{{ selectedEmail.subject || '(No Subject)' }}</h3>
              <button
                class="star-button"
                @click="toggleStar(selectedEmail.id)"
              >
                {{ selectedEmail.starred ? '★' : '☆' }}
              </button>
            </div>

            <div class="email-meta">
              <div class="meta-row">
                <span class="meta-label">From:</span>
                <span class="meta-value">
                  {{ selectedEmail.fromName }}
                  &lt;{{ selectedEmail.from }}&gt;
                </span>
              </div>
              <div class="meta-row">
                <span class="meta-label">To:</span>
                <span class="meta-value">
                  {{ selectedEmail.to.join(', ') }}
                </span>
              </div>
              <div v-if="selectedEmail.cc.length > 0" class="meta-row">
                <span class="meta-label">CC:</span>
                <span class="meta-value">
                  {{ selectedEmail.cc.join(', ') }}
                </span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Date:</span>
                <span class="meta-value">
                  {{ formatFullDate(selectedEmail.date) }}
                </span>
              </div>
            </div>

            <!-- Attachments -->
            <div v-if="selectedEmail.attachments.length > 0" class="email-attachments">
              <div class="attachments-header">
                <span class="attachment-icon">📎</span>
                {{ selectedEmail.attachments.length }} Attachment{{ selectedEmail.attachments.length > 1 ? 's' : '' }}
              </div>
              <div class="attachments-list">
                <div
                  v-for="attachment in selectedEmail.attachments"
                  :key="attachment.id"
                  class="attachment-item"
                >
                  <span class="attachment-name">{{ attachment.name }}</span>
                  <span class="attachment-size">({{ formatFileSize(attachment.size) }})</span>
                  <button class="amiga-button tiny-button" @click="downloadAttachment(attachment)">
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Email Body -->
          <div class="email-body">
            <div v-if="selectedEmail.htmlBody" v-html="sanitizedHtmlBody"></div>
            <pre v-else class="email-text-body">{{ selectedEmail.body }}</pre>
          </div>

          <!-- Thread View -->
          <div v-if="threadEmails.length > 1" class="email-thread">
            <div class="thread-header">
              <h4>Thread ({{ threadEmails.length }} messages)</h4>
            </div>
            <div class="thread-list">
              <div
                v-for="threadEmail in threadEmails"
                :key="threadEmail.id"
                :class="['thread-item', { current: threadEmail.id === selectedEmail.id }]"
                @click="selectEmail(threadEmail.id)"
              >
                <div class="thread-from">{{ threadEmail.fromName }}</div>
                <div class="thread-date">{{ formatDate(threadEmail.date) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="no-selection">
          <p>Select an email to read</p>
        </div>
      </div>
    </div>

    <!-- Folder Context Menu -->
    <div
      v-if="contextMenuVisible"
      :style="{ top: contextMenuY + 'px', left: contextMenuX + 'px' }"
      class="context-menu"
      @click="hideContextMenu"
    >
      <div v-if="contextMenuFolder" class="context-menu-content">
        <div
          v-if="contextMenuFolder.type === 'custom'"
          class="context-menu-item"
          @click="renameFolder(contextMenuFolder)"
        >
          Rename Folder
        </div>
        <div
          v-if="contextMenuFolder.type === 'trash'"
          class="context-menu-item"
          @click="emptyTrash"
        >
          Empty Trash
        </div>
        <div
          v-if="contextMenuFolder.type === 'custom'"
          class="context-menu-item danger"
          @click="deleteFolder(contextMenuFolder)"
        >
          Delete Folder
        </div>
      </div>
    </div>

    <!-- Move To Folder Dialog -->
    <div v-if="moveDialogVisible" class="dialog-overlay" @click="closeMoveDialog">
      <div class="dialog-box" @click.stop>
        <div class="dialog-header">Move to Folder</div>
        <div class="dialog-body">
          <div
            v-for="folder in folders"
            :key="folder.id"
            class="folder-option"
            @click="moveToFolder(folder.id)"
          >
            <span class="folder-icon">{{ folder.icon }}</span>
            {{ folder.name }}
          </div>
        </div>
        <div class="dialog-footer">
          <button class="amiga-button" @click="closeMoveDialog">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Email Compose Dialog -->
    <AmigaEmailCompose
      v-if="composeDialogVisible"
      :mode="composeMode"
      :originalEmail="composeOriginalEmail"
      @close="closeComposeDialog"
      @sent="handleEmailSent"
    />

    <!-- Address Book Dialog -->
    <AmigaAddressBook
      v-if="addressBookVisible"
      @close="addressBookVisible = false"
      @composeEmail="handleComposeToEmail"
    />

    <!-- Settings Dialog -->
    <AmigaEmailSettings
      v-if="settingsVisible"
      @close="settingsVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { emailManager, type Email, type Folder } from '../../utils/email-manager';
import AmigaEmailCompose from '../dialogs/AmigaEmailCompose.vue';
import AmigaAddressBook from '../dialogs/AmigaAddressBook.vue';
import AmigaEmailSettings from '../dialogs/AmigaEmailSettings.vue';

// ============================================================================
// STATE
// ============================================================================

const folders = ref<Folder[]>([]);
const currentEmails = ref<Email[]>([]);
const selectedFolderId = ref('inbox');
const selectedEmailId = ref<string | null>(null);
const selectedEmailIds = ref<string[]>([]);
const currentPage = ref(1);
const totalPages = ref(1);
const totalEmails = ref(0);
const searchQuery = ref('');
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuFolder = ref<Folder | null>(null);
const moveDialogVisible = ref(false);
const bulkMoveMode = ref(false);

// Dialog state
const composeDialogVisible = ref(false);
const composeMode = ref<'new' | 'reply' | 'replyAll' | 'forward'>('new');
const composeOriginalEmail = ref<Email | null>(null);
const addressBookVisible = ref(false);
const settingsVisible = ref(false);

// ============================================================================
// COMPUTED
// ============================================================================

const selectedEmail = computed(() => {
  if (!selectedEmailId.value) return null;
  return emailManager.getEmail(selectedEmailId.value);
});

const threadEmails = computed(() => {
  if (!selectedEmail.value) return [];
  return emailManager.getThread(selectedEmail.value.threadId);
});

const allEmailsSelected = computed(() => {
  return currentEmails.value.length > 0 &&
    currentEmails.value.every(e => selectedEmailIds.value.includes(e.id));
});

const sanitizedHtmlBody = computed(() => {
  if (!selectedEmail.value?.htmlBody) return '';
  // Basic XSS protection - in production use a proper sanitizer
  return selectedEmail.value.htmlBody
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=/gi, '');
});

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(() => {
  loadFolders();
  loadEmails();

  // Click outside context menu to close
  document.addEventListener('click', hideContextMenu);
});

// ============================================================================
// METHODS - DATA LOADING
// ============================================================================

function loadFolders(): void {
  folders.value = emailManager.getFolders();
}

function loadEmails(): void {
  if (searchQuery.value) {
    const results = emailManager.searchEmails(searchQuery.value, selectedFolderId.value);
    currentEmails.value = results.slice(0, 20);
    totalEmails.value = results.length;
    totalPages.value = Math.ceil(results.length / 20);
  } else {
    const result = emailManager.getEmails(selectedFolderId.value, currentPage.value, 20);
    currentEmails.value = result.emails;
    totalEmails.value = result.total;
    totalPages.value = result.pages;
  }

  // Mark first email as read if opening inbox
  if (currentEmails.value.length > 0 && !selectedEmailId.value) {
    selectEmail(currentEmails.value[0].id);
  }
}

function refreshEmails(): void {
  loadFolders();
  loadEmails();
  selectedEmailIds.value = [];
}

// ============================================================================
// METHODS - FOLDER OPERATIONS
// ============================================================================

function selectFolder(folderId: string): void {
  selectedFolderId.value = folderId;
  currentPage.value = 1;
  selectedEmailId.value = null;
  selectedEmailIds.value = [];
  searchQuery.value = '';
  loadEmails();
}

function createNewFolder(): void {
  const name = prompt('Enter folder name:');
  if (name) {
    emailManager.createFolder(name);
    loadFolders();
  }
}

function renameFolder(folder: Folder): void {
  const name = prompt('Enter new folder name:', folder.name);
  if (name && name !== folder.name) {
    emailManager.renameFolder(folder.id, name);
    loadFolders();
  }
}

function deleteFolder(folder: Folder): void {
  if (confirm(`Delete folder "${folder.name}"? Emails will be moved to Inbox.`)) {
    emailManager.deleteFolder(folder.id);
    loadFolders();
    loadEmails();
  }
}

function emptyTrash(): void {
  if (confirm('Permanently delete all emails in Trash?')) {
    emailManager.emptyFolder('trash');
    loadEmails();
  }
}

function showFolderContextMenu(folder: Folder, event: MouseEvent): void {
  contextMenuFolder.value = folder;
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  contextMenuVisible.value = true;
}

function hideContextMenu(): void {
  contextMenuVisible.value = false;
  contextMenuFolder.value = null;
}

// ============================================================================
// METHODS - EMAIL OPERATIONS
// ============================================================================

function selectEmail(emailId: string): void {
  selectedEmailId.value = emailId;

  // Mark as read
  const email = emailManager.getEmail(emailId);
  if (email && !email.read) {
    emailManager.markAsRead([emailId], true);
    loadFolders(); // Update unread counts
    loadEmails(); // Refresh list
  }
}

function toggleEmailSelection(emailId: string): void {
  const index = selectedEmailIds.value.indexOf(emailId);
  if (index > -1) {
    selectedEmailIds.value.splice(index, 1);
  } else {
    selectedEmailIds.value.push(emailId);
  }
}

function toggleSelectAll(): void {
  if (allEmailsSelected.value) {
    selectedEmailIds.value = [];
  } else {
    selectedEmailIds.value = currentEmails.value.map(e => e.id);
  }
}

function toggleStar(emailId: string): void {
  const email = emailManager.getEmail(emailId);
  if (email) {
    emailManager.markAsStarred([emailId], !email.starred);
    loadEmails();
  }
}

function deleteCurrentEmail(): void {
  if (selectedEmail.value) {
    emailManager.deleteEmails([selectedEmail.value.id]);
    selectedEmailId.value = null;
    loadFolders();
    loadEmails();
  }
}

// ============================================================================
// METHODS - BULK OPERATIONS
// ============================================================================

function bulkMarkAsRead(read: boolean): void {
  if (selectedEmailIds.value.length > 0) {
    emailManager.markAsRead(selectedEmailIds.value, read);
    selectedEmailIds.value = [];
    loadFolders();
    loadEmails();
  }
}

function bulkStar(): void {
  if (selectedEmailIds.value.length > 0) {
    emailManager.markAsStarred(selectedEmailIds.value, true);
    selectedEmailIds.value = [];
    loadEmails();
  }
}

function bulkDelete(): void {
  if (selectedEmailIds.value.length > 0) {
    if (confirm(`Delete ${selectedEmailIds.value.length} email(s)?`)) {
      emailManager.deleteEmails(selectedEmailIds.value);
      selectedEmailIds.value = [];
      loadFolders();
      loadEmails();
    }
  }
}

function showBulkMoveDialog(): void {
  if (selectedEmailIds.value.length > 0) {
    bulkMoveMode.value = true;
    moveDialogVisible.value = true;
  }
}

function showMoveDialog(): void {
  if (selectedEmail.value) {
    bulkMoveMode.value = false;
    moveDialogVisible.value = true;
  }
}

function moveToFolder(folderId: string): void {
  if (bulkMoveMode.value && selectedEmailIds.value.length > 0) {
    emailManager.moveToFolder(selectedEmailIds.value, folderId);
    selectedEmailIds.value = [];
  } else if (selectedEmail.value) {
    emailManager.moveToFolder([selectedEmail.value.id], folderId);
    selectedEmailId.value = null;
  }

  closeMoveDialog();
  loadFolders();
  loadEmails();
}

function closeMoveDialog(): void {
  moveDialogVisible.value = false;
  bulkMoveMode.value = false;
}

// ============================================================================
// METHODS - EMAIL ACTIONS
// ============================================================================

function openCompose(): void {
  composeMode.value = 'new';
  composeOriginalEmail.value = null;
  composeDialogVisible.value = true;
}

function replyToEmail(): void {
  if (selectedEmail.value) {
    composeMode.value = 'reply';
    composeOriginalEmail.value = selectedEmail.value;
    composeDialogVisible.value = true;
  }
}

function replyAllToEmail(): void {
  if (selectedEmail.value) {
    composeMode.value = 'replyAll';
    composeOriginalEmail.value = selectedEmail.value;
    composeDialogVisible.value = true;
  }
}

function forwardEmail(): void {
  if (selectedEmail.value) {
    composeMode.value = 'forward';
    composeOriginalEmail.value = selectedEmail.value;
    composeDialogVisible.value = true;
  }
}

function closeComposeDialog(): void {
  composeDialogVisible.value = false;
  composeOriginalEmail.value = null;
}

function handleEmailSent(): void {
  loadFolders();
  loadEmails();
}

function handleComposeToEmail(email: string): void {
  // Close address book and open compose with pre-filled recipient
  addressBookVisible.value = false;
  composeMode.value = 'new';
  composeOriginalEmail.value = null;
  composeDialogVisible.value = true;
  // Note: We'll need to pass the email to the compose dialog
  // This can be done by creating a partial email object
}

function printEmail(): void {
  if (selectedEmail.value) {
    // Create print window with email content
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Email</title>
            <style>
              body { font-family: monospace; padding: 20px; }
              .header { margin-bottom: 20px; border-bottom: 2px solid #000; }
              .meta { margin: 5px 0; }
              .label { font-weight: bold; }
              .body { white-space: pre-wrap; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>${selectedEmail.value.subject}</h2>
              <div class="meta"><span class="label">From:</span> ${selectedEmail.value.fromName} &lt;${selectedEmail.value.from}&gt;</div>
              <div class="meta"><span class="label">To:</span> ${selectedEmail.value.to.join(', ')}</div>
              <div class="meta"><span class="label">Date:</span> ${formatFullDate(selectedEmail.value.date)}</div>
            </div>
            <div class="body">${selectedEmail.value.body}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }
}

function downloadAttachment(attachment: any): void {
  // Create blob and download
  try {
    const binary = atob(attachment.data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: attachment.type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.name;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download attachment:', error);
    alert('Failed to download attachment');
  }
}

// ============================================================================
// METHODS - SEARCH & PAGINATION
// ============================================================================

function handleSearch(): void {
  currentPage.value = 1;
  loadEmails();
}

function goToPage(page: number): void {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    loadEmails();
  }
}

// ============================================================================
// METHODS - DIALOGS
// ============================================================================

function openAddressBook(): void {
  addressBookVisible.value = true;
}

function openSettings(): void {
  settingsVisible.value = true;
}

// ============================================================================
// UTILITY METHODS
// ============================================================================

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

function formatFullDate(date: Date): string {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
</script>

<style scoped>
.amiga-email {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
}

/* ============================================================================
   TOOLBAR
   ============================================================================ */

.email-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: #a0a0a0;
  border-bottom: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 8px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
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

.toolbar-button {
  padding: 4px 12px;
}

.tiny-button {
  padding: 2px 6px;
  font-size: 7px;
}

.small-button {
  padding: 3px 8px;
  font-size: 7px;
}

.button-icon {
  margin-right: 4px;
}

.toolbar-separator {
  width: 2px;
  height: 20px;
  background: #000000;
  margin: 0 4px;
}

.toolbar-search {
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

/* ============================================================================
   3-PANE LAYOUT
   ============================================================================ */

.email-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Left Pane - Folders */
.folder-pane {
  width: 200px;
  display: flex;
  flex-direction: column;
  background: #a0a0a0;
  border-right: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.folder-header {
  padding: 8px;
  background: #0055aa;
  color: #ffffff;
  font-size: 9px;
  border-bottom: 2px solid #000000;
}

.folder-list {
  flex: 1;
  overflow-y: auto;
}

.folder-item {
  padding: 6px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 8px;
  border-bottom: 1px solid #888888;
}

.folder-item:hover {
  background: #b0b0b0;
}

.folder-item.selected {
  background: #0055aa;
  color: #ffffff;
}

.folder-icon {
  font-size: 10px;
}

.folder-name {
  flex: 1;
}

.folder-unread {
  background: #ff0000;
  color: #ffffff;
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 6px;
}

.folder-actions {
  padding: 8px;
  border-top: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

/* Middle Pane - Email List */
.email-list-pane {
  width: 400px;
  display: flex;
  flex-direction: column;
  background: #a0a0a0;
  border-right: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.bulk-actions {
  padding: 4px;
  background: #0055aa;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 7px;
  border-bottom: 2px solid #000000;
}

.bulk-count {
  margin-right: 8px;
}

.email-list-header {
  display: grid;
  grid-template-columns: 30px 30px 120px 1fr 80px;
  padding: 6px 4px;
  background: #888888;
  color: #ffffff;
  font-size: 7px;
  border-bottom: 2px solid #000000;
}

.email-list {
  flex: 1;
  overflow-y: auto;
  background: #ffffff;
}

.email-item {
  display: grid;
  grid-template-columns: 30px 30px 120px 1fr 80px;
  padding: 6px 4px;
  cursor: pointer;
  border-bottom: 1px solid #cccccc;
  font-size: 7px;
  align-items: center;
}

.email-item:hover {
  background: #e0e0e0;
}

.email-item.selected {
  background: #0055aa;
  color: #ffffff;
}

.email-item.unread {
  font-weight: bold;
  background: #f0f0f0;
}

.email-checkbox {
  text-align: center;
}

.email-star {
  text-align: center;
  font-size: 12px;
  cursor: pointer;
}

.email-star .starred {
  color: #ffaa00;
}

.email-from {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.email-subject {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-icon {
  margin-right: 4px;
}

.email-date {
  text-align: right;
  font-size: 6px;
}

.no-emails {
  padding: 40px;
  text-align: center;
  color: #888888;
  font-size: 8px;
}

.email-pagination {
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-top: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  font-size: 7px;
}

.page-info {
  margin: 0 8px;
}

/* Right Pane - Email Viewer */
.email-viewer-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
}

.email-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.email-actions {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: #a0a0a0;
  border-bottom: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.action-spacer {
  flex: 1;
}

.email-header-info {
  padding: 12px;
  border-bottom: 2px solid #cccccc;
}

.email-subject-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.email-subject-line h3 {
  margin: 0;
  font-size: 10px;
}

.star-button {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
}

.email-meta {
  font-size: 7px;
  line-height: 1.6;
}

.meta-row {
  margin: 4px 0;
}

.meta-label {
  display: inline-block;
  width: 60px;
  font-weight: bold;
}

.meta-value {
  color: #333333;
}

.email-attachments {
  margin-top: 12px;
  padding: 8px;
  background: #f0f0f0;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.attachments-header {
  font-size: 8px;
  font-weight: bold;
  margin-bottom: 6px;
}

.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  background: #ffffff;
  border: 1px solid #cccccc;
  font-size: 7px;
}

.attachment-name {
  flex: 1;
}

.attachment-size {
  color: #666666;
}

.email-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  font-size: 8px;
  line-height: 1.6;
}

.email-text-body {
  white-space: pre-wrap;
  font-family: 'Courier New', monospace;
  margin: 0;
}

.email-thread {
  padding: 12px;
  border-top: 2px solid #cccccc;
}

.thread-header h4 {
  margin: 0 0 8px 0;
  font-size: 9px;
}

.thread-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.thread-item {
  padding: 6px;
  background: #f0f0f0;
  border: 1px solid #cccccc;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  font-size: 7px;
}

.thread-item:hover {
  background: #e0e0e0;
}

.thread-item.current {
  background: #0055aa;
  color: #ffffff;
  border-color: #0055aa;
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888888;
  font-size: 10px;
}

/* ============================================================================
   CONTEXT MENU
   ============================================================================ */

.context-menu {
  position: fixed;
  z-index: 1000;
}

.context-menu-content {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  min-width: 150px;
}

.context-menu-item {
  padding: 6px 12px;
  cursor: pointer;
  font-size: 8px;
  border-bottom: 1px solid #888888;
}

.context-menu-item:last-child {
  border-bottom: none;
}

.context-menu-item:hover {
  background: #0055aa;
  color: #ffffff;
}

.context-menu-item.danger:hover {
  background: #ff0000;
}

/* ============================================================================
   DIALOG
   ============================================================================ */

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-box {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  min-width: 300px;
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
  padding: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.folder-option {
  padding: 8px;
  cursor: pointer;
  font-size: 8px;
  border: 1px solid #888888;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.folder-option:hover {
  background: #0055aa;
  color: #ffffff;
}

.dialog-footer {
  padding: 8px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

/* ============================================================================
   SCROLLBARS
   ============================================================================ */

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

::-webkit-scrollbar-thumb:hover {
  background: #0066cc;
}
</style>
