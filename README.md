# WebOS - Retro Operating Systems in Your Browser

<div align="center">

**🎮 Bringing classic computing interfaces back to life 💾**

*Experience the nostalgia of Amiga Workbench, Windows 95, Mac OS System 7, and more—all in your browser with pixel-perfect authenticity.*

[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](CONTRIBUTING.md)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

---

## 🌟 What is WebOS?

WebOS is an **open-source platform for recreating beloved retro operating systems** as fully functional web applications. Each implementation is crafted with obsessive attention to authentic colors, fonts, window chrome, and UI behaviors—capturing not just the look, but the *soul* of classic computing.

### Currently Available

**🖥️ Amiga Workbench 3.1** - The iconic Commodore Amiga interface with authentic gray bevels, drag-and-drop icons, and retro applications:
- Authentic color palette (#a0a0a0 gray, #0055aa blue, #ffaa00 orange)
- Press Start 2P pixel font
- Draggable/resizable windows with classic chrome
- Working applications: NotePad, Paint, Calculator, Shell, Clock
- Real file system with disk drives (DF0:, DH0:, RAM:)
- WebAssembly SDK (AWML) for native app development

## 🚀 We Need Your Help!

**This is where YOU come in!** WebOS is designed as a community-driven platform for retro OS preservation. We're calling on developers, designers, and retro computing enthusiasts to help us bring more classic interfaces to life.

### 🎨 Help Us Build These Retro OS Themes:

- **Windows 3.1 / 95 / 98** - Gray interfaces, Start menu, iconic blue error screens
- **Mac OS System 7 / 8 / 9** - Platinum appearance, Chicago font, happy Mac
- **BeOS** - Yellow tab windows, futuristic design ahead of its time
- **NeXTSTEP** - Dark dock, NeXT cube aesthetic, the birthplace of macOS
- **OS/2 Warp** - IBM's alternative to Windows
- **Classic Linux DEs** - FVWM, Window Maker, Enlightenment, early KDE/GNOME
- **Atari TOS** - The Atari ST's GEM-based interface
- **RISC OS** - Acorn's unique three-button mouse UI
- **Your favorite retro OS!** - We're open to all classic interfaces

### 💡 How You Can Contribute:

1. **Implement a new OS theme** - Follow our [Retro OS Implementation Guide](RETRO_OS_GUIDE.md)
2. **Enhance existing themes** - Add applications, improve authenticity, fix bugs
3. **Research & documentation** - Share screenshots, design specs, authentic behaviors
4. **Report issues** - Found a bug? Let us know!
5. **Spread the word** - Star the repo, share with retro computing communities

**No experience with Vue or TypeScript?** We welcome research, screenshots, testing, and documentation contributions too!

👉 **[Read the Contributing Guide](CONTRIBUTING.md)** to get started

👉 **[Propose a Retro OS Theme](../../issues/new?template=retro_os_proposal.md)**

## 🤝 Join the Community

We believe in the power of open collaboration to preserve computing history. Whether you're a seasoned developer or just passionate about retro computing:

- **📝 [Contributing Guide](CONTRIBUTING.md)** - Learn how to contribute
- **🐛 [Report a Bug](../../issues/new?template=bug_report.md)** - Found an issue?
- **✨ [Request a Feature](../../issues/new?template=feature_request.md)** - Have an idea?
- **🖥️ [Propose a Retro OS](../../issues/new?template=retro_os_proposal.md)** - Suggest a classic OS to implement
- **💬 [GitHub Discussions](../../discussions)** - Ask questions, share ideas
- **⭐ Star this repo** - Help us reach more retro computing enthusiasts!

### Why Contribute?

- **Preserve computing history** - Keep classic interfaces alive for future generations
- **Learn retro design** - Study authentic UI/UX from computing's golden age
- **Build your portfolio** - Showcase your work on a unique open-source project
- **Connect with community** - Meet fellow retro computing enthusiasts
- **Have fun!** - There's joy in recreating these beloved interfaces

---

## 📚 Documentation

- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute code, documentation, and research
- **[RETRO_OS_GUIDE.md](RETRO_OS_GUIDE.md)** - Complete guide to implementing a new OS theme
- **[CLAUDE.md](CLAUDE.md)** - Detailed technical architecture documentation
- **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)** - Community guidelines and expectations

