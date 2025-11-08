<template>
  <div class="compose-overlay" @click="handleBackdropClick">
    <div class="compose-window" @click.stop>
      <!-- Title Bar -->
      <div class="compose-titlebar">
        <span class="compose-title">{{ composeTitle }}</span>
        <button class="close-button" @click="handleClose">×</button>
      </div>

      <!-- Compose Form -->
      <div class="compose-content">
        <!-- Recipients -->
        <div class="compose-row">
          <label class="compose-label">To:</label>
          <div class="compose-input-wrapper">
            <input
              type="text"
              v-model="toField"
              @input="handleToInput"
              @keydown="handleRecipientKeydown($event, 'to')"
              class="compose-input"
              placeholder="recipient@example.com"
            />
            <div v-if="toSuggestions.length > 0" class="autocomplete-dropdown">
              <div
                v-for="(suggestion, index) in toSuggestions"
                :key="index"
                :class="['autocomplete-item', { selected: toSuggestionIndex === index }]"
                @click="selectToSuggestion(suggestion)"
              >
                <span class="suggestion-name">{{ suggestion.name }}</span>
                <span class="suggestion-email">&lt;{{ suggestion.email }}&gt;</span>
              </div>
            </div>
          </div>
          <button class="toggle-button" @click="showCc = !showCc">CC</button>
          <button class="toggle-button" @click="showBcc = !showBcc">BCC</button>
        </div>

        <!-- CC Field -->
        <div v-if="showCc" class="compose-row">
          <label class="compose-label">CC:</label>
          <div class="compose-input-wrapper">
            <input
              type="text"
              v-model="ccField"
              @input="handleCcInput"
              @keydown="handleRecipientKeydown($event, 'cc')"
              class="compose-input"
              placeholder="cc@example.com"
            />
            <div v-if="ccSuggestions.length > 0" class="autocomplete-dropdown">
              <div
                v-for="(suggestion, index) in ccSuggestions"
                :key="index"
                :class="['autocomplete-item', { selected: ccSuggestionIndex === index }]"
                @click="selectCcSuggestion(suggestion)"
              >
                <span class="suggestion-name">{{ suggestion.name }}</span>
                <span class="suggestion-email">&lt;{{ suggestion.email }}&gt;</span>
              </div>
            </div>
          </div>
        </div>

        <!-- BCC Field -->
        <div v-if="showBcc" class="compose-row">
          <label class="compose-label">BCC:</label>
          <div class="compose-input-wrapper">
            <input
              type="text"
              v-model="bccField"
              @input="handleBccInput"
              @keydown="handleRecipientKeydown($event, 'bcc')"
              class="compose-input"
              placeholder="bcc@example.com"
            />
            <div v-if="bccSuggestions.length > 0" class="autocomplete-dropdown">
              <div
                v-for="(suggestion, index) in bccSuggestions"
                :key="index"
                :class="['autocomplete-item', { selected: bccSuggestionIndex === index }]"
                @click="selectBccSuggestion(suggestion)"
              >
                <span class="suggestion-name">{{ suggestion.name }}</span>
                <span class="suggestion-email">&lt;{{ suggestion.email }}&gt;</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Subject -->
        <div class="compose-row">
          <label class="compose-label">Subject:</label>
          <input
            type="text"
            v-model="subject"
            class="compose-input"
            placeholder="Email subject"
          />
        </div>

        <!-- Formatting Toolbar -->
        <div class="formatting-toolbar">
          <button class="format-button" @click="formatText('bold')" title="Bold">
            <strong>B</strong>
          </button>
          <button class="format-button" @click="formatText('italic')" title="Italic">
            <em>I</em>
          </button>
          <button class="format-button" @click="formatText('underline')" title="Underline">
            <u>U</u>
          </button>
          <div class="toolbar-separator"></div>
          <select v-model="fontSize" @change="applyFontSize" class="format-select">
            <option value="1">Small</option>
            <option value="3" selected>Normal</option>
            <option value="5">Large</option>
            <option value="7">Huge</option>
          </select>
          <input
            type="color"
            v-model="textColor"
            @change="applyTextColor"
            class="color-picker"
            title="Text Color"
          />
          <div class="toolbar-separator"></div>
          <button class="format-button" @click="formatText('insertUnorderedList')" title="Bullet List">
            •
          </button>
          <button class="format-button" @click="formatText('insertOrderedList')" title="Numbered List">
            1.
          </button>
          <button class="format-button" @click="insertLink" title="Insert Link">
            🔗
          </button>
          <div class="toolbar-separator"></div>
          <button class="format-button" @click="formatText('justifyLeft')" title="Align Left">
            ≡
          </button>
          <button class="format-button" @click="formatText('justifyCenter')" title="Align Center">
            ≡
          </button>
          <button class="format-button" @click="formatText('justifyRight')" title="Align Right">
            ≡
          </button>
          <div class="toolbar-separator"></div>
          <select v-model="selectedTemplate" @change="applyTemplate" class="format-select">
            <option value="">Templates...</option>
            <option v-for="template in templates" :key="template.id" :value="template.id">
              {{ template.name }}
            </option>
          </select>
        </div>

        <!-- Body Editor -->
        <div
          ref="bodyEditor"
          contenteditable="true"
          class="compose-body"
          @input="handleBodyInput"
          @paste="handlePaste"
        ></div>

        <!-- Attachments -->
        <div v-if="attachments.length > 0" class="attachments-section">
          <div class="attachments-header">
            <span class="attachment-icon">📎</span>
            {{ attachments.length }} Attachment{{ attachments.length > 1 ? 's' : '' }}
          </div>
          <div class="attachments-list">
            <div v-for="attachment in attachments" :key="attachment.id" class="attachment-item">
              <span class="attachment-name">{{ attachment.name }}</span>
              <span class="attachment-size">({{ formatFileSize(attachment.size) }})</span>
              <button class="remove-button" @click="removeAttachment(attachment.id)">×</button>
            </div>
          </div>
        </div>

        <!-- Status Bar -->
        <div class="compose-statusbar">
          <span v-if="autoSaveStatus" class="autosave-status">{{ autoSaveStatus }}</span>
          <span v-if="sending" class="sending-status">Sending...</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="compose-actions">
        <button class="amiga-button" @click="handleSend" :disabled="sending">
          {{ sending ? 'Sending...' : 'Send' }}
        </button>
        <button class="amiga-button" @click="handleSaveDraft">
          Save Draft
        </button>
        <button class="amiga-button" @click="handleAttachment">
          Attach File
        </button>
        <div class="actions-spacer"></div>
        <button class="amiga-button" @click="handleDiscard">
          Discard
        </button>
      </div>

      <!-- Hidden file input -->
      <input
        ref="fileInput"
        type="file"
        multiple
        @change="handleFileSelect"
        style="display: none"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { emailManager, type Email, type EmailAttachment } from '../../utils/email-manager';
