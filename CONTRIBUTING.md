# Contributing to WebOS

Welcome to WebOS! We're excited that you want to contribute to this retro computing revival project. Whether you're fixing bugs, adding features to the Amiga Workbench theme, or creating an entirely new retro OS interface (Windows 3.1, Mac OS System 7, BeOS, etc.), we'd love your help!

## 🎯 Project Vision

WebOS aims to be a **platform for recreating beloved retro operating systems** in the browser with pixel-perfect authenticity. Each OS implementation should capture the look, feel, and soul of its inspiration while being fully functional as a web application.

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Git
- A love for retro computing aesthetics

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/webos.git
   cd webos
   ```

2. **Install dependencies for BOTH client and server**
   ```bash
   # Install server dependencies
   cd src/server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   cd ../..
   ```

3. **Start the development servers** (requires two terminals)

   Terminal 1 - Server:
   ```bash
   cd src/server
   npm run dev
   ```

   Terminal 2 - Client:
   ```bash
   cd src/client
   npm run dev
   ```

4. **Open your browser** to `http://localhost:3000`

### Project Structure

```
webos/
├── src/
│   ├── client/          # Vue 3 + TypeScript + Vite frontend
│   │   ├── components/  # Vue components (Amiga* for Workbench theme)
│   │   ├── assets/      # Images, icons, fonts
│   │   └── package.json # Client dependencies
│   └── server/          # Express.js backend
│       ├── routes/      # API endpoints
│       └── package.json # Server dependencies
├── CLAUDE.md            # Detailed technical documentation
└── README.md            # Project overview
```

## 🎨 Contributing a New Retro OS Theme

We welcome implementations of classic operating systems! See `RETRO_OS_GUIDE.md` for a comprehensive guide. Popular targets include:

- **Windows 3.1 / 95 / 98** - The iconic gray interface
- **Mac OS System 7 / 8 / 9** - Platinum appearance
- **BeOS** - The yellow tabs and futuristic design
- **NeXTSTEP** - Dark dock and NeXT cube aesthetic
- **OS/2 Warp** - IBM's alternative to Windows
- **Classic Linux DEs** - FVWM, Window Maker, Enlightenment

Each theme should:
1. Use its own component namespace (e.g., `Windows95Desktop.vue`, `MacOS9Window.vue`)
2. Maintain authentic colors, fonts, and UI patterns
3. Include proper documentation of design choices
4. Work alongside existing themes

## 💻 Coding Standards

### Client (Vue/TypeScript)

- Use TypeScript for all new `.vue` components
- Follow Vue 3 Composition API patterns (`<script setup>`, `ref()`, `computed()`)
- Use scoped styles: `<style scoped>`
- **Authentic styling**: Match original OS designs precisely
  - Research original color palettes, fonts, and UI elements
  - Use beveled borders, authentic button styles, proper window chrome
  - No modern CSS frameworks - write custom CSS for authenticity
- Component names: Use PascalCase with OS prefix (e.g., `AmigaWindow`, `Windows95Button`)

### Server (Express/JavaScript)

- Use CommonJS modules (`require()`, `module.exports`)
- Place routes in `src/server/routes/*.route.js`
- Return appropriate HTTP status codes
- Add JSDoc comments for complex functions

### General Guidelines

- **Keep it snappy**: Retro OSes were fast. Minimize animations (≤0.1s transitions)
- **Pixel-perfect**: Compare your work to screenshots of the original OS
- **Accessibility**: While maintaining retro aesthetics, ensure keyboard navigation works
- **Comments**: Explain "why" not "what" - especially for authentic design choices
- **No external UI frameworks**: We manually craft retro UIs for authenticity

## 🔀 Pull Request Process

1. **Create a feature branch** from `main`
   ```bash
   git checkout -b feature/windows95-theme
   # or
   git checkout -b fix/amiga-window-dragging
   ```

2. **Make your changes** following our coding standards

3. **Test thoroughly**
   - Start both client and server
   - Test on different screen sizes
   - Verify no console errors
   - Test interactions (drag, resize, click)

4. **Commit with clear messages**
   ```bash
   git commit -m "Add Windows 95 desktop component with authentic styling"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/windows95-theme
   ```

6. **Open a Pull Request** with:
   - Clear description of changes
   - Screenshots/GIFs of visual changes
   - Reference to any related issues
   - Notes on testing performed

### PR Review Criteria

- Code follows project patterns and standards
- Visual changes match original OS authenticity
- No breaking changes to existing themes
- Server changes don't break existing API contracts
- Commit messages are clear and descriptive

## 🐛 Reporting Bugs

Open an issue with:
- **Description**: What happened vs. what should happen
- **Steps to reproduce**: Numbered list
- **Environment**: Browser, OS, Node version
- **Screenshots**: If visual bug
- **Console errors**: If applicable

## 💡 Suggesting Features

We love new ideas! Open an issue with:
- **Use case**: Why is this feature valuable?
- **Proposed solution**: How might it work?
- **Alternatives considered**: Other approaches?
- **OS authenticity**: Does it match retro OS behavior?

For new OS themes, describe:
- Which OS and version
- Why it's iconic/beloved
- Key visual elements that define it
- Your plan for implementation

## 📚 Resources for Retro OS Research

- **GUI Gallery**: https://guidebookgallery.org/
- **Toasty Tech GUI Gallery**: http://toastytech.com/guis/
- **Archive.org Software Library**: Old OS videos and screenshots
- **WinWorld**: https://winworldpc.com/ - OS downloads and documentation
- **Macintosh Garden**: Classic Mac software archive
- **r/retrobattlestations**: Reddit community with authentic setups

## 🤝 Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code. Please report unacceptable behavior to the project maintainers.

## ❓ Questions?

- Check `CLAUDE.md` for detailed technical documentation
- Check `RETRO_OS_GUIDE.md` for OS theme implementation guide
- Open a GitHub Discussion for questions
- Join our community chat (if available)

## 🙏 Thank You!

Every contribution, from fixing typos to implementing entire OS themes, helps keep retro computing alive. Your work lets others experience the joy of these classic interfaces. Thank you for being part of this project!

---

**Happy retro computing!** 🎮💾🖥️
