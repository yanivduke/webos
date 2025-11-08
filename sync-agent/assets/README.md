# Icons Placeholder

This directory should contain the application icons:

- `icon.png` - Linux icon (512x512)
- `icon.ico` - Windows icon
- `icon.icns` - macOS icon
- `tray-icon.png` - System tray icon (22x22 or 32x32)

You can generate these from a source PNG using tools like:
- electron-icon-builder
- png2icons
- imagemagick

Example command to create all icons:
```bash
npm install -g electron-icon-builder
electron-icon-builder --input=./source-icon.png --output=./assets
```
