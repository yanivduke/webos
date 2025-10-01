# 🖥️ WebOS - Amiga Workbench Style Operating System

A web-based recreation of the classic **Amiga Commodore Workbench**, bringing the nostalgic computing experience of the 1980s-90s to modern browsers.

![Amiga Workbench](https://img.shields.io/badge/Style-Amiga%20Workbench-orange?style=for-the-badge)
![Vue 3](https://img.shields.io/badge/Vue-3.4-4FC08D?style=for-the-badge&logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript)

## ✨ Features

### 🎨 Authentic Amiga Workbench Design

- **Classic Gray Desktop** - Authentic #a0a0a0 Workbench background
- **Retro Typography** - Press Start 2P pixel font
- **Beveled Windows** - Classic 3D beveled frames with light/shadow borders
- **Iconic Menu Bar** - Traditional Workbench menu (Workbench, Window, Icons, Tools)
- **System Info Bar** - Real-time clock, Chip/Fast memory, drive activity LED
- **Scanline Effect** - Optional CRT scanline overlay

### 🪟 Window Management

- ✅ **Draggable Windows** - Click and drag title bars
- ✅ **Resizable Windows** - Resize handle in bottom-right corner
- ✅ **Window Controls** - Close, depth (send to back), and zoom buttons
- ✅ **Multi-Window Support** - Proper z-index management
- ✅ **Maximize/Restore** - Double-click title bar to maximize

### 💾 Desktop & File System

- ✅ **Disk Icons** - Floppy drives (DF0:), Hard drives (DH0:, DH1:)
- ✅ **RAM Disk** - Classic RAM: temporary storage
- ✅ **Utilities Drawer** - System tools and applications
- ✅ **Trash Can** - Delete and restore functionality
- ✅ **Icon Grid View** - Authentic Workbench icon layout
- ✅ **Multi-Select** - Ctrl/Cmd-click to select multiple items

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or 20+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/webos.git
   cd webos
   ```

2. **Install client dependencies**
   ```bash
   cd src/client
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

You should now see the Amiga Workbench interface! 🎉

## 🏗️ Project Structure

```
webos/
├── src/
│   ├── client/                 # Frontend Vue application
│   │   ├── components/
│   │   │   ├── AmigaDesktop.vue    # Main desktop component
│   │   │   ├── AmigaWindow.vue     # Draggable window component
│   │   │   ├── AmigaFolder.vue     # File browser component
│   │   │   └── AmigaFile.vue       # File component
│   │   ├── App.vue            # Root component
│   │   ├── main.ts            # Application entry point
│   │   ├── style.css          # Global styles
│   │   ├── index.html         # HTML template
│   │   ├── vite.config.ts     # Vite configuration
│   │   ├── tsconfig.json      # TypeScript config
│   │   └── package.json       # Dependencies
│   │
│   └── server/                # Backend Express application
│       ├── controllers/       # API controllers
│       ├── routes/           # API routes
│       └── package.json      # Server dependencies
│
└── README.md
```

## 🎮 Usage Guide

### Desktop Interaction

- **Double-click disk icons** to open windows
- **Single-click** to select items
- **Ctrl/Cmd + click** for multi-select
- **Drag windows** by their title bars
- **Resize windows** using the bottom-right corner handle

### Menu Bar

- **Workbench** - System info, execute commands, quit
- **Window** - New drawer, close window, clean up, snapshot
- **Icons** - Open, copy, rename, delete, format disk
- **Tools** - Clock, calculator, shell, preferences

### System Info Bar

- **Time** - Current system time (HH:MM:SS)
- **Chip Memory** - Simulated chip memory (512K)
- **Fast Memory** - Simulated fast memory (512K)
- **Drive LED** - Flashes red when accessing disks
- **Screen Info** - Display resolution and color depth

## 🎨 Design Philosophy

This project recreates the Amiga Workbench aesthetic with:

1. **Color Palette**
   - Background: `#a0a0a0` (Classic Workbench gray)
   - Highlights: `#0055aa` (Amiga blue)
   - Borders: `#ffffff` (light) and `#000000` (shadow)
   - Text: `#000000` on light backgrounds

2. **Typography**
   - Primary: "Press Start 2P" (retro pixel font)
   - Fallback: "Courier New", monospace

3. **UI Elements**
   - Beveled borders with inset/outset shadows
   - 2px borders for that chunky retro feel
   - Orange folder icons (`#ffaa00`)
   - Blue tool/application icons (`#0055aa`)

4. **Behavior**
   - Instant feedback (no slow animations)
   - Click-and-drag window movement
   - Traditional desktop paradigm

## 🔧 Development

### Build for Production

```bash
cd src/client
npm run build
```

The built files will be in `src/client/dist/`

### Type Checking

```bash
npm run type-check
```

### Preview Production Build

```bash
npm run preview
```

## 🛠️ Technologies Used

- **Frontend**
  - Vue 3.4 (Composition API)
  - TypeScript 5.3
  - Vite 5.0 (build tool)
  - CSS3 (no frameworks, pure CSS)

- **Backend** (Optional)
  - Node.js Express
  - TypeScript
  - RESTful API

## 🔐 Security Best Practices (Cloud & REST)

To keep desktop interactions and the backing file system safe when running in any hosted environment:

- **Authenticate API traffic** – require a login/session token before letting the UI call `/api/files`, `/api/app-state`, or `/api/shell`.
- **Enforce input sanitization** – the backend already strips `..`, colons, and path separators through shared utilities; do not bypass them when adding new routes.
- **Apply least privilege to storage** – mount remote disks or buckets with IAM policies scoped to the `workbench` directory only, and rotate credentials regularly.
- **Transport security** – proxy the Express server behind HTTPS and enable HSTS so browser windows and API calls are encrypted.
- **Audit & alerts** – capture server logs for failed auth/path traversal attempts and wire them into your SIEM or monitoring stack.
- **Backup JSON state** – schedule snapshots of `src/server/storage/state/*.json` and replicated volumes to guard against corruption or ransomware.
- **Review dependencies** – run `npm audit` (client/server) and upgrade vulnerable packages before deploying.

## 📋 Roadmap

### Phase 1: Core Desktop ✅
- [x] Amiga Workbench styling
- [x] Menu bar
- [x] System info bar
- [x] Desktop icons (disks, RAM, utilities, trash)
- [x] Draggable windows
- [x] Resizable windows
- [x] File browser with icon view

### Phase 2: System Tools ✅
- [x] Shell/CLI terminal - AmigaShell with full command support
- [x] Clock utility - AmigaClock with analog/digital display  
- [x] Calculator - AmigaCalculator with scientific functions
- [x] NotePad text editor - AmigaNotePad with file operations
- [x] MultiView (image viewer) - AmigaMultiView for viewing images
- [x] Preferences panel - AmigaPreferences for system settings

### Phase 3: File Operations ✅
- [x] Create/rename/delete files and folders - Full CRUD operations with backend API
- [x] Copy/paste functionality - Clipboard manager with keyboard shortcuts (Ctrl+C/X/V)
- [x] Drag-and-drop file moving - Visual feedback with copy/move operations (Ctrl=copy)
- [x] Enhanced context menus - Right-click menus with all file operations
- [x] Keyboard shortcuts - Delete, F2 rename, Ctrl+A select all

### Phase 4: Advanced Features 🎯
- [ ] Workbench preferences
- [ ] Screen resolution switching
- [ ] Custom backdrop patterns
- [ ] Sound effects (disk activity, clicks)
- [ ] Keyboard shortcuts
- [ ] Context menus (right-click)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Inspired by the legendary **Amiga Workbench** OS
- Font: [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) by CodeMan38
- Built with ❤️ and nostalgia for the golden age of computing

## 📸 Screenshots

### Workbench Desktop
The main desktop with disk icons, utilities drawer, and trash can.

### Window Management
Multiple draggable, resizable windows showing the file browser.

### Menu System
Traditional Workbench menu bar with all the classic options.

---

**Made with 🧡 for Amiga enthusiasts**

*"Only Amiga makes it possible!"* - Classic Amiga slogan
