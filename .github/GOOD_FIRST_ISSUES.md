# Good First Issues - Community Bootstrap

This document contains suggested issues to create for new contributors. These are designed to be approachable while still providing meaningful contributions to the project.

## Documentation Issues

### Issue: Add Screenshots to README

**Labels**: `good first issue`, `documentation`, `help wanted`

**Description**:
The README would benefit from screenshots showing the Amiga Workbench interface in action. This helps potential contributors understand what the project looks like before they clone it.

**Tasks**:
- Take screenshots of the Amiga Workbench desktop with multiple windows open
- Take screenshots of built-in applications (NotePad, Paint, Calculator, Shell)
- Add a "Screenshots" section to README.md
- Use markdown image syntax with descriptive alt text
- Consider creating a `/docs/images` folder for organization

**Skills Needed**: Markdown, basic image editing
**Estimated Time**: 1-2 hours

---

### Issue: Create Video Demo for README

**Labels**: `good first issue`, `documentation`, `enhancement`

**Description**:
A short video or animated GIF showing WebOS in action would be a great addition to the README. Show dragging windows, opening applications, and browsing files.

**Tasks**:
- Record a 30-60 second demo of the Amiga Workbench
- Show key features: dragging windows, opening files, using applications
- Convert to GIF or host on YouTube/similar
- Add to README with proper attribution
- Keep file size reasonable (<5MB for GIFs)

**Skills Needed**: Screen recording, video editing
**Estimated Time**: 2-3 hours

---

### Issue: Document Keyboard Shortcuts

**Labels**: `good first issue`, `documentation`, `enhancement`

**Description**:
Document any existing keyboard shortcuts and suggest new ones for common operations.

**Tasks**:
- Test and document existing keyboard shortcuts
- Create a `KEYBOARD_SHORTCUTS.md` file
- Organize by category (Window Management, File Operations, etc.)
- Link from README
- Suggest additional shortcuts that would be useful

**Skills Needed**: Documentation, user experience
**Estimated Time**: 2-3 hours

---

## Research Issues

### Issue: Research Windows 95 Color Palette

**Labels**: `good first issue`, `research`, `retro-os`, `windows95`

**Description**:
To implement a Windows 95 theme, we need exact color values. Research and document the authentic color palette.

