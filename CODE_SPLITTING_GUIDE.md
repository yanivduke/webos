# WebOS Code Splitting Guide

## Overview

This guide explains how to implement code splitting in WebOS to maintain optimal bundle sizes and performance. Code splitting allows us to break our application into smaller chunks that are loaded on-demand, resulting in faster initial page loads and better caching.

**Version:** 2.0.0
**Last Updated:** 2025-11-08

## Table of Contents

1. [Why Code Splitting?](#why-code-splitting)
2. [Current Architecture](#current-architecture)
3. [Adding New Applications](#adding-new-applications)
4. [Manual Chunk Configuration](#manual-chunk-configuration)
5. [Best Practices](#best-practices)
6. [Loading States](#loading-states)
7. [Testing & Verification](#testing--verification)
8. [Troubleshooting](#troubleshooting)

## Why Code Splitting?

### Problems with Single Bundle
- **Large initial download**: Users download code they may never use
- **Slow page load**: Parsing and compiling large bundles takes time
- **Poor caching**: Any change invalidates entire bundle
- **Memory overhead**: All code loaded into memory upfront

### Benefits of Code Splitting
- **Faster initial load**: Only essential code loaded upfront
- **Better caching**: Individual chunks cached separately
- **On-demand loading**: Code loaded when needed
- **Improved performance**: Smaller bundles parse faster
- **Scalability**: Easy to add features without impacting initial load

## Current Architecture

### Bundle Structure

```
webos/
├── dist/
│   ├── index.html                 # Entry point
│   ├── assets/
│   │   ├── index.js              # Main bundle (23 KB gzipped)
│   │   ├── vue-vendor.js         # Vue 3 runtime (31 KB)
│   │   ├── ui-core.js            # Core UI components (29 KB)
│   │   ├── vendor-libs.js        # Third-party libs (85 KB)
│   │   ├── utils.js              # Utilities (8 KB)
│   │   ├── AmigaCodeEditor.js    # Lazy-loaded app
│   │   ├── AmigaTerminal.js      # Lazy-loaded app
│   │   └── ...                   # Other lazy-loaded apps
│   └── stats.html                # Bundle analyzer report
```

### Loading Strategy

**Initial Load (187 KB gzipped):**
- index.js - Application bootstrap
- vue-vendor.js - Vue 3 framework
- ui-core.js - Window, Folder, Menu components
- vendor-libs.js - html2canvas, jszip, prismjs
- utils.js - Keyboard, theme, workspace managers

**On-Demand Load:**
- Individual applications (2-14 KB each)
- Visualization components (shared by monitors)
- Development tools (bundle monitor, etc.)

## Adding New Applications

### Step 1: Create Your Application Component

Create your new Vue component in `src/client/components/apps/`:

```vue
<!-- src/client/components/apps/AmigaMyNewApp.vue -->
<template>
  <div class="amiga-my-new-app">
    <h2>My New Application</h2>
    <!-- Your app content -->
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

// Your app logic
const message = ref('Hello from My New App!');
</script>

<style scoped>
.amiga-my-new-app {
  padding: var(--amiga-spacing-md);
  font-family: var(--amiga-font-family);
}

/* Use Amiga CSS variables where possible */
</style>
```

### Step 2: Add Dynamic Import

In `src/client/components/AmigaDesktop.vue`, add your app to the async imports section:

```typescript
// src/client/components/AmigaDesktop.vue
// In the <script> section, after other async component imports:

const AmigaMyNewApp = defineAsyncComponent(() =>
  import('./apps/AmigaMyNewApp.vue')
);
```

**Important:** Add it to the async section, NOT the core imports!

### Step 3: Add Tool Configuration

Add your app configuration to the `toolConfigs` object:

```typescript
// In AmigaDesktop.vue, find toolConfigs and add:
const toolConfigs = {
  // ... existing configs ...
  'My New App': {
    title: 'My New App',
    width: 600,
    height: 450,
    component: AmigaMyNewApp,
    baseX: 150,
    baseY: 100
  }
};
```

### Step 4: Add Menu Item

Add your app to the Tools menu:

```typescript
// In AmigaDesktop.vue, find menus.ref and update:
const menus = ref<Menu[]>([
  // ... other menus ...
  {
    name: 'Tools',
    items: [
      // ... existing items ...
      'My New App',
      // ... more items ...
    ]
  }
]);
```

### Step 5: Build and Verify

```bash
cd /home/user/webos/src/client
npm run build
```

Check the build output for your new chunk:
```
dist/assets/AmigaMyNewApp-ABC123.js    X.XX kB │ gzip: Y.YY kB
```

Verify it's under the budget (< 20 KB gzipped for large apps).

## Manual Chunk Configuration

### When to Create Manual Chunks

Create a manual chunk when:
1. Multiple components share a heavy dependency
2. A library is used across many apps (> 3)
3. You want to optimize caching for stable code
4. A chunk would be too large otherwise

### Updating vite.config.ts

```typescript
// src/client/vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Example: Create a chunk for shared charting library
          'charts': [
            './components/visualizations/AmigaLineChart.vue',
            './components/visualizations/AmigaPieChart.vue',
            './components/visualizations/AmigaTreeMap.vue'
          ],

          // Example: Vendor library used by many apps
          'image-processing': [
            'html2canvas'
          ]
        }
      }
    }
  }
});
```

### Chunk Naming Strategy

- **vue-vendor**: Vue framework core
- **ui-core**: Essential UI components (loaded immediately)
- **utils**: Utility managers and helpers
- **vendor-libs**: Third-party libraries
- **visualizations**: Shared chart components
- **[AppName]**: Individual application chunks

## Best Practices

### 1. Keep Initial Bundle Small

**Do:**
- Only import components used immediately
- Lazy load all applications
- Use dynamic imports for large features
- Split vendor libraries

**Don't:**
- Import all components in main.ts
- Load heavy libraries upfront
- Bundle development tools in production

### 2. Optimize Chunk Sizes

**Target Sizes (Gzipped):**
- Small chunks: < 5 KB (utilities, simple apps)
- Medium chunks: 5-10 KB (feature apps)
- Large chunks: 10-20 KB (complex apps like Code Editor)
- Vendor chunks: 20-100 KB (stable third-party code)

**If a chunk is too large:**
1. Split it into smaller chunks
2. Lazy load heavy dependencies
3. Remove unused code
4. Consider code splitting within the component

### 3. Minimize Chunk Duplication

**Use Manual Chunks for:**
- Shared dependencies (used by 3+ components)
- Stable vendor code
- Common utilities

**Example:**
```typescript
// Bad - Each app bundles the same chart library
import Chart from 'heavy-chart-lib';

// Good - Chart library in shared chunk
// vite.config.ts manualChunks: { 'charts': ['heavy-chart-lib'] }
```

### 4. Leverage Browser Caching

**Chunk Stability (from most to least stable):**
1. **vue-vendor** - Changes rarely (framework updates)
2. **vendor-libs** - Changes when dependencies update
3. **ui-core** - Changes with UI improvements
4. **utils** - Changes with new utilities
5. **apps** - Change frequently with features

**Benefit:** Users only re-download changed chunks.

### 5. Use CSS Code Splitting

Vite automatically splits CSS per chunk. Keep styles scoped:

```vue
<!-- Good - Scoped styles -->
<style scoped>
.my-component {
  /* Styles only for this component */
}
</style>

<!-- Avoid - Global styles -->
<style>
.my-component {
  /* Leaks to global scope */
}
</style>
```

### 6. Preload Critical Chunks

For frequently used apps, consider preloading:

```typescript
// Preload likely-next app on hover
const preloadApp = (appName: string) => {
  const config = toolConfigs[appName];
  if (config?.component) {
    // Trigger import without mounting
    config.component;
  }
};
```

**Use sparingly** - only for apps >50% of users open.

## Loading States

### Default Loading Component

All async components use `AmigaLoading.vue` by default:

```typescript
const AmigaMyApp = defineAsyncComponent(() =>
  import('./apps/AmigaMyApp.vue')
);
```

This automatically shows the Amiga-styled loading animation.

### Custom Loading State

For specific loading requirements:

```typescript
const AmigaMyApp = defineAsyncComponent({
  loader: () => import('./apps/AmigaMyApp.vue'),
  loadingComponent: CustomLoadingComponent,
  delay: 200, // Delay before showing loading
  timeout: 10000, // Timeout for loading
  errorComponent: ErrorComponent,
  onError(error, retry, fail, attempts) {
    if (attempts <= 3) {
      retry();
    } else {
      fail();
    }
  }
});
```

### Loading UX Guidelines

1. **Show loading immediately** for apps > 10 KB
2. **Use skeleton screens** for predictable layouts
3. **Provide feedback** during load
4. **Handle errors gracefully** with retry options
5. **Cache loaded apps** to avoid re-loading

## Testing & Verification

### 1. Build and Analyze

```bash
# Build production bundle
cd /home/user/webos/src/client
npm run build

# Check bundle sizes in output
# Open dist/stats.html in browser for visual analysis
open dist/stats.html
```

### 2. Check Bundle Sizes

Look for these in build output:
```
✓ built in 8.68s
dist/assets/AmigaMyNewApp-ABC123.js    X.XX kB │ gzip: Y.YY kB
```

**Verify:**
- Gzipped size under budget (see PERFORMANCE_BUDGET.md)
- No unexpected dependencies included
- CSS split separately

### 3. Test Lazy Loading

```bash
# Start dev server
npm run dev

# Open browser DevTools (Network tab)
# Open your app from menu
# Verify chunk loaded on-demand
```

**Check:**
- ✅ Chunk not loaded on initial page load
- ✅ Chunk loads when app opened
- ✅ Loading state visible during load
- ✅ App renders correctly after load

### 4. Performance Testing

**Lighthouse Audit:**
```bash
# Build and preview
npm run build
npm run preview

# Run Lighthouse (in Chrome DevTools)
# Check Performance score
```

**Target Metrics:**
- Performance: > 90
- First Contentful Paint: < 1.8s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.5s

### 5. Network Throttling

Test on slow connections:
1. Open Chrome DevTools
2. Network tab → Throttling → Slow 3G
3. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
4. Verify acceptable load time

**Target:** < 5s on Slow 3G

## Troubleshooting

### Issue: Chunk Not Loading

**Symptoms:**
- App doesn't open
- Console error: "Failed to fetch dynamically imported module"

**Solutions:**
1. Check import path is correct
2. Verify component file exists
3. Check for TypeScript errors: `npm run type-check`
4. Clear build cache: `rm -rf dist && npm run build`

### Issue: Chunk Too Large

**Symptoms:**
- Build warning: "Chunk larger than 500kb"
- Slow app load time

**Solutions:**
1. Split into smaller components
2. Lazy load heavy dependencies
3. Remove unused imports
4. Check for duplicate dependencies
5. Use manual chunks for shared code

```typescript
// Example: Split large component
// Before - One large component
import { HeavyFeatureA, HeavyFeatureB } from './heavy-lib';

// After - Lazy load features
const FeatureA = defineAsyncComponent(() => import('./FeatureA.vue'));
const FeatureB = defineAsyncComponent(() => import('./FeatureB.vue'));
```

### Issue: Duplicate Code in Chunks

**Symptoms:**
- Build output shows same code in multiple chunks
- Total bundle size larger than expected

**Solutions:**
1. Create manual chunk for shared code
2. Move shared utilities to utils chunk
3. Import from common location

```typescript
// vite.config.ts
manualChunks: {
  'shared-feature': [
    './utils/shared-feature.ts'
  ]
}
```

### Issue: Component Not Found

**Symptoms:**
- TypeScript error: "Cannot find module"
- Build fails

**Solutions:**
1. Check file path and extension
2. Verify component is exported
3. Check tsconfig.json paths
4. Restart TypeScript server

### Issue: Loading State Not Showing

**Symptoms:**
- Blank screen during load
- No visual feedback

**Solutions:**
1. Verify AmigaLoading.vue exists
2. Check component is properly lazy loaded
3. Add explicit loading component
4. Check delay isn't too long

### Issue: CSS Not Split

**Symptoms:**
- All CSS in one file
- Per-component CSS not separate

**Solutions:**
1. Use `<style scoped>` in components
2. Verify build.cssCodeSplit enabled (default in Vite)
3. Check Vite configuration
4. Clear build cache

## Advanced Patterns

### Route-Based Splitting

If implementing routing in the future:

```typescript
// router/index.ts
const routes = [
  {
    path: '/terminal',
    component: () => import('../apps/AmigaTerminal.vue')
  },
  {
    path: '/editor',
    component: () => import('../apps/AmigaCodeEditor.vue')
  }
];
```

### Preloading on Hover

Optimize perceived performance:

```typescript
// Preload on menu item hover
const handleMenuHover = (appName: string) => {
  // Prefetch the chunk
  import(`./apps/${appName}.vue`);
};
```

### Conditional Loading

Load different components based on conditions:

```typescript
const DynamicApp = defineAsyncComponent(() => {
  if (isAdvancedMode) {
    return import('./apps/AmigaAdvancedEditor.vue');
  } else {
    return import('./apps/AmigaSimpleEditor.vue');
  }
});
```

### Error Boundaries

Handle loading errors gracefully:

```vue
<script setup>
import { onErrorCaptured } from 'vue';

onErrorCaptured((error) => {
  if (error.message.includes('Failed to fetch')) {
    // Handle chunk loading error
    console.error('Failed to load app:', error);
    alert('Failed to load application. Please check your connection.');
    return false; // Prevent error propagation
  }
});
</script>
```

## Performance Checklist

### Before Adding New App
- [ ] Component under 50 KB uncompressed
- [ ] Uses shared dependencies from manual chunks
- [ ] No duplicate code with existing apps
- [ ] CSS is scoped to component

### Before Committing
- [ ] Run `npm run build` successfully
- [ ] Check bundle size in output
- [ ] Verify chunk under budget (see PERFORMANCE_BUDGET.md)
- [ ] Test lazy loading in browser
- [ ] No TypeScript errors: `npm run type-check`

### Before Merging PR
- [ ] CI build passes
- [ ] Bundle size check passes
- [ ] No performance regressions
- [ ] Code review approved
- [ ] Documentation updated if needed

### Before Release
- [ ] Full bundle analysis completed
- [ ] All chunks under budget
- [ ] Lighthouse score > 90
- [ ] Tested on slow network
- [ ] No console errors or warnings

## Reference Files

- **BUNDLE_ANALYSIS.md** - Detailed size analysis and comparison
- **PERFORMANCE_BUDGET.md** - Size and performance targets
- **CLAUDE.md** - Overall architecture documentation
- **vite.config.ts** - Build configuration
- **AmigaDesktop.vue** - Main app orchestrator

## Resources

### Internal Tools
- Bundle Analyzer: `dist/stats.html` after build
- Bundle Monitor: Check browser console in dev mode
- CSS Optimizer: Available in dev tools (window.__cssOptimizer)

### External Resources
- [Vite Code Splitting](https://vitejs.dev/guide/features.html#code-splitting)
- [Vue Async Components](https://vuejs.org/guide/components/async.html)
- [Rollup Manual Chunks](https://rollupjs.org/configuration-options/#output-manualchunks)
- [Web.dev Code Splitting](https://web.dev/code-splitting/)

## Summary

**Key Principles:**
1. **Lazy load applications** - Use `defineAsyncComponent()`
2. **Keep initial bundle small** - < 200 KB gzipped
3. **Use manual chunks** for shared code
4. **Monitor bundle sizes** - Check every build
5. **Test performance** - Lighthouse and real devices

**Quick Start for New Apps:**
1. Create component in `components/apps/`
2. Add dynamic import in AmigaDesktop.vue
3. Add to toolConfigs
4. Add to menu
5. Build and verify size

**Remember:** Small, focused chunks that load on-demand keep WebOS fast and responsive for all users.

---

**Last Updated:** 2025-11-08
**Version:** 2.0.0
**Maintainers:** WebOS Engineering Team
