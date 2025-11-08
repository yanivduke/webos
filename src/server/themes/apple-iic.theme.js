/**
 * Apple IIc Theme
 * Apple II series interface from the early 1980s
 * Green phosphor monitor aesthetic with retro charm
 */

const appleIIcTheme = {
  id: 'apple-iic',
  name: 'Apple IIc',
  description: 'Apple II series with classic green phosphor monitor aesthetic',

  desktop: {
    backgroundColor: '#0a0a0a',  // Dark CRT background
    backgroundImage: '',
    backgroundRepeat: 'repeat',
    backgroundSize: 'auto',
    backgroundPosition: 'center',
  },

  colors: {
    primary: '#33ff33',      // Phosphor green
    secondary: '#00cc00',
    background: '#0a0a0a',   // Dark screen
    surface: '#1a1a1a',
    text: '#33ff33',
    textSecondary: '#22dd22',
    border: '#33ff33',
    borderLight: '#55ff55',
    borderDark: '#00aa00',
    accent: '#33ff33',
    success: '#33ff33',
    warning: '#ffff33',
    error: '#ff3333',
    selection: '#00cc00',
    shadow: 'rgba(51, 255, 51, 0.3)',
  },

  typography: {
    fontFamily: "'Press Start 2P', 'Apple II', 'Courier New', monospace",
    fontFamilyMono: "'Press Start 2P', 'Apple II', 'Courier New', monospace",
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
    lineHeight: '1.5',
  },

  window: {
    borderWidth: '2px',
    borderStyle: 'solid',
    titleBarHeight: '24px',
    titleBarBackground: '#1a1a1a',
    titleBarTextColor: '#33ff33',
    contentBackground: '#0a0a0a',
    shadowEnabled: true,
    shadowColor: 'rgba(51, 255, 51, 0.2)',
    shadowBlur: '15px',
    shadowOffset: '0 0',  // Glow effect
    borderRadius: '0',
  },

  button: {
    background: '#1a1a1a',
    textColor: '#33ff33',
    borderWidth: '2px',
    borderStyle: 'solid',
    padding: '5px 13px',
    borderRadius: '0',
    hoverBackground: '#2a2a2a',
    activeBackground: '#0a0a0a',
    disabledBackground: '#151515',
    disabledTextColor: '#116611',
  },

  icon: {
    folderColor: '#33ff33',
    diskColor: '#00cc00',
    fileColor: '#22dd22',
    executableColor: '#55ff55',
    size: {
      small: '32px',
      medium: '48px',
      large: '64px',
    },
  },

  menu: {
    backgroundColor: '#1a1a1a',
    textColor: '#33ff33',
    hoverBackground: '#33ff33',
    hoverTextColor: '#0a0a0a',
    separatorColor: '#00aa00',
    borderColor: '#33ff33',
  },

  scrollbar: {
    width: '16px',
    trackColor: '#0a0a0a',
    thumbColor: '#1a1a1a',
    thumbHoverColor: '#2a2a2a',
    buttonColor: '#1a1a1a',
    arrowColor: '#33ff33',
  },

  systemBar: {
    height: '24px',
    backgroundColor: '#1a1a1a',
    textColor: '#33ff33',
    borderColor: '#33ff33',
  },

  animations: {
    enabled: false,
    duration: '0s',
    easing: 'linear',
  },
};

module.exports = appleIIcTheme;
