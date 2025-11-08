/**
 * Email Manager Utility
 * Manages emails, folders, filters, and threading with localStorage persistence
 */

export interface EmailAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string; // base64 encoded
}

export interface Email {
  id: string;
  from: string;
  fromName: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  date: Date;
  read: boolean;
  starred: boolean;
  folder: string;
  attachments: EmailAttachment[];
  threadId: string;
  inReplyTo?: string;
  labels: string[];
}

export interface Folder {
  id: string;
  name: string;
  type: 'inbox' | 'sent' | 'drafts' | 'trash' | 'custom';
  count: number;
  unread: number;
  icon: string;
}

export interface EmailFilter {
  id: string;
  name: string;
  enabled: boolean;
  conditions: FilterCondition[];
  actions: FilterAction[];
}

export interface FilterCondition {
  field: 'from' | 'to' | 'subject' | 'body';
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith';
  value: string;
}

export interface FilterAction {
  type: 'move' | 'markRead' | 'star' | 'delete' | 'label';
  value: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

class EmailManager {
  private emails: Email[] = [];
  private folders: Folder[] = [];
  private filters: EmailFilter[] = [];
  private templates: EmailTemplate[] = [];
  private initialized = false;

  constructor() {
    this.loadFromStorage();
    if (!this.initialized) {
      this.initializeDefaultData();
    }
  }

  // ============================================================================
  // INITIALIZATION & PERSISTENCE
  // ============================================================================