import { addressBook } from '../../utils/address-book';

// ============================================================================
// PROPS & EMITS
// ============================================================================

interface Props {
  mode?: 'new' | 'reply' | 'replyAll' | 'forward';
  originalEmail?: Email | null;
  draftEmail?: Email | null;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'new',
  originalEmail: null,
  draftEmail: null
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'sent'): void;
}>();

// ============================================================================
// STATE
// ============================================================================

const toField = ref('');
const ccField = ref('');
const bccField = ref('');
const subject = ref('');
const bodyEditor = ref<HTMLDivElement | null>(null);
const attachments = ref<EmailAttachment[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);

const showCc = ref(false);
const showBcc = ref(false);
const sending = ref(false);
const autoSaveStatus = ref('');
const autoSaveTimer = ref<number | null>(null);
const draftId = ref<string | null>(null);

// Autocomplete
const toSuggestions = ref<Array<{ name: string; email: string }>>([]);
const ccSuggestions = ref<Array<{ name: string; email: string }>>([]);
const bccSuggestions = ref<Array<{ name: string; email: string }>>([]);
const toSuggestionIndex = ref(0);
const ccSuggestionIndex = ref(0);
const bccSuggestionIndex = ref(0);

// Formatting
const fontSize = ref('3');
const textColor = ref('#000000');
const selectedTemplate = ref('');

