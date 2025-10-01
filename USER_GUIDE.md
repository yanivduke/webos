# 🖥️ WebOS Amiga Workbench - Complete User Guide

## 🎉 Welcome to WebOS!

Your retro Amiga Workbench operating system is now fully operational with **5 working applications**, **real file system**, and **authentic 1980s-90s aesthetics**.

---

## 🚀 Getting Started

### Starting the System

**1. Start the Server (Terminal 1):**
```bash
cd /Users/duke/dev/projects/webos
node src/server/index.js
```

You should see:
```
═══════════════════════════════════════════════════════
  🖥️  WebOS Server - Amiga Workbench Style
═══════════════════════════════════════════════════════
  Server running on: http://localhost:3001
```

**2. Start the Client (Terminal 2):**
```bash
cd /Users/duke/dev/projects/webos/src/client
npm run dev
```

**3. Open Browser:**
```
http://localhost:3000
```

---

## 🎮 Desktop Overview

### Top Menu Bar
- **Workbench** - System info, execute commands, quit
- **Window** - Window management options
- **Icons** - File operations
- **Tools** - Access utilities

### System Info (Top Right)
- **Time** - Current time (HH:MM:SS)
- **Chip: 512K** - Simulated chip memory
- **Fast: 512K** - Simulated fast memory

### Desktop Icons (Left Side)
- **Workbench3.1 (df0:)** - Floppy disk
- **System (dh0:)** - Main hard drive with your files
- **Work (dh1:)** - Secondary storage
- **RAM Disk** - Temporary storage
- **Utilities** - System tools and apps
- **Trash** - Deleted items

### Bottom Status Bar
- **Screen Info** - Display resolution and color mode
- **Drive LED** - Flashes red during disk activity
- **Selection Count** - Number of selected items

---

## 📁 File Management

### Opening Disks
- **Double-click** any disk icon to open its window
- **Single-click** to select

### Working with Files
- **Single-click** - Select file
- **Ctrl/Cmd + click** - Multi-select
- **Double-click** - Open file (text files open in NotePad)
- **Right-click** - Context menu (Open, Delete, etc.)

### Context Menu (Right-Click)
- **Open** ▶ - Open the selected item
- **Copy** 📋 - (Coming soon)
- **Rename** ✏ - (Coming soon)
- **Delete** 🗑 - Move to trash
- **Info** ℹ - (Coming soon)

---

## 📝 Application 1: NotePad (Text Editor)

### Opening NotePad
1. Double-click **System (dh0:)** disk
2. Double-click any **.txt** file (e.g., readme.txt)

OR

1. Double-click **Utilities**
2. Double-click **NotePad** tool
3. File → New to create new document

### Features
- **File Menu**
  - New - Create new document
  - Open - Browse and open files
  - Save - Save current file
  - Save As - Save with new name
  - File Info - View file metadata
  - Close - Close window

- **Edit Menu**
  - Undo/Redo - (Coming soon)
  - Cut/Copy/Paste - (Coming soon)
  - Find - (Coming soon)
  - Select All - (Coming soon)

### Keyboard Shortcuts
- Type freely in the text area
- File saves to real file system on server
- Changes persist across server restarts

### Status Bar
- Shows line count, character count
- File size and last modified date
- Dirty indicator (*) shows unsaved changes

---

## 🎨 Application 2: AmigaPaint (Drawing)

### Opening Paint
1. Double-click **Utilities**
2. Double-click **MultiView** tool

### Drawing Tools (Left Toolbar)
1. **Pencil** ✏ - Freehand drawing
2. **Line** - Draw straight lines
3. **Rectangle** □ - Draw rectangles
4. **Circle** ○ - Draw circles
5. **Fill** - Flood fill areas
6. **Eraser** - Erase pixels

### Color Palette (Top)
- **16 authentic Amiga colors**
- Click any color to select
- Selected color shows in status bar

### Brush Size
- Slider at top: 1-20 pixels
- Affects pencil, line, and eraser tools

### File Menu
- **New Canvas** - Clear and start fresh
- **Save PNG** - Download as PNG file to your computer

