/**
 * Atari TOS Theme
 * Atari ST TOS (The Operating System) interface from 1985
 * Monochrome or low-color GEM Desktop aesthetic
 */

const atariTOSTheme = {
  id: 'atari-tos',
  name: 'Atari TOS',
  description: 'Atari ST GEM Desktop with clean monochrome-inspired design',

  desktop: {
    backgroundColor: '#ffffff',  // White desktop
    backgroundImage: '',
    backgroundRepeat: 'repeat',
    backgroundSize: 'auto',
    backgroundPosition: 'center',
  },

  colors: {
    primary: '#000000',
    secondary: '#008080',    // Teal accent
    background: '#ffffff',
    surface: '#e0e0e0',
    text: '#000000',
    textSecondary: '#404040',
    border: '#000000',
    borderLight: '#ffffff',
    borderDark: '#000000',
    accent: '#008080',
    success: '#00aa00',
    warning: '#ff8800',
    error: '#cc0000',
    selection: '#000000',
    shadow: 'rgba(0, 0, 0, 0.2)',
  },

  typography: {
    fontFamily: "'Courier New', 'Atari ST 8x16 System Font', monospace",
    fontFamilyMono: "'Courier New', monospace",
    fontSize: {
      base: '12px',
      small: '10px',
      large: '14px',
      title: '12px',
      menu: '12px',
    },
    fontWeight: {
      normal: '400',
      bold: '700',
    },
    lineHeight: '1.4',
  },

  window: {
    borderWidth: '2px',
    borderStyle: 'solid',
    titleBarHeight: '20px',
    titleBarBackground: '#000000',
    titleBarTextColor: '#ffffff',
    contentBackground: '#ffffff',
    shadowEnabled: false,
    shadowColor: 'rgba(0, 0, 0, 0)',
    shadowBlur: '0',
    shadowOffset: '0',
    borderRadius: '0',
  },

  button: {
    background: '#e0e0e0',
    textColor: '#000000',
    borderWidth: '2px',
    borderStyle: 'solid',
    padding: '4px 12px',
    borderRadius: '0',
    hoverBackground: '#d0d0d0',
    activeBackground: '#c0c0c0',
    disabledBackground: '#f0f0f0',
    disabledTextColor: '#a0a0a0',
  },

  icon: {
    folderColor: '#008080',
    diskColor: '#000000',
    fileColor: '#404040',
    executableColor: '#000000',
    size: {
      small: '32px',
      medium: '48px',
      large: '64px',
    },
  },

  menu: {
    backgroundColor: '#ffffff',
    textColor: '#000000',
    hoverBackground: '#000000',
    hoverTextColor: '#ffffff',
    separatorColor: '#000000',
    borderColor: '#000000',
  },

  scrollbar: {
    width: '16px',
    trackColor: '#e0e0e0',
    thumbColor: '#a0a0a0',
    thumbHoverColor: '#909090',
    buttonColor: '#e0e0e0',
    arrowColor: '#000000',
  },

  systemBar: {
    height: '20px',
    backgroundColor: '#e0e0e0',
    textColor: '#000000',
    borderColor: '#000000',
  },

  animations: {
    enabled: false,
    duration: '0s',
    easing: 'linear',
  },
};

module.exports = atariTOSTheme;
