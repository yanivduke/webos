/**
 * Email API Routes
 * Mock email server with simulated SMTP functionality
 */

const express = require('express');
const router = express.Router();

// ============================================================================
// IN-MEMORY DATA STORE
// ============================================================================

// Mock email database
let emails = [];
let folders = [
  {
    id: 'inbox',
    name: 'Inbox',
    type: 'inbox',
    count: 0,
    unread: 0,
    icon: '📥'
  },
  {
    id: 'sent',
    name: 'Sent',
    type: 'sent',
    count: 0,
    unread: 0,
    icon: '📤'
  },
  {
    id: 'drafts',
    name: 'Drafts',
    type: 'drafts',
    count: 0,
    unread: 0,
    icon: '📝'
  },
  {
    id: 'trash',
    name: 'Trash',
    type: 'trash',
    count: 0,
    unread: 0,
    icon: '🗑'
  }
];

let contacts = [];
let filters = [];

// Initialize with sample emails on server start
initializeSampleEmails();

// ============================================================================
// INITIALIZATION
// ============================================================================

function initializeSampleEmails() {
  const now = new Date();

  const sampleEmails = [
    {
      from: 'admin@commodore.com',
      fromName: 'Commodore Support',
      to: ['user@workbench.local'],
      subject: 'Welcome to AmigaOS Email Server',
      body: 'Welcome to the AmigaOS Email Server!\n\nThis is a mock email server with full REST API support.\n\nFeatures:\n- Send and receive emails\n- Folder management\n- Search functionality\n- Attachment support\n\nEnjoy!',
      date: new Date(now - 1000 * 60 * 60), // 1 hour ago
      read: false,
      starred: true,
      folder: 'inbox'
    },
    {
      from: 'system@workbench.local',
      fromName: 'System Administrator',
      to: ['user@workbench.local'],
      subject: 'Server Status Report',
      body: 'Your email server is running properly.\n\nServer uptime: 100%\nEmails processed: 42\nStorage used: 1.2 MB\n\nAll systems operational.',
      date: new Date(now - 1000 * 60 * 120), // 2 hours ago
      read: false,
      starred: false,
      folder: 'inbox'
    },
    {
      from: 'test@example.com',
      fromName: 'Test User',
      to: ['user@workbench.local'],
      subject: 'Test Email with HTML',
      body: 'This is a test email.',
      htmlBody: '<h3>Test Email</h3><p>This is a <strong>test email</strong> with <em>HTML formatting</em>.</p><p style="color: #0055aa;">Amiga Blue Text!</p>',
      date: new Date(now - 1000 * 60 * 180), // 3 hours ago
      read: true,
      starred: false,
      folder: 'inbox'
    }
  ];

  sampleEmails.forEach((email, index) => {
    emails.push({
      id: `email-${Date.now()}-${index}`,
      ...email,
      cc: email.cc || [],
      bcc: email.bcc || [],
      attachments: email.attachments || [],
      threadId: generateThreadId(email.subject),
      labels: []
    });
  });

  updateFolderCounts();
}

