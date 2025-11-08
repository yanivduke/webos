# WebOS Roadmap

This roadmap outlines the vision, priorities, and planned features for WebOS. As a community-driven project, this roadmap evolves based on contributor interests and community needs.

## Vision

**To become the definitive platform for experiencing and preserving classic operating system interfaces in the browser.**

WebOS aims to:
- Preserve computing history through pixel-perfect recreations
- Educate new generations about classic OS design patterns
- Provide a playground for retro computing enthusiasts
- Demonstrate that the web platform can faithfully recreate any interface
- Build a community of developers passionate about computing history

---

## Current Status (Phase 1: Foundation)

### ✅ Completed

- **Amiga Workbench 3.1 Implementation**
  - Authentic desktop with draggable/resizable windows
  - File system with disk drives (DF0:, DH0:, RAM:, Trash)
  - Working applications (NotePad, Paint, Calculator, Shell, Clock)
  - WebAssembly SDK (AWML) for native app development
  - Real file operations via REST API
  - System settings and preferences

- **Infrastructure**
  - Vue 3 + TypeScript frontend
  - Express.js backend with file operations
  - Development environment setup
  - Technical documentation (CLAUDE.md)

- **Community Foundation**
  - Contributing guidelines
  - Code of Conduct
  - Retro OS implementation guide
  - Issue templates and PR templates
  - Security policy

---

## Phase 2: Community Growth (Current Focus)

**Timeline**: Q1-Q2 2025
**Focus**: Building community, documentation, and preparing for first alternative OS themes

### High Priority

- [ ] **Documentation & Onboarding**
  - [ ] Add screenshots/GIFs to README
  - [ ] Create video walkthrough of Amiga Workbench
  - [ ] Write "Your First Contribution" tutorial
  - [ ] Document all Amiga components with inline comments
  - [ ] Create architecture diagrams

- [ ] **Community Infrastructure**
  - [ ] Set up GitHub Discussions
  - [ ] Create Discord or Matrix server (optional)
  - [ ] Establish regular community calls or check-ins
  - [ ] Create "good first issue" labels and issues
  - [ ] Welcome bot for new contributors

- [ ] **Amiga Workbench Refinements**
  - [ ] Improve window resize performance
  - [ ] Add keyboard shortcuts (Amiga + W to close, etc.)
  - [ ] Implement window minimize/maximize animations
  - [ ] Add authentic Amiga system sounds (optional toggle)
  - [ ] Improve mobile detection and warning

### Medium Priority

- [ ] **Developer Experience**
  - [ ] Add ESLint and Prettier configurations
  - [ ] Set up Playwright for E2E testing
  - [ ] Create component testing examples
  - [ ] Improve hot reload for faster development
  - [ ] Add error boundaries for better error handling

- [ ] **Accessibility**
  - [ ] Keyboard navigation for all UI elements
  - [ ] Screen reader support where appropriate
  - [ ] Focus indicators
  - [ ] ARIA labels for icon buttons
  - [ ] Alternative text for images

### Lower Priority

- [ ] **Polish**
  - [ ] Add favicon with retro aesthetic
  - [ ] Loading screen while app initializes
  - [ ] Easter eggs (Guru Meditation error screen?)
  - [ ] About dialog with credits
  - [ ] Dark mode option (while preserving retro feel)

---

## Phase 3: First Alternative OS Themes

**Timeline**: Q2-Q3 2025
**Focus**: Implementing 1-2 additional retro OS themes to validate architecture

### Target OS Themes (Community Vote)

We'll prioritize based on:
- Community interest (GitHub reactions, proposals)
- Volunteer availability
- Technical feasibility
- Historical significance

**Top Candidates**:

1. **Windows 95** ⭐
   - High recognition factor
   - Well-documented design
   - Iconic Start menu and taskbar
   - Rich application ecosystem to recreate

2. **Mac OS System 7** ⭐
   - Platinum appearance is beloved
   - Happy Mac boot screen
   - Unique menu bar paradigm
   - Strong nostalgia factor

3. **BeOS** ⭐
   - Underappreciated gem
   - Beautiful yellow tab design
   - Ahead of its time
   - Smaller but passionate fanbase

