/**
 * Address Book Utility
 * Manages contacts with localStorage persistence
 */

export interface Contact {
  id: string;
  name: string;
  email: string;
  photo?: string; // base64 image or URL
  company?: string;
  phone?: string;
  notes?: string;
  tags: string[];
  created: Date;
  modified: Date;
  favorited: boolean;
  interactionCount: number; // For frequent contacts
}

class AddressBook {
  private contacts: Contact[] = [];
  private initialized = false;

  constructor() {
    this.loadFromStorage();
    if (!this.initialized) {
      this.initializeDefaultContacts();
    }
  }

  // ============================================================================
  // INITIALIZATION & PERSISTENCE
  // ============================================================================

  private initializeDefaultContacts(): void {
    const defaultContacts: Omit<Contact, 'id' | 'created' | 'modified'>[] = [
      {
        name: 'Commodore Support',
        email: 'admin@commodore.com',
        company: 'Commodore International',
        phone: '1-800-AMIGA',
        notes: 'Official Commodore support team',
        tags: ['business', 'support'],
        favorited: true,
        interactionCount: 15
      },
      {
        name: 'Guru Meditation',
        email: 'guru@amiga.com',
        company: 'AmigaOS Development',
        notes: 'System status and diagnostics',
        tags: ['technical'],
        favorited: false,
        interactionCount: 8
      },
      {
        name: 'Demo Scene',
        email: 'demo@scene.org',
        company: 'Scene.org',
        notes: 'Demo party organizer',
        tags: ['creative', 'demos'],
        favorited: false,
        interactionCount: 5
      },
      {
        name: 'Bob',
        email: 'bob@paint.com',
        company: 'Electronic Arts',
        notes: 'Deluxe Paint artist',
        tags: ['creative', 'art'],
        favorited: true,
        interactionCount: 12
      },
      {
        name: 'MOD Archive Team',
        email: 'tracker@mod.archive',
        company: 'MOD Archive',
        phone: '555-MOD-TUNE',
        notes: 'Music module archive',
        tags: ['music', 'creative'],
        favorited: true,
        interactionCount: 20
      },
      {
        name: 'Workbench Updates',
        email: 'workbench@commodore.com',
        company: 'Commodore',
        notes: 'Workbench tips and updates',
        tags: ['business', 'support'],
        favorited: false,
        interactionCount: 6
      },
      {
        name: 'Hardware Dev',
        email: 'devs@hardware.net',
        company: 'Hardware Developers Inc.',
        phone: '555-HW-DEV',
        notes: 'Hardware acceleration specialists',
        tags: ['technical', 'business'],
        favorited: false,
        interactionCount: 4
      },
      {
        name: 'BBS Admin',
        email: 'bbsadmin@local.bbs',
        company: 'Local BBS',
        phone: '555-AMIGA',
        notes: 'Local bulletin board system',
        tags: ['community'],
        favorited: false,
        interactionCount: 10
      },
      {
        name: 'Team17',
        email: 'games@team17.co.uk',
        company: 'Team17 Software',
        notes: 'Game developers - Worms creators',
        tags: ['games', 'business'],
        favorited: true,
        interactionCount: 7
      },
      {
        name: 'Psygnosis',
        email: 'info@psygnosis.com',
        company: 'Psygnosis Limited',
        notes: 'Shadow of the Beast developers',
        tags: ['games', 'business'],
        favorited: false,
        interactionCount: 3
      },
      {
        name: 'NewTek Support',
        email: 'support@newtek.com',
        company: 'NewTek Inc.',
        phone: '1-800-TOASTER',
        notes: 'Video Toaster support',
        tags: ['video', 'business'],
        favorited: false,
        interactionCount: 5
      },
      {
        name: 'Amiga Format Magazine',
        email: 'magazine@amiga-format.co.uk',
        company: 'Future Publishing',
        notes: 'Monthly Amiga magazine',
        tags: ['media', 'community'],
        favorited: false,
        interactionCount: 9
      },
      {
        name: 'Cloanto Developer',
        email: 'developer@cloanto.com',
        company: 'Cloanto Corporation',
        notes: 'Personal Paint developers',
        tags: ['creative', 'business'],
        favorited: false,
        interactionCount: 4
      }
    ];

    this.contacts = defaultContacts.map((contact, index) => ({
      ...contact,
      id: `contact-${Date.now()}-${index}`,
      created: new Date(),
      modified: new Date()
    }));

    this.initialized = true;
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('webos-contacts', JSON.stringify(this.contacts));
      localStorage.setItem('webos-contacts-initialized', 'true');
    } catch (error) {
      console.error('Failed to save contacts to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const contactsData = localStorage.getItem('webos-contacts');
      const initializedData = localStorage.getItem('webos-contacts-initialized');

      if (contactsData) {
        this.contacts = JSON.parse(contactsData).map((c: any) => ({
          ...c,
          created: new Date(c.created),
          modified: new Date(c.modified)
        }));
      }

      this.initialized = initializedData === 'true';
    } catch (error) {
      console.error('Failed to load contacts from storage:', error);
    }
  }

