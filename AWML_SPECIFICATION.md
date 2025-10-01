# 🚀 AWML Specification v1.0

**Amiga WebAssembly Markup Language**

AWML is an XML-based file format for creating executable applications on WebOS using WebAssembly.

---

## Table of Contents

1. [Overview](#overview)
2. [File Format](#file-format)
3. [AWML Structure](#awml-structure)
4. [Configuration Options](#configuration-options)
5. [WebAssembly Integration](#webassembly-integration)
6. [API Access](#api-access)
7. [Examples](#examples)

---

## Overview

AWML files (.awml) are executable application packages that combine:
- WebAssembly binary code (.wasm)
- Application configuration (XML)
- User preferences
- Resource manifests

The WebOS runtime loads and executes AWML files in a sandboxed environment with controlled API access.

---

## File Format

### Basic Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<awml version="1.0">
  <metadata>
    <name>My Application</name>
    <version>1.0.0</version>
    <author>Developer Name</author>
    <description>Application description</description>
    <icon>app://icon.svg</icon>
  </metadata>

  <runtime>
    <wasm src="app://main.wasm" />
    <memory initial="256" maximum="1024" />
    <permissions>
      <filesystem read="true" write="true" />
      <network enabled="false" />
    </permissions>
  </runtime>

  <window>
    <title>My Application</title>
    <width>640</width>
    <height>480</height>
    <resizable>true</resizable>
    <icon>app://window-icon.svg</icon>
  </window>

  <resources>
    <resource id="icon" type="image/svg+xml" src="data:image/svg+xml;base64,..." />
    <resource id="style" type="text/css" src="app://styles.css" />
  </resources>

  <config>
    <setting key="theme" value="dark" type="string" />
    <setting key="fontSize" value="12" type="number" />
    <setting key="autoSave" value="true" type="boolean" />
  </config>
</awml>
```

---

## AWML Structure

### 1. Metadata Section

Defines application information displayed in WebOS.

```xml
<metadata>
  <name>Application Name</name>          <!-- Required -->
  <version>1.0.0</version>               <!-- Required: Semantic versioning -->
  <author>Developer Name</author>        <!-- Optional -->
  <description>Short description</description> <!-- Optional -->
  <icon>resource:icon</icon>             <!-- Optional: Icon URI -->
  <category>Utility</category>           <!-- Optional: App category -->
  <license>MIT</license>                 <!-- Optional -->
  <homepage>https://example.com</homepage> <!-- Optional -->
</metadata>
```

### 2. Runtime Section

Configures WebAssembly execution environment.

```xml
<runtime>
  <!-- WebAssembly binary -->
  <wasm src="app://main.wasm" />

  <!-- Memory configuration (pages, 64KB each) -->
  <memory initial="256" maximum="1024" />

  <!-- Stack size -->
  <stack size="65536" />

  <!-- Permissions -->
  <permissions>
    <filesystem read="true" write="true" path="dh0:/MyApp" />
    <network enabled="false" />
    <system exec="false" />
  </permissions>

  <!-- Environment variables -->
  <env key="APP_MODE" value="production" />
  <env key="DATA_PATH" value="dh0:/MyApp/data" />
</runtime>
```

### 3. Window Section

Defines application window properties.

```xml
<window>
  <title>Window Title</title>
  <width>640</width>
  <height>480</height>
  <minWidth>320</minWidth>
  <minHeight>240</minHeight>
  <maxWidth>1280</maxWidth>
  <maxHeight>960</maxHeight>
  <resizable>true</resizable>
  <draggable>true</draggable>
  <closable>true</closable>
  <icon>resource:window-icon</icon>
  <position x="100" y="100" />
</window>
```

### 4. Resources Section

Embeds or references external resources.

```xml
<resources>
  <!-- Embedded data URI -->
  <resource
    id="icon"
    type="image/svg+xml"
    src="data:image/svg+xml;base64,PHN2Zy4uLjwvc3ZnPg=="
  />

  <!-- External file -->
  <resource
    id="style"
    type="text/css"
    src="app://styles.css"
  />

  <!-- Binary data -->
  <resource
    id="data"
    type="application/octet-stream"
    src="app://data.bin"
    encoding="base64"
  />
</resources>
```

### 5. Config Section

User-configurable settings.

```xml
<config>
  <!-- String setting -->
  <setting key="theme" value="dark" type="string">
    <label>Color Theme</label>
    <options>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="amiga">Amiga Classic</option>
    </options>
  </setting>

  <!-- Number setting -->
  <setting key="fontSize" value="12" type="number" min="8" max="24">
    <label>Font Size</label>
  </setting>

  <!-- Boolean setting -->
  <setting key="autoSave" value="true" type="boolean">
    <label>Enable Auto-Save</label>
  </setting>

  <!-- Color setting -->
  <setting key="accentColor" value="#0055aa" type="color">
    <label>Accent Color</label>
  </setting>
</config>
```

---

## Configuration Options

### Memory Management

```xml
<memory
  initial="256"    <!-- Initial pages (256 * 64KB = 16MB) -->
  maximum="1024"   <!-- Max pages (1024 * 64KB = 64MB) -->
  shared="false"   <!-- Shared memory between threads -->
/>
```

### Permissions

```xml
<permissions>
  <!-- File system access -->
  <filesystem
    read="true"
    write="true"
    path="dh0:/MyApp"  <!-- Restricted to this path -->
  />

  <!-- Network access -->
  <network
    enabled="false"
    domains="api.example.com"  <!-- Whitelist domains -->
  />

  <!-- System commands -->
  <system exec="false" />

  <!-- Clipboard access -->
  <clipboard read="true" write="true" />

  <!-- Audio/Video -->
  <media audio="true" video="false" />
</permissions>
```

### Categories

Standard application categories:
- `Utility` - System utilities
- `Graphics` - Drawing, imaging
- `Productivity` - Office, text editing
- `Development` - Dev tools, IDEs
- `Games` - Entertainment
- `Education` - Educational software
- `System` - System tools
- `Network` - Network applications

---

## WebAssembly Integration

### WASM Module Requirements

The WebAssembly module must export specific functions:

```wat
(module
  ;; Initialize application
  (func $init (export "init") (result i32)
    ;; Return 0 on success, non-zero on error
  )

  ;; Main update loop (called every frame)
  (func $update (export "update") (param $deltaTime f64)
    ;; Update application state
  )

  ;; Render to canvas
  (func $render (export "render") (param $canvasPtr i32)
    ;; Render application
  )

  ;; Handle events
  (func $onEvent (export "onEvent")
    (param $eventType i32)
    (param $eventData i32)
    ;; Handle user events
  )

  ;; Cleanup on exit
  (func $cleanup (export "cleanup")
    ;; Free resources
  )

  ;; Memory
  (memory (export "memory") 256 1024)
)
```

### Event Types

```
0x01 = MOUSE_MOVE
0x02 = MOUSE_DOWN
0x03 = MOUSE_UP
0x04 = KEY_DOWN
0x05 = KEY_UP
0x06 = WINDOW_RESIZE
0x07 = WINDOW_FOCUS
0x08 = WINDOW_BLUR
```

---

## API Access

AWML applications can access WebOS APIs through imported functions:

### File System API

```wat
(import "webos" "fs_read"
  (func $fs_read (param $pathPtr i32) (param $pathLen i32) (result i32)))

(import "webos" "fs_write"
  (func $fs_write (param $pathPtr i32) (param $dataPtr i32) (param $dataLen i32) (result i32)))

(import "webos" "fs_list"
  (func $fs_list (param $pathPtr i32) (result i32)))
```

### Graphics API

```wat
(import "webos" "gfx_pixel"
  (func $gfx_pixel (param $x i32) (param $y i32) (param $color i32)))

(import "webos" "gfx_line"
  (func $gfx_line (param $x1 i32) (param $y1 i32) (param $x2 i32) (param $y2 i32) (param $color i32)))

(import "webos" "gfx_rect"
  (func $gfx_rect (param $x i32) (param $y i32) (param $w i32) (param $h i32) (param $color i32)))
```

### System API

```wat
(import "webos" "sys_log"
  (func $sys_log (param $msgPtr i32) (param $msgLen i32)))

(import "webos" "sys_time"
  (func $sys_time (result f64)))

(import "webos" "sys_config_get"
  (func $sys_config_get (param $keyPtr i32) (result i32)))
```

---

## Examples

### Example 1: Hello World

```xml
<?xml version="1.0" encoding="UTF-8"?>
<awml version="1.0">
  <metadata>
    <name>Hello World</name>
    <version>1.0.0</version>
    <author>WebOS Team</author>
    <description>Simple Hello World application</description>
    <category>Utility</category>
  </metadata>

  <runtime>
    <wasm src="data:application/wasm;base64,AGFzbQEAAAA..." />
    <memory initial="1" maximum="16" />
    <permissions>
      <filesystem read="false" write="false" />
      <network enabled="false" />
    </permissions>
  </runtime>

  <window>
    <title>Hello World</title>
    <width>320</width>
    <height>240</height>
    <resizable>false</resizable>
  </window>

  <config>
    <setting key="message" value="Hello, World!" type="string">
      <label>Message Text</label>
    </setting>
  </config>
</awml>
```

### Example 2: Text Editor

```xml
<?xml version="1.0" encoding="UTF-8"?>
<awml version="1.0">
  <metadata>
    <name>TextEdit Pro</name>
    <version>2.1.0</version>
    <author>Developer Inc.</author>
    <description>Advanced text editor with syntax highlighting</description>
    <category>Productivity</category>
    <license>GPL-3.0</license>
  </metadata>

  <runtime>
    <wasm src="app://textedit.wasm" />
    <memory initial="512" maximum="2048" />
    <permissions>
      <filesystem read="true" write="true" path="dh0:/Documents" />
      <clipboard read="true" write="true" />
    </permissions>
    <env key="MAX_FILE_SIZE" value="10485760" />
  </runtime>

  <window>
    <title>TextEdit Pro</title>
    <width>800</width>
    <height>600</height>
    <minWidth>400</minWidth>
    <minHeight>300</minHeight>
    <resizable>true</resizable>
  </window>

  <resources>
    <resource id="icon" type="image/svg+xml" src="app://icon.svg" />
    <resource id="syntax" type="application/json" src="app://syntax.json" />
  </resources>

  <config>
    <setting key="theme" value="amiga" type="string">
      <label>Editor Theme</label>
      <options>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="amiga">Amiga Classic</option>
      </options>
    </setting>

    <setting key="fontSize" value="12" type="number" min="8" max="24">
      <label>Font Size</label>
    </setting>

    <setting key="tabSize" value="4" type="number" min="2" max="8">
      <label>Tab Size</label>
    </setting>

    <setting key="lineNumbers" value="true" type="boolean">
      <label>Show Line Numbers</label>
    </setting>

    <setting key="autoSave" value="true" type="boolean">
      <label>Auto-Save</label>
    </setting>
  </config>
</awml>
```

### Example 3: Drawing Application

```xml
<?xml version="1.0" encoding="UTF-8"?>
<awml version="1.0">
  <metadata>
    <name>PixelPaint</name>
    <version>1.5.0</version>
    <author>Graphics Software Ltd.</author>
    <description>Pixel-perfect painting application</description>
    <category>Graphics</category>
  </metadata>

  <runtime>
    <wasm src="app://pixelpaint.wasm" />
    <memory initial="1024" maximum="4096" />
    <permissions>
      <filesystem read="true" write="true" path="dh0:/Pictures" />
      <clipboard read="true" write="true" />
    </permissions>
  </runtime>

  <window>
    <title>PixelPaint</title>
    <width>1024</width>
    <height>768</height>
    <resizable>true</resizable>
  </window>

  <resources>
    <resource id="palette" type="application/json">
      {
        "colors": [
          "#000000", "#ffffff", "#ff0000", "#00ff00",
          "#0000ff", "#ffff00", "#00ffff", "#ff00ff",
          "#c0c0c0", "#808080", "#800000", "#008000",
          "#000080", "#808000", "#008080", "#800080"
        ]
      }
    </resource>
  </resources>

  <config>
    <setting key="brushSize" value="1" type="number" min="1" max="50">
      <label>Brush Size</label>
    </setting>

    <setting key="canvasWidth" value="640" type="number">
      <label>Canvas Width</label>
    </setting>

    <setting key="canvasHeight" value="480" type="number">
      <label>Canvas Height</label>
    </setting>

    <setting key="gridEnabled" value="false" type="boolean">
      <label>Show Grid</label>
    </setting>
  </config>
</awml>
```

---

## URI Schemes

AWML supports multiple URI schemes for resources:

### app://
References files within the AWML package.
```xml
<wasm src="app://main.wasm" />
```

### data:
Embeds inline data using data URIs.
```xml
<resource src="data:image/svg+xml;base64,PHN2Zy4uLjwvc3ZnPg==" />
```

### dh0:/
References files on the WebOS file system.
```xml
<resource src="dh0:/MyApp/config.json" />
```

### resource:
References resources defined in the `<resources>` section.
```xml
<icon>resource:app-icon</icon>
```

---

## Security Model

AWML applications run in a sandboxed environment with:

1. **Memory Isolation** - Each app has its own WebAssembly memory
2. **File System Restrictions** - Can only access permitted paths
3. **No Direct System Access** - All system calls go through WebOS API
4. **Permission Model** - Explicit permissions required for sensitive operations
5. **Resource Limits** - Memory and CPU usage limits enforced

---

## Development Tools

### AWML Validator
Validates AWML file structure and permissions.

### AWML Packager
Bundles WASM, resources, and config into a single .awml file.

### AWML Runtime Debugger
Debug AWML applications with breakpoints and memory inspection.

---

## Best Practices

1. **Keep Memory Limits Reasonable** - Start with 256 pages (16MB)
2. **Request Minimal Permissions** - Only request what you need
3. **Embed Small Resources** - Use data URIs for icons and small files
4. **Version Your Apps** - Use semantic versioning
5. **Provide Descriptions** - Help users understand your app
6. **Test on Target** - Always test on WebOS runtime
7. **Handle Errors Gracefully** - Check return values from API calls
8. **Clean Up Resources** - Implement the cleanup function

---

## Version History

### v1.0.0 (2025-10-01)
- Initial AWML specification
- WebAssembly runtime integration
- Permission model
- Configuration system
- Resource management

---

**Specification Version:** 1.0.0
**Status:** ✅ Stable
**Last Updated:** October 1, 2025
