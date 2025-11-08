/**
 * Amiga Workbench 3.1 Theme
 * Authentic Commodore Amiga Workbench aesthetic from the early 1990s
 */

const amigaTheme = {
  id: 'amiga',
  name: 'Amiga Workbench 3.1',
  description: 'Classic Commodore Amiga Workbench 3.1 interface with iconic gray and blue aesthetics',

  desktop: {
    backgroundColor: '#a0a0a0',
    backgroundImage: '',  // Solid color
    backgroundRepeat: 'repeat',
    backgroundSize: 'auto',
    backgroundPosition: 'center',
  },

  colors: {
    primary: '#0055aa',
    secondary: '#ffaa00',
    background: '#a0a0a0',
    surface: '#a0a0a0',
    text: '#000000',
    textSecondary: '#000000',
    border: '#888888',
    borderLight: '#ffffff',
    borderDark: '#000000',
    accent: '#0055aa',
    success: '#00aa00',
    warning: '#ffaa00',
    error: '#aa0000',
    selection: '#0055aa',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },

  typography: {
    fontFamily: "'Press Start 2P', 'Courier New', monospace",
    fontFamilyMono: "'Press Start 2P', 'Courier New', monospace",
    fontSize: {
      base: '10px',
      small: '8px',
      large: '12px',
      title: '10px',
      menu: '10px',
    },
    fontWeight: {
      normal: '400',
      bold: '700',
    },
    lineHeight: '1.6',
  },

  window: {
    borderWidth: '2px',
    borderStyle: 'solid',
    titleBarHeight: '24px',
    titleBarBackground: '#a0a0a0',
    titleBarTextColor: '#000000',
    contentBackground: '#ffffff',
    shadowEnabled: true,
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowBlur: '10px',
    shadowOffset: '0 4px',
    borderRadius: '0',
  },

  button: {
    background: '#a0a0a0',
    textColor: '#000000',
    borderWidth: '2px',
    borderStyle: 'solid',
    padding: '4px 12px',
    borderRadius: '0',
    hoverBackground: '#b0b0b0',
    activeBackground: '#888888',
    disabledBackground: '#999999',
    disabledTextColor: '#666666',
  },

  icon: {
    folderColor: '#ffaa00',
    diskColor: '#0055aa',
    fileColor: '#ffffff',
    executableColor: '#00aa00',
    size: {
      small: '32px',
      medium: '48px',
      large: '64px',
    },
  },

  menu: {
    backgroundColor: '#a0a0a0',
    textColor: '#000000',
    hoverBackground: '#0055aa',
    hoverTextColor: '#ffffff',
    separatorColor: '#666666',
    borderColor: '#000000',
  },

  scrollbar: {
    width: '16px',
    trackColor: '#888888',
    thumbColor: '#a0a0a0',
    thumbHoverColor: '#b0b0b0',
    buttonColor: '#a0a0a0',
    arrowColor: '#000000',
  },

  systemBar: {
    height: '24px',
    backgroundColor: '#a0a0a0',
    textColor: '#000000',
    borderColor: '#000000',
  },

  animations: {
    enabled: false,  // Amiga was instant, no smooth transitions
    duration: '0s',
    easing: 'linear',
  },
};

module.exports = amigaTheme;
