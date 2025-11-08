/**
 * Commodore 64 Theme
 * Classic Commodore 64 BASIC interface from 1982
 * Iconic blue screen with light blue text
 */

const commodore64Theme = {
  id: 'commodore64',
  name: 'Commodore 64',
  description: 'Classic Commodore 64 BASIC interface with iconic blue screen and light blue text',

  desktop: {
    backgroundColor: '#3e31a2',  // C64 Blue
    backgroundImage: '',
    backgroundRepeat: 'repeat',
    backgroundSize: 'auto',
    backgroundPosition: 'center',
  },

  colors: {
    primary: '#7869c4',      // Light blue
    secondary: '#bdcc71',    // Light green
    background: '#3e31a2',   // C64 Blue background
    surface: '#5340bf',      // Slightly lighter blue
    text: '#7869c4',         // Light blue text
    textSecondary: '#bdcc71',
    border: '#7869c4',
    borderLight: '#a39ad5',
    borderDark: '#2e2475',
    accent: '#bdcc71',
    success: '#59cb5c',      // Green
    warning: '#e8b649',      // Yellow
    error: '#9f4e44',        // Red
    selection: '#7869c4',
    shadow: 'rgba(0, 0, 0, 0.5)',
  },

  typography: {
    fontFamily: "'Press Start 2P', 'C64 Pro Mono', 'Courier New', monospace",
    fontFamilyMono: "'Press Start 2P', 'C64 Pro Mono', 'Courier New', monospace",
    fontSize: {
      base: '11px',
      small: '9px',
      large: '13px',
      title: '11px',
      menu: '11px',
    },
    fontWeight: {
      normal: '400',
      bold: '700',
    },
    lineHeight: '1.5',
  },

  window: {
    borderWidth: '3px',
    borderStyle: 'solid',
    titleBarHeight: '26px',
    titleBarBackground: '#5340bf',
    titleBarTextColor: '#7869c4',
    contentBackground: '#3e31a2',
    shadowEnabled: false,  // C64 had no shadows
    shadowColor: 'rgba(0, 0, 0, 0)',
    shadowBlur: '0',
    shadowOffset: '0',
    borderRadius: '0',
  },

  button: {
    background: '#5340bf',
    textColor: '#7869c4',
    borderWidth: '2px',
    borderStyle: 'solid',
    padding: '6px 14px',
    borderRadius: '0',
    hoverBackground: '#6450cf',
    activeBackground: '#4330af',
    disabledBackground: '#4a3bb0',
    disabledTextColor: '#5a4bb5',
  },

  icon: {
    folderColor: '#bdcc71',
    diskColor: '#7869c4',
    fileColor: '#a39ad5',
    executableColor: '#59cb5c',
    size: {
      small: '32px',
      medium: '48px',
      large: '64px',
    },
  },

  menu: {
    backgroundColor: '#5340bf',
    textColor: '#7869c4',
    hoverBackground: '#7869c4',
    hoverTextColor: '#3e31a2',
    separatorColor: '#2e2475',
    borderColor: '#7869c4',
  },

  scrollbar: {
    width: '18px',
    trackColor: '#2e2475',
    thumbColor: '#5340bf',
    thumbHoverColor: '#6450cf',
    buttonColor: '#5340bf',
    arrowColor: '#7869c4',
  },

  systemBar: {
    height: '24px',
    backgroundColor: '#5340bf',
    textColor: '#7869c4',
    borderColor: '#7869c4',
  },

  animations: {
    enabled: false,
    duration: '0s',
    easing: 'linear',
  },
};

module.exports = commodore64Theme;