---

## Support This Project

WebOS is a labor of love bringing authentic 1980s-90s Amiga computing nostalgia to the modern web. If you enjoy this project and want to help keep development going, consider supporting:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support%20WebOS-orange?style=for-the-badge&logo=buy-me-a-coffee)](https://buymeacoffee.com/YOUR_USERNAME)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20WebOS-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/YOUR_USERNAME)
[![GitHub Sponsors](https://img.shields.io/badge/GitHub%20Sponsors-Sponsor-EA4AAA?style=for-the-badge&logo=github-sponsors)](https://github.com/sponsors/YOUR_USERNAME)
[![Patreon](https://img.shields.io/badge/Patreon-Support-F96854?style=for-the-badge&logo=patreon)](https://patreon.com/YOUR_USERNAME)

**Your support helps:**
- Keep servers running for live demos
- Fund development of new features (AWML SDK expansion, more Amiga apps, multiplayer features)
- Pay for retro computing research and testing on real Amiga hardware
- Create tutorials and documentation for the community
- Maintain and improve the codebase

**Alternative ways to support:**
- Star this repository
- Share WebOS on social media and retro computing communities
- Contribute code, bug reports, or documentation
- Create AWML applications and share them with the community

Every coffee fuels another pixel-perfect window border!

## Live Demo

🚀 **[Try WebOS Live](https://your-deployment-url.vercel.app)** (Deploy to get your URL!)

Experience the authentic Amiga Workbench interface directly in your browser. No installation required!

## Quick Deploy

Deploy your own instance of WebOS for free:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yanivduke/webos)

**One-click deployment to Vercel:**
1. Click the button above
2. Sign in to Vercel (free account)
3. Click "Deploy"
4. Wait 2-3 minutes
5. Your WebOS is live!

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions, custom domain setup, and production configuration.

## Architecture

### Security Best Practices Overview

This project ships with a lightweight Express REST API and a Vue 3/Vite client. When deploying to any hosted environment—especially cloud-based file storage—apply the following practices:

- **Enforce authentication & authorization**: protect every `/api` route behind session or token checks before exposing it publicly.
- **Validate and sanitize inputs**: reuse the server-side path utilities (`sanitizePath`, `sanitizeName`) for any user-supplied file paths or names and reject unexpected characters early.
- **Rate limit & log**: configure middleware such as `express-rate-limit` plus structured logging to detect brute-force or scraping attempts.
- **TLS everywhere**: terminate TLS in front of the Node.js server (e.g., via a reverse proxy) so credentials and file transfers never traverse the network in cleartext.
- **Least-privilege storage**: run the server with a dedicated OS user that can only read/write within `src/server/storage/workbench/`; mount cloud volumes with scoped IAM roles or service accounts.
- **Integrity & retention**: version JSON state files and user documents in object storage or backups so tampering can be detected and data can be restored quickly.
- **Automated security testing**: add CI jobs that lint dependencies (`npm audit`), run type checks, and execute integration tests against the REST API before every deployment cycle.

### WebAssembly Extension SDK (AWML Platform)

WebOS features a pluggable extension system based on **AWML** (Amiga WebAssembly Markup Language), enabling developers to create executable applications that run natively within the WebOS environment.

#### AWML Architecture Components

**1. AWML File Format (.awml)**

AWML files are XML-based descriptors that define WebAssembly applications with complete metadata, runtime requirements, and user configuration:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<awml version="1.0">
  <metadata>
    <name>My Application</name>
    <version>1.0.0</version>
    <author>Your Name</author>
    <description>Application description</description>
  </metadata>
  <runtime>
    <wasm src="app://main.wasm" />
    <memory initial="256" maximum="1024" />
    <permissions>
      <filesystem read="true" write="false" />
      <network enabled="false" />
    </permissions>
  </runtime>
  <window>
    <title>My App</title>
    <width>640</width>
    <height>480</height>
    <resizable>true</resizable>
  </window>
  <config>
    <setting key="theme" value="dark" type="string" />
  </config>
</awml>
```

**2. WebAssembly Runtime**

The AWML runtime (`AmigaAwmlRunner.vue`) provides a sandboxed execution environment with:

- **Memory management**: Configurable linear memory (initial/maximum pages)
- **Host API bindings**: Pre-defined JavaScript functions accessible from WASM
- **Event system**: Mouse, keyboard, and lifecycle event handling
- **Canvas rendering**: Direct pixel manipulation and graphics primitives
- **File system access**: Read/write operations within allowed paths
- **Configuration injection**: User settings passed to WASM on initialization

**3. Host API Functions**

WASM modules can import these functions from the `env` namespace:

| Function | Signature | Description |
|----------|-----------|-------------|
| `awml_log` | `(ptr: i32, len: i32)` | Log messages to runtime console |
| `awml_gfx_pixel` | `(x: i32, y: i32, r: i32, g: i32, b: i32, a: i32)` | Draw single pixel |
| `awml_gfx_rect` | `(x: i32, y: i32, w: i32, h: i32, r: i32, g: i32, b: i32, a: i32)` | Draw rectangle |
| `awml_gfx_clear` | `(r: i32, g: i32, b: i32)` | Clear screen with color |
| `awml_fs_read` | `(pathPtr: i32, pathLen: i32) -> i32` | Read file, returns content pointer |
| `awml_fs_write` | `(pathPtr: i32, pathLen: i32, contentPtr: i32, contentLen: i32) -> i32` | Write file, returns success |
| `awml_sys_time` | `() -> f64` | Get current timestamp |
| `awml_sys_random` | `() -> f64` | Get random number 0-1 |

**4. WASM Module Exports**

AWML applications should export these functions:

| Export | Signature | Description |
|--------|-----------|-------------|
| `awml_alloc` | `(size: i32) -> i32` | Allocate memory, return pointer |
| `awml_init` | `()` | Initialize application |
| `awml_entry` | `(configPtr: i32, configLen: i32)` | Entry point with JSON config |
| `awml_update` | `(deltaTime: i32)` | Update loop (called every frame) |
| `awml_render` | `()` | Render loop (called every frame) |
| `awml_on_mouse_down` | `(x: i32, y: i32, button: i32)` | Mouse button pressed |
| `awml_on_mouse_up` | `(x: i32, y: i32, button: i32)` | Mouse button released |
| `awml_on_mouse_move` | `(x: i32, y: i32)` | Mouse moved |
| `awml_on_key_down` | `(keyCode: i32)` | Key pressed |
| `awml_on_key_up` | `(keyCode: i32)` | Key released |
| `awml_cleanup` | `()` | Cleanup before termination |

**5. URI Schemes**

AWML supports multiple URI schemes for resource loading:

- `app://` - Relative to AWML file location (e.g., `app://main.wasm`)
- `data:` - Base64-encoded inline data (e.g., `data:application/wasm;base64,...`)
- `dh0:/` - Absolute path in workbench filesystem
- `resource:` - Bundled runtime resources

**6. Permission Model**

AWML applications declare required permissions in the manifest:

- **filesystem**: Read/write access to specific paths or entire filesystem
- **network**: HTTP requests to specified domains
- **system**: Ability to execute system commands (restricted)
- **clipboard**: Read/write clipboard data
- **media**: Access to audio/video APIs

**7. Execution Flow**

1. User double-clicks `.awml` file in AmigaFolder
2. `AmigaAwmlRunner` component opens in new window
3. AWML XML is parsed and validated using `AWMLParser`
4. WebAssembly binary is loaded from specified URI
5. Memory is allocated per manifest specifications
6. Import object created with host API functions
7. WASM module compiled and instantiated
8. `awml_init()` called to initialize
9. `awml_entry(config)` called with user configuration
10. Render loop starts if `awml_render()` exists
11. Events forwarded to WASM event handlers
12. `awml_cleanup()` called on window close

**8. File Type Handling**

- `.awml` files → Open in `AmigaAwmlRunner` for execution
- `.txt`, `.md`, `.json` → Open in `AmigaNotePad` text editor
- All other files → Display metadata in `AmigaFileInfo` component

**9. Legacy Component Fallback**

The AWML runner includes a **legacy mode** that automatically activates when WebAssembly binaries are unavailable. This allows pre-installed applications to function using Vue.js components while the WASM implementations are being developed:

- When an AWML file is opened, the runner attempts to load the referenced WASM binary
- If the WASM file is not found (404 error), the system automatically switches to legacy mode
- Legacy mode loads the corresponding Vue component (NotePad → `AmigaNotePad.vue`, Paint → `AmigaPaint.vue`, etc.)
- The application functions identically to the user, but runs using JavaScript instead of WebAssembly
- No error is shown to the user - the fallback is transparent

This dual-mode architecture allows:
- Gradual migration from Vue components to WASM applications
- Testing AWML manifests before WASM binaries are ready
- Maintaining a working system during SDK development
- Easy switching between implementations by adding/removing WASM files

See [AWML_SPECIFICATION.md](AWML_SPECIFICATION.md) for complete SDK documentation and examples.

### Frontend (Vue 3 + TypeScript + Vite)

The frontend is built with Vue 3 Composition API and TypeScript, featuring a pixel-perfect recreation of the classic Amiga Workbench aesthetic. The architecture emphasizes:

**Component Architecture:**
- **AmigaDesktop.vue** - Main orchestrator managing open windows, disk icons, menu bar, and system clock
- **AmigaWindow.vue** - Draggable/resizable window container with authentic Amiga chrome
- **AmigaFolder.vue** - File browser with icon grid, multi-select, and real API integration
- **Application Components** - NotePad (text editor), Paint (drawing), Calculator, Shell (terminal), Clock
- **AmigaAwmlRunner.vue** - WebAssembly runtime for AWML applications
- **AmigaFileInfo.vue** - Metadata viewer for non-executable files

**Design System:**
- Pure CSS (no UI frameworks) with authentic Amiga colors (#a0a0a0 gray, #0055aa blue, #ffaa00 orange)
- Beveled borders using border-color: #ffffff #000000 #000000 #ffffff
- Press Start 2P retro pixel font from Google Fonts
- Instant transitions (0.1s max) matching original Workbench snappiness
- 16-color palette matching Amiga OCS/ECS chipset

**State Management:**
- Vue 3 Composition API with ref() and computed() for reactive state
- No Vuex/Pinia - component-local state with props/events
- Window management via array in AmigaDesktop with z-index layering

**Build System:**
- Vite for fast development and optimized production builds
- TypeScript with strict mode for type safety
- Proxy configuration to forward `/api` requests to Express backend

### Backend (Node.js Express + CommonJS)

The backend provides RESTful APIs for file operations, application state persistence, shell command execution, and AWML module management.

**Key Backend Components:**
- **Express Server** (src/server/index.js) - Main entry point with CORS, JSON parsing, route mounting
- **File Operations** (routes/file-operations.route.js) - Real filesystem CRUD using Node.js fs/promises
- **Shell Commands** (routes/shell.route.js) - Terminal emulator backend with 12+ commands
- **App State** (routes/app-state.route.js) - JSON-based persistence for application data
- **State Manager** (utils/state-manager.js) - Utility class for JSON file storage with caching

**Storage Structure:**
- `src/server/storage/workbench/` - User filesystem (df0, dh0, dh1, ram, trash)
- `src/server/storage/state/` - Application state JSON files

**Module System:**
- CommonJS (require/module.exports) for compatibility
- No database - all data stored in filesystem and JSON files

### Integration

The frontend and backend communicate through RESTful API endpoints. Vue 3 components make HTTP requests to the Express backend using the Fetch API. Vite's proxy configuration forwards `/api/*` requests to the backend server on port 3001, enabling seamless development workflow. The backend processes requests, validates data using path sanitization utilities, and returns JSON responses.

## Installation Guide

### Prerequisites
- Node.js v14 or higher (recommended: v18 or v20)
- npm or yarn package manager
- A code editor (e.g., VS Code)

### Step-by-Step Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/webos.git
   cd webos
   ```

2. **Install Client Dependencies**
   ```bash
   cd src/client
   npm install
   ```

3. **Install Server Dependencies**
   ```bash
   cd ../server
   npm install
   ```

4. **Start the Backend Server**
   ```bash
   # From src/server directory
   node index.js

   # Or with auto-restart on changes
   npm run dev
   ```
   The server will start on http://localhost:3001

5. **Start the Frontend (in a new terminal)**
   ```bash
   cd src/client
   npm run dev
   ```
   The application will start on http://localhost:3000 and open in your browser.

## Usage Instructions

### Running the Application

After successful installation, you can access the WebOS interface by opening your browser and navigating to http://localhost:3000.

### Interacting with the Interface

- **Dashboard**: View system status, performance metrics, and recent activity
- **File System**: Navigate through directories, create, edit, and delete files
- **Applications**: Launch installed applications with drag-and-drop functionality
- **Settings**: Configure system preferences, user accounts, and notifications
- **Terminal**: Access a command-line interface with history and autocomplete

### API Endpoints

The backend exposes the following RESTful endpoints:

**System:**
- `GET /api/health` - Health check endpoint
- `GET /api/system/status` - Retrieve Amiga system information

**File Operations:**
- `GET /api/files/list?path=<path>` - List files in directory with metadata
- `POST /api/files/create` - Create file or directory
- `POST /api/files/read` - Read file contents
- `POST /api/files/write` - Write file contents
- `POST /api/files/rename` - Rename file or directory
- `DELETE /api/files/delete` - Move file to trash

**Shell Commands:**
- `POST /api/shell/execute` - Execute terminal command (ls, cd, cat, mkdir, rm, etc.)

**Application State:**
- `GET /api/app-state/:appId` - Load application state from JSON
- `POST /api/app-state/:appId` - Save application state to JSON
- `DELETE /api/app-state/:appId` - Delete application state
- `GET /api/app-state` - List all stored states

**Settings:**
- `GET /api/settings` - Retrieve all settings
- `POST /api/settings` - Update settings

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete endpoint documentation with request/response examples.

## Technical Requirements

### Client Requirements
- Node.js v14 or higher (recommended: v18 or v20)
- Modern web browser with WebAssembly support (Chrome 57+, Firefox 52+, Safari 11+, Edge 79+)
- TypeScript 5.x or later for development

### Server Requirements
- Node.js v14 or higher (recommended: v18 or v20)
- File system write permissions for `src/server/storage/` directory
- No database required - all data stored in filesystem

### Browser Compatibility
- **WebAssembly Support**: Required for AWML applications
- **Canvas API**: Required for Paint app and AWML graphics
- **Fetch API**: Required for API communication
- **Local Storage**: Used for client-side preferences
- **CSS Grid/Flexbox**: Required for layout

### Development Environment
- Use Node.js v18 or v20 for optimal performance and stability
- VSCode recommended with Vue, TypeScript, and ESLint extensions
- Two terminal windows required (one for client, one for server)

### Port Configuration
- **Client**: Port 3000 (Vite dev server)
- **Server**: Port 3001 (Express API)
- Ensure both ports are available before starting