### Usage Tips
- **Pencil**: Click and drag to draw freehand
- **Shapes**: Click start point, drag to end point
- **Fill**: Click inside an enclosed area to flood fill
- **Eraser**: Click and drag to erase

### Canvas
- Default size: 640x400 pixels
- White background
- Scrollable if larger than window

---

## 🔢 Application 3: Calculator

### Opening Calculator
1. Double-click **Utilities**
2. Double-click **Calculator** tool

### Features
- **Number Pad**: 0-9 digits
- **Basic Operations**: + - × ÷
- **Advanced Functions**:
  - **√** - Square root
  - **x²** - Square (power of 2)
  - **%** - Percentage
  - **+/-** - Negate (change sign)
- **Controls**:
  - **C** - Clear all
  - **CE** - Clear entry (last number)
  - **=** - Calculate result

### LED Display
- Green phosphor-style display (authentic!)
- Shows up to 12 digits
- Errors display "ERROR"

### Usage Examples
```
Basic: 12 + 34 = 46
Square: 5 x² = 25
Root: 25 √ = 5
Percent: 50 % = 0.5
Negate: 10 +/- = -10
```

### Keyboard Support
- Number keys: 0-9
- Operations: +, -, *, /
- Enter/= for equals
- Escape for clear

---

## 💻 Application 4: Shell (Terminal)

### Opening Shell
1. Double-click **Utilities**
2. Double-click **Shell** tool

### Available Commands

#### File System
- `ls` or `dir` - List files in current directory
- `cd <path>` - Change directory (e.g., `cd dh0`)
- `pwd` - Show current directory path
- `cat <file>` or `type <file>` - Read file contents
- `mkdir <name>` - Create new directory
- `rm <file>` or `delete <file>` - Delete file (asks for confirmation)

#### System
- `help` - Show all commands
- `clear` or `cls` - Clear screen
- `echo <message>` - Display message
- `date` - Show current date and time
- `about` - About screen with ASCII art
- `version` - Show system version

### Command History
- **Up Arrow** - Previous command
- **Down Arrow** - Next command
- **Tab** - Command autocomplete (coming soon)

### Usage Examples
```bash
dh0:> help
dh0:> ls
dh0:> cat readme.txt
dh0:> mkdir MyFolder
dh0:> cd dh1
dh1:> echo Hello World
dh1:> date
dh1:> about
```

### Color Coding
- **Green** - Prompt and success messages
- **White** - Standard output
- **Red** - Errors
- **Cyan** - Info messages

### Features
- Auto-scrolling output
- Command history stored in session
- Real file system integration
- Path navigation (cd between disks)

---

## 🕐 Application 5: Clock

### Opening Clock
1. Double-click **Utilities**
2. Double-click **Clock** tool

### Features

#### Analog Clock
- Classic clock face with hour markers
- Three animated hands:
  - **Hour hand** (short, thick)
  - **Minute hand** (medium)
  - **Second hand** (thin, red)
- Updates every second

#### Digital Display
- Large time display (HH:MM:SS)
- Date display (Day, Month DD, YYYY)
- Format toggle (12h/24h)

#### Info Panel
- **Timezone** - Your system timezone
- **Day of Week** - Current day name
- **Week Number** - ISO week number
- **AM/PM** - For 12-hour format

### Controls
- **12h/24h Toggle** - Switch time formats
- Window is compact (320x480px)

---

## 🪟 Window Management

### Moving Windows
- **Click and drag** the title bar
- Windows stay within screen bounds

### Resizing Windows
- **Click and drag** bottom-right corner
- Minimum size: 200x150 pixels

### Window Controls (Title Bar)
- **Close (×)** - Close window
- **Depth (↕)** - Send window to back
- **Zoom (⊡)** - Maximize/restore window

### Multiple Windows
- Open as many windows as you want
- Click any window to bring to front
- Windows automatically cascade when opened

---

## 💾 Real File System

### Storage Structure
```
src/server/storage/workbench/
├── df0/          Floppy disk (Workbench)
├── dh0/          Hard drive (System) - YOUR FILES HERE
├── dh1/          Hard drive (Work)
├── ram/          RAM disk (temporary)
└── trash/        Deleted items
```

