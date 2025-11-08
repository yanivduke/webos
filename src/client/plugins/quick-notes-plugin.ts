/**
 * Quick Notes Plugin
 * Adds a quick notes widget to the desktop
 */

import type { Plugin, PluginAPI } from '../utils/plugin-manager';

const quickNotesPlugin: Plugin = {
  metadata: {
    id: 'quick-notes',
    name: 'Quick Notes',
    version: '1.0.0',
    author: 'WebOS Team',
    description: 'Add sticky notes widget to your desktop for quick reminders',
    permissions: ['ui', 'storage', 'notifications'],
    category: 'productivity',
    icon: '📝'
  },

  async initialize(api: PluginAPI) {
    console.log('[Quick Notes Plugin] Initializing...');

    // Load saved notes
    const savedNotes = api.getData('notes') || [];

    // Add desktop icon
    api.addDesktopIcon({
      id: 'quick-notes-icon',
      name: 'Notes',
      icon: '📝',
      onClick: () => {
        openNotesWindow();
      }
    });

    // Add widget to desktop
    if (api.addWidget) {
      api.addWidget({
        id: 'quick-notes-widget',
        component: null, // Would be a Vue component
        position: { x: window.innerWidth - 220, y: 100 },
        size: { width: 200, height: 250 }
      });
    }

    const openNotesWindow = () => {
      const notes = api.getData('notes') || [];
      const notesHtml = notes.map((note: any, i: number) =>
        `<div style="padding: 8px; border-bottom: 1px solid #808080;">
          ${i + 1}. ${note.text}
        </div>`
      ).join('');

      api.openWindow({
        title: 'Quick Notes',
        width: 450,
        height: 400,
        component: 'div',
        data: {
          html: `
            <div style="padding: 15px; font-family: 'Press Start 2P', monospace; font-size: 10px;">
              <h3>Your Notes</h3>
              <div style="margin: 15px 0; max-height: 200px; overflow-y: auto; background: #fff; border: 2px solid #000; padding: 5px;">
                ${notesHtml || '<div style="padding: 8px; color: #888;">No notes yet</div>'}
              </div>
              <div style="margin-top: 15px;">
                <input
                  type="text"
                  id="newNote"
                  placeholder="Type a note..."
                  style="width: 100%; padding: 8px; font-family: monospace; border: 2px solid #000;"
                />
                <button
                  onclick="addNote()"
                  style="margin-top: 10px; padding: 8px 16px; background: #a0a0a0; border: 2px solid; border-color: #fff #000 #000 #fff; cursor: pointer; font-family: 'Press Start 2P', monospace; font-size: 9px;"
                >
                  Add Note
                </button>
                <button
                  onclick="clearNotes()"
                  style="margin-top: 10px; margin-left: 10px; padding: 8px 16px; background: #a0a0a0; border: 2px solid; border-color: #fff #000 #000 #fff; cursor: pointer; font-family: 'Press Start 2P', monospace; font-size: 9px;"
                >
                  Clear All
                </button>
              </div>
            </div>
          `
        }
      });
    };

    // Define global note functions
    (window as any).addNote = () => {
      const input = document.getElementById('newNote') as HTMLInputElement;
      if (input && input.value.trim()) {
        const notes = api.getData('notes') || [];
        notes.push({
          id: Date.now(),
          text: input.value.trim(),
          timestamp: Date.now()
        });
        api.setData('notes', notes);
        api.showNotification('success', 'Note Added', 'Your note has been saved');
        input.value = '';

        // Refresh window
        setTimeout(openNotesWindow, 100);
      }
    };

    (window as any).clearNotes = () => {
      if (confirm('Clear all notes?')) {
        api.setData('notes', []);
        api.showNotification('info', 'Notes Cleared', 'All notes have been removed');
        setTimeout(openNotesWindow, 100);
      }
    };

    // Add keyboard shortcut listener
    api.on('keydown', (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'n') {
        openNotesWindow();
      }
    });

    // Show saved notes count
    if (savedNotes.length > 0) {
      api.showNotification(
        'info',
        'Quick Notes',
        `You have ${savedNotes.length} saved note(s)`
      );
    }

    console.log('[Quick Notes Plugin] Initialized successfully');
  },

  async destroy() {
    console.log('[Quick Notes Plugin] Destroying...');

    // Clean up global functions
    delete (window as any).addNote;
    delete (window as any).clearNotes;
  }
};

export default quickNotesPlugin;
