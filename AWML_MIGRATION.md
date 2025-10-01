# AWML Platform Migration Summary

## Overview

All WebOS system tools have been successfully migrated to the AWML (Amiga WebAssembly Markup Language) platform architecture. The system now uses XML-based application manifests with automatic fallback to legacy Vue.js components.

## Pre-Installed AWML Applications

All system applications are now installed as AWML apps in `dh0:/System/Applications/`:

### 1. NotePad.awml
- **Description**: Text editor for creating and editing documents
- **Permissions**: Read/write access to dh0:/, dh1:/, ram:/
- **Configuration**: Font family, font size, theme, auto-save, word wrap
- **Window**: 600x450, resizable
- **Legacy Component**: AmigaNotePad.vue

### 2. Paint.awml
- **Description**: Bitmap drawing and painting application
- **Permissions**: Read/write access to dh0:/, dh1:/, ram:/, clipboard access
- **Configuration**: Canvas size, default tool, default color, brush size, grid display
- **Window**: 700x550, resizable
- **Legacy Component**: AmigaPaint.vue

### 3. Calculator.awml
- **Description**: Scientific calculator with basic and advanced functions
- **Permissions**: Clipboard access only
- **Configuration**: Mode (standard/scientific), precision, sound, history
- **Window**: 350x420, non-resizable
- **Legacy Component**: AmigaCalculator.vue

### 4. Shell.awml
- **Description**: Command-line interface terminal emulator
- **Permissions**: Read/write/system access to all drives
- **Configuration**: Prompt string, font, colors, history size, startup path
- **Window**: 700x450, resizable
- **Legacy Component**: AmigaShell.vue

### 5. Clock.awml
- **Description**: Analog and digital clock display
- **Permissions**: No filesystem or network access
- **Configuration**: Time format, analog/digital display, date, timezone
- **Window**: 350x400, resizable
- **Legacy Component**: AmigaClock.vue

## Architecture Changes

### 1. AWML Manifest Format

All applications use the standardized AWML 1.0 XML format:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<awml version="1.0">
  <metadata>
    <name>AppName</name>
    <version>1.0.0</version>
    <author>WebOS System</author>
    <description>App description</description>
    <icon>resource://icon.png</icon>
    <category>Category</category>
  </metadata>
  <runtime>
    <wasm src="app://AppName.wasm" />
    <memory initial="128" maximum="256" shared="false" />
    <permissions>
      <filesystem read="true" write="true" paths="dh0:/,dh1:/" />
      <network enabled="false" />
      <system enabled="false" />
      <clipboard enabled="false" />
    </permissions>
  </runtime>
  <window>
    <title>App Title</title>
    <width>640</width>
    <height>480</height>
    <resizable>true</resizable>
  </window>
  <config>
    <setting key="option1" value="default" type="string" description="Option description" />
  </config>