// Templates
const templates = ref(emailManager.getTemplates());

// ============================================================================
// COMPUTED
// ============================================================================

const composeTitle = computed(() => {
  switch (props.mode) {
    case 'reply':
      return 'Reply';
    case 'replyAll':
      return 'Reply All';
    case 'forward':
      return 'Forward';
    default:
      return 'New Email';
  }
});

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(() => {
  initializeCompose();
  startAutoSave();
});

onUnmounted(() => {
  stopAutoSave();
});

// ============================================================================
// INITIALIZATION
// ============================================================================

function initializeCompose(): void {
  if (props.draftEmail) {
    // Load draft
    toField.value = props.draftEmail.to.join(', ');
    ccField.value = props.draftEmail.cc.join(', ');
    bccField.value = props.draftEmail.bcc.join(', ');
    subject.value = props.draftEmail.subject;
    if (bodyEditor.value) {
      bodyEditor.value.innerHTML = props.draftEmail.htmlBody || props.draftEmail.body;
    }
    attachments.value = [...props.draftEmail.attachments];
    draftId.value = props.draftEmail.id;

    if (props.draftEmail.cc.length > 0) showCc.value = true;
    if (props.draftEmail.bcc.length > 0) showBcc.value = true;
  } else if (props.originalEmail) {
    // Reply or Forward
    if (props.mode === 'reply') {
      toField.value = props.originalEmail.from;
      subject.value = props.originalEmail.subject.startsWith('Re: ')
        ? props.originalEmail.subject
        : `Re: ${props.originalEmail.subject}`;

      if (bodyEditor.value) {
        bodyEditor.value.innerHTML = `<br><br><div style="border-left: 2px solid #0055aa; padding-left: 10px; color: #666666;">
          <div><strong>On ${formatFullDate(props.originalEmail.date)}, ${props.originalEmail.fromName} wrote:</strong></div>
          <div>${props.originalEmail.htmlBody || props.originalEmail.body.replace(/\n/g, '<br>')}</div>
        </div>`;
      }
    } else if (props.mode === 'replyAll') {
      toField.value = props.originalEmail.from;
      ccField.value = [...props.originalEmail.to, ...props.originalEmail.cc]
        .filter(email => email !== 'user@workbench.local')
        .join(', ');
      showCc.value = true;

      subject.value = props.originalEmail.subject.startsWith('Re: ')
        ? props.originalEmail.subject
        : `Re: ${props.originalEmail.subject}`;

      if (bodyEditor.value) {
        bodyEditor.value.innerHTML = `<br><br><div style="border-left: 2px solid #0055aa; padding-left: 10px; color: #666666;">
          <div><strong>On ${formatFullDate(props.originalEmail.date)}, ${props.originalEmail.fromName} wrote:</strong></div>
          <div>${props.originalEmail.htmlBody || props.originalEmail.body.replace(/\n/g, '<br>')}</div>
        </div>`;
      }
    } else if (props.mode === 'forward') {
      subject.value = props.originalEmail.subject.startsWith('Fwd: ')
        ? props.originalEmail.subject
        : `Fwd: ${props.originalEmail.subject}`;

      if (bodyEditor.value) {
        bodyEditor.value.innerHTML = `<br><br><div style="border-left: 2px solid #0055aa; padding-left: 10px; color: #666666;">
          <div><strong>---------- Forwarded message ----------</strong></div>
          <div><strong>From:</strong> ${props.originalEmail.fromName} &lt;${props.originalEmail.from}&gt;</div>
          <div><strong>Date:</strong> ${formatFullDate(props.originalEmail.date)}</div>
          <div><strong>Subject:</strong> ${props.originalEmail.subject}</div>
          <div><strong>To:</strong> ${props.originalEmail.to.join(', ')}</div>
          <br>
          <div>${props.originalEmail.htmlBody || props.originalEmail.body.replace(/\n/g, '<br>')}</div>
        </div>`;
      }

      // Copy attachments for forward
      attachments.value = [...props.originalEmail.attachments];
    }
  }

  // Focus on appropriate field
  if (!toField.value) {
    setTimeout(() => {
      const toInput = document.querySelector('.compose-input') as HTMLInputElement;
      toInput?.focus();
    }, 100);
  } else {
    setTimeout(() => {
      bodyEditor.value?.focus();
    }, 100);
  }
}