  // ============================================================================
  // CONTACT OPERATIONS
  // ============================================================================

  getAllContacts(): Contact[] {
    return [...this.contacts].sort((a, b) => a.name.localeCompare(b.name));
  }

  getContact(id: string): Contact | undefined {
    return this.contacts.find(c => c.id === id);
  }

  addContact(contact: Omit<Contact, 'id' | 'created' | 'modified'>): Contact {
    const newContact: Contact = {
      ...contact,
      id: `contact-${Date.now()}-${Math.random()}`,
      created: new Date(),
      modified: new Date(),
      tags: contact.tags || [],
      favorited: contact.favorited || false,
      interactionCount: contact.interactionCount || 0
    };

    this.contacts.push(newContact);
    this.saveToStorage();

    return newContact;
  }

  updateContact(id: string, updates: Partial<Contact>): Contact | undefined {
    const contact = this.contacts.find(c => c.id === id);
    if (!contact) {
      return undefined;
    }

    Object.assign(contact, updates, {
      modified: new Date()
    });

    this.saveToStorage();
    return contact;
  }

  deleteContact(id: string): boolean {
    const initialLength = this.contacts.length;
    this.contacts = this.contacts.filter(c => c.id !== id);

    if (this.contacts.length < initialLength) {
      this.saveToStorage();
      return true;
    }

    return false;
  }

