# Tabbed Windows Feature

## Overview

The WebOS Amiga-style interface now supports tabbed windows, allowing multiple folders and files to be opened as tabs within a single window, similar to modern browsers.

## Features Implemented

### 1. Core Tab Management

**Files Created:**
- `/home/user/webos/src/client/composables/useWindowTabs.ts` - Tab state management composable
- `/home/user/webos/src/client/components/AmigaTabBar.vue` - Tab bar UI component

**Files Modified:**
- `/home/user/webos/src/client/components/AmigaWindow.vue` - Added tab bar slot
- `/home/user/webos/src/client/components/AmigaDesktop.vue` - Integrated tab functionality

### 2. Tab Features

#### Visual Design
- Amiga-authentic tab styling with beveled borders
- Active tab highlighting with different background color
- Tab icons showing file/folder type (📁 📄 📝 ⚙)
- Tab titles with ellipsis for long names (max 15 characters visible)
- Scrollable tab bar for multiple tabs
- Close button (×) on each tab
- New tab button (+) on the right side

#### Tab Operations
- **Click tab** - Switch to that tab
- **Click × button** - Close individual tab
- **Drag tab** - Reorder tabs within window
- **Drag tab down** - Tear off tab to create new window
- **Right-click tab** - Show context menu with options:
  - Close Tab
  - Close Other Tabs
  - Close Tabs to Right
  - New Tab
  - Duplicate Tab

#### Keyboard Shortcuts
- **Ctrl+T** - New tab in active window
- **Ctrl+W** - Close active tab
- **Ctrl+Tab** - Switch to next tab
- **Ctrl+Shift+Tab** - Switch to previous tab

### 3. File Integration

When opening files from a folder:
- Files open as new tabs in the current window (if window has tabs)
- Duplicate files activate existing tab instead of creating new one
- Different file types get appropriate icons:
  - 📁 Folders
  - 📝 Text files (.txt, .doc)
  - ⚙ AWML applications
  - 📄 Other files

### 4. Window Interface Updates

**Window Interface:**
```typescript
interface Window {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  component: any;
  data?: any;
  typeId?: string;
  tabs?: Tab[];          // NEW: Array of tabs
  activeTabId?: string;  // NEW: Currently active tab ID
}

interface Tab {
  id: string;
  title: string;
  component: any;
  data: any;
  icon: string;
  path?: string;
}
```

### 5. Tab Management Functions

**useWindowTabs Composable:**
- `getWindowTabs(windowId)` - Get all tabs for a window
- `getActiveTab(windowId)` - Get the currently active tab
- `initializeWindow(windowId, initialTab)` - Initialize window with tabs
- `addTab(windowId, tab, makeActive)` - Add new tab to window
- `removeTab(windowId, tabId)` - Remove tab (returns true if window should close)
- `setActiveTab(windowId, tabId)` - Set active tab
- `reorderTabs(windowId, fromIndex, toIndex)` - Reorder tabs via drag
- `moveTabToWindow(fromWindowId, toWindowId, tabId)` - Move tab between windows
- `closeOtherTabs(windowId, keepTabId)` - Close all tabs except specified
- `closeTabsToRight(windowId, fromTabId)` - Close tabs to the right
- `navigateTab(windowId, 'next' | 'prev')` - Cycle through tabs
- `cleanupWindow(windowId)` - Clean up tab state when window closes

### 6. Desktop Handler Functions

**Added to AmigaDesktop.vue:**
- `handleTabClick(windowId, tab)` - Switch to clicked tab
- `handleTabClose(windowId, tab)` - Close tab or window if last tab
- `handleTabReorder(windowId, fromIndex, toIndex)` - Reorder tabs
- `handleTabTearOff(windowId, tab, mouseX, mouseY)` - Create new window from dragged tab
- `handleNewTab(windowId)` - Create new folder tab
- `handleCloseOtherTabs(windowId, tab)` - Close other tabs
- `handleCloseTabsToRight(windowId, tab)` - Close tabs to right
- `handleOpenFileInTab(windowId, filePath, fileMeta)` - Open file as new tab

## Usage Guide

### Creating Tabs

1. **Convert Window to Tabbed:**
   - Press `Ctrl+T` while a window is active
   - Or double-click a file in a folder window (opens as tab)