// ============================================================================
// AUTO-SAVE
// ============================================================================

function startAutoSave(): void {
  autoSaveTimer.value = window.setInterval(() => {
    saveDraft(true);
  }, 30000); // Auto-save every 30 seconds
}

function stopAutoSave(): void {
  if (autoSaveTimer.value) {
    clearInterval(autoSaveTimer.value);
    autoSaveTimer.value = null;
  }
}

function saveDraft(auto = false): void {
  const toEmails = parseEmails(toField.value);
  const ccEmails = parseEmails(ccField.value);
  const bccEmails = parseEmails(bccField.value);
  const body = bodyEditor.value?.textContent || '';
  const htmlBody = bodyEditor.value?.innerHTML || '';

  // Don't save if completely empty
  if (!toEmails.length && !subject.value && !body) {
    return;
  }

  const draft = emailManager.saveDraft({
    id: draftId.value || undefined,
    to: toEmails,
    cc: ccEmails,
    bcc: bccEmails,
    subject: subject.value,
    body,
    htmlBody,
    attachments: attachments.value
  });

  draftId.value = draft.id;

  if (auto) {
    autoSaveStatus.value = 'Draft saved';
    setTimeout(() => {
      autoSaveStatus.value = '';
    }, 2000);
  }
}

// ============================================================================
// AUTOCOMPLETE
// ============================================================================

function handleToInput(): void {
  const lastEmail = toField.value.split(',').pop()?.trim() || '';
  if (lastEmail.length > 0) {
    toSuggestions.value = addressBook.getEmailSuggestions(lastEmail, 5);
    toSuggestionIndex.value = 0;
  } else {
    toSuggestions.value = [];
  }
}

function handleCcInput(): void {
  const lastEmail = ccField.value.split(',').pop()?.trim() || '';
  if (lastEmail.length > 0) {
    ccSuggestions.value = addressBook.getEmailSuggestions(lastEmail, 5);
    ccSuggestionIndex.value = 0;
  } else {
    ccSuggestions.value = [];
  }
}

function handleBccInput(): void {
  const lastEmail = bccField.value.split(',').pop()?.trim() || '';
  if (lastEmail.length > 0) {
    bccSuggestions.value = addressBook.getEmailSuggestions(lastEmail, 5);
    bccSuggestionIndex.value = 0;
  } else {
    bccSuggestions.value = [];
  }
}

function handleRecipientKeydown(event: KeyboardEvent, field: 'to' | 'cc' | 'bcc'): void {
  const suggestions = field === 'to' ? toSuggestions.value :
                      field === 'cc' ? ccSuggestions.value :
                      bccSuggestions.value;

  if (suggestions.length === 0) return;

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    if (field === 'to') {
      toSuggestionIndex.value = (toSuggestionIndex.value + 1) % suggestions.length;
    } else if (field === 'cc') {
      ccSuggestionIndex.value = (ccSuggestionIndex.value + 1) % suggestions.length;
    } else {
      bccSuggestionIndex.value = (bccSuggestionIndex.value + 1) % suggestions.length;
    }
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    if (field === 'to') {
      toSuggestionIndex.value = toSuggestionIndex.value === 0 ? suggestions.length - 1 : toSuggestionIndex.value - 1;
    } else if (field === 'cc') {
      ccSuggestionIndex.value = ccSuggestionIndex.value === 0 ? suggestions.length - 1 : ccSuggestionIndex.value - 1;
    } else {
      bccSuggestionIndex.value = bccSuggestionIndex.value === 0 ? suggestions.length - 1 : bccSuggestionIndex.value - 1;
    }
  } else if (event.key === 'Enter' || event.key === 'Tab') {
    event.preventDefault();
    const index = field === 'to' ? toSuggestionIndex.value :
                  field === 'cc' ? ccSuggestionIndex.value :
                  bccSuggestionIndex.value;
    const suggestion = suggestions[index];
    if (suggestion) {
      if (field === 'to') selectToSuggestion(suggestion);
      else if (field === 'cc') selectCcSuggestion(suggestion);
      else selectBccSuggestion(suggestion);
    }
  }
}