### File Operations

#### Creating Files
**Via NotePad:**
1. Open NotePad
2. File → Save As
3. Enter filename and path

**Via Shell:**
```bash
dh0:> echo "Hello" > test.txt
```

#### Reading Files
**Double-click** .txt files to open in NotePad

**Via Shell:**
```bash
dh0:> cat readme.txt
```

#### Deleting Files
**Right-click** → Delete

**Via Shell:**
```bash
dh0:> rm oldfile.txt
```

### File Metadata
All files track:
- **Created date** - When file was created
- **Modified date** - Last edit timestamp
- **Size** - File size in bytes/KB/MB
- **Type** - file, folder, tool, or disk

### Persistence
- Files are **REAL** and stored on disk
- Files **persist** across server restarts
- Located in `src/server/storage/workbench/`

---

## ⌨️ Keyboard Shortcuts

### Global
- **Escape** - Close context menu
- **F5** - Refresh (browser)

### NotePad
- **Ctrl/Cmd + S** - Save file (coming soon)
- **Ctrl/Cmd + N** - New file (coming soon)

### Calculator
- **0-9** - Number keys
- **+, -, *, /** - Operations
- **Enter** - Equals
- **Escape** - Clear

### Shell
- **Enter** - Execute command
- **Up/Down arrows** - Command history
- **Tab** - Autocomplete (coming soon)

---

## 🎨 Design Aesthetic

### Authentic Amiga Workbench
- **Background**: `#a0a0a0` (classic Workbench gray)
- **Highlights**: `#0055aa` (Amiga blue)
- **Folders**: `#ffaa00` (orange)
- **Text**: `#000000` on light backgrounds

### Typography
- **Font**: "Press Start 2P" (retro pixel font)
- **Fallback**: "Courier New", monospace
- **Sizes**: 9-11px for UI elements

### UI Elements
- **Beveled borders**: Light (#ffffff) top/left, dark (#000000) bottom/right
- **Border width**: 2px (chunky retro feel)
- **Buttons**: Raised when inactive, pressed when active
- **Transitions**: Max 0.1s (instant, not smooth)

### Window Chrome
- Gradient title bars (white → gray)
- Close button (orange X)
- Depth button (blue square)
- Zoom button (blue square with bar)

---

## 🐛 Troubleshooting

### Server Won't Start
```bash
# Check if port 3001 is in use
lsof -ti:3001

# Kill existing process
kill $(lsof -ti:3001)

# Restart server
node src/server/index.js
```

### Client Won't Start
```bash
# Check if port 3000 is in use
lsof -ti:3000

# Clear Vite cache
rm -rf src/client/node_modules/.vite

# Reinstall dependencies
cd src/client && npm install

# Start dev server
npm run dev
```

### Files Not Showing
- Check server is running on port 3001
- Check `src/server/storage/workbench/` exists
- Try refreshing browser (F5)
- Check browser console for errors

### Context Menu Not Appearing
- Make sure you're **right-clicking** (not left-click)
- Check that item is selectable
- Try clicking outside menu to close, then try again

### Applications Not Opening
- Verify server is running
- Check browser console for errors
- Ensure you're **double-clicking** (not single-click)
- Try refreshing page

### Calculator Shows ERROR
- This is normal for invalid operations (e.g., divide by zero)
- Press **C** to clear and try again

### Shell Commands Not Working
- Check spelling (commands are case-sensitive)
- Use `help` to see available commands
- Make sure server is running
- Check you're in correct directory with `pwd`

---

## 📊 File System API Reference

### Endpoints

```bash
# List directory contents
GET /api/files/list?path=dh0

# Create file or folder
POST /api/files/create
{
  "path": "dh0",
  "name": "newfile.txt",
  "type": "file",
  "content": "Hello World"
}

# Read file
POST /api/files/read
{
  "path": "dh0/readme.txt"
}

# Write file
POST /api/files/write
{
  "path": "dh0/readme.txt",
  "content": "Updated content"
}

# Rename file/folder
POST /api/files/rename
{
  "path": "dh0/oldname.txt",
  "newName": "newname.txt"
}

# Delete file/folder
DELETE /api/files/delete?path=dh0/file.txt
```

### Security Checklist for Cloud Hosting

- Require authenticated sessions before the UI (or automation) can hit `/api/files`, `/api/app-state`, or `/api/shell` in production.
- Terminate TLS in front of the Express server so browser windows, REST calls, and JSON state sync are encrypted.
- Keep storage scoped: mount cloud volumes or object storage with credentials limited to `src/server/storage/workbench/` and rotate them periodically.
- Log and monitor: preserve server logs for audit trails, alert on repeated errors, and run scheduled integrity checks on JSON state files.
- Sanitize everything: never bypass the shared `sanitizePath`/`sanitizeName` helpers when building new file operations.

---

## 🎯 Tips & Tricks

### Productivity
1. **Use keyboard shortcuts** in Calculator and Shell
2. **Multi-select files** with Ctrl/Cmd + click
3. **Command history** in Shell (up/down arrows)
4. **Color palette** in Paint - plan your colors first

### Organization
1. Create folders in Shell with `mkdir`
2. Use dh0 for system files, dh1 for work files
3. Empty trash periodically
4. Use NotePad to create README files for folders

### Creative
1. **AmigaPaint** supports 16 colors - use them all!
2. Try different brush sizes for effects
3. Save your drawings frequently (downloads to computer)
4. Experiment with flood fill for backgrounds

### System
1. Keep Shell window open for quick file operations
2. Clock utility shows timezone info
3. Context menus save time vs. menu bar
4. Window title bars show current path

---

## 🚧 Coming Soon

### Phase 3 Enhancements
- **Folder navigation** - Click into subdirectories
- **Copy/Paste** - Between files and apps
- **Rename dialog** - Inline file renaming
- **File info dialog** - Detailed metadata view
- **Keyboard shortcuts** - Ctrl+S, Ctrl+N, etc.

### Phase 4 Features
- **Sound effects** - Disk clicks, button sounds
- **Screen preferences** - Resolution, colors
- **Custom backdrops** - Pattern selector
- **Drag and drop** - Move files between windows
- **Search** - Find files by name
- **More tools** - IconEdit, Preferences panel

---

## 📖 Additional Resources

- **QUICKSTART.md** - Quick setup guide
- **AMIGA_README.md** - Full feature documentation
- **CLAUDE.md** - Developer architecture guide
- **README.md** - Original project description

---

## 💡 Pro Tips

1. **Cascading windows** - Open multiple file browsers to compare
2. **Shell + NotePad** - Use shell to create, NotePad to edit
3. **Calculator precision** - Use for quick hex/decimal conversions
4. **Paint workflow** - Sketch with pencil, finalize with shapes
5. **Clock as widget** - Keep it open in corner for quick time checks

---

## 🎓 Learning More

### Understanding the System
- All files are stored in `src/server/storage/workbench/`
- File operations go through REST API
- Applications are Vue 3 components
- Design follows Amiga Workbench 3.1 guidelines

### Exploring Code
- Client components: `src/client/components/apps/`
- Server routes: `src/server/routes/`
- File storage: `src/server/storage/workbench/`
- See CLAUDE.md for architecture details

---

## ❓ FAQ

**Q: Can I access files from my real computer?**
A: Yes! They're in `src/server/storage/workbench/dh0/` (or dh1, df0, etc.)

**Q: Do files persist after restart?**
A: Yes! All files are real and stored on disk.

**Q: Can I save Paint drawings to file system?**
A: Not yet - currently downloads PNG. Coming in Phase 3!

**Q: Why 16 colors only?**
A: Authentic Amiga had 4096 colors but typically used 16-32 for performance.

**Q: Can I run this on mobile?**
A: Works best on desktop. Touch support coming later.

**Q: Is this the real Amiga OS?**
A: No - it's a web recreation. Real Amiga runs on Motorola 68k CPUs!

---

**Made with 🧡 for Amiga enthusiasts**

*"Only Amiga makes it possible!"* - Classic Amiga slogan

---

**Version**: 2.0.0
**Last Updated**: October 1, 2025
**Status**: Fully Operational ✅