function generateThreadId(subject) {
  const cleanSubject = subject
    .replace(/^(Re|Fwd|Fw):\s*/gi, '')
    .toLowerCase()
    .trim();

  let hash = 0;
  for (let i = 0; i < cleanSubject.length; i++) {
    const char = cleanSubject.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return `thread-${Math.abs(hash)}`;
}

function updateFolderCounts() {
  folders.forEach(folder => {
    const folderEmails = emails.filter(e => e.folder === folder.id);
    folder.count = folderEmails.length;
    folder.unread = folderEmails.filter(e => !e.read).length;
  });
}

// ============================================================================
// FOLDER ROUTES
// ============================================================================

// GET /api/email/folders - Get all folders
router.get('/folders', (req, res) => {
  updateFolderCounts();
  res.json(folders);
});

// GET /api/email/folders/:id/emails - Get emails in folder
router.get('/folders/:id/emails', (req, res) => {
  const folderId = req.params.id;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;

  const folderEmails = emails
    .filter(e => e.folder === folderId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const total = folderEmails.length;
  const pages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const paginatedEmails = folderEmails.slice(start, start + pageSize);

  res.json({
    emails: paginatedEmails,
    total,
    pages,
    page
  });
});

// POST /api/email/folders - Create new folder
router.post('/folders', (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Folder name is required' });
  }

  const folder = {
    id: `folder-${Date.now()}`,
    name,
    type: 'custom',
    count: 0,
    unread: 0,
    icon: '📁'
  };

  folders.push(folder);
  res.status(201).json(folder);
});

// DELETE /api/email/folders/:id - Delete folder
router.delete('/folders/:id', (req, res) => {
  const folderId = req.params.id;
  const folder = folders.find(f => f.id === folderId);

  if (!folder) {
    return res.status(404).json({ error: 'Folder not found' });
  }

  if (folder.type !== 'custom') {
    return res.status(400).json({ error: 'Cannot delete system folders' });
  }

  // Move emails to inbox
  emails.forEach(email => {
    if (email.folder === folderId) {
      email.folder = 'inbox';
    }
  });

  folders = folders.filter(f => f.id !== folderId);
  updateFolderCounts();

  res.json({ success: true });
});

// PUT /api/email/folders/:id - Rename folder
router.put('/folders/:id', (req, res) => {
  const folderId = req.params.id;
  const { name } = req.body;

  const folder = folders.find(f => f.id === folderId);

  if (!folder) {
    return res.status(404).json({ error: 'Folder not found' });
  }

  if (folder.type !== 'custom') {
    return res.status(400).json({ error: 'Cannot rename system folders' });
  }

  folder.name = name;
  res.json(folder);
});

// ============================================================================
// EMAIL ROUTES
// ============================================================================

// GET /api/email/emails/:id - Get single email
router.get('/emails/:id', (req, res) => {
  const email = emails.find(e => e.id === req.params.id);

  if (!email) {
    return res.status(404).json({ error: 'Email not found' });
  }

  res.json(email);
});

// POST /api/email/send - Send email (mock with delay)
router.post('/send', async (req, res) => {
  const { to, cc, bcc, subject, body, htmlBody, attachments, threadId, inReplyTo } = req.body;

  if (!to || to.length === 0) {
    return res.status(400).json({ error: 'At least one recipient is required' });
  }

  // Simulate SMTP delay (1-2 seconds)
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

  const email = {
    id: `email-${Date.now()}-${Math.random()}`,
    from: 'user@workbench.local',
    fromName: 'User',
    to,
    cc: cc || [],
    bcc: bcc || [],
    subject: subject || '(No Subject)',
    body: body || '',
    htmlBody,
    date: new Date(),
    read: true,
    starred: false,
    folder: 'sent',
    attachments: attachments || [],
    threadId: threadId || generateThreadId(subject || ''),
    inReplyTo,
    labels: []
  };

  emails.push(email);
  updateFolderCounts();

  res.status(201).json(email);
});

// POST /api/email/draft - Save draft
router.post('/draft', (req, res) => {
  const { id, to, cc, bcc, subject, body, htmlBody, attachments } = req.body;

  // Check if updating existing draft
  if (id) {
    const existingIndex = emails.findIndex(e => e.id === id);
    if (existingIndex !== -1) {
      emails[existingIndex] = {
        ...emails[existingIndex],
        to: to || [],
        cc: cc || [],
        bcc: bcc || [],
        subject: subject || '',
        body: body || '',
        htmlBody,
        attachments: attachments || [],
        date: new Date()
      };
      updateFolderCounts();
      return res.json(emails[existingIndex]);
    }
  }

  // Create new draft
  const draft = {
    id: `email-${Date.now()}-${Math.random()}`,
    from: 'user@workbench.local',
    fromName: 'User',
    to: to || [],
    cc: cc || [],
    bcc: bcc || [],
    subject: subject || '(No Subject)',
    body: body || '',
    htmlBody,
    date: new Date(),
    read: true,
    starred: false,
    folder: 'drafts',
    attachments: attachments || [],
    threadId: generateThreadId(subject || ''),
    labels: []
  };

  emails.push(draft);
  updateFolderCounts();

  res.status(201).json(draft);
});

// PUT /api/email/emails/:id - Update email (read status, starred, etc.)
router.put('/emails/:id', (req, res) => {
  const email = emails.find(e => e.id === req.params.id);

  if (!email) {
    return res.status(404).json({ error: 'Email not found' });
  }

  // Update allowed fields
  if (req.body.read !== undefined) email.read = req.body.read;
  if (req.body.starred !== undefined) email.starred = req.body.starred;
  if (req.body.folder !== undefined) email.folder = req.body.folder;
  if (req.body.labels !== undefined) email.labels = req.body.labels;

  updateFolderCounts();
  res.json(email);
});

// DELETE /api/email/emails/:id - Delete email
router.delete('/emails/:id', (req, res) => {
  const permanent = req.query.permanent === 'true';
  const emailId = req.params.id;

  if (permanent) {
    emails = emails.filter(e => e.id !== emailId);
  } else {
    const email = emails.find(e => e.id === emailId);
    if (email) {
      email.folder = 'trash';
    }
  }

  updateFolderCounts();
  res.json({ success: true });
});

// POST /api/email/move - Move emails to folder
router.post('/move', (req, res) => {
  const { emailIds, folderId } = req.body;

  if (!emailIds || !Array.isArray(emailIds)) {
    return res.status(400).json({ error: 'Email IDs array is required' });
  }

  if (!folderId) {
    return res.status(400).json({ error: 'Folder ID is required' });
  }

  emailIds.forEach(id => {
    const email = emails.find(e => e.id === id);
    if (email) {
      email.folder = folderId;
    }
  });

  updateFolderCounts();
  res.json({ success: true, moved: emailIds.length });
});

// POST /api/email/bulk-update - Bulk update emails
router.post('/bulk-update', (req, res) => {
  const { emailIds, updates } = req.body;

  if (!emailIds || !Array.isArray(emailIds)) {
    return res.status(400).json({ error: 'Email IDs array is required' });
  }

  let updated = 0;
  emailIds.forEach(id => {
    const email = emails.find(e => e.id === id);
    if (email) {
      if (updates.read !== undefined) email.read = updates.read;
      if (updates.starred !== undefined) email.starred = updates.starred;
      if (updates.folder !== undefined) email.folder = updates.folder;
      updated++;
    }
  });

  updateFolderCounts();
  res.json({ success: true, updated });
});

// GET /api/email/search - Search emails
router.get('/search', (req, res) => {
  const query = req.query.q;
  const folderId = req.query.folder;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const lowerQuery = query.toLowerCase();

  let results = emails.filter(email => {
    const matchesQuery =
      email.subject.toLowerCase().includes(lowerQuery) ||
      email.body.toLowerCase().includes(lowerQuery) ||
      email.from.toLowerCase().includes(lowerQuery) ||
      email.fromName.toLowerCase().includes(lowerQuery) ||
      email.to.some(t => t.toLowerCase().includes(lowerQuery));

    const matchesFolder = !folderId || email.folder === folderId;

    return matchesQuery && matchesFolder;
  });

  results = results.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json({
    results,
    total: results.length
  });
});

// GET /api/email/thread/:threadId - Get thread
router.get('/thread/:threadId', (req, res) => {
  const threadEmails = emails
    .filter(e => e.threadId === req.params.threadId)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  res.json(threadEmails);
});

// ============================================================================
// CONTACT ROUTES
// ============================================================================

// GET /api/email/contacts - Get all contacts
router.get('/contacts', (req, res) => {
  res.json(contacts);
});

// POST /api/email/contacts - Add contact
router.post('/contacts', (req, res) => {
  const { name, email, company, phone, notes, tags } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const contact = {
    id: `contact-${Date.now()}`,
    name,
    email,
    company,
    phone,
    notes,
    tags: tags || [],
    created: new Date(),
    modified: new Date(),
    favorited: false,
    interactionCount: 0
  };

  contacts.push(contact);
  res.status(201).json(contact);
});

// PUT /api/email/contacts/:id - Update contact
router.put('/contacts/:id', (req, res) => {
  const contact = contacts.find(c => c.id === req.params.id);

  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  Object.assign(contact, req.body, { modified: new Date() });
  res.json(contact);
});

// DELETE /api/email/contacts/:id - Delete contact
router.delete('/contacts/:id', (req, res) => {
  contacts = contacts.filter(c => c.id !== req.params.id);
  res.json({ success: true });
});

// ============================================================================
// STATISTICS & UTILITIES
// ============================================================================

// GET /api/email/stats - Get email statistics
router.get('/stats', (req, res) => {
  updateFolderCounts();

  const stats = {
    totalEmails: emails.length,
    unreadCount: emails.filter(e => !e.read && e.folder === 'inbox').length,
    starredCount: emails.filter(e => e.starred).length,
    folders: folders.map(f => ({
      id: f.id,
      name: f.name,
      count: f.count,
      unread: f.unread
    })),
    contactCount: contacts.length
  };

  res.json(stats);
});

// POST /api/email/empty-trash - Empty trash folder
router.post('/empty-trash', (req, res) => {
  const trashCount = emails.filter(e => e.folder === 'trash').length;
  emails = emails.filter(e => e.folder !== 'trash');
  updateFolderCounts();

  res.json({ success: true, deleted: trashCount });
});

// GET /api/email/health - Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'email',
    uptime: process.uptime(),
    emails: emails.length,
    folders: folders.length,
    contacts: contacts.length
  });
});

module.exports = router;