function selectToSuggestion(suggestion: { name: string; email: string }): void {
  const emails = toField.value.split(',').map(e => e.trim()).filter(e => e);
  emails[emails.length - 1] = suggestion.email;
  toField.value = emails.join(', ') + ', ';
  toSuggestions.value = [];
}

function selectCcSuggestion(suggestion: { name: string; email: string }): void {
  const emails = ccField.value.split(',').map(e => e.trim()).filter(e => e);
  emails[emails.length - 1] = suggestion.email;
  ccField.value = emails.join(', ') + ', ';
  ccSuggestions.value = [];
}

function selectBccSuggestion(suggestion: { name: string; email: string }): void {
  const emails = bccField.value.split(',').map(e => e.trim()).filter(e => e);
  emails[emails.length - 1] = suggestion.email;
  bccField.value = emails.join(', ') + ', ';
  bccSuggestions.value = [];
}

// ============================================================================
// FORMATTING
// ============================================================================

function formatText(command: string): void {
  document.execCommand(command, false, undefined);
  bodyEditor.value?.focus();
}

function applyFontSize(): void {
  document.execCommand('fontSize', false, fontSize.value);
  bodyEditor.value?.focus();
}

function applyTextColor(): void {
  document.execCommand('foreColor', false, textColor.value);
  bodyEditor.value?.focus();
}

function insertLink(): void {
  const url = prompt('Enter URL:');
  if (url) {
    document.execCommand('createLink', false, url);
  }
  bodyEditor.value?.focus();
}

function applyTemplate(): void {
  if (!selectedTemplate.value) return;

  const template = templates.value.find(t => t.id === selectedTemplate.value);
  if (template) {
    subject.value = template.subject;
    if (bodyEditor.value) {
      bodyEditor.value.innerHTML = template.body.replace(/\n/g, '<br>');
    }
  }

  selectedTemplate.value = '';
}

function handleBodyInput(): void {
  // Trigger auto-save on body changes
}

function handlePaste(event: ClipboardEvent): void {
  event.preventDefault();
  const text = event.clipboardData?.getData('text/plain') || '';
  document.execCommand('insertText', false, text);
}

// ============================================================================
// ATTACHMENTS
// ============================================================================

function handleAttachment(): void {
  fileInput.value?.click();
}

