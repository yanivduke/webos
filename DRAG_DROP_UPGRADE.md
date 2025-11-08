# WebOS Enhanced Drag & Drop System - Upgrade Guide

## Overview

This document describes the comprehensive drag and drop upgrade implemented for WebOS using Vuetify 3, vuedraggable, and a custom drag service.

## Architecture

### New Components

1. **Enhanced Drag Service** (`src/client/composables/useDragDrop.ts`)
   - Unified drag and drop API
   - Supports file operations, settings reordering, and desktop management
   - Built-in undo/redo history
   - Drag state management
   - Drop zone validation

2. **Vuetify 3 Integration** (`src/client/plugins/vuetify.ts`)
   - Custom Amiga Workbench theme
   - Maintains retro aesthetic while using modern framework
   - Configured with Amiga color palette (#a0a0a0, #0055aa, #ffaa00)

3. **Enhanced Components**:
   - `AmigaFolderEnhanced.vue` - Folder view with vuedraggable support
   - `AmigaSettingsPanel.vue` - Settings with drag-to-reorder
   - `DraggableDesktopIcon.vue` - Desktop icons with position saving
   - `TrashDropZone.vue` - Drag-to-trash functionality

### Type Definitions

**`src/client/types/drag.ts`** provides:
- `DragItem` - Item being dragged
- `DragOperation` - Copy/move/reorder operation
- `DropZone` - Valid drop target
- `DragState` - Current drag state
- `DragResult` - Operation result
- `SettingItem` - Settings panel items

## Features

### 1. File System Drag & Drop

**Grid and List Views:**
```vue
<AmigaFolderEnhanced :data="{ path: 'dh0' }" />
```

Features:
- Multi-item selection (Ctrl/Cmd + click)
- Drag and drop between folders
- Copy operation (Ctrl/Cmd + drag)
- Move operation (standard drag)
- Visual feedback with ghost classes
- Drag handles in list view
- Empty folder drop zones

**Usage:**
1. Click to select files
2. Ctrl/Cmd + click for multi-select
3. Drag selected items to folders
4. Hold Ctrl/Cmd while dropping to copy

### 2. Settings Panel Reordering

**Reorderable Settings:**
```vue
<AmigaSettingsPanel />
```

Features:
- Drag settings to reorder within categories
- Maintains Amiga button styling
- Saves custom order to server
- Categories: Display, Sound, Workbench, System

**API Endpoints:**
```javascript
// Reorder settings
POST /api/settings/reorder
{
  "context": "display-settings",
  "items": [
    { "id": "screenMode", "order": 0 },
    { "id": "resolution", "order": 1 }
  ]
}

// Response
{
  "message": "Settings reordered successfully",
  "context": "display-settings",
  "order": [...]
}
```

### 3. Desktop Icon Organization

**Draggable Icons:**
```vue
<DraggableDesktopIcon
  :icon="diskIcon"
  :snapToGrid="true"
  :gridSize="80"
  @move="saveIconPosition"
/>
```

Features:
- Free positioning with mouse drag
- Snap-to-grid (configurable)
- Persistent positions via API
- Visual drag feedback
- Double-click to open

**API Endpoints:**
```javascript
// Save icon positions
POST /api/settings/desktop/icons
{
  "icons": [
    { "id": "df0", "x": 80, "y": 80 },
    { "id": "dh0", "x": 80, "y": 160 }
  ]
}

// Get icon positions
GET /api/settings/desktop/icons
```

### 4. Drag to Trash

**Trash Drop Zone:**
```vue
<TrashDropZone @delete="refreshFiles" @open="openTrash" />
```

Features:
- Visual feedback when dragging over trash
- Shake animation on hover
- Item count display
- Confirmation before delete (optional)
- Double-click to open trash

**Usage:**
1. Drag files from any folder
2. Drop on trash icon
3. Items moved to `/trash` with timestamp
4. Visual confirmation

## CSS Classes

### Drag States

```css
.drag-ghost        /* Element being dragged (low opacity) */
.drag-dragging     /* Element while dragging (rotated) */
.drag-chosen       /* Element selected for drag */
.drag-over         /* Drop zone with active drag */
.drag-invalid      /* Invalid drop target */
```

### Visual Feedback

```css
.drag-success      /* Successful drop animation */
.drag-error        /* Failed drop shake */
.drag-loading      /* Processing operation */
.trash-shake       /* Trash icon animation */
```

## API Reference

### Composable: `useDragDrop()`

```typescript
const {
  // State
  dragState,        // Current drag state
  isDragging,       // Is drag active
  canDrop,          // Can drop at current zone
  dragHistory,      // Undo/redo history

  // Operations
  startDrag,        // Initialize drag
  setDropZone,      // Set valid drop zone
  executeDrop,      // Execute drop operation
  endDrag,          // End drag
  moveToTrash,      // Move to trash
  undo,             // Undo last operation

  // HTML5 Drag handlers
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd,

  // Vuetify draggable
  getDraggableOptions,
} = useDragDrop();
```

### Server Routes

**Settings:**
- `POST /api/settings/reorder` - Reorder settings items
- `POST /api/settings/desktop/icons` - Save icon positions
- `GET /api/settings/desktop/icons` - Get icon positions

**Files:**
- `POST /api/files/copy` - Copy files
- `POST /api/files/rename` - Move/rename files
- `DELETE /api/files/delete` - Delete to trash

## Migration Guide

### From Old Drag System

**Before:**
```vue
<div
  draggable="true"
  @dragstart="handleDragStart"
  @drop="handleDrop"
>
```

**After:**
```vue
<draggable
  v-model="items"
  :group="{ name: 'files' }"
  :animation="150"
  ghost-class="drag-ghost"
  @change="onDragChange"
>
  <template #item="{ element }">
    <!-- Item content -->
  </template>
</draggable>
```

### Using the Composable

```vue
<script setup>
import { useDragDrop } from '@/composables/useDragDrop';
import type { DragItem, DropZone } from '@/types/drag';

const { handleDragStart, handleDrop, dragState } = useDragDrop();

const onDragStart = (event, items) => {
  const dragItems: DragItem[] = items.map(item => ({
    id: item.id,
    name: item.name,
    type: item.type,
    path: item.path,
  }));

  handleDragStart(event, dragItems, 'move');
};

const onDrop = async (event, destination) => {
  const result = await handleDrop(event, destination);
  if (result?.success) {
    // Handle success
  }
};
</script>
```

## Customization

### Custom Drag Preview

```typescript
const createCustomPreview = (items: DragItem[]) => {
  const preview = document.createElement('div');
  preview.className = 'custom-drag-preview';
  preview.innerHTML = `
    <div class="preview-count">${items.length}</div>
    <div class="preview-icon">📁</div>
  `;
  return preview;
};
```

### Custom Drop Zone Validation

```typescript
const zone: DropZone = {
  id: 'custom-zone',
  type: 'folder',
  accepts: ['file', 'folder'],
  validator: (items: DragItem[]) => {
    // Custom validation logic
    return items.every(item => item.size < MAX_SIZE);
  }
};
```

### Custom Amiga Colors

Edit `src/client/plugins/vuetify.ts`:

```typescript
const amigaColors = {
  background: '#a0a0a0',
  amigaBlue: '#0055aa',
  amigaOrange: '#ffaa00',
  // Add custom colors
};
```

## Performance Considerations

1. **Large File Lists**: Use virtual scrolling for folders with 100+ items
2. **Drag Throttling**: Mouse move events are not throttled by default
3. **History Size**: Limited to 50 operations (configurable in `useDragDrop.ts`)

### Optimization Tips

```typescript
// Limit history size
const MAX_HISTORY = 20; // Default: 50

// Disable animations for large lists
<draggable :animation="items.length > 100 ? 0 : 150">

// Use handle for better performance
<draggable handle=".drag-handle">
```

## Accessibility

### Keyboard Support

- **Tab**: Navigate between items
- **Enter/Space**: Select item
- **Ctrl+C**: Copy to clipboard
- **Ctrl+X**: Cut to clipboard
- **Ctrl+V**: Paste from clipboard
- **Delete**: Move to trash

### ARIA Attributes

Add to components:

```vue
<div
  role="listitem"
  :aria-selected="isSelected"
  :aria-label="`${item.name}, ${item.type}`"
  tabindex="0"
>
```

## Testing

### Manual Testing Checklist

- [ ] Drag single file to folder
- [ ] Drag multiple files to folder
- [ ] Copy files with Ctrl/Cmd
- [ ] Drag to trash
- [ ] Reorder settings
- [ ] Move desktop icons
- [ ] Snap to grid works
- [ ] Icon positions persist
- [ ] Invalid drop shows feedback
- [ ] Undo works (when implemented)

### Unit Testing

```typescript
import { useDragDrop } from '@/composables/useDragDrop';

describe('useDragDrop', () => {
  it('should start drag operation', () => {
    const { startDrag, dragState } = useDragDrop();
    const items = [{ id: '1', name: 'test.txt', type: 'file' }];

    startDrag(items, 'move', 'folder1');

    expect(dragState.value.isDragging).toBe(true);
    expect(dragState.value.dragOperation?.items).toEqual(items);
  });
});
```

## Troubleshooting

### Common Issues

**1. Drag not working**
- Check if `draggable="true"` is set
- Verify vuedraggable is installed
- Check console for errors

**2. Drop not triggering**
- Ensure `@drop.prevent` is used
- Check drop zone validation
- Verify `canDrop` is true

**3. Visual feedback missing**
- Import drag.css in style.css
- Check CSS class names match
- Verify z-index values

**4. Server errors on drop**
- Check API endpoints are correct
- Verify request body format
- Check server logs

### Debug Mode

```typescript
// Enable logging
const { dragState } = useDragDrop();

watch(dragState, (state) => {
  console.log('Drag state:', state);
}, { deep: true });
```

## Future Enhancements

- [ ] Undo/redo implementation
- [ ] Drag preview thumbnails
- [ ] Multi-window drag and drop
- [ ] Network file operations
- [ ] Conflict resolution UI
- [ ] Batch operation progress
- [ ] Touch device support
- [ ] Accessibility improvements

## Dependencies

```json
{
  "vuetify": "^3.4.0",
  "@mdi/font": "^7.4.47",
  "vuedraggable": "^4.1.0"
}
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

Same as WebOS project.

## Contributors

- Enhanced drag & drop system
- Vuetify 3 integration
- Server API endpoints
- Documentation

---

For more information, see:
- [Vuetify 3 Documentation](https://vuetifyjs.com/)
- [vue.draggable.next](https://github.com/SortableJS/vue.draggable.next)
- [HTML5 Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)