**Other Strong Candidates**:
- Windows 3.1 (simpler than Win95, good starting point)
- NeXTSTEP (influential design, birthplace of macOS)
- OS/2 Warp (IBM's alternative, technically impressive)

### Success Criteria for Phase 3

- At least one additional OS theme fully implemented
- Architecture supports multiple themes simultaneously
- Theme switching mechanism works smoothly
- Documentation updated with multi-theme examples
- Community contributors active on 2+ OS themes

---

## Phase 4: Platform Maturity

**Timeline**: Q3-Q4 2025
**Focus**: Making WebOS production-ready and expanding features

### Core Features

- [ ] **Multi-Theme Support**
  - [ ] Theme selector on startup or in settings
  - [ ] Ability to run multiple OS themes side-by-side
  - [ ] Shared backend for all themes
  - [ ] Theme-specific settings and preferences

- [ ] **Enhanced File System**
  - [ ] Cloud storage integration (Google Drive, Dropbox)
  - [ ] Import/export files from host OS
  - [ ] Zip/unzip functionality
  - [ ] File search within folders
  - [ ] Drag-and-drop file upload

- [ ] **Application Ecosystem**
  - [ ] AWML app marketplace or gallery
  - [ ] Example AWML apps (games, utilities)
  - [ ] Documentation for AWML app development
  - [ ] Hot-reload for AWML app development
  - [ ] AWML debugger tools

- [ ] **Networking & Sharing**
  - [ ] Share files via URL
  - [ ] Collaborative editing (multiple users)
  - [ ] Real-time sync between browser tabs
  - [ ] WebRTC for peer-to-peer features

### Infrastructure

- [ ] **Deployment & Hosting**
  - [ ] Docker containerization
  - [ ] One-click deployment guides (Vercel, Netlify, Railway)
  - [ ] Production optimization (code splitting, lazy loading)
  - [ ] CDN configuration
  - [ ] Database option for multi-user deployments

- [ ] **Testing & Quality**
  - [ ] 80%+ code coverage
  - [ ] Visual regression testing
  - [ ] Performance benchmarks
  - [ ] Cross-browser automated testing
  - [ ] Load testing for server

- [ ] **Security Hardening**
  - [ ] Authentication system (OAuth, JWT)
  - [ ] Role-based access control
  - [ ] Rate limiting
  - [ ] CSRF protection
  - [ ] Security audit by third party

---

## Phase 5: Advanced Features

**Timeline**: 2026+
**Focus**: Innovative features that go beyond original OS capabilities

### Experimental Features

- [ ] **Retro Gaming**
  - [ ] Game ports to AWML platform
  - [ ] Emulator integration (DOS, Amiga, etc.)
  - [ ] High score sharing
  - [ ] Multiplayer retro games

- [ ] **Time Machine**
  - [ ] Version control for files
  - [ ] Rewind system state
  - [ ] "Wayback" view of desktop at different times

- [ ] **Retro Social**
  - [ ] BBS-style messaging system
  - [ ] IRC client built-in
  - [ ] Retro chat aesthetic
  - [ ] User profiles with favorite OS themes

- [ ] **Education Mode**
  - [ ] Guided tours of each OS
  - [ ] Historical context and facts
  - [ ] "How it worked" technical explanations
  - [ ] Interactive OS history timeline

- [ ] **VR/AR Support**
  - [ ] 3D desktop environments
  - [ ] Spatially arranged windows
  - [ ] Retro computing museum experience
  - [ ] Multi-monitor setup in VR

---

## OS Theme Wishlist

Community-requested OS themes to consider:

### High Interest
- Windows 95 / 98 / ME
- Mac OS System 7 / 8 / 9
- BeOS R5
- NeXTSTEP 3.3
- Windows 3.1 / 3.11

### Medium Interest
- OS/2 Warp 3 / 4
- Classic Mac OS X (Aqua)
- Atari TOS
- RISC OS
- GEM Desktop

### Low Interest (but cool!)
- Classic Linux DEs (FVWM, Window Maker, Enlightenment, early KDE/GNOME)
- Sun Solaris CDE
- SGI IRIX
- IBM AIX
- HP-UX Vue
- Plan 9 rio

---

## How to Influence the Roadmap

This roadmap is community-driven! You can influence priorities by:

1. **Proposing OS Themes**: Open a [Retro OS Proposal](../../issues/new?template=retro_os_proposal.md)
2. **Voting**: React with 👍 to issues/proposals you want to see
3. **Contributing**: Work on features you care about
4. **Discussing**: Join GitHub Discussions to share ideas
5. **Documenting**: Write about what you'd like to see

---

## Success Metrics

We'll measure success by:

- **Community Growth**
  - GitHub stars, forks, contributors
  - Active discussions and issues
  - Diversity of contributors (geography, experience level)

- **Technical Quality**
  - Code coverage, performance benchmarks
  - Browser compatibility
  - Accessibility compliance

- **Historical Accuracy**
  - Authenticity of OS recreations
  - Positive feedback from retro computing community
  - Recognition from original OS developers/community

- **Impact**
  - Educational usage (schools, museums)
  - Media coverage and blog posts
  - Inspired projects and derivatives
  - Preservation of computing history

---

## Get Involved

Want to help with roadmap items?

- Check [open issues](../../issues) for tasks
- Comment on roadmap items you'd like to work on
- Propose new features in [Discussions](../../discussions)
- See [CONTRIBUTING.md](CONTRIBUTING.md) for how to contribute

---

**Last Updated**: January 2025

This roadmap is a living document and will be updated quarterly based on community progress and feedback.