2. **Open Files as Tabs:**
   - Double-click files in an existing tabbed window
   - They automatically open as new tabs
   - Files with same path activate existing tab

3. **New Tab Button:**
   - Click the `+` button in the tab bar
   - Opens a new folder tab (defaults to System drive)

### Managing Tabs

1. **Switch Between Tabs:**
   - Click on tab
   - Use `Ctrl+Tab` / `Ctrl+Shift+Tab` to cycle

2. **Close Tabs:**
   - Click × button on tab
   - Press `Ctrl+W` for active tab
   - Right-click → Close Tab
   - Closing last tab closes the window

3. **Reorder Tabs:**
   - Drag and drop tabs horizontally
   - Visual feedback during drag

4. **Tear Off Tabs:**
   - Drag tab down (>50px vertically)
   - Creates new window with that tab
   - Original window closes if no tabs remain

5. **Context Menu Options:**
   - Right-click any tab for more options
   - Close Other Tabs - keeps only selected tab
   - Close Tabs to Right - closes all tabs after selected
   - New Tab - creates new folder tab
   - Duplicate Tab - duplicates current tab

## Technical Implementation

### Tab State Management

Tabs are managed using a Vue composable that maintains a Map of window IDs to tab states:

```typescript
Map<windowId, {
  tabs: Tab[],
  activeTabId: string
}>
```

This allows efficient:
- Per-window tab tracking
- Tab state persistence during drag operations
- Clean separation of concerns

### Component Hierarchy

```
AmigaDesktop
└── AmigaWindow (for each window)
    ├── AmigaTabBar (if window.tabs exists)
    │   └── Tab elements (draggable, clickable)
    └── Active tab content component
        └── AmigaFolder / AmigaNotePad / etc.
```

### Drag and Drop Flow

1. **Tab Reorder (horizontal drag):**
   - `dragstart` → Store dragged index
   - `dragover` → Show drop indicator
   - `drop` → Call `handleTabReorder`

2. **Tab Tear-Off (vertical drag >50px):**
   - `dragstart` → Store initial Y position
   - `dragover` → Check deltaY > threshold
   - `drop` → Call `handleTabTearOff`
   - New window created with tab component and data
   - Tab removed from source window

### Window Initialization

When a window gets its first tab (via Ctrl+T or file open):

1. Convert existing window content to initial tab
2. Create Tab object with window's current component/data
3. Initialize tab state via `initializeWindow()`
4. Add window.tabs array
5. Set window.activeTabId
6. Subsequent tabs are simply added to the array

## Styling

### Tab Bar Styling
- Amiga-style gradient background: `linear-gradient(180deg, #d0d0d0 0%, #b0b0b0 100%)`
- Active tab: White background with inset shadow
- Inactive tabs: Gray background
- Beveled borders following Amiga conventions
- Fixed height: 28px

### Tab Element
- Min width: 120px
- Max width: 200px
- Ellipsis for overflow text
- Press Start 2P font at 8px for authenticity
- Hover effects for interactivity

## Testing Checklist

✓ Open folder window
✓ Press Ctrl+T to create new tab
✓ Switch between tabs by clicking
✓ Close individual tabs
✓ Drag tabs to reorder
✓ Drag tab down to create new window
✓ Test keyboard shortcuts (Ctrl+T, Ctrl+W, Ctrl+Tab)
✓ Right-click tab for context menu
✓ Close Other Tabs
✓ Close Tabs to Right
✓ Open files as tabs
✓ Duplicate file detection (should activate existing tab)

## Browser Compatibility

Tested and working in:
- Modern Chrome/Chromium
- Firefox
- Safari
- Edge

Drag and drop works across all major browsers.

## Future Enhancements

Potential improvements:
- Tab groups/organization
- Pin tabs
- Tab search/filter
- Tab thumbnails on hover
- Session persistence (save/restore tabs)
- Customizable tab bar position
- Middle-click to close tab
- Drag tabs between windows
- Tab overflow scroll buttons (< >)

## Notes

- Windows can be non-tabbed (default) or tabbed (when tabs exist)
- Tab state is cleaned up when window closes
- No tabs persisted across sessions (future enhancement)
- Maximum tab width prevents excessive horizontal space usage
- Tab scrolling automatic when tabs exceed container width
