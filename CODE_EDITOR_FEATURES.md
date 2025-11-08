# WebOS Code Editor - Feature Documentation

## Overview

The **WebOS Code Editor** is a comprehensive code editing application built for the WebOS platform. It features syntax highlighting, multiple file tabs, find/replace functionality, and maintains the authentic Amiga Workbench aesthetic.

## File Locations

### Component
- **Path**: `/home/user/webos/src/client/components/apps/AmigaCodeEditor.vue`
- **Size**: ~1000 lines
- **Dependencies**: Prism.js (lightweight syntax highlighter)

### Integration
- **Desktop Integration**: `/home/user/webos/src/client/components/AmigaDesktop.vue`
  - Added to Tools menu
  - Configured in `toolConfigs`
  - Auto-opens for code file types

### Sample Files
- **Location**: `/home/user/webos/src/server/storage/workbench/dh0/Code/`
- **Files**:
  - `hello.js` - JavaScript example
  - `styles.css` - CSS example
  - `index.html` - HTML example
  - `config.json` - JSON example
  - `README.md` - Markdown example
  - `example.py` - Python example

## Features Implemented

### 1. Core Editor Features
- ✅ **Syntax Highlighting** using Prism.js
  - JavaScript, TypeScript, HTML, CSS, JSON, Markdown
  - Python, Java, C++, and more
  - Lightweight (~30KB with all languages)
- ✅ **Line Numbers** with active line highlighting
- ✅ **Multiple Tabs** for working with multiple files simultaneously
- ✅ **Auto-indentation** on Enter key
- ✅ **Tab key inserts spaces** (not tab character)
- ✅ **Cursor position tracking** (line and column)

### 2. Find & Replace
- ✅ **Find** with case-sensitive and regex options
- ✅ **Find Next/Previous** with wraparound
- ✅ **Replace** individual occurrences
- ✅ **Replace All** with occurrence count
- ✅ **Keyboard shortcuts** (Ctrl+F, Ctrl+H)

### 3. View Options
- ✅ **Toggle Line Numbers**
- ✅ **Toggle Word Wrap**
- ✅ **Toggle Whitespace** visibility
- ✅ **Zoom In/Out** (Ctrl+Plus/Minus)
- ✅ **Reset Zoom** (Ctrl+0)
- ✅ **Three Themes**:
  - Amiga (retro theme with classic colors)
  - Dark (modern dark theme)
  - Light (clean light theme)

### 4. File Operations
- ✅ **New File** creation
- ✅ **Open File** from WebOS file system
- ✅ **Save File** (Ctrl+S)
- ✅ **Save As** with path specification
- ✅ **Recent Files** list (last 10 files)
- ✅ **Auto-save** every 30 seconds to localStorage
- ✅ **Recover unsaved changes** from previous session
- ✅ **Dirty flag** indicator (asterisk for modified files)

### 5. Edit Operations
- ✅ **Undo/Redo** (Ctrl+Z / Ctrl+Y)
- ✅ **Cut/Copy/Paste** with keyboard shortcuts
- ✅ **Toggle Comment** (Ctrl+/) - language-aware
- ✅ **Duplicate Line** (Ctrl+D)
- ✅ **Delete Line** (Ctrl+Shift+K)
- ✅ **Go to Line** (Ctrl+G)

### 6. Status Bar
- ✅ **Current Language** display
- ✅ **File Encoding** (UTF-8)
- ✅ **Line & Column** position
- ✅ **File Size** (bytes/KB/MB)
- ✅ **Status Messages** for operations
- ✅ **Modified Indicator**

### 7. User Interface
- ✅ **Amiga-style Menu Bar** (File, Edit, View)
- ✅ **Toolbar** with common actions
- ✅ **Language Selector** dropdown
- ✅ **Theme Selector** dropdown
- ✅ **Tab Bar** with close buttons
- ✅ **Dialogs** for Find, Replace, Go to Line, Open File
- ✅ **Authentic Amiga styling** (beveled borders, retro colors)

### 8. File Type Associations
The Code Editor automatically opens for these file extensions:
- JavaScript: `.js`, `.jsx`, `.ts`, `.tsx`
- HTML: `.html`, `.htm`
- CSS: `.css`, `.scss`, `.sass`, `.less`
- Config: `.json`, `.yaml`, `.yml`, `.xml`
- Documentation: `.md`, `.markdown`
- Programming: `.py`, `.java`, `.cpp`, `.c`, `.h`, `.hpp`
- Scripting: `.sh`, `.bash`, `.sql`, `.php`, `.rb`, `.go`, `.rs`