function handleFileSelect(event: Event): void {
  const files = (event.target as HTMLInputElement).files;
  if (!files) return;

  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      attachments.value.push({
        id: `attach-${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        data: base64
      });
    };
    reader.readAsDataURL(file);
  });

  // Reset file input
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

function removeAttachment(id: string): void {
  attachments.value = attachments.value.filter(a => a.id !== id);
}

// ============================================================================
// ACTIONS
// ============================================================================

async function handleSend(): Promise<void> {
  const toEmails = parseEmails(toField.value);
  const ccEmails = parseEmails(ccField.value);
  const bccEmails = parseEmails(bccField.value);

  if (toEmails.length === 0) {
    alert('Please enter at least one recipient');
    return;
  }

  sending.value = true;

  try {
    await emailManager.sendEmail({
      to: toEmails,
      cc: ccEmails,
      bcc: bccEmails,
      subject: subject.value,
      body: bodyEditor.value?.textContent || '',
      htmlBody: bodyEditor.value?.innerHTML || '',
      attachments: attachments.value,
      threadId: props.originalEmail?.threadId,
      inReplyTo: props.mode === 'reply' || props.mode === 'replyAll' ? props.originalEmail?.id : undefined
    });

    // Delete draft if exists
    if (draftId.value) {
      emailManager.deleteEmails([draftId.value], true);
    }

    // Update interaction counts
    toEmails.forEach(email => addressBook.incrementInteractionCount(email));
    ccEmails.forEach(email => addressBook.incrementInteractionCount(email));

    emit('sent');
    emit('close');
  } catch (error) {
    console.error('Failed to send email:', error);
    alert('Failed to send email');
  } finally {
    sending.value = false;
  }
}

function handleSaveDraft(): void {
  saveDraft(false);
  alert('Draft saved');
}

function handleDiscard(): void {
  if (confirm('Discard this email?')) {
    if (draftId.value) {
      emailManager.deleteEmails([draftId.value], true);
    }
    emit('close');
  }
}

function handleClose(): void {
  // Auto-save before closing
  saveDraft(true);
  emit('close');
}

function handleBackdropClick(): void {
  // Save and close
  handleClose();
}

// ============================================================================
// UTILITY
// ============================================================================

function parseEmails(input: string): string[] {
  return input
    .split(',')
    .map(e => e.trim())
    .filter(e => e && e.includes('@'));
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
.compose-overlay {
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

.compose-window {
  width: 90%;
  max-width: 800px;
  height: 90%;
  max-height: 700px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  display: flex;
  flex-direction: column;
  font-family: 'Press Start 2P', monospace;
}

.compose-titlebar {
  padding: 8px;
  background: #0055aa;
  color: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #000000;
}

.compose-title {
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

.compose-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.compose-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-bottom: 1px solid #888888;
}

.compose-label {
  min-width: 60px;
  font-size: 8px;
}

.compose-input-wrapper {
  flex: 1;
  position: relative;
}

.compose-input {
  width: 100%;
  padding: 4px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
}

.toggle-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 8px;
  font-size: 7px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
}

.toggle-button:hover {
  background: #b0b0b0;
}

.toggle-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #ffffff;
  border: 2px solid #000000;
  max-height: 150px;
  overflow-y: auto;
  z-index: 100;
}

.autocomplete-item {
  padding: 6px;
  cursor: pointer;
  font-size: 7px;
  border-bottom: 1px solid #cccccc;
  display: flex;
  gap: 8px;
}

.autocomplete-item:hover,
.autocomplete-item.selected {
  background: #0055aa;
  color: #ffffff;
}

.suggestion-name {
  font-weight: bold;
}

.suggestion-email {
  color: #666666;
}

.autocomplete-item:hover .suggestion-email,
.autocomplete-item.selected .suggestion-email {
  color: #ffffff;
}

.formatting-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #888888;
  border-bottom: 2px solid #000000;
}

.format-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 8px;
  font-size: 10px;
  cursor: pointer;
  min-width: 28px;
}

.format-button:hover {
  background: #b0b0b0;
}

.format-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
}

.format-select {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px;
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
}

.color-picker {
  width: 40px;
  height: 24px;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  cursor: pointer;
}

.toolbar-separator {
  width: 2px;
  height: 20px;
  background: #000000;
  margin: 0 4px;
}

.compose-body {
  flex: 1;
  padding: 12px;
  background: #ffffff;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  line-height: 1.6;
  border: none;
  outline: none;
}

.compose-body:empty:before {
  content: 'Compose your message...';
  color: #999999;
}

.attachments-section {
  padding: 8px;
  background: #f0f0f0;
  border-top: 2px solid #888888;
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

.remove-button {
  background: #ff0000;
  color: #ffffff;
  border: none;
  width: 20px;
  height: 20px;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}

.remove-button:hover {
  background: #cc0000;
}

.compose-statusbar {
  padding: 4px 8px;
  background: #888888;
  border-top: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  font-size: 7px;
  display: flex;
  gap: 12px;
}

.autosave-status {
  color: #00ff00;
}

.sending-status {
  color: #ffaa00;
}

.compose-actions {
  padding: 8px;
  display: flex;
  gap: 8px;
  border-top: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 12px;
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

.actions-spacer {
  flex: 1;
}

.attachment-icon {
  margin-right: 4px;
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