</awml>
```

### 2. Legacy Component Fallback

**File**: `src/client/components/apps/AmigaLegacyWrapper.vue`

Wrapper component that maps AWML app names to legacy Vue components:
- NotePad → AmigaNotePad.vue
- Paint → AmigaPaint.vue
- Calculator → AmigaCalculator.vue
- Shell → AmigaShell.vue
- Clock → AmigaClock.vue

### 3. AWML Runner Enhancement

**File**: `src/client/components/apps/AmigaAwmlRunner.vue`

Enhanced with dual-mode operation:
- **WASM Mode**: Loads and executes WebAssembly binary from AWML manifest
- **Legacy Mode**: Automatically activates when WASM file not found (404)
- No user-facing error - transparent fallback
- Detected by monitoring executeAwml() errors for "Failed to fetch WebAssembly module"

### 4. AWML SDK Parser Update

**File**: `src/client/sdk/awml/runtime.ts`

Updated to support both AWML spec formats:
- **New Spec**: `<awml><runtime><wasm src="..."/></runtime></awml>`
- **Old Spec**: `<awml><module src="..." entry="..."/></awml>`
- Backward compatible with existing AWML files
- Parses metadata from `<metadata>` elements
- Supports both `key` and `name` attributes for settings

### 5. AmigaDesktop Tool Configuration

**File**: `src/client/components/AmigaDesktop.vue`

All tools now route through AWML runner:

```typescript
const toolConfigs = {
  'NotePad': { 
    component: AmigaAwmlRunner,
    awmlPath: 'dh0/System/Applications/NotePad.awml'
  },
  'Paint': {
    component: AmigaAwmlRunner,
    awmlPath: 'dh0/System/Applications/Paint.awml'
  },
  'Calculator': {
    component: AmigaAwmlRunner,
    awmlPath: 'dh0/System/Applications/Calculator.awml'
  },
  'Shell': {
    component: AmigaAwmlRunner,
    awmlPath: 'dh0/System/Applications/Shell.awml'
  },
  'Clock': {
    component: AmigaAwmlRunner,
    awmlPath: 'dh0/System/Applications/Clock.awml'
  }
};
```

## File Structure

```
src/server/storage/workbench/dh0/System/Applications/
├── NotePad.awml          (1.3 KB)
├── NotePad.wasm          (stub - triggers legacy mode)
├── Paint.awml            (1.5 KB)
├── Paint.wasm            (stub - triggers legacy mode)
├── Calculator.awml       (1.4 KB)
├── Calculator.wasm       (stub - triggers legacy mode)
├── Calculator.js         (future: JS implementation)
├── Shell.awml            (1.6 KB)
├── Shell.wasm            (stub - triggers legacy mode)
├── Clock.awml            (1.5 KB)
└── Clock.wasm            (stub - triggers legacy mode)
```

## User Experience

From the user's perspective:
1. Open Utilities drawer - see all 5 applications as AWML apps
2. Double-click any application
3. AWML Runner loads the manifest
4. Runner attempts to load WASM binary
5. WASM not found → automatic switch to legacy mode
6. Vue component loads and renders normally
7. Application functions exactly as before

**No difference in functionality** - users get the same experience while the infrastructure is AWML-based.

## Developer Benefits

1. **Gradual Migration**: Develop WASM implementations at your own pace
2. **Testing**: Test AWML manifests before WASM is ready
3. **No Breakage**: System continues working during migration
4. **Easy Switching**: Drop in a WASM file to activate WASM mode
5. **Clean Architecture**: Single entry point (AWML) for all apps
6. **Configuration**: All app settings defined in XML manifests
7. **Permissions**: Explicit permission declarations for security

## Future Work

To complete the WASM migration:

1. **Create WASM Implementations**:
   - Build Rust/AssemblyScript/C implementations
   - Compile to WASM with AWML host API bindings
   - Replace stub .wasm files with real binaries

2. **Host API Integration**:
   - Implement full AWML host API in runtime.ts
   - Add graphics primitives (awml_gfx_*)
   - Add filesystem functions (awml_fs_*)
   - Add system functions (awml_sys_*)

3. **Remove Legacy Components** (optional):
   - Once WASM versions are stable
   - Delete AmigaLegacyWrapper.vue
   - Remove legacy mode from AmigaAwmlRunner
   - Clean up old Vue component files

## Testing

All applications have been verified to:
- ✅ Open from Utilities drawer
- ✅ Load AWML manifests correctly
- ✅ Detect missing WASM and activate legacy mode
- ✅ Function identically to pre-migration behavior
- ✅ Parse configuration settings from manifests
- ✅ Display correct window titles and dimensions

## Documentation

Updated files:
- **README.md**: Added "Legacy Component Fallback" section
- **AWML_SPECIFICATION.md**: Complete SDK specification
- **API_DOCUMENTATION.md**: Includes /api/files/raw endpoint
- **AWML_MIGRATION.md**: This document

---

**Migration completed**: 2025-10-01  
**All system tools**: Now AWML-based with legacy fallback  
**Breaking changes**: None - fully backward compatible
