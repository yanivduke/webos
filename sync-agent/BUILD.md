# Building WebOS Sync Agent

This guide explains how to build the WebOS Sync Agent for Windows, macOS, and Linux.

## Prerequisites

- Node.js 18+ and npm
- For Windows builds: Windows 10/11 or Wine on Linux/macOS
- For macOS builds: macOS 10.14+ with Xcode Command Line Tools
- For Linux builds: Any Linux distribution

## Install Dependencies

```bash
cd sync-agent
npm install
```

## Building for Development

Run the app in development mode:

```bash
npm run dev
```

## Building for Production

### Build All Platforms (Recommended)

```bash
npm run build:all
```

This will create installers for Windows, macOS, and Linux in the `dist/` directory.

**Note:** Building for macOS on non-macOS systems requires additional setup.

### Build for Specific Platforms

**Windows:**
```bash
npm run build:win
```

Output:
- `dist/WebOS-Sync-Agent-Setup.exe` - NSIS installer
- `dist/WebOS-Sync-Agent.exe` - Portable executable

**macOS:**
```bash
npm run build:mac
```

Output:
- `dist/WebOS-Sync-Agent.dmg` - DMG installer
- `dist/WebOS-Sync-Agent-mac.zip` - Zipped app

**Linux:**
```bash
npm run build:linux
```

Output:
- `dist/WebOS-Sync-Agent.AppImage` - Universal AppImage
- `dist/webos-sync-agent_1.0.0_amd64.deb` - Debian/Ubuntu package
- `dist/webos-sync-agent-1.0.0.x86_64.rpm` - Fedora/RHEL package

## Cross-Platform Building

### Building Windows on Linux/macOS

Install Wine:

**Ubuntu/Debian:**
```bash
sudo dpkg --add-architecture i386
sudo apt update
sudo apt install wine64 wine32
```

**macOS:**
```bash
brew install --cask wine-stable
```

### Building macOS on Linux (Limited Support)

macOS builds on non-macOS systems have limited support. You'll need:

```bash
# Install dependencies
sudo apt install icnsutils graphicsmagick
```

**Note:** Code signing and notarization only work on macOS.

## Icon Generation

Icons should be placed in `assets/`:
- `icon.png` - 512x512 PNG (source icon)
- `icon.ico` - Windows icon (auto-generated)
- `icon.icns` - macOS icon (auto-generated)
- `tray-icon.png` - 22x22 or 32x32 PNG for system tray

To generate icons from a source PNG:

```bash
npm install -g electron-icon-builder
electron-icon-builder --input=./assets/source-icon.png --output=./assets
```

## Code Signing

### Windows

Set environment variables:

```bash
export CSC_LINK=/path/to/certificate.pfx
export CSC_KEY_PASSWORD=your_password
```

### macOS

```bash
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=your_password
export APPLE_ID=your@apple.id
export APPLE_ID_PASSWORD=app_specific_password
```

Then build:

```bash
npm run build:mac
```

## Build Configuration

Edit `package.json` under the `build` section to customize:

- App ID
- Product name
- Icon paths
- Target formats
- Installer options

## Troubleshooting

### "Cannot find module"

```bash
rm -rf node_modules package-lock.json
npm install
```

### "ENOSPC: System limit for number of file watchers reached"

```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### macOS build fails on Linux

This is expected. macOS builds require a Mac. Use GitHub Actions or a Mac VM.

### Windows build fails

Ensure Wine is installed and properly configured.

## Continuous Integration

### GitHub Actions Example

Create `.github/workflows/build.yml`:

```yaml
name: Build Sync Agent

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd sync-agent
          npm install

      - name: Build
        run: |
          cd sync-agent
          npm run build

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: sync-agent-${{ matrix.os }}
          path: sync-agent/dist/*
```

## Testing Builds

After building, test the installers:

**Windows:**
- Run the installer
- Check Start Menu shortcuts
- Verify auto-start option works

**macOS:**
- Mount the DMG
- Drag to Applications
- Verify it opens without security warnings

**Linux:**
- Make AppImage executable: `chmod +x WebOS-Sync-Agent.AppImage`
- Run it: `./WebOS-Sync-Agent.AppImage`
- Test .deb: `sudo dpkg -i webos-sync-agent_1.0.0_amd64.deb`

## Distribution

### Uploading to WebOS Server

After building, copy the installers to the server's download directory:

```bash
cp dist/*.{exe,dmg,AppImage,deb,rpm} ../src/server/downloads/
```

### Creating a Release

1. Tag the version:
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

2. Create GitHub Release with built artifacts

3. Update download links in WebOS interface

## Build Artifacts Size

Approximate sizes:
- Windows (.exe): ~85 MB
- macOS (.dmg): ~90 MB
- Linux (.AppImage): ~88 MB
- Linux (.deb): ~82 MB
- Linux (.rpm): ~82 MB

## Version Management

Update version in `package.json`:

```json
{
  "version": "1.0.0"
}
```

The version will be automatically included in:
- Installer filenames
- Application title
- About dialog

## Next Steps

After building:
1. Test on target platforms
2. Upload to WebOS server download directory
3. Update documentation
4. Create release notes
5. Announce to users
