# 🚀 Quick Start Guide - WebOS Amiga Workbench

## Getting Started in 3 Easy Steps

### Step 1: Install Dependencies

#### Client (Frontend)
```bash
cd src/client
npm install
```

#### Server (Backend)
```bash
cd src/server
npm install
```

### Step 2: Start the Server

From the **root directory** of the project:

```bash
node src/server/index.js
```

Or use nodemon for auto-restart during development:

```bash
cd src/server
npm run dev
```

You should see:
```
═══════════════════════════════════════════════════════
  🖥️  WebOS Server - Amiga Workbench Style
═══════════════════════════════════════════════════════
  Server running on: http://localhost:3001
  Health check: http://localhost:3001/api/health
  Environment: development
═══════════════════════════════════════════════════════
```

### Step 3: Start the Client

In a **new terminal**, from the project root:

```bash
cd src/client
npm run dev
```

The Vite dev server will start and automatically open your browser to:
```
http://localhost:3000
```

## 🎉 You're Done!

You should now see the Amiga Workbench desktop with:
- Classic gray background
- Menu bar at the top (Workbench, Window, Icons, Tools)
- Disk icons on the left (DF0:, DH0:, DH1:, RAM:)
- Utilities drawer and Trash can
- Real-time clock and memory indicators

## 🎮 Try It Out

1. **Double-click** any disk icon to open a window
2. **Drag windows** around by their title bars
3. **Resize windows** using the bottom-right corner
4. **Click menu items** in the top menu bar
5. **Select files** with single-click or Ctrl/Cmd-click for multi-select

## 📡 API Endpoints

The server provides these endpoints:

- **Health Check**: `http://localhost:3001/api/health`
- **System Status**: `http://localhost:3001/api/system/status`
- **File Operations**: `http://localhost:3001/api/files`
- **Settings**: `http://localhost:3001/api/settings`

Test them with curl:
```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/system/status
curl http://localhost:3001/api/files?path=df0
```

## 🔧 Development Scripts

### Client
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript type checking

### Server
- `npm start` - Start server
- `npm run dev` - Start with nodemon (auto-restart)

## 🛠️ Troubleshooting

### Server won't start
- Make sure port 3001 is not in use
- Check that all dependencies are installed: `npm install`

### Client won't start
- Make sure port 3000 is not in use
- Delete `node_modules` and run `npm install` again
- Clear Vite cache: `rm -rf src/client/node_modules/.vite`

### Windows not showing
- Check browser console for errors
- Make sure server is running on port 3001
- Try refreshing the page

## 📚 Project Structure

```
webos/
├── src/
│   ├── client/              # Vue 3 Frontend
│   │   ├── components/      # Vue components
│   │   ├── index.html       # HTML entry point
│   │   ├── main.ts          # App entry point
│   │   └── package.json     # Client dependencies
│   │
│   └── server/              # Express Backend
│       ├── routes/          # API routes
│       ├── index.js         # Server entry point
│       └── package.json     # Server dependencies
│
├── AMIGA_README.md          # Full documentation
├── QUICKSTART.md            # This file
└── README.md                # Original README
```

## 🎨 Customize

### Change Colors
Edit the CSS variables in [src/client/components/AmigaDesktop.vue](src/client/components/AmigaDesktop.vue)

### Add New Disk Icons
Edit the `disks` array in [src/client/components/AmigaDesktop.vue](src/client/components/AmigaDesktop.vue)

### Modify File System
Edit the `fileSystem` object in [src/server/routes/file-operations.route.js](src/server/routes/file-operations.route.js)

## 📖 More Information

For detailed documentation, see [AMIGA_README.md](AMIGA_README.md)

---

**Made with 🧡 for Amiga enthusiasts**

*"Only Amiga makes it possible!"*
