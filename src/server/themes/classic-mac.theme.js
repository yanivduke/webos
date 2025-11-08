/**
 * Classic Macintosh Theme
 * Mac OS Classic (System 6/7) interface from late 1980s - early 1990s
 * Iconic platinum gray with Chicago font
 */

const classicMacTheme = {
  id: 'classic-mac',
  name: 'Classic Macintosh',
  description: 'Mac OS Classic (System 6/7) with platinum gray and Chicago font',

  desktop: {
    backgroundColor: '#cccccc',  // Platinum gray
    backgroundImage: '',
    backgroundRepeat: 'repeat',
    backgroundSize: 'auto',
    backgroundPosition: 'center',
  },

  colors: {
    primary: '#000000',
    secondary: '#0000ff',
    background: '#cccccc',
    surface: '#dddddd',
    text: '#000000',
    textSecondary: '#404040',
    border: '#000000',
    borderLight: '#ffffff',
    borderDark: '#808080',
    accent: '#0000ff',
    success: '#006600',
    warning: '#ff9900',
    error: '#dd0000',
    selection: '#0000ff',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },

  typography: {
    fontFamily: "'Chicago', 'Charcoal', 'Helvetica', sans-serif",
    fontFamilyMono: "'Monaco', 'Courier New', monospace",
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
    borderWidth: '1px',
    borderStyle: 'solid',
    titleBarHeight: '20px',
    titleBarBackground: '#dddddd',
    titleBarTextColor: '#000000',
    contentBackground: '#ffffff',
    shadowEnabled: true,
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowBlur: '6px',
    shadowOffset: '2px 2px',
    borderRadius: '6px',
  },

  button: {
    background: '#dddddd',
    textColor: '#000000',
    borderWidth: '2px',
    borderStyle: 'outset',
    padding: '4px 12px',
    borderRadius: '6px',
    hoverBackground: '#e8e8e8',
    activeBackground: '#c0c0c0',
    disabledBackground: '#cccccc',
    disabledTextColor: '#999999',
  },

  icon: {
    folderColor: '#ffcc00',
    diskColor: '#cccccc',
    fileColor: '#ffffff',
    executableColor: '#66ccff',
    size: {
      small: '32px',
      medium: '48px',
      large: '64px',
    },
  },

  menu: {
    backgroundColor: '#ffffff',
    textColor: '#000000',
    hoverBackground: '#0000ff',
    hoverTextColor: '#ffffff',
    separatorColor: '#cccccc',
    borderColor: '#000000',
  },

  scrollbar: {
    width: '16px',
    trackColor: '#e0e0e0',
    thumbColor: '#cccccc',
    thumbHoverColor: '#bbbbbb',
    buttonColor: '#dddddd',
    arrowColor: '#000000',
  },

  systemBar: {
    height: '20px',
    backgroundColor: '#dddddd',
    textColor: '#000000',
    borderColor: '#808080',
  },

  animations: {
    enabled: false,
    duration: '0s',
    easing: 'linear',
  },
};

module.exports = classicMacTheme;
