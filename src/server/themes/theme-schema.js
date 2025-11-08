/**
 * Theme Schema Definition
 * Defines the structure for WebOS themes
 */

const themeSchema = {
  // Theme metadata
  id: 'string',           // Unique identifier (e.g., 'amiga', 'c64')
  name: 'string',         // Display name (e.g., 'Amiga Workbench 3.1')
  description: 'string',  // Theme description

  // Desktop appearance
  desktop: {
    backgroundColor: 'string',     // Solid color fallback
    backgroundImage: 'string',     // URL to desktop wallpaper/pattern
    backgroundRepeat: 'string',    // 'repeat', 'no-repeat', 'repeat-x', 'repeat-y'
    backgroundSize: 'string',      // 'cover', 'contain', 'auto', or specific size
    backgroundPosition: 'string',  // 'center', 'top left', etc.
  },

  // Color palette
  colors: {
    primary: 'string',       // Primary brand color
    secondary: 'string',     // Secondary color
    background: 'string',    // Main background color
    surface: 'string',       // Surface/panel color
    text: 'string',          // Primary text color
    textSecondary: 'string', // Secondary text color
    border: 'string',        // Border color
    borderLight: 'string',   // Light bevel edge
    borderDark: 'string',    // Dark bevel edge
    accent: 'string',        // Accent color (highlights)
    success: 'string',       // Success state color
    warning: 'string',       // Warning state color
    error: 'string',         // Error state color
    selection: 'string',     // Selection/highlight color
    shadow: 'string',        // Shadow color
  },

  // Typography
  typography: {
    fontFamily: 'string',           // Primary font stack
    fontFamilyMono: 'string',       // Monospace font stack
    fontSize: {
      base: 'string',      // Base font size (e.g., '10px')
      small: 'string',     // Small text
      large: 'string',     // Large text
      title: 'string',     // Window titles
      menu: 'string',      // Menu items
    },
    fontWeight: {
      normal: 'string',
      bold: 'string',
    },
    lineHeight: 'string',
  },

  // Window styling
  window: {
    borderWidth: 'string',           // Window border thickness
    borderStyle: 'string',           // Border style
    titleBarHeight: 'string',        // Title bar height
    titleBarBackground: 'string',    // Title bar color
    titleBarTextColor: 'string',     // Title bar text
    contentBackground: 'string',     // Window content area
    shadowEnabled: 'boolean',        // Enable/disable shadows
    shadowColor: 'string',           // Shadow color
    shadowBlur: 'string',            // Shadow blur radius
    shadowOffset: 'string',          // Shadow offset
    borderRadius: 'string',          // Corner rounding (0 for sharp)
  },

  // Button styling
  button: {
    background: 'string',
    textColor: 'string',
    borderWidth: 'string',
    borderStyle: 'string',
    padding: 'string',
    borderRadius: 'string',
    hoverBackground: 'string',
    activeBackground: 'string',
    disabledBackground: 'string',
    disabledTextColor: 'string',
  },

  // Icon styling
  icon: {
    folderColor: 'string',
    diskColor: 'string',
    fileColor: 'string',
    executableColor: 'string',
    size: {
      small: 'string',
      medium: 'string',
      large: 'string',
    },
  },

  // Menu styling
  menu: {
    backgroundColor: 'string',
    textColor: 'string',
    hoverBackground: 'string',
    hoverTextColor: 'string',
    separatorColor: 'string',
    borderColor: 'string',
  },

  // Scrollbar styling
  scrollbar: {
    width: 'string',
    trackColor: 'string',
    thumbColor: 'string',
    thumbHoverColor: 'string',
    buttonColor: 'string',
    arrowColor: 'string',
  },

  // System info bar (bottom bar)
  systemBar: {
    height: 'string',
    backgroundColor: 'string',
    textColor: 'string',
    borderColor: 'string',
  },

  // Animations
  animations: {
    enabled: 'boolean',
    duration: 'string',  // Transition duration
    easing: 'string',    // Timing function
  },
};

module.exports = themeSchema;