  searchContacts(query: string): Contact[] {
    const lowerQuery = query.toLowerCase();

    return this.contacts
      .filter(contact => {
        return (
          contact.name.toLowerCase().includes(lowerQuery) ||
          contact.email.toLowerCase().includes(lowerQuery) ||
          (contact.company && contact.company.toLowerCase().includes(lowerQuery)) ||
          (contact.phone && contact.phone.toLowerCase().includes(lowerQuery)) ||
          (contact.notes && contact.notes.toLowerCase().includes(lowerQuery)) ||
          contact.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getContactByEmail(email: string): Contact | undefined {
    return this.contacts.find(c => c.email.toLowerCase() === email.toLowerCase());
  }

  getContactsByTag(tag: string): Contact[] {
    return this.contacts
      .filter(c => c.tags.includes(tag))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getFavoritedContacts(): Contact[] {
    return this.contacts
      .filter(c => c.favorited)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getFrequentContacts(limit = 10): Contact[] {
    return [...this.contacts]
      .sort((a, b) => b.interactionCount - a.interactionCount)
      .slice(0, limit);
  }

  incrementInteractionCount(email: string): void {
    const contact = this.getContactByEmail(email);
    if (contact) {
      contact.interactionCount++;
      contact.modified = new Date();
      this.saveToStorage();
    }
  }

  // ============================================================================
  // TAG OPERATIONS
  // ============================================================================

  getAllTags(): string[] {
    const tagSet = new Set<string>();
    this.contacts.forEach(contact => {
      contact.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }

  addTagToContact(contactId: string, tag: string): void {
    const contact = this.contacts.find(c => c.id === contactId);
    if (contact && !contact.tags.includes(tag)) {
      contact.tags.push(tag);
      contact.modified = new Date();
      this.saveToStorage();
    }
  }

  removeTagFromContact(contactId: string, tag: string): void {
    const contact = this.contacts.find(c => c.id === contactId);
    if (contact) {
      contact.tags = contact.tags.filter(t => t !== tag);
      contact.modified = new Date();
      this.saveToStorage();
    }
  }

  // ============================================================================
  // AUTOCOMPLETE
  // ============================================================================

  getEmailSuggestions(query: string, limit = 10): { name: string; email: string }[] {
    if (!query) {
      // Return frequent contacts if no query
      return this.getFrequentContacts(limit).map(c => ({
        name: c.name,
        email: c.email
      }));
    }

    const lowerQuery = query.toLowerCase();
    return this.contacts
      .filter(contact => {
        return (
          contact.name.toLowerCase().includes(lowerQuery) ||
          contact.email.toLowerCase().includes(lowerQuery)
        );
      })
      .sort((a, b) => {
        // Prioritize by interaction count
        return b.interactionCount - a.interactionCount;
      })
      .slice(0, limit)
      .map(c => ({
        name: c.name,
        email: c.email
      }));
  }

  // ============================================================================
  // IMPORT / EXPORT (vCard format)
  // ============================================================================

  exportVCard(contactId?: string): string {
    const contacts = contactId
      ? [this.contacts.find(c => c.id === contactId)].filter(Boolean) as Contact[]
      : this.contacts;

    const vCards = contacts.map(contact => {
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${contact.name}`,
        `EMAIL:${contact.email}`
      ];

      if (contact.company) {
        lines.push(`ORG:${contact.company}`);
      }

      if (contact.phone) {
        lines.push(`TEL:${contact.phone}`);
      }

      if (contact.notes) {
        lines.push(`NOTE:${contact.notes.replace(/\n/g, '\\n')}`);
      }

      if (contact.photo) {
        lines.push(`PHOTO;ENCODING=b:${contact.photo}`);
      }

      lines.push('END:VCARD');

      return lines.join('\n');
    });

    return vCards.join('\n\n');
  }

  importVCard(vCardData: string): number {
    let imported = 0;

    try {
      const vCards = vCardData.split(/END:VCARD/i).filter(v => v.trim());

      vCards.forEach(vCard => {
        const lines = vCard.split('\n').map(l => l.trim());
        const contact: any = {
          tags: [],
          favorited: false,
          interactionCount: 0
        };

        lines.forEach(line => {
          if (line.startsWith('FN:')) {
            contact.name = line.substring(3);
          } else if (line.startsWith('EMAIL:')) {
            contact.email = line.substring(6);
          } else if (line.startsWith('ORG:')) {
            contact.company = line.substring(4);
          } else if (line.startsWith('TEL:')) {
            contact.phone = line.substring(4);
          } else if (line.startsWith('NOTE:')) {
            contact.notes = line.substring(5).replace(/\\n/g, '\n');
          } else if (line.startsWith('PHOTO;ENCODING=b:')) {
            contact.photo = line.substring(17);
          }
        });

        if (contact.name && contact.email) {
          // Check if contact already exists
          const existing = this.getContactByEmail(contact.email);
          if (!existing) {
            this.addContact(contact);
            imported++;
          }
        }
      });

      this.saveToStorage();
    } catch (error) {
      console.error('Failed to import vCard:', error);
    }

    return imported;
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  deleteMultipleContacts(contactIds: string[]): number {
    const initialLength = this.contacts.length;
    this.contacts = this.contacts.filter(c => !contactIds.includes(c.id));
    const deleted = initialLength - this.contacts.length;

    if (deleted > 0) {
      this.saveToStorage();
    }

    return deleted;
  }

  bulkAddTags(contactIds: string[], tags: string[]): void {
    contactIds.forEach(id => {
      const contact = this.contacts.find(c => c.id === id);
      if (contact) {
        tags.forEach(tag => {
          if (!contact.tags.includes(tag)) {
            contact.tags.push(tag);
          }
        });
        contact.modified = new Date();
      }
    });

    this.saveToStorage();
  }

  bulkRemoveTags(contactIds: string[], tags: string[]): void {
    contactIds.forEach(id => {
      const contact = this.contacts.find(c => c.id === id);
      if (contact) {
        contact.tags = contact.tags.filter(t => !tags.includes(t));
        contact.modified = new Date();
      }
    });

    this.saveToStorage();
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  getStatistics(): {
    total: number;
    favorited: number;
    withCompany: number;
    withPhone: number;
    withNotes: number;
    totalTags: number;
  } {
    return {
      total: this.contacts.length,
      favorited: this.contacts.filter(c => c.favorited).length,
      withCompany: this.contacts.filter(c => c.company).length,
      withPhone: this.contacts.filter(c => c.phone).length,
      withNotes: this.contacts.filter(c => c.notes).length,
      totalTags: this.getAllTags().length
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  exportJSON(): string {
    return JSON.stringify(this.contacts, null, 2);
  }

  importJSON(jsonData: string): number {
    try {
      const contacts = JSON.parse(jsonData);
      let imported = 0;

      contacts.forEach((contact: any) => {
        if (contact.email) {
          const existing = this.getContactByEmail(contact.email);
          if (!existing) {
            this.addContact({
              name: contact.name || '',
              email: contact.email,
              company: contact.company,
              phone: contact.phone,
              photo: contact.photo,
              notes: contact.notes,
              tags: contact.tags || [],
              favorited: contact.favorited || false,
              interactionCount: contact.interactionCount || 0
            });
            imported++;
          }
        }
      });

      return imported;
    } catch (error) {
      console.error('Failed to import JSON:', error);
      return 0;
    }
  }

  clearAllContacts(): void {
    this.contacts = [];
    this.saveToStorage();
  }
}

// Export singleton instance
export const addressBook = new AddressBook();
