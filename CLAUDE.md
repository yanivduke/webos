# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WebOS is an Amiga Workbench-style operating system interface for the web. It recreates the classic 1980s-90s Amiga Commodore Workbench aesthetic with pixel-perfect attention to detail, including authentic colors (#a0a0a0 gray background), beveled windows, retro typography (Press Start 2P font), and traditional desktop paradigms.

## Architecture

### Client-Server Split

The project uses a **monorepo structure with separated client and server**:

- **Client** (`src/client/`): Vue 3 + TypeScript + Vite frontend
- **Server** (`src/server/`): Express.js backend with CommonJS modules

**Critical**: Each has its own `node_modules` and `package.json`. Dependencies must be installed separately in each directory.

### Client Architecture (Vue 3)

**Component Hierarchy:**
```
App.vue
└── AmigaDesktop.vue (Main orchestrator)
    ├── Workbench Menu Bar (top)
    ├── Desktop Icons (left sidebar)
    ├── AmigaWindow.vue (multiple instances)
    │   └── AmigaFolder.vue (window content)
    └── System Info Bar (bottom)
```

**Key Design Patterns:**

1. **Window Management**: `AmigaDesktop.vue` maintains an array of open windows. Each `AmigaWindow` is:
   - Absolutely positioned
   - Independently draggable (mousedown/mousemove on title bar)
   - Resizable (bottom-right corner handle)
   - Z-indexed by timestamp for layering

2. **State Management**: No Vuex/Pinia - uses Vue 3 Composition API with `ref()` and `computed()` for reactive state within components.

3. **File System Simulation**: `AmigaFolder.vue` uses a computed property to show different content based on disk ID (df0, dh0, ram, utils, trash). Content is determined by matching the `data.id` prop.

4. **Amiga-Authentic Styling**:
   - All borders use `border-color: #ffffff #000000 #000000 #ffffff` for 3D bevel effect
   - Colors: `#a0a0a0` (background), `#0055aa` (Amiga blue), `#ffaa00` (folders)
   - No CSS frameworks - pure CSS with scoped styles per component

### Server Architecture (Express)

**Module System**: CommonJS (uses `require()` and `module.exports`, not ES6 imports)

**Route Structure:**
- `index.js` - Main server entry point with middleware setup
- `routes/*.route.js` - Express routers for different API domains
- No separate controller layer - route handlers are inline

**Data Model**: In-memory mock data (no database). The file system is a JavaScript object in `file-operations.route.js` with keys like 'df0', 'dh0', 'ram', simulating Amiga disk drives.

**CORS**: Enabled by default to allow client (port 3000) to communicate with server (port 3001).

## Development Commands

### Starting the Application

**Two terminals required:**

Terminal 1 (Server):
```bash
# From project root
node src/server/index.js

# Or with auto-restart:
cd src/server && npm run dev
```

Terminal 2 (Client):
```bash
cd src/client
npm run dev
```

Server runs on `http://localhost:3001`, client on `http://localhost:3000`.

### Client Commands

From `src/client/`:
```bash
npm run dev          # Start Vite dev server (port 3000)
npm run build        # Production build to dist/
npm run preview      # Preview production build
npm run type-check   # TypeScript validation without emitting
```

### Server Commands

From `src/server/`:
```bash
npm start           # Run with node
npm run dev         # Run with nodemon (auto-restart on changes)
```

### Testing API Endpoints

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/system/status
curl http://localhost:3001/api/files?path=df0
curl http://localhost:3001/api/settings
```

## Key Files and Their Roles

### Client Files

- **`AmigaDesktop.vue`**: Desktop orchestrator. Manages open windows array, disk icons, menu bar, and system clock (updates every 1s with `setInterval`).

- **`AmigaWindow.vue`**: Generic draggable/resizable window. Props: `title`, `x`, `y`, `width`, `height`. Emits: `@close`. Uses mouse event handlers for drag/resize with `document.addEventListener` in drag mode.

- **`AmigaFolder.vue`**: File browser displaying icon grid. Content is computed based on `data.id` prop (maps to disk/folder type). Supports multi-select with Ctrl/Cmd key detection.

- **`main.ts`**: App entry point. Imports `style.css` for global styles and mounts Vue app to `#app`.

- **`vite.config.ts`**: Vite configuration with:
  - Vue plugin
  - Path alias: `@` → current directory
  - **Proxy**: `/api` requests forwarded to `http://localhost:3001`
  - Port 3000, auto-open browser

### Server Files

- **`index.js`**: Express server setup with CORS, JSON parsing, route mounting, error handling, and health check endpoint.

- **`routes/system-status.route.js`**: Returns simulated Amiga system info (Motorola 68040 CPU, 512K chip/fast memory, disk drive data).