### 9. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl+N** | New File |
| **Ctrl+O** | Open File |
| **Ctrl+S** | Save File |
| **Ctrl+F** | Find |
| **Ctrl+H** | Find & Replace |
| **Ctrl+G** | Go to Line |
| **Ctrl+Z** | Undo |
| **Ctrl+Y** | Redo |
| **Ctrl+/** | Toggle Comment |
| **Ctrl+D** | Duplicate Line |
| **Ctrl+Shift+K** | Delete Line |
| **Ctrl++** | Zoom In |
| **Ctrl+-** | Zoom Out |
| **Ctrl+0** | Reset Zoom |
| **Tab** | Insert Spaces (2 spaces) |
| **Enter** | Auto-indent new line |

### 10. Syntax Themes

#### Amiga Theme (Retro)
- Background: `#c0c0c0` (light gray)
- Keywords: `#0055aa` (Amiga blue)
- Strings: `#ff8800` (orange)
- Comments: `#707070` (gray)
- Functions: `#00aa00` (green)
- Numbers: `#aa5500` (brown)

#### Dark Theme (Modern)
- Background: `#1e1e1e`
- Keywords: `#569cd6` (light blue)
- Strings: `#ce9178` (peach)
- Comments: `#6a9955` (green)
- Functions: `#dcdcaa` (yellow)

#### Light Theme (Clean)
- Background: `#ffffff`
- Keywords: `#0000ff` (blue)
- Strings: `#a31515` (red)
- Comments: `#008000` (green)
- Functions: `#795e26` (brown)

## How to Use

### Opening the Code Editor

1. **From Tools Menu**:
   - Click `Tools` → `Code Editor`
   - Opens a new empty editor window

2. **Double-click Code Files**:
   - Navigate to `dh0/Code/` directory
   - Double-click any `.js`, `.css`, `.html`, `.py`, etc.
   - File opens automatically in Code Editor

3. **From Recent Files**:
   - Open Code Editor
   - Click `File` → `Open`
   - Select from recent files list

### Working with Multiple Files

1. Click the **+** button in tab bar to create new tab
2. Open multiple files - each opens in its own tab
3. Click tabs to switch between files
4. Click **×** to close individual tabs
5. Modified files show **\*** in tab title

### Using Find & Replace

1. Press **Ctrl+F** or click `Edit` → `Find`
2. Enter search text
3. Enable **Case sensitive** or **Regex** if needed
4. Click **Find Next** or **Find Previous**
5. For replace, press **Ctrl+H**
6. Enter replacement text
7. Click **Replace** or **Replace All**

### Customizing Appearance

1. **Change Theme**: Select from Theme dropdown (Amiga/Dark/Light)
2. **Toggle Line Numbers**: Click `View` → `Line Numbers`
3. **Enable Word Wrap**: Click `View` → `Word Wrap`
4. **Adjust Font Size**: Use Ctrl+Plus/Minus or `View` → `Zoom In/Out`

### Auto-save & Recovery

- Files are auto-saved to localStorage every 30 seconds
- On restart, you'll be prompted to recover unsaved changes
- Session includes all open tabs and their content
- Editor preferences (theme, font size) are also saved

## Technical Details

### Bundle Size Impact
- **Prism.js core**: ~2KB
- **Language modules**: ~3KB each (loaded on demand)
- **Total addition**: ~30KB (with common languages)
- **Component code**: ~40KB

### Performance Considerations
- Syntax highlighting runs on input (debounced)
- Large files (>1MB) may experience slight lag
- Line numbers update on scroll (synchronized)
- Undo stack limited to 50 operations

### Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (with minor styling differences)
- Requires ES2020+ features

### Security
- All file paths are sanitized server-side
- File operations use WebOS API endpoints
- No direct filesystem access from client
- Auto-save uses localStorage (client-only)

## Known Limitations

1. **No Code Folding**: Planned for future release
2. **No IntelliSense**: Autocomplete not implemented
3. **No Minimap**: Removed to keep bundle size small
4. **No Split View**: Planned for future release
5. **Limited Undo History**: Maximum 50 operations
6. **No Linting**: No real-time error checking
7. **No Git Integration**: Version control not available

## Future Enhancements (Planned)

- [ ] Code folding for functions/blocks
- [ ] IntelliSense/autocomplete
- [ ] Minimap (optional, toggleable)
- [ ] Split view (horizontal/vertical)
- [ ] File templates (HTML boilerplate, etc.)
- [ ] Export as PDF/HTML with syntax highlighting
- [ ] Print with syntax highlighting
- [ ] Column selection mode (Alt+Click)
- [ ] Real-time collaboration (multi-user editing)
- [ ] Git integration (commit, diff, blame)

## Troubleshooting

### Syntax highlighting not working
- Check if language is supported
- Verify Prism.js is loaded (check browser console)
- Try switching themes

### Auto-save not working
- Check localStorage is enabled in browser
- Clear browser cache if issues persist
- Verify file path is set (not "Untitled")

### File won't open
- Check file exists in WebOS file system
- Verify file extension is supported
- Check browser console for errors

### Tabs not switching
- Ensure only one Code Editor window is open
- Close and reopen the editor
- Clear localStorage: `localStorage.removeItem('webos-code-editor-autosave')`

### Performance issues with large files
- Try disabling syntax highlighting (select "Plain Text" language)
- Disable line numbers
- Close other tabs
- Use NotePad for very large text files

## Integration Notes

The Code Editor is fully integrated into WebOS:

1. **Menu Integration**: Available in `Tools` → `Code Editor`
2. **File Associations**: Auto-opens for code file types
3. **API Integration**: Uses WebOS file API (`/api/files/read`, `/api/files/write`)
4. **Style Consistency**: Matches Amiga Workbench aesthetic
5. **Window Management**: Works with WebOS window system (drag, resize, close)

## Development Notes

### Adding New Language Support

To add a new language to syntax highlighting:

1. Install Prism language component:
   ```javascript
   import 'prismjs/components/prism-newlang';
   ```

2. Add to language selector in template:
   ```html
   <option value="newlang">New Language</option>
   ```

3. Add file extension mapping in `detectLanguage()`:
   ```javascript
   const langMap = {
     'ext': 'newlang',
     // ...
   };
   ```

### Customizing Themes

Themes are defined in the `<style>` section:

```css
.theme-custom {
  background: #yourcolor;
  color: #yourcolor;
}

.theme-custom :deep(.token.keyword) {
  color: #yourcolor;
}
```

## Support

For issues, questions, or feature requests:
- Check the sample files in `dh0/Code/` directory
- Review keyboard shortcuts
- Test with different themes
- Check browser console for errors

---

**Version**: 1.0.0
**Last Updated**: November 8, 2025
**WebOS Phase**: 7+ (Advanced Features)
