/**
 * Apple Lisa Theme
 * Apple Lisa Office System interface from 1983
 * First commercial GUI with desktop metaphor
 */

const appleLisaTheme = {
  id: 'apple-lisa',
  name: 'Apple Lisa',
  description: 'Apple Lisa Office System - pioneering GUI with desktop metaphor',

  desktop: {
    backgroundColor: '#f0f0f0',  // Light gray
    backgroundImage: '',
    backgroundRepeat: 'repeat',
    backgroundSize: 'auto',
    backgroundPosition: 'center',
  },

  colors: {
    primary: '#000000',
    secondary: '#666666',
    background: '#f0f0f0',
    surface: '#ffffff',
    text: '#000000',
    textSecondary: '#404040',
    border: '#000000',
    borderLight: '#ffffff',
    borderDark: '#808080',
    accent: '#000000',
    success: '#008000',
    warning: '#ff8000',
    error: '#c00000',
    selection: '#000000',
    shadow: 'rgba(0, 0, 0, 0.25)',
  },

  typography: {
    fontFamily: "'Chicago', 'Geneva', 'Helvetica', sans-serif",
    fontFamilyMono: "'Monaco', 'Courier New', monospace",
    fontSize: {
      base: '13px',
      small: '11px',
      large: '15px',
      title: '13px',
      menu: '13px',
    },
    fontWeight: {
      normal: '400',
      bold: '700',
    },
    lineHeight: '1.3',
  },

  window: {
    borderWidth: '1px',
    borderStyle: 'solid',
    titleBarHeight: '22px',
    titleBarBackground: '#ffffff',
    titleBarTextColor: '#000000',
    contentBackground: '#ffffff',
    shadowEnabled: true,
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowBlur: '8px',
    shadowOffset: '2px 2px',
    borderRadius: '4px',  // Slightly rounded
  },

  button: {
    background: '#ffffff',
    textColor: '#000000',
    borderWidth: '2px',
    borderStyle: 'solid',
    padding: '5px 14px',
    borderRadius: '8px',  // Rounded buttons
    hoverBackground: '#f8f8f8',
    activeBackground: '#e0e0e0',
    disabledBackground: '#f0f0f0',
    disabledTextColor: '#a0a0a0',
  },

  icon: {
    folderColor: '#000000',
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
    separatorColor: '#c0c0c0',
    borderColor: '#000000',
  },

  scrollbar: {
    width: '16px',
    trackColor: '#e0e0e0',
    thumbColor: '#b0b0b0',
    thumbHoverColor: '#a0a0a0',
    buttonColor: '#ffffff',
    arrowColor: '#000000',
  },

  systemBar: {
    height: '22px',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    borderColor: '#000000',
  },

  animations: {
    enabled: false,
    duration: '0s',
    easing: 'linear',
  },
};

module.exports = appleLisaTheme;