  private initializeDefaultData(): void {
    // Create default folders
    this.folders = [
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

    // Generate mock emails
    this.generateMockEmails();

    // Create default templates
    this.templates = [
      {
        id: 'template-1',
        name: 'Thank You',
        subject: 'Thank You',
        body: 'Thank you for your email. I appreciate you reaching out.\n\nBest regards,'
      },
      {
        id: 'template-2',
        name: 'Out of Office',
        subject: 'Out of Office',
        body: 'I am currently out of the office and will return on [DATE]. I will respond to your email upon my return.\n\nBest regards,'
      },
      {
        id: 'template-3',
        name: 'Follow Up',
        subject: 'Following Up',
        body: 'I wanted to follow up on my previous email regarding [TOPIC].\n\nPlease let me know if you need any additional information.\n\nBest regards,'
      }
    ];

    this.initialized = true;
    this.saveToStorage();
  }

  private generateMockEmails(): void {
    const mockEmails: Partial<Email>[] = [
      {
        from: 'admin@commodore.com',
        fromName: 'Commodore Support',
        to: ['user@workbench.local'],
        subject: 'Welcome to AmigaOS Email',
        body: 'Welcome to the AmigaOS Email Client!\n\nThis is a fully functional email application with threading, filtering, and attachments support.\n\nEnjoy your retro computing experience!\n\n- Commodore Team',
        date: new Date('2025-11-08T09:00:00'),
        read: false,
        starred: true,
        folder: 'inbox'
      },
      {
        from: 'guru@amiga.com',
        fromName: 'Guru Meditation',
        to: ['user@workbench.local'],
        subject: 'System Status Report',
        body: 'Your Amiga system is running smoothly!\n\nMotorola 68040 CPU: Operating at optimal performance\nMemory: 512K Chip RAM, 512K Fast RAM available\nAll disk drives: Operational\n\nNo meditation required today.',
        date: new Date('2025-11-08T08:30:00'),
        read: false,
        starred: false,
        folder: 'inbox'
      },
      {
        from: 'demo@scene.org',
        fromName: 'Demo Scene',
        to: ['user@workbench.local'],
        subject: 'Latest Demo Party Results',
        body: 'Check out the amazing results from the latest demo party!\n\n1st place: Copper Dreams by Rebels\n2nd place: Pixel Perfect by Scoopex\n3rd place: Bits & Bytes by The Silents\n\nDownload the demos from our BBS!',
        date: new Date('2025-11-07T18:45:00'),
        read: true,
        starred: false,
        folder: 'inbox'
      },
      {
        from: 'bob@paint.com',
        fromName: 'Bob from Deluxe Paint',
        to: ['user@workbench.local'],
        subject: 'New Artwork Available',
        body: 'Hey there!\n\nI just finished a new pixel art piece using Deluxe Paint IV. It\'s a 320x256 HAM mode masterpiece!\n\nWould love to hear your thoughts.\n\nBob',
        date: new Date('2025-11-07T14:20:00'),
        read: true,
        starred: false,
        folder: 'inbox'
      },
      {
        from: 'tracker@mod.archive',
        fromName: 'MOD Archive',
        to: ['user@workbench.local'],
        subject: 'Your Weekly MOD Music Digest',
        body: 'Here are this week\'s top MOD files:\n\n• "Enigma" by Tip & Firefox\n• "Space Debris" by Captain\n• "Stardust Memories" by Mental Cube\n\nAll in glorious 4-channel ProTracker format!',
        date: new Date('2025-11-07T10:00:00'),
        read: true,
        starred: true,
        folder: 'inbox'
      },
      {
        from: 'workbench@commodore.com',
        fromName: 'Workbench Updates',
        to: ['user@workbench.local'],
        subject: 'Workbench 3.1 Tips & Tricks',
        body: 'Did you know?\n\n• You can customize your Workbench colors in Preferences\n• MultiView can display various file formats\n• The Shell supports ANSI color codes\n• You can create custom tool types for your icons\n\nMake the most of your Amiga!',
        date: new Date('2025-11-06T16:30:00'),
        read: false,
        starred: false,
        folder: 'inbox'
      },
      {
        from: 'devs@hardware.net',
        fromName: 'Hardware Dev',
        to: ['user@workbench.local'],
        subject: 'New Accelerator Card Available',
        body: 'Announcing the new 68060 accelerator card!\n\n• 50MHz CPU speed\n• 128MB Fast RAM expansion\n• SCSI-2 controller built-in\n• Full Zorro III compatibility\n\nOrder now and boost your Amiga\'s performance!',
        date: new Date('2025-11-06T11:15:00'),
        read: false,
        starred: false,
        folder: 'inbox'
      },
      {
        from: 'bbsadmin@local.bbs',
        fromName: 'Local BBS',
        to: ['user@workbench.local'],
        subject: 'New Files Available on BBS',
        body: 'The Local BBS has new files available:\n\n• Latest game demos\n• Productivity tools\n• System utilities\n• MOD music files\n\nDial in at 555-AMIGA (2400 baud)',
        date: new Date('2025-11-05T20:00:00'),
        read: true,
        starred: false,
        folder: 'inbox'
      },
      {
        from: 'games@team17.co.uk',
        fromName: 'Team17',
        to: ['user@workbench.local'],
        subject: 'Worms: The Director\'s Cut Released!',
        body: 'The ultimate version of Worms is here!\n\nNew features:\n• More weapons\n• Better AI\n• Custom level editor\n• Up to 4 players\n\nAvailable now on 3 floppy disks!',
        date: new Date('2025-11-05T15:45:00'),
        read: true,
        starred: true,
        folder: 'inbox'
      },
      {
        from: 'info@psygnosis.com',
        fromName: 'Psygnosis',
        to: ['user@workbench.local'],
        subject: 'Shadow of the Beast III Preview',
        body: 'Get ready for the epic conclusion!\n\nShadow of the Beast III features:\n• 12 layers of parallax scrolling\n• CD32 audio support\n• Enhanced graphics\n• Epic boss battles\n\nComing soon to your Amiga!',
        date: new Date('2025-11-04T13:30:00'),
        read: true,
        starred: false,
        folder: 'inbox'
      },
      {
        from: 'support@newtek.com',
        fromName: 'NewTek Video Toaster',
        to: ['user@workbench.local'],
        subject: 'Video Toaster Software Update',
        body: 'A new software update is available for Video Toaster!\n\nVersion 4.3 includes:\n• Enhanced Lightwave 3D\n• New transitions and effects\n• Improved stability\n• ChromaFX updates\n\nDownload from our BBS or order on floppy.',
        date: new Date('2025-11-04T09:00:00'),
        read: false,
        starred: false,
        folder: 'inbox'
      },
      {
        from: 'magazine@amiga-format.co.uk',
        fromName: 'Amiga Format',
        to: ['user@workbench.local'],
        subject: 'This Month\'s Coverdisk',
        body: 'Amiga Format Issue #127 is out now!\n\nCoverdisk includes:\n• Playable game demos\n• Utilities and tools\n• Exclusive artwork\n• Music demos\n\nPick up your copy today!',
        date: new Date('2025-11-03T10:20:00'),
        read: true,
        starred: false,
        folder: 'inbox'
      },
      {
        from: 'developer@cloanto.com',
        fromName: 'Cloanto',
        to: ['user@workbench.local'],
        subject: 'Personal Paint 7.0 Released',
        body: 'The most advanced paint program for Amiga!\n\nNew in version 7.0:\n• 24-bit color support\n• Animation features\n• Advanced brushes\n• Tablet support\n\nUpgrade today!',
        date: new Date('2025-11-02T14:00:00'),
        read: true,
        starred: false,
        folder: 'inbox'
      },
      {
        from: 're: admin@commodore.com',
        fromName: 'User',
        to: ['admin@commodore.com'],
        subject: 'Re: Welcome to AmigaOS Email',
        body: 'Thank you for the warm welcome!\n\nI\'m really enjoying the email client. The threading feature works great!\n\nBest regards,\nUser',
        date: new Date('2025-11-08T10:30:00'),
        read: true,
        starred: false,
        folder: 'sent'
      },
      {
        from: 'user@workbench.local',
        fromName: 'User',
        to: ['friend@amiga.net'],
        subject: 'Check out this WebOS!',
        body: 'Hey!\n\nYou have to see this amazing Amiga Workbench recreation running in the browser. It even has a working email client!\n\nThe attention to detail is incredible.\n\nCheers!',
        date: new Date('2025-11-07T19:00:00'),
        read: true,
        starred: false,
        folder: 'sent'
      },
      {
        from: 'user@workbench.local',
        fromName: 'User',
        to: ['support@software-hut.com'],
        subject: 'Order Inquiry',
        body: 'Hello,\n\nI\'m interested in ordering Directory Opus 5.0. Do you have it in stock?\n\nAlso, do you ship internationally?\n\nThank you,\nUser',
        date: new Date('2025-11-06T12:00:00'),
        read: true,
        starred: false,
        folder: 'sent'
      },
      {
        from: 'user@workbench.local',
        fromName: 'User',
        to: [],
        subject: 'Draft: Ideas for new project',
        body: 'Need to write down my ideas:\n\n• Create a new demo\n• Learn more about copper effects\n• Experiment with HAM mode\n\n(To be continued...)',
        date: new Date('2025-11-08T07:00:00'),
        read: true,
        starred: false,
        folder: 'drafts'
      },
      {
        from: 'spam@junk.mail',
        fromName: 'Spam Bot',
        to: ['user@workbench.local'],
        subject: 'You Won a Million Dollars!!!',
        body: 'CONGRATULATIONS!!!\n\nYou are the lucky winner of our sweepstakes!\n\nClick here to claim your prize...\n\n(Obviously spam)',
        date: new Date('2025-11-01T08:00:00'),
        read: true,
        starred: false,
        folder: 'trash'
      }
    ];

    // Convert to full Email objects with IDs and threading
    this.emails = mockEmails.map((email, index) => {
      const id = `email-${Date.now()}-${index}`;
      const threadId = this.generateThreadId(email.subject || '');

      return {
        id,
        from: email.from || '',
        fromName: email.fromName || '',
        to: email.to || [],
        cc: email.cc || [],
        bcc: email.bcc || [],
        subject: email.subject || '',
        body: email.body || '',
        htmlBody: email.htmlBody,
        date: email.date || new Date(),
        read: email.read !== undefined ? email.read : false,
        starred: email.starred !== undefined ? email.starred : false,
        folder: email.folder || 'inbox',
        attachments: email.attachments || [],
        threadId,
        inReplyTo: email.subject?.startsWith('Re: ') ? threadId : undefined,
        labels: email.labels || []
      } as Email;
    });

    this.updateFolderCounts();
  }

  private generateThreadId(subject: string): string {
    // Remove Re:, Fwd:, etc. and generate consistent thread ID
    const cleanSubject = subject
      .replace(/^(Re|Fwd|Fw):\s*/gi, '')
      .toLowerCase()
      .trim();

    // Simple hash function for consistent thread IDs
    let hash = 0;
    for (let i = 0; i < cleanSubject.length; i++) {
      const char = cleanSubject.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return `thread-${Math.abs(hash)}`;
  }

  private updateFolderCounts(): void {
    this.folders.forEach(folder => {
      const folderEmails = this.emails.filter(e => e.folder === folder.id);
      folder.count = folderEmails.length;
      folder.unread = folderEmails.filter(e => !e.read).length;
    });
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('webos-emails', JSON.stringify(this.emails));
      localStorage.setItem('webos-email-folders', JSON.stringify(this.folders));
      localStorage.setItem('webos-email-filters', JSON.stringify(this.filters));
      localStorage.setItem('webos-email-templates', JSON.stringify(this.templates));
      localStorage.setItem('webos-email-initialized', 'true');
    } catch (error) {
      console.error('Failed to save emails to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const emailsData = localStorage.getItem('webos-emails');
      const foldersData = localStorage.getItem('webos-email-folders');
      const filtersData = localStorage.getItem('webos-email-filters');
      const templatesData = localStorage.getItem('webos-email-templates');
      const initializedData = localStorage.getItem('webos-email-initialized');

      if (emailsData) {
        this.emails = JSON.parse(emailsData).map((e: any) => ({
          ...e,
          date: new Date(e.date)
        }));
      }

      if (foldersData) {
        this.folders = JSON.parse(foldersData);
      }

      if (filtersData) {
        this.filters = JSON.parse(filtersData);
      }

      if (templatesData) {
        this.templates = JSON.parse(templatesData);
      }

      this.initialized = initializedData === 'true';
    } catch (error) {
      console.error('Failed to load emails from storage:', error);
    }
  }

  // ============================================================================
  // EMAIL OPERATIONS
  // ============================================================================

  getEmails(folderId: string, page = 1, pageSize = 20): { emails: Email[], total: number, pages: number } {
    const folderEmails = this.emails
      .filter(e => e.folder === folderId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    const total = folderEmails.length;
    const pages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const emails = folderEmails.slice(start, start + pageSize);

    return { emails, total, pages };
  }

  getEmail(id: string): Email | undefined {
    return this.emails.find(e => e.id === id);
  }

  async sendEmail(email: Partial<Email>): Promise<Email> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newEmail: Email = {
      id: `email-${Date.now()}-${Math.random()}`,
      from: email.from || 'user@workbench.local',
      fromName: email.fromName || 'User',
      to: email.to || [],
      cc: email.cc || [],
      bcc: email.bcc || [],
      subject: email.subject || '(No Subject)',
      body: email.body || '',
      htmlBody: email.htmlBody,
      date: new Date(),
      read: true,
      starred: false,
      folder: 'sent',
      attachments: email.attachments || [],
      threadId: email.threadId || this.generateThreadId(email.subject || ''),
      inReplyTo: email.inReplyTo,
      labels: email.labels || []
    };

    this.emails.push(newEmail);
    this.updateFolderCounts();
    this.saveToStorage();

    return newEmail;
  }

  saveDraft(email: Partial<Email>): Email {
    // Check if updating existing draft
    if (email.id) {
      const existingIndex = this.emails.findIndex(e => e.id === email.id);
      if (existingIndex !== -1) {
        this.emails[existingIndex] = {
          ...this.emails[existingIndex],
          ...email,
          date: new Date()
        } as Email;
        this.saveToStorage();
        return this.emails[existingIndex];
      }
    }

    // Create new draft
    const draft: Email = {
      id: `email-${Date.now()}-${Math.random()}`,
      from: email.from || 'user@workbench.local',
      fromName: email.fromName || 'User',
      to: email.to || [],
      cc: email.cc || [],
      bcc: email.bcc || [],
      subject: email.subject || '(No Subject)',
      body: email.body || '',
      htmlBody: email.htmlBody,
      date: new Date(),
      read: true,
      starred: false,
      folder: 'drafts',
      attachments: email.attachments || [],
      threadId: this.generateThreadId(email.subject || ''),
      labels: email.labels || []
    };

    this.emails.push(draft);
    this.updateFolderCounts();
    this.saveToStorage();

    return draft;
  }

  moveToFolder(emailIds: string[], folderId: string): void {
    emailIds.forEach(id => {
      const email = this.emails.find(e => e.id === id);
      if (email) {
        email.folder = folderId;
      }
    });

    this.updateFolderCounts();
    this.saveToStorage();
  }

  deleteEmails(emailIds: string[], permanent = false): void {
    if (permanent) {
      this.emails = this.emails.filter(e => !emailIds.includes(e.id));
    } else {
      this.moveToFolder(emailIds, 'trash');
    }

    this.updateFolderCounts();
    this.saveToStorage();
  }

  markAsRead(emailIds: string[], read: boolean): void {
    emailIds.forEach(id => {
      const email = this.emails.find(e => e.id === id);
      if (email) {
        email.read = read;
      }
    });

    this.updateFolderCounts();
    this.saveToStorage();
  }

  markAsStarred(emailIds: string[], starred: boolean): void {
    emailIds.forEach(id => {
      const email = this.emails.find(e => e.id === id);
      if (email) {
        email.starred = starred;
      }
    });

    this.saveToStorage();
  }

  searchEmails(query: string, folderId?: string): Email[] {
    const lowerQuery = query.toLowerCase();

    let results = this.emails.filter(email => {
      const matchesQuery =
        email.subject.toLowerCase().includes(lowerQuery) ||
        email.body.toLowerCase().includes(lowerQuery) ||
        email.from.toLowerCase().includes(lowerQuery) ||
        email.fromName.toLowerCase().includes(lowerQuery) ||
        email.to.some(t => t.toLowerCase().includes(lowerQuery));

      const matchesFolder = !folderId || email.folder === folderId;

      return matchesQuery && matchesFolder;
    });

    return results.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  getThread(threadId: string): Email[] {
    return this.emails
      .filter(e => e.threadId === threadId)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // ============================================================================
  // FOLDER OPERATIONS
  // ============================================================================

  getFolders(): Folder[] {
    return this.folders;
  }

  createFolder(name: string): Folder {
    const folder: Folder = {
      id: `folder-${Date.now()}`,
      name,
      type: 'custom',
      count: 0,
      unread: 0,
      icon: '📁'
    };

    this.folders.push(folder);
    this.saveToStorage();

    return folder;
  }

  deleteFolder(id: string): void {
    // Don't delete system folders
    const folder = this.folders.find(f => f.id === id);
    if (!folder || folder.type !== 'custom') {
      return;
    }

    // Move emails to inbox
    this.emails
      .filter(e => e.folder === id)
      .forEach(e => e.folder = 'inbox');

    this.folders = this.folders.filter(f => f.id !== id);
    this.updateFolderCounts();
    this.saveToStorage();
  }

  renameFolder(id: string, name: string): void {
    const folder = this.folders.find(f => f.id === id);
    if (folder && folder.type === 'custom') {
      folder.name = name;
      this.saveToStorage();
    }
  }

  emptyFolder(id: string): void {
    if (id === 'trash') {
      this.emails = this.emails.filter(e => e.folder !== 'trash');
      this.updateFolderCounts();
      this.saveToStorage();
    }
  }

  // ============================================================================
  // FILTER OPERATIONS
  // ============================================================================

  getFilters(): EmailFilter[] {
    return this.filters;
  }

  createFilter(filter: Omit<EmailFilter, 'id'>): EmailFilter {
    const newFilter: EmailFilter = {
      ...filter,
      id: `filter-${Date.now()}`
    };

    this.filters.push(newFilter);
    this.saveToStorage();

    return newFilter;
  }

  updateFilter(id: string, updates: Partial<EmailFilter>): void {
    const filter = this.filters.find(f => f.id === id);
    if (filter) {
      Object.assign(filter, updates);
      this.saveToStorage();
    }
  }

  deleteFilter(id: string): void {
    this.filters = this.filters.filter(f => f.id !== id);
    this.saveToStorage();
  }

  applyFilters(email: Email): void {
    this.filters
      .filter(f => f.enabled)
      .forEach(filter => {
        if (this.emailMatchesFilter(email, filter)) {
          this.applyFilterActions(email, filter.actions);
        }
      });
  }

  private emailMatchesFilter(email: Email, filter: EmailFilter): boolean {
    return filter.conditions.every(condition => {
      let fieldValue = '';

      switch (condition.field) {
        case 'from':
          fieldValue = email.from + ' ' + email.fromName;
          break;
        case 'to':
          fieldValue = email.to.join(' ');
          break;
        case 'subject':
          fieldValue = email.subject;
          break;
        case 'body':
          fieldValue = email.body;
          break;
      }

      fieldValue = fieldValue.toLowerCase();
      const value = condition.value.toLowerCase();

      switch (condition.operator) {
        case 'contains':
          return fieldValue.includes(value);
        case 'equals':
          return fieldValue === value;
        case 'startsWith':
          return fieldValue.startsWith(value);
        case 'endsWith':
          return fieldValue.endsWith(value);
        default:
          return false;
      }
    });
  }

  private applyFilterActions(email: Email, actions: FilterAction[]): void {
    actions.forEach(action => {
      switch (action.type) {
        case 'move':
          email.folder = action.value;
          break;
        case 'markRead':
          email.read = true;
          break;
        case 'star':
          email.starred = true;
          break;
        case 'delete':
          email.folder = 'trash';
          break;
        case 'label':
          if (!email.labels.includes(action.value)) {
            email.labels.push(action.value);
          }
          break;
      }
    });

    this.saveToStorage();
  }

  // ============================================================================
  // TEMPLATE OPERATIONS
  // ============================================================================

  getTemplates(): EmailTemplate[] {
    return this.templates;
  }

  createTemplate(template: Omit<EmailTemplate, 'id'>): EmailTemplate {
    const newTemplate: EmailTemplate = {
      ...template,
      id: `template-${Date.now()}`
    };

    this.templates.push(newTemplate);
    this.saveToStorage();

    return newTemplate;
  }

  deleteTemplate(id: string): void {
    this.templates = this.templates.filter(t => t.id !== id);
    this.saveToStorage();
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getUnreadCount(folderId?: string): number {
    if (folderId) {
      const folder = this.folders.find(f => f.id === folderId);
      return folder?.unread || 0;
    }

    return this.emails.filter(e => !e.read && e.folder === 'inbox').length;
  }

  getTotalEmailCount(): number {
    return this.emails.length;
  }

  exportEmails(folderId?: string): string {
    const emails = folderId
      ? this.emails.filter(e => e.folder === folderId)
      : this.emails;

    return JSON.stringify(emails, null, 2);
  }

  importEmails(jsonData: string): void {
    try {
      const emails = JSON.parse(jsonData);

      emails.forEach((email: any) => {
        this.emails.push({
          ...email,
          id: `email-${Date.now()}-${Math.random()}`,
          date: new Date(email.date)
        });
      });

      this.updateFolderCounts();
      this.saveToStorage();
    } catch (error) {
      console.error('Failed to import emails:', error);
    }
  }
}

// Export singleton instance
export const emailManager = new EmailManager();