**Tasks**:
- Find screenshots of Windows 95
- Extract exact hex color codes for:
  - Window background (#C0C0C0)
  - Title bar colors (active/inactive)
  - Desktop background (#008080)
  - Button colors and borders
  - Menu colors
- Document findings in an issue or create `docs/windows95-colors.md`
- Include screenshots as references

**Skills Needed**: Color extraction tools, research
**Estimated Time**: 2-3 hours

---

### Issue: Research Mac OS System 7 Typography

**Labels**: `good first issue`, `research`, `retro-os`, `macos`

**Description**:
Document the fonts used in Mac OS System 7-9 and find modern equivalents.

**Tasks**:
- Research fonts: Chicago, Geneva, Monaco, Charcoal
- Find web font alternatives or free recreations
- Document font sizes used in different UI elements
- Check licensing for font usage
- Document findings with screenshots

**Skills Needed**: Typography research
**Estimated Time**: 2-3 hours

---

### Issue: Create Retro OS Resource List

**Labels**: `good first issue`, `documentation`, `research`

**Description**:
Compile a comprehensive list of resources for researching retro operating systems.

**Tasks**:
- Create `docs/RETRO_OS_RESOURCES.md`
- List websites: GUI Gallery, Toasty Tech, Archive.org, etc.
- Add YouTube channels with OS history content
- Include emulator resources
- Add communities: Reddit, forums, Discord servers
- Organize by OS or resource type

**Skills Needed**: Research, documentation
**Estimated Time**: 2-3 hours

---

## Enhancement Issues

### Issue: Add Favicon with Retro Aesthetic

**Labels**: `good first issue`, `enhancement`, `design`

**Description**:
Create a favicon that represents the retro computing aesthetic of WebOS.

**Tasks**:
- Design a 16x16 and 32x32 pixel favicon
- Consider using Amiga Workbench disk icon or generic retro computer
- Use authentic color palette
- Create `.ico` file and `.png` variants
- Add to `index.html` and `public/` folder
- Test in multiple browsers

**Skills Needed**: Pixel art, basic design
**Estimated Time**: 1-2 hours

---

### Issue: Add Dark Mode Toggle (Meta)

**Labels**: `good first issue`, `enhancement`

**Description**:
Add ability to toggle between light and dark backgrounds for modern accessibility.

**Tasks**:
- Create a toggle button in the UI
- Store preference in localStorage
- Apply dark background without breaking retro aesthetic
- Maintain authentic window colors
- Test with existing themes

**Skills Needed**: Vue.js, CSS, localStorage
**Estimated Time**: 3-4 hours

---

### Issue: Improve Mobile Responsiveness Warning

**Labels**: `good first issue`, `enhancement`, `ux`

**Description**:
WebOS is desktop-focused but should gracefully handle mobile visitors.

**Tasks**:
- Detect mobile/tablet viewports
- Show a friendly message suggesting desktop experience
- Include screenshots of desktop version
- Add option to proceed anyway
- Style the warning in retro aesthetic

**Skills Needed**: Vue.js, CSS media queries
**Estimated Time**: 2-3 hours

---

## Bug Fixes

### Issue: Fix Window Z-Index When Clicking Content

**Labels**: `good first issue`, `bug`

**Description**:
Currently, clicking window content doesn't bring the window to front. Only clicking the title bar does.

**Tasks**:
- Add `@mousedown` listener to entire window component
- Emit focus event to parent
- Update z-index in parent component
- Test with multiple overlapping windows
- Ensure drag handle still works

**Skills Needed**: Vue.js, event handling
**Estimated Time**: 1-2 hours
**File**: `src/client/components/AmigaWindow.vue`

---

## Testing Issues

### Issue: Create E2E Test Suite with Playwright

**Labels**: `good first issue`, `testing`, `infrastructure`

**Description**:
Set up end-to-end testing to ensure core functionality works.

**Tasks**:
- Install Playwright
- Create `tests/e2e/` folder
- Write tests for:
  - Opening a window
  - Dragging a window
  - Closing a window
  - Opening a folder
  - Creating a file
- Add to CI/CD if applicable
- Document how to run tests

**Skills Needed**: Playwright, testing, Vue.js
**Estimated Time**: 4-6 hours

---

## Feature Issues

### Issue: Add Window Minimize Animation

**Labels**: `good first issue`, `enhancement`, `animation`

**Description**:
Add a simple minimize animation when clicking minimize button (if Amiga had this).

**Tasks**:
- Research if Amiga Workbench had minimize animations
- Implement simple CSS transition
- Window should animate to taskbar/dock position
- Restore animation when clicking to reopen
- Keep it fast (100ms or less) for retro feel

**Skills Needed**: Vue.js, CSS animations
**Estimated Time**: 2-3 hours

---

### Issue: Add Sound Effects Toggle

**Labels**: `good first issue`, `enhancement`, `audio`

**Description**:
Add option to enable/disable retro sound effects.

**Tasks**:
- Research authentic Amiga system sounds
- Find or create sound files (ensure licensing)
- Add toggle in settings
- Store preference in localStorage
- Play sounds on: window open, close, error, etc.
- Keep file sizes small

**Skills Needed**: Vue.js, Web Audio API, sound design
**Estimated Time**: 4-5 hours

---

## How to Create These Issues

For maintainers: When creating these issues on GitHub:

1. Use the templates as a starting point
2. Add appropriate labels: `good first issue`, `help wanted`, etc.
3. Assign difficulty level in description
4. Link to relevant code files
5. Add "How to Get Started" section with file paths
6. Offer to mentor new contributors
7. Thank contributors when issues are completed

## Issue Labels to Create

Suggested labels for the repository:

- `good first issue` - Perfect for newcomers
- `help wanted` - Looking for contributors
- `documentation` - Documentation improvements
- `research` - Research needed
- `retro-os` - Related to OS theme implementation
- `windows95`, `macos`, `beos`, etc. - OS-specific labels
- `bug` - Something isn't working
- `enhancement` - New feature or request
- `design` - Design-related work
- `testing` - Testing infrastructure
- `accessibility` - Accessibility improvements

---

**Note**: These are suggestions. Create issues gradually as the community grows. Too many open issues at once can be overwhelming. Start with 3-5 of the easiest ones.