- **`routes/file-operations.route.js`**: Mock file system CRUD. Contains `fileSystem` object with keys like 'df0', 'dh0', 'ram', 'utils', 'trash'. Each has an `items` array.

- **`routes/settings.route.js`**: Manages display, sound, workbench, and system settings (in-memory only, resets on restart).

## Design Principles

1. **Authentic Amiga Aesthetics**: All UI decisions should match Workbench 3.1 look and feel. Check existing components for color/border patterns before adding new elements.

2. **No External UI Frameworks**: Intentionally avoids Vuetify/Bootstrap/Tailwind to maintain authentic retro styling. Use scoped CSS with manual beveled borders.

3. **Instant Feedback**: Animations should be minimal/instant (transition: 0.1s max). Amiga was snappy, not smooth.

4. **TypeScript in Client, JavaScript in Server**: Client uses `.ts` and `.vue` with TypeScript. Server uses plain `.js` with CommonJS for simplicity.

5. **Component Communication**: Use props down, events up. No global event bus. `AmigaDesktop` owns all window state.

## Adding New Features

### Adding a New Disk/Folder

1. Add to `disks` array in `AmigaDesktop.vue` with unique `id`, `name`, `type`
2. Add corresponding entry in `AmigaFolder.vue` computed `items` switch statement
3. Add to server's `fileSystem` object in `file-operations.route.js`

### Adding a New Window Type

1. Create new component (e.g., `AmigaShell.vue`) in `src/client/components/`
2. Import in `AmigaDesktop.vue`
3. Add to window's `component` field when opening (dynamic component via `<component :is="...">`  )

### Adding New API Endpoint

1. Create or modify route file in `src/server/routes/`
2. Import and mount in `src/server/index.js` with `app.use('/api/path', routerName)`
3. Use CommonJS: `const router = express.Router()` and `module.exports = router`

## Common Patterns

### Amiga Window Title Bar Structure

```vue
<div class="window-titlebar" @mousedown="startDrag">
  <div class="title-bar-left">
    <div class="title-bar-button close-button" @click.stop="close">
      <div class="close-icon"></div>
    </div>
    <div class="title-bar-button depth-button" @click.stop="sendToBack">
      <div class="depth-icon"></div>
    </div>
  </div>
  <div class="window-title">{{ title }}</div>
  <div class="title-bar-right">
    <div class="title-bar-button zoom-button" @click.stop="toggleMaximize">
      <div class="zoom-icon"></div>
    </div>
  </div>
</div>
```

### Amiga Button Styling

```css
.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 12px;
  font-size: 10px;
  font-family: 'Press Start 2P', monospace;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}
```

### Drag Implementation Pattern

```typescript
const isDragging = ref(false);
let dragStartX = 0, dragStartY = 0;

const startDrag = (e: MouseEvent) => {
  isDragging.value = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
  e.preventDefault();
};

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return;
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;
  // Update position
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
};

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
});
```

## Port Configuration

- **Client**: 3000 (Vite dev server)
- **Server**: 3001 (Express API)
- **Proxy**: Client proxies `/api/*` requests to server (configured in vite.config.ts)

When changing ports, update:
1. `src/client/vite.config.ts` - server.port and server.proxy.target
2. `src/server/index.js` - PORT constant

## TypeScript Configuration

The client uses TypeScript with `tsconfig.json` configured for:
- Vue 3 support (`jsx: "preserve"`)
- Modern ES2020 target
- Strict type checking enabled
- Module resolution: "bundler" (Vite-specific)

`env.d.ts` provides Vue SFC type definitions.

Server has no TypeScript - `.ts` route files are legacy and not used (`.js` files are active).

## Known Limitations

1. **No Persistence**: File system and settings are in-memory. Restart loses all data.
2. **No Authentication**: API endpoints are open, no user system.
3. **Mock File System**: Files don't actually exist, just JavaScript objects.
4. **Single User**: No multi-user support or session management.
5. **Static Content**: AmigaFolder items are computed from hardcoded arrays, not dynamic.

## Roadmap Priorities

Phase 2 (In Progress): System Tools
- Shell/CLI terminal window
- Calculator utility
- Clock utility
- NotePad text editor
- Preferences panel

Phase 3: Real file operations (create, rename, delete, copy)
Phase 4: Sound effects, keyboard shortcuts, context menus

## Troubleshooting

**"Cannot find module" errors**: Check you're in the correct directory (`src/client` or `src/server`) and have run `npm install` there.

**Port already in use**: Kill existing process on port 3000/3001 or change port in vite.config.ts / index.js.

**Windows not appearing**: Verify server is running on 3001 and check browser console for proxy errors.

**TypeScript errors in .vue files**: Run `npm run type-check` from `src/client` to see actual errors (dev server may not show all).

**Amiga styling looks wrong**: Check that Google Fonts is loading "Press Start 2P". If offline, the fallback is Courier New which looks less authentic.